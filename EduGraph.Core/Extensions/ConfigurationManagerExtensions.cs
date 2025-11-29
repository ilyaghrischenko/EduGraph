using DotNetEnv;

namespace EduGraph.Core.Extensions;

public static class ConfigurationManagerExtensions
{
    public static string GetOrThrow(this ConfigurationManager configuration, string key, string paramName = ".env")
    {
        return configuration[key] ?? throw new EnvVariableNotFoundException($"Configuration key {key} not found", paramName);
    }
}
