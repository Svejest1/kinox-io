// Основной JavaScript файл для сайта КиноX

document.addEventListener('DOMContentLoaded', () => {
    console.log('КиноX: DOM полностью загружен и готов.');

    // Удаляем вызов loadInitialMovies, так как фильмы загружаются в movies.js
    // loadInitialMovies();

    // *** НАЧАЛО БЛОКА КОДА ДЛЯ ОБРАБОТКИ АВТОРИЗАЦИИ И МЕНЮ ПРОФИЛЯ ***
    const profileButton = document.getElementById('profileButton');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const logoutButton = document.getElementById('logoutButton');
    const userActions = document.querySelector('.user-actions'); // Контейнер для кнопки профиля

    const authToken = localStorage.getItem('token'); // Проверяем наличие токена

    function showBurgerMenu() {
        profileButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
            </svg>
        `;
        profileButton.style.cursor = 'pointer';
        profileButton.removeEventListener('click', redirectToLogin); // Убираем старый обработчик
        profileButton.addEventListener('click', toggleDropdownMenu);
    
        // Показываем контейнер с выпадающим меню
        const dropdownContainer = document.getElementById('userDropdownContainer');
        if (dropdownContainer) {
            dropdownContainer.style.display = 'inline-block'; // Или 'block', в зависимости от нужного отображения
        }
    }

    function showProfileIcon() {
        profileButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        `;
        profileButton.style.cursor = 'pointer';
        profileButton.addEventListener('click', redirectToLogin);
    }

    function toggleDropdownMenu(event) {
        event.stopPropagation();
        const dropdownContainer = document.getElementById('userDropdownContainer');
        if (dropdownContainer) {
            const dropdownContent = dropdownContainer.querySelector('.dropdown-content');
            if (dropdownContent) {
                dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
            }
        }
    }

    function redirectToLogin() {
        window.location.href = '/login.html';
    }

    // Проверка авторизации при загрузке страницы
    if (authToken) {
        showBurgerMenu();
    } else {
        showProfileIcon();
    }

    // Закрытие выпадающего меню при клике вне контейнера
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.user-menu-container')) {
            userDropdownMenu.style.display = 'none';
        }
    });

    // Обработчик выхода
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            showProfileIcon(); // Возвращаем иконку профиля
            window.location.reload(); // Обновляем страницу
        });
    }
    // *** КОНЕЦ БЛОКА КОДА ДЛЯ ОБРАБОТКИ АВТОРИЗАЦИИ И МЕНЮ ПРОФИЛЯ ***

    // Мобильное меню
    const burgerMenuBtn = document.querySelector('.burger-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (burgerMenuBtn && mainNav) {
        burgerMenuBtn.addEventListener('click', () => {
            const isExpanded = burgerMenuBtn.getAttribute('aria-expanded') === 'true';
            burgerMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mainNav.classList.toggle('active');
        });
    }
    
    // Кнопки бронирования на главной странице
    const bookButtons = document.querySelectorAll('.book-button');
    
    if (bookButtons.length > 0) {
        bookButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const screeningId = button.dataset.screeningId;
                
                if (screeningId) {
                    window.location.href = `seat-selection.html?screening_id=${screeningId}`;
                } else {
                    console.error('ID сеанса не найден');
                }
            });
        });
    }
    
    // Обработка клика на фильм (переход на страницу фильма)
    const movieCards = document.querySelectorAll('.movie-card');
    
    if (movieCards.length > 0) {
        movieCards.forEach(card => {
            card.addEventListener('click', (event) => {
                // Игнорируем клик по кнопке бронирования
                if (event.target.closest('.book-button')) {
                    return;
                }
                
                const movieId = card.dataset.movieId;
                
                if (movieId) {
                    window.location.href = `movie.html?id=${movieId}`;
                }
            });
        });
    }
});