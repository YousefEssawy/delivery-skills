# Controller Code Style Guide

> A general, advisory style guide for Web API controllers. It defines a
> consistent **structure, layout, and naming** convention to follow when adding
> new controllers.
>
> Treat this as **guidance**, not a hard contract tied to any one project.
> Keep the *shape* of every rule; swap any concrete type name (base
> controller, response wrapper, logger, etc.) for whatever the target
> project already uses. When in doubt, find one existing controller in the
> project and mirror it.
>
> **Assumed infrastructure (adapt as needed):** JWT bearer auth with a shared
> base controller exposing the JWT subject (with another auth setup, use the
> project's equivalent of the current-user id), a response/exception wrapper that turns domain
> exceptions into HTTP status codes, automatic model validation on
> `[FromBody]` inputs, and a project-wide fallback auth policy that already
> requires an authenticated user on every endpoint. If the project doesn't
> have one of these, apply the equivalent rule with the project's own tools.

## Structure
- **Block namespace** (`namespace X { ... }`) — never file-scoped.
- **Class naming**: `Manage<Resource>Controller`.
- **Inherits** the project's shared base controller exposing the JWT subject
  helpers (e.g. `TokenUserId`, `TokenUserEmail`).
- **Class attributes** order: `[Route(...)]`, `[ApiVersion("1.0")]`, `[ApiController]`.
  Do NOT add `[Authorize]` at class level if a fallback policy already requires
  auth; add it only for a stricter policy (e.g. roles).
- **DI**: include the project's standard cross-cutting deps consistently; keep
  the constructor shape uniform across controllers.
- **Constructor**: one parameter per line, base call on the last line.
- **Field naming**: `_camelCase`, `readonly`.

## Routing — action-named kebab-case, NOT REST nesting
Use action-named routes, not RESTful nested resources.
✅ `POST insert` / `PUT update` / `GET details/{id}` / `POST search` /
`DELETE delete/{id}` / `GET by-team/{teamId}` / `POST get-all-by-role/{roleId}`
❌ `POST teams` / `PUT teams/{id}` / `GET teams/{id}` / `GET teams?…` /
`DELETE teams/{id}` / `GET teams/{id}/members`
The verb part is an explicit action in kebab-case. Route params carry type
constraints where useful (`{id:long}`, `{activeStatus:bool}`).

## Action signatures
- `[ProducesResponseType(typeof(<ResponseType>), StatusCodes.Status200OK)]`
  immediately precedes `[Http<Verb>("…")]`.
- `CancellationToken cancellationToken` is the first parameter on most methods;
  may move to the end when the primary input is a route param — pick one per
  method and stay consistent.
- Always mark binding sources explicitly: `[FromRoute]`, `[FromBody]`,
  `[FromQuery]`, `[FromForm]`.
- Body-bound write endpoints stamp the actor at the top:
  `requestModel.CreatedById = TokenUserId;`
- Service call → `return Ok(response);`. Do NOT catch exceptions in the
  controller — let the wrapper translate domain exceptions to HTTP status.
- Do NOT explicitly invoke validators when model validation runs automatically
  on `[FromBody]` inputs.

## DELETE endpoints — `DELETE delete/{id}`, id on the route
```csharp
[ProducesResponseType(typeof(BaseResponseObj<long>), StatusCodes.Status200OK)]
[HttpDelete("delete/{id:long}")]
public async Task<IActionResult> Delete([FromRoute] long id, CancellationToken cancellationToken)
{
    var response = await _thingService.DeleteAsync(id, TokenUserId, cancellationToken);
    return Ok(response);
}
```
- The actor is the JWT subject passed to the service; the **service** stamps the
  audit fields, not the controller.
- A cancellation that only flips status (row retained) is a state transition —
  model it as `PUT cancel/{id}`, not a delete.
- Read-only `GET` endpoints bind via `[FromRoute]` / `[FromQuery]`.

## Folder layout
- Group controllers by feature/resource, one folder per resource area.
- One controller per file, named after the controller class.

## Full example skeleton
```csharp
namespace Api.Controllers.V1.Management.Things
{
    [Route("api/v{version:apiVersion}/management/things")]
    [ApiVersion("1.0")]
    [ApiController]
    public class ManageThingsController : ApiControllerBase
    {
        private readonly IThingService _thingService;
        private readonly ExceptionMessageLogger _exceptionLogger;

        public ManageThingsController(
            IHttpContextAccessor httpContextAccessor,
            IThingService thingService,
            ExceptionMessageLogger exceptionLogger) : base(httpContextAccessor)
        {
            _thingService = thingService;
            _exceptionLogger = exceptionLogger;
        }

        [ProducesResponseType(typeof(BaseResponseObj<long>), StatusCodes.Status200OK)]
        [HttpPost("insert")]
        public async Task<IActionResult> Insert(CancellationToken cancellationToken, [FromBody] AddThingRequest requestModel)
        {
            requestModel.CreatedById = TokenUserId;
            var response = await _thingService.InsertAsync(requestModel, cancellationToken);
            return Ok(response);
        }

        [ProducesResponseType(typeof(BaseResponseObj<ThingDto>), StatusCodes.Status200OK)]
        [HttpGet("details/{id:long}")]
        public async Task<IActionResult> Details([FromRoute] long id, CancellationToken cancellationToken)
        {
            var response = await _thingService.GetByIdAsync(id, cancellationToken);
            return Ok(response);
        }

        [ProducesResponseType(typeof(BaseResponseObj<long>), StatusCodes.Status200OK)]
        [HttpDelete("delete/{id:long}")]
        public async Task<IActionResult> Delete([FromRoute] long id, CancellationToken cancellationToken)
        {
            var response = await _thingService.DeleteAsync(id, TokenUserId, cancellationToken);
            return Ok(response);
        }
    }
}
```

## Per-project calibration (the "swap concrete names" rule, made explicit)
Before auditing or writing, infer these from a sample of the project's existing
controllers and treat them as the project's baseline — do NOT impose values from
another project:
- Base controller type name (the JWT-subject base).
- Route prefix shape (e.g. role-segmented `api/admin/v{version}/…`).
- Whether `[ProducesResponseType]` is used project-wide (if absent everywhere,
  its absence is NOT a finding).
- Dominant DELETE style (route-id vs body) and DI shape (logger present or not).
A controller is a finding when it breaks the universal rules above OR diverges
from the project's own dominant pattern.
