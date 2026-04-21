using System.Linq.Expressions;
using EduGraph.Core.Features.Common.Dto;
using EduGraph.Core.Features.Common.Parameters;
using EduGraph.Domain.Entities.Common;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Common.Extensions;

public static class QueryableExtensions
{
    public static async Task<Pagination<TDto>> ToPagedListAsync<TSource, TDto>(
        this IQueryable<TSource> source,
        PaginationParams paginationParams,
        Expression<Func<TSource, TDto>> selector,
        CancellationToken cancellationToken)
        where TSource : BaseEntity
    {
        int totalItems = await source.CountAsync(cancellationToken);

        if (totalItems == 0)
        {
            return Pagination<TDto>.Empty(paginationParams.Page);
        }
        
        var totalPages = (int)Math.Ceiling(totalItems / (double)paginationParams.PageSize);
        
        var items = await source
            .Skip((paginationParams.Page - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .Select(selector)
            .ToListAsync(cancellationToken);
        
        return new Pagination<TDto>(items, paginationParams.Page, totalPages);
    }

    public static async Task<CursorPagination<TDto>> ToCursorPagedListAsync<TSource, TDto>(
        this IQueryable<TSource> source,
        CursorPaginationParams paginationParams,
        Expression<Func<TSource, TDto>> selector,
        CancellationToken cancellationToken)
        where TSource : BaseEntity
        where TDto : BaseDto
    {
        var query = source;
        
        if (paginationParams.LastItemId != null)
        {
            query = query.Where(entity => entity.Id > paginationParams.LastItemId);
        }

        var items = await query
            .OrderBy(entity => entity.Id)
            .Take(paginationParams.PageSize)
            .Select(selector)
            .ToListAsync(cancellationToken);

        if (items.Count == 0)
        {
            return CursorPagination<TDto>.Empty;
        }

        return new CursorPagination<TDto>(items, items.Last().Id);
    }
}
