using EduGraph.Domain.Entities.Common;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Domain.Entities;

public sealed class UniversityDocument : BaseEntity
{
    public string Name { get; private set; } = null!;

    public string Content { get; private set; } = null!;

    public string Link { get; private set; } = null!;

    private UniversityDocument() { }

    private UniversityDocument(string name, string content, string link)
    {
        Name = name;
        Content = content;
        Link = link;
    }

    public static Result<UniversityDocument> Create(string name, string content, string link)
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

        return new UniversityDocument(name, content, link);
    }
}
