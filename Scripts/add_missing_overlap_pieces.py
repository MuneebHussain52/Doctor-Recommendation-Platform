with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/pages/Doctor/Settings.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add slotOverlapError state (after showAddSlot state)
if 'slotOverlapError' not in content:
    content = content.replace(
        "  const [showAddSlot, setShowAddSlot] = useState(false);\n  const [newSlot, setNewSlot] = useState({",
        "  const [showAddSlot, setShowAddSlot] = useState(false);\n  const [slotOverlapError, setSlotOverlapError] = useState<string>('');\n  const [newSlot, setNewSlot] = useState({"
    )
    print("Added slotOverlapError state")
else:
    print("slotOverlapError state already exists")

# 2. Add useEffect for overlap checking (before return statement)
useEffect_code = """  // Check for overlaps whenever slot details change
  useEffect(() => {
    if (showAddSlot) {
      const error = checkSlotOverlap(newSlot);
      setSlotOverlapError(error);
    }
  }, [newSlot.day_of_week, newSlot.start_time, newSlot.end_time, showAddSlot, appointmentSlots]);

"""

if "Check for overlaps whenever slot details change" not in content:
    content = content.replace(
        "  return (\n    <div>",
        useEffect_code + "  return (\n    <div>"
    )
    print("Added useEffect for overlap checking")
else:
    print("useEffect already exists")

# 3. Update modal close to clear error
if "setSlotOverlapError('');" not in content:
    content = content.replace(
        """                          onClick={() => {
                            setShowAddSlot(false);
                            setNewSlot({
                              day_of_week: 'Monday',
                              start_time: '09:00',
                              end_time: '17:00',
                              mode: 'online',
                              location: ''
                            });
                          }}""",
        """                          onClick={() => {
                            setShowAddSlot(false);
                            setSlotOverlapError('');
                            setNewSlot({
                              day_of_week: 'Monday',
                              start_time: '09:00',
                              end_time: '17:00',
                              mode: 'online',
                              location: ''
                            });
                          }}"""
    )
    print("Updated modal close to clear overlap error")
else:
    print("Modal close already clears overlap error")

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/pages/Doctor/Settings.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("\nCompleted adding missing overlap checking pieces")
