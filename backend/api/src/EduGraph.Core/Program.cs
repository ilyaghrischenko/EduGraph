using EduGraph.Core.Extensions;

EnvExtensions.LoadOrThrow();

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.AddConfiguration();

WebApplication app = builder.Build();

await app.UseConfigurationAsync(app.Lifetime.ApplicationStopping);

// await using var scope = app.Services.CreateAsyncScope();
// var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
// var db = scope.ServiceProvider.GetRequiredService<EduGraphContext>();
// var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
//
// string passwordHash = passwordHasher.HashPassword(null!, "Admin1234567!");
// var user = User.Create(
//     "admin",
//     "Грищенко Ілля Володимирович",
//     UserType.Teacher,
//     passwordHash
// ).Value!;
// await userManager.CreateAsync(user);
// await userManager.AddToRoleAsync(user, nameof(UserType.Teacher));
// await db.SaveChangesAsync();

await app.RunAsync();
