const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Data diterima di backend:', { username, password });

  User.findByUsername(username, (err, results) => {
    if (err) {
      console.error('Error query database:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan di server' });
    }

    if (results.length === 0) {
      console.log('Username tidak ditemukan');
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = results[0];
    console.log('User ditemukan:', user);

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error bcrypt.compare:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan di server' });
      }

      if (!isMatch) {
        console.log('Password tidak cocok');
        return res.status(401).json({ message: 'Username atau password salah' });
      }

      const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log('Token dibuat:', token);
      res.json({ token, role: user.role, username: user.username });
    });
  });
});

// Register route
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }

  // Check if user already exists
  User.findByUsername(username, async (err, results) => {
    if (err) {
      console.error('Error checking existing user:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan di server' });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'Username sudah digunakan' });
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user into the database
      User.create(username, hashedPassword, role, (err, result) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).json({ message: 'Terjadi kesalahan di server' });
        }

        res.status(201).json({ message: 'User berhasil didaftarkan' });
      });
    } catch (err) {
      console.error('Error hashing password:', err);
      res.status(500).json({ message: 'Terjadi kesalahan di server' });
    }
  });
});


// Get all users
router.get('/users', (req, res) => {
  User.getAll((err, results) => {
    if (err) {
      console.error('Error query database:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan di server' });
    }
    res.json(results);
  });
});

// Get user by ID
router.get('/users/:id', (req, res) => {
  const userId = req.params.id;

  User.findById(userId, (err, result) => {
    if (err) {
      console.error('Error query database:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan di server' });
    }

    if (!result) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(result);
  });
});

module.exports = router;
