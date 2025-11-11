using EduGraph.Features.Identity.LogIn;

namespace EduGraph.Extensions;

public static class WebApplicationBuilderExtensions
{
    public static void AddIdentitySlice(this WebApplicationBuilder builder)
    {
        builder.AddLogInFeature();
        builder.AddIdentityCore();
    }
}