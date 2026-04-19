from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import os
try:
    from flask_cors import CORS
    HAS_CORS = True
except ImportError:
    HAS_CORS = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=None)
if HAS_CORS:
    CORS(app)

DB_NAME = os.path.join(BASE_DIR, 'expenses.db')

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT DEFAULT 'expense'
    )''')
    conn.commit()
    conn.close()

init_db()

def sf(filename):
    return send_from_directory(BASE_DIR, filename)

# ====================== SERVE HTML, CSS & JS ======================
@app.route('/')
def serve_index():
    return sf('index.html')

@app.route('/monthly.html')
@app.route('/monthly')
def serve_monthly():
    return sf('monthly.html')

@app.route('/login.html')
@app.route('/login')
def serve_login():
    return sf('login.html')

@app.route('/style.css')
def serve_css():
    return sf('style.css')

@app.route('/script.js')
def serve_js():
    return sf('script.js')

@app.route('/auth.js')
def serve_auth_js():
    return sf('auth.js')

# ====================== API ROUTES ======================
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM transactions ORDER BY date DESC, id DESC")
    rows = c.fetchall()
    conn.close()
    transactions = [
        {'id': r[0], 'name': r[1], 'amount': float(r[2]),
         'date': r[3], 'category': r[4], 'type': r[5]}
        for r in rows
    ]
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'amount', 'date', 'category']):
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    try:
        c.execute("""INSERT INTO transactions (name, amount, date, category, type)
                     VALUES (?, ?, ?, ?, ?)""",
                  (data['name'], float(data['amount']), data['date'],
                   data['category'], data.get('type', 'expense')))
        conn.commit()
        new_id = c.lastrowid
        conn.close()
        return jsonify({'status': 'success', 'id': new_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/transactions/<int:tid>', methods=['DELETE'])
@app.route('/api/transactions/<int:tid>/delete', methods=['POST'])  # for sendBeacon
def delete_transaction(tid):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM transactions WHERE id=?", (tid,))
    deleted = c.rowcount > 0
    conn.commit()
    conn.close()
    return jsonify({'status': 'success' if deleted else 'error'})

@app.route('/api/summary', methods=['GET'])
def get_summary():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='expense'")
    total_expense = float(c.fetchone()[0])
    c.execute("""SELECT category, COALESCE(SUM(amount), 0)
                 FROM transactions WHERE type='expense' GROUP BY category""")
    category_data = dict(c.fetchall())
    conn.close()
    return jsonify({
        'total_expense': round(total_expense, 2),
        'category_breakdown': category_data
    })

if __name__ == '__main__':
    print("✅ Expense Tracker is running!")
    print("Open this link → http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
