// Gerekli Kütüphaneleri Dahil Etme
const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// .env dosyasındaki ortam değişkenlerini yükle
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3306; 

// Middleware: Gelen JSON ve form verilerini işlemek için
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Frontend dosyalarına (CSS/JS/HTML) erişimi açar
app.use(express.static('public')); 

// 🎯 Veritabanı Bağlantı Havuzu
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT 
}).promise();

// 🚀 Bağlantı Testi (Sunucu Başlarken DB bağlantısını kontrol eder)
db.getConnection()
    .then(connection => {
        console.log("✅ MySQL Veritabanı Bağlantısı Başarılı!");
        connection.release(); 
    })
    .catch(err => {
        // Eğer bağlantı hatası veriyorsa, burası çalışır.
        console.error("❌ MySQL Bağlantı Hatası:", err.code);
        console.error("Lütfen MAMP portu, şifresi ve sunucu durumunu kontrol edin.");
        process.exit(1); 
    });

// ------------------------------------------------------------------
// -------------------- 🔑 API ROTASI: YÖNETİCİ GİRİŞİ --------------------
// ------------------------------------------------------------------

app.post('/api/yonetici/login', async (req, res) => {
    // Frontend'den gelen veriler
    const { kullanici_adi, sifre } = req.body; 

    // --- 🚨 HATA AYIKLAMA KODU 🚨 ---
    // Bu, tarayıcıdan gelen bilgiyi gösterir
    console.log(`\n[LOGIN DENEMESİ] Gelen Veri: K.Adı: ${kullanici_adi}, Şifre: ${sifre}`); 
    // ----------------------------------

    if (!kullanici_adi || !sifre) {
        return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gereklidir.' });
    }

    try {
        // 1. Kullanici tablosundan veriyi çek (Yetki seviyesi 'Yonetici' olanı arar)
        const [rows] = await db.execute(
            // Sütun adlarınızın (kullanici_ad) ve rol adınızın (Yonetici) doğru olduğundan emin olun!
            'SELECT doktor_id, sifre_hash FROM kullanici WHERE kullanici_ad = ? AND yetki_seviyesi = ?',
            [kullanici_adi, 'Yonetici'] 
        );

        // --- 🚨 HATA AYIKLAMA KODU 🚨 ---
        // Bu, DB'nin bir kayıt bulup bulmadığını gösterir
        console.log(`[DB SONUCU] Kayıt Sayısı: ${rows.length}`);
        if (rows.length > 0) {
            console.log(`[DB ŞİFRESİ] Tablodaki Şifre: ${rows[0].sifre_hash}`);
        }
        // ----------------------------------
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre yanlış.' });
        }

        const user = rows[0];
        
        // 2. Şifre Karşılaştırması (TRIM ile boşluklar temizlenerek düz metin karşılaştırması yapılır)
        if (user.sifre_hash.trim() === sifre.trim()) { 
            
            // 3. Giriş başarılı, psikolog adını al
            const [psikologRows] = await db.execute(
                'SELECT doktor_ad FROM psikolog WHERE doktor_id = ?',
                [user.doktor_id]
            );

            const doktorAd = psikologRows.length > 0 ? psikologRows[0].doktor_ad : 'Yönetici';

            return res.json({ 
                success: true, 
                message: 'Yönetici girişi başarılı!', 
                doktorId: user.doktor_id,
                doktorAd: doktorAd
            });
        } else {
            // Şifre yanlışsa
            console.log("❌ Şifre karşılaştırması başarısız oldu.");
            return res.status(401).json({ success: false, message: 'Şifre yanlış.' }); 
        }

    } catch (error) {
        // Eğer SQL sorgusunda bir yazım hatası varsa, sunucu burada çöker ve bu hatayı verir.
        console.error('YÖNETİCİ LOGIN KRİTİK HATA:', error); 
        return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});
// ------------------------------------------------------------------
// -------------------- 👤 API ROTASI: YENİ DANIŞAN EKLEME (INSERT) --------------------
// ------------------------------------------------------------------

app.post('/api/hastalar/ekle', async (req, res) => {
    // Frontend'den (hastakayitlari.html veya JavaScript'ten) gelen veriler
    const { hastaAd, hastaTel, hastaYas } = req.body; 

    // Basit doğrulama
    if (!hastaAd || !hastaTel || !hastaYas) {
        return res.status(400).json({ success: false, message: 'Ad, telefon ve yaş bilgileri gereklidir.' });
    }

    try {
        // SQL INSERT komutu
        const sql = `INSERT INTO hasta (hasta_ad, hasta_tel, hasta_yas) VALUES (?, ?, ?)`;
        
        // Veriyi güvenli bir şekilde veritabanına ekle
        const [result] = await db.execute(sql, [hastaAd, hastaTel, hastaYas]);
        
        // İşlem başarılıysa Frontend'e cevap gönder
        return res.json({ 
            success: true, 
            message: 'Danışan kaydı başarıyla eklendi.', 
            hastaId: result.insertId // Yeni eklenen hastanın ID'sini döndür
        });

    } catch (error) {
        console.error('Danışan Ekleme Hatası:', error);
        // Bu hata genellikle SQL sütun adı hatası veya veri tipi uyuşmazlığından kaynaklanır
        return res.status(500).json({ success: false, message: 'Sunucu ve veritabanı hatası.' });
    }
});

// ------------------------------------------------------------------
// -------------------- 🌐 TEMEL ROUTING VE SUNUCU BAŞLATMA --------------------
// ------------------------------------------------------------------

// Ana sayfaya (/) gelen isteği login.html sayfasına yönlendirir
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/pages/login.html');
});


// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
});