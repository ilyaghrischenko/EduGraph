namespace EduGraph.Models;

public sealed class AddUserViewModel(SelectedAdditionType type = SelectedAdditionType.Custom)
{
    public SelectedAdditionType AdditionType { get; set; } = type;
}

public enum SelectedAdditionType
{
    Custom,
    Csv
}