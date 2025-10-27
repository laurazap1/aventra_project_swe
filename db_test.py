from flask import Flask, jsonify
import mysql.connector

app = Flask(__name__)

@app.route("/users", methods=["GET"])
def get_users():
    # Connect to Amazon RDS MySQL database
    db = mysql.connector.connect(
        host="aventradb.cet2qquo45gu.us-east-1.rds.amazonaws.com",  # Replace with your RDS endpoint
        user="admin",                   # Replace with your RDS username
        password="Aventra2025!",               # Replace with your RDS password
        database="aventra_db"           # Replace with your RDS database name
    )
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.username, u.email, up.full_name, up.travel_preferences
        FROM Users u
        LEFT JOIN UserProfile up ON u.user_id = up.user_id;
    """)
    result = cursor.fetchall()
    users = []
    for row in result:
        users.append({
            "username": row[0],
            "email": row[1],
            "full_name": row[2],
            "travel_preferences": row[3]
        })
    cursor.close()
    db.close()
    return jsonify(users)