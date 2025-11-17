using DotNetEnv;
using EduGraph.Extensions;
using EduGraph.Features.Identity.SignUpApplication;
using EduGraph.Persistence;

LoadOptions options = new(onlyExactPath: true);
var envKeyValues = EnvExtensions.LoadOrThrow(options);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.AddDbContext();

builder.AddIdentitySlice();
builder.AddSignUpApplicationSlice();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.MapStaticAssets();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();