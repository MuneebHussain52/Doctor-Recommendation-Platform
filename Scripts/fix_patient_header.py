with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/components/Patient/layout/Header.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Fix double $$
content = content.replace('$${', '${')

# Fix double ((
content = content.replace('=== 0 ? ( (', '=== 0 ? (')

# Fix the Clear All button condition - should check filteredNotifications not notifications
content = content.replace(
    '{notifications.filter(n => !n.is_read).length > 0 && (',
    '{filteredNotifications.length > 0 && (',
    1  # Only first occurrence after the bell icon
)

with open("c:/Users/Shams/Desktop/New folder (7)/p_db/Frontend copy/src/components/Patient/layout/Header.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax errors in Patient Header")
