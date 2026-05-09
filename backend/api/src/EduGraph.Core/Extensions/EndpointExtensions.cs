using EduGraph.Core.Filters;

namespace EduGraph.Core.Extensions;

public static class EndpointExtensions
{
    public static RouteHandlerBuilder WithRequestValidation<TRequest>(this RouteHandlerBuilder builder)
    {
        return builder.AddEndpointFilter<ValidationFilter<TRequest>>()
            .ProducesValidationProblem();
    }
}
