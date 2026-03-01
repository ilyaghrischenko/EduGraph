using EduGraph.Core.Features.Common;
using EduGraph.Core.Features.Common.Dto;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Features.Common.Parameters;
using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Admins;

public static class GetPendingApplications
{
    public sealed record Response(
        string FullName,
        string UserType,
        string? Group
    );

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("admins/sign-up-applications", Handle)
                .WithTags("Admins");
        }

        private static async Task<Ok<Pagination<Response>>> Handle(
            [AsParameters] PaginationParams paginationParams,
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            var query = db.SignUpApplications
                .AsNoTracking()
                .Where(app => app.Status == SignUpApplicationStatus.Pending)
                .OrderBy(app => app.CreatedAtUtc);
        
            int totalItems = await query.CountAsync(cancellationToken);
            int totalPages = (int)Math.Ceiling(totalItems / (double)paginationParams.PageSize);
        
            List<Response> applications = await query
                .Skip((paginationParams.Page - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .Select(application => new Response(
                    application.FullName,
                    application.Type.ToString(),
                    application.Group
                ))
                .ToListAsync(cancellationToken);
            
            Pagination<Response> dto = new(applications, paginationParams.Page, totalPages);
            
            return TypedResults.Ok(dto);
        }
    }
}
