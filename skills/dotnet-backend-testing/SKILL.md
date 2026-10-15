---
name: dotnet-backend-testing
description: "Write .NET backend unit tests in NUnit constraint-model style (Moq, no xUnit/FluentAssertions/WebApplicationFactory) AND audit any .NET backend for services, service methods, and validators that have no test coverage. Use when the user wants to write/add tests for a service or validator, set up a test project, or scan/check a backend for missing test coverage. Triggers: 'write tests', 'add tests for this service', 'test this', 'set up tests', 'test coverage audit', 'what's missing tests', وبالعربي: 'اكتب تيستات', 'اعمل تيست للسيرفس ده', 'اظبط التيستات', 'افحص/شيك التغطية', 'ايه الناقص في التيستات', 'الناقص اللي محتاج تغطية'. Scope: ASP.NET Core backends (Clean Architecture: *.Bll services/validators, *.Dal repositories/EF). مش للـ frontend ولا non-.NET."
---

# dotnet-backend-testing

الـ skill دي ليها وضعين:

- **Mode A — كتابة تيستات**: تكتب unit tests بستايل NUnit constraint-model + Moq.
- **Mode B — فحص التغطية**: تفحص الـ backend وتطلّع الناقص في التغطية (services / methods / validators).

**قاعدة الاختيار:** لو الطلب فيه "scan / check / إيه الناقص / افحص التغطية" → نفّذ **Mode B الأول**، وبعدين اعرض **Mode A** على أعلى النواقص.

**ملاحظة عامة عن الإصدارات:** متحطّش أرقام نسخ ثابتة لأي package. استخدم دايمًا آخر نسخة مستقرة (latest stable) وقت التنفيذ (مثلاً عبر `dotnet add package`). والـ `TargetFramework` لازم يطابق باقي الـ solution.

---

## Step 0 — اكتشف المشروع الأول (دايمًا، في الوضعين)

- لاقي الـ solution والمشاريع: business (`*.Bll`)، data (`*.Dal`)، ومشاريع التست بتاعتهم (`*.Bll.Tests`، `*.Dal.Tests`). استنتج اسم `{Project}`.
- اكتشف إطار التيست الموجود. لو فيه تيستات بإطار مختلف (xUnit مثلاً) والمستخدم عايز الستاندرد ده، **نبّهه**: ميصحّش تخلط إطارين في نفس المشروع — لازم تحويل المشروع كله، مش خلط.
- لو مفيش test project مناسب → نفّذ [Bootstrap](#bootstrap--بس-لو-مفيش-test-project-مناسب).

---

## Convention — الستاندرد اللي بنطبّقه

- **NUnit (constraint model) + Moq.** ممنوع نهائيًا: `xUnit`، `FluentAssertions`، أو `WebApplicationFactory`/host integration tests.
- `[TestFixture]` + `[SetUp]` (يبني الـ mocks + الـ SUT)؛ و `#region Helper Methods` للـ builders.
- اسم التيست = `Method_Scenario_Expected`؛ الجسم فيه تعليقات `// Arrange` / `// Act` / `// Assert`.
- assertions بالـ **constraint model**: `Assert.That(actual, Is.EqualTo(expected))`، `Is.True/False/Null/Not.Null/Empty`، `Has.Count.EqualTo(n)`، `Assert.ThrowsAsync<T>(...)`.
- mock للـ `IUnitOfWorkFactory` / `IUnitOfWork` / repositories؛ و `Verify(... Times.Once/Never)` على الحفظ (`CompleteAsync`).
- **المكان**:
  - تيستات السيرفس + الـ validators → `{Project}.Bll.Tests` (Moq بس، من غير DB).
  - منطق الـ repository/EF → `{Project}.Dal.Tests` بـ **EF Core Sqlite in-memory** (يتعمل بس لما EF logic بتتلمس؛ **متحطّش EF packages في `*.Bll.Tests`**).
  - controller `[Authorize(Roles=…)]` gating → يتراجع بالـ **review** مش بتيست.
- مشاريع التست تتجمّع تحت solution folder اسمها **Tests**. الـ build لازم **من غير warnings**.
- غطّي **happy path + على الأقل failure path واحد** لكل ميثود. الـ validators تتفحص بـ FluentValidation `TestValidate`.

---

## Bootstrap — بس لو مفيش test project مناسب

اعمل `{Project}.Bll.Tests` (أو `{Project}.Dal.Tests` للـ EF) من الـ template ده، وضيفه للـ solution تحت folder اسمها **Tests**.

كل الـ package versions = **آخر نسخة مستقرة** (ضيفها بـ `dotnet add package` وقت الإنشاء)، والـ `TargetFramework` يطابق الـ solution:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework><!-- طابق TFM بتاع الـ solution --></TargetFramework>
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
    <!-- بس في *.Dal.Tests لما EF/repo logic بتتفحص:
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

---

## Mode A — كتابة تيستات

1. اقرأ الـ system-under-test وعدّ الـ branches: success، كل guard/early-return، not-found، save-failure، الـ edge inputs.

2. **Service** → `{Project}.Bll.Tests/Services/{Domain}/{Service}Tests.cs`:

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

   `[Test]` لكل branch؛ `[TestCase]` للـ inputs المتعددة.

3. **Validator** → `{Project}.Bll.Tests/Validators/{Domain}/{Validator}Tests.cs` باستخدام `FluentValidation.TestHelper`:
   - `TestValidate`، `ShouldHaveValidationErrorFor(...).WithErrorMessage(...)`، `ShouldNotHaveAnyValidationErrors()`.
   - حُط في الـ `[SetUp]`: `ValidatorOptions.Global.DefaultRuleLevelCascadeMode = CascadeMode.Stop;`.

4. **Repository/EF بس** → `{Project}.Dal.Tests` (Sqlite in-memory).

5. شغّل `dotnet test` لازم **أخضر**؛ و `dotnet build` **zero warnings**.

---

## Mode B — فحص المشروع للناقص في التغطية

1. **اجمع الـ units**: services (`*.Bll/Services/**/*Service.cs` → الميثودز العامة `Task`) والـ validators (`AbstractValidator<`).
2. **اجمع التيستات**: `*.Tests/**/*Tests.cs`؛ سجّل أنواع الـ SUT اللي بيشاوروا عليها.
3. **الفرق**:
   - كلاسات service من غير test class.
   - services متغطّاة بس فيها ميثودز عامة مش مذكورة.
   - validators من غير validator test.
4. **الأولوية**:
   - **High** = services فيها business rules حقيقية / money / dates / auth / state changes، وكل الـ validators.
   - **Medium** = branching بسيط.
   - **Low** = pass-throughs / mappers رفيعة.
5. **اطلّع جدول**: `Unit (class.method) | Kind | Branches to cover | Priority`. لو عملت sampling، **قول كده صراحة** — ممنوع القطع الصامت.
6. اعرض تنفيذ أعلى النواقص عن طريق **Mode A** (happy path + ≥1 failure path لكل واحد)، **أصغر دفعة آمنة الأول**.

---

## Definition of done — لكل دفعة تيستات

- بستايل NUnit/constraint-model، في المشروع الصح (`*.Bll.Tests` مقابل `*.Dal.Tests`).
- happy path + ≥1 failure path لكل ميثود؛ الـ validators بـ `TestValidate`.
- `dotnet test` أخضر؛ `dotnet build` zero warnings.
- مفيش EF packages في `*.Bll.Tests`؛ مشاريع التست تحت solution folder اسمها **Tests**.
