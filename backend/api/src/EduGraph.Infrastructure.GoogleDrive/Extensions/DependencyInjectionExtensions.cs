using EduGraph.Infrastructure.GoogleDrive.Options;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Microsoft.Extensions.DependencyInjection;

namespace EduGraph.Infrastructure.GoogleDrive.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddGoogleDrive(
        this IServiceCollection services,
        int maxConcurrentRequests,
        string pathToAccountCredentials,
        string defaultFolderId)
    {
        services.Configure<GoogleDriveOptions>(options =>
        {
            options.MaxConcurrentRequests = maxConcurrentRequests;
            options.PathToAccountCredentials = pathToAccountCredentials;
            options.DefaultFolderId = defaultFolderId;
        });

        services.AddSingleton(_ =>
        {
            using var stream = new FileStream(pathToAccountCredentials, FileMode.Open, FileAccess.Read);
            GoogleCredential? credential = CredentialFactory.FromStream<ServiceAccountCredential>(stream)
                .ToGoogleCredential()
                .CreateScoped(DriveService.Scope.DriveReadonly);

            return new DriveService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "EduGraph"
            });
        });

        return services;
    }
}
