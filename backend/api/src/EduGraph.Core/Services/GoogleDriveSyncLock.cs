using EduGraph.SharedKernel.Interfaces;

namespace EduGraph.Core.Services;

public sealed class GoogleDriveSyncLock : ISingletonType, IDisposable
{
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public async Task<bool> TryAcquireAsync(CancellationToken cancellationToken)
        => await _semaphore.WaitAsync(0, cancellationToken);

    public async Task AcquireAsync(CancellationToken cancellationToken)
        => await _semaphore.WaitAsync(cancellationToken);

    public void Release()
        => _semaphore.Release();

    public void Dispose()
        => _semaphore.Dispose();
}
