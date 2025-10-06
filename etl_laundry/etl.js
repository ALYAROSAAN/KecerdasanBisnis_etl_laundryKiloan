const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./laundry.sqlite');

db.serialize(() => {
    console.log("--- Memulai Proses ETL ---");

    db.run(`DROP TABLE IF EXISTS dim_waktu`);
    db.run(`DROP TABLE IF EXISTS dim_pelanggan`);
    db.run(`DROP TABLE IF EXISTS dim_layanan`);
    db.run(`DROP TABLE IF EXISTS fact_laundry_sales`);

    console.log("Membuat tabel DWH...");
    db.run(`CREATE TABLE dim_waktu (
        id_waktu TEXT PRIMARY KEY,
        tanggal TEXT,
        bulan INTEGER,
        tahun INTEGER
    );`);

    db.run(`CREATE TABLE dim_pelanggan (
        id_pelanggan INTEGER PRIMARY KEY,
        nama_pelanggan TEXT
    );`);

    db.run(`CREATE TABLE dim_layanan (
        id_layanan INTEGER PRIMARY KEY,
        nama_layanan TEXT
    );`);

    db.run(`CREATE TABLE fact_laundry_sales (
        id_fact INTEGER PRIMARY KEY AUTOINCREMENT,
        id_waktu TEXT,
        id_pelanggan INTEGER,
        id_layanan INTEGER,
        berat_kg REAL,
        total_pendapatan REAL,
        durasi_pengerjaan_hari INTEGER
    );`);

    console.log("Memuat data ke tabel dimensi...");
    db.run(`INSERT INTO dim_pelanggan (id_pelanggan, nama_pelanggan)
            SELECT id_pelanggan, nama_pelanggan FROM pelanggan;`);
            
    db.run(`INSERT INTO dim_layanan (id_layanan, nama_layanan)
            SELECT id_layanan, nama_layanan FROM layanan;`);

    db.run(`INSERT OR IGNORE INTO dim_waktu (id_waktu, tanggal, bulan, tahun)
            SELECT DISTINCT
                strftime('%Y%m%d', tanggal_masuk),
                tanggal_masuk,
                strftime('%m', tanggal_masuk),
                strftime('%Y', tanggal_masuk)
            FROM orders WHERE status = 'Selesai';`);
    
    console.log("Memuat data ke tabel fakta...");
    db.run(`INSERT INTO fact_laundry_sales (id_waktu, id_pelanggan, id_layanan, berat_kg, total_pendapatan, durasi_pengerjaan_hari)
            SELECT
                strftime('%Y%m%d', o.tanggal_masuk),
                o.id_pelanggan,
                o.id_layanan,
                o.berat_kg,
                o.total_harga,
                CAST(julianday(o.tanggal_selesai) - julianday(o.tanggal_masuk) AS INTEGER)
            FROM orders o
            WHERE o.status = 'Selesai';`);
    
    console.log("Proses ETL Selesai.");

db.all(`SELECT * FROM fact_laundry_sales`, (err, rows) => {
    if (err) throw err;
    console.log("\n Hasil Data di Tabel Fact:");
    console.table(rows);

    db.all(`SELECT * FROM dim_pelanggan`, (err2, rows2) => {
        if (err2) throw err2;
        console.log("\nData Dimensi Pelanggan:");
        console.table(rows2);

        db.all(`SELECT * FROM dim_layanan`, (err3, rows3) => {
            if (err3) throw err3;
            console.log("\nData Dimensi Layanan:");
            console.table(rows3);

            const queryAnalisis = `
                SELECT
                    p.nama_pelanggan,
                    SUM(f.berat_kg) as total_berat_kg
                FROM fact_laundry_sales f
                JOIN dim_pelanggan p ON f.id_pelanggan = p.id_pelanggan
                GROUP BY p.nama_pelanggan
                ORDER BY total_berat_kg DESC;
            `;
            db.all(queryAnalisis, (err4, rows4) => {
                if (err4) throw err4;
                console.log("\nRingkasan Total Berat (Kg) per Pelanggan:");
                console.table(rows4);
                db.close(); 
            });
        });
    });
});
});