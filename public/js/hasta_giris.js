function girisYap(event) {
    event.preventDefault();

    const ad = document.getElementById('ad').value.trim();
    const soyad = document.getElementById('soyad').value.trim();
    const sifre = document.getElementById('sifre').value.trim();

    // Tek kullanıcı
    if(ad === 'hasta' && soyad === 'hasta' && sifre === '123456') {
        localStorage.setItem('hastaAd', ad);
        localStorage.setItem('hastaSoyad', soyad);
        window.location.href = 'hasta_ekrani.html';
    } else {
        alert('Bilgiler yanlış!');
    }
}
