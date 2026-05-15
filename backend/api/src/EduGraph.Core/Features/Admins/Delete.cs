using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.Infrastructure.SQLite.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.Admins;

internal static class Delete
{
    internal sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapDelete("admins/{id:int}", Handle)
                .RequireAuthorization(AuthorizationPolicies.SuperAdmin)
                .WithTags("Admins")
                .Produces(StatusCodes.Status204NoContent)
                .ProducesProblem(StatusCodes.Status404NotFound)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [FromRoute] int id,
            [FromServices] UserManager<User> userManager,
            CancellationToken cancellationToken)
        {
#pragma warning disable CA1305
            User? user = await userManager.FindByIdAsync(id.ToString());
#pragma warning restore CA1305

            if (user is null || user.Type != UserType.Admin)
            {
                return TypedResults.NotFound($"Адміністратора з id: {id} не знайдено");
            }

            IdentityResult deleteAdminResult = await userManager.DeleteAsync(user);

            if (deleteAdminResult.Succeeded is false)
            {
                return TypedResults.InternalServerError(deleteAdminResult.GetErrorMessage());
            }

            return TypedResults.NoContent();
        }
    }
}
