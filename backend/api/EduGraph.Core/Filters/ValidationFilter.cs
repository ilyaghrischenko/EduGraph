using FluentValidation;

namespace EduGraph.Core.Filters;

public sealed class ValidationFilter<TRequest> : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var request = context.Arguments.OfType<TRequest>().FirstOrDefault();
        
        if (request is null)
        {
            return await next(context);
        }

        var validator = context.HttpContext.RequestServices.GetService<IValidator<TRequest>>();

        if (validator is not null)
        {
            var result = await validator.ValidateAsync(request, context.HttpContext.RequestAborted);
            if (!result.IsValid)
            {
                return TypedResults.ValidationProblem(result.ToDictionary());
            }
        }

        return await next(context);
    }
}
