using System.Diagnostics;
using System.Net;

namespace EduGraph.Features.Shared;

[DebuggerDisplay("{DebuggerDisplay,nq}")]
public sealed class VoidResult
{
    private string DebuggerDisplay =>
        IsSuccess
        ? "Success"
        : $"Failure: {ErrorMessage} StatusCode: {StatusCode}";
    
    public bool IsSuccess => ErrorMessage == null;
    public bool IsFailure => !IsSuccess;
    public string? ErrorMessage { get; }
    public string ModelStateKey { get; } = string.Empty;
    public HttpStatusCode StatusCode { get; }

    private VoidResult(string? errorMessage, HttpStatusCode statusCode, string modelStateKey = "")
    {
        ErrorMessage = errorMessage;
        StatusCode = statusCode;
        ModelStateKey = modelStateKey;
    }

    public static VoidResult Success(HttpStatusCode statusCode = HttpStatusCode.OK)
        => new(null, statusCode, null);

    public static VoidResult Failure(string errorMessage, string modelStateKey = "", HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        => new(errorMessage, statusCode, modelStateKey);
    
    public static VoidResult Failure(VoidResult failedResult)
    {
        if (failedResult.IsSuccess) throw new ArgumentException("Result is success", nameof(failedResult));
        return new VoidResult(failedResult.ErrorMessage!, failedResult.StatusCode, failedResult.ModelStateKey);
    }

    public static VoidResult Failure<TValue>(Result<TValue> failedResult)
    {
        if (failedResult.IsSuccess) throw new ArgumentException("Result is success", nameof(failedResult));
        return new VoidResult(failedResult.ErrorMessage!, failedResult.StatusCode, failedResult.ModelStateKey);
    }
}