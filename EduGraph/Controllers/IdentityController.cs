using EduGraph.Features.Identity.LogIn;
using EduGraph.Features.Shared;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Controllers;

public class IdentityController : Controller
{
    [HttpGet]
    public ViewResult LogIn() => View();

    [HttpPost]
    public async Task<IActionResult> LogIn(
        LogInRequest request,
        [FromServices] IRequestHandler<LogInRequest, Result<string>> handler,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            ModelState.AddModelError(string.Empty, "Invalid login attempt");
            return View(request);
        }
        
        Result<string> getToken = await handler.HandleAsync(request, ct);

        if (getToken.IsFailure)
        {
            ModelState.AddModelError("Login", getToken.ErrorMessage!);
            return View(request);
        }
        
        Response.Cookies.Append("Token", getToken.Value!);

        return RedirectToAction("Index", "Search");
    }
    
    [HttpGet]
    public ViewResult SignUp() => View();
}