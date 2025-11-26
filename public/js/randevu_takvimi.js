document.addEventListener('DOMContentLoaded', () => {
    // 1. HTML Elementlerini Yakalama
    // Randevuların basılacağı tablo gövdesi
    const takvimBody = document.getElementById("takvim-body"); 
    const dateLabel = document.getElementById("currentDate");
    const prevDayButton = document.getElementById("prevDay");
    const nextDayButton = document.getElementById("nextDay");

    if (!takvimBody || !dateLabel || !prevDayButton || !nextDayButton) {
        console.error("Hata: Randevu Takvimi HTML elementleri (takvim-body, currentDate vb.) bulunamadı.");
        return;
    }

    // Geçerli tarihi tutan değişken (Bugün ile başlar)
    let currentDate = new Date();

    // Çalışma saatleri (HTML'de listelenen sabit saat dilimleri)
    const hours = [
        "09:00", "10:00", "11:00", "12:00",
        "13:00", "14:00", "15:00", "16:00", "17:00"
    ];

    // Tarihi DD.MM.YYYY formatında Frontend'e gösteren ve YYYY-MM-DD formatını döndüren fonksiyon
    function formatDate(date) {
        // Frontend gösterimi için: DD.MM.YYYY
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        
        dateLabel.textContent = `${dd}.${mm}.${yyyy}`;
        
        // Backend'e gönderilecek format (YYYY-MM-DD)
        return `${yyyy}-${mm}-${dd}`;
    }

    // -----------------------------------------------------------
    // 2. VERİ ÇEKME FONKSİYONU (BACKEND İLE KONUŞUR)
    // -----------------------------------------------------------
    async function fetchAndRenderRandevular() {
        // Backend'in beklediği formatta tarihi al
        const dateString = formatDate(currentDate); 
        
        // Tablonun temizlenmesi ve yükleniyor mesajı
        takvimBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Yükleniyor...</td></tr>';

        try {
            // Backend rotasını çağır (/api/randevu-takvimi?tarih=YYYY-MM-DD)
            const response = await fetch(`/api/randevu-takvimi?tarih=${dateString}`);
            const data = await response.json();
            
            if (data.success) {
                renderCalendarGrid(data.randevular); 
            } else {
                takvimBody.innerHTML = `<tr><td colspan="2" style="color:red; text-align: center;">Hata: ${data.message}</td></tr>`;
            }
        } catch (error) {
            console.error("Takvim Fetch Hatası:", error);
            takvimBody.innerHTML = '<tr><td colspan="2" style="color:red; text-align: center;">Sunucuya ulaşılamadı.</td></tr>';
        }
    }

    // -----------------------------------------------------------
    // 3. TAKVİMİ ÇİZEN FONKSİYON
    // -----------------------------------------------------------
    function renderCalendarGrid(randevular) {
        takvimBody.innerHTML = "";

        // Randevu verilerini saat bazında haritalama (HH:MM -> Veri)
        const randevuMap = new Map();
        randevular.forEach(r => {
            // Backend'den çektiğimiz saat (HH:MM)
            const saatAnahtari = r.randevu_saat.substring(0, 5); 
            randevuMap.set(saatAnahtari, r);
        });

        // HTML Takvim Saat Yuvalarını Oluşturma
        hours.forEach(saatStr => { // saatStr -> "09:00"
            const row = takvimBody.insertRow();
            
            const randevu = randevuMap.get(saatStr); // O saatte randevu var mı?
            
            let content;
            if (randevu) {
                // Randevu varsa, danışan adını göster
                content = `<td style="font-weight: bold; color: #007bff;">${randevu.danisanAdi}</td>`;
            } else {
                // Randevu yoksa tire (-) göster
                content = `<td>—</td>`;
            }

            row.innerHTML = `
                <th>${saatStr}</th>
                ${content}
            `;
        });
    }


    
    // -----------------------------------------------------------
    // 4. İLERİ/GERİ BUTON MANTIĞI
    // -----------------------------------------------------------
    
    // Buton dinleyicileri (Asenkron)
    prevDayButton.onclick = async () => {
        currentDate.setDate(currentDate.getDate() - 1); // Tarihi bir gün geri al
        await fetchAndRenderRandevular(formatDate(currentDate));
    };

    nextDayButton.onclick = async () => {
        currentDate.setDate(currentDate.getDate() + 1); // Tarihi bir gün ileri al
        await fetchAndRenderRandevular(formatDate(currentDate));
    };

    // Sayfa ilk yüklendiğinde takvimi çiz
    fetchAndRenderRandevular(formatDate(currentDate)); 
});