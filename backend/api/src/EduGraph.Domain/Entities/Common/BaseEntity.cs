namespace EduGraph.Domain.Entities.Common;

public abstract class BaseEntity
{
    public int Id { get; init; }
    
    public DateTime CreatedAtUtc { get; } = DateTime.UtcNow;
}
