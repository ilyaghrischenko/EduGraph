using EduGraph.Domain.Entities.Common;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Domain.Entities;

public sealed class UniversityFolder : BaseEntity
{
    public string GoogleDriveId { get; private set; } = null!;

    public string Name { get; private set; } = null!;

    public string Link { get; private set; } = null!;

    public bool IsMain { get; private set; }

    private UniversityFolder() { }

    private UniversityFolder(string googleDriveId, string name, string link, bool isMain = false)
    {
        GoogleDriveId = googleDriveId;
        Name = name;
        Link = link;
        IsMain = isMain;
    }

    public static Result<UniversityFolder> Create(string googleDriveId, string name, string link, bool isMain = false)
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
        
        return new UniversityFolder(googleDriveId, name, link, isMain);
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
