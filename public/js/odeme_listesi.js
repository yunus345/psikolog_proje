document.addEventListener('DOMContentLoaded', () => {
    // 1. Verinin basılacağı tablo gövdesinin ID'si (Daha önce HTML'de belirlediğimiz ID)
    const tableBody = document.getElementById('odeme-tablo-govdesi'); 

    if (!tableBody) return; 

    // Ödeme listesini Backend'den çeken ana fonksiyon (CRUD - Read)
    async function fetchOdemeListesi() {
        try {
            const response = await fetch('/api/odemeler');
            const data = await response.json();

            if (data.success) {
                renderTable(data.odemeler); // Başarılıysa veriyi tabloya bas
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Hata: ${data.message}</td></tr>`;
            }
        } catch (error) {
            console.error('Ödeme Listesi Fetch Hatası:', error);
            tableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Sunucuya ulaşılamıyor.</td></tr>`;
        }
    }

    // Çekilen veriyi HTML tablosuna basan fonksiyon
    function renderTable(odemeler) {
        tableBody.innerHTML = ''; // Önce tabloyu temizle

        if (odemeler.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">Henüz ödeme kaydı bulunmamaktadır.</td></tr>`;
            return;
        }

       // odeme_listes// odeme_listesi.js içinde, renderTable fonksiyonu:
// ...
      // odeme_listesi.js içinde, renderTable fonksiyonu:
// ...
        odemeler.forEach(o => {
            const row = tableBody.insertRow();
            const seansTarihi = new Date(o.randevu_tarih).toLocaleDateString('tr-TR'); 
            
            // İşlem yap butonu (ID üzerinden çalışmaya devam eder)
            const islemButonu = `<button class="btn btn-sm btn-primary" onclick="islemYap('${o.odeme_id}', 'Bilinmiyor')">İşlem Yap</button>`;

            row.innerHTML = `
                <td>${o.danisanAdi}</td>
                <td>${seansTarihi}</td>
                <td>—</td> 
                <td>—</td> 
                <td>${islemButonu}</td>
            `;
        });
    }
// ...i.js içinde, renderT
    // --- SİZİN İŞLEMYAP FONKSİYONUNUZUN DİNAMİK HALİ ---
    // NOT: Bu fonksiyon, Backend'de (server.js) bir UPDATE rotası (Örn: /api/odemeler/guncelle) gerektirir.
    window.islemYap = async function(odemeId, mevcutDurum) {
        const yeniDurum = prompt("Yeni durumu girin (Ödendi / Bekleniyor):", mevcutDurum);
        
        if (!yeniDurum || yeniDurum === mevcutDurum) return;

        // 🚨 BURAYA BACKEND UPDATE KODU GELECEK
        
        alert(`Ödeme ID ${odemeId} için durum güncellenecek: ${yeniDurum}`);
        // Geçici çözüm: Sayfayı yenile ve yeni durumu çekmesini sağla
        location.reload(); 
    }

    // Sayfa yüklendiğinde listeyi çek
    fetchOdemeListesi();
});