import os
import re

src_dir = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\src"
french_indicators = [
    r"\b[cCdD]’", r"\b[lL]’", r"\b[jJ]’", r"\b[qQ]u’", r"\b[sS]’", r"\b[mM]’", r"\b[tT]’",
    r"\b[eE]st\b", r"\b[aA]vec\b", r"\b[pP]our\b", r"\b[dD]ans\b", r"\b[cC]onnecter\b", r"\b[pP]artager\b",
    r"\b[rR]éseau\b", r"\b[eE]ntrepreneurs\b", r"\b[cC]réateurs\b", r"\b[aA]bonnement\b", r"\b[pP]rofil\b"
]

french_regexes = [re.compile(p) for p in french_indicators]

def scan_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove comments
    content_no_comments = re.sub(r"//.*", "", content)
    content_no_comments = re.sub(r"/\*[\s\S]*?\*/", "", content_no_comments)
    
    lines = content_no_comments.split("\n")
    found_lines = []
    for line_num, line in enumerate(lines, 1):
        if 'import' in line or 't("' in line or "t('" in line or 'console.log' in line:
            continue
        for regex in french_regexes:
            if regex.search(line):
                found_lines.append((line_num, line.strip()))
                break
                
    return found_lines

output_path = r"c:\Users\shimo\.gemini\antigravity\scratch\velora\scripts\scan_results.txt"
with open(output_path, "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk(src_dir):
        if "locales" in root or ".next" in root or "node_modules" in root:
            continue
        for file in files:
            if file.endswith((".ts", ".tsx")):
                path = os.path.join(root, file)
                matches = scan_file(path)
                if matches:
                    rel_path = os.path.relpath(path, src_dir)
                    out.write(f"\n{rel_path}:\n")
                    for lnum, text in matches:
                        out.write(f"  Line {lnum}: {text}\n")

print("Scan complete. Results written to scripts/scan_results.txt")
