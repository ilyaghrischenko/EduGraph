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

namespace EduGraph.Core.Features.Admins;

internal static class GetAll
{
    internal sealed record Response(
        int Id,
        string FullName,
        DateOnly? LastLoginDate
    );

    internal sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("admins", Handle)
                .RequireAuthorization(AuthorizationPolicies.SuperAdmin)
                .WithTags("Admins")
                .Produces<Pagination<Response>>();
        }

        private static async Task<Ok<Pagination<Response>>> Handle(
            [AsParameters] PaginationParams paginationParams,
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            IQueryable<User> query = db.Users
                .AsNoTracking()
                .Where(user => user.Type == UserType.Admin)
                .OrderBy(user => user.Id);

            Pagination<Response> pageDto = await query
                .ToPagedListAsync(
                    paginationParams,
                    user => new Response(
                        user.Id,
                        user.FullName,
                        user.LastLoginDate
                    ),
                    cancellationToken
                );

            return TypedResults.Ok(pageDto);
        }
    }
}
