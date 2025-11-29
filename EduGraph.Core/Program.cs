using DotNetEnv;
using EduGraph.Core.Extensions;

LoadOptions options = new(onlyExactPath: true);
var envKeyValues = EnvExtensions.LoadOrThrow(options);

var builder = WebApplication.CreateBuilder(args);

builder.AddConfiguration();

var app = builder.Build();

app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();

    app.MapGet("/", context =>
    {
        context.Response.Redirect("/swagger/index.html");
        return Task.CompletedTask;
    });
}

app.UseHttpsRedirection();
app.MapStaticAssets();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseResponseCompression();

var apiGroup = app.MapGroup("api");
app.MapEndpoints(apiGroup);

app.Run();
