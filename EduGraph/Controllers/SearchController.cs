using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Controllers;

public class SearchController : Controller
{
    [HttpGet]
    public ViewResult Index() => View();
}