// =============================================
// СТРАНИЦА КЛАНА: СОСТАВ / ЗАЯВКИ / ПРАВИЛА
// =============================================

// ⚠️ Список email'ов офицеров клана (могут управлять заявками)
const OFFICER_EMAILS = [
    'admin@mail.ru',          // ← твой админ
    'officer@mail.ru'         // ← добавь других офицеров
];

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.clan-tab');
    const sections = document.querySelectorAll('.clan-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(target + '-section').classList.add('active');
        });
    });

    waitForFirebaseClan();
});

function waitForFirebaseClan() {
    if (window.firebaseReady && window.db && window.auth) {
        initClanPage();
    } else {
        setTimeout(waitForFirebaseClan, 100);
    }
}

async function initClanPage() {
    await loadMembers();
    await trackUserForApplications();
    await loadApplications();

    // Поиск и фильтр по составу
    const search = document.getElementById('member-search');
    const roleFilter = document.getElementById('member-role-filter');
    if (search) search.addEventListener('input', filterMembers);
    if (roleFilter) roleFilter.addEventListener('change', filterMembers);

    // Форма подачи заявки
    const appForm = document.getElementById('application-form');
    if (appForm) {
        appForm.addEventListener('submit', submitApplication);
    }
}

// ==========================================
// СОСТАВ КЛАНА
// ==========================================
let allMembers = [];

async function loadMembers() {
    const container = document.getElementById('members-container');
    if (!container) return;

    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );

        const snap = await getDocs(collection(window.db, 'clan_members'));
        allMembers = [];
        snap.forEach(doc => allMembers.push({ id: doc.id, ...doc.data() }));

        // Если коллекция пуста — покажем демо-данные
        if (allMembers.length === 0) {
            allMembers = DEMO_MEMBERS;
        }

        // Обновляем счётчик в hero
        const counter = document.getElementById('clan-members-count');
        if (counter) counter.textContent = allMembers.length;

        renderMembers(allMembers);

    } catch (error) {
        console.error('❌ Ошибка загрузки состава:', error);
        allMembers = DEMO_MEMBERS;
        renderMembers(allMembers);
    }
}

const DEMO_MEMBERS = [
    { nickname: 'NightWolf',  role: 'Лидер',     game: 'Dota 2',               rank: 'Immortal',  online: true  },
    { nickname: 'ShadowFox',  role: 'Офицер',    game: 'PUBG: BATTLEGROUNDS',  rank: 'Conqueror', online: true  },
    { nickname: 'GhostRider', role: 'Офицер',    game: 'Cyberpunk 2077',       rank: 'Veteran',   online: false },
    { nickname: 'IronFist',   role: 'Ветеран',   game: 'Dota 2',               rank: 'Divine V',  online: true  },
    { nickname: 'SilentBlade',role: 'Ветеран',   game: 'PUBG: BATTLEGROUNDS',  rank: 'Ace',       online: false },
    { nickname: 'Raven',      role: 'Участник',  game: 'Cyberpunk 2077',       rank: 'Pro',       online: true  },
    { nickname: 'Frost',      role: 'Участник',  game: 'Dota 2',               rank: 'Ancient',   online: false },
    { nickname: 'NeonPulse',  role: 'Новобранец',game: 'PUBG: BATTLEGROUNDS',  rank: 'Diamond',   online: true  },
    { nickname: 'Vortex',     role: 'Новобранец',game: 'Dota 2',               rank: 'Legend',    online: false }
];

const ROLE_ICONS = {
    'Лидер': '👑',
    'Офицер': '🎖️',
    'Ветеран': '⭐',
    'Участник': '🔹',
    'Новобранец': '🌱'
};

function renderMembers(members) {
    const container = document.getElementById('members-container');
    if (!container) return;

    if (members.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Никого не найдено</p>';
        return;
    }

    container.innerHTML = members.map(m => `
        <div class="member-card ${m.online ? 'online' : 'offline'}">
            <div class="member-avatar">${m.nickname.charAt(0).toUpperCase()}</div>
            <h3 class="member-nickname">${ROLE_ICONS[m.role] || ''} ${m.nickname}</h3>
            <div class="member-role role-${m.role.toLowerCase()}">${m.role}</div>
            <div class="member-info">
                <p>🎮 ${m.game}</p>
                <p>🏅 ${m.rank}</p>
            </div>
            <div class="member-status">
                ${m.online ? '🟢 В сети' : '⚫ Оффлайн'}
            </div>
        </div>
    `).join('');
}

function filterMembers() {
    const query = document.getElementById('member-search').value.toLowerCase().trim();
    const role = document.getElementById('member-role-filter').value;

    const filtered = allMembers.filter(m => {
        const matchName = m.nickname.toLowerCase().includes(query);
        const matchRole = !role || m.role === role;
        return matchName && matchRole;
    });

    renderMembers(filtered);
}

// ==========================================
// ЗАЯВКИ
// ==========================================

async function trackUserForApplications() {
    const { onAuthStateChanged } = await import(
        'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
    );

    onAuthStateChanged(window.auth, (user) => {
        const listWrapper = document.getElementById('applications-list-wrapper');
        const guestMsg = document.getElementById('applications-guest-message');
        const appForm = document.getElementById('application-form');

        if (user && OFFICER_EMAILS.includes(user.email)) {
            // Офицер — видит заявки
            listWrapper.style.display = 'block';
            guestMsg.style.display = 'none';
            loadApplications();
        } else {
            // Обычный пользователь / гость
            listWrapper.style.display = 'none';
            guestMsg.style.display = 'block';
        }

        // Форму может видеть только авторизованный
        if (user) {
            appForm.style.opacity = '1';
            appForm.style.pointerEvents = 'auto';
        } else {
            appForm.style.opacity = '0.6';
            appForm.style.pointerEvents = 'none';
        }
    });
}

async function submitApplication(event) {
    event.preventDefault();

    const user = window.auth.currentUser;
    if (!user) {
        alert('⚠️ Сначала войдите через кнопку «Войти»');
        return;
    }

    const nickname = document.getElementById('app-nickname').value.trim();
    const discord  = document.getElementById('app-discord').value.trim();
    const game     = document.getElementById('app-game').value;
    const rank     = document.getElementById('app-rank').value.trim();
    const message  = document.getElementById('app-message').value.trim();

    if (!nickname || !game) {
        alert('⚠️ Заполните обязательные поля (ник и игра)');
        return;
    }

    try {
        const { collection, addDoc } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );

        await addDoc(collection(window.db, 'clan_applications'), {
            nickname,
            discord,
            game,
            rank,
            message,
            userEmail: user.email,
            userName: user.displayName || user.email.split('@')[0],
            status: 'pending',
            createdAt: new Date()
        });

        alert('✅ Заявка отправлена! Офицер свяжется с вами.');
        event.target.reset();
        loadApplications();

    } catch (error) {
        console.error('❌ Ошибка отправки заявки:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

async function loadApplications() {
    const container = document.getElementById('applications-container');
    if (!container) return;

    const user = window.auth.currentUser;
    if (!user || !OFFICER_EMAILS.includes(user.email)) return;

    container.innerHTML = '<p>Загрузка заявок...</p>';

    try {
        const { collection, query, orderBy, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );

        const q = query(
            collection(window.db, 'clan_applications'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);

        if (snap.size === 0) {
            container.innerHTML = '<p class="empty-state">📭 Пока нет заявок</p>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const a = doc.data();
            const status = a.status || 'pending';
            html += `
                <div class="application-card status-${status}" data-id="${doc.id}">
                    <div class="app-header">
                        <strong>${a.nickname}</strong>
                        <span class="app-status-badge">${statusLabel(status)}</span>
                    </div>
                    <p>🎮 ${a.game} ${a.rank ? '· ' + a.rank : ''}</p>
                    <p>💬 ${a.discord || '—'}</p>
                    <p class="app-message">${a.message || '<em>без комментария</em>'}</p>
                    <p class="app-meta">от ${a.userName || a.userEmail}</p>
                    ${status === 'pending' ? `
                        <div class="app-actions">
                            <button class="mini-btn accept" data-id="${doc.id}">✅ Принять</button>
                            <button class="mini-btn reject" data-id="${doc.id}">❌ Отклонить</button>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
        attachApplicationHandlers();

    } catch (error) {
        console.error('❌ Ошибка загрузки заявок:', error);
        container.innerHTML = `<p style="color:red;">Ошибка: ${error.message}</p>`;
    }
}

function statusLabel(status) {
    return { pending: '⏳ На рассмотрении', accepted: '✅ Принята', rejected: '❌ Отклонена' }[status] || status;
}

function attachApplicationHandlers() {
    document.querySelectorAll('.mini-btn.accept').forEach(btn => {
        btn.addEventListener('click', () => updateApplicationStatus(btn.dataset.id, 'accepted'));
    });
    document.querySelectorAll('.mini-btn.reject').forEach(btn => {
        btn.addEventListener('click', () => updateApplicationStatus(btn.dataset.id, 'rejected'));
    });
}

async function updateApplicationStatus(id, status) {
    if (status === 'accepted' && !confirm('Принять заявку? Игрок попадёт в состав.')) return;
    if (status === 'rejected' && !confirm('Отклонить заявку?')) return;

    try {
        const { doc, updateDoc } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );

        await updateDoc(doc(window.db, 'clan_applications', id), { status });

        // Если приняли — добавим в состав клана
        if (status === 'accepted') {
            const { getDoc, collection, addDoc } = await import(
                'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
            );
            const appSnap = await getDoc(doc(window.db, 'clan_applications', id));
            if (appSnap.exists()) {
                const a = appSnap.data();
                await addDoc(collection(window.db, 'clan_members'), {
                    nickname: a.nickname,
                    role: 'Новобранец',
                    game: a.game,
                    rank: a.rank || '—',
                    online: false
                });
                loadMembers();
            }
        }

        alert(`✅ Статус заявки: ${status === 'accepted' ? 'принята' : 'отклонена'}`);
        loadApplications();

    } catch (error) {
        console.error('❌ Ошибка обновления:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}
