using System.Net;

namespace EduGraph.SharedKernel.Models;

public sealed record ErrorDetails(string ErrorMessage, HttpStatusCode StatusCode = HttpStatusCode.BadRequest);
