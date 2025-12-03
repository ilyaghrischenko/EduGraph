using DotNetEnv;

namespace EduGraph.Core.Extensions;

public static class EnvExtensions
{
    public static IEnumerable<KeyValuePair<string, string>> LoadOrThrow(string paramName = ".env")
    {
        if (!File.Exists(".env"))
        {
            throw new EnvVariableNotFoundException(".env file not found", paramName);
        }
        
        LoadOptions loadOptions = new(onlyExactPath: true);
        
        return Env.Load(options: loadOptions);
    }
}
