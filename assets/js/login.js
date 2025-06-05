document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    // Получаем параметр redirect из URL, если он есть
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || 'index.html';
    console.log('login.js: URL для перенаправления после входа:', redirectUrl);

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Предотвращаем стандартную отправку формы

        const formData = new FormData(loginForm);
        const userData = Object.fromEntries(formData.entries());
        
        console.log('login.js: Отправка данных для входа...');

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', { // <--- Полный URL бэкенда
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            console.log('login.js: Ответ от сервера:', response.status, response.ok ? 'OK' : 'Ошибка');

            if (response.ok) {
                console.log('login.js: Вход успешен, сохраняем токен');
                // Сохранить токен (например, в localStorage или cookie)
                localStorage.setItem('token', data.token); // Заменил authToken на token для соответствия админскому скрипту
                
                // Перенаправить пользователя по указанному URL или на главную страницу
                console.log('login.js: Перенаправление на', redirectUrl);
                window.location.href = redirectUrl;
            } else {
                console.log('login.js: Ошибка входа:', data.message);
                alert(data.message); // Показать сообщение об ошибке
                // Можно отобразить сообщение об ошибке на странице
            }

        } catch (error) {
            console.error('login.js: Ошибка при входе:', error);
            alert('Произошла ошибка при входе.');
        }
    });
});