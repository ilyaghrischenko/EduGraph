using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.Infrastructure.GoogleDrive.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.VectorSearch;
using EduGraph.Infrastructure.VectorSearch.Models;
using EduGraph.SharedKernel.Helpers;
using EduGraph.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.BackgroundServices;

public sealed partial class FetchGoogleDriveBackgroundService(
    IServiceProvider serviceProvider,
    TimeProvider timeProvider,
    ILogger<FetchGoogleDriveBackgroundService> logger) : BackgroundService
{
    [LoggerMessage(1, LogLevel.Error, "Error while fetching Google Drive documents")]
    private partial void LogGoogleDriveError(Exception ex);

    [LoggerMessage(2, LogLevel.Error, "Error while working with database.")]
    private partial void LogDbError(DbUpdateException ex);

    [LoggerMessage(3, LogLevel.Error, "Unexpected error.")]
    private partial void LogUnexpectedError(Exception ex);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using AsyncServiceScope scope = serviceProvider.CreateAsyncScope();

                var googleDriveService = scope.ServiceProvider.GetRequiredService<GoogleDriveService>();
                var db = scope.ServiceProvider.GetRequiredService<EduGraphContext>();
                var vectorSearchService = scope.ServiceProvider.GetRequiredService<VectorSearchService>();

                try
                {
                    List<Result<GoogleDriveFolder>> getRootFoldersResult = await googleDriveService.GetRootFoldersAsync(stoppingToken);

                    List<GoogleDriveFolder> googleDriveFolders = getRootFoldersResult
                        .Where(result => result.IsSuccess)
                        .Select(result => result.Value!)
                        .DistinctBy(folder => folder.Id)
                        .ToList();
                    
                    List<string> folderIds = googleDriveFolders
                        .Select(folder => folder.Id)
                        .ToList();
                    
                    List<UniversityFolder> existingFolders = await db.UniversityFolders
                        .Where(folder => folderIds.Contains(folder.GoogleDriveId))
                        .ToListAsync(stoppingToken);
                    
                    List<UniversityFolder> newUniversityFolders = [];
                    
                    foreach (GoogleDriveFolder googleDriveFolder in googleDriveFolders)
                    {
                        UniversityFolder? existingFolder = existingFolders.FirstOrDefault(folder => folder.GoogleDriveId == googleDriveFolder.Id);

                        if (existingFolder is not null)
                        {
                            existingFolder.Update(googleDriveFolder.Id, googleDriveFolder.Name, googleDriveFolder.Link);
                        }
                        else
                        {
                            Result<UniversityFolder> createUniversityFolderResult = UniversityFolder.Create(
                                googleDriveFolder.Id,
                                googleDriveFolder.Name,
                                googleDriveFolder.Link
                            );

                            if (createUniversityFolderResult.IsSuccess)
                            {
                                newUniversityFolders.Add(createUniversityFolderResult.Value!);
                            }
                        }
                    }
                    
                    await db.UniversityFolders.AddRangeAsync(newUniversityFolders, stoppingToken);
                    await db.SaveChangesAsync(stoppingToken);
                    db.ChangeTracker.Clear();
                    
                    HashSet<string> syncedIds = [];
                    
                    await foreach (List<Result<GoogleDriveDocument>> batchDocumentsResults in googleDriveService.GetDocumentsStreamAsync(stoppingToken))
                    {
                        List<GoogleDriveDocument> googleDriveDocuments = batchDocumentsResults
                            .Where(result => result.IsSuccess)
                            .Select(result => result.Value!)
                            .DistinctBy(document => document.Id)
                            .ToList();

                        List<string> batchIds = googleDriveDocuments
                            .Select(document => document.Id)
                            .ToList();
                        
                        syncedIds.UnionWith(batchIds);
                        
                        List<UniversityDocument> existingDocuments = await db.UniversityDocuments
                            .Where(document => batchIds.Contains(document.GoogleDriveId))
                            .ToListAsync(stoppingToken);
                        
                        List<UniversityDocument> newUniversityDocuments = [];
                        
                        foreach (GoogleDriveDocument googleDriveDocument in googleDriveDocuments)
                        {
                            UniversityDocument? existingDocument = existingDocuments
                                .FirstOrDefault(document => document.GoogleDriveId == googleDriveDocument.Id);

                            UpdateOrInsertDocument(
                                newUniversityDocuments,
                                existingDocument,
                                googleDriveDocument
                            );
                        }
                        
                        await db.UniversityDocuments.AddRangeAsync(newUniversityDocuments, stoppingToken);
                        await db.SaveChangesAsync(stoppingToken);
                        db.ChangeTracker.Clear();
                    }
                    
                    List<string> deletedGoogleDriveIds = await db.UniversityDocuments
                        .Where(document => !syncedIds.Contains(document.GoogleDriveId))
                        .Select(document => document.GoogleDriveId)
                        .ToListAsync(stoppingToken);

                    if (deletedGoogleDriveIds.Count > 0)
                    {
                        VectorDeleteRequest deleteRequest = new()
                        {
                            DocumentIds = deletedGoogleDriveIds
                        };

                        await vectorSearchService.DeleteDocumentsAsync(
                            deleteRequest,
                            stoppingToken
                        );

                        await db.UniversityDocuments
                            .Where(document => deletedGoogleDriveIds.Contains(document.GoogleDriveId))
                            .ExecuteDeleteAsync(stoppingToken);
                    }

                    await IndexChangedDocumentsAsync(
                        db,
                        vectorSearchService,
                        stoppingToken
                    );
                }
                catch (DbUpdateException ex)
                {
                    LogDbError(ex);
                }
                catch (Exception ex)
                {
                    LogGoogleDriveError(ex);
                }
            }
            catch (Exception ex)
            {
                LogUnexpectedError(ex);
            }
            finally
            {
                await Task.Delay(TimeSpan.FromHours(4), stoppingToken);
            }
        }
    }
    
    private async Task IndexChangedDocumentsAsync(
        EduGraphContext db,
        VectorSearchService vectorSearchService,
        CancellationToken cancellationToken)
    {
        const int batchSize = 15;

        while (!cancellationToken.IsCancellationRequested)
        {
            List<UniversityDocument> documents = await db.UniversityDocuments
                .Where(document => document.SearchIndexStatus == SearchIndexStatus.NotIndexed)
                .Where(document => !string.IsNullOrWhiteSpace(document.Content))
                .OrderBy(document => document.Id)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (documents.Count == 0)
            {
                return;
            }

            List<VectorDocumentDto> vectorDocuments = documents
                .Select(document => new VectorDocumentDto
                {
                    Id = document.GoogleDriveId,
                    Title = document.Name,
                    Content = document.Content,
                    Url = document.Link,
                    ContentHash = document.ContentHash,
                    FolderName = document.FolderName
                })
                .ToList();

            try
            {
                VectorUpsertRequest upsertRequest = new()
                {
                    Documents = vectorDocuments
                };
                
                await vectorSearchService.UpsertDocumentsAsync(
                    upsertRequest,
                    cancellationToken
                );

                DateTimeOffset now = timeProvider.GetUtcNow();

                foreach (UniversityDocument document in documents)
                {
                    document.MarkAsIndexed(now);
                }

                await db.SaveChangesAsync(cancellationToken);
                db.ChangeTracker.Clear();
            }
            catch (Exception ex)
            {
                foreach (UniversityDocument document in documents)
                {
                    document.IndexFailed(ex.Message);
                }

                await db.SaveChangesAsync(cancellationToken);
                db.ChangeTracker.Clear();

                return;
            }
        }
    }

#pragma warning disable SA1204
    private static void UpdateOrInsertDocument(
        List<UniversityDocument> universityDocuments,
        UniversityDocument? existingDocument,
        GoogleDriveDocument googleDriveDocument)
    {
        string id = googleDriveDocument.Id;
        string name = googleDriveDocument.Name;
        string content = googleDriveDocument.Content;
        string link = googleDriveDocument.Link;
        string? folderName = googleDriveDocument.FolderName;
        string contentHash = HashHelper.ComputeSha256(content);

        if (existingDocument is not null)
        {
            existingDocument.Update(
                name,
                content,
                link,
                contentHash,
                folderName
            );
        }
        else
        {
            Result<UniversityDocument> createUniversityDocumentResult = UniversityDocument.Create(
                name,
                content,
                link,
                id,
                contentHash,
                folderName
            );

            if (createUniversityDocumentResult.IsSuccess)
            {
                universityDocuments.Add(createUniversityDocumentResult.Value!);
            }
        }
    }
}
#pragma warning restore SA1204
