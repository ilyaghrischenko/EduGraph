using System.Diagnostics;
using System.Net;

namespace EduGraph.Domain.Models;

[DebuggerDisplay("{DebuggerDisplay,nq}")]
public sealed class Result<TValue>
{
    private string DebuggerDisplay =>
        IsSuccess
        ? $"Success: {Value}"
        : $"Failure: {ErrorMessage} StatusCode: {StatusCode}";
    
    public TValue? Value { get; }
    public string? ErrorMessage { get; }
    public bool IsSuccess => ErrorMessage == null;
    public bool IsFailure => !IsSuccess;
    public HttpStatusCode StatusCode { get; }

    private Result(TValue value, HttpStatusCode statusCode)
    {
        Value = value;
        ErrorMessage = null;
        StatusCode = statusCode;
    }

    private Result(string errorMessage, HttpStatusCode statusCode)
    {
        Value = default;
        ErrorMessage = errorMessage;
        StatusCode = statusCode;
    }

#pragma warning disable CA1000
    public static Result<TValue> Success(TValue value, HttpStatusCode statusCode = HttpStatusCode.OK)
#pragma warning restore CA1000
        => new(value, statusCode);

#pragma warning disable CA1000
    public static Result<TValue> Failure(string errorMessage, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
#pragma warning restore CA1000
        => new(errorMessage, statusCode);
    
#pragma warning disable CA1000
    public static Result<TValue> Failure<TResult>(Result<TResult> failedResult)
#pragma warning restore CA1000
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("Result is success", nameof(failedResult));
        }
        
        return new Result<TValue>(failedResult.ErrorMessage!, failedResult.StatusCode);
    }

#pragma warning disable CA1000
    public static Result<TValue> Failure(VoidResult failedResult)
#pragma warning restore CA1000
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("Result is success", nameof(failedResult));
        }
        
        return new Result<TValue>(failedResult.ErrorMessage!, failedResult.StatusCode);
    }
}
