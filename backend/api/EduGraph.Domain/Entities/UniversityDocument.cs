using EduGraph.Domain.Entities.Common;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Domain.Entities;

public sealed class UniversityDocument : BaseEntity
{
    public string Name { get; private set; } = null!;

    public string Content { get; private set; } = null!;

    public string Link { get; private set; } = null!;

    public string GoogleDriveId { get; } = null!;

    private UniversityDocument() { }

    private UniversityDocument(string name, string content, string link, string googleDriveId)
    {
        Name = name;
        Content = content;
        Link = link;
        GoogleDriveId = googleDriveId;
    }

    public static Result<UniversityDocument> Create(string name, string content, string link, string googleDriveId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return new ErrorDetails("Назва не може бути пустою");
        }
        
        if (string.IsNullOrWhiteSpace(content))
        {
            return new ErrorDetails("Вміст не може бути пустим");
        }
        
        if (string.IsNullOrWhiteSpace(link))
        {
            return new ErrorDetails("Посилання не може бути пустим");
        }

        if (string.IsNullOrWhiteSpace(googleDriveId))
        {
            return new ErrorDetails("Ідентифікатор Гугл драйву не може бути пустим");
        }

        if (link.Contains(googleDriveId, StringComparison.InvariantCulture) is false)
        {
            return new ErrorDetails("Ідентифікатор Гугл драйву має бути у посиланні на документ");
        }

        return new UniversityDocument(name, content, link, googleDriveId);
    }

    public Result Update(string name, string content, string link)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return new ErrorDetails("Назва не може бути пустою");
        }
        
        if (string.IsNullOrWhiteSpace(content))
        {
            return new ErrorDetails("Вміст не може бути пустим");
        }
        
        if (string.IsNullOrWhiteSpace(link))
        {
            return new ErrorDetails("Посилання не може бути пустим");
        }

        if (link.Contains(GoogleDriveId, StringComparison.InvariantCulture) is false)
        {
            return new ErrorDetails("Ідентифікатор Гугл драйву має бути у посиланні на документ");
        }
        
        Name = name;
        Content = content;
        Link = link;
        
        return Result.Success();
    }
}
