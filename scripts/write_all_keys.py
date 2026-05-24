import json
import os

locale_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src\locales"
locales = ["en", "fr", "es", "ar"]

data = {}
for loc in locales:
    with open(os.path.join(locale_dir, f"{loc}.json"), "r", encoding="utf-8") as f:
        data[loc] = json.load(f)

output_path = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\scripts\specific_keys_output.txt"
with open(output_path, "w", encoding="utf-8") as out:
    for k in sorted(data["en"].keys()):
        out.write(f"[{k}]\n")
        for loc in locales:
            out.write(f"  {loc}: {data[loc].get(k, 'MISSING')}\n")
        out.write("\n")

print("Keys written successfully to scripts/specific_keys_output.txt")
