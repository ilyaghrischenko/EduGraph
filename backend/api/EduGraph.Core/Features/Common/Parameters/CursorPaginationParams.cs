using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.Common.Parameters;

public readonly record struct CursorPaginationParams(
    [FromQuery, Range(0, int.MaxValue)] int? LastItemId = null,
    [FromQuery, Range(1, 100)] int PageSize = 30,
    [FromQuery] bool Descending = false
);
