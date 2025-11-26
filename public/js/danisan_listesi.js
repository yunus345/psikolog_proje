document.addEventListener('DOMContentLoaded', () => {
    // 1. Veriyi göstereceğimiz tablo gövdesi elementini yakala
    // 🚨 KRİTİK DÜZELTME: ID'niz olan "danisan-body" kullanılıyor!
    const danisanTableBody = document.getElementById('danisan-body'); 

    // Eğer bu element yoksa, bu sayfa listeleme sayfası değildir.
    if (!danisanTableBody) return; 

    // Danışan listesini Backend'den çeken ana fonksiyon
    async function fetchDanisanListesi() {
        try {
            const response = await fetch('/api/hastalar'); // Backend rotasına GET isteği
            const data = await response.json();

            if (data.success) {
                renderTable(data.hastalar); // Başarılıysa veriyi tabloya bas
            } else {
                danisanTableBody.innerHTML = `<tr><td colspan="6" style="color:red;">Hata: ${data.message}</td></tr>`;
            }
        } catch (error) {
            console.error('Listeleme Fetch Hatası:', error);
            danisanTableBody.innerHTML = `<tr><td colspan="6" style="color:red;">Sunucuya ulaşılamıyor.</td></tr>`;
        }
    }

    // Çekilen veriyi HTML tablosuna basan fonksiyon
    function renderTable(hastalar) {
        danisanTableBody.innerHTML = ''; // Önce tabloyu temizle

        if (hastalar.length === 0) {
            danisanTableBody.innerHTML = `<tr><td colspan="6">Henüz kayıtlı danışan yok.</td></tr>`;
            return;
        }

        hastalar.forEach(hasta => {
            const row = danisanTableBody.insertRow();
            // ⚠️ Tablonuzdaki sütun başlıklarına göre sıralandı (Ad, Tel, Seans, Son Randevu, Borç, Detay)
            row.innerHTML = `
                <td>${hasta.hasta_ad}</td>
                <td>${hasta.hasta_tel}</td>
                <td>—</td>  <td>—</td>  <td>—</td>  <td><button class="detay-btn" onclick="goToDetay(${hasta.hasta_id})">Detay</button></td>
            `;
        });
    }

    // Detay sayfasına yönlendirme fonksiyonu (İleride kullanılacak)
    function goToDetay(id) {
        // Danışan Detay sayfasına ID'yi sorgu parametresi olarak gönderir
        window.location.href = `danisan_detay.html?id=${id}`;
    }
    
    // Global scope'a goToDetay fonksiyonunu ekle (HTML'deki butondan çağrılabilmesi için)
    window.goToDetay = goToDetay;

    // Sayfa yüklendiğinde listeyi çek
    fetchDanisanListesi();
});