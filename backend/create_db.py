import psycopg2
from psycopg2 import sql

# Connect to PostgreSQL server (to postgres database)
conn = psycopg2.connect(
    dbname='postgres',
    user='postgres',
    password='muneeb',
    host='localhost',
    port='5432'
)
conn.autocommit = True
cursor = conn.cursor()

# Create healthcare_db database
try:
    cursor.execute(sql.SQL("CREATE DATABASE {}").format(
        sql.Identifier('healthcare_db')
    ))
    print("Database 'healthcare_db' created successfully!")
except psycopg2.errors.DuplicateDatabase:
    print("Database 'healthcare_db' already exists.")

cursor.close()
conn.close()
