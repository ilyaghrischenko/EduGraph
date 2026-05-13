namespace EduGraph.Core.Services;

public sealed record GoogleDriveSyncQueueItem(
    DateTimeOffset RequestedAt
);
