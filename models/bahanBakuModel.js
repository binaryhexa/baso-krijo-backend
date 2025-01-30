const db = require('../config/database');

const BahanBaku = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM bahan_baku ORDER BY created_at DESC', (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    },

    getById: (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM bahan_baku WHERE id = ?', [id], (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results[0]);
            });
        });
    },

    create: (bahanBakuData) => {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO bahan_baku (nama, jumlah, harga) VALUES (?, ?, ?)', 
                [bahanBakuData.nama, bahanBakuData.jumlah, bahanBakuData.harga],
                (error, results) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(results.insertId);
                }
            );
        });
    },

    update: (id, bahanBakuData) => {
        return new Promise((resolve, reject) => {
            db.query(
                'UPDATE bahan_baku SET nama = ?, jumlah = ?, harga = ? WHERE id = ?',
                [bahanBakuData.nama, bahanBakuData.jumlah, bahanBakuData.harga, id],
                (error, results) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(results.affectedRows > 0);
                }
            );
        });
    },

    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM bahan_baku WHERE id = ?', [id], (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results.affectedRows > 0);
            });
        });
    }
};

module.exports = BahanBaku;