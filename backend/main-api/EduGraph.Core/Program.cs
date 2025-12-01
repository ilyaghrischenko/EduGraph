using DotNetEnv;
using EduGraph.Core.Extensions;

EnvExtensions.LoadOrThrow();

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.AddConfiguration();

WebApplication app = builder.Build();

app.UseConfiguration();

app.Run();
