using System.Data.Common;
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

                List<Result<GoogleDriveDocument>> getAllDocumentsResults;
                try
                {
                    getAllDocumentsResults = await googleDriveService.GetDocumentsFromFolderAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    LogGoogleDriveError(ex);
                    await Task.Delay(TimeSpan.FromHours(3), stoppingToken);
                    continue;
                }

                List<UniversityDocument> universityDocuments =
                    new(getAllDocumentsResults.Count(result => result.IsSuccess));
                foreach (Result<GoogleDriveDocument> documentResult in getAllDocumentsResults)
                {
                    if (documentResult.IsFailure)
                    {
                        continue;
                    }

                    GoogleDriveDocument googleDriveDocument = documentResult.Value!;

                    Result<UniversityDocument> createUniversityDocumentResult = UniversityDocument.Create(
                        googleDriveDocument.Name,
                        googleDriveDocument.Content,
                        googleDriveDocument.Link
                    );

                    if (createUniversityDocumentResult.IsFailure)
                    {
                        continue;
                    }

                    universityDocuments.Add(createUniversityDocumentResult.Value!);
                }

                await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(stoppingToken);
                try
                {
                    await db.UniversityDocuments.ExecuteDeleteAsync(stoppingToken);
                    await db.UniversityDocuments.AddRangeAsync(universityDocuments, stoppingToken);

                    await db.SaveChangesAsync(stoppingToken);
                    await transaction.CommitAsync(stoppingToken);
                }
                catch (DbUpdateException ex)
                {
                    LogDbError(ex);
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
}
