document.addEventListener('DOMContentLoaded', () => {
    // 1. Veriyi göstereceğimiz tablo gövdesi elementini yakala
    const tableBody = document.getElementById('randevu-tablo-govdesi'); 

    if (!tableBody) return; 

    // Danışan listesini Backend'den çeken ana fonksiyon
    async function fetchRandevuListesi() {
        try {
            const response = await fetch('/api/randevular'); // Backend rotasına GET isteği
            const data = await response.json();

            if (data.success) {
                renderTable(data.randevular); // Başarılıysa veriyi tabloya bas
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Hata: ${data.message}</td></tr>`;
            }
        } catch (error) {
            console.error('Randevu Listesi Fetch Hatası:', error);
            tableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Sunucuya ulaşılamıyor.</td></tr>`;
        }
    }

    // Çekilen veriyi HTML tablosuna basan fonksiyon
    function renderTable(randevular) {
        tableBody.innerHTML = ''; // Önce tabloyu temizle

        if (randevular.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">Henüz kayıtlı randevu yok.</td></tr>`;
            return;
        }

        randevular.forEach(r => {
            const row = tableBody.insertRow();
            // 🚨 Backend'den gelen isimleri (hastaAdi, psikologAdi, seansTuru) kullanıyoruz
            row.innerHTML = `
                <td>${r.hastaAdi}</td>
                <td>${r.psikologAdi}</td>
                <td>${r.seansTuru}</td>
                <td>${new Date(r.randevu_tarih).toLocaleDateString()}</td>
                <td>${r.durum}</td>
            `;
        });
    }

    // Sayfa yüklendiğinde listeyi çek
    fetchRandevuListesi();
});