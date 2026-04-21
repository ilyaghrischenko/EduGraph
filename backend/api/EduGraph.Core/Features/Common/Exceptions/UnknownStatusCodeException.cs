using System.Net;

namespace EduGraph.Core.Features.Common.Exceptions;

public sealed class UnknownStatusCodeException(HttpStatusCode statusCode)
    : Exception($"unknown status code: {statusCode}");
