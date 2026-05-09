using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Factories;

public static class ProblemDetailsFactory
{
    public static ProblemDetails NotFound(string errorMessage)
        => new()
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Not found",
            Detail = errorMessage
        };

    public static ProblemDetails BadRequest(string errorMessage)
        => new()
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Bad Request",
            Detail = errorMessage
        };

    public static ProblemDetails Conflict(string errorMessage)
        => new()
        {
            Status = StatusCodes.Status409Conflict,
            Title = "Conflict",
            Detail = errorMessage
        };
    
    public static ProblemDetails InternalServerError(string errorMessage)
        => new()
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Internal Server Error",
            Detail = errorMessage
        };
    
    public static ProblemDetails Forbidden(string errorMessage)
        => new()
        {
            Status = StatusCodes.Status403Forbidden,
            Title = "Forbidden",
            Detail = errorMessage
        };
}
