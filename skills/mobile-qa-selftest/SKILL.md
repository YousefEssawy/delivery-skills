---
name: mobile-qa-selftest
description: |
  QA-style self-test of a mobile story (Flutter, React Native, native iOS or Android) on a real
  device or emulator before hand-over: read each acceptance criterion literally into claims, then
  try each on a small and a large phone, Android and iOS when both are supported, light and dark,
  every supported language including RTL, font scaling, offline and slow network, background and
  resume, permission denied, deep links and push taps, form validation, the keyboard covering
  inputs, double taps on submit, pagination and pull to refresh, and empty, error and loading
  states. Compares every field and error against the API contract and records PASS, FAIL, NOT
  PRODUCIBLE or AMBIGUOUS with screenshots or recordings, plus what QA must know. Use before a
  mobile story goes to QA, after a new build reaches testers, or when the user says "test the app
  like QA", "self-test the mobile story", "check it on the phone", "جرب الأبلكيشن زي الـ QA",
  "اختبر الستوري على الموبايل", "اتأكد إن الـ app مفيهوش بجز".
---

# mobile-qa-selftest

Mobile bugs hide in the combinations: the small phone in Arabic with large text, the form after
the app came back from the background. Try the combinations before QA does.

## 1. Claims first

- Read the story live with every comment, the decision register and the API contract (OpenAPI,
  schema or the backend's request and response types).
- Split every criterion into atomic claims: each field, label, error message, limit, ordering word,
  state and "or" is its own claim. When a claim reads two ways, write both and mark it AMBIGUOUS.
- Write the claim list into the results file before testing.

## 2. Devices and settings

Cover at least:

| Dimension | Minimum |
|---|---|
| Size | one small phone (about 5 in / 360 dp wide or less) and one large phone; a tablet if supported |
| Platform | Android and iOS when both are supported; the lowest supported OS version on one of them |
| Theme | light and dark |
| Language | every supported language; RTL if any is RTL (mirrored icons, arrows, alignment, mixed-direction text, numbers) |
| Text size | default and the largest accessibility size |
| Build | the same build type QA receives (release or the testers' flavour), not only a debug run |

Useful commands (check them against your SDK version):

| Action | Android (adb) | iOS Simulator (simctl) |
|---|---|---|
| Screenshot | `adb exec-out screencap -p > shot.png` | `xcrun simctl io booted screenshot shot.png` |
| Recording | `adb shell screenrecord /sdcard/run.mp4` | `xcrun simctl io booted recordVideo run.mp4` |
| Dark mode | `adb shell cmd uimode night yes` | `xcrun simctl ui booted appearance dark` |
| Font scale | `adb shell settings put system font_scale 1.3` | device Settings > Accessibility > Larger Text |
| Deep link | `adb shell am start -W -a android.intent.action.VIEW -d "<uri>" <package>` | `xcrun simctl openurl booted "<uri>"` |
| Revoke a permission | `adb shell pm revoke <package> <permission>` | `xcrun simctl privacy booted revoke <service> <bundle-id>` |
| Push payload | send from the push provider's console to a test device | `xcrun simctl push booted <bundle-id> payload.json` |
| Offline | `adb shell svc wifi disable` and `adb shell svc data disable` | airplane mode on a device; disconnect the Mac's network for the simulator |
| Slow network | emulator: `adb emu network speed edge`, `adb emu network delay gprs` | Network Link Conditioner |
| Process death | background the app, then `adb shell am kill <package>` | background the app, stop it from Xcode, relaunch |

## 3. What to try per claim

- **Forms:** every validation rule at min-1, min, max, max+1, empty, only spaces, emoji, pasted
  text, the other language's digits; the keyboard must not cover the focused input or the submit
  button; the right keyboard type per field; next/done moves focus; the error text matches the
  contract's error key.
- **Submit:** double tap and fast repeated taps create one record, not two; the button shows
  progress and is disabled while sending; a failed request leaves the input intact.
- **Lists:** pagination with no repeat or gap across pages, the last page, pull to refresh after a
  change elsewhere, scroll position after returning from a detail screen.
- **States:** empty, loading (on slow network), error with retry, offline then back online,
  session expired.
- **Lifecycle:** background and resume on every screen of the story; process death and relaunch;
  rotate if rotation is supported; an incoming call or notification over a form.
- **Permissions:** denied, denied permanently ("don't ask again"), granted later from Settings;
  the app explains and offers a path, never a blank screen or a crash.
- **Navigation:** system back (Android) and swipe back (iOS) from every screen; back after submit
  does not resubmit or show stale data; deep links and push taps open the right screen with the
  app closed, in background and in foreground, signed in and signed out.
- **Contract:** compare every displayed field, format (dates, numbers, currency, time zone), enum
  value and error message with the API contract and a real response. A field the contract has but
  the screen ignores, or a field the screen expects but the API does not send, is a finding.

## 4. Where bugs cluster

Spend extra time on these; most mobile bugs come from them:

- **Listing and creation forms:** validation, keyboard overlap, double submit, data lost on error.
- **Media upload:** large files, slow network, cancel, permission denied, wrong orientation,
  progress, retry after failure.
- **Navigation back stack:** duplicated screens, back leaving the app, back to a stale or deleted
  item, deep link opening on top of the wrong stack.
- **State after resume:** expired session, stale list, lost form input, a spinner that never ends,
  a crash after process death.

## 5. Record

Per claim, per device and setting where it matters:

| Claim | Device / OS / theme / language | What was done | Result | Evidence | Outcome |
|---|---|---|---|---|---|

Outcomes:

- **PASS**
- **FAIL** - the steps, the expected and actual result, and the smallest fix
- **NOT PRODUCIBLE** - why (needs a real push certificate, a payment, a device not available), and
  the automated test that covers it, named
- **AMBIGUOUS** - both readings, which one the app follows, the question for the product owner

Every FAIL and every UI claim has a screenshot or a screen recording. Use test accounts and test
data only, and undo what was created.

## 6. Hand-over

- FAILs are fixed test-first and re-tried on the same device and setting.
- AMBIGUOUS items go to the product owner as one message.
- **What QA must know:** the build and where to get it, test accounts to use (never their
  passwords in the comment), devices and OS versions covered, decided behaviour with decision keys,
  known limits, and what was not producible. Put it in the evidence comment (`evidence-comment`).
