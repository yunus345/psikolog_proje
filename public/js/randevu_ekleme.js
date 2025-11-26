document.addEventListener('DOMContentLoaded', () => {
    // 1. Doğrudan butonu yakala
    const olusturButonu = document.getElementById('randevuOluşturButonu');
    const mesajAlani = document.getElementById('randevu-mesaj-alani');

    if (!olusturButonu) return; 

    // Tıklama olayını dinle
    olusturButonu.addEventListener('click', async (event) => {
        event.preventDefault(); // Sayfa yenilenmesini engelle

        // 2. Input değerlerini topla
        const hastaId = document.getElementById('hasta-secim-id').value.trim();
        const psikologId = document.getElementById('psikolog-secim-id').value.trim(); 
        const hizmetId = document.getElementById('hizmet-secim-id').value.trim();
        const tarihSaat = document.getElementById('randevu-tarih-saat').value.trim(); 

        // Eksik Alan Kontrolü
        if (!hastaId || !psikologId || !hizmetId || !tarihSaat) {
            mesajAlani.textContent = 'Lütfen tüm alanları doldurun.';
            return;
        }

        // 3. Fetch isteği (Backend'e istek şimdi gidecek!)
        try {
            const response = await fetch('/api/randevular/ekle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hastaId, psikologId, hizmetId, tarihSaat }),
            });

            const data = await response.json();

            if (data.success) {
                
                // 1. Basitleştirilmiş mesaj gösterimi
                mesajAlani.textContent = `✅ Randevu başarıyla oluşturuldu! ID: ${data.randevuId}`;
                mesajAlani.style.color = 'green';
                
                // 2. KRİTİK: Sayfayı yenilemeyi zorla (Eski davranış)
                window.location.reload();
            } else {
                mesajAlani.textContent = `Randevu Hatası: ${data.message}`;
                mesajAlani.style.color = 'red';
            }
        } catch (error) {
            console.error('Randevu Ekleme KRİTİK FETCH HATASI:', error);
            mesajAlani.textContent = 'Sunucuya ulaşılamadı. Terminali kontrol edin.';
        }
    });
});