// using System.Text;
// using DocumentFormat.OpenXml.Packaging;
// using EduGraph.Infrastructure.GoogleDrive.Models;
// using EduGraph.Infrastructure.GoogleDrive.Options;
// using EduGraph.SharedKernel;
// using EduGraph.SharedKernel.Interfaces;
// using EduGraph.SharedKernel.Models;
// using Google.Apis.Auth.OAuth2;
// using Google.Apis.Drive.v3;
// using Google.Apis.Services;
// using Microsoft.Extensions.Options;
// using UglyToad.PdfPig;
// using UglyToad.PdfPig.Content;
//
// namespace EduGraph.Infrastructure.GoogleDrive;
//
// public sealed class GoogleDriveService(IOptions<GoogleDriveOptions> options) : IScopedType
// {
//     private readonly GoogleDriveOptions _googleDriveOptions = options.Value;
//     
//     //todo: разобраться со всем самому!!!
//     public async Task<Result<GoogleDriveDocument>> GetFileFromDriveAsync(string fileId)
//     {
//         // 1. Авторизация
//         GoogleCredential credential;
//         await using (var stream = new FileStream("service_account_credentials.json", FileMode.Open, FileAccess.Read))
//         {
//             credential = GoogleCredential.FromStream(stream).CreateScoped(DriveService.Scope.DriveReadonly);
//         }
//
//         using var service = new DriveService(new BaseClientService.Initializer
//         {
//             HttpClientInitializer = credential,
//             ApplicationName = "MyAspNetApp"
//         });
//
//         // 2. Получаем метаданные (Имя и Ссылку)
//         var request = service.Files.Get(fileId);
//         request.Fields = "id, name, webViewLink, mimeType"; // Указываем, какие поля нам нужны
//         var fileMetadata = await request.ExecuteAsync();
//
//         var content = string.Empty;
//
//         // 3. Скачиваем содержимое в MemoryStream
//         await using (var stream = new MemoryStream())
//         {
//             // ВАЖНО: Если файл - это нативный Google Doc, его нужно "экспортировать", а не скачивать.
//             // Если это загруженный .docx или .pdf, используем DownloadAsync.
//         
//             await request.DownloadAsync(stream);
//             stream.Position = 0; // Сбрасываем каретку в начало
//
//             // 4. Парсим в зависимости от расширения
//             if (fileMetadata.Name.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
//             {
//                 content = ParseDocx(stream);
//             }
//             else if (fileMetadata.Name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
//             {
//                 content = ParsePdf(stream);
//             }
//         }
//
//         if (string.IsNullOrWhiteSpace(content))
//         {
//             return new ErrorDetails("File content is empty");
//         }
//
//         return new GoogleDriveDocument(
//             Id: fileMetadata.Id,
//             Name: fileMetadata.Name,
//             Content: content,
//             Link: fileMetadata.WebViewLink
//         );
//     }
//     
//     private static string? ParseDocx(Stream fileStream)
//     {
//         using WordprocessingDocument wordDoc = WordprocessingDocument.Open(fileStream, false);
//         
//         var body = wordDoc.MainDocumentPart?.Document.Body;
//         return body?.InnerText; // Простой вариант получения всего текста
//     }
//     
//     private static string ParsePdf(Stream fileStream)
//     {
//         using PdfDocument document = PdfDocument.Open(fileStream);
//         var textBuilder = new StringBuilder();
//         foreach (Page page in document.GetPages())
//         {
//             textBuilder.Append(page.Text);
//             textBuilder.Append(' '); // Добавляем пробел между страницами
//         }
//             
//         return textBuilder.ToString();
//     }
// }
