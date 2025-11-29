using EduGraph.Core.Features.Common;
using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Domain.Models;
using EduGraph.Infrastructure.SQLite;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Admins;

public static class GetPendingApplications
{
    public sealed record Response(
        IReadOnlyCollection<SignUpApplication> Applications,
        int CurrentPage,
        int TotalPages);

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("admins/sign-up-applications", Handle)
                .WithTags("Admins");
        }

        private static async Task<Ok<Response>> Handle(
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            Result<Response> getPendingApplicationsResult = await handler.HandleAsync(page, pageSize, cancellationToken);
            
            return TypedResults.Ok(getPendingApplicationsResult.Value);
        }
    }

    public sealed class Handler(EduGraphContext context)
    {
        public async Task<Result<Response>> HandleAsync(int page, int pageSize, CancellationToken cancellationToken)
        {
            if (page < 1)
            {
                page = 1;
            }

            var query = context.SignUpApplications
                .AsNoTracking()
                .Where(app => app.Status == SignUpApplicationStatus.Pending)
                .OrderBy(app => app.CreatedAt);
        
            int totalItems = await query.CountAsync(cancellationToken);
            int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        
            List<SignUpApplication> applications = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
            
            return Result<Response>.Success(new Response(applications, page, totalPages));
        }
    }
}
