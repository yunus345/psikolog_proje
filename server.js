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
// -------------------- 👥 API ROTASI: DANIŞAN LİSTESİ (SELECT/READ) --------------------
// ------------------------------------------------------------------

app.get('/api/hastalar', async (req, res) => {
    try {
        // Tüm hasta kayıtlarını seç (listeleme için)
        const sql = `SELECT * FROM hasta`;
        const [hastalar] = await db.execute(sql);

        // Başarılı bir şekilde Frontend'e gönder
        return res.json({ 
            success: true, 
            hastalar: hastalar // Frontend'e gönderilen data: hastalar
        });

    } catch (error) {
        console.error('Danışan Listeleme Hatası:', error);
        return res.status(500).json({ success: false, message: 'Veri listelenirken sunucu hatası oluştu.' });
    }
});

// server.js'te /api/randevular/ekle rotası
app.post('/api/randevular/ekle', async (req, res) => {
    const { hastaId, psikologId, hizmetId, tarihSaat } = req.body; 
    const durum = 'Planlandı'; 

    console.log("Gelen Randevu Verisi:", req.body); // Frontend'den gelen veriyi kontrol eder

    if (!hastaId || !psikologId || !hizmetId || !tarihSaat) {
        // ... (hata döndürme) ...
    }

    try {
        // 🚨 KRİTİK ÇEVİRİM: MySQL DATETIME formatına çevirir
        const formattedTarihSaat = tarihSaat.replace('T', ' ') + ':00'; 
        
        const sql = `INSERT INTO randevu (hasta_id, doktor_id, hizmet_id, randevu_tarih, durum) VALUES (?, ?, ?, ?, ?)`;
        
        const [result] = await db.execute(sql, [hastaId, psikologId, hizmetId, formattedTarihSaat, durum]);
        
        // ... (Başarı dönüşü) ...

    } catch (error) {
        console.error('Randevu Ekleme KRİTİK HATA:', error); 
        return res.status(500).json({ success: false, message: 'Sunucu ve veritabanı hatası.' });
    }
});

// server.js dosyasına eklenecek kısım:

// ------------------------------------------------------------------
// -------------------- 📅 API ROTASI: DASHBOARD RANDEVU SAYILARI --------------------
// ------------------------------------------------------------------

app.get('/api/dashboard/randevu-sayilari', async (req, res) => {
    try {
        // 1. Bugünkü Randevu Sayısı
        const [today] = await db.execute(`
            SELECT COUNT(randevu_id) AS bugunku_randevu 
            FROM randevu 
            WHERE DATE(randevu_tarih) = CURDATE()
        `);
        const bugunkuRandevu = today[0].bugunku_randevu;

        // 2. Bu Ayki Randevu Sayısı
        const [monthly] = await db.execute(`
            SELECT COUNT(randevu_id) AS aylik_randevu 
            FROM randevu 
            WHERE MONTH(randevu_tarih) = MONTH(NOW()) 
            AND YEAR(randevu_tarih) = YEAR(NOW())
        `);
        const aylikRandevu = monthly[0].aylik_randevu;

        return res.json({ 
            success: true, 
            data: {
                bugunkuRandevu: bugunkuRandevu,
                aylikRandevu: aylikRandevu
            }
        });

    } catch (error) {
        console.error('Randevu Sayısı Çekme Hatası:', error);
        return res.status(500).json({ success: false, message: 'Randevu sayıları alınamadı.' });
    }
});
 
// server.js dosyasına eklenecek kısım:

// ------------------------------------------------------------------
// -------------------- 💰 API ROTASI: FİNANSAL ANALİZ (GELİR & BORÇ) --------------------
// ------------------------------------------------------------------

app.get('/api/dashboard/finans-analiz', async (req, res) => {
    try {
        // SQL sorgusu: Bu ayki ÖDENEN ve BEKLEYEN tutarları hesaplar
        const sql = `
            SELECT 
                SUM(CASE WHEN odeme_durumu = 'Ödendi' THEN tutar ELSE 0 END) AS toplam_gelir,
                SUM(CASE WHEN odeme_durumu = 'Bekleniyor' OR odeme_durumu = 'Kısmi Ödeme' THEN tutar ELSE 0 END) AS toplam_bekleyen
            FROM odeme
            WHERE MONTH(odeme_tarihi) = MONTH(NOW()) 
            AND YEAR(odeme_tarihi) = YEAR(NOW())
        `;
        const [result] = await db.execute(sql);

        const toplamGelir = result[0].toplam_gelir || 0;
        const toplamBekleyen = result[0].toplam_bekleyen || 0;

        return res.json({ 
            success: true, 
            data: {
                toplamGelir: toplamGelir,
                toplamBekleyen: toplamBekleyen
            }
        });

    } catch (error) {
        console.error('Finansal Analiz Hatası:', error);
        return res.status(500).json({ success: false, message: 'Finansal veriler alınamadı.' });
    }
});

// server.js dosyasına eklenecek kısım:

// ------------------------------------------------------------------
// -------------------- 📊 API ROTASI: AYLIK RANDEVU GRAFİĞİ --------------------
// ------------------------------------------------------------------

app.get('/api/analiz/aylik-randevu', async (req, res) => {
    // Frontend'den gelen yılı al (Varsayılan olarak mevcut yılı kullan)
    const year = req.query.yil || new Date().getFullYear(); 

    try {
        // SQL sorgusu: O yıla ait aylık randevu sayısını çeker
        const sql = `
            SELECT 
                MONTH(randevu_tarih) AS ay, 
                COUNT(randevu_id) AS randevuSayisi
            FROM randevu
            WHERE YEAR(randevu_tarih) = ?
            GROUP BY ay
            ORDER BY ay
        `;
        const [results] = await db.execute(sql, [year]);

        // Aylık sonuçları 12 ay için formatlar (veri olmayan aylar için 0)
        const aylikVeri = Array.from({ length: 12 }, (_, i) => ({ 
            ay: i + 1, 
            sayi: results.find(r => r.ay === i + 1)?.randevuSayisi || 0 
        }));

        return res.json({ 
            success: true, 
            data: aylikVeri
        });

    } catch (error) {
        console.error('Aylık Randevu Grafiği Hatası:', error);
        return res.status(500).json({ success: false, message: 'Aylık randevu verileri alınamadı.' });
    }
});


// ------------------------------------------------------------------
// -------------------- 🥧 API ROTASI: SEANS DAĞILIMI GRAFİĞİ --------------------
// ------------------------------------------------------------------

app.get('/api/analiz/seans-dagilimi', async (req, res) => {
    // Yıl filtresini al (şimdilik bu yıl varsayılır)
    const year = req.query.yil || new Date().getFullYear(); 

    try {
        // SQL sorgusu: Randevuları hizmet türüne göre gruplayıp sayar
        const sql = `
            SELECT 
                h.hizmet_turu AS turAdi, 
                COUNT(r.randevu_id) AS randevuAdet
            FROM randevu r
            JOIN hizmet h ON r.hizmet_id = h.hizmet_id
            WHERE YEAR(r.randevu_tarih) = ?
            GROUP BY h.hizmet_turu
            ORDER BY randevuAdet DESC
        `;
        const [results] = await db.execute(sql, [year]);

        return res.json({ 
            success: true, 
            data: results
        });

    } catch (error) {
        console.error('Seans Dağılım Grafiği Hatası:', error);
        return res.status(500).json({ success: false, message: 'Seans dağılım verileri alınamadı.' });
    }
});

// server.js dosyasına eklenecek kısım:

// ------------------------------------------------------------------
// -------------------- 📈 API ROTASI: AYLARA GÖRE TOPLAM GELİR --------------------
// ------------------------------------------------------------------

app.get('/api/analiz/aylik-gelir', async (req, res) => {
    // Frontend'den gelen yılı al
    const year = req.query.yil || new Date().getFullYear(); 

    try {
        // SQL sorgusu: O yıla ait aylık ÖDENEN toplam tutarı çeker
        const sql = `
            SELECT 
                MONTH(odeme_tarihi) AS ay, 
                SUM(tutar) AS toplamTutar
            FROM odeme
            WHERE YEAR(odeme_tarihi) = ? AND odeme_durumu = 'Ödendi'
            GROUP BY ay
            ORDER BY ay
        `;
        const [results] = await db.execute(sql, [year]);

        // Aylık sonuçları 12 ay için formatlar (veri olmayan aylar için 0)
        const aylikVeri = Array.from({ length: 12 }, (_, i) => ({ 
            ay: i + 1, 
            tutar: results.find(r => r.ay === i + 1)?.toplamTutar || 0 
        }));

        return res.json({ 
            success: true, 
            data: aylikVeri
        });

    } catch (error) {
        console.error('Aylık Gelir Grafiği Hatası:', error);
        return res.status(500).json({ success: false, message: 'Aylık gelir verileri alınamadı.' });
    }
});

// server.js dosyasına eklenecek kısım:

app.get('/api/analiz/gun-saat-yogunluk', async (req, res) => {
    try {
        // MySQL'de DAYOFWEEK 1=Pazar, 2=Pazartesi, ..., 7=Cumartesi'dir.
        const sql = `
            SELECT 
                DAYOFWEEK(randevu_tarih) AS gun_numarasi, 
                HOUR(randevu_tarih) AS saat,
                COUNT(randevu_id) AS toplam_adet
            FROM randevu
            WHERE DAYOFWEEK(randevu_tarih) >= 2 AND DAYOFWEEK(randevu_tarih) <= 6 -- Pazartesi-Cuma
            AND HOUR(randevu_tarih) >= 9 AND HOUR(randevu_tarih) <= 17 -- 09:00-17:00 arası
            GROUP BY gun_numarasi, saat
            ORDER BY gun_numarasi, saat
        `;
        const [results] = await db.execute(sql);

        return res.json({ 
            success: true, 
            data: results
        });

    } catch (error) {
        console.error('Gün/Saat Yoğunluk Analizi Hatası:', error);
        return res.status(500).json({ success: false, message: 'Yoğunluk verileri alınamadı.' });
    }
});

// server.js dosyasına eklenecek kısım:

// ------------------------------------------------------------------
// -------------------- 📅 API ROTASI: GÜN/SAAT YOĞUNLUK ANALİZİ --------------------
// ------------------------------------------------------------------

app.get('/api/analiz/gun-saat-yogunluk', async (req, res) => {
    try {
        // MySQL'de DAYOFWEEK 1=Pazar, 2=Pazartesi, ..., 7=Cumartesi'dir.
        // Biz Pazartesi'den Cuma'ya kadar olan günleri filtreliyoruz.
        const sql = `
            SELECT 
                DAYOFWEEK(randevu_tarih) AS gun_numarasi, 
                HOUR(randevu_tarih) AS saat,
                COUNT(randevu_id) AS toplam_adet
            FROM randevu
            WHERE DAYOFWEEK(randevu_tarih) >= 2 AND DAYOFWEEK(randevu_tarih) <= 6 -- Pazartesi-Cuma arası
            AND HOUR(randevu_tarih) >= 9 AND HOUR(randevu_tarih) <= 17 -- 09:00-17:00 arası
            GROUP BY gun_numarasi, saat
            ORDER BY gun_numarasi, saat
        `;
        const [results] = await db.execute(sql);

        // Frontend'e gün ve saat bazında sayım verilerini gönder
        return res.json({ 
            success: true, 
            data: results
        });

    } catch (error) {
        console.error('Gün/Saat Yoğunluk Analizi Hatası:', error);
        return res.status(500).json({ success: false, message: 'Yoğunluk verileri alınamadı.' });
    }
});

// server.js dosyasına eklenecek kısım:

// ------------------------------------------------------------------
// -------------------- 📅 API ROTASI: GÜNLÜK RANDEVU TAKVİMİ --------------------
// ------------------------------------------------------------------

app.get('/api/randevu-takvimi', async (req, res) => {
    // Frontend'den gelen tarihi al (Örn: 2025-11-25)
    const targetDate = req.query.tarih; 

    if (!targetDate) {
        return res.status(400).json({ success: false, message: 'Hedef tarih belirtilmelidir.' });
    }

    try {
        // SQL sorgusu: Belirtilen tarihe ait randevuları çeker ve hasta adıyla birleştirir
        const sql = `
            SELECT 
                r.randevu_id, 
                TIME_FORMAT(r.randevu_tarih, '%H:%i') AS randevu_saat,
                h.hasta_ad AS danisanAdi,
                r.durum
            FROM randevu r
            JOIN hasta h ON r.hasta_id = h.hasta_id
            WHERE DATE(r.randevu_tarih) = ?
            AND r.durum = 'Planlandı' -- Sadece planlanmış randevuları göster
            ORDER BY r.randevu_tarih ASC
        `;
        const [randevular] = await db.execute(sql, [targetDate]);

        return res.json({ 
            success: true, 
            randevular: randevular 
        });

    } catch (error) {
        console.error('Randevu Takvimi Veri Çekme Hatası:', error);
        return res.status(500).json({ success: false, message: 'Takvim verileri alınamadı.' });
    }
});

// server.js dosyasına eklenecek kısım:

// ------------------------------------------------------------------
// -------------------- 💳 API ROTASI: ÖDEME LİSTESİ (SELECT/READ) --------------------
// ------------------------------------------------------------------

app.get('/api/odemeler', async (req, res) => {
    try {
        console.log("Ödeme Listesi isteği alındı. JOIN sorgusu çalışıyor..."); 

       // server.js içindeki /api/odemeler rotası içinde SQL sorgusunu sadece bu kodla değiştirin:

// server.js içindeki /api/odemeler rotası içinde SQL sorgusunu değiştirin:

// server.js içindeki /api/odemeler rotası içinde SQL sorgusunu değiştirin:

// server.js içindeki /api/odemeler rotası içinde SQL sorgusunu değiştirin:

// server.js içindeki /api/odemeler rotası içinde SQL sorgusunu değiştirin:

// server.js içindeki /api/odemeler rotası içinde SQL sorgusunu değiştirin:

const sql = `
    SELECT 
        o.odeme_id, 
        r.randevu_tarih, 
        h.hasta_ad AS danisanAdi
    FROM odeme o
    LEFT JOIN randevu r ON o.randevu_id = r.randevu_id  
    LEFT JOIN hasta h ON r.hasta_id = h.hasta_id
    ORDER BY r.randevu_tarih DESC
`;
// ... (Kodun geri kalanı aynı kalır)
        const [odemeler] = await db.execute(sql);

        return res.json({ 
            success: true, 
            odemeler: odemeler 
        });

    } catch (error) {
        // 🚨 Kritik hata durumunda terminale bu mesajı yazar
        console.error('Ödeme Listesi Veri Çekme KRİTİK HATA:', error);
        return res.status(500).json({ success: false, message: 'Ödeme listesi alınamadı. Lütfen terminali kontrol edin.' });
    }
});

// ------------------------------------------------------------------
// -------------------- 🌐 TEMEL ROUTING VE SUNUCU BAŞLATMA (Devam) --------------------
// ------------------------------------------------------------------
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