import json
import os

locale_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src\locales"
with open(os.path.join(locale_dir, "en.json"), "r", encoding="utf-8") as f:
    en = json.load(f)

for k, val in en.items():
    if "network" in k or "add" in k or "connect" in k:
        print(f"{k}: {repr(val)}")
