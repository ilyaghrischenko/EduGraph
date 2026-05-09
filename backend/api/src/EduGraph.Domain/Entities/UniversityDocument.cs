using EduGraph.Domain.Entities.Common;
using EduGraph.Domain.Enums;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Domain.Entities;

//todo: сделать миграцию
public sealed class UniversityDocument : BaseEntity
{
    public string? FolderName { get; private set; }
    
    public string Name { get; private set; } = null!;

    public string Content { get; private set; } = null!;

    public string Link { get; private set; } = null!;

    public string GoogleDriveId { get; } = null!;
    
    public string ContentHash { get; private set; } = null!;

    public SearchIndexStatus SearchIndexStatus { get; private set; } = SearchIndexStatus.NotIndexed;

    public DateTimeOffset? SearchIndexedAt { get; private set; }

    public string? SearchIndexError { get; private set; }

    private UniversityDocument() { }

    private UniversityDocument(string name, string content, string link, string googleDriveId, string contentHash, string? folderName = null)
    {
        FolderName = folderName;
        Name = name;
        Content = content;
        Link = link;
        GoogleDriveId = googleDriveId;
        ContentHash = contentHash;
    }

    public static Result<UniversityDocument> Create(
        string name,
        string content,
        string link,
        string googleDriveId,
        string contentHash,
        string? folderName = null)
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
        
        if (string.IsNullOrWhiteSpace(contentHash))
        {
            return new ErrorDetails("Хеш контенту не може бути пустим");
        }
        
        if (folderName is not null && string.IsNullOrWhiteSpace(folderName))
        {
            return new ErrorDetails("Назва папки не може бути пустою");
        }

        return new UniversityDocument(
            name,
            content,
            link,
            googleDriveId,
            contentHash,
            folderName
        );
    }

    public Result Update(string name, string content, string link, string contentHash, string? folderName = null)
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
        
        if (string.IsNullOrWhiteSpace(contentHash))
        {
            return new ErrorDetails("Хеш контенту не може бути пустим");
        }

        if (folderName is not null && string.IsNullOrWhiteSpace(folderName))
        {
            return new ErrorDetails("Назва папки не може бути пустою");
        }
        
        Name = name;
        Content = content;
        Link = link;
        ContentHash = contentHash;
        FolderName = folderName;
        
        return Result.Success();
    }

    public void MarkAsIndexed(DateTimeOffset indexedAt)
    {
        SearchIndexStatus = SearchIndexStatus.Indexed;
        SearchIndexedAt = indexedAt;
        SearchIndexError = null;
    }

    public void IndexFailed(string errorMessage)
    {
        SearchIndexStatus = SearchIndexStatus.Failed;
        SearchIndexedAt = null;
        SearchIndexError = errorMessage;
    }

    public void MarkAsNotIndexed()
    {
        SearchIndexStatus = SearchIndexStatus.NotIndexed;
        SearchIndexedAt = null;
        SearchIndexError = null;
    }
}
