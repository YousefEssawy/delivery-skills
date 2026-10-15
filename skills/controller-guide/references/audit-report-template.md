# Controller Audit Report — `<project / area>`

> Read-only audit. Nothing was modified. Rules sourced from the bundled
> `controller-code-style-guide.md`. Project-specific names below were
> **calibrated** from existing controllers, not imposed.

## Calibrated project baseline
| Aspect | Detected value |
|---|---|
| Base controller | `<e.g. ApiControllerBase>` |
| Route prefix shape | `<e.g. api/v{version:apiVersion}/management/…>` |
| `[ProducesResponseType]` used project-wide? | `<yes / no — if no, absence is not a finding>` |
| Dominant DELETE style | `<route-id `delete/{id}` / body>` |
| DI shape (logger consistently injected?) | `<yes / no>` |

## Compliance matrix
Legend: ✅ compliant · 🟡 partial · ❌ violation · — n/a

| Controller | Block ns | Class name | Base ctrl | Action routes | Explicit binding | CT placement | Actor stamp | No try/catch | No manual validators | Field naming | One/file |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `ManageXController.cs` | | | | | | | | | | | |
| `ManageYController.cs` | | | | | | | | | | | |

## What's already covered (do NOT change)
- `<rule>` — followed correctly across `<N>` controllers.

## What needs changing
| File | Line | Rule violated | Suggested fix |
|---|---|---|---|
| `ManageXController.cs` | `L42` | `<rule>` | `<concrete fix>` |

## Internal conflicts (controllers disagree with each other)
- `<e.g. ManageX uses action-named routes; ManageY uses REST nesting — pick one>`

## Priority
1. **Consistency-breaking** (mixed patterns, wrong base, REST vs action routes): `<…>`
2. **Correctness/safety** (missing actor stamp, try/catch, manual validators): `<…>`
3. **Cosmetic** (field naming, attribute order): `<…>`

## Interface-sync
- Route changes proposed? `<yes/no>` — if yes, sync `<api-url.ts / endpoints.* / *ApiClient*>`.

---
**Next step:** apply **all** / **some** / **none** of the above?
