document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Предотвращаем стандартную отправку формы

        const formData = new FormData(registerForm);
        const userData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // Показать сообщение об успехе
                // Можно перенаправить пользователя на другую страницу, например, личный кабинет
                window.location.href = '/login.html';
            } else {
                alert(data.message); // Показать сообщение об ошибке
                // Можно отобразить сообщение об ошибке в более удобном для пользователя виде на странице
            }

        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            alert('Произошла ошибка при регистрации.');
        }
    });
});