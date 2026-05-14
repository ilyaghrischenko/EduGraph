using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.Infrastructure.SQLite.Extensions;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.Teachers;

internal static class Delete
{
    internal sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapDelete("teachers/{id:int}", Handle)
                .RequireAuthorization(AuthorizationPolicies.Admin)
                .WithTags("Teachers")
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

            if (user is null)
            {
                return TypedResults.NotFound($"Викладача з id: {id} не знайдено");
            }

            if (user.Type != UserType.Teacher)
            {
                return TypedResults.NotFound($"Викладача з id: {id} не знайдено");
            }

            IdentityResult deleteTeacherResult = await userManager.DeleteAsync(user);

            if (deleteTeacherResult.Succeeded is false)
            {
                return TypedResults.InternalServerError(deleteTeacherResult.GetErrorMessage());
            }

            return TypedResults.NoContent();
        }
    }
}
