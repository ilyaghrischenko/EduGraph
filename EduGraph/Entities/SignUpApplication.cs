namespace EduGraph.Entities;

public sealed class SignUpApplication
{
    public int Id { get; set; }
    
    public string FullName { get; set; }
    
    public SignUpApplicationType Type { get; set; }
    
    public string? Group { get; set; }
    
    public string Login { get; set; }
    
    public string PasswordHash { get; set; }

    public SignUpApplicationStatus Status { get; set; } = SignUpApplicationStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SignUpApplication(string fullName, SignUpApplicationType type, string login, string passwordHash, string? group = null)
    {
        FullName = fullName;
        Type = type;
        Login = login;
        PasswordHash = passwordHash;
        Group = group;
    }
}