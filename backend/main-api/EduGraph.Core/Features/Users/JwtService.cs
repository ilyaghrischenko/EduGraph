using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EduGraph.Core.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EduGraph.Core.Features.Users;

public sealed class JwtService(IOptions<JwtOptions> jwtOptions)
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;
    
    public string GenerateToken(int id, string login, string role)
    {
        ClaimsIdentity identity = GetIdentity(id, login, role);
        
        var timeNow = DateTime.UtcNow;

        JwtSecurityToken token = new(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            notBefore: timeNow,
            claims: identity.Claims,
            expires: timeNow.Add(TimeSpan.FromDays(_jwtOptions.Lifetime)),
            signingCredentials: new SigningCredentials(_jwtOptions.GetSymmetricSecurityKey(), SecurityAlgorithms.HmacSha256)
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static ClaimsIdentity GetIdentity(int id, string login, string role)
    {
        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, id.ToString(CultureInfo.InvariantCulture)),
            new(JwtRegisteredClaimNames.Nickname, login),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimsIdentity.DefaultRoleClaimType, role)
        ];
        
        ClaimsIdentity identity = new(
            claims,
            "Token",
            ClaimsIdentity.DefaultNameClaimType,
            ClaimsIdentity.DefaultRoleClaimType
        );
        
        return identity;
    }
}
