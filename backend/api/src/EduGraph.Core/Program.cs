using EduGraph.Core.Extensions;
using EduGraph.Core.Seeding;

EnvExtensions.LoadOrThrow();

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.AddConfiguration();

WebApplication app = builder.Build();

await app.UseConfigurationAsync(app.Lifetime.ApplicationStopping);

await app.SeedTeacherAndAdminAndSuperAdminIfNotExistAsync();

await app.RunAsync();
