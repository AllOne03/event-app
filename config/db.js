const mysql = require('mysql2');

// Settingan default XAMPP
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // User standar XAMPP
    password: '',      // Password standar XAMPP (kosong)
    database: 'db_event_management' // Pastikan nama DB ini sama dengan di phpMyAdmin
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Gagal Konek Database: ' + err.stack);
        return;
    }
    console.log('✅ Berhasil Terkoneksi ke MySQL!');
});

module.exports = connection;