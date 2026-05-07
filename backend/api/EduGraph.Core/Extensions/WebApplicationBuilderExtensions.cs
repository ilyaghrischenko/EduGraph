using System.Globalization;
using System.Reflection;
using System.Security.Authentication;
using System.Text;
using DocumentFormat.OpenXml.Drawing.Charts;
using EduGraph.Core.BackgroundServices;
using EduGraph.Core.Features.Users;
using EduGraph.Core.Options;
using EduGraph.Domain.Entities;
using EduGraph.Infrastructure.GoogleDrive.Extensions;
using EduGraph.Infrastructure.VectorSearch.Extensions;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace EduGraph.Core.Extensions;

public static class WebApplicationBuilderExtensions
{
    public static WebApplicationBuilder AddConfiguration(this WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton(TimeProvider.System);
        
        builder.Services.AddAuthentication();
        builder.Services.AddAuthorization();

        builder.Services.AddOpenApi();
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

        //todo: в енв файле внести значение
        string searchApiBaseUrl = builder.Configuration.GetOrThrow("SEARCH_API_BASE_URL");
        builder.Services.AddSearchService(searchApiBaseUrl);

        builder.Services.AddTypesToDi();

        builder.Services.AddHostedService<FetchDocumentsBackgroundService>();
        
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
        
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                //todo: добавить настройки валидации jwt token
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    
                    RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                };
            });

        //todo
        //services.AddAuthorizationBuilder()
        //    .AddPoliciesByRoles();
        
        return builder;
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
                options.AddPolicy("AllowReactDevClient", corsBuilder =>
                {
                    corsBuilder.WithOrigins("http://localhost:5174")
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
        builder.Services.AddValidatorsFromAssemblyContaining<Program>();
        
        return builder;
    }
}
