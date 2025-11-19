namespace EduGraph.Models;

public sealed class SignUpApplicationsViewModel
{
    public List<EduGraph.Entities.SignUpApplication> Applications { get; set; } = [];
    public int CurrentPage { get; set; } = 1;
    public int TotalPages { get; set; } = 1;
    
    public bool IsDescending { get; set; }
    
    public bool HasPreviousPage => CurrentPage > 1;
    public bool HasNextPage => CurrentPage < TotalPages;
}