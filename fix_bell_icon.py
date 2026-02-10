with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/components/Patient/layout/Header.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Fix bell icon to show unread count
content = content.replace(
    '{filteredNotifications.length > 0 && (',
    '{notifications.filter(n => !n.is_read).length > 0 && (',
    1  # Only first occurrence (the bell icon)
)

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/components/Patient/layout/Header.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed bell icon notification count")
