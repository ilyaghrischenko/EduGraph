namespace EduGraph.Infrastructure.GoogleDrive.Options;

public sealed record GoogleDriveOptions
{
    public required int MaxConcurrentRequests { get; set; }
    public required string PathToAccountCredentials { get; set; }
    public required string DefaultFolderId { get; set; }
}
