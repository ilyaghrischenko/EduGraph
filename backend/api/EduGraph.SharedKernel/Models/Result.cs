using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Net;

namespace EduGraph.SharedKernel.Models;

//todo: обновить/создать заметку про резалт
[DebuggerDisplay("{DebuggerDisplay,nq}")]
public readonly record struct Result
{
    private string DebuggerDisplay =>
        IsSuccess
        ? "Success"
        : $"Failure: {ErrorDetails!.ErrorMessage} StatusCode: {ErrorDetails!.StatusCode}";
    
    private readonly bool _isInitialized;
    
    [MemberNotNullWhen(false, nameof(ErrorDetails))]
    public bool IsSuccess => _isInitialized && ErrorDetails == null;
    public bool IsFailure => !IsSuccess;
    
    public ErrorDetails? ErrorDetails { get; }

    private Result(string errorMessage, HttpStatusCode statusCode)
    {
        ErrorDetails = new ErrorDetails(errorMessage, statusCode);
        _isInitialized = true;
    }

    private Result(ErrorDetails? errorDetails)
    {
        ErrorDetails = errorDetails;
        _isInitialized = true;
    }

    public static Result Success()
        => new(null);

    public static Result Failure(string errorMessage, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        => new(errorMessage, statusCode);
    
    public static Result Failure(ErrorDetails errorDetails)
        => new(errorDetails);
    
    public static Result Failure(Result failedResult)
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("Result is success", nameof(failedResult));
        }
        
        return new Result(failedResult.ErrorDetails!);
    }

    public static Result Failure<TValue>(Result<TValue> failedResult)
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("Result is success", nameof(failedResult));
        }
        
        return new Result(failedResult.ErrorDetails!);
    }

    public static Result FromErrorDetails(ErrorDetails errorDetails) 
        => Failure(errorDetails);
    
    public static implicit operator Result(ErrorDetails errorDetails)
        => Failure(errorDetails);
}

[DebuggerDisplay("{DebuggerDisplay,nq}")]
[SuppressMessage("Design", "CA1000:Do not declare static members on generic types", Justification = "Factory methods for Result pattern do not share state and require strict encapsulation.")]
public readonly record struct Result<TValue>
{
    private string DebuggerDisplay =>
        IsSuccess
        ? $"Success: {Value}"
        : $"Failure: {ErrorDetails!.ErrorMessage} StatusCode: {ErrorDetails!.StatusCode}";
    
    private readonly bool _isInitialized;

    public TValue? Value { get; }
    public ErrorDetails? ErrorDetails { get; }
    
    [MemberNotNullWhen(false, nameof(ErrorDetails))]
    public bool IsSuccess => _isInitialized && ErrorDetails == null;
    public bool IsFailure => !IsSuccess;
    
    private Result(TValue value)
    {
        Value = value;
        ErrorDetails = null;
        _isInitialized = true;
    }

    private Result(string errorMessage, HttpStatusCode statusCode)
    {
        Value = default;
        ErrorDetails = new ErrorDetails(errorMessage, statusCode);
        _isInitialized = true;
    }

    private Result(ErrorDetails errorDetails)
    {
        Value = default;
        ErrorDetails = errorDetails;
        _isInitialized = true;
    }

    private Result(TValue? value, ErrorDetails? errorDetails = null)
    {
        Value = value;
        ErrorDetails = errorDetails;
        _isInitialized = true;
    }

    public static Result<TValue> Success(TValue value)
        => new(value);

    public static Result<TValue> Failure(string errorMessage, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        => new(errorMessage, statusCode);

    public static Result<TValue> Failure(ErrorDetails errorDetails)
        => new(errorDetails);
    
    public static Result<TValue> Failure<TResult>(Result<TResult> failedResult)
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("Result is success", nameof(failedResult));
        }
        
        return new Result<TValue>(failedResult.ErrorDetails!);
    }

    public static Result<TValue> Failure(Result failedResult)
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("Result is success", nameof(failedResult));
        }
        
        return new Result<TValue>(failedResult.ErrorDetails!);
    }

    public static Result<TValue> Copy<TResult>(Result<TResult> result)
        where TResult : TValue
        => new(result.Value, result.ErrorDetails);

    public static Result<TValue> FromTValue(TValue value) 
        => Success(value);

    public static Result<TValue> FromErrorDetails(ErrorDetails errorDetails) 
        => Failure(errorDetails);

    public Result ToResult() 
        => IsSuccess ? Result.Success() : Result.Failure(this);
    
    public static implicit operator Result<TValue>(TValue value)
        => Success(value);

    public static implicit operator Result<TValue>(ErrorDetails errorDetails)
        => Failure(errorDetails);
    
    public static implicit operator Result(Result<TValue> result)
        => result.IsSuccess
            ? Result.Success()
            : Result.Failure(result);
}
