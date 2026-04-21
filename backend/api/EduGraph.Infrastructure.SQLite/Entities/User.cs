using EduGraph.Domain.Enums;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Infrastructure.SQLite.Entities;

public sealed class User : IdentityUser<int>
{
    public string FullName { get; private set; }
    
    public UserType Type { get; private set; }
    
    public string? Group { get; private set; }
    
    public DateOnly? LastLoginDate { get; private set; }

    private User()
    {
        FullName = null!;
    }

    private User(string userName, string fullName, UserType type, string? group = null)
        : base(userName)
    {
        FullName = fullName;
        Type = type;
        Group = group;
    }

    public static Result<User> Create(string userName, string fullName, UserType type, string? group = null)
    {
        if (string.IsNullOrWhiteSpace(userName))
        {
            return new ErrorDetails("Імʼя користувача обовʼязкове");
        }
        
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return new ErrorDetails("ПІБ обовʼязкове");
        }

        if (fullName.Split(' ').Length != 3)
        {
            return new ErrorDetails("У ПІБ має бути вказано ваше імʼя, прізвище та по батькові");
        }

        if (!Enum.IsDefined(type))
        {
            return new ErrorDetails("Тип користувача вказаний не вірно");
        }
        
        if (group is not null && string.IsNullOrWhiteSpace(group))
        {
            return new ErrorDetails("Група вказана не вірно");
        }

        return new User(
            userName,
            fullName,
            type,
            group
        );
    }
    
    public void MarkAsLoggedIn()
        => LastLoginDate = DateOnly.FromDateTime(DateTime.UtcNow);
}
