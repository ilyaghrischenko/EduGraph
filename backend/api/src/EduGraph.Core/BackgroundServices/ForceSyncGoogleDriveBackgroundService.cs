using EduGraph.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.BackgroundServices;

public sealed partial class ForceSyncGoogleDriveBackgroundService(
    IServiceProvider serviceProvider,
    GoogleDriveSyncQueue queue,
    GoogleDriveSyncLock syncLock,
    ILogger<ForceSyncGoogleDriveBackgroundService> logger) : BackgroundService
{
    [LoggerMessage(1, LogLevel.Information, "Manual Google Drive synchronization requested at {RequestedAt}")]
    private partial void LogManualSyncRequested(DateTimeOffset requestedAt);

    [LoggerMessage(2, LogLevel.Information, "Manual Google Drive synchronization is waiting for the current synchronization to finish.")]
    private partial void LogManualSyncWaiting();

    [LoggerMessage(3, LogLevel.Error, "Error while working with database during manual Google Drive synchronization.")]
    private partial void LogDbError(DbUpdateException ex);

    [LoggerMessage(4, LogLevel.Error, "Error while running manual Google Drive synchronization.")]
    private partial void LogGoogleDriveError(Exception ex);

    [LoggerMessage(5, LogLevel.Error, "Unexpected error in manual Google Drive synchronization background service.")]
    private partial void LogUnexpectedError(Exception ex);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            GoogleDriveSyncQueueItem item;

            try
            {
                item = await queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                LogUnexpectedError(ex);
                continue;
            }

            LogManualSyncRequested(item.RequestedAt);

            bool acquired = false;

            try
            {
                LogManualSyncWaiting();
                
                await syncLock.AcquireAsync(stoppingToken);
                acquired = true;

                await using AsyncServiceScope scope = serviceProvider.CreateAsyncScope();

                var googleDriveSyncService = scope.ServiceProvider.GetRequiredService<GoogleDriveSyncService>();

                await googleDriveSyncService.SynchronizeAsync(stoppingToken);
            }
            catch (DbUpdateException ex)
            {
                LogDbError(ex);
            }
            catch (Exception ex)
            {
                LogGoogleDriveError(ex);
            }
            finally
            {
                if (acquired)
                {
                    syncLock.Release();
                }
                
                queue.MarkCompleted();
            }
        }
    }
}
