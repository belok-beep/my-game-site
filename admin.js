document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // ЭЛЕМЕНТЫ
    // ==========================================
    
    const loginBtn = document.getElementById('login-btn');
    const authModal = document.getElementById('auth-modal');
    const modalClose = document.getElementById('modal-close');
    const userMenu = document.getElementById('user-menu');
    
    // ==========================================
    // ОТКРЫТИЕ МОДАЛЬНОГО ОКНА
    // ==========================================
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            authModal.classList.add('active');
            console.log('🔐 Открыто модальное окно аутентификации');
        });
    }
    
    // ==========================================
    // ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
    // ==========================================
    
    // Кнопка ✕
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            authModal.classList.remove('active');
        });
    }
    
    // Клик по фону
    if (authModal) {
        authModal.addEventListener('click', function(event) {
            if (event.target === authModal) {
                authModal.classList.remove('active');
            }
        });
    }
    
    // Esc
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
        }
    });
    
    // ==========================================
    // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    // ==========================================
    
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.getAttribute('data-tab');
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(tabName + '-form').classList.add('active');
        });
    });
    
    // ==========================================
    // РЕГИСТРАЦИЯ
    // ==========================================
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            
            try {
                const { createUserWithEmailAndPassword, updateProfile } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
                );
                
                const userCredential = await createUserWithEmailAndPassword(
                    window.auth, email, password
                );
                
                await updateProfile(userCredential.user, {
                    displayName: name
                });
                
                console.log('✅ Регистрация успешна:', userCredential.user.email);
                alert('✅ Вы успешно зарегистрированы!');
                
                registerForm.reset();
                authModal.classList.remove('active');
                
            } catch (error) {
                console.error('❌ Ошибка регистрации:', error);
                handleAuthError(error);
            }
        });
    }
    
    // ==========================================
    // ВХОД
    // ==========================================
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            try {
                const { signInWithEmailAndPassword } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
                );
                
                const userCredential = await signInWithEmailAndPassword(
                    window.auth, email, password
                );
                
                console.log('✅ Вход выполнен:', userCredential.user.email);
                alert('✅ Вы успешно вошли!');
                
                loginForm.reset();
                authModal.classList.remove('active');
                
            } catch (error) {
                console.error('❌ Ошибка входа:', error);
                handleAuthError(error);
            }
        });
    }
    
    // ==========================================
    // ВЫХОД
    // ==========================================
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const { signOut } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
                );
                
                await signOut(window.auth);
                console.log('✅ Выход выполнен');
                alert('Вы вышли из аккаунта');
                
            } catch (error) {
                console.error('❌ Ошибка выхода:', error);
            }
        });
    }
    
    // ==========================================
    // ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ
    // ==========================================
    
    waitForAuthForModal();
    
});

// ==========================================
// ОЖИДАНИЕ FIREBASE AUTH
// ==========================================

function waitForAuthForModal() {
    if (window.firebaseReady && window.auth) {
        trackAuthStateForModal();
    } else {
        setTimeout(waitForAuthForModal, 100);
    }
}

// ==========================================
// ОТСЛЕЖИВАНИЕ ВХОДА/ВЫХОДА
// ==========================================

async function trackAuthStateForModal() {
    const { onAuthStateChanged } = await import(
        'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
    );
    
    onAuthStateChanged(window.auth, function(user) {
        const loginBtn = document.getElementById('login-btn');
        const userMenu = document.getElementById('user-menu');
        const addGameWrapper = document.getElementById('add-game-wrapper');
        
        if (user) {
            // Пользователь вошёл
            console.log('👤 Пользователь авторизован:', user.email);
            
            loginBtn.style.display = 'none';
            userMenu.style.display = 'flex';
            
            document.getElementById('user-display-name').textContent = 
                user.displayName || user.email.split('@')[0];
            
            // Показываем форму добавления игры
            if (addGameWrapper) {
                addGameWrapper.style.display = 'block';
            }
            
        } else {
            // Пользователь вышел
            console.log('👤 Пользователь не авторизован');
            
            loginBtn.style.display = 'block';
            userMenu.style.display = 'none';
            
            // Скрываем форму добавления игры
            if (addGameWrapper) {
                addGameWrapper.style.display = 'none';
            }
        }
    });
}

// ==========================================
// ОБРАБОТКА ОШИБОК
// ==========================================

function handleAuthError(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            alert('❌ Этот email уже используется');
            break;
        case 'auth/invalid-email':
            alert('❌ Неверный формат email');
            break;
        case 'auth/weak-password':
            alert('❌ Пароль слишком простой (мин. 6 символов)');
            break;
        case 'auth/user-not-found':
            alert('❌ Пользователь не найден');
            break;
        case 'auth/wrong-password':
            alert('❌ Неверный пароль');
            break;
        case 'auth/invalid-credential':
            alert('❌ Неверный email или пароль');
            break;
        default:
            alert('❌ Ошибка: ' + error.message);
    }
}

// =============================================
// ЛАБОРАТОРНАЯ №10: Административная панель
// =============================================

// ⚠️ ЗАМЕНИ НА СВОЙ EMAIL АДМИНИСТРАТОРА!
const ADMIN_EMAIL = 'admin@mail.ru';

// ==========================================
// ПРОВЕРКА ДОСТУПА
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    waitForAuthForAdmin();
});

function waitForAuthForAdmin() {
    if (window.firebaseReady && window.auth) {
        checkAdminAccess();
    } else {
        setTimeout(waitForAuthForAdmin, 100);
    }
}

async function checkAdminAccess() {
    const { onAuthStateChanged } = await import(
        'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
    );
    
    onAuthStateChanged(window.auth, function(user) {
        const adminContent = document.getElementById('admin-content');
        const accessDenied = document.getElementById('access-denied');
        
        if (user && user.email === ADMIN_EMAIL) {
            // Доступ разрешён
            console.log('✅ Доступ к админ-панели разрешён');
            adminContent.style.display = 'block';
            accessDenied.style.display = 'none';
            
            document.getElementById('admin-email').textContent = user.email;
            
            // Загружаем данные
            loadStats();
            loadAdminGames();
            
        } else {
            // Доступ запрещён
            console.log('❌ Доступ запрещён');
            adminContent.style.display = 'none';
            accessDenied.style.display = 'block';
        }
    });
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            const { signOut } = await import(
                'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
            );
            await signOut(window.auth);
            window.location.href = 'index.html';
        });
    }
}

// ==========================================
// СТАТИСТИКА
// ==========================================

async function loadStats() {
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );
        
        // Игры
        const gamesSnapshot = await getDocs(collection(window.db, 'games'));
        const gamesCount = gamesSnapshot.size;
        
        // Средний рейтинг
        let totalRating = 0;
        gamesSnapshot.forEach(function(doc) {
            totalRating += parseFloat(doc.data().rating) || 0;
        });
        const avgRating = gamesCount > 0 ? (totalRating / gamesCount).toFixed(1) : 0;
        
        // Рекорды
        const scoresSnapshot = await getDocs(collection(window.db, 'scores'));
        
        document.getElementById('stat-games').textContent = gamesCount;
        document.getElementById('stat-scores').textContent = scoresSnapshot.size;
        document.getElementById('stat-avg').textContent = avgRating;
        
        console.log('📊 Статистика загружена');
        
    } catch (error) {
        console.error('❌ Ошибка статистики:', error);
    }
}

// ==========================================
// ТАБЛИЦА ИГР
// ==========================================

async function loadAdminGames() {
    const tbody = document.getElementById('admin-games-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Загрузка...</td></tr>';
    
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );
        
        const querySnapshot = await getDocs(collection(window.db, 'games'));
        
        tbody.innerHTML = '';
        
        if (querySnapshot.size === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Нет игр</td></tr>';
            return;
        }
        
        querySnapshot.forEach(function(doc) {
            const game = doc.data();
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><code>${doc.id.substring(0, 8)}...</code></td>
                <td>${game.title}</td>
                <td>${game.genre}</td>
                <td>⭐ ${game.rating}</td>
                <td>
                    <div class="admin-actions-cell">
                        <button class="mini-btn edit" data-id="${doc.id}">✏️</button>
                        <button class="mini-btn delete" data-id="${doc.id}">🗑️</button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Навешиваем обработчики
        attachAdminHandlers();
        
        console.log('✅ Загружено игр:', querySnapshot.size);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Ошибка: ${error.message}</td></tr>`;
    }
}

// ==========================================
// ОБРАБОТЧИКИ
// ==========================================

function attachAdminHandlers() {
    // Удаление
    document.querySelectorAll('.mini-btn.delete').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            const id = btn.getAttribute('data-id');
            
            if (!confirm('Удалить эту игру?')) return;
            
            try {
                const { doc, deleteDoc } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
                );
                await deleteDoc(doc(window.db, 'games', id));
                console.log('✅ Игра удалена');
                loadAdminGames();
                loadStats();
            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert('Ошибка: ' + error.message);
            }
        });
    });
    
    // Редактирование (быстрое — через prompt)
    document.querySelectorAll('.mini-btn.edit').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            const id = btn.getAttribute('data-id');
            const row = btn.closest('tr');
            const currentTitle = row.cells[1].textContent;
            
            const newTitle = prompt('Новое название:', currentTitle);
            if (newTitle === null) return;
            
            try {
                const { doc, updateDoc } = await import(
                    'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
                );
                await updateDoc(doc(window.db, 'games', id), {
                    title: newTitle.trim()
                });
                console.log('✅ Игра обновлена');
                loadAdminGames();
            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert('Ошибка: ' + error.message);
            }
        });
    });
}
// ФОРМА ДОБАВЛЕНИЯ ИГРЫ (перенесена из ЛР №6)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('add-game-form');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const title = document.getElementById('title').value.trim();
            const genre = document.getElementById('genre').value.trim();
            const rating = parseFloat(document.getElementById('rating').value);
            const imageUrl = document.getElementById('imageUrl').value.trim();

            if (!title || !genre || isNaN(rating)) {
                alert('⚠️ Заполните все обязательные поля!');
                return;
            }

            try {
                const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');
                await addDoc(collection(window.db, 'games'), {
                    title: title,
                    genre: genre,
                    rating: rating,
                    imageUrl: imageUrl || 'https://via.placeholder.com/280x150'
                });
                console.log('✅ Игра добавлена!');
                alert('🎮 Игра успешно добавлена!');
                form.reset();
                loadAdminGames();
                loadStats();
            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert('❌ Ошибка при добавлении: ' + error.message);
            }
        });
    }
});
// ==========================================
// ЭКСПОРТ В CSV (САМОСТОЯТЕЛЬНАЯ РАБОТА)
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadAdminGames();
            loadStats();
        });
    }
});

async function exportToCSV() {
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
        );
        
        const querySnapshot = await getDocs(collection(window.db, 'games'));
        
        // Формируем CSV
        let csv = 'ID,Название,Жанр,Рейтинг,Картинка\n';
        
        querySnapshot.forEach(function(doc) {
            const game = doc.data();
            csv += `"${doc.id}","${game.title}","${game.genre}","${game.rating}","${game.imageUrl || ''}"\n`;
        });
        
        // Скачиваем файл
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'games_' + new Date().toISOString().slice(0, 10) + '.csv';
        link.click();
        
        console.log('✅ Экспорт завершён');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        alert('Ошибка: ' + error.message);
    }
}
