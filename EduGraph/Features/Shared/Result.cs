using System.Diagnostics;
using System.Net;

namespace EduGraph.Features.Shared;

[DebuggerDisplay("{DebuggerDisplay,nq}")]
public sealed class Result<TValue>
{
    private string DebuggerDisplay =>
        IsSuccess
        ? $"Success: {Value}"
        : $"Failure: {ErrorMessage} StatusCode: {StatusCode}";
    
    public TValue? Value { get; }
    public string? ErrorMessage { get; }
    public string ModelStateKey { get; } = string.Empty;
    public bool IsSuccess => ErrorMessage == null;
    public bool IsFailure => !IsSuccess;
    public HttpStatusCode StatusCode { get; }

    private Result(TValue value, HttpStatusCode statusCode)
    {
        Value = value;
        ErrorMessage = null;
        StatusCode = statusCode;
    }

    private Result(string errorMessage, HttpStatusCode statusCode, string modelStateKey = "")
    {
        Value = default;
        ErrorMessage = errorMessage;
        StatusCode = statusCode;
        ModelStateKey = modelStateKey;
    }

    public static Result<TValue> Success(TValue value, HttpStatusCode statusCode = HttpStatusCode.OK)
        => new(value, statusCode);

    public static Result<TValue> Failure(string errorMessage, string modelStateKey = "", HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        => new(errorMessage, statusCode, modelStateKey);
    
    public static Result<TValue> Failure<TResult>(Result<TResult> failedResult)
    {
        if (failedResult.IsSuccess) throw new ArgumentException("Result is success", nameof(failedResult));
        return new Result<TValue>(failedResult.ErrorMessage!, failedResult.StatusCode, failedResult.ModelStateKey);
    }

    public static Result<TValue> Failure(VoidResult failedResult)
    {
        if (failedResult.IsSuccess) throw new ArgumentException("Result is success", nameof(failedResult));
        return new Result<TValue>(failedResult.ErrorMessage!, failedResult.StatusCode, failedResult.ModelStateKey);
    }
}