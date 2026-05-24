import json
import os

locale_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src\locales"
with open(os.path.join(locale_dir, "en.json"), "r", encoding="utf-8") as f:
    en = json.load(f)
with open(os.path.join(locale_dir, "fr.json"), "r", encoding="utf-8") as f:
    fr = json.load(f)

prefixes = ["setup_", "welcome_", "settings_", "discover_", "onboarding_", "tagline"]

for prefix in prefixes:
    print(f"\n--- {prefix} Keys ---")
    for k in sorted(en.keys()):
        if k.startswith(prefix):
            print(f"[{k}]")
            print(f"  EN: {en[k]}")
            print(f"  FR: {fr[k]}")
