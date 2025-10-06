const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./laundry.sqlite');

db.serialize(() => {
    console.log("--- Memulai Setup Database OLTP ---");
    db.run(`DROP TABLE IF EXISTS pelanggan`);
    db.run(`DROP TABLE IF EXISTS layanan`);
    db.run(`DROP TABLE IF EXISTS orders`);

    // Buat tabel-tabel OLTP
    console.log("Membuat tabel OLTP...");
    db.run(`CREATE TABLE pelanggan (
        id_pelanggan INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_pelanggan TEXT,
        nomor_telepon TEXT
    );`);

    db.run(`CREATE TABLE layanan (
        id_layanan INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_layanan TEXT,
        harga_per_kg REAL
    );`);

    db.run(`CREATE TABLE orders (
        id_order INTEGER PRIMARY KEY AUTOINCREMENT,
        id_pelanggan INTEGER,
        id_layanan INTEGER,
        tanggal_masuk TEXT,
        tanggal_selesai TEXT,
        berat_kg REAL,
        total_harga REAL,
        status TEXT
    );`);

    //dummy data
    console.log("Memasukkan data dummy...");
    db.run(`INSERT INTO layanan (nama_layanan, harga_per_kg) VALUES
        ('Cuci Kering Setrika', 8000),
        ('Cuci Kering Saja', 5000),
        ('Setrika Saja', 4000);`);

    db.run(`INSERT INTO pelanggan (nama_pelanggan, nomor_telepon) VALUES
        ('Budi Santoso', '08123456'),
        ('Ani Lestari', '08765432'),
        ('Candra Wijaya', '08987654');`);

    db.run(`INSERT INTO orders (id_pelanggan, id_layanan, tanggal_masuk, tanggal_selesai, berat_kg, total_harga, status) VALUES
        (1, 1, '2025-10-01', '2025-10-03', 5.5, 44000, 'Selesai'),
        (2, 2, '2025-10-02', '2025-10-03', 3.0, 15000, 'Selesai'),
        (3, 1, '2025-10-04', NULL, 7.2, 57600, 'Dicuci'),
        (1, 3, '2025-10-05', '2025-10-06', 4.0, 16000, 'Selesai');`);

    console.log("✅ Setup database OLTP selesai.");
});

db.close();