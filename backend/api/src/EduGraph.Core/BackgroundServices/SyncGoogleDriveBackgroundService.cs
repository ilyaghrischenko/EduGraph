using EduGraph.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.BackgroundServices;

public sealed partial class SyncGoogleDriveBackgroundService(
    IServiceProvider serviceProvider,
    GoogleDriveSyncLock syncLock,
    ILogger<SyncGoogleDriveBackgroundService> logger) : BackgroundService
{
    [LoggerMessage(1, LogLevel.Error, "Error while fetching Google Drive documents")]
    private partial void LogGoogleDriveError(Exception ex);

    [LoggerMessage(2, LogLevel.Error, "Error while working with database.")]
    private partial void LogDbError(DbUpdateException ex);

    [LoggerMessage(3, LogLevel.Error, "Unexpected error.")]
    private partial void LogUnexpectedError(Exception ex);

    [LoggerMessage(4, LogLevel.Information, "Google Drive synchronization is already running. Scheduled synchronization skipped.")]
    private partial void LogScheduledSyncSkipped();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var acquired = false;

            try
            {
                acquired = await syncLock.TryAcquireAsync(stoppingToken);

                if (!acquired)
                {
                    LogScheduledSyncSkipped();
                    continue;
                }

                await using AsyncServiceScope scope = serviceProvider.CreateAsyncScope();
                var googleDriveSyncService = scope.ServiceProvider.GetRequiredService<GoogleDriveSyncService>();

                try
                {
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
            }
            catch (Exception ex)
            {
                LogUnexpectedError(ex);
            }
            finally
            {
                if (acquired)
                {
                    syncLock.Release();
                }

                await Task.Delay(TimeSpan.FromHours(4), stoppingToken);
            }
        }
    }
}
