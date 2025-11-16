using EduGraph.Features.Shared;
using EduGraph.Persistence;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Features.Identity.LogIn;

public static class DependencyInjection
{
    public static WebApplicationBuilder AddLogInFeature(this WebApplicationBuilder builder)
    {
        builder.Services.AddScoped<IRequestHandler<LogInRequest, VoidResult>, LogInRequestHandler>();

        return builder;
    }

    public static WebApplicationBuilder AddIdentityCore(this WebApplicationBuilder builder)
    {
        builder.Services.AddIdentity<IdentityUser<int>, IdentityRole<int>>(options => 
        {
            options.SignIn.RequireConfirmedAccount = false;
        })
        .AddEntityFrameworkStores<EduGraphContext>();

        return builder;
    }
}