Read this file before every task.

# Project: EduGraph (backend)

## Git
- **GitHub Owner:** ilyaghrischenko.
- **GitHub Repo:** EduGraph.
- **Main branch name:** main.
- **Develop branch name:** develop.

## Architecture & Patterns
- **VSA (Vertical-Sliced-Architecture) with single static file**.
- **Result pattern**.
- **Rich models (like in DDD)**. 

## Stack
- **ASP.NET Core Web API**.
- **EntityFrameworkCore (SQLite)**.
- **FluentValidation**.
- **Google.Apis.Drive.v3**.
- **PdfPig**.
- **DocumentFormat.OpenXml**.
- **xUnit + FluentAssertions**.
- **Scalar for API documentation**.

## Static Code Analyzer
- **StyleCop.Analyzers**.
- **.editorconfig:** .editorconfig file exists by `EduGraph/.editorconfig` path.

## Critical Coding Rules (MUST FOLLOW)
- **Typing:** Use EXPLICIT types. Use `var` ONLY when the type is obvious from the right side (e.g., `new()`).
- **Async:** All I/O operations must be `async/await`. Append `Async` to method names.
- **Results:** Always return `Result<T>` or `Result` from the `LudaFit.SharedKernel.Models`. Do not throw exceptions for flow control.
- **Result API:** Check failure via `.IsFailure`, get value via `.Value`, get error via `.ErrorDetails`.
- **Result Propagation:** When propagating a failure from a nested `Result<T>` call, return it directly — rely on implicit conversion: `if (x.IsFailure) return x;`. Do NOT re-wrap: `if (x.IsFailure) return Result.Failure(x);`. Use `Result.Failure(...)` only when you CREATE new error.
- **Result Variable Naming:** Name `Result<T>` variables after the operation that produced them, prefixed by the verb: `createUserResult`, `sendEmailResult`, `uploadFileResult`. Never use generic names like `result`, `res`, or the entity name alone (`clientMetricsResult` instead of `createClientMetricsResult`). Helper methods that map failures to HTTP responses MUST reflect their specificity in the name: `ToFailureHttpResult()`, not `ToHttpResult()`. Parameter names for domain entities inside lambdas MUST reflect the domain concept, not the generic `entity` (e.g., `user =>`, `client =>`, `workout =>`).
- **DI:** Use constructor injection only.
- **Rich Models (DDD):** Use private setters for entities. Instantiation MUST happen via static factory methods (e.g., Create()) returning `Result<T>`.
- **VSA:** Endpoints MUST be defined as Minimal APIs using `IEndpointRouteBuilder` inside the static file.
- **Data Access:** DO NOT USE the Repository pattern. Inject and use `LudaFit.Infrastructure.SQLite.LudaFitDbContext` DIRECTLY.
- **EF Core:** Use `.AsNoTracking()` for pure read operations.
- **Hashing:** Use `Microsoft.AspNetCore.Identity.IPasswordHasher<T>` for hashing passwords.
- **Validation:** FluentValidation is strictly for surface-level, stateless checks (e.g., NotEmpty, length, format). Deep business validation and invariants MUST be enforced inside the Rich Domain Entities.
- **Types Auto-Registration:** Ensure services/handlers explicitly implements the custom interfaces (IScopedType, ITransientType, ISingletonType) from `LudaFit.SharedKernel.Interfaces` to guarantee automatic DI registration.
- **Endpoints Auto-Registration:** Ensure Endpoint classes explicitly implements `LudaFit.Core.Features.Common.Interfaces.IEndpoint` to guarantee automatic registration.
- **Date/DateTime:** Always get current Date/DateTime via `TimeProvider`.
- **Logging:** Use `ILogger<T>`.

## Available Skills & Tools
- **Unit Testing:** Use the `$unit-tests` skill for any testing tasks. Follow its internal xUnit/FluentAssertions rules.
- **Vertical Slices:** Use `$vertical-slice` to scaffold new features.
- **Bulk Vertical Slices:** Use `$bulk-vertical-slices` to scaffold new CRUD features group for specific entity.

## Workspace Commands
- **Build:** `dotnet build EduGraph.slnx`

## Project Learnings

**Accumulated corrections. This section is for the agent to maintain, not just the human.**

When the user corrects your approach, append a one-line rule here before ending the session. Write it concretely ("Always use X for Y"), never abstractly ("be careful with Y"). If an existing line already covers the correction, tighten it instead of adding a new one. Remove lines when the underlying issue goes away (model upgrades, refactors, process changes).

- (empty)
