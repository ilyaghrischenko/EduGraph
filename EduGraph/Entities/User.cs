using Microsoft.AspNetCore.Identity;

namespace EduGraph.Entities;

public sealed class User : IdentityUser<int>
{
    public string FullName { get; set; }
    
    public UserType Type { get; set; }
    
    public string? Group { get; set; }
    
    public DateOnly? LastLoginDate { get; set; }

    public User(string userName, string fullName, UserType type, string? group = null) : base(userName)
    {
        FullName = fullName;
        Type = type;
        Group = group;
    }
    
    public void MarkAsLoggedIn()
        => LastLoginDate = DateOnly.FromDateTime(DateTime.UtcNow);
}