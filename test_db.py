import os, glob
import sqlite3

app_data = os.getenv('LOCALAPPDATA') or os.path.expanduser('~\\AppData\\Local')
roaming = os.getenv('APPDATA') or os.path.expanduser('~\\AppData\\Roaming')

paths = glob.glob(os.path.join(app_data, '**', 'com.invoiceflow.app', 'invoiceflow.db'), recursive=True)
paths += glob.glob(os.path.join(roaming, '**', 'com.invoiceflow.app', 'invoiceflow.db'), recursive=True)

print('PATHS:', paths)
for p in paths:
    print('DB:', p)
    conn = sqlite3.connect(p)
    curr = conn.cursor()
    curr.execute("SELECT id, name, updated_at FROM business_profiles")
    rows = curr.fetchall()
    print("PROFILES:", rows)
