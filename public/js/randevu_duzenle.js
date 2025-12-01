/* randevu_duzenle.js
   Tam fonksiyonel: kart/tablo/takvim, arama, filtre, sıralama, modal düzenleme, localStorage
*/

let currentIndex = null;
let currentView = 'cards'; // 'cards' | 'table' | 'calendar'
const STORAGE_KEY = 'randevular_v3';

let listContainer, calendarEl, calendar;
let searchInput, durumFilter, sortSelect;
let editModal, editDanisan, editTarih, editSaat, editDurum;
let modalTitle;

// --- Storage yardımcıları ---
function loadFromStorage() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
}
function saveToStorage(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// --- Başlangıç verisi ---
function getISODateOffset(days = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}
function ensureInitialData() {
    const data = loadFromStorage();
    if (!data || data.length === 0) {
        const init = [
            { danisan: 'Ayşe Demir', tarih: getISODateOffset(1), saat: '10:00', durum: 'Beklemede' },
            { danisan: 'Mehmet Kaya', tarih: getISODateOffset(2), saat: '14:30', durum: 'Onaylandı' },
            { danisan: 'Elif Yılmaz', tarih: getISODateOffset(0), saat: '09:15', durum: 'Tamamlandı' }
        ];
        saveToStorage(init);
    }
}

// --- Yardımcı format / sınıf ---
function formatDateDisplay(iso) {
    if (!iso) return '';
    const s = iso.split('-');
    return `${s[2]}.${s[1]}.${s[0]}`;
}
function durumClass(d) {
    if (!d) return '';
    d = d.toLowerCase();
    if (d.includes('onay')) return 'onay';
    if (d.includes('bekle')) return 'bekle';
    if (d.includes('iptal')) return 'iptal';
    if (d.includes('tamam')) return 'tamam';
    return '';
}
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}
function getEventColor(durum) {
    if(!durum) return '#2980b9';
    durum = durum.toLowerCase();
    if (durum.includes('onay')) return '#27ae60';
    if (durum.includes('bekle')) return '#f1c40f';
    if (durum.includes('iptal')) return '#c0392b';
    if (durum.includes('tamam')) return '#2ecc71';
    return '#2980b9';
}

// --- Render genel ---
function load() {
    if (currentView === 'calendar') renderCalendar();
    else renderListOrTable();
}

function renderListOrTable() {
    let arr = loadFromStorage();
    const arama = (searchInput.value || '').trim().toLowerCase();
    const durum = (durumFilter.value || '');
    const sort = (sortSelect.value || '');

    if (arama) {
        arr = arr.filter(r => r.danisan.toLowerCase().includes(arama));
    }
    if (durum) {
        arr = arr.filter(r => r.durum === durum);
    }
    if (sort === 'tarihAsc') arr.sort((a,b) => new Date(a.tarih) - new Date(b.tarih));
    if (sort === 'tarihDesc') arr.sort((a,b) => new Date(b.tarih) - new Date(a.tarih));

    if (currentView === 'cards') renderCards(arr);
    else renderTable(arr);
}

function renderCards(list) {
    calendarEl.style.display = 'none';
    listContainer.style.display = 'grid';
    listContainer.innerHTML = '';

    if (!list || list.length === 0) {
        listContainer.innerHTML = '<div class="randevu-card"><p>Listelenecek randevu yok.</p></div>';
        return;
    }

    list.forEach((r, idx) => {
        const c = document.createElement('div');
        c.className = 'randevu-card';
        c.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center">
                <h3 style="margin:0">${escapeHtml(r.danisan)}</h3>
                <div><span class="badge ${durumClass(r.durum)}">${escapeHtml(r.durum)}</span></div>
            </div>
            <p style="margin:8px 0 0"><b>Tarih:</b> ${formatDateDisplay(r.tarih)} <b style="margin-left:12px">Saat:</b> ${escapeHtml(r.saat)}</p>
            <div class="buttons">
                <button class="edit-btn" onclick="openModal(${idx})">Düzenle</button>
                <button class="cancel-btn" onclick="cancelRandevu(${idx})">İptal Et</button>
                <button class="mini-btn" onclick="deleteRandevu(${idx})">Sil</button>
            </div>
        `;
        listContainer.appendChild(c);
    });
}

function renderTable(list) {
    calendarEl.style.display = 'none';
    listContainer.style.display = 'block';

    if (!list || list.length === 0) {
        listContainer.innerHTML = '<div class="randevu-card"><p>Listelenecek randevu yok.</p></div>';
        return;
    }

    const rows = list.map((r, idx) => `
        <tr>
            <td>${escapeHtml(r.danisan)}</td>
            <td>${formatDateDisplay(r.tarih)}</td>
            <td>${escapeHtml(r.saat)}</td>
            <td>${escapeHtml(r.durum)}</td>
            <td>
                <button class="edit-btn" onclick="openModal(${idx})">Düzenle</button>
                <button class="cancel-btn" onclick="cancelRandevu(${idx})">İptal</button>
                <button class="mini-btn" onclick="deleteRandevu(${idx})">Sil</button>
            </td>
        </tr>
    `).join('');

    listContainer.innerHTML = `
        <table class="table-view">
            <thead><tr><th>Danışan</th><th>Tarih</th><th>Saat</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// --- FullCalendar ---
function renderCalendar() {
    listContainer.style.display = 'none';
    calendarEl.style.display = 'block';

    const events = loadFromStorage().map((r, i) => ({
        id: String(i),
        title: `${r.danisan} (${r.saat})`,
        start: r.tarih,
        color: getEventColor(r.durum)
    }));

    if (!calendar) {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'tr',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
            height: 'auto',
            selectable: true,
            select: function(selectionInfo) {
                // takvimde tarih seçildi -> yeni randevu modalı aç
                openAddModalWithDate(selectionInfo.startStr);
            },
            eventClick: function(info) {
                const idx = Number(info.event.id);
                openModal(idx);
            }
        });
        calendar.render();
    }

    calendar.removeAllEvents();
    calendar.addEventSource(events);
}

// --- Modal & CRUD ---
function openModal(index) {
    const arr = loadFromStorage();
    if (!arr[index]) {
        alert('Seçilen randevu bulunamadı.');
        return;
    }
    currentIndex = index;
    const r = arr[index];
    modalTitle.textContent = 'Randevu Düzenle';
    editDanisan.value = r.danisan || '';
    editTarih.value = r.tarih || '';
    editSaat.value = r.saat || '';
    editDurum.value = r.durum || '';
    editModal.style.display = 'flex';
    editModal.setAttribute('aria-hidden','false');
}

function openAddModalWithDate(dateStr) {
    currentIndex = null;
    modalTitle.textContent = 'Yeni Randevu Ekle';
    editDanisan.value = '';
    editTarih.value = dateStr || getISODateOffset(0);
    editSaat.value = '09:00';
    editDurum.value = 'Beklemede';
    editModal.style.display = 'flex';
    editModal.setAttribute('aria-hidden','false');
}

function closeModal() {
    editModal.style.display = 'none';
    editModal.setAttribute('aria-hidden','true');
    currentIndex = null;
}

function kaydetDegisiklik() {
    const danisan = editDanisan.value.trim();
    const tarih = editTarih.value;
    const saat = editSaat.value;
    const durum = editDurum.value;

    if (!danisan) { alert('Danışan adı boş bırakılamaz.'); editDanisan.focus(); return; }
    if (!tarih) { alert('Tarih seçiniz.'); editTarih.focus(); return; }
    if (!saat) { alert('Saat seçiniz.'); editSaat.focus(); return; }

    const arr = loadFromStorage();
    if (currentIndex === null) {
        arr.push({ danisan, tarih, saat, durum });
    } else {
        arr[currentIndex] = { danisan, tarih, saat, durum };
    }
    saveToStorage(arr);
    closeModal();
    load();
}

function cancelRandevu(index) {
    if (!confirm('Bu randevuyu iptal etmek istiyor musunuz?')) return;
    const arr = loadFromStorage();
    if (!arr[index]) return;
    arr[index].durum = 'İptal edildi';
    saveToStorage(arr);
    load();
}

function deleteRandevu(index) {
    if (!confirm('Bu randevuyu kalıcı olarak silmek istiyor musunuz?')) return;
    const arr = loadFromStorage();
    arr.splice(index, 1);
    saveToStorage(arr);
    load();
}

// --- Görünüm değişimi ---
function changeView(view) {
    if (view !== 'cards' && view !== 'table' && view !== 'calendar') return;
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + view);
    if (btn) btn.classList.add('active');
    load();
}

function openAddNew() {
    openAddModalWithDate(getISODateOffset(0));
}

// --- Logout ---
function logout() {
    try { sessionStorage.clear(); } catch {}
    // gerektiğinde localStorage.removeItem('authToken') gibi temizleme yapılabilir
    window.location.href = 'login.html';
}

// --- Event listeners & init ---
document.addEventListener('DOMContentLoaded', function() {
    listContainer = document.getElementById('randevuList');
    calendarEl = document.getElementById('calendar');

    searchInput = document.getElementById('searchInput');
    durumFilter = document.getElementById('durumFilter');
    sortSelect = document.getElementById('sortSelect');

    editModal = document.getElementById('editModal');
    editDanisan = document.getElementById('editDanisan');
    editTarih = document.getElementById('editTarih');
    editSaat = document.getElementById('editSaat');
    editDurum = document.getElementById('editDurum');
    modalTitle = document.getElementById('modalTitle');

    // Input eventleri
    if (searchInput) searchInput.addEventListener('input', load);
    if (durumFilter) durumFilter.addEventListener('change', load);
    if (sortSelect) sortSelect.addEventListener('change', load);

    // Modal kapanış: dış tıklama veya ESC
    window.addEventListener('click', function(e) { if (e.target === editModal) closeModal(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

    ensureInitialData();
    load();
});

// --- Global (HTML inline but safer) ---
window.openModal = openModal;
window.closeModal = closeModal;
window.kaydetDegisiklik = kaydetDegisiklik;
window.cancelRandevu = cancelRandevu;
window.deleteRandevu = deleteRandevu;
window.changeView = changeView;
window.logout = logout;
window.openAddNew = openAddNew;
