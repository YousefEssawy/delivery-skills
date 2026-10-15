# Wiring checklist — the cross-cutting points a cloned feature must re-register

A feature's *own* files (entity, service, component, tests) are easy to remember because you're
actively creating them. The bugs come from the **shared, cross-cutting registrations** — the places
where a feature announces itself to the rest of the app. These compile fine when missing, so nothing
tells you the feature is half-connected until a human clicks around.

For **each** item below: find where the **reference** feature does it, then confirm the **clone**
does the same. If the reference doesn't touch an item, the clone probably shouldn't either — but
check, don't assume.

## Backend

- [ ] **Persistence registration** — entity added to the ORM context / schema (DbSet, model
      registry, schema file), and a **migration / schema change** generated and reviewed.
- [ ] **Dependency injection** — repository/service/validator registered. Note whether the project
      registers by convention (assembly/package scan) or explicitly; match that. By-convention means
      nothing to add — but confirm the naming matches the scan's expectations.
- [ ] **Routing** — controller/route mounted under the right prefix and version; auth/roles
      attributes match the reference (and any intentional role differences are deliberate).
- [ ] **Enums / constants** — sort keys, status enums, message/response-code constants added
      alongside the reference's.
- [ ] **Aggregations** — if the reference contributes to a dashboard total, report, search index,
      export, or summary endpoint, the clone must too (or explicitly must not).
- [ ] **Tests** — the reference's test files have clones (service/unit, validation, auth/role
      gating, repository/integration), adjusted for the new fields.

## Frontend

- [ ] **Route table** — a route constant / entry added (projects that forbid inline URL literals
      keep a central table — add there first, then reference it).
- [ ] **Router registration** — the feature module/page lazy-loaded or registered in the router,
      with the same guards as the reference.
- [ ] **Navigation** — sidebar / menu / tab entry added, including any **compact or mobile variant**
      of the nav data, with an icon and a label key. Match role-visibility to the reference.
- [ ] **API endpoints** — endpoint constants added to the central API-URL table (if the project
      uses one), then referenced — never inline the URL.
- [ ] **i18n / locales** — **every** locale file gets the new keys, together. Adding to `en` and
      forgetting `ar`/`fr`/… is the single most common miss. (The `i18n-locale-sync` skill automates
      this parity check.)
- [ ] **Shared registrations** — if the reference declares/exports components from a shared module,
      the clone's shared components are declared/exported there too.
- [ ] **Dashboard / summary tiles** — a stat card, counter, or widget the reference adds, plus the
      corresponding field on the stats model.
- [ ] **Dev fixtures** — mock/stub data, storybook stories, dev-preview mocks the reference feeds,
      so local/dev builds don't break on a missing field.

## After wiring

- [ ] Build passes (both ends).
- [ ] Tests pass.
- [ ] Every locale has identical key sets.
- [ ] The feature is reachable from the UI (nav → route → page renders) — not just present in code.
