using System.Globalization;
using System.Security.Authentication;
using System.Text;
using EduGraph.Core.BackgroundServices;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.OpenApiTransformers;
using EduGraph.Core.Options;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.GoogleDrive.Extensions;
using EduGraph.Infrastructure.VectorSearch.Extensions;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.ServiceDefaults;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EduGraph.Core.Extensions;

public static class WebApplicationBuilderExtensions
{
    public static WebApplicationBuilder AddConfiguration(this WebApplicationBuilder builder)
    {
        builder.AddServiceDefaults();
        
        builder.Services.AddSingleton(TimeProvider.System);

        //todo: написать заметку про это (чтобы в опен апи документации показывало какие ендпоинты требуют авторизации)
        builder.Services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
            options.AddOperationTransformer<AuthorizationOperationTransformer>();
        });
        
        builder.Services.AddEndpointsApiExplorer();
        
        if (builder.Environment.IsDevelopment())
        {
            builder.ValidateDIOnBuild();
        }
        
        builder
            .AddResponseCompression()
            .AddDbContext()
            .AddAspNetCoreIdentity()
            .AddCors()
            .AddFluentValidation();
        
        string tokenIssuer = builder.Configuration.GetOrThrow("TOKEN_ISSUER");
        string tokenAudience = builder.Configuration.GetOrThrow("TOKEN_AUDIENCE");
        string tokenKey = builder.Configuration.GetOrThrow("TOKEN_KEY");
        string tokenLifetime = builder.Configuration.GetOrThrow("TOKEN_LIFETIME");
        
        builder.AddJwtBearer(tokenIssuer, tokenAudience, tokenKey, tokenLifetime);

        int maxConcurrentRequests = int.Parse(builder.Configuration.GetOrThrow("GOOGLE_DRIVE_MAX_CONCURRENT_REQUESTS"), CultureInfo.InvariantCulture);
        
        //todo: в енв файле внести значение
        string pathToAccountCredentials = builder.Configuration.GetOrThrow("GOOGLE_DRIVE_PATH_TO_ACCOUNT_CREDENTIALS");
        
        //todo: в енв файле внести значение
        string defaultForderId = builder.Configuration.GetOrThrow("GOOGLE_DRIVE_DEFAULT_FOLDER_ID");

        builder.Services.AddGoogleDrive(maxConcurrentRequests, pathToAccountCredentials, defaultForderId);
        builder.Services.AddVectorSearchApiService(builder.Configuration);

        builder.Services.AddTypesToDi();

        builder.Services.AddHostedService<SyncGoogleDriveBackgroundService>();
        builder.Services.AddHostedService<ForceSyncGoogleDriveBackgroundService>();
        
        return builder;
    }

    private static WebApplicationBuilder AddAspNetCoreIdentity(this WebApplicationBuilder builder)
    {
        builder.Services.AddIdentity<User, IdentityRole<int>>(options => 
            {
                options.SignIn.RequireConfirmedAccount = false;
            })
            .AddEntityFrameworkStores<EduGraphContext>();

        return builder;
    }
    
    private static WebApplicationBuilder AddDbContext(this WebApplicationBuilder builder)
    {
        string? connectionString = builder.Configuration["DB_CONNECTION_STRING"];

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidCredentialException("DB_CONNECTION_STRING is not set");
        }
        
        builder.Services.AddDbContextPool<EduGraphContext>(options =>
            options.UseSqlite(connectionString));

        return builder;
    }

    private static WebApplicationBuilder AddJwtBearer(this WebApplicationBuilder builder, string issuer, string audience, string key, string lifetime)
    {
        builder.Services.Configure<JwtOptions>(options =>
        {
            options.Issuer = issuer;
            options.Audience = audience;
            options.Key = key;
            options.Lifetime = int.Parse(lifetime, CultureInfo.InvariantCulture);
        });
        
        builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                //todo: добавить настройки валидации jwt token
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    
                    ValidateAudience = true,
                    ValidAudience = audience,
                    
                    ValidateLifetime = true,
                    
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    
                    RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
                    ClockSkew = TimeSpan.Zero
                };
            });

        builder.Services.AddAuthorizationBuilder()
            .AddPoliciesByRoles();
        
        return builder;
    }

    private static void AddPoliciesByRoles(this AuthorizationBuilder builder)
    {
        foreach (string role in UserRoles.All)
        {
            builder.AddPolicy(role, policy => policy.RequireRole(role));
        }

        builder.AddPolicy(AuthorizationPolicies.AnyRole, policy =>
            policy.RequireRole(UserRoles.All));
        builder.AddPolicy(AuthorizationPolicies.TeacherOrAdminOrSuperAdmin, policy =>
            policy.RequireRole(UserRoles.Teacher, UserRoles.Admin, UserRoles.SuperAdmin));
    }
    
    private static WebApplicationBuilder AddResponseCompression(this WebApplicationBuilder builder)
    {
        builder.Services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
        });

        return builder;
    }
    
    private static void ValidateDIOnBuild(this WebApplicationBuilder builder)
    {
        builder.Host.UseDefaultServiceProvider((context, options) =>
        {
            options.ValidateOnBuild = true;
            options.ValidateScopes = true;
        });
    }

    private static WebApplicationBuilder AddCors(this WebApplicationBuilder builder)
    {
        builder.Services.AddCors(options =>
        {
            if (builder.Environment.IsDevelopment())
            {
                //todo: странно тут прописано, настроить чтобы понимало по обычному названию указанному в AppHost.cs
                string frontendUrl = builder.Configuration["services:frontend:http:0"]?.TrimEnd('/')
                                      ?? throw new InvalidCastException("Frontend url is not set");
                
                options.AddPolicy("AllowReactDevClient", corsBuilder =>
                {
                    corsBuilder.WithOrigins(frontendUrl)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            }
        });
        
        return builder;
    }

    private static WebApplicationBuilder AddFluentValidation(this WebApplicationBuilder builder)
    {
        builder.Services.AddValidatorsFromAssemblyContaining<Program>(includeInternalTypes: true);
        
        return builder;
    }
}
