using System.Net;
using EduGraph.Core.Factories;
using EduGraph.Core.Features.Common;
using EduGraph.Core.Features.Common.Exceptions;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Extensions;

public static class ResultExtensions
{
    public static IResult ToHttpFailure(this Result failedResult)
        => TypedResults.Problem(failedResult.ToProblemDetails());

    public static IResult ToHttpFailure<TValue>(this Result<TValue> failedResult)
        => TypedResults.Problem(failedResult.ToProblemDetails());
    
    public static ProblemDetails ToProblemDetails(this Result failedResult)
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("result is not failed");
        }

        (string errorMessage, HttpStatusCode statusCode) = failedResult.ErrorDetails!;

        return statusCode switch
        {
            HttpStatusCode.NotFound => ProblemDetailsFactory.NotFound(errorMessage),
            HttpStatusCode.BadRequest => ProblemDetailsFactory.BadRequest(errorMessage),
            HttpStatusCode.Conflict => ProblemDetailsFactory.Conflict(errorMessage),
            HttpStatusCode.Forbidden => ProblemDetailsFactory.Forbidden(errorMessage),
            HttpStatusCode.InternalServerError => ProblemDetailsFactory.InternalServerError(errorMessage),
            _ => throw new UnknownStatusCodeException(statusCode)
        };
    }

    public static ProblemDetails ToProblemDetails<TValue>(this Result<TValue> failedResult)
    {
        if (failedResult.IsSuccess)
        {
            throw new ArgumentException("result is not failed");
        }

        (string errorMessage, HttpStatusCode statusCode) = failedResult.ErrorDetails!;

        return statusCode switch
        {
            HttpStatusCode.NotFound => ProblemDetailsFactory.NotFound(errorMessage),
            HttpStatusCode.BadRequest => ProblemDetailsFactory.BadRequest(errorMessage),
            HttpStatusCode.Conflict => ProblemDetailsFactory.Conflict(errorMessage),
            HttpStatusCode.Forbidden => ProblemDetailsFactory.Forbidden(errorMessage),
            HttpStatusCode.InternalServerError => ProblemDetailsFactory.InternalServerError(errorMessage),
            _ => throw new UnknownStatusCodeException(statusCode)
        };
    }
}
