require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,      // <-- Mengambil dari .env
    password: process.env.DB_PASSWORD, // <-- Mengambil dari .env
    database: process.env.DB_NAME   // <-- Mengambil dari .env
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Gagal Konek Database: ' + err.stack);
        return;
    }
    console.log('✅ Berhasil Terkoneksi ke MySQL!');
});

module.exports = connection;
