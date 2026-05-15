using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.Infrastructure.SQLite.Extensions;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.Students;

internal static class Delete
{
    internal sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapDelete("students/{id:int}", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdminOrSuperAdmin)
                .WithTags("Students")
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

            if (user is null || user.Type != UserType.Student)
            {
                return TypedResults.NotFound($"Студента з id: {id} не знайдено");
            }

            IdentityResult deleteStudentResult = await userManager.DeleteAsync(user);

            if (deleteStudentResult.Succeeded is false)
            {
                return TypedResults.InternalServerError(deleteStudentResult.GetErrorMessage());
            }

            return TypedResults.NoContent();
        }
    }
}
