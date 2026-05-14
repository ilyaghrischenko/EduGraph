using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.Infrastructure.GoogleDrive.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.VectorSearch;
using EduGraph.Infrastructure.VectorSearch.Models;
using EduGraph.SharedKernel.Helpers;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Services;

public sealed class GoogleDriveSyncService(
    GoogleDriveService googleDriveService,
    VectorSearchService vectorSearchService,
    EduGraphContext db,
    TimeProvider timeProvider) : IScopedType
{
    //todo: разбить на под методы для чистоты кода
    public async Task SynchronizeAsync(CancellationToken cancellationToken)
    {
        List<Result<GoogleDriveFolder>> getRootFoldersResult =
            await googleDriveService.GetRootFoldersAsync(cancellationToken);

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
            .ToListAsync(cancellationToken);

        List<UniversityFolder> newUniversityFolders = [];
        
        Result<string> getRootFolderLinkResult = await googleDriveService.GetRootFolderLinkAsync(cancellationToken);

        if (getRootFolderLinkResult.IsSuccess)
        {
            Result<UniversityFolder> createUniversityFolderResult = UniversityFolder.Create(
                googleDriveId: Guid.CreateVersion7().ToString(),
                name: "G7",
                link: getRootFolderLinkResult.Value!,
                isMain: true
            );

            if (createUniversityFolderResult.IsSuccess)
            {
                newUniversityFolders.Add(createUniversityFolderResult.Value!);
            }
        }

        foreach (GoogleDriveFolder googleDriveFolder in googleDriveFolders)
        {
            UniversityFolder? existingFolder =
                existingFolders.FirstOrDefault(folder => folder.GoogleDriveId == googleDriveFolder.Id);

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

        await db.UniversityFolders.AddRangeAsync(newUniversityFolders, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        
        if (folderIds.Count > 0)
        {
            await db.UniversityFolders
                .Where(folder => folder.IsMain == false && !folderIds.Contains(folder.GoogleDriveId))
                .ExecuteDeleteAsync(cancellationToken);
        }

        HashSet<string> syncedIds = [];

        await foreach (List<Result<GoogleDriveDocument>> batchDocumentsResults in googleDriveService
                           .GetDocumentsStreamAsync(cancellationToken))
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
                .ToListAsync(cancellationToken);

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

            await db.UniversityDocuments.AddRangeAsync(newUniversityDocuments, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            db.ChangeTracker.Clear();
        }

        List<string> deletedGoogleDriveIds = await db.UniversityDocuments
            .Where(document => !syncedIds.Contains(document.GoogleDriveId))
            .Select(document => document.GoogleDriveId)
            .ToListAsync(cancellationToken);

        if (deletedGoogleDriveIds.Count > 0)
        {
            VectorDeleteRequest deleteRequest = new()
            {
                DocumentIds = deletedGoogleDriveIds
            };

            await vectorSearchService.DeleteDocumentsAsync(
                deleteRequest,
                cancellationToken
            );

            await db.UniversityDocuments
                .Where(document => deletedGoogleDriveIds.Contains(document.GoogleDriveId))
                .ExecuteDeleteAsync(cancellationToken);
        }

        await IndexChangedDocumentsAsync(cancellationToken);
    }
    
    private async Task IndexChangedDocumentsAsync(CancellationToken cancellationToken)
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
    #pragma warning restore SA1204
}
