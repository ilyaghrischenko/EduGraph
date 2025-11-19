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
    public async Task<ViewResult> SignUpApplications([FromServices] EduGraphContext context, CancellationToken cancellationToken,
        int page = 1, int pageSize = 15, bool descending = false)
    {
        if (page < 1) page = 1;

        var query = context.SignUpApplications
            .AsNoTracking()
            .Where(app => app.Status == SignUpApplicationStatus.Pending);
        
        int totalItems = await query.CountAsync(cancellationToken);
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        
        if (descending) query = query.OrderByDescending(app => app.CreatedAt);
        else query = query.OrderBy(app => app.CreatedAt);
        
        List<SignUpApplication> applications = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        
        var viewModel = new SignUpApplicationsViewModel
        {
            Applications = applications,
            CurrentPage = page,
            TotalPages = totalPages > 0 ? totalPages : 1,
            IsDescending = descending
        };

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ApproveSignUpApplication(int id, int currentPage, CancellationToken cancellationToken,
        [FromServices] EduGraphContext context, [FromServices] UserManager<User> userManager)
    {
        SignUpApplication? application = await context.SignUpApplications
            .FirstOrDefaultAsync(application => application.Id == id, cancellationToken);

        if (application is null || application.Status != SignUpApplicationStatus.Pending)
        {
            TempData["ErrorMessage"] = "Заявки не існує або вона немає статусу Pending";
            return RedirectToAction("SignUpApplications", new { page = currentPage });
        }

        application.Status = SignUpApplicationStatus.Approved;

        User user = new(application.Login, application.FullName, application.Type, application.Group)
        {
            PasswordHash = application.PasswordHash
        };

        var result = await userManager.CreateAsync(user);

        if (result.Succeeded is false)
        {
            TempData["ErrorMessage"] = result.Errors.ToString();
            return RedirectToAction("SignUpApplications", new { page = currentPage });
        }

        await context.SaveChangesAsync(cancellationToken);

        return RedirectToAction("SignUpApplications", new { page = currentPage });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RejectSignUpApplication(int id, int currentPage, CancellationToken cancellationToken,
        [FromServices] EduGraphContext context)
    {
        SignUpApplication? application = await context.SignUpApplications
            .FirstOrDefaultAsync(application => application.Id == id, cancellationToken);

        if (application is null || application.Status != SignUpApplicationStatus.Pending)
        {
            TempData["ErrorMessage"] = "Заявки не існує або вона немає статусу Pending";
            return RedirectToAction("SignUpApplications", new { page = currentPage });
        }

        application.Status = SignUpApplicationStatus.Rejected;
        
        await context.SaveChangesAsync(cancellationToken);
        
        return RedirectToAction("SignUpApplications", new { page = currentPage });
    }

    [HttpGet]
    public ViewResult AddUser(SelectedAdditionType type = SelectedAdditionType.Custom)
        => View(new AddUserViewModel(type));

    // [HttpPost]
    // [ValidateAntiForgeryToken]
    // public IActionResult AddUserByCustomInput(AddUserViewModel model, CancellationToken cancellationToken,
    //     [FromServices] EduGraphContext context)
    // {
    //     
    // }
    //
    // [HttpPost]
    // [ValidateAntiForgeryToken]
    // public IActionResult AddUserByCsv(AddUserViewModel model, CancellationToken cancellationToken,
    //     [FromServices] EduGraphContext context)
    // {
    //     
    // }
}