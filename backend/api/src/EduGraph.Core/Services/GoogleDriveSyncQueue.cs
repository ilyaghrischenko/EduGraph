using System.Threading.Channels;
using EduGraph.SharedKernel.Interfaces;

namespace EduGraph.Core.Services;

public sealed class GoogleDriveSyncQueue : ISingletonType
{
    private readonly Channel<GoogleDriveSyncQueueItem> _channel =
        Channel.CreateBounded<GoogleDriveSyncQueueItem>(
            new BoundedChannelOptions(1)
            {
                FullMode = BoundedChannelFullMode.DropWrite,
                SingleReader = true,
                SingleWriter = false
            }
        );

    private int _hasPendingRequest;

    public bool TryEnqueue(GoogleDriveSyncQueueItem item)
    {
        if (Interlocked.Exchange(ref _hasPendingRequest, 1) == 1)
        {
            return false;
        }
        
        if (_channel.Writer.TryWrite(item))
        {
            return true;
        }

        Interlocked.Exchange(ref _hasPendingRequest, 0);

        return false;
    }

    public async ValueTask<GoogleDriveSyncQueueItem> DequeueAsync(CancellationToken cancellationToken)
        => await _channel.Reader.ReadAsync(cancellationToken);

    public void MarkCompleted()
        => Interlocked.Exchange(ref _hasPendingRequest, 0);
}
