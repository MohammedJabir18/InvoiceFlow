import sqlite3
import os
import sys

# Define the path to the database
db_path = r"C:\Users\jabir\AppData\Roaming\com.invoiceflow.app\invoiceflow.db"

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def run_query(query):
    try:
        cursor.execute(query)
        # Check if query returns rows
        if query.strip().upper().startswith("SELECT"):
            rows = cursor.fetchall()
            if rows:
                col_names = [description[0] for description in cursor.description]
                print(f"Columns: {', '.join(col_names)}")
                for row in rows:
                    print(row)
            else:
                print("No results found.")
        else:
            conn.commit()
            print("Query executed successfully.")
    except Exception as e:
        print(f"Error executing query: {e}")

if len(sys.argv) > 1:
    query = " ".join(sys.argv[1:])
    print(f"Execute: {query}")
    run_query(query)
else:
    print(f"Connected to database: {db_path}")
    # Get list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print("\n--- Tables ---")
    for table in tables:
        print(f"- {table[0]}")

    # Dump first 5 rows of each table
    for table in tables:
        table_name = table[0]
        if table_name == "sqlite_sequence": continue
        
        print(f"\n--- Data in '{table_name}' ---")
        try:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
            rows = cursor.fetchall()
            if not rows:
                print("(Table is empty)")
            else:
                col_names = [description[0] for description in cursor.description]
                print(f"Columns: {', '.join(col_names)}")
                for row in rows:
                    print(row)
        except Exception as e:
            print(f"Error reading table {table_name}: {e}")

conn.close()
