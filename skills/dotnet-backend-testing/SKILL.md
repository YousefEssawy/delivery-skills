---
name: dotnet-backend-testing
description: "Write .NET backend unit tests in NUnit constraint-model style with Moq by default (no FluentAssertions / WebApplicationFactory; follows xUnit or MSTest instead when the project already uses it) AND audit any .NET backend for services, service methods, and validators that have no test coverage. Use when the user wants to write/add tests for a service or validator, set up a test project, or scan/check a backend for missing test coverage. Triggers: 'write tests', 'add tests for this service', 'test this', 'set up tests', 'test coverage audit', 'what's missing tests', and in Arabic: 'اكتب تيستات', 'اعمل تيست للسيرفس ده', 'اظبط التيستات', 'افحص/شيك التغطية', 'ايه الناقص في التيستات', 'الناقص اللي محتاج تغطية'. Scope: ASP.NET Core backends; detects the project's layout (default: Clean Architecture *.Bll services/validators, *.Dal repositories/EF; also Application/Infrastructure, vertical slices, or a single project). Not for frontends or non-.NET backends."
---

# dotnet-backend-testing

This skill has two modes:

- **Mode A — write tests**: write unit tests in NUnit constraint-model style + Moq (the default
  convention below).
- **Mode B — coverage audit**: scan the backend and list the coverage gaps (services / methods /
  validators).

**Choosing a mode:** if the request says "scan / check / what is missing / coverage audit" → run
**Mode B first**, then offer **Mode A** on the top gaps.

**Package versions:** never pin a fixed version number for any package. Always use the latest stable
version at the time you run (for example through `dotnet add package`). The test project's
`TargetFramework` must match the rest of the solution.

---

## Step 0 — Discover the project first (always, in both modes)

- Find the solution and its projects, and work out the layout:

  | Layout | Units under test | Test project (default name) |
  |---|---|---|
  | **Default — Clean Architecture** | services and validators in `*.Bll`; repositories / EF in `*.Dal` | `*.Bll.Tests`, `*.Dal.Tests` |
  | Application / Infrastructure | handlers, services, validators in `*.Application`; EF in `*.Infrastructure` | `*.Application.Tests`, `*.Infrastructure.Tests` |
  | Vertical slices | handlers and validators in `Features/{Feature}/` | one `*.Tests` project mirroring the feature folders |
  | Single project | services / validators folders in the one project | `*.Tests` |

  Infer `{Project}`. Below, `{Logic}` means the business-logic project (default `{Project}.Bll`) and
  `{Data}` means the data-access project (default `{Project}.Dal`). Use the existing test projects'
  names and folders if there are any.
- Detect the test framework already in use. **NUnit + Moq is this skill's default convention.** If
  the project already uses another framework (xUnit, MSTest) or another mocking library (NSubstitute,
  FakeItEasy):
  - follow the project's framework when the user prefers it, keeping the rest of this skill (naming,
    Arrange/Act/Assert, happy + failure path, the audit);
  - if the user wants this skill's standard instead, **warn them**: never mix two frameworks in one
    project — the whole project has to be converted, not mixed.
- If there is no suitable test project → run [Bootstrap](#bootstrap--only-if-there-is-no-suitable-test-project).

---

## Convention — the default standard this skill applies

- **NUnit (constraint model) + Moq.** Not used: `xUnit`, `FluentAssertions`, or
  `WebApplicationFactory` / host integration tests (unless the project already established one of
  them, see Step 0).
- `[TestFixture]` + `[SetUp]` (builds the mocks + the SUT); and `#region Helper Methods` for the
  builders.
- Test name = `Method_Scenario_Expected`; the body has `// Arrange` / `// Act` / `// Assert` comments.
- Assertions use the **constraint model**: `Assert.That(actual, Is.EqualTo(expected))`,
  `Is.True/False/Null/Not.Null/Empty`, `Has.Count.EqualTo(n)`, `Assert.ThrowsAsync<T>(...)`.
- Mock the project's persistence abstractions — for example `IUnitOfWorkFactory` / `IUnitOfWork` /
  repositories, or a `DbContext` interface — and `Verify(... Times.Once/Never)` the save call (for
  example `CompleteAsync` or `SaveChangesAsync`).
- **Where tests go**:
  - service + validator tests → `{Logic}.Tests` (Moq only, no database).
  - repository / EF logic → `{Data}.Tests` with **EF Core Sqlite in-memory** (only when EF logic is
    touched; **never put EF packages in `{Logic}.Tests`**).
  - controller `[Authorize(Roles=…)]` gating → checked by **review**, not by a test.
- Test projects are grouped under a solution folder named **Tests**. The build must have **no
  warnings**.
- Cover the **happy path + at least one failure path** for every method. Validators are tested with
  FluentValidation `TestValidate`.

---

## Bootstrap — only if there is no suitable test project

Create `{Logic}.Tests` (or `{Data}.Tests` for EF) from this template, and add it to the solution under
a folder named **Tests**.

All package versions = **latest stable** (add them with `dotnet add package` when creating the
project), and the `TargetFramework` matches the solution:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework><!-- match the solution's TFM --></TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="Moq" />
    <PackageReference Include="NUnit" />
    <PackageReference Include="NUnit.Analyzers" />
    <PackageReference Include="NUnit3TestAdapter" />
    <PackageReference Include="coverlet.collector" />
    <PackageReference Include="Bogus" />
    <PackageReference Include="AutoBogus.Moq" />
    <!-- only in the data test project, when EF/repository logic is tested:
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" /> -->
  </ItemGroup>
  <ItemGroup>
    <Using Include="NUnit.Framework" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\{Project}.Bll\{Project}.Bll.csproj" />
  </ItemGroup>
</Project>
```

`dotnet add package` writes a `Version` attribute on each reference; if the solution uses central
package management (`Directory.Packages.props`), put the versions there instead. Point the
`ProjectReference` at the project Step 0 found.

---

## Mode A — write tests

1. Read the system under test and count its branches: success, every guard / early return, not found,
   save failure, edge inputs.

2. **Service** → `{Logic}.Tests/Services/{Domain}/{Service}Tests.cs`:

   ```csharp
   [TestFixture]
   public class FooServiceTests
   {
       private Mock<IUnitOfWorkFactory> _mockUowFactory;
       private Mock<IUnitOfWork> _mockUow;
       private Mock<IFooRepository> _mockRepo;
       private FooService _service;

       [SetUp]
       public void SetUp()
       {
           _mockUowFactory = new Mock<IUnitOfWorkFactory>();
           _mockUow = new Mock<IUnitOfWork>();
           _mockRepo = new Mock<IFooRepository>();
           _mockUowFactory.Setup(f => f.Create()).Returns(_mockUow.Object);
           _mockUow.Setup(u => u.CompleteAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
           _service = new FooService(_mockUowFactory.Object, _mockRepo.Object);
       }

       [Test]
       public async Task DoThing_ValidInput_Succeeds()
       {
           // Arrange
           // Act
           // Assert
       }
   }
   ```

   The unit-of-work types above are an example; mock whatever abstractions the service's constructor
   actually takes. One `[Test]` per branch; `[TestCase]` for multiple inputs.

3. **Validator** → `{Logic}.Tests/Validators/{Domain}/{Validator}Tests.cs` using
   `FluentValidation.TestHelper`:
   - `TestValidate`, `ShouldHaveValidationErrorFor(...).WithErrorMessage(...)`,
     `ShouldNotHaveAnyValidationErrors()`.
   - In `[SetUp]`: `ValidatorOptions.Global.DefaultRuleLevelCascadeMode = CascadeMode.Stop;` (match
     the cascade mode the application configures).

4. **Repository / EF only** → `{Data}.Tests` (Sqlite in-memory).

5. `dotnet test` must be **green**; `dotnet build` **zero warnings**.

---

## Mode B — audit the project for missing coverage

1. **Collect the units**: services (for example `{Logic}/Services/**/*Service.cs`, or handlers in
   other layouts → their public `Task` methods) and validators (`AbstractValidator<`).
2. **Collect the tests**: `*.Tests/**/*Tests.cs`; record the SUT types they point at.
3. **Diff**:
   - service classes with no test class;
   - covered services with public methods no test mentions;
   - validators with no validator test.
4. **Priority**:
   - **High** = services with real business rules / money / dates / auth / state changes, and every
     validator.
   - **Medium** = simple branching.
   - **Low** = pass-throughs / thin mappers.
5. **Output a table**: `Unit (class.method) | Kind | Branches to cover | Priority`. If you sampled,
   **say so explicitly** — never cut silently.
6. Offer to fix the top gaps through **Mode A** (happy path + ≥1 failure path each), **smallest safe
   batch first**.

---

## Definition of done — for each batch of tests

- In the project's test style (default NUnit constraint model), in the right project (logic tests vs
  data tests).
- Happy path + ≥1 failure path per method; validators with `TestValidate`.
- `dotnet test` green; `dotnet build` zero warnings.
- No EF packages in the logic test project; test projects under a solution folder named **Tests**.
