import sqlite3
c = sqlite3.connect('db.sqlite3')
res = c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='properties_property'").fetchone()
if res:
    print(res[0])
else:
    print("Table not found")
