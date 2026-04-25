using EduGraph.Domain.Entities;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.Infrastructure.GoogleDrive.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace EduGraph.Core.BackgroundServices;

public sealed partial class FetchDocumentsBackgroundService(
    IServiceProvider serviceProvider,
    ILogger<FetchDocumentsBackgroundService> logger) : BackgroundService
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

                try
                {
                    HashSet<string> syncedIds = [];
                    
                    await foreach (List<Result<GoogleDriveDocument>> batchDocumentsResults in googleDriveService.GetDocumentsStreamAsync(stoppingToken))
                    {
                        List<string> batchIds = batchDocumentsResults
                            .Where(result => result.IsSuccess)
                            .Select(result => result.Value!.Id)
                            .ToList();
                        
                        syncedIds.UnionWith(batchIds);
                        
                        List<UniversityDocument> existingDocuments = await db.UniversityDocuments
                            .Where(document => batchIds.Contains(document.GoogleDriveId))
                            .ToListAsync(stoppingToken);
                        
                        List<UniversityDocument> newUniversityDocuments = new(batchIds.Count - existingDocuments.Count);
                        
                        foreach (Result<GoogleDriveDocument> documentResult in batchDocumentsResults)
                        {
                            if (documentResult.IsFailure)
                            {
                                continue;
                            }

                            GoogleDriveDocument googleDriveDocument = documentResult.Value!;

                            UniversityDocument? existingDocument = existingDocuments.FirstOrDefault(document => document.GoogleDriveId == googleDriveDocument.Id);

                            UpdateOrInsertDocument(newUniversityDocuments, existingDocument, googleDriveDocument);
                        }
                        
                        await db.UniversityDocuments.AddRangeAsync(newUniversityDocuments, stoppingToken);
                        await db.SaveChangesAsync(stoppingToken);
                        db.ChangeTracker.Clear();
                    }
                    
                    await db.UniversityDocuments
                        .Where(document => !syncedIds.Contains(document.GoogleDriveId))
                        .ExecuteDeleteAsync(stoppingToken);
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
                await Task.Delay(TimeSpan.FromHours(3), stoppingToken);
            }
        }
    }

    private static void UpdateOrInsertDocument(List<UniversityDocument> universityDocuments, UniversityDocument? existingDocument, GoogleDriveDocument googleDriveDocument)
    {
        (string id, string name, string content, string link) = googleDriveDocument;
        
        if (existingDocument is not null)
        {
            existingDocument.Update(name, content, link);
        }
        else
        {
            Result<UniversityDocument> createUniversityDocumentResult = UniversityDocument.Create(
                name,
                content,
                link,
                id
            );

            universityDocuments.Add(createUniversityDocumentResult.Value!);
        }
    }
}
