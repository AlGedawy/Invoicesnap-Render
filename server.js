const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 10000;

const db = new sqlite3.Database(path.join(__dirname, 'invoicesnap.db'));
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client TEXT,
      amount REAL,
      currency TEXT,
      notes TEXT,
      created_at TEXT
    )
  `);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM invoices ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/invoices', (req, res) => {
  const { client, amount, currency, notes } = req.body;
  const stmt = db.prepare(
    'INSERT INTO invoices (client, amount, currency, notes, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
  );
  stmt.run([client, amount, currency, notes || ''], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ id: this.lastID });
  });
});

app.listen(PORT, () => {
  console.log(`InvoiceSnap running on port ${PORT}`);
});
