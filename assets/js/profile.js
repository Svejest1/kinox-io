// Базовый URL API
const API_BASE_URL = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', () => {
    // Загрузка данных профиля
    loadProfileData();
    
    // Настройка обработчиков событий для кнопок
    setupEventListeners();
});

// Установка обработчиков событий
function setupEventListeners() {
    // Кнопка "Редактировать профиль"
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            showEditForm();
        });
    }
    
    // Кнопка "Отмена" в форме редактирования
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            hideEditForm();
        });
    }
    
    // Обработчик отправки формы
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileData();
        });
    }
    
    // Настройка меню пользователя
    const profileButton = document.getElementById('profileButton');
    const userDropdownContainer = document.getElementById('userDropdownContainer');
    const logoutButton = document.getElementById('logoutButton');
    
    if (profileButton && userDropdownContainer) {
        profileButton.addEventListener('click', function(event) {
            event.stopPropagation();
            userDropdownContainer.style.display = userDropdownContainer.style.display === 'block' ? 'none' : 'block';
        });
        
        // Закрытие выпадающего меню при клике вне него
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.user-menu-container')) {
                userDropdownContainer.style.display = 'none';
            }
        });
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
}

// Загрузка данных профиля
async function loadProfileData() {
    const usernameElement = document.getElementById('username');
    const emailElement = document.getElementById('email');
    const firstNameElement = document.getElementById('firstName');
    const lastNameElement = document.getElementById('lastName');
    const phoneNumberElement = document.getElementById('phoneNumber');

    // Проверяем оба возможных ключа для токена
    const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');

    if (!authToken) {
        console.log('Токен авторизации не найден. Пользователь не авторизован.');
        usernameElement.textContent = 'Не авторизован';
        emailElement.textContent = 'Не авторизован';
        if (firstNameElement) firstNameElement.textContent = 'Не авторизован';
        if (lastNameElement) lastNameElement.textContent = 'Не авторизован';
        if (phoneNumberElement) phoneNumberElement.textContent = 'Не авторизован';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Ошибка при загрузке данных профиля:', response.status);
            if (response.status === 401) {
                usernameElement.textContent = 'Ошибка авторизации';
                emailElement.textContent = 'Ошибка авторизации';
                if (firstNameElement) firstNameElement.textContent = 'Ошибка авторизации';
                if (lastNameElement) lastNameElement.textContent = 'Ошибка авторизации';
                if (phoneNumberElement) phoneNumberElement.textContent = 'Ошибка авторизации';
                // Возможно, стоит перенаправить пользователя на страницу логина
                // window.location.href = 'login.html';
            } else {
                usernameElement.textContent = 'Ошибка загрузки';
                emailElement.textContent = 'Ошибка загрузки';
                if (firstNameElement) firstNameElement.textContent = 'Ошибка загрузки';
                if (lastNameElement) lastNameElement.textContent = 'Ошибка загрузки';
                if (phoneNumberElement) phoneNumberElement.textContent = 'Ошибка загрузки';
            }
            return;
        }

        const data = await response.json();
        usernameElement.textContent = data.username;
        emailElement.textContent = data.email;
        
        // Заполняем дополнительные поля, если они есть в данных и на странице
        if (firstNameElement) {
            firstNameElement.textContent = data.first_name || 'Не указано';
        }
        
        if (lastNameElement) {
            lastNameElement.textContent = data.last_name || 'Не указано';
        }
        
        if (phoneNumberElement) {
            phoneNumberElement.textContent = data.phone_number || 'Не указано';
        }

    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        usernameElement.textContent = 'Ошибка соединения';
        emailElement.textContent = 'Ошибка соединения';
        if (firstNameElement) firstNameElement.textContent = 'Ошибка соединения';
        if (lastNameElement) lastNameElement.textContent = 'Ошибка соединения';
        if (phoneNumberElement) phoneNumberElement.textContent = 'Ошибка соединения';
    }
}

// Показать форму редактирования
function showEditForm() {
    const viewSection = document.getElementById('profileViewSection');
    const editSection = document.getElementById('profileEditSection');
    
    if (viewSection) viewSection.style.display = 'none';
    if (editSection) editSection.style.display = 'block';
}

// Скрыть форму редактирования
function hideEditForm() {
    const viewSection = document.getElementById('profileViewSection');
    const editSection = document.getElementById('profileEditSection');
    
    if (viewSection) viewSection.style.display = 'block';
    if (editSection) editSection.style.display = 'none';
}

// Сохранение данных профиля
async function saveProfileData() {
    const formElements = {
        username: document.getElementById('usernameInput'),
        email: document.getElementById('emailInput'),
        firstName: document.getElementById('firstNameInput'),
        lastName: document.getElementById('lastNameInput'),
        phoneNumber: document.getElementById('phoneNumberInput')
    };
    
    const userData = {
        username: formElements.username ? formElements.username.value : '',
        email: formElements.email ? formElements.email.value : '',
        first_name: formElements.firstName ? formElements.firstName.value : '',
        last_name: formElements.lastName ? formElements.lastName.value : '',
        phone_number: formElements.phoneNumber ? formElements.phoneNumber.value : ''
    };
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Вы не авторизованы. Пожалуйста, войдите в систему.');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка при обновлении профиля: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Показываем сообщение об успешном обновлении
        alert('Профиль успешно обновлен!');
        
        // Обновляем отображаемые данные и скрываем форму
        loadProfileData();
        hideEditForm();
        
    } catch (error) {
        console.error('Ошибка при сохранении профиля:', error);
        alert(`Ошибка при сохранении профиля: ${error.message}`);
    }
}