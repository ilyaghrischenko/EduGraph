using System.Net;

namespace EduGraph.Core.Features.Common;

public sealed class UnknownStatusCodeException(HttpStatusCode statusCode) : Exception($"unknown status code: {statusCode}")
{
}
