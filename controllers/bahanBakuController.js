const BahanBaku = require('../models/bahanBakuModel');

const bahanBakuController = {
    getAllBahanBaku: async (req, res) => {
        try {
            const bahanBaku = await BahanBaku.getAll();
            res.json({
                status: 'success',
                data: bahanBaku
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mengambil data bahan baku'
            });
        }
    },

    getBahanBakuById: async (req, res) => {
        try {
            const bahanBaku = await BahanBaku.getById(req.params.id);
            if (bahanBaku) {
                res.json({
                    status: 'success',
                    data: bahanBaku
                });
            } else {
                res.status(404).json({
                    status: 'error',
                    message: 'Bahan baku tidak ditemukan'
                });
            }
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mengambil data bahan baku'
            });
        }
    },

    createBahanBaku: async (req, res) => {
        try {
            const { nama, jumlah, harga } = req.body;
            
            if (!nama || !jumlah || !harga) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Nama, jumlah, dan harga harus diisi'
                });
            }

            const insertId = await BahanBaku.create({ nama, jumlah, harga });
            const newBahanBaku = await BahanBaku.getById(insertId);
            
            res.status(201).json({
                status: 'success',
                message: 'Bahan baku berhasil ditambahkan',
                data: newBahanBaku
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat menambahkan bahan baku'
            });
        }
    },

    updateBahanBaku: async (req, res) => {
        try {
            const { nama, jumlah, harga } = req.body;
            const { id } = req.params;

            if (!nama || !jumlah || !harga) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Nama, jumlah, dan harga harus diisi'
                });
            }

            const success = await BahanBaku.update(id, { nama, jumlah, harga });
            
            if (success) {
                const updatedBahanBaku = await BahanBaku.getById(id);
                res.json({
                    status: 'success',
                    message: 'Bahan baku berhasil diperbarui',
                    data: updatedBahanBaku
                });
            } else {
                res.status(404).json({
                    status: 'error',
                    message: 'Bahan baku tidak ditemukan'
                });
            }
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat memperbarui bahan baku'
            });
        }
    },

    deleteBahanBaku: async (req, res) => {
        try {
            const success = await BahanBaku.delete(req.params.id);
            
            if (success) {
                res.json({
                    status: 'success',
                    message: 'Bahan baku berhasil dihapus'
                });
            } else {
                res.status(404).json({
                    status: 'error',
                    message: 'Bahan baku tidak ditemukan'
                });
            }
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat menghapus bahan baku'
            });
        }
    }
};

module.exports = bahanBakuController;