document.addEventListener("DOMContentLoaded", () => {
    // ⚠️ HASTA ID'si: Yönetici paneli olmadığı için şimdilik ID'yi sabit tutuyoruz.
    // Gerçekte, hasta girişi yapıldığında bu ID localStorage'dan çekilmelidir.
    const TEST_HASTA_ID = 1; 

    // HTML Elementlerini Yakala
    const upcomingContainer = document.getElementById("upcomingRandevular");
    const paymentTableBody = document.querySelector("#paymentTable tbody");
    const chartCanvas = document.getElementById("paymentChart");
    
    // --- GEREKLİ YARDIMCI FONKSİYONLAR ---
    
    // Güvenli Çıkış (Logout) fonksiyonu
    window.logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    // --- VERİ ÇEKME FONKSİYONLARI ---

    // 1. YAKLAŞAN RANDEVULAR (BACKEND ÇAĞRISI)
    async function loadUpcomingRandevular() {
        if (!upcomingContainer) return;
        upcomingContainer.innerHTML = '<div>Yükleniyor...</div>';

        try {
            // Backend rotasını hastanın ID'siyle çağırıyoruz
            const response = await fetch(`/api/hasta/randevular/yaklasan?hastaId=${TEST_HASTA_ID}`);
            const result = await response.json();
            
            upcomingContainer.innerHTML = ''; 

            if (result.success && result.randevular.length > 0) {
                result.randevular.forEach(r => {
                    const div = document.createElement("div");
                    div.className = "randevu-item";
                    
                    // Tarih ve saat formatı
                    const tarih = new Date(r.randevu_tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
                    const saat = new Date(r.randevu_tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                    div.innerHTML = `<strong>${tarih} ${saat}</strong> - ${r.seansTuru}`;
                    upcomingContainer.appendChild(div);
                });
            } else {
                 upcomingContainer.innerHTML = '<div class="no-data">Yaklaşan randevunuz bulunmamaktadır.</div>';
            }
        } catch (error) {
            console.error('Yaklaşan Randevu Fetch Hatası:', error);
             upcomingContainer.innerHTML = '<div class="no-data" style="color:red;">Veri yüklenemedi.</div>';
        }
    }


    // 2. ÖDEME DURUMU (BACKEND ÇAĞRISI VE GRAFİK)
    async function loadPaymentsAndChart() {
        if (!paymentTableBody || !chartCanvas) return;
        
        try {
            // NOT: Ödemeleri Backend'e yeni bir rota yazmak yerine, şimdilik Yönetici rotasından tüm ödemeleri çekip Frontend'de filtreliyoruz.
            const response = await fetch(`/api/odemeler`); 
            const data = await response.json();
            
            // Sadece bu hastaya ait ödemeleri filtrele
            const patientPayments = data.odemeler ? data.odemeler.filter(o => o.hasta_id == TEST_HASTA_ID) : [];

            // Tabloyu doldur
            if (paymentTableBody) {
                paymentTableBody.innerHTML = "";
                if (patientPayments.length === 0) {
                    paymentTableBody.innerHTML = '<tr><td colspan="3">Ödeme kaydı bulunmamaktadır.</td></tr>';
                } else {
                    patientPayments.forEach(p => {
                        const tr = document.createElement("tr");
                        const odendi = p.odeme_durumu === 'Ödendi';
                        const seansTarihi = new Date(p.randevu_tarih).toLocaleDateString('tr-TR');

                        tr.innerHTML = `
                            <td>${seansTarihi}</td>
                            <td>${p.tutar}₺</td>
                            <td class="${odendi ? 'payment-paid' : 'payment-pending'}">
                                ${p.odeme_durumu}
                            </td>
                        `;
                        paymentTableBody.appendChild(tr);
                    });
                }
            }

            // Grafik çizme
            if (chartCanvas && patientPayments.length > 0) {
                 new Chart(chartCanvas.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: patientPayments.map(p => new Date(p.randevu_tarih).toLocaleDateString('tr-TR')),
                        datasets: [{
                            label: 'Ödeme Tutarı',
                            data: patientPayments.map(p => p.tutar),
                            backgroundColor: patientPayments.map(p => p.odeme_durumu === 'Ödendi' ? 'green' : 'red')
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }

        } catch (error) {
            console.error('Ödeme Verisi Çekilemedi:', error);
        }
    }
    
    // --- BAŞLANGIÇ ÇAĞRILARI ---
    loadUpcomingRandevular();
    loadPaymentsAndChart();

});