const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const menuItems = [
  { id: 1, name: 'Bakso Mercon', harga: 15000, image_link: 'http://localhost:5000/public/images/Mercon.jpg', category: 'Makanan' },
  { id: 2, name: 'Bakso Tetelan', harga: 15000, image_link: 'http://localhost:5000/public/images/Bakso.jpeg', category: 'Makanan' },
  { id: 3, name: 'Es Teh Manis', harga: 5000, image_link: 'http://localhost:5000/public/images/TehManis.jpg', category: 'Minuman' },
  { id: 4, name: 'Es Jeruk', harga: 7000, image_link: 'http://localhost:5000/public/images/EsJeruk.jpg', category: 'Minuman' },
  { id: 5, name: 'Kerupuk', harga: 2000, image_link: 'http://localhost:5000/public/images/Kerupuk.jpg', category: 'Toping' },
  { id: 6, name: 'Bawang Goreng', harga: 1000, image_link: 'http://localhost:5000/public/images/BawangGoreng.jpeg', category: 'Toping' },
];

app.get('/api/menu', (req, res) => {
  const { category } = req.query;

  if (category) {
    if (category === 'Semua Menu') {
      return res.json(menuItems);
    }
    const filteredItems = menuItems.filter(item => item.category === category);
    return res.json(filteredItems);
  }

  res.json(menuItems);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
