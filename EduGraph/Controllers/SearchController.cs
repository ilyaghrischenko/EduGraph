using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Controllers;

public class SearchController : Controller
{
    [HttpGet]
    public IActionResult Index() => View();
}