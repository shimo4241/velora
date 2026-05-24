import json
import os

locale_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src\locales"
with open(os.path.join(locale_dir, "fr.json"), "r", encoding="utf-8") as f:
    fr = json.load(f)

english_words = ["the", "your", "please", "failed", "required", "error", "auth", "profile", "welcome", "retry", "completed", "sign in", "choose", "select", "delete", "create", "edit", "update", "cancel", "save", "network", "connect", "discover", "nearby"]

found = []
for k, val in fr.items():
    lower_val = str(val).lower()
    matched = [w for w in english_words if f" {w} " in f" {lower_val} " or lower_val == w or lower_val.startswith(w + " ") or lower_val.endswith(" " + w)]
    if matched:
        # Filter out known valid identical terms
        if k in ["portfolio", "profile", "performance", "tags", "scans", "taps"]:
            continue
        found.append((k, val, matched))

print(f"Found {len(found)} keys with potential English words in fr.json:")
for k, val, m in sorted(found):
    print(f"  {k}: {repr(val)} (matched: {m})")
