using EduGraph.Features.Shared;

namespace EduGraph.Features.Identity.SignUpApplication;

public static class DependencyInjection
{
    public static WebApplicationBuilder AddSignUpApplicationFeature(this WebApplicationBuilder builder)
    {
        builder.Services.AddScoped<IRequestHandler<SignUpApplicationRequest, VoidResult>, SignUpApplicationRequestHandler>();

        return builder;
    }
}