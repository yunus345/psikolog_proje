// ÖDEME TAMAMLAMA
document.getElementById("payButton").onclick = function () {
    const payType = document.querySelector('input[name="payType"]:checked');
    if (!payType) return alert("Lütfen ödeme yöntemini seçiniz");

    const method = payType.value === "kredi" ? "Klinikte POS" : "Klinikte Nakit";

    if (pending.length === 0) {
        return alert("Bekleyen ödemeniz bulunmuyor.");
    }

    const odeme = pending.shift();  // ilk bekleyen ödemeyi al
    paid.push({
        tarih: odeme.tarih,
        tutar: odeme.tutar,
        odemeSekli: method
    });

    alert(`Ödeme kaydedildi.\nYöntem: ${method}\nTutar: ${odeme.tutar}`);

    // Listeleri yeniden çiz
    redrawLists();
};

// LISTELERİ YENİDEN ÇİZME
function redrawLists() {
    document.getElementById("paidList").innerHTML = "";
    document.getElementById("pendingList").innerHTML = "";

    renderList("paidList", paid, i => `${i.tarih} - ${i.tutar} (${i.odemeSekli})`);
    renderList("pendingList", pending, i => `${i.tarih} - ${i.tutar}`);
}



const paid = [
    { tarih: "12 Kasım 2025", tutar: "600₺" },
    { tarih: "05 Kasım 2025", tutar: "600₺" }
];

const pending = [
    { tarih: "20 Kasım 2025", tutar: "600₺" }
];

const receipts = ["Makbuz_12Kasım.pdf", "Makbuz_05Kasım.pdf"];

function renderList(id, items, formatter) {
    const el = document.getElementById(id);
    items.forEach(i => {
        el.innerHTML += `<li>${formatter(i)}</li>`;
    });
}

renderList("paidList", paid, i => `${i.tarih} - ${i.tutar}`);
renderList("pendingList", pending, i => `${i.tarih} - ${i.tutar}`);
renderList("receiptList", receipts, i => `${i}`);

function logout() {
    // session temizleme (opsiyonel)
    localStorage.clear();
    sessionStorage.clear();

    // login sayfasına yönlendirme
    window.location.href = 'login.html';
}