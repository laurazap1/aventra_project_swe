from flask import Flask, render_template, request, redirect
import mysql.connector

app = Flask(__name__)

# RDS Database connection
def get_db_connection():
    return mysql.connector.connect(
        host="your-rds-endpoint",
        user="admin",
        password="your_password",
        database="aventra_db"
    )

# Home page
@app.route('/')
def index():
    return render_template('index.html')

# Display Users (example of fetching data)
@app.route('/users')
def users():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT user_id, username, email FROM Users;")
    users = cursor.fetchall()
    cursor.close()
    db.close()
    return render_template('users.html', users=users)

# Add a new user (example of inserting data)
@app.route('/add_user', methods=['POST'])
def add_user():
    username = request.form['username']
    email = request.form['email']
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO Users (username, email) VALUES (%s, %s)", (username, email))
    db.commit()
    cursor.close()
    db.close()
    return redirect('/users')

if __name__ == '__main__':
    app.run(debug=True)
