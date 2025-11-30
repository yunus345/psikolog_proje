// --- TEMEL YÖNLENDİRME FONKSİYONLARI ---

// loadPage fonksiyonunuzun güncellenmiş hali:

function loadPage(pageName, event) {
    if (event) {
        event.preventDefault(); 
        
        // ÖNCEKİ AKTİFİ KALDIR
        const menuLinks = document.querySelectorAll('.sidebar ul li a');
        menuLinks.forEach(link => link.classList.remove('active'));

        // YENİSİNİ AKTİF YAP
        event.target.closest('a').classList.add('active'); 
    }
    // ... (Geri kalan kodunuz aynı kalmalı)
}

function loadPage(pageName, event) {
    if (event) {
        event.preventDefault(); 
        event.target.closest('a').classList.add('active'); 
    }
    
    // Mobil menüyü kapatma (Eğer HTML'de tanımlıysa)
    if (typeof closeMobileSidebar === 'function' && window.innerWidth <= 768) {
        closeMobileSidebar();
    }
    
    // Sayfa adlarını dosya adlarıyla eşleştirme
    const pageMap = {
        'Dashboard': 'yonetici_ekrani.html', 
        'RandevuTakvimi': 'randevu_takvimi.html',
        'RandevuListesi': 'randevular.html', 
        'RandevuEkleme': 'randevu_ekleme.html',
        'RandevuDuzenle': 'randevu_duzenle.html',
        'DanisanListesi': 'danisan_listesi.html',
        'DanisanProfili': 'danisan_detay.html',
        'Odemeler': 'odeme_listesi.html',
        'GelirRaporlari': 'gelir_raporlama.html',
        'Istatistikler': 'istatistikler.html'
    };
    
    const targetFile = pageMap[pageName];
    
    if (targetFile) {
        window.location.href = targetFile;
    }
}

function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.removeItem('doktorId');
        localStorage.removeItem('doktorAd');
        window.location.href = 'login.html'; 
    }
}


// -----------------------------------------------------------
// 📊 DASHBOARD KARTLARINI DOLDURAN FONKSİYONLAR
// -----------------------------------------------------------

// 1. DANIŞAN SAYISINI ÇEKEN FONKSİYON
async function loadDanisanSayisi() {
    try {
        const response = await fetch('/api/dashboard/danisan-sayisi');
        const data = await response.json(); 

        if (data.success) {
            const toplamSayi = data.toplamDanisan;
            const danisanSayisiElement = document.getElementById('toplam-danisan-sayisi');
            
            if (danisanSayisiElement) {
                 danisanSayisiElement.textContent = toplamSayi;
                 const kartFooter = danisanSayisiElement.nextElementSibling;
                 if(kartFooter) kartFooter.textContent = `${toplamSayi} aktif danışan`;
            }
        }
    } catch (error) {
        console.error("Dashboard Danışan Sayısı Çekilemedi:", error);
    }
}

// 2. RANDEVU SAYILARINI ÇEKEN FONKSİYON (Bugün ve Aylık)
async function loadRandevuSayilari() {
    try {
        const response = await fetch('/api/dashboard/randevu-sayilari'); 
        const data = await response.json(); 

        if (data.success && data.data) {
            const d = data.data;

            // BUGÜNKÜ RANDEVULAR
            const bugunEl = document.querySelector('.dashboard-cards .card:first-child .card-value');
            if (bugunEl) bugunEl.textContent = d.bugunkuRandevu;

            // BU AY GERÇEKLEŞEN RANDEVU SAYISI
            const aylikEl = document.querySelector('.dashboard-cards .card:nth-child(2) .card-value');
            if (aylikEl) aylikEl.textContent = d.aylikRandevu; 
        }
    } catch (error) {
        console.error("Randevu Kartları Veri Çekilemedi:", error);
    }
}

// 3. FİNANSAL ANALİZ KARTLARINI DOLDURAN FONKSİYON (Gelir ve Bekleyen Ödeme)
async function loadFinansalAnaliz() {
    try {
        const response = await fetch('/api/dashboard/finans-analiz'); 
        const data = await response.json(); 

        if (data.success && data.data) {
            const d = data.data;

            // BU AYIN TOPLAM GELİRİ
            const gelirEl = document.getElementById('aylik-gelir-miktari');
            if (gelirEl) {
                 gelirEl.textContent = `₺${d.toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
            }

            // BEKLEYEN ÖDEMELER
            const bekleyenEl = document.getElementById('bekleyen-odeme-miktari');
            const bekleyenFooter = bekleyenEl ? bekleyenEl.nextElementSibling : null;

            if (bekleyenEl) {
                 bekleyenEl.textContent = `₺${d.toplamBekleyen.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
            }
            if (bekleyenFooter) {
                bekleyenFooter.textContent = `↓ ${d.bekleyenAdet} ödeme bekleniyor`;
            }
        }
    } catch (error) {
        console.error("Finansal Analiz Kartları Veri Çekilemedi:", error);
    }
}


// -----------------------------------------------------------
// 📈 ANALİTİK GRAFİK FONKSİYONLARI
// -----------------------------------------------------------

// GLOBAL CHART OBJELERİ (Grafiklerin yeniden çizilmesi için)
window.aylikRandevuChart = null;
window.seansDagilimiChart = null;
window.aylikGelirChart = null;


// 1. AYLIK RANDEVU GRAFİĞİ (Çubuk)
async function loadAylikRandevuGrafik(yil) {
    const year = yil || new Date().getFullYear();
    try {
        const response = await fetch(`/api/analiz/aylik-randevu?yil=${year}`);
        const result = await response.json();

        if (result.success) {
            const veriler = result.data.map(item => item.sayi);
            const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            
            const ctx = document.getElementById('aylikRandevu'); 
            
            if (ctx) {
                if (window.aylikRandevuChart) {
                    window.aylikRandevuChart.destroy();
                }
                
                window.aylikRandevuChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: aylar,
                        datasets: [{
                            label: `${year} Yılı Randevu Sayısı`,
                            data: veriler,
                            backgroundColor: 'rgba(54, 162, 235, 0.7)',
                            borderColor: 'rgb(54, 162, 235)',
                            borderWidth: 1
                        }]
                    },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });
            }
        }
    } catch (error) {
        console.error("Aylık Randevu Grafiği Verisi Çekilemedi:", error);
    }
}

// 2. SEANS DAĞILIMI GRAFİĞİ (Pasta)
async function loadSeansDagilimiGrafik(yil) {
    const year = yil || new Date().getFullYear();
    try {
        const response = await fetch(`/api/analiz/seans-dagilimi?yil=${year}`);
        const result = await response.json();

        if (result.success) {
            const turAdlari = result.data.map(item => item.turAdi);
            const randevuAdetleri = result.data.map(item => item.randevuAdet);
            
            const ctx = document.getElementById('seansDagilimi');
            
            if (ctx) {
                if (window.seansDagilimiChart) {
                    window.seansDagilimiChart.destroy();
                }

                window.seansDagilimiChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: turAdlari,
                        datasets: [{
                            label: 'Randevu Adedi',
                            data: randevuAdetleri,
                            backgroundColor: ['#49a9ea', '#ff6384', '#ff9f40', '#4bc0c0', '#9966ff'],
                            hoverOffset: 4
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { position: 'right' } } }
                });
            }
        }
    } catch (error) {
        console.error("Seans Dağılım Grafiği Verisi Çekilemedi:", error);
    }
}

// 3. AYLIK GELİR ANALİZİ GRAFİĞİ (Çizgi)
async function loadAylikGelirGrafik(yil) {
    const year = yil || new Date().getFullYear();
    try {
        const response = await fetch(`/api/analiz/aylik-gelir?yil=${year}`);
        const result = await response.json();

        if (result.success) {
            const veriler = result.data.map(item => item.tutar);
            const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            
            const ctx = document.getElementById('aylikGelir');
            
            if (ctx) {
                if (window.aylikGelirChart) {
                    window.aylikGelirChart.destroy();
                }

                window.aylikGelirChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: aylar,
                        datasets: [{
                            label: `${year} Yılı Toplam Gelir (₺)`,
                            data: veriler,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgb(255, 99, 132)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });
            }
        }
    } catch (error) {
        console.error("Aylık Gelir Grafiği Verisi Çekilemedi:", error);
    }
}
// yonetici_ekrani.js dosyasına eklenecek kısım:

// -----------------------------------------------------------
// 📅 GÜN/SAAT YOĞUNLUK TABLOSUNU DOLDURAN FONKSİYON
// -----------------------------------------------------------
async function loadGunSaatYogunluk() {
    try {
        const response = await fetch('/api/analiz/gun-saat-yogunluk'); 
        const result = await response.json();
        
        if (result.success) {
            buildYogunlukTablosu(result.data); // Tabloyu inşa et
        }
    } catch (error) {
        console.error("Yoğunluk Analizi Verisi Çekilemedi:", error);
    }
}

// Çekilen veriyi HTML tablosuna basan asıl fonksiyon
function buildYogunlukTablosu(veri) {
    const tableEl = document.getElementById('heatmap'); // HTML'deki table ID'si
    if (!tableEl) return;

    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    const saatler = Array.from({length: 9}, (_, i) => i + 9); // 09, 10, ..., 17

    let html = '<thead><tr><th>Saat</th>';
    days.forEach(day => { html += `<th>${day}</th>`; });
    html += '</tr></thead><tbody>';

    // Veri haritasını oluştur (Haftanın Günü (2-6) ve Saat (9-17) bazında)
    const dataMap = new Map();
    veri.forEach(item => {
        // Anahtarı [gun_numarasi]-[saat] yapıyoruz (Örn: 2-9)
        dataMap.set(`${item.gun_numarasi}-${item.saat}`, item.toplam_adet);
    });

    // Satırları doldur
    saatler.forEach(saat => {
        const saatStr = `${saat}:00`;
        html += `<tr><td>${saatStr}</td>`;
        
        // Sütunları doldur (Pazartesi'den Cuma'ya - gün numarası 2'den 6'ya)
        for (let gunNumarasi = 2; gunNumarasi <= 6; gunNumarasi++) {
            const key = `${gunNumarasi}-${saat}`;
            const adet = dataMap.get(key) || 0;
            
            // Yoğunluğa göre renk sınıfı (Heatmap etkisi)
            let renkSinifi = '';
            if (adet >= 5) renkSinifi = 'high'; // 5 ve üzeri çok yoğun
            else if (adet >= 2) renkSinifi = 'medium'; // 2-4 orta yoğun
            else if (adet >= 1) renkSinifi = 'low'; // 1 az yoğun

            html += `<td class="${renkSinifi}">${adet}</td>`;
        }
        html += '</tr>';
    });
    
    html += '</tbody>';
    tableEl.innerHTML = html;
}

// yonetici_ekrani.js dosyasına eklenecek kısım:

// -----------------------------------------------------------
// 📅 GÜN/SAAT YOĞUNLUK TABLOSUNU DOLDURAN FONKSİYON
// -----------------------------------------------------------
async function loadGunSaatYogunluk() {
    try {
        const response = await fetch('/api/analiz/gun-saat-yogunluk'); 
        const result = await response.json();
        
        if (result.success) {
            buildYogunlukTablosu(result.data); // Tabloyu inşa et
        }
    } catch (error) {
        console.error("Yoğunluk Analizi Verisi Çekilemedi:", error);
    }
}

// Çekilen veriyi HTML tablosuna basan asıl fonksiyon
function buildYogunlukTablosu(veri) {
    const tableEl = document.getElementById('heatmap'); // HTML'deki table ID'si
    if (!tableEl) return;

    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    const saatler = Array.from({length: 9}, (_, i) => i + 9); // 09, 10, ..., 17

    let html = '<thead><tr><th>Saat</th>';
    days.forEach(day => { html += `<th>${day}</th>`; });
    html += '</tr></thead><tbody>';

    // Veri haritasını oluştur (Haftanın Günü (2-6) ve Saat (9-17) bazında)
    const dataMap = new Map();
    veri.forEach(item => {
        // MySQL'de 2=Pazartesi olduğu için, anahtarı [gun_numarasi]-[saat] yapıyoruz
        dataMap.set(`${item.gun_numarasi}-${item.saat}`, item.toplam_adet);
    });

    // Satırları doldur
    saatler.forEach(saat => {
        const saatStr = `${saat}:00`;
        html += `<tr><td>${saatStr}</td>`;
        
        // Sütunları doldur (Pazartesi'den Cuma'ya - gün numarası 2'den 6'ya)
        for (let gunNumarasi = 2; gunNumarasi <= 6; gunNumarasi++) {
            const key = `${gunNumarasi}-${saat}`;
            const adet = dataMap.get(key) || 0;
            
            // Yoğunluğa göre renk sınıfı (Heatmap etkisi)
            let renkSinifi = '';
            if (adet >= 3) renkSinifi = 'high';
            else if (adet >= 1) renkSinifi = 'medium';

            html += `<td class="${renkSinifi}">${adet}</td>`;
        }
        html += '</tr>';
    });
    
    html += '</tbody>';
    tableEl.innerHTML = html;
}

// --- SİDEBAR VE MOBİL YÖNETİMİ ---

// Sidebar'ı açıp kapatan fonksiyon (Toggle)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    sidebar.classList.toggle('collapsed');
}

// Mobil menü açma/kapama
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const hamburger = document.querySelector('.hamburger-menu');
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
    // Eğer hamburger menü HTML'de yoksa, bu satırı silin
    if (hamburger) hamburger.classList.toggle('active'); 
}

// Mobil menüyü kapatan fonksiyon (Overlay'e tıklandığında)
function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const hamburger = document.querySelector('.hamburger-menu');

    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
}

// -----------------------------------------------------------
// 🚀 SAYFA YÜKLENDİĞİNDE ÇALIŞAN KISIM (TÜM MANTIK BURADA BAĞLANIR)
// -----------------------------------------------------------

// Sidebar'ın CSS'teki animasyonu için kısa gecikme
setTimeout(() => {
    // Sadece mobil görünümde değilse opacity ile giriş animasyonunu tetikle
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').style.opacity = '1';
    }
}, 100);

document.addEventListener('DOMContentLoaded', function() {
    
    // Güvenlik Kontrolü ve İsim Gösterimi (Login sonrası veriler)
    if (localStorage.getItem('doktorId')) {
        const doktorAd = localStorage.getItem('doktorAd') || 'Yönetici';
        const userDisplay = document.getElementById('user-display-name'); 
        if (userDisplay) userDisplay.textContent = doktorAd;
    } 
    
    const currentYear = new Date().getFullYear();

    // 1. KART VERİLERİNİ ÇEK
    loadDanisanSayisi(); 
    loadRandevuSayilari(); 
    loadFinansalAnaliz();
    
    // 2. GRAFİK VERİLERİNİ ÇEK (İlk yükleme mevcut yıla göre)
    loadAylikRandevuGrafik(currentYear); 
    loadSeansDagilimiGrafik(currentYear);
    loadAylikGelirGrafik(currentYear); 
    loadGunSaatYogunluk(currentYear);

    // 3. YIL FİLTRESİ MANTIĞI (Grafiklerin Yeniden Çizilmesi)
    const randevuForm = document.getElementById('randevu-form');
    const yilRandevuInput = document.getElementById('randevu-year'); // Aylık Randevu Yılı
    
    // Eğer HTML'de yıl inputu varsa doldurma mantığı
    if (yilRandevuInput) {
        yilRandevuInput.innerHTML = `
            <option value="${currentYear}">${currentYear}</option>
            <option value="${currentYear - 1}">${currentYear - 1}</option>
        `;
    }

    if (randevuForm && yilRandevuInput) {
        randevuForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            const secilenYil = yilRandevuInput.value;
            // Filtreleme için ilgili fonksiyonları çağır
            loadAylikRandevuGrafik(secilenYil); 
            // loadSeansDagilimiGrafik(secilenYil); // Eğer formlar farklıysa bu fonksiyonlar da çağrılmalı
        });
    }
    // ... (Diğer filtre formları için benzer mantık eklenmelidir)
});