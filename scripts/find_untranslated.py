import json
import os

locale_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src\locales"
with open(os.path.join(locale_dir, "en.json"), "r", encoding="utf-8") as f:
    en = json.load(f)
with open(os.path.join(locale_dir, "fr.json"), "r", encoding="utf-8") as f:
    fr = json.load(f)

print(f"Loaded English keys: {len(en)}, French keys: {len(fr)}")

# Print keys where the French value is identical to English
identical = []
for k in en:
    if k in fr:
        if en[k] == fr[k]:
            identical.append((k, en[k]))

print(f"\nFound {len(identical)} identical translations:")
for k, val in sorted(identical):
    print(f"  {k}: {repr(val)}")
