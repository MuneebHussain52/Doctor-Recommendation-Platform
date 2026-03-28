import re

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/pages/Doctor/Settings.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Check if state already exists
if "const [slotOverlapError" not in content:
    # Find the line with showAddSlot state
    pattern = r"(  const \[showAddSlot, setShowAddSlot\] = useState\(false\);\n)"
    replacement = r"\1  const [slotOverlapError, setSlotOverlapError] = useState<string>('');\n"

    content = re.sub(pattern, replacement, content)
    print("Added slotOverlapError state declaration")
else:
    print("slotOverlapError state already exists")

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/pages/Doctor/Settings.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("Completed!")
