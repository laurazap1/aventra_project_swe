from flask import Flask, render_template, request, redirect, jsonify, send_from_directory
import sqlite3
import os
import requests
from werkzeug.utils import secure_filename
import uuid

# try to import mysql connector, but make it optional for dev using SQLite
try:
    import mysql.connector
    MYSQL_AVAILABLE = True
except Exception:
    mysql = None
    MYSQL_AVAILABLE = False
import os
import requests

app = Flask(__name__)

# Ensure uploads directory exists for storing uploaded images
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Simple content DB helpers (SQLite for local dev) ---
APP_SQLITE_FILE = 'dev_app.db'

def use_sqlite_for_content():
    return os.getenv('DB_USE_SQLITE', '1') == '1' or os.getenv('DB_HOST', 'your-rds-endpoint') in ('', 'your-rds-endpoint')

def ensure_content_db_sqlite():
    conn = sqlite3.connect(APP_SQLITE_FILE)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS Posts (
            post_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            image_link TEXT,
            extra TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS Comments (
            comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            comment_text TEXT NOT NULL,
            rating REAL,
            image_link TEXT,
            extra TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS Likes (
            like_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    # Create a simple Users table for demo (SQLite content DB only)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT
        );
    ''')
    conn.commit()
    cur.close()
    conn.close()

    # Ensure Comments table has parent_comment_id for replies
    conn = sqlite3.connect(APP_SQLITE_FILE)
    cur = conn.cursor()
    cols = [r[1] for r in cur.execute("PRAGMA table_info(Comments);").fetchall()]
    if 'parent_comment_id' not in cols:
        try:
            cur.execute('ALTER TABLE Comments ADD COLUMN parent_comment_id INTEGER DEFAULT NULL;')
            conn.commit()
        except Exception:
            pass
    cur.close()
    conn.close()

    # Seed demo users and posts/comments if none exist (use direct DB access here
    # to avoid calling sqlite_query_rows which itself calls ensure_content_db_sqlite)
    try:
        conn2 = sqlite3.connect(APP_SQLITE_FILE)
        cur2 = conn2.cursor()
        cur2.execute('SELECT COUNT(*) FROM Users')
        ucount_row = cur2.fetchone()
        ucount = ucount_row[0] if ucount_row else 0
        if ucount == 0:
            try:
                cur2.execute('INSERT INTO Users (username, email) VALUES (?, ?)', ('alice', 'alice@example.com'))
                cur2.execute('INSERT INTO Users (username, email) VALUES (?, ?)', ('bob', 'bob@example.com'))
                cur2.execute('INSERT INTO Users (username, email) VALUES (?, ?)', ('charlie', 'charlie@example.com'))
                conn2.commit()
            except Exception:
                conn2.rollback()
        # Seed sample posts (only if none exist) using Unsplash images
        cur2.execute('SELECT COUNT(*) FROM Posts')
        pcount_row = cur2.fetchone()
        pcount = pcount_row[0] if pcount_row else 0
        if pcount == 0:
            try:
                cur2.execute('INSERT INTO Posts (user_id, title, content, image_link, extra) VALUES (?, ?, ?, ?, ?)', (
                    1,
                    'Sunset in Santorini',
                    'Beautiful evening watching the sun set over the caldera. Great food and friendly locals.',
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60',
                    None
                ))
                pid1 = cur2.lastrowid
                cur2.execute('INSERT INTO Posts (user_id, title, content, image_link, extra) VALUES (?, ?, ?, ?, ?)', (
                    2,
                    'Hiking the coastal path',
                    'A rewarding trail with cliffside views and quiet beaches — bring water and good shoes.',
                    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=60',
                    None
                ))
                pid2 = cur2.lastrowid
                # add many comments and replies for pid1
                for i in range(1, 8):
                    cur2.execute('INSERT INTO Comments (post_id, user_id, comment_text, rating, image_link, extra) VALUES (?, ?, ?, ?, ?, ?)', (
                        pid1,
                        (i % 3) + 1,
                        f'Comment {i} on post {pid1}',
                        4.0 if i % 2 == 0 else None,
                        None,
                        None
                    ))
                    cid = cur2.lastrowid
                    # add replies to some comments
                    for j in range(1, (i % 3) + 1):
                        cur2.execute('INSERT INTO Comments (post_id, user_id, comment_text, rating, image_link, extra, parent_comment_id) VALUES (?, ?, ?, ?, ?, ?, ?)', (
                            pid1,
                            ((i + j) % 3) + 1,
                            f'Reply {j} to comment {cid}',
                            None,
                            None,
                            None,
                            cid
                        ))
                # add many comments for pid2
                for i in range(1, 6):
                    cur2.execute('INSERT INTO Comments (post_id, user_id, comment_text, rating, image_link, extra) VALUES (?, ?, ?, ?, ?, ?)', (
                        pid2,
                        (i % 3) + 1,
                        f'Comment {i} on post {pid2}',
                        None,
                        None,
                        None
                    ))
                conn2.commit()
            except Exception:
                conn2.rollback()
    except Exception:
        # ignore seeding errors in dev
        try:
            conn2.rollback()
        except Exception:
            pass
    finally:
        try:
            cur2.close()
            conn2.close()
        except Exception:
            pass
    


# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/api/upload', methods=['POST'])
def api_upload():
    # expects multipart/form-data with file field named 'file'
    if 'file' not in request.files:
        return jsonify({'error': 'no file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'no selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique = f"{uuid.uuid4().hex}_{filename}"
        save_path = os.path.join(UPLOAD_FOLDER, unique)
        file.save(save_path)
        # return a relative URL for frontend
        url = f"/uploads/{unique}"
        return jsonify({'url': url}), 201
    return jsonify({'error': 'file type not allowed'}), 400


# Simple SVG placeholder image endpoint
@app.route('/placeholder-image')
def placeholder_image():
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
            <rect width="100%" height="100%" fill="#e5e7eb" />
            <g fill="#9ca3af" font-family="Arial, Helvetica, sans-serif">
                <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="28">Image unavailable</text>
                <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="18">Upload an image or provide a valid URL</text>
            </g>
        </svg>'''
        return app.response_class(svg, mimetype='image/svg+xml')

def sqlite_query_rows(query, params=()):
    ensure_content_db_sqlite()
    conn = sqlite3.connect(APP_SQLITE_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def sqlite_execute(query, params=()):
    ensure_content_db_sqlite()
    conn = sqlite3.connect(APP_SQLITE_FILE)
    cur = conn.cursor()
    cur.execute(query, params)
    lastrowid = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()
    return lastrowid

# RDS Database connection
def get_db_connection():
    if not MYSQL_AVAILABLE:
        raise RuntimeError('mysql.connector not available in this Python environment')
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


# Proxy/search endpoint for Eventbrite (demo)
@app.route('/api/search')
def api_search():
    """Proxy search to Eventbrite for demo purposes.

    Query params supported (all optional):
      - q: free-text query
      - lat, lng: location coordinates
      - start: ISO8601 range start (e.g. 2025-11-10T00:00:00Z)
      - end: ISO8601 range end

    Requires environment variable EVENTBRITE_TOKEN to be set on the server.
    """
    EVENTBRITE_TOKEN = os.getenv('EVENTBRITE_TOKEN')
    if not EVENTBRITE_TOKEN:
        return jsonify({'error': 'EVENTBRITE_TOKEN not configured on server'}), 500

    q = request.args.get('q', '')
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    start = request.args.get('start')
    end = request.args.get('end')

    # First, try to return results from a local Events table (SQLite preferred for dev).
    db_results = []
    use_sqlite = os.getenv('DB_USE_SQLITE', '1') == '1' or os.getenv('DB_HOST', 'your-rds-endpoint') in ('', 'your-rds-endpoint')
    try:
        if use_sqlite:
            conn = sqlite3.connect('dev_events.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            sql = "SELECT id, title, description, start_time, end_time, venue, lat, lng, url, source FROM Events"
            filters = []
            params = []
            if q:
                filters.append("(title LIKE ? OR description LIKE ?)")
                params.extend([f"%{q}%", f"%{q}%"])
            if start and end:
                filters.append("(start_time BETWEEN ? AND ?)")
                params.extend([start, end])
            if filters:
                sql += " WHERE " + " AND ".join(filters)
            sql += " ORDER BY start_time LIMIT 50"
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            for r in rows:
                item = {
                    'id': f"db-{r['id']}",
                    'title': r['title'],
                    'description': r['description'],
                    'start_time': r['start_time'],
                    'end_time': r['end_time'],
                    'url': r['url'],
                    'source': r['source'] or 'db',
                }
                if r['venue']:
                    item['venue_name'] = r['venue']
                if r['lat'] and r['lng']:
                    try:
                        item['lat'] = float(r['lat'])
                        item['lng'] = float(r['lng'])
                    except Exception:
                        pass
                db_results.append(item)
            cursor.close()
            conn.close()
        else:
            db = get_db_connection()
            cursor = db.cursor(dictionary=True)
            sql = "SELECT id, title, description, start_time, end_time, venue, lat, lng, url, source FROM Events"
            filters = []
            params = []
            if q:
                filters.append("(title LIKE %s OR description LIKE %s)")
                params.extend([f"%{q}%", f"%{q}%"])
            if start and end:
                filters.append("(start_time BETWEEN %s AND %s)")
                params.extend([start, end])
            if filters:
                sql += " WHERE " + " AND ".join(filters)
            sql += " ORDER BY start_time LIMIT 50"
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            for r in rows:
                item = {
                    'id': f"db-{r.get('id')}",
                    'title': r.get('title'),
                    'description': r.get('description'),
                    'start_time': r.get('start_time').isoformat() if r.get('start_time') else None,
                    'end_time': r.get('end_time').isoformat() if r.get('end_time') else None,
                    'url': r.get('url'),
                    'source': r.get('source') or 'db',
                }
                if r.get('venue'):
                    item['venue_name'] = r.get('venue')
                if r.get('lat') and r.get('lng'):
                    try:
                        item['lat'] = float(r.get('lat'))
                        item['lng'] = float(r.get('lng'))
                    except Exception:
                        pass
                db_results.append(item)
            cursor.close()
            db.close()
    except Exception:
        # If DB not configured or table doesn't exist, ignore and fall back to Eventbrite
        db_results = []

    if db_results:
        return jsonify({'total': len(db_results), 'results': db_results})

    params = {}
    if q:
        params['q'] = q
    if lat and lng:
        params['location.latitude'] = lat
        params['location.longitude'] = lng
    if start:
        params['start_date.range_start'] = start
    if end:
        params['start_date.range_end'] = end
    # ask eventbrite to expand venue information so we can return lat/lng if available
    params['expand'] = 'venue'

    headers = {
        'Authorization': f'Bearer {EVENTBRITE_TOKEN}'
    }

    try:
        resp = requests.get('https://www.eventbriteapi.com/v3/events/search/', params=params, headers=headers, timeout=10)
        # If Eventbrite returns 404 for search, treat as empty results and fall back gracefully
        if resp.status_code == 404:
            return jsonify({'total': 0, 'results': [], 'note': 'Eventbrite returned NOT_FOUND for search'}), 200
        resp.raise_for_status()
    except requests.RequestException as e:
        # On other request errors, return a friendly error
        details = str(e)
        if hasattr(e, 'response') and e.response is not None:
            details = f"status={e.response.status_code} body={e.response.text}"
        return jsonify({'error': 'Eventbrite API request failed', 'details': details}), 502

    data = resp.json()

    # Normalize response to a simple shape
    results = []
    for ev in data.get('events', []):
        item = {
            'id': ev.get('id'),
            'title': ev.get('name', {}).get('text'),
            'description': ev.get('description', {}).get('text'),
            'start_time': ev.get('start', {}).get('utc'),
            'end_time': ev.get('end', {}).get('utc'),
            'url': ev.get('url'),
            'source': 'eventbrite'
        }
        venue = ev.get('venue')
        if venue:
            item['venue_name'] = venue.get('name')
            address = venue.get('address', {})
            item['venue_address'] = address.get('localized_address_display')
            lat_v = address.get('latitude')
            lng_v = address.get('longitude')
            try:
                if lat_v and lng_v:
                    item['lat'] = float(lat_v)
                    item['lng'] = float(lng_v)
            except Exception:
                pass
        results.append(item)

    return jsonify({
        'total': data.get('pagination', {}).get('object_count', len(results)),
        'results': results
    })


# ------------------ Posts / Comments / Likes API (dev) ------------------

@app.route('/api/posts', methods=['GET'])
def list_posts():
    if use_sqlite_for_content():
        user_filter = request.args.get('user_id')
        if user_filter:
            rows = sqlite_query_rows('SELECT * FROM Posts WHERE user_id=? ORDER BY created_at DESC LIMIT 100', (user_filter,))
        else:
            rows = sqlite_query_rows('SELECT * FROM Posts ORDER BY created_at DESC LIMIT 100')
        posts = []
        for r in rows:
            pid = r['post_id']
            like_rows = sqlite_query_rows('SELECT COUNT(*) as c FROM Likes WHERE target_type=? AND target_id=?', ('post', pid))
            comment_rows = sqlite_query_rows('SELECT COUNT(*) as c FROM Comments WHERE post_id=?', (pid,))
            # get author username
            uname = sqlite_query_rows('SELECT username FROM Users WHERE user_id=?', (r['user_id'],))
            username = uname[0]['username'] if uname else None
            posts.append({
                'post_id': pid,
                'user_id': r['user_id'],
                'username': username,
                'title': r['title'],
                'content': r['content'],
                'image_link': r['image_link'],
                'extra': r['extra'],
                'created_at': r['created_at'],
                'likes': like_rows[0]['c'] if like_rows else 0,
                'comments': comment_rows[0]['c'] if comment_rows else 0
            })
        return jsonify({'total': len(posts), 'posts': posts})
    else:
        return jsonify({'error': 'MySQL-backed content API not implemented in this dev build; set DB_USE_SQLITE=1 to use SQLite'}), 501


@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json() or {}
    user_id = data.get('user_id') or 0
    title = data.get('title')
    content = data.get('content')
    image_link = data.get('image_link')
    extra = data.get('extra')
    if not title:
        return jsonify({'error': 'title is required'}), 400
    if use_sqlite_for_content():
        post_id = sqlite_execute('INSERT INTO Posts (user_id, title, content, image_link, extra) VALUES (?, ?, ?, ?, ?)', (user_id, title, content, image_link, extra))
        return jsonify({'post_id': post_id}), 201
    else:
        return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    if use_sqlite_for_content():
        rows = sqlite_query_rows('SELECT * FROM Posts WHERE post_id=?', (post_id,))
        if not rows:
            return jsonify({'error': 'not found'}), 404
        r = rows[0]
        # get author username
        uname = sqlite_query_rows('SELECT username FROM Users WHERE user_id=?', (r['user_id'],))
        username = uname[0]['username'] if uname else None

        comments_rows = sqlite_query_rows('SELECT * FROM Comments WHERE post_id=? ORDER BY created_at ASC', (post_id,))
        # build map of comments and replies
        comments_map = {}
        top_level = []
        for c in comments_rows:
            cdict = dict(c)
            # attach commenter username
            u = sqlite_query_rows('SELECT username FROM Users WHERE user_id=?', (cdict.get('user_id'),))
            cdict['username'] = u[0]['username'] if u else None
            cdict['replies'] = []
            comments_map[cdict['comment_id']] = cdict
        for cid, cobj in list(comments_map.items()):
            parent = cobj.get('parent_comment_id')
            if parent:
                parent_obj = comments_map.get(parent)
                if parent_obj:
                    parent_obj['replies'].append(cobj)
            else:
                top_level.append(cobj)

        like_rows = sqlite_query_rows('SELECT COUNT(*) as c FROM Likes WHERE target_type=? AND target_id=?', ('post', post_id))
        post_obj = dict(r)
        post_obj['username'] = username
        return jsonify({
            'post': post_obj,
            'comments': top_level,
            'likes': like_rows[0]['c'] if like_rows else 0
        })
    else:
        return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def list_comments(post_id):
    if use_sqlite_for_content():
        rows = sqlite_query_rows('SELECT * FROM Comments WHERE post_id=? ORDER BY created_at ASC', (post_id,))
        return jsonify({'total': len(rows), 'comments': [dict(r) for r in rows]})
    else:
        return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def create_comment(post_id):
    data = request.get_json() or {}
    user_id = data.get('user_id') or 0
    comment_text = data.get('comment_text')
    rating = data.get('rating')
    image_link = data.get('image_link')
    extra = data.get('extra')
    parent_comment_id = data.get('parent_comment_id')
    if not comment_text:
        return jsonify({'error': 'comment_text is required'}), 400
    if use_sqlite_for_content():
        if parent_comment_id:
            cid = sqlite_execute('INSERT INTO Comments (post_id, user_id, comment_text, rating, image_link, extra, parent_comment_id) VALUES (?, ?, ?, ?, ?, ?, ?)', (post_id, user_id, comment_text, rating, image_link, extra, parent_comment_id))
        else:
            cid = sqlite_execute('INSERT INTO Comments (post_id, user_id, comment_text, rating, image_link, extra) VALUES (?, ?, ?, ?, ?, ?)', (post_id, user_id, comment_text, rating, image_link, extra))
        return jsonify({'comment_id': cid}), 201
    else:
        return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    data = request.get_json() or {}
    user_id = data.get('user_id') or 0
    if use_sqlite_for_content():
        # prevent duplicate likes by same user
        existing = sqlite_query_rows('SELECT * FROM Likes WHERE user_id=? AND target_type=? AND target_id=?', (user_id, 'post', post_id))
        if existing:
            return jsonify({'message': 'already liked'}), 200
        sqlite_execute('INSERT INTO Likes (user_id, target_type, target_id) VALUES (?, ?, ?)', (user_id, 'post', post_id))
        like_rows = sqlite_query_rows('SELECT COUNT(*) as c FROM Likes WHERE target_type=? AND target_id=?', ('post', post_id))
        return jsonify({'likes': like_rows[0]['c'] if like_rows else 0}), 201
    else:
        return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


@app.route('/api/comments/<int:comment_id>/like', methods=['POST'])
def like_comment(comment_id):
    data = request.get_json() or {}
    user_id = data.get('user_id') or 0
    if use_sqlite_for_content():
        existing = sqlite_query_rows('SELECT * FROM Likes WHERE user_id=? AND target_type=? AND target_id=?', (user_id, 'comment', comment_id))
        if existing:
            return jsonify({'message': 'already liked'}), 200
        sqlite_execute('INSERT INTO Likes (user_id, target_type, target_id) VALUES (?, ?, ?)', (user_id, 'comment', comment_id))
        like_rows = sqlite_query_rows('SELECT COUNT(*) as c FROM Likes WHERE target_type=? AND target_id=?', ('comment', comment_id))
        return jsonify({'likes': like_rows[0]['c'] if like_rows else 0}), 201
    else:
        return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


# Edit a post (only owner)
@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def edit_post(post_id):
    data = request.get_json() or {}
    user_id = data.get('user_id')
    title = data.get('title')
    content = data.get('content')
    image_link = data.get('image_link')
    extra = data.get('extra')
    if use_sqlite_for_content():
        rows = sqlite_query_rows('SELECT user_id FROM Posts WHERE post_id=?', (post_id,))
        if not rows:
            return jsonify({'error': 'not found'}), 404
        owner = rows[0]['user_id']
        if int(owner) != int(user_id):
            return jsonify({'error': 'forbidden'}), 403
        sqlite_execute('UPDATE Posts SET title=?, content=?, image_link=?, extra=? WHERE post_id=?', (title, content, image_link, extra, post_id))
        return jsonify({'message': 'updated'}), 200
    return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


# Delete a post (only owner) - also delete its comments and likes
@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if use_sqlite_for_content():
        rows = sqlite_query_rows('SELECT user_id FROM Posts WHERE post_id=?', (post_id,))
        if not rows:
            return jsonify({'error': 'not found'}), 404
        owner = rows[0]['user_id']
        if int(owner) != int(user_id):
            return jsonify({'error': 'forbidden'}), 403
        # delete likes for post
        sqlite_execute('DELETE FROM Likes WHERE target_type=? AND target_id=?', ('post', post_id))
        # delete comments and their likes
        comment_rows = sqlite_query_rows('SELECT comment_id FROM Comments WHERE post_id=?', (post_id,))
        for c in comment_rows:
            sqlite_execute('DELETE FROM Likes WHERE target_type=? AND target_id=?', ('comment', c['comment_id']))
        sqlite_execute('DELETE FROM Comments WHERE post_id=?', (post_id,))
        sqlite_execute('DELETE FROM Posts WHERE post_id=?', (post_id,))
        return jsonify({'message': 'deleted'}), 200
    return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


# Edit a comment (only owner)
@app.route('/api/comments/<int:comment_id>', methods=['PUT'])
def edit_comment(comment_id):
    data = request.get_json() or {}
    user_id = data.get('user_id')
    comment_text = data.get('comment_text')
    image_link = data.get('image_link')
    rating = data.get('rating')
    if use_sqlite_for_content():
        rows = sqlite_query_rows('SELECT user_id FROM Comments WHERE comment_id=?', (comment_id,))
        if not rows:
            return jsonify({'error': 'not found'}), 404
        owner = rows[0]['user_id']
        if int(owner) != int(user_id):
            return jsonify({'error': 'forbidden'}), 403
        sqlite_execute('UPDATE Comments SET comment_text=?, image_link=?, rating=? WHERE comment_id=?', (comment_text, image_link, rating, comment_id))
        return jsonify({'message': 'updated'}), 200
    return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


# Delete a comment (only owner) - also delete replies and likes
@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if use_sqlite_for_content():
        rows = sqlite_query_rows('SELECT user_id, post_id FROM Comments WHERE comment_id=?', (comment_id,))
        if not rows:
            return jsonify({'error': 'not found'}), 404
        owner = rows[0]['user_id']
        post_id = rows[0]['post_id']
        if int(owner) != int(user_id):
            return jsonify({'error': 'forbidden'}), 403
        # delete likes on this comment
        sqlite_execute('DELETE FROM Likes WHERE target_type=? AND target_id=?', ('comment', comment_id))
        # delete replies recursively (simple approach)
        reply_rows = sqlite_query_rows('SELECT comment_id FROM Comments WHERE parent_comment_id=?', (comment_id,))
        for r in reply_rows:
            sqlite_execute('DELETE FROM Likes WHERE target_type=? AND target_id=?', ('comment', r['comment_id']))
        sqlite_execute('DELETE FROM Comments WHERE parent_comment_id=?', (comment_id,))
        sqlite_execute('DELETE FROM Comments WHERE comment_id=?', (comment_id,))
        return jsonify({'message': 'deleted'}), 200
    return jsonify({'error': 'MySQL-backed content API not implemented in this dev build'}), 501


if __name__ == '__main__':
    app.run(debug=True)
