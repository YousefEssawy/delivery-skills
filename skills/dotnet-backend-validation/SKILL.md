---
name: dotnet-backend-validation
description: "Add FluentValidation request validators using the auto-validation pattern AND audit any .NET backend for request models that are missing validation. Use when the user wants to create/add a validator, validate a request model, wire up validation in a new project, or scan/check a backend for inputs with no validation. Triggers — 'add validation', 'create a validator', 'validate this request', 'set up validation', 'validation audit', 'what is missing validation', and in Arabic — 'اعمل فاليديشن', 'اعمل فاليديتور', 'اظبط الفاليديشن', 'افحص/شيك الحاجات اللي ملهاش فاليديشن', 'انهي ريكوست محتاج فاليديشن'. Scope — ASP.NET Core backends; detects the project's layout (default: Clean Architecture *.Api.Web + *.Bll + *.Dal; also Application/Infrastructure, vertical slices, or a single project). Not for frontends or non-.NET backends."
---

# .NET Backend Validation

Adds FluentValidation request validators using the **auto-validation pattern**, and audits any .NET
backend for request models that have no validation.

The skill has **two modes**:

- **Mode A — add a validator**: you have a specific request model and want a validator for it.
- **Mode B — audit the project**: you want to know which request models have no validation at all.

**Choosing a mode**: if the request says "scan / check / audit / what is missing" → run **Mode B
first**, show the gaps, then run **Mode A** on the ones the user picks. If the request names a specific
request model → go straight to **Mode A**.

> **Package versions**: never pin a fixed version number for any package. Always use the **latest
> stable** version at the time you run.

---

## Step 0 — Discover the project first (always)

Before anything else, learn how the project is laid out. Do not assume.

1. **Find the solution** (`*.sln` / `*.slnx`) and its projects, then work out which layout it uses:

   | Layout | API / host | Business logic (validators live here) | Data / request models |
   |---|---|---|---|
   | **Default — Clean Architecture (Bll/Dal)** | `*.Api.Web` | `*.Bll` | `*.Dal` |
   | Application / Infrastructure | `*.Api` / `*.WebApi` | `*.Application` | `*.Domain` / `*.Application` / `*.Contracts` |
   | Vertical slices | `*.Api` | the feature folder (`Features/{Feature}/`) | the same feature folder |
   | Single project | the one project | a `Validators/` folder in it | a `Models/` / `Requests/` / `Dtos/` folder in it |

   The host is the project with `Startup.cs` / `Program.cs`. Infer the `{Project}` prefix from the
   project names.
2. **Record the two paths everything below uses**:
   - `{ValidatorsRoot}` — where validators live or should live. Default `{Project}.Bll/Validators/`;
     otherwise the folder where existing `AbstractValidator<` classes already sit, or the business /
     application project's `Validators/` folder, or the feature folder for vertical slices.
   - `{RequestsRoot}` — where the request models live. Default `{Project}.Dal/Models/Requests/`;
     otherwise wherever the `[FromBody]` types are declared.
   If the layout matches none of the rows above, follow the existing validators' placement; if there
   are none, propose a location and say it is a proposal.
3. **Find the request models**: under `{RequestsRoot}`, plus every `[FromBody]` type in the
   controllers (or the request types of minimal-API endpoints / MediatR commands). **Watch out**: some
   files hold more than one request class.
4. **Find the existing validators**: `grep` for `AbstractValidator<`.
5. **Check that auto-validation is wired**: `grep` for
   - `AddFluentValidationAutoValidation`
   - `AddValidatorsFromAssemblyContaining`
   - `SuppressModelStateInvalidFilter`
   - and the `FluentValidation.AspNetCore` package.
   If any of these is missing → **run [Bootstrap](#bootstrap--only-if-auto-validation-is-not-wired-yet)**
   before continuing. If the project already validates another way (a MediatR pipeline behaviour, an
   endpoint filter, manual `ValidateAsync` calls), report it and follow that mechanism instead of
   adding a second one, unless the user asks to switch.

Quick discovery commands:

```bash
# projects
find . -name "*.sln" -o -name "*.slnx"
find . -name "*.csproj"
# request models (any layout)
grep -rln "class .*Request\b\|record .*Request\b\|class .*Command\b" --include="*.cs" .
grep -rn "\[FromBody\]" --include="*.cs" .
# existing validators
grep -rl "AbstractValidator<" --include="*.cs" .
# auto-validation wiring
grep -rn "AddFluentValidationAutoValidation\|AddValidatorsFromAssemblyContaining\|SuppressModelStateInvalidFilter" --include="*.cs" .
```

---

## Convention — the standard this skill applies

- **One validator per request model**: `AbstractValidator<TRequest>` in
  `{ValidatorsRoot}/{Domain}/` (default `{Project}.Bll/Validators/{Domain}/`).
- Validators are registered **automatically** with `AddValidatorsFromAssemblyContaining<T>()` — **no**
  manual registration per validator.
- The controller returns **400** with:
  ```csharp
  if (!ModelState.IsValid) return BadRequest(ModelState);
  ```
  (this works because `SuppressModelStateInvalidFilter = true`). If the project returns validation
  errors in its own envelope (a `ProblemDetails` factory, a custom response wrapper), keep that.
- Validator messages are **i18n keys**, added to **every locale file the project has** (for example
  `en` and `ar`). If the project does not use i18n keys, use **clear English messages** in the style
  the project already uses.
- Every new validator gets a **validator unit test** (FluentValidation `TestValidate`), written in the
  project's test style (see the `dotnet-backend-testing` skill; its default is NUnit).

---

## Bootstrap — only if auto-validation is not wired yet

Do this **only** if Step 0 found the wiring missing:

1. Add the `FluentValidation.AspNetCore` package (**latest stable**) to the project that holds the
   configuration helpers (often the data or business project, or the host in a single-project
   layout).
   - If a bare `FluentValidation` package is referenced on its own, **remove it** to avoid version
     conflicts, and let the `AspNetCore` package bring a compatible version.
   - Note: the FluentValidation maintainers no longer recommend auto-validation for new projects (see
     the [ASP.NET Core integration docs](https://docs.fluentvalidation.net/en/latest/aspnet.html)).
     This skill keeps it as its default; if the user prefers, use manual validation or an
     endpoint/action filter instead, and say which one you chose.
2. Add this helper:
   ```csharp
   public static IServiceCollection AddFluentValidationConfig<T>(this IServiceCollection services)
   {
       services.AddFluentValidationAutoValidation();
       services.AddValidatorsFromAssemblyContaining<T>();
       ValidatorOptions.Global.DefaultRuleLevelCascadeMode  = CascadeMode.Stop;
       ValidatorOptions.Global.DefaultClassLevelCascadeMode = CascadeMode.Stop;
       return services;
   }
   ```
3. In `Startup` / `Program`:
   ```csharp
   services.AddFluentValidationConfig<SomeValidator>();
   services.Configure<ApiBehaviorOptions>(o => o.SuppressModelStateInvalidFilter = true);
   ```
4. If the host uses **Autofac** (`AutofacServiceProviderFactory`), these registrations flow into the
   container automatically, with **no** extra wiring.

---

## Mode A — add a validator

1. **Find the target request model.**
2. Create `{ValidatorsRoot}/{Domain}/{Model}Validator.cs` (default layout shown; use the namespaces
   Step 0 found):
   ```csharp
   using FluentValidation;
   using {Project}.Dal.Models.Requests.{Domain};

   namespace {Project}.Bll.Validators.{Domain};

   public class {Model}Validator : AbstractValidator<{Model}>
   {
       public {Model}Validator()
       {
           RuleFor(x => x.Field).NotEmpty().WithMessage("FieldRequired");
           // lengths, ranges, EmailAddress, cross-field NotEqual(x => x.Other), ...
       }
   }
   ```
   Match the project's namespace style (file-scoped or block) and the validator placement of the
   existing validators.
3. **Infer the rules from the model**:

   | In the model | Rule |
   |---|---|
   | required / non-null | `NotEmpty()` |
   | text length | `MinimumLength(n)` / `MaximumLength(n)` |
   | email | `EmailAddress()` |
   | numeric range | `GreaterThanOrEqualTo(n)` / `InclusiveBetween(a, b)` |
   | "must differ from another field" | `NotEqual(x => x.Other)` |

4. Add the **message keys** to **every locale file** the project has.
5. Add a **validator test** (`TestValidate`).
6. `dotnet build` (**zero warnings**) + `dotnet test` (**green**).

---

## Mode B — audit the project for missing validation

1. **Collect the request models**: the `[FromBody]` types in the controllers + the request classes
   under `{RequestsRoot}`. (Remember: files may hold **several classes**.)
2. **Collect the validators**: every `AbstractValidator<X>`; record the type `X` it covers.
3. **Diff**: any request model with no matching validator = **a gap**.
4. **Priority**:
   - **High**: bodies of write endpoints (`insert` / `update` / `create` / `change` / `assign` /
     `block` / `delete`), and any user-entered data (auth, money, dates, emails).
   - **Medium**: bodies of `search` / `filter` endpoints.
   - **Low**: internal shapes.
5. **Output a table**:

   | Model | Controller + endpoint | Suggested rules | Priority |
   |---|---|---|---|

   > If you **sampled** instead of scanning everything, **say so explicitly** — never cut silently.
6. Offer to fix the top gaps through **Mode A** (validator + test + i18n for each), **smallest safe
   batch first**.

---

## Definition of done for each validator

- `AbstractValidator<T>` in `{ValidatorsRoot}/{Domain}/` (default `{Project}.Bll/Validators/{Domain}/`).
- Message keys in **every** locale file.
- Validator unit test (`TestValidate`) **green**.
- `dotnet build` **zero warnings**; `dotnet test` **green**.
- **Only the target model** is affected (auto-validation only touches models that have a validator).
