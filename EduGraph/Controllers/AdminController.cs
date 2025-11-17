using EduGraph.Entities;
using EduGraph.Models;
using EduGraph.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Controllers;

public class AdminController : Controller
{
    [HttpGet]
    public async Task<ViewResult> SignUpApplications([FromServices] EduGraphContext context, CancellationToken ct,
        int page = 1, int pageSize = 15)
    {
        if (page < 1) page = 1;

        var query = context.SignUpApplications
            .AsNoTracking()
            .Where(app => app.Status == SignUpApplicationStatus.Pending);
        
        int totalItems = await query.CountAsync(ct);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        
        List<SignUpApplication> applications = await query
            .OrderBy(app => app.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        
        var viewModel = new SignUpApplicationsViewModel
        {
            Applications = applications,
            CurrentPage = page,
            TotalPages = totalPages > 0 ? totalPages : 1
        };

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ApproveSignUpApplication(int id, int currentPage, CancellationToken ct,
        [FromServices] EduGraphContext context, [FromServices] UserManager<IdentityUser<int>> userManager)
    {
        SignUpApplication? application = await context.SignUpApplications
            .FirstOrDefaultAsync(application => application.Id == id, ct);

        if (application is null || application.Status != SignUpApplicationStatus.Pending)
        {
            TempData["ErrorMessage"] = "Заявки не існує або вона немає статусу Pending";
            return RedirectToAction("SignUpApplications", new { page = currentPage });
        }

        application.Status = SignUpApplicationStatus.Approved;

        IdentityUser<int> user = new(application.Login)
        {
            PasswordHash = application.PasswordHash
        };

        var result = await userManager.CreateAsync(user);

        if (result.Succeeded is false)
        {
            TempData["ErrorMessage"] = result.Errors.ToString();
            return RedirectToAction("SignUpApplications", new { page = currentPage });
        }

        await context.SaveChangesAsync(ct);

        return RedirectToAction("SignUpApplications", new { page = currentPage });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RejectSignUpApplication(int id, int currentPage, CancellationToken ct,
        [FromServices] EduGraphContext context)
    {
        SignUpApplication? application = await context.SignUpApplications
            .FirstOrDefaultAsync(application => application.Id == id, ct);

        if (application is null || application.Status != SignUpApplicationStatus.Pending)
        {
            TempData["ErrorMessage"] = "Заявки не існує або вона немає статусу Pending";
            return RedirectToAction("SignUpApplications", new { page = currentPage });
        }

        application.Status = SignUpApplicationStatus.Rejected;
        
        await context.SaveChangesAsync(ct);
        
        return RedirectToAction("SignUpApplications", new { page = currentPage });
    }

    [HttpGet]
    public ViewResult AddUser() => View();
}