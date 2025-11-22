document.addEventListener('DOMContentLoaded', () => {
    // Formu ID ile yakala (Button yerine formu dinlemek daha güvenlidir)
    const form = document.getElementById('danisanEklemeFormu');
    const mesajAlani = document.getElementById('mesajAlani');

    // Eğer form yoksa veya mesaj alanı yoksa (hatalı yükleme) dur.
    if (!form || !mesajAlani) {
        console.warn("Danışan Ekleme Formu veya Mesaj Alanı bulunamadı. JS çalışmıyor.");
        return; 
    } 

    // Form gönderildiğinde (Submit edildiğinde) çalışacak ana fonksiyon
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Sayfanın yenilenmesini engelle

        // Input değerlerini ID'leri ile oku ve boşlukları temizle
        const hastaAd = document.getElementById('hastaAd')?.value.trim();
        const hastaTel = document.getElementById('hastaTel')?.value.trim();
        const hastaYas = document.getElementById('hastaYas')?.value.trim();

        // Veri kontrolü
        if (!hastaAd || !hastaTel || !hastaYas) {
            mesajAlani.textContent = 'Lütfen tüm alanları doldurun.';
            mesajAlani.style.color = 'red';
            return;
        }

        // Backend'e istek gönder
        try {
            const response = await fetch('/api/hastalar/ekle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    hastaAd: hastaAd, hastaTel: hastaTel, hastaYas: hastaYas 
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Başarı
                mesajAlani.textContent = `✅ Danışan ID ${data.hastaId} ile başarıyla kaydedildi.`;
                mesajAlani.style.color = 'green';
                form.reset(); 
            } else {
                // Hata (DB hatası, zorunlu alan eksikliği vb.)
                mesajAlani.textContent = `Kayıt Hatası: ${data.message}`;
                mesajAlani.style.color = 'red';
            }
        } catch (error) {
            // Sunucuya ulaşılamazsa
            console.error('FETCH HATA:', error);
            mesajAlani.textContent = 'Sunucuya ulaşılamıyor. Terminali kontrol edin.';
            mesajAlani.style.color = 'red';
        }
    });
});