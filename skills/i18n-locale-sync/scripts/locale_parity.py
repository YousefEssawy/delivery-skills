#!/usr/bin/env python3
"""
locale_parity.py - verify that every locale file exposes the same set of translation keys.

The bug this catches: a key added to one locale (e.g. en.json) but not the others, so users of the
other languages see a raw key or a silent fallback. Nothing in a normal build flags it.

Usage:
    python locale_parity.py <dir>                 # all locale files found under <dir>
    python locale_parity.py en.json ar.json ...   # explicit files
    python locale_parity.py "public/i18n/*.json"  # a glob (quote it)

Supports JSON, ARB (Flutter - @-metadata keys ignored), YAML (needs PyYAML), and gettext .po.
Nested keys are flattened with dots (a.b.c), so nested and flat files compare correctly.

Exit code: 0 if all locales share an identical key set, 1 otherwise - so it can gate CI if wanted.
"""
import sys
import os
import glob
import json


def flatten(obj, prefix=""):
    """Flatten nested dict keys into dotted paths. Non-dict leaves are the translatable entries."""
    keys = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            # ARB metadata keys start with '@' and are not translations.
            if isinstance(k, str) and k.startswith("@"):
                continue
            path = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                keys |= flatten(v, path)
            else:
                keys.add(path)
    return keys


def load_keys(path):
    """Return the set of translation keys in a locale file, or raise with a readable message."""
    ext = os.path.splitext(path)[1].lower()
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    if ext in (".json", ".arb"):
        return flatten(json.loads(text))

    if ext in (".yaml", ".yml"):
        try:
            import yaml  # type: ignore
        except ImportError:
            raise RuntimeError("YAML file found but PyYAML is not installed (pip install pyyaml)")
        data = yaml.safe_load(text) or {}
        # Rails-style files nest everything under the locale code; unwrap a single top-level key.
        if isinstance(data, dict) and len(data) == 1:
            only = next(iter(data.values()))
            if isinstance(only, dict):
                data = only
        return flatten(data)

    if ext == ".po":
        keys = set()
        for line in text.splitlines():
            line = line.strip()
            if line.startswith("msgid ") and line != 'msgid ""':
                keys.add(line[len("msgid "):].strip().strip('"'))
        return keys

    raise RuntimeError(f"Unsupported locale format: {ext}")


def collect_files(args):
    files = []
    for a in args:
        if os.path.isdir(a):
            for ext in ("json", "arb", "yaml", "yml", "po"):
                files += glob.glob(os.path.join(a, "**", f"*.{ext}"), recursive=True)
        else:
            files += glob.glob(a)
    # De-dupe, stable order.
    seen, out = set(), []
    for f in files:
        if f not in seen:
            seen.add(f)
            out.append(f)
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)

    files = collect_files(sys.argv[1:])
    if len(files) < 2:
        print(f"Need at least 2 locale files to compare; found {len(files)}.")
        sys.exit(2)

    locales = {}
    errors = []
    for path in files:
        try:
            locales[path] = load_keys(path)
        except Exception as e:  # noqa: BLE001 - report, don't crash the whole run
            errors.append((path, str(e)))

    if errors:
        print("PARSE ERRORS:")
        for path, msg in errors:
            print(f"  [X] {path}: {msg}")
        print()

    if len(locales) < 2:
        print("Not enough parseable locale files to compare.")
        sys.exit(1)

    union = set().union(*locales.values())
    print(f"Comparing {len(locales)} locale files - {len(union)} distinct keys in the union.\n")

    all_in_sync = True
    for path, keys in sorted(locales.items()):
        missing = sorted(union - keys)
        extra_only_here = sorted(k for k in keys if sum(k in ks for ks in locales.values()) == 1)
        status = "[OK] in sync" if not missing else f"[X] missing {len(missing)}"
        print(f"{status:<16} {path}")
        if missing:
            all_in_sync = False
            for k in missing[:40]:
                print(f"      missing: {k}")
            if len(missing) > 40:
                print(f"      ... and {len(missing) - 40} more")
        if extra_only_here:
            for k in extra_only_here[:20]:
                print(f"      only here (in no other locale): {k}")

    print()
    if all_in_sync and not errors:
        print("RESULT: all locales in sync - 0 missing keys.")
        sys.exit(0)
    else:
        print("RESULT: locales are OUT OF SYNC - fix the missing keys above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
