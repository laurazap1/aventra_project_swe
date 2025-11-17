#!/usr/bin/env python3
"""
Simple CSV importer for events.

Usage:
  # set DB env vars or edit defaults below
  python3 scripts/import_events.py events.csv

The script will create an `Events` table if it doesn't exist and insert rows.
CSV columns: title,description,start_time (ISO),end_time (ISO),venue,lat,lng,url,source
"""
import csv
import sys
import os
import mysql.connector
import sqlite3

DB_HOST = os.getenv('DB_HOST', 'your-rds-endpoint')
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASS = os.getenv('DB_PASS', 'your_password')
DB_NAME = os.getenv('DB_NAME', 'aventra_db')
DB_USE_SQLITE = os.getenv('DB_USE_SQLITE', '1') == '1'


def get_db():
    if DB_USE_SQLITE:
        # Use local sqlite file for dev
        conn = sqlite3.connect('dev_events.db')
        return conn
    return mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)


def ensure_table(conn):
    cur = conn.cursor()
    # Detect sqlite vs mysql connection by checking module
    if DB_USE_SQLITE:
        cur.execute('''
        CREATE TABLE IF NOT EXISTS Events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            start_time TEXT,
            end_time TEXT,
            venue TEXT,
            lat REAL,
            lng REAL,
            url TEXT,
            source TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        ''')
        conn.commit()
        cur.close()
    else:
        cur.execute('''
        CREATE TABLE IF NOT EXISTS Events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            start_time DATETIME,
            end_time DATETIME,
            venue VARCHAR(255),
            lat DOUBLE,
            lng DOUBLE,
            url VARCHAR(512),
            source VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ''')
        conn.commit()
        cur.close()


def import_csv(path):
    conn = get_db()
    ensure_table(conn)
    cur = conn.cursor()
    with open(path, newline='', encoding='utf8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            title = row.get('title')
            description = row.get('description')
            start_time = row.get('start_time') or None
            end_time = row.get('end_time') or None
            venue = row.get('venue') or None
            lat = row.get('lat') or None
            lng = row.get('lng') or None
            url = row.get('url') or None
            source = row.get('source') or 'csv'

            if DB_USE_SQLITE:
                cur.execute(
                    "INSERT INTO Events (title,description,start_time,end_time,venue,lat,lng,url,source) VALUES (?,?,?,?,?,?,?,?,?)",
                    (title, description, start_time, end_time, venue, lat or None, lng or None, url, source)
                )
            else:
                cur.execute(
                    "INSERT INTO Events (title,description,start_time,end_time,venue,lat,lng,url,source) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (title, description, start_time, end_time, venue, lat or None, lng or None, url, source)
                )
            count += 1
        conn.commit()
    cur.close()
    conn.close()
    print(f"Imported {count} rows into Events table")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: import_events.py <events.csv>')
        sys.exit(1)
    import_csv(sys.argv[1])
