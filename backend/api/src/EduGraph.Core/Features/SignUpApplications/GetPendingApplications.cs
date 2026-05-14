using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Dto;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Features.Common.Extensions;
using EduGraph.Core.Features.Common.Parameters;
using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.SignUpApplications;

public static class GetPendingApplications
{
    public readonly record struct Params(
        [FromQuery] SignUpApplicationStatus Status = SignUpApplicationStatus.Pending,
        [FromQuery] bool Descending = false
    );
    
    public sealed record Response(
        int Id,
        string FullName,
        string UserType,
        string? Group
    );

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("sign-up-applications", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdminOrSuperAdmin)
                .WithTags("SignUpApplications");
        }

        private static async Task<Ok<Pagination<Response>>> Handle(
            [AsParameters] PaginationParams paginationParams,
            [AsParameters] Params parameters,
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            IQueryable<SignUpApplication> query = db.SignUpApplications
                .AsNoTracking()
                .Where(app => app.Status == parameters.Status);

            if (parameters.Descending)
            {
                query = query.OrderByDescending(app => app.CreatedAtUtc);
            }
            else
            {
                query = query.OrderBy(app => app.CreatedAtUtc);
            }
            
            Pagination<Response> pageDto = await query
                .ToPagedListAsync(
                    paginationParams,
                    application => new Response(
                        application.Id,
                        application.FullName,
                        application.Type.ToString(),
                        application.Group
                    ),
                    cancellationToken
                );
            
            return TypedResults.Ok(pageDto);
        }
    }
}
