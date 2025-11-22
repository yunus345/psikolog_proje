document.addEventListener('DOMContentLoaded', () => {
    // Butonu ID'si ile yakala
    const girisButonu = document.getElementById('girisButonu');
    const hataMesaji = document.getElementById('hata-mesaji');

    if (!girisButonu) return; // Buton yoksa devam etme

    // Butona tıklama olayını dinle
    girisButonu.addEventListener('click', async (event) => {
        
        // Input alanlarındaki değerleri oku
        const kullaniciAdi = document.getElementById('kullaniciAdi').value;
        const sifre = document.getElementById('sifre').value;

        if (hataMesaji) hataMesaji.textContent = ''; // Hata mesajını temizle

        if (!kullaniciAdi || !sifre) {
            if (hataMesaji) hataMesaji.textContent = 'Lütfen tüm alanları doldurun.';
            return;
        }

        // --- FETCH İSTEĞİ BURAYA GELECEK ---
        // (Buraya kadar sorunsuz geldiğimizden emin olmalıyız)
        console.log("FETCH İSTEĞİ BAŞLATILIYOR..."); 
        
        try {
            const response = await fetch('/api/yonetici/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kullanici_adi: kullaniciAdi, sifre: sifre }),
            });

            const data = await response.json();

            if (data.success) {
                // Giriş başarılı
                localStorage.setItem('doktorId', data.doktorId);
                window.location.href = 'yonetici_ekrani.html'; 
            } else {
                // Giriş başarısız
                if (hataMesaji) hataMesaji.textContent = data.message || 'Giriş bilgileri hatalı.';
            }
        } catch (error) {
            console.error('FETCH HATA:', error);
            if (hataMesaji) hataMesaji.textContent = 'Sunucuya ulaşılamıyor. Terminali kontrol edin.';
        }
    });
});