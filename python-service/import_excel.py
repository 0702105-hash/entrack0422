#!/usr/bin/env python3
import pandas as pd
import mysql.connector

df = pd.read_excel('../uploads/entrack.xlsx')
df.columns = [col.strip() for col in df.columns]
print("Columns:", list(df.columns))

DB_CONFIG = {'host': 'localhost', 'user': 'root', 'password': '', 'database': 'entrack'}

# Program mapping
prog_map = {
    'BACHELOR OF ARTS IN COMMUNICATION': 1,
    'BACHELOR OF ARTS IN ENGLISH LANGUAGE': 2,
    'BACHELOR OF ARTS IN POLITICAL SCIENCE': 3,
    'BACHELOR OF LIBRARY AND INFORMATION SCIENCE': 4,
    'BACHELOR OF MUSIC IN MUSIC EDUCATION': 5,
    'BACHELOR OF SCIENCE IN BIOLOGY': 6,
    'BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY': 7,
    'BACHELOR OF SCIENCE IN SOCIAL WORK': 8
}

def clean_semester(val):
    """Maps excel input to the strict ENUM/VARCHAR expected by the database"""
    v = str(val).strip().lower()
    if '1' in v or 'first' in v: return 'First'
    if '2' in v or 'second' in v: return 'Second'
    if 'sum' in v: return 'Summer'
    return 'First'

def safe_truncate_all():
    """Truncates data safely by bypassing foreign key constraints temporarily."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        tables_to_clear = [
            'enrollments', 
            'enrollment_batches', 
            'enrollment_pivot', 
            'predictions', 
            'model_metrics'
        ]
        for table in tables_to_clear:
            cursor.execute(f"TRUNCATE TABLE {table}")
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.commit()
        print("Database cleared successfully.")
    except Exception as e:
        print(f"SQL Error during truncate: {e}")
    finally:
        cursor.close()
        conn.close()

def seed_dependencies():
    """Ensures departments and programs exist to satisfy Foreign Key constraints."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        # 1. Ensure at least one department exists
        cursor.execute("""
            INSERT IGNORE INTO departments (department_id, department_name, created_at)
            VALUES (1, 'College of Arts and Sciences', NOW())
        """)
        
        # 2. Ensure all mapped programs exist
        for prog_name, prog_id in prog_map.items():
            cursor.execute("""
                INSERT IGNORE INTO programs (program_id, program_name, department_id)
                VALUES (%s, %s, 1)
            """, (prog_id, prog_name))
            
        conn.commit()
        print("Core dependencies (Departments & Programs) seeded.")
    except Exception as e:
        print(f"SQL Error during seeding: {e}")
    finally:
        cursor.close()
        conn.close()


# --- Main Execution ---

# 1. Clear old transactional data
safe_truncate_all()

# 2. Seed required foreign keys
seed_dependencies()

# 3. Import the historical data
imported = 0
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

for idx, row in df.iterrows():
    try:
        prog_name = str(row['Program']).upper().strip()
        ay_start = int(row['AY Start'])
        ay_end = int(row['AY End'])
        
        # Fallback to program_id 1 if not found, though this relies on the map being accurate
        prog_id = prog_map.get(prog_name, 1) 
        semester_str = clean_semester(row['Semester'])
        
        male = max(0, int(row['Male']) if pd.notna(row['Male']) else 0)
        female = max(0, int(row['Female']) if pd.notna(row['Female']) else 0)
        
        cursor.execute("""
            INSERT INTO enrollments 
            (program_id, academic_year_start, academic_year_end, semester, male, female, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                male = VALUES(male), 
                female = VALUES(female),
                updated_at = NOW()
        """, (prog_id, ay_start, ay_end, semester_str, male, female))
        
        imported += cursor.rowcount
    except Exception as e:
        print(f"Row {idx} Failed: {e}")
        continue

conn.commit()
print(f"IMPORTED {imported} records into the enrollments table.")

cursor.close()
conn.close()

print("\nImport complete. You can now run the train_models.py script.")