using System.Security.Cryptography;
using System.Text;

namespace EduGraph.SharedKernel.Helpers;

public static class HashHelper
{
    public static string ComputeSha256(string value)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(value);
        byte[] hash = SHA256.HashData(bytes);

        return Convert.ToHexString(hash).ToUpperInvariant();
    }
}
