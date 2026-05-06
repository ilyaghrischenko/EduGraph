using System.Runtime.CompilerServices;
using System.Text;
using DocumentFormat.OpenXml.Packaging;
using EduGraph.Infrastructure.GoogleDrive.Models;
using EduGraph.Infrastructure.GoogleDrive.Options;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Google.Apis.Download;
using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Microsoft.Extensions.Options;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using File = Google.Apis.Drive.v3.Data.File;

namespace EduGraph.Infrastructure.GoogleDrive;

public sealed class GoogleDriveService(
    IOptions<GoogleDriveOptions> options,
    DriveService driveService) : IScopedType
{
    private readonly GoogleDriveOptions _options = options.Value;

#pragma warning disable SA1203
    private const int Limit = 50;
    private const int BatchSize = 50;
#pragma warning restore SA1203

    private static readonly Lazy<SemaphoreSlim> GlobalSemaphore = new(
        () => new SemaphoreSlim(Limit, Limit),
        LazyThreadSafetyMode.ExecutionAndPublication
    );

    private static SemaphoreSlim GetOrCreateSemaphore() => GlobalSemaphore.Value;
    
    public async Task<List<Result<GoogleDriveFolder>>> GetRootFoldersAsync(
        CancellationToken cancellationToken,
        string? folderId = null)
    {
        string targetFolderId = folderId ?? _options.DefaultFolderId;

        if (string.IsNullOrWhiteSpace(targetFolderId))
        {
            return [];
        }

        try
        {
            FilesResource.ListRequest listRequest = driveService.Files.List();

            listRequest.Q = $"'{targetFolderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'";

            listRequest.Fields = "nextPageToken, files(id, name, webViewLink, mimeType)";
            listRequest.PageSize = 1000;

            var folders = new List<Result<GoogleDriveFolder>>();
            string? pageToken = null;

            do
            {
                listRequest.PageToken = pageToken;

                FileList? response = await listRequest.ExecuteAsync(cancellationToken);

                if (response.Files != null)
                {
                    foreach (File folder in response.Files)
                    {
                        folders.Add(new GoogleDriveFolder(
                            Id: folder.Id,
                            Name: folder.Name,
                            Link: folder.WebViewLink
                        ));
                    }
                }

                pageToken = response.NextPageToken;
            }
            while (pageToken != null);

            return folders;
        }
        catch (Exception ex)
        {
            return
            [
                new ErrorDetails($"Error reading folders from Google Drive folder {targetFolderId}: {ex.Message}")
            ];
        }
    }

    public async IAsyncEnumerable<List<Result<GoogleDriveDocument>>> GetDocumentsStreamAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken,
        string? folderId = null)
    {
        string targetFolderId = folderId ?? _options.DefaultFolderId;

        if (string.IsNullOrWhiteSpace(targetFolderId))
        {
            yield break;
        }
        
        List<string> currentBatchFilesIds = new(BatchSize);

        // Очередь папок для обработки. Начинаем с корневой.
        var foldersToProcess = new Queue<string>();
        foldersToProcess.Enqueue(targetFolderId);

        while (foldersToProcess.Count > 0)
        {
            // Берем следующую папку из очереди
            string currentFolderId = foldersToProcess.Dequeue();

            FilesResource.ListRequest listRequest = driveService.Files.List();

            // Теперь мы убрали фильтр по папкам, так как нам нужно их находить
            listRequest.Q = $"'{currentFolderId}' in parents and trashed = false";

            // Запрашиваем ID и MimeType, чтобы отличать файлы от папок
            listRequest.Fields = "nextPageToken, files(id, mimeType)";

            string? pageToken = null;
            do
            {
                listRequest.PageToken = pageToken;
                listRequest.PageSize = 1000;
                
                FileList? response = await listRequest.ExecuteAsync(cancellationToken);

                if (response.Files != null)
                {
                    foreach (File item in response.Files)
                    {
                        if (item.MimeType == "application/vnd.google-apps.folder")
                        {
                            // Нашли подпапку -> добавляем в конец очереди на проверку
                            foldersToProcess.Enqueue(item.Id);
                        }
                        else
                        {
                            // Нашли обычный файл (документ) -> добавляем в список на скачивание
                            currentBatchFilesIds.Add(item.Id);

                            if (currentBatchFilesIds.Count == BatchSize)
                            {
                                // Отправляем все собранные ID в наш параллельный загрузчик
                                yield return await GetBatchFilesFromDriveAsync(currentBatchFilesIds, cancellationToken);
                                
                                currentBatchFilesIds.Clear();
                            }
                        }
                    }
                }

                pageToken = response.NextPageToken;
            }
            while (pageToken != null);
        }
        
        if (currentBatchFilesIds.Count != 0)
        {
            // Отправляем остаток ID
            yield return await GetBatchFilesFromDriveAsync(currentBatchFilesIds, cancellationToken);
                        
            currentBatchFilesIds.Clear();
        }
    }

    private async Task<List<Result<GoogleDriveDocument>>> GetBatchFilesFromDriveAsync(
        IReadOnlyCollection<string> batchFileIds,
        CancellationToken cancellationToken)
    {
        SemaphoreSlim semaphore = GetOrCreateSemaphore();

        IEnumerable<Task<Result<GoogleDriveDocument>>> tasks = batchFileIds.Select(async id =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                return await GetFileFromDriveAsync(id, cancellationToken);
            }
            finally
            {
                semaphore.Release();
            }
        });

        Result<GoogleDriveDocument>[] results = await Task.WhenAll(tasks);
        return results.ToList();
    }

    private async Task<Result<GoogleDriveDocument>> GetFileFromDriveAsync(
        string fileId,
        CancellationToken cancellationToken)
    {
        try
        {
            FilesResource.GetRequest? request = driveService.Files.Get(fileId);
            request.Fields = "id, name, webViewLink, mimeType";
            File? fileMetadata = await request.ExecuteAsync(cancellationToken);

            string content;
            await using (var stream = new MemoryStream())
            {
                if (fileMetadata.MimeType?.StartsWith("application/vnd.google-apps.", StringComparison.InvariantCulture) == true)
                {
                    Result exportResult = await ExportGoogleDoc(fileId, fileMetadata.MimeType, stream, cancellationToken);

                    if (exportResult.IsFailure)
                    {
                        return Result<GoogleDriveDocument>.Failure(exportResult);
                    }
                }
                else
                {
                    IDownloadProgress progress = await request.DownloadAsync(stream, cancellationToken);

                    if (progress.Status == DownloadStatus.Failed)
                    {
                        return new ErrorDetails($"Export failed for file {fileId}: {progress.Exception?.Message ?? "unknown error"}");
                    }
                }

                stream.Position = 0;
                content = ParseContent(stream, fileMetadata);
            }

            if (string.IsNullOrWhiteSpace(content))
            {
                return new ErrorDetails($"Content of file '{fileMetadata.Name}' is empty after parsing.");
            }

            return new GoogleDriveDocument(
                Id: fileMetadata.Id,
                Name: fileMetadata.Name,
                Content: content,
                Link: fileMetadata.WebViewLink
            );
        }
        catch (Exception ex)
        {
            return new ErrorDetails($"Error processing file {fileId}: {ex.Message}");
        }
    }

    private async Task<Result> ExportGoogleDoc(
        string fileId,
        string mimeType,
        Stream outputStream,
        CancellationToken cancellationToken)
    {
        string? exportMimeType = mimeType switch
        {
            "application/vnd.google-apps.document" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.google-apps.spreadsheet" => "text/csv",
            "application/vnd.google-apps.presentation" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            _ => null
        };

        if (exportMimeType is null)
        {
            return new ErrorDetails($"Unsupported Google Workspace MIME type: {mimeType}");
        }

        FilesResource.ExportRequest? exportRequest = driveService.Files.Export(fileId, exportMimeType);
        
        IDownloadProgress progress = await exportRequest.DownloadAsync(outputStream, cancellationToken);

        if (progress.Status == DownloadStatus.Failed)
        {
            return new ErrorDetails($"Export failed for file {fileId}: {progress.Exception?.Message ?? "unknown error"}");
        }

        return Result.Success();
    }

#pragma warning disable SA1204
    private static string ParseContent(Stream stream, File metadata)
#pragma warning restore SA1204
    {
        if (metadata.Name.EndsWith(".docx", StringComparison.OrdinalIgnoreCase)
            || metadata.MimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        {
            return ParseDocx(stream) ?? string.Empty;
        }

        if (metadata.Name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return ParsePdf(stream);
        }

        if (metadata.Name.EndsWith(".txt", StringComparison.OrdinalIgnoreCase)
            || metadata.MimeType == "text/plain"
            || metadata.MimeType == "text/csv")
        {
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
            return reader.ReadToEnd();
        }

        return string.Empty;
    }

#pragma warning disable SA1204
    private static string? ParseDocx(Stream fileStream)
#pragma warning restore SA1204
    {
        try
        {
            using WordprocessingDocument wordDoc = WordprocessingDocument.Open(fileStream, false);
            return wordDoc.MainDocumentPart?.Document.Body?.InnerText;
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static string ParsePdf(Stream fileStream)
    {
        try
        {
            using PdfDocument document = PdfDocument.Open(fileStream);
            var stringBuilder = new StringBuilder();
            foreach (Page page in document.GetPages())
            {
                stringBuilder.Append(page.Text).Append(' ');
            }

            return stringBuilder.ToString();
        }
        catch (Exception)
        {
            return string.Empty; // Если PDF битый (например, отсканированная картинка без OCR), не роняем весь процесс
        }
    }
}
