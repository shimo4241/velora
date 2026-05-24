import json
import os

locale_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src\locales"
locales = ["en", "fr", "es", "ar"]
keys = [
    "add_to_network", "in_network", "relationship_status_connected", "remove_connection", 
    "login_required_network", "cancel", "save", "notes", "tags"
]

data = {}
for loc in locales:
    with open(os.path.join(locale_dir, f"{loc}.json"), "r", encoding="utf-8") as f:
        data[loc] = json.load(f)

for k in keys:
    print(f"\n[{k}]")
    for loc in locales:
        print(f"  {loc}: {data[loc].get(k, 'MISSING')}")
