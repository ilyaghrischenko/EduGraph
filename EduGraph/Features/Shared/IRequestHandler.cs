namespace EduGraph.Features.Shared;

public interface IRequestHandler<in TRequest, TResult> where TRequest : IRequest
{
    Task<TResult> HandleAsync(TRequest request, CancellationToken cancellationToken);
}