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
        [FromServices] IRequestHandler<LogInRequest, VoidResult> handler,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            ModelState.AddModelError(string.Empty, "Invalid login attempt");
            return View(request);
        }
        
        VoidResult logInResult = await handler.HandleAsync(request, ct);

        if (logInResult.IsFailure)
        {
            ModelState.AddModelError(logInResult.ModelStateKey, logInResult.ErrorMessage!);
            return View(request);
        }
        
        return RedirectToAction("Index", "Search");
    }
    
    [HttpGet]
    public ViewResult SignUp() => View();
}