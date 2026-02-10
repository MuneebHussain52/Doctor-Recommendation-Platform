import re

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/components/Patient/layout/Header.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Add activeTab state after notifications state
content = content.replace(
    "const [notifications, setNotifications] = useState<Notification[]>([]);",
    "const [notifications, setNotifications] = useState<Notification[]>([]);\n  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'booking'>('all');"
)

# Add filtered notifications variable after useEffect hooks (before removeNotification function)
insert_before = "  const removeNotification = async (id: string) => {"
filtered_var = """  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.notification_type === activeTab);

  """
content = content.replace(insert_before, filtered_var + insert_before)

# Update clearNotifications to use filteredNotifications
content = content.replace(
    """  const clearNotifications = async () => {
    try {
      await Promise.all(
        notifications.map((n) =>
          fetch(`http://localhost:8000/api/notifications/${n.id}/`, {
            method: 'DELETE',
          })
        )
      );
      setNotifications([]);""",
    """  const clearNotifications = async () => {
    try {
      await Promise.all(
        filteredNotifications.map((n) =>
          fetch(`http://localhost:8000/api/notifications/${n.id}/`, {
            method: 'DELETE',
          })
        )
      );
      setNotifications(prev =>
        prev.filter(n => activeTab === 'all' || n.notification_type !== activeTab)
      );"""
)

# Update notification count to show unread
content = content.replace(
    "{notifications.length > 0 && (",
    "{notifications.filter(n => !n.is_read).length > 0 && ("
)

# Update "Clear All" button condition
content = content.replace(
    "{notifications.length > 0 && (",
    "{filteredNotifications.length > 0 && (",
    1  # Only replace first occurrence after the previous change
)

# Add tabs before notifications list
tabs_html = """                  </div>

                  {/* Category Tabs */}
                  <div className="flex border-b">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 px-4 py-2 text-sm font-medium $${
                        activeTab === 'all'
                          ? 'text-cyan-600 border-b-2 border-cyan-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('system')}
                      className={`flex-1 px-4 py-2 text-sm font-medium $${
                        activeTab === 'system'
                          ? 'text-cyan-600 border-b-2 border-cyan-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      System ({notifications.filter(n => n.notification_type === 'system').length})
                    </button>
                    <button
                      onClick={() => setActiveTab('booking')}
                      className={`flex-1 px-4 py-2 text-sm font-medium $${
                        activeTab === 'booking'
                          ? 'text-cyan-600 border-b-2 border-cyan-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Booking ({notifications.filter(n => n.notification_type === 'booking').length})
                    </button>
                  </div>
                  <ul className="max-h-96 overflow-y-auto">
                    {filteredNotifications.length === 0 ? ("""

# Replace the notifications list section  
content = re.sub(
    r'(\s+</div>\s+<ul className="max-h-96 overflow-y-auto">\s+{notifications\.length === 0 \?)',
    tabs_html,
    content
)

# Replace notifications.map with filteredNotifications.map
content = content.replace(
    "notifications.map((n) => (",
    "filteredNotifications.map((n) => ("
)

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/components/Patient/layout/Header.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Patient Header with category tabs")
