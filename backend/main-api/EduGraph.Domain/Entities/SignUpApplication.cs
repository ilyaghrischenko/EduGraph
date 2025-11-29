using System.ComponentModel.DataAnnotations;
using EduGraph.Domain.Enums;
using EduGraph.Domain.Models;

namespace EduGraph.Domain.Entities;

public sealed class SignUpApplication
{
    public int Id { get; set; }
    
    public string FullName { get; set; }
    
    public UserType Type { get; set; }
    
    public string? Group { get; set; }
    
    public string Login { get; set; }
    
    public string PasswordHash { get; set; }

    public SignUpApplicationStatus Status { get; set; } = SignUpApplicationStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SignUpApplication(string fullName, UserType type, string login, string passwordHash, string? group = null)
    {
        FullName = fullName;
        Type = type;
        Login = login;
        PasswordHash = passwordHash;
        Group = group;
    }

    public VoidResult Approve()
    {
        if (Status != SignUpApplicationStatus.Pending)
        {
            return VoidResult.Failure("Application is not pending");
        }
        
        Status = SignUpApplicationStatus.Approved;
        return VoidResult.Success();
    }

    public VoidResult Reject()
    {
        if (Status != SignUpApplicationStatus.Pending)
        {
            return VoidResult.Failure("Application is not pending");
        }
        
        Status = SignUpApplicationStatus.Rejected;
        return VoidResult.Success();
    }
}
