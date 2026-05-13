using EduGraph.Domain.Entities.Common;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Domain.Entities;

public sealed class UniversityFolder : BaseEntity
{
    public string GoogleDriveId { get; private set; } = null!;

    public string Name { get; private set; } = null!;

    public string Link { get; private set; } = null!;

    private UniversityFolder() { }

    private UniversityFolder(string googleDriveId, string name, string link)
    {
        GoogleDriveId = googleDriveId;
        Name = name;
        Link = link;
    }

    public static Result<UniversityFolder> Create(string googleDriveId, string name, string link)
    {
        if (string.IsNullOrWhiteSpace(googleDriveId))
        {
            return new ErrorDetails($"{nameof(googleDriveId)} не може бути пустим");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return new ErrorDetails($"{nameof(name)} не може бути пустим");
        }

        if (string.IsNullOrWhiteSpace(link))
        {
            return new ErrorDetails($"{nameof(link)} не може бути пустим");
        }
        
        return new UniversityFolder(googleDriveId, name, link);
    }

    public Result Update(string googleDriveId, string name, string link)
    {
        if (string.IsNullOrWhiteSpace(googleDriveId))
        {
            return new ErrorDetails($"{nameof(googleDriveId)} не може бути пустим");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return new ErrorDetails($"{nameof(name)} не може бути пустим");
        }

        if (string.IsNullOrWhiteSpace(link))
        {
            return new ErrorDetails($"{nameof(link)} не може бути пустим");
        }
        
        GoogleDriveId = googleDriveId;
        Name = name;
        Link = link;
        
        return Result.Success();
    }
}
