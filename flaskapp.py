from flask import Flask, render_template, request, redirect
import mysql.connector

app = Flask(__name__)

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host="aventradb.cet2qquo45gu.us-east-1.rds.amazonaws.com",
        user="admin",
        password="Aventra2025!",
        database="aventra_db"
    )

# Home page
@app.route('/')
def index():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Fetch Users
    cursor.execute("SELECT user_id, username, email FROM Users;")
    users = cursor.fetchall()

    # Fetch Trips
    cursor.execute("SELECT trip_id, user_id, title, description, start_date, end_date FROM Trips;")
    trips = cursor.fetchall()

    cursor.close()
    db.close()
    return render_template('index.html', users=users, trips=trips)

# Add User
@app.route('/add_user', methods=['POST'])
def add_user():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']  # can be stored if needed
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO Users (username, email, password) VALUES (%s, %s, %s)",
                   (username, email, password))
    db.commit()
    cursor.close()
    db.close()
    return redirect('/')

# Add Trip
@app.route('/add_trip', methods=['POST'])
def add_trip():
    user_id = request.form['user_id']
    title = request.form['title']
    description = request.form['description']
    start_date = request.form['start_date']
    end_date = request.form['end_date']
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO Trips (user_id, title, description, start_date, end_date) VALUES (%s,%s,%s,%s,%s)",
                   (user_id, title, description, start_date, end_date))
    db.commit()
    cursor.close()
    db.close()
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)
