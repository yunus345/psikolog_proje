// Sayfa Yükleme Fonksiyonu (Menüye tıklandığında çalışır)
function loadPage(pageName, event) {
    // Varsayılan link davranışını engelle (sayfanın yukarı kaymasını önler)
    if (event) {
        event.preventDefault(); 
    }
    
    // Tıklanan linki active yap
    const menuLinks = document.querySelectorAll('.sidebar ul li a');
    menuLinks.forEach(link => link.classList.remove('active'));
    // Tıklanan linkin kendisini veya ebeveynini active yapar
    if (event && event.target) {
        event.target.closest('a').classList.add('active'); 
    }
    
    // 🎯 KRİTİK İŞLEM: Tıklanan menü adına göre hedef HTML dosyasını belirleme
    let targetPage = '';
    
    // NOT: Bu isimler (pageName) HTML'deki loadPage('Isim') ile tam eşleşmelidir!
    if (pageName === 'Dashboard') {
        targetPage = 'yonetici_ekrani.html'; 
    } else if (pageName === 'RandevuTakvimi') {
        targetPage = 'randevu_takvimi.html';
    } else if (pageName === 'RandevuEkleme') {
        targetPage = 'randevu_ekleme.html';
    } else if (pageName === 'RandevuDuzenle') {
        targetPage = 'randevu_duzenle.html';
    } else if (pageName === 'DanisanListesi') {
        targetPage = 'danisan_listesi.html';
    } else if (pageName === 'DanisanProfili') {
        targetPage = 'danisan_detay.html'; // YENİ DANIŞAN EKLEME/DETAY SAYFAMIZ
    } else if (pageName === 'Odemeler') {
        targetPage = 'odeme_listesi.html';
    } else if (pageName === 'GelirRaporlari') {
        targetPage = 'gelir_raporlama.html';
    } else if (pageName === 'Istatistikler') {
        targetPage = 'istatistikler.html';
    }
    
    // Tarayıcıyı hedef sayfaya yönlendir
    if (targetPage) {
        window.location.href = targetPage;
    }
}

// Çıkış Fonksiyonu (Logout)
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        // Local Storage temizleme
        localStorage.removeItem('doktorId');
        localStorage.removeItem('doktorAd');
        
        // Login sayfasına yönlendir
        window.location.href = 'login.html'; 
    }
}

// Sayfa yüklendiğinde (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function() {
    // Güvenlik Kontrolü ve İsim Gösterimi
    if (localStorage.getItem('doktorId')) {
        const doktorAd = localStorage.getItem('doktorAd') || 'Yönetici';
        const userDisplay = document.getElementById('user-display-name'); 
        if (userDisplay) userDisplay.textContent = doktorAd;
    } else {
        // ID yoksa, login sayfasına yönlendir (güvenlik için)
        // window.location.href = 'login.html'; 
    }

    // ... (Diğer Dashboard JS mantığı ve animasyonlar buraya gelir)
});