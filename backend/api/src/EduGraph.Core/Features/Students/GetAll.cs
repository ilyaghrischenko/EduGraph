using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Dto;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Features.Common.Extensions;
using EduGraph.Core.Features.Common.Parameters;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Students;

internal static class GetAll
{
    internal sealed record Response(
        int Id,
        string FullName,
        string Type,
        string? Group,
        DateOnly? LastLoginDate
    );

    internal sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("students", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdmin)
                .WithTags("Students")
                .Produces<Pagination<Response>>();
        }

        private static async Task<Ok<Pagination<Response>>> Handle(
            [AsParameters] PaginationParams paginationParams,
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            IQueryable<User> query = db.Users
                .AsNoTracking()
                .Where(user => user.Type == UserType.Student)
                .OrderBy(user => user.Id);

            Pagination<Response> pageDto = await query
                .ToPagedListAsync(
                    paginationParams,
                    user => new Response(
                        user.Id,
                        user.FullName,
                        user.Type.ToString(),
                        user.Group,
                        user.LastLoginDate
                    ),
                    cancellationToken
                );

            return TypedResults.Ok(pageDto);
        }
    }
}
