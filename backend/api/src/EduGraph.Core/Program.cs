using EduGraph.Core.Extensions;
using EduGraph.Core.Seeding;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using Microsoft.AspNetCore.Identity;

EnvExtensions.LoadOrThrow();

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.AddConfiguration();

WebApplication app = builder.Build();

await app.UseConfigurationAsync(app.Lifetime.ApplicationStopping);

// await app.SeedTeacherAndAdminAsync();

await app.RunAsync();
