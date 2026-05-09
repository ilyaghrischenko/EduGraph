using EduGraph.Domain.Entities.Common;
using EduGraph.Domain.Enums;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Domain.Entities;

public sealed class SignUpApplication : BaseEntity
{
    public string FullName { get; private set; }
    
    public UserType Type { get; private set; }
    
    public string? Group { get; private set; }
    
    public string Login { get; private set; }
    
    public string PasswordHash { get; private set; }

    public SignUpApplicationStatus Status { get; private set; } = SignUpApplicationStatus.Pending;
    
    private SignUpApplication()
    {
        FullName = null!;
        Login = null!;
        PasswordHash = null!;
    }

    private SignUpApplication(string fullName, UserType type, string login, string passwordHash, string? group = null)
    {
        FullName = fullName;
        Type = type;
        Login = login;
        PasswordHash = passwordHash;
        Group = group;
    }

    public static Result<SignUpApplication> Create(string fullName, UserType type, string login, string passwordHash, string? group = null)
    {
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

        if (string.IsNullOrWhiteSpace(login))
        {
            return new ErrorDetails("Логін обоʼязковий");
        }

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            return new ErrorDetails("Пароль обовʼязковий");
        }

        if (group is not null && string.IsNullOrWhiteSpace(group))
        {
            return new ErrorDetails("Група вказана не вірно");
        }

        return new SignUpApplication(
            fullName,
            type,
            login,
            passwordHash,
            group
        );
    }

    public Result Approve()
    {
        if (Status != SignUpApplicationStatus.Pending)
        {
            return new ErrorDetails("Application is not pending");
        }
        
        Status = SignUpApplicationStatus.Approved;
        return Result.Success();
    }

    public Result Reject()
    {
        if (Status != SignUpApplicationStatus.Pending)
        {
            return new ErrorDetails("Application is not pending");
        }
        
        Status = SignUpApplicationStatus.Rejected;
        return Result.Success();
    }
}
