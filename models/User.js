const mysql = require('mysql');
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect();

const User = {
  findByUsername: (username, callback) => {
    db.query('SELECT * FROM users WHERE username = ?', [username], callback);
  },
  getAll: (callback) => {
    db.query('SELECT * FROM users', callback);
  },
  findById: (id, callback) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], callback);
  },
create: (username, password, role, callback) => {
  db.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, password, role],
    callback
  );
},
};


module.exports = User;
