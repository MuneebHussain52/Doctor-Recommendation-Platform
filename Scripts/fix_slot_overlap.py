with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/pages/Doctor/Settings.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for overlap error in the modal
# Find the newSlot state and add overlap error state after it
content = content.replace(
    "const [newSlot, setNewSlot] = useState<any>({",
    "const [slotOverlapError, setSlotOverlapError] = useState<string>('');\n  const [newSlot, setNewSlot] = useState<any>({"
)

# 2. Add a function to check for overlaps in real-time
check_overlap_function = '''
  // Check for time slot overlaps in real-time
  const checkSlotOverlap = (slot: any): string => {
    if (!slot.day_of_week || !slot.start_time || !slot.end_time) return '';

    const newStart = slot.start_time;
    const newEnd = slot.end_time;

    const existingSlotsForDay = appointmentSlots.filter(
      s => s.day_of_week === slot.day_of_week && s.is_active !== false
    );

    for (const existingSlot of existingSlotsForDay) {
      const existStart = existingSlot.start_time.substring(0, 5);
      const existEnd = existingSlot.end_time.substring(0, 5);

      const overlaps = (newStart < existEnd && newEnd > existStart);

      if (overlaps) {
        return `Time slot overlaps with existing ${existingSlot.mode} slot (${existStart} - ${existEnd}). Please choose a different time.`;
      }
    }

    return '';
  };

'''

# Insert after the confirmDeleteSlot function (before confirmAddSlot)
content = content.replace(
    "  // Appointment slot management functions\n  const confirmAddSlot",
    check_overlap_function + "  // Appointment slot management functions\n  const confirmAddSlot"
)

# 3. Update confirmAddSlot to not need overlap checking (already checked)
content = content.replace(
    """  const confirmAddSlot = async () => {
    try {
      setSlotMessage(null);
      setShowSlotConfirm(false);

      // Check for overlapping slots on the same day
      const existingSlotsForDay = appointmentSlots.filter(
        slot => slot.day_of_week === newSlot.day_of_week && slot.is_active !== false
      );

      const newStart = newSlot.start_time;
      const newEnd = newSlot.end_time;

      for (const existingSlot of existingSlotsForDay) {
        const existStart = existingSlot.start_time.substring(0, 5);
        const existEnd = existingSlot.end_time.substring(0, 5);

        // Check if time ranges overlap
        const overlaps = (newStart < existEnd && newEnd > existStart);

        if (overlaps) {
          setSlotMessage({
            type: 'error',
            text: `Time slot overlaps with existing ${existingSlot.mode} slot (${existStart} - ${existEnd}) on ${newSlot.day_of_week}. Please choose a different time.`
          });
          setTimeout(() => setSlotMessage(null), 7000);
          return;
        }
      }""",
    """  const confirmAddSlot = async () => {
    try {
      setSlotMessage(null);
      setSlotOverlapError('');
      setShowSlotConfirm(false);"""
)

# 4. Add useEffect to check overlap when slot details change
use_effect_overlap = '''
  // Check for overlaps whenever slot details change
  useEffect(() => {
    if (showAddSlot) {
      const error = checkSlotOverlap(newSlot);
      setSlotOverlapError(error);
    }
  }, [newSlot.day_of_week, newSlot.start_time, newSlot.end_time, showAddSlot, appointmentSlots]);

'''

# Insert before the return statement
content = content.replace(
    "  return (\n    <div className=\"min-h-screen bg-gray-50\">",
    use_effect_overlap + "  return (\n    <div className=\"min-h-screen bg-gray-50\">"
)

# 5. Add error message display in the modal
error_display_in_modal = '''
                        {slotOverlapError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">
                              <strong>⚠️ Time Conflict:</strong> {slotOverlapError}
                            </p>
                          </div>
                        )}
'''

# Insert before the tip section in the modal
content = content.replace(
    '                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">\n                          <p className="text-blue-800 text-sm">\n                            <strong>Tip:</strong>',
    error_display_in_modal + '\n                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">\n                          <p className="text-blue-800 text-sm">\n                            <strong>Tip:</strong>'
)

# 6. Disable the "Add Slot" button when there's an overlap
content = content.replace(
    """                        <button
                          onClick={() => setShowSlotConfirm(true)}
                          disabled={
                            !newSlot.day_of_week ||
                            !newSlot.start_time ||
                            !newSlot.end_time ||
                            ((newSlot.mode === 'in-person' || newSlot.mode === 'both') && !newSlot.location)
                          }
                          className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Slot
                        </button>""",
    """                        <button
                          onClick={() => setShowSlotConfirm(true)}
                          disabled={
                            !newSlot.day_of_week ||
                            !newSlot.start_time ||
                            !newSlot.end_time ||
                            ((newSlot.mode === 'in-person' || newSlot.mode === 'both') && !newSlot.location) ||
                            !!slotOverlapError
                          }
                          className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Slot
                        </button>"""
)

# 7. Clear overlap error when modal closes
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

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/pages/Doctor/Settings.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated slot overlap checking and error display")
