const db = require('../config/database');

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
