# Backend comparison — .NET (FluentValidation) in a separate repo

The comparison is optional. If the user wants it: **ask for the path to the .NET backend repo**, then
follow these steps. (If no path is given, list the comparison as "available" and finish the report
frontend‑only.)

## Step 1 — Find the validators and DTOs in the backend repo
First detect the backend's layout (the same discovery as Step 0 of the `dotnet-backend-validation`
skill): validators usually live in the business / application project (default `*.Bll/Validators/**`)
or in feature folders, and request models in the data / contracts project (default
`*.Dal/Models/Requests/**`) or next to their endpoint.
```bash
BE=/path/to/backend-repo
grep -rln "AbstractValidator<" --include=*.cs "$BE"                      # the validators
grep -rln "class .*Request\b\|record .*Request\b" --include=*.cs "$BE"   # the request models
grep -rn "\[FromBody\]" --include=*.cs "$BE" | head                       # endpoint → DTO
```
For each `AbstractValidator<TRequest>`, read the `RuleFor(x => x.Field)...` chains and extract the
rules:

| FluentValidation | Meaning |
|---|---|
| `.NotEmpty()` / `.NotNull()` | required |
| `.EmailAddress()` | email |
| `.MinimumLength(n)` / `.MaximumLength(n)` | length |
| `.GreaterThanOrEqualTo(n)` / `.InclusiveBetween(a,b)` | range |
| `.Matches("regex")` | regex |
| `.NotEqual(x => x.Other)` / custom `.Must(...)` | cross‑field / custom |

## Step 2 — Link each frontend form to its DTO
The frontend tells you the endpoint through its API service / calls:
```bash
grep -rn "http.post\|httpClient.post\|axios.post\|fetch(" --include=*.ts --include=*.tsx src/ | grep -i "api"
```
- Take the endpoint URL (for example `POST /api/users`) → find the controller action with that route in
  the backend → its `[FromBody] TRequest` → the validator for `TRequest`.
- If the link is not clear (no explicit endpoint), match by name (form `UserCreate` ↔
  `CreateUserRequest`) **and say the match is by name, not by route**.

## Step 3 — The mismatch matrix (per field)
Compare the frontend rule with the backend rule and assign a status:

| Status | Meaning | Severity |
|---|---|---|
| ✅ **Consistent** | both validate with the same meaning | — |
| 🔴 **Frontend‑only** | validated on the frontend, **not** on the backend | **High — security gap** (the client is bypassable) |
| 🔴 **Backend‑only** | validated on the backend, **not** on the frontend | **Medium‑High — UX gap** (the user gets a 400) |
| 🟡 **Divergent** | both validate but with **different rules** (e.g. maxLength 50 vs 100) | Medium — inconsistency |
| ⚪ **One side only** | the field itself exists on one side only | review (DTO drift) |

### Reading the severity (important for the report)
- **Frontend‑only = the most dangerous**: client validation is UX only; anyone sending a direct request
  gets through. The rule **must** exist on the backend. (Fixing the backend → `dotnet-backend-validation`.)
- **Backend‑only = bad UX**: the app is safe, but the user discovers the mistake after a round trip.
  The fix: add the same rule on the frontend (our Phase 2).
- **Divergent**: decide which side is right (usually the backend is the authority for limits) and
  align them.

## Notes
- **Do not edit the backend from here.** Any backend fix → hand it to `dotnet-backend-validation`. This
  skill fixes the **frontend** only.
- If the backend is not .NET (Node / Java / etc.) — same logic: find the validation layer, extract the
  rules, build the matrix; only the rule extraction differs per framework.
- If you have no access to the repo at run time, infer the backend's expectations from the DTO shapes /
  error responses only, **and mark them as inferred, not confirmed**.
