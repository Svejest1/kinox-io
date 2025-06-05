// Проверка наличия токена авторизации и статуса пользователя
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    console.log('auth-check.js: Проверка токена:', token ? 'Токен найден' : 'Токен не найден');
    
    const profileButton = document.getElementById('profileButton');
    const userDropdownContainer = document.getElementById('userDropdownContainer');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const logoutButton = document.getElementById('logoutButton');
    
    // Функция для выхода из аккаунта
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    };
    
    // Обработчик для кнопки выхода
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Обработчик для кнопки профиля (показать/скрыть выпадающее меню)
    if (profileButton) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownContainer.classList.toggle('show');
        });
    }
    
    // Закрыть выпадающее меню при клике вне его
    document.addEventListener('click', (e) => {
        if (userDropdownContainer && userDropdownContainer.classList.contains('show') && !userDropdownContainer.contains(e.target)) {
            userDropdownContainer.classList.remove('show');
        }
    });
    
    // Если нет токена, меняем ссылки в меню пользователя
    if (!token && userDropdownMenu) {
        console.log('auth-check.js: Нет токена, меняем меню на гостевое');
        userDropdownMenu.innerHTML = `
            <a href="login.html">Войти</a>
            <a href="register.html">Регистрация</a>
        `;
        return;
    }
    
    // Если есть токен, проверяем его валидность
    if (token) {
        try {
            console.log('auth-check.js: Проверяем валидность токена...');
            
            const response = await fetch('http://localhost:3001/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('auth-check.js: Ответ от сервера:', response.status, response.ok ? 'OK' : 'Ошибка');
            
            if (!response.ok) {
                // Токен невалидный, удаляем его
                console.log('auth-check.js: Токен невалидный, удаляем');
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                
                if (userDropdownMenu) {
                    userDropdownMenu.innerHTML = `
                        <a href="login.html">Войти</a>
                        <a href="register.html">Регистрация</a>
                    `;
                }
                return;
            }
            
            // Получаем информацию о пользователе
            const userData = await response.json();
            console.log('auth-check.js: Получена информация о пользователе:', userData);
            
            // Сохраняем данные пользователя в localStorage
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Добавляем ссылку на историю бронирований, если её нет
            if (userDropdownMenu) {
                const bookingsLink = userDropdownMenu.querySelector('a[href="user-bookings.html"]');
                
                if (!bookingsLink) {
                    const profileLink = userDropdownMenu.querySelector('a[href="profile.html"]');
                    
                    if (profileLink) {
                        const bookingsLinkElement = document.createElement('a');
                        bookingsLinkElement.href = 'user-bookings.html';
                        bookingsLinkElement.textContent = 'История бронирований';
                        
                        profileLink.insertAdjacentElement('afterend', bookingsLinkElement);
                    }
                }
            }
            
        } catch (error) {
            console.error('auth-check.js: Ошибка при проверке токена:', error);
        }
    }
});