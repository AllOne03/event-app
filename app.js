require('dotenv').config();
console.log("--------------------------------------");
console.log("DEBUGGING ENV:");
console.log("DB_USER dari .env:", process.env.DB_USER);
console.log("DB_NAME dari .env:", process.env.DB_NAME);
console.log("--------------------------------------");

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session'); // UNTUK SESI LOGIN
const bcrypt = require('bcryptjs');         // UNTUK AMANKAN PASSWORD
const db = require('./config/db');
const multer = require('multer');
const path = require('path');
// --- KONFIGURASI UPLOAD GAMBAR (MULTER) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Simpan di folder public/uploads
    },
    filename: (req, file, cb) => {
        // Nama file = unix_timestamp + ekstensi asli (biar gak bentrok)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
const app = express();
const port = 3000;


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// --- KONFIGURASI SESI ---
app.use(session({
    secret: 'kunci_rahasia_saya', // Bebas diisi apa saja
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Sesi bertahan 1 jam
}));

// --- MIDDLEWARE: Agar data user bisa dibaca di semua halaman ---
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ================= ROUTES AUTH (LOGIN & REGISTER) =================

// 1. Halaman Login
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// 2. Proses Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        
        if (results.length > 0) {
            const user = results[0];
            // Cek Password (apakah cocok dengan yang di database?)
            // Catatan: Untuk user dummy 'admin' passwordnya belum di-hash, jadi kita cek manual dulu
            let isMatch = false;
            if(user.password_hash === password) {
                 isMatch = true; // Khusus user dummy manual
            } else if (bcrypt.compareSync(password, user.password_hash)) {
                 isMatch = true; // Untuk user hasil register
            }

            if (isMatch) {
                req.session.user = { id: user.user_id, name: user.full_name, role: user.role };
                return res.redirect('/'); // Berhasil -> Ke Home
            }
        }
        res.render('login', { error: 'Email atau Password salah!' });
    });
});

// 3. Halaman Register
app.get('/register-akun', (req, res) => {
    res.render('register_akun');
});

// 4. Proses Register
app.post('/register-akun', (req, res) => {
    const { full_name, email, password } = req.body;
    
    // Enkripsi Password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const sql = "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'attendee')";
    
    db.query(sql, [full_name, email, hash], (err, result) => {
        if (err) return res.send("Email sudah terdaftar!");
        res.redirect('/login'); // Sukses -> Suruh Login
    });
});

// 5. Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// --- PROSES BELI TIKET (TRANSAKSI) ---
app.post('/register-event', (req, res) => {
    // 1. Cek apakah user sudah login?
    if (!req.session.user) {
        return res.send("<script>alert('Harap Login terlebih dahulu!'); window.location.href='/login';</script>");
    }

    const { event_id, ticket_id } = req.body;
    const userId = req.session.user.id; // Ambil ID user dari sesi login
    const userName = req.session.user.name;

    // 2. Buat Kode Booking Unik (Contoh: BK-171509...)
    const bookingCode = 'BK-' + Date.now();
    
    // 3. Simpan ke Database
    const sqlReg = `INSERT INTO registrations (event_id, user_id, ticket_id, booking_code, status) VALUES (?, ?, ?, ?, 'paid')`;

    db.query(sqlReg, [event_id, userId, ticket_id, bookingCode], (err, result) => {
        if (err) {
            console.error(err);
            return res.send("Gagal memproses transaksi.");
        }

	// 4. Siapkan Query Kurangi Kuota
    	// "Kurangi kolom quota sebanyak 1 dimana ticket_id-nya sesuai"
    	const sqlUpdateQuota = "UPDATE ticket_types SET quota = quota - 1 WHERE ticket_id = ?";

    	// 5. Jalankan Update
    	// Pastikan variabel 'ticketId' sama dengan yang dipakai di query insert di atas
    	db.query(sqlUpdateQuota, [ticket_id], (errUpdate, resultUpdate) => {
        	if (errUpdate) {
            	console.error("Gagal update kuota:", errUpdate);
            	// Tetap lanjut redirect walau update gagal (opsional)
        	}

        	// 6. Baru Redirect setelah update selesai
        	res.redirect('/my-tickets'); 
    	});		  		
        
        // 7. Tampilkan Halaman Sukses Sederhana
        res.send(`
            <div style="text-align:center; padding: 50px; font-family: sans-serif;">
                <h1 style="color:green;">✅ Transaksi Berhasil!</h1>
                <p>Terima kasih <b>${userName}</b>.</p>
                <p>Tiket Anda berhasil dipesan.</p>
                <div style="background:#f0f0f0; padding:20px; display:inline-block; border-radius:10px; margin:20px 0;">
                    <h3>Kode Booking: ${bookingCode}</h3>
                </div>
                <br>
                <a href="/event/${event_id}">Kembali ke Event</a> | <a href="/">Ke Halaman Utama</a>
            </div>
        `);
    });
});

// --- HALAMAN TIKET SAYA (RIWAYAT PEMBELIAN) ---
app.get('/tiket-saya', (req, res) => {
    // 1. Cek Login (Wajib)
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.session.user.id;

    // 2. Query JOIN (Ambil data Registrasi + Event + Venue + Tipe Tiket)
    // Kita urutkan dari pembelian terbaru (DESC)
    const sql = `
        SELECT 
            registrations.*, 
            events.title AS event_title, 
            events.start_date, 
            events.end_date,
            venues.name AS venue_name,
            ticket_types.name AS ticket_name,
            ticket_types.price
        FROM registrations
        JOIN events ON registrations.event_id = events.event_id
        JOIN venues ON events.venue_id = venues.venue_id
        JOIN ticket_types ON registrations.ticket_id = ticket_types.ticket_id
        WHERE registrations.user_id = ?
        ORDER BY registrations.registration_date DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) throw err;
        // Kirim data ke tampilan
        res.render('tiket_saya', { tickets: results });
    });
});


// ================= ROUTES HALAMAN UTAMA =================

app.get('/', (req, res) => {
    // PERBAIKAN: Tambahkan "WHERE events.status = 'published'"
    // Kita juga pakai JOIN agar Nama Kategori & Lokasi tetap muncul
    const sql = `
        SELECT events.*, venues.name as venue_name, categories.name as category_name 
        FROM events 
        JOIN venues ON events.venue_id = venues.venue_id
        JOIN categories ON events.category_id = categories.category_id
        WHERE events.status = 'published'
        ORDER BY events.start_date ASC
    `;
    
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('index', { events: results });
    });
});

// --- HALAMAN DETAIL EVENT (PUBLIK) ---
// --- HALAMAN DETAIL EVENT (PERBAIKAN NAMA KOLOM) ---
app.get('/event/:id', (req, res) => {
    const eventId = req.params.id;

    const sqlEvent = `
        SELECT 
            events.*, 
            venues.name AS venue_name, 
            venues.city,
            users.full_name AS organizer_name,  /* PERBAIKAN: Gunakan full_name */
            categories.name AS category_name,
            sessions.title AS session_title, 
            sessions.start_time, 
            sessions.end_time
        FROM events
        JOIN venues ON events.venue_id = venues.venue_id
        JOIN users ON events.organizer_id = users.user_id
        JOIN categories ON events.category_id = categories.category_id
        LEFT JOIN sessions ON events.event_id = sessions.event_id
        WHERE events.event_id = ?
    `;

    db.query(sqlEvent, [eventId], (err, result) => {
        if (err) throw err;
        
        if (result.length > 0) {
            const eventData = result[0];

            // Ambil Tiket
            const sqlTickets = `SELECT * FROM ticket_types WHERE event_id = ?`;
            db.query(sqlTickets, [eventId], (err, tickets) => {
                if (err) throw err;

                res.render('detail', { 
                    user: req.session.user || null,
                    event: eventData, 
                    tickets: tickets 
                });
            });

        } else {
            res.send("Event tidak ditemukan");
        }
    });
});

// ================= ROUTES ADMIN (KHUSUS PENYELENGGARA) =================

// Middleware: Pengecekan apakah user adalah Admin/Organizer?
function cekAdmin(req, res, next) {
    // Cek session ada? DAN role-nya 'admin' ATAU 'organizer'?
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'organizer')) {
        return next(); // Boleh masuk, lanjut ke fungsi berikutnya
    }
    // Jika tidak memenuhi syarat:
    res.send("<h1>Akses Ditolak!</h1><p>Anda bukan Admin/Panitia.</p><a href='/'>Kembali</a>");
}

// Halaman Dashboard Admin
// ================= FITUR TAMBAH EVENT (CRUD) =================

// --- DASHBOARD (LOGIKA PEMISAH 3 AKTOR) ---
// --- DASHBOARD (LOGIKA PEMISAH 3 AKTOR + DATA PESERTA) ---

// --- DASHBOARD (LOGIKA PEMISAH 3 AKTOR + DATA PESERTA) ---
app.get('/admin', cekAdmin, (req, res) => {
    const userRole = req.session.user.role;
    const userId = req.session.user.id;

    // 1. SIAPKAN QUERY UNTUK EVENT
    let sqlEvents;
    let params = [];

    if (userRole === 'admin') {
        sqlEvents = `
            SELECT events.*, venues.name as venue_name, users.full_name as organizer_name,
            (SELECT COUNT(*) FROM registrations WHERE registrations.event_id = events.event_id) as total_peserta,
            (SELECT SUM(quota) FROM ticket_types WHERE ticket_types.event_id = events.event_id) AS sisa_seat
            FROM events 
            JOIN venues ON events.venue_id = venues.venue_id
            JOIN users ON events.organizer_id = users.user_id
            ORDER BY start_date DESC`;
    } else {
        sqlEvents = `
            SELECT events.*, venues.name as venue_name, 
            (SELECT COUNT(*) FROM registrations WHERE registrations.event_id = events.event_id) as total_peserta,
            (SELECT SUM(quota) FROM ticket_types WHERE ticket_types.event_id = events.event_id) AS sisa_seat
            FROM events 
            JOIN venues ON events.venue_id = venues.venue_id
            WHERE events.organizer_id = ? 
            ORDER BY start_date DESC`;
        params = [userId];
    }

    // 2. JALANKAN QUERY EVENT
    db.query(sqlEvents, params, (err, resultEvents) => {
        if (err) throw err;

        // 3. SIAPKAN QUERY UNTUK PESERTA (Agar list_peserta tidak undefined)
        let sqlPeserta;
        let paramsPeserta = [];

        if (userRole === 'admin') {
             sqlPeserta = `
                SELECT registrations.*, users.full_name AS nama_peserta, events.title AS nama_event 
                FROM registrations
                JOIN users ON registrations.user_id = users.user_id
                JOIN events ON registrations.event_id = events.event_id
                ORDER BY registrations.registration_date DESC
            `;
        } else {
             sqlPeserta = `
                SELECT registrations.*, users.full_name AS nama_peserta, events.title AS nama_event 
                FROM registrations
                JOIN users ON registrations.user_id = users.user_id
                JOIN events ON registrations.event_id = events.event_id
                WHERE events.organizer_id = ?
                ORDER BY registrations.registration_date DESC
            `;
            paramsPeserta = [userId];
        }

        // 4. JALANKAN QUERY PESERTA
        db.query(sqlPeserta, paramsPeserta, (err2, resultPeserta) => {
            if (err2) throw err2;

            // 5. KIRIM KEDUA DATA KE VIEW
            res.render('admin', { 
                events: resultEvents, 
                list_peserta: resultPeserta, // <--- INI KUNCINYA
                adminName: req.session.user.name,
                role: userRole 
            });
        });
    });
});

// 1. GET: Tampilkan Form Tambah (Wajib ada biar gak error Cannot GET)
app.get('/admin/create', cekAdmin, (req, res) => {
    // Ambil data Kategori & Venue buat Dropdown
    db.query('SELECT * FROM categories', (err, categories) => {
        if (err) throw err;
        db.query('SELECT * FROM venues', (err, venues) => {
            if (err) throw err;
            res.render('tambah_event', { categories, venues });
        });
    });
});

// 2. POST: Proses Simpan ke Database (Lengkap dengan Gambar & Loop Tiket)
app.post('/admin/create', cekAdmin, upload.single('image'), (req, res) => {
    const { 
        title, category_id, venue_id, description, start_date, end_date, 
        session_title, start_time, end_time, 
        ticket_names, ticket_prices, ticket_quotas 
    } = req.body;

    const organizerId = req.session.user.id;
    const imageFilename = req.file ? req.file.filename : null; // Ambil nama file

    // A. INSERT EVENT
    const sqlEvent = `INSERT INTO events (organizer_id, venue_id, category_id, title, description, start_date, end_date, image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')`;

    db.query(sqlEvent, [organizerId, venue_id, category_id, title, description, start_date, end_date, imageFilename], (err, result) => {
        if (err) throw err;
        
        const newEventId = result.insertId;

        // B. INSERT TIKET (LOOPING)
        const names = Array.isArray(ticket_names) ? ticket_names : [ticket_names];
        const prices = Array.isArray(ticket_prices) ? ticket_prices : [ticket_prices];
        const quotas = Array.isArray(ticket_quotas) ? ticket_quotas : [ticket_quotas];

        for (let i = 0; i < names.length; i++) {
            if (!names[i] || names[i].trim() === "") continue;
            const sqlTicket = `INSERT INTO ticket_types (event_id, name, price, quota) VALUES (?, ?, ?, ?)`;
            db.query(sqlTicket, [newEventId, names[i], prices[i], quotas[i]]);
        }

        // C. INSERT SESI
        const sqlSession = `INSERT INTO sessions (event_id, title, start_time, end_time, room_name) VALUES (?, ?, ?, ?, 'Main Hall')`;
        db.query(sqlSession, [newEventId, session_title, start_time, end_time], (err, resSession) => {
            res.redirect('/admin');
        });
    });
});

// --- FITUR HAPUS EVENT ---
app.post('/admin/delete/:id', cekAdmin, (req, res) => {
    const eventId = req.params.id;
    
    // Karena kita pakai ON DELETE CASCADE di database,
    // Kita cukup hapus induknya (Event), maka Sesi, Tiket, dan Registrasi akan otomatis terhapus bersih.
    const sql = `DELETE FROM events WHERE event_id = ?`;

    db.query(sql, [eventId], (err, result) => {
        if (err) throw err;
        res.redirect('/admin'); // Refresh halaman admin
    });
});

// --- FITUR EDIT EVENT (HALAMAN FORM) ---
app.get('/admin/edit/:id', cekAdmin, (req, res) => {
    const eventId = req.params.id;

    // 1. Ambil Data Event yang mau diedit
    db.query('SELECT * FROM events WHERE event_id = ?', [eventId], (err, eventResult) => {
        if (err) throw err;
        if (eventResult.length === 0) return res.redirect('/admin');

        // 2. Ambil Data Kategori (untuk dropdown)
        db.query('SELECT * FROM categories', (err, categories) => {
            
            // 3. Ambil Data Lokasi (untuk dropdown)
            db.query('SELECT * FROM venues', (err, venues) => {
                
                // Kirim semua data ke view 'edit_event.ejs'
                res.render('edit_event', { 
                    event: eventResult[0], 
                    categories: categories, 
                    venues: venues 
                });
            });
        });
    });
});

// --- PROSES UPDATE (REVISI: SUPPORT GANTI GAMBAR) ---
app.post('/admin/update/:id', cekAdmin, upload.single('image'), (req, res) => {
    const eventId = req.params.id;
    const { title, category_id, venue_id, description, start_date, end_date, status } = req.body;

    // SKENARIO 1: User Upload Gambar Baru
    if (req.file) {
        const sql = `
            UPDATE events 
            SET title = ?, category_id = ?, venue_id = ?, description = ?, start_date = ?, end_date = ?, status = ?, image = ?
            WHERE event_id = ?
        `;
        // Masukkan req.file.filename ke urutan parameter
        db.query(sql, [title, category_id, venue_id, description, start_date, end_date, status, req.file.filename, eventId], (err, result) => {
            if (err) throw err;
            res.redirect('/admin');
        });
    } 
    // SKENARIO 2: User Tidak Upload Gambar (Pakai Gambar Lama)
    else {
        const sql = `
            UPDATE events 
            SET title = ?, category_id = ?, venue_id = ?, description = ?, start_date = ?, end_date = ?, status = ?
            WHERE event_id = ?
        `;
        // Tidak ada parameter image
        db.query(sql, [title, category_id, venue_id, description, start_date, end_date, status, eventId], (err, result) => {
            if (err) throw err;
            res.redirect('/admin');
        });
    }
});

// 2. Proses Simpan ke Database (Support Multi Tiket)
app.post('/admin/create', cekAdmin, (req, res) => {
    const { 
        title, category_id, venue_id, description, start_date, end_date, // Data Event
        session_title, start_time, end_time, // Data Sesi
        ticket_names, ticket_prices, ticket_quotas // Data Tiket (Array)
    } = req.body;

    const organizerId = req.session.user.id;

    // A. INSERT EVENT
    const sqlEvent = `INSERT INTO events (organizer_id, venue_id, category_id, title, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`;

    db.query(sqlEvent, [organizerId, venue_id, category_id, title, description, start_date, end_date], (err, result) => {
        if (err) throw err;
        
        const newEventId = result.insertId; // ID Event Baru

        // B. INSERT TIKET (LOOPING)
        // Kita loop array ticket_names
        // Fungsi helper: Pastikan data selalu dalam bentuk array (jika user cuma isi 1)
        const names = Array.isArray(ticket_names) ? ticket_names : [ticket_names];
        const prices = Array.isArray(ticket_prices) ? ticket_prices : [ticket_prices];
        const quotas = Array.isArray(ticket_quotas) ? ticket_quotas : [ticket_quotas];

        // Loop setiap input tiket
        for (let i = 0; i < names.length; i++) {
            // Cek: Kalau nama tiket kosong (user tidak isi slot 2/3), lewati (jangan simpan)
            if (!names[i] || names[i].trim() === "") continue;

            const sqlTicket = `INSERT INTO ticket_types (event_id, name, price, quota) VALUES (?, ?, ?, ?)`;
            db.query(sqlTicket, [newEventId, names[i], prices[i], quotas[i]]);
        }

        // C. INSERT SESI PERTAMA
        const sqlSession = `INSERT INTO sessions (event_id, title, start_time, end_time, room_name) VALUES (?, ?, ?, ?, 'Main Hall')`;
        db.query(sqlSession, [newEventId, session_title, start_time, end_time], (err, resSession) => {
            res.redirect('/admin');
        });
    });
});

// --- FITUR EDIT PROFIL (User) ---

// 1. Tampilkan Halaman Edit Profil
// --- FITUR EDIT PROFIL (User) ---

// 1. Tampilkan Halaman Edit Profil
app.get('/profile/edit', (req, res) => {
    // PERBAIKAN: Cek req.session.user (bukan userId)
    if (!req.session.user) return res.redirect('/login');

    const userId = req.session.user.id; // Ambil ID dari objek user

    // Ambil data terbaru dari DB
    db.query("SELECT * FROM users WHERE user_id = ?", [userId], (err, result) => {
        if (err) throw err;
        // Pastikan user ditemukan
        if (result.length > 0) {
            res.render('edit_profile', { user: result[0] });
        } else {
            res.redirect('/login');
        }
    });
});

// 2. Proses Update Data
app.post('/profile/update', (req, res) => {
    // PERBAIKAN: Cek req.session.user
    if (!req.session.user) return res.redirect('/login');

    const { full_name, email, password } = req.body;
    const userId = req.session.user.id; // Ambil ID dari objek user

    // Cek apakah user ingin ganti password atau tidak
    let sqlUpdate;
    let params;

    if (password) {
        // Update password juga
        // (Catatan: Sebaiknya di-hash menggunakan bcrypt seperti saat register, tapi ini versi simple dulu)
        // Jika ingin aman: const hash = bcrypt.hashSync(password, 10);
        // Lalu gunakan 'hash' di query update.
        
        sqlUpdate = "UPDATE users SET full_name = ?, email = ?, password_hash = ? WHERE user_id = ?";
        // params = [full_name, email, hash, userId]; // Jika pakai hash
        params = [full_name, email, password, userId]; // Jika plain text (sesuai kode login Anda saat ini)
    } else {
        // Update nama & email saja
        sqlUpdate = "UPDATE users SET full_name = ?, email = ? WHERE user_id = ?";
        params = [full_name, email, userId];
    }

    db.query(sqlUpdate, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.send("Gagal update profil.");
        }
        
        // Update session nama agar tampilan di navbar berubah seketika
        req.session.user.name = full_name;
        
        // Kembali ke home
        res.redirect('/'); 
    });
});
// --- FITUR HAPUS TRANSAKSI (Admin) ---

app.post('/admin/registrations/delete/:id', (req, res) => {
    // Pastikan yang akses adalah admin (sesuaikan logika auth Anda)
    // if (req.session.role !== 'admin') return res.redirect('/');

    const registrationId = req.params.id;

    // LOGIC: Sebelum hapus, ambil data dulu untuk tahu tiket apa yang dihapus
    // Supaya kita bisa kembalikan KUOTA-nya (+1)
    
    // 1. Cari info tiketnya
    const sqlGetInfo = "SELECT ticket_id FROM registrations WHERE registration_id = ?";
    
    db.query(sqlGetInfo, [registrationId], (err, result) => {
        if (err || result.length === 0) return res.redirect('/admin');
        
        const ticketId = result[0].ticket_id;

        // 2. Hapus Data Transaksi
        const sqlDelete = "DELETE FROM registrations WHERE registration_id = ?";
        
        db.query(sqlDelete, [registrationId], (errDel) => {
            if (errDel) console.error(errDel);

            // 3. Kembalikan Kuota (Update ticket_types)
            const sqlRestoreQuota = "UPDATE ticket_types SET quota = quota + 1 WHERE ticket_id = ?";
            
            db.query(sqlRestoreQuota, [ticketId], () => {
                // Selesai, kembali ke dashboard
                res.redirect('/admin');
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server update berjalan di http://localhost:${port}`);
});
