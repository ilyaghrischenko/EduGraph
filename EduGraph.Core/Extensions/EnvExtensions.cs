using DotNetEnv;

namespace EduGraph.Core.Extensions;

public static class EnvExtensions
{
    public static IEnumerable<KeyValuePair<string, string>> LoadOrThrow(LoadOptions loadOptions, string paramName = ".env")
    {
        if (!File.Exists(".env"))
        {
            throw new EnvVariableNotFoundException(".env file not found", paramName);
        }
        
        return Env.Load(options: loadOptions);
    }
}
