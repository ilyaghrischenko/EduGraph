using EduGraph.Features.Identity.LogIn;
using EduGraph.Features.Identity.SignUpApplication;

namespace EduGraph.Extensions;

public static class WebApplicationBuilderExtensions
{
    public static void AddIdentitySlice(this WebApplicationBuilder builder)
    {
        builder.AddLogInFeature();
        builder.AddIdentityCore();
    }

    public static void AddSignUpApplicationSlice(this WebApplicationBuilder builder)
    {
        builder.AddSignUpApplicationFeature();
    }
}