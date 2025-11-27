const randevular = [
    {
        tarih: "20 Kasım 2025",
        tur: "Online Terapi",
        durum: "onaylandı"
    },
    {
        tarih: "18 Kasım 2025",
        tur: "Yüz Yüze Terapi",
        durum: "iptal edildi"
    },
    {
        tarih: "27 Kasım 2025",
        tur: "Bireysel Terapi",
        durum: "onay bekliyor"
    }
];

function renderStatus(status) {
    if (status === "onaylandı") return `<span class='status-approved'>Onaylandı</span>`;
    if (status === "iptal edildi") return `<span class='status-cancelled'>İptal Edildi</span>`;
    return `<span class='status-pending'>Onay Bekliyor</span>`;
}

const table = document.getElementById("apptTable");
randevular.forEach(r => {
    table.innerHTML += `
        <tr>
            <td>${r.tarih}</td>
            <td>${r.tur}</td>
            <td>${renderStatus(r.durum)}</td>
            <td>
                ${r.durum === "onaylandı" ? `<button class='btn-cancel'>İptal Talebi</button>` : "-"}
            </td>
        </tr>
    `;
});

function logout() {
    // session temizleme (opsiyonel)
    localStorage.clear();
    sessionStorage.clear();

    // login sayfasına yönlendirme
    window.location.href = 'login.html';
}