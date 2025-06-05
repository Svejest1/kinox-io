document.addEventListener('DOMContentLoaded', () => {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    
    if (!bookingId) {
        alert('Не указан ID бронирования');
        window.location.href = 'index.html';
        return;
    }
    
    // Глобальные переменные
    let bookingData = null;
    let timerInterval = null;
    
    // DOM элементы
    const bookingStatusHeader = document.getElementById('bookingStatusHeader');
    const bookingStatus = document.getElementById('bookingStatus');
    let expiryTimer = document.getElementById('expiryTimer');
    const moviePoster = document.getElementById('moviePoster');
    const movieTitle = document.getElementById('movieTitle');
    const screeningDate = document.getElementById('screeningDate');
    const screeningTime = document.getElementById('screeningTime');
    const hallName = document.getElementById('hallName');
    const screeningFormat = document.getElementById('screeningFormat');
    const seatsList = document.getElementById('seatsList');
    const bookingNumber = document.getElementById('bookingNumber');
    const bookingTime = document.getElementById('bookingTime');
    const expiryTime = document.getElementById('expiryTime');
    const totalPrice = document.getElementById('totalPrice');
    const confirmPaymentButton = document.getElementById('confirmPaymentButton');
    const cancelBookingButton = document.getElementById('cancelBookingButton');
    
    // Функция для форматирования даты
    const formatDate = (dateString) => {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };
    
    // Функция для форматирования времени
    const formatTime = (timeString) => {
        return timeString.substring(0, 5);
    };
    
    // Функция для форматирования даты и времени
    const formatDateTime = (dateTimeString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' };
        return new Date(dateTimeString).toLocaleString('ru-RU', options);
    };
    
    // Функция для форматирования цены
    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('ru-RU') + ' ₽';
    };
    
    // Функция для обновления таймера обратного отсчета
    const updateExpiryTimer = () => {
        if (!bookingData || bookingData.status !== 'temporary' || !bookingData.expiry_time) {
            clearInterval(timerInterval);
            if (expiryTimer && expiryTimer.parentElement) {
            expiryTimer.parentElement.style.display = 'none';
            }
            return;
        }
        
        const now = new Date();
        const expiryDateTime = new Date(bookingData.expiry_time);
        const diff = expiryDateTime - now;
        
        if (diff <= 0) {
            clearInterval(timerInterval);
            expiryTimer.textContent = '00:00';
            // Бронирование истекло, обновляем UI
            updateBookingStatus('expired');
            return;
        }
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        expiryTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    // Функция для обновления статуса бронирования
    const updateBookingStatus = (status) => {
        const bookingStatusElement = document.querySelector('.booking-status');
        
        // Удаляем все классы статусов
        bookingStatusElement.classList.remove('temporary', 'confirmed', 'cancelled', 'expired');
        
        let statusTitle = '';
        let statusMessage = '';
        
        switch (status) {
            case 'temporary':
                statusTitle = 'Бронирование ожидает подтверждения';
                statusMessage = 'Ваше бронирование успешно создано и действительно в течение <span id="expiryTimer">15:00</span>';
                bookingStatusElement.classList.add('temporary');
                confirmPaymentButton.disabled = false;
                cancelBookingButton.disabled = false;
                break;
                
            case 'confirmed':
                statusTitle = 'Бронирование подтверждено';
                statusMessage = 'Спасибо за заказ! Ваш билет был отправлен на указанный email.';
                bookingStatusElement.classList.add('confirmed');
                confirmPaymentButton.disabled = true;
                cancelBookingButton.disabled = false;
                break;
                
            case 'cancelled':
                statusTitle = 'Бронирование отменено';
                statusMessage = 'Ваше бронирование было отменено.';
                bookingStatusElement.classList.add('cancelled');
                confirmPaymentButton.disabled = true;
                cancelBookingButton.disabled = true;
                break;
                
            case 'expired':
                statusTitle = 'Бронирование истекло';
                statusMessage = 'Время бронирования истекло. Пожалуйста, создайте новое бронирование.';
                bookingStatusElement.classList.add('expired');
                confirmPaymentButton.disabled = true;
                cancelBookingButton.disabled = true;
                break;
                
            default:
                statusTitle = 'Статус бронирования неизвестен';
                statusMessage = 'Не удалось определить статус бронирования.';
                confirmPaymentButton.disabled = true;
                cancelBookingButton.disabled = true;
        }
        
        bookingStatusHeader.innerHTML = `
            <h1 class="status-title">${statusTitle}</h1>
            <p class="status-message">${statusMessage}</p>
        `;
        
        // Обновляем элемент expiryTimer, если статус temporary
        if (status === 'temporary') {
            // После обновления HTML получаем новую ссылку на элемент таймера
            expiryTimer = document.getElementById('expiryTimer');
            if (expiryTimer) {
            updateExpiryTimer();
            }
        }
    };
    
    // Загрузка информации о бронировании
    const loadBookingDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                alert('Для просмотра бронирования необходимо авторизоваться');
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
                return;
            }
            
            console.log(`Загружаем информацию о бронировании с ID: ${bookingId}`);
            
            const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log(`Статус ответа от сервера: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    alert('Бронирование не найдено');
                    window.location.href = 'index.html';
                    return;
                }
                
                if (response.status === 403) {
                    alert('У вас нет доступа к этому бронированию');
                    window.location.href = 'index.html';
                    return;
                }
                
                const errorText = await response.text();
                console.error('Текст ошибки от сервера:', errorText);
                
                // Пробуем распарсить JSON ответ, если он в формате JSON
                let errorJson = null;
                try {
                    errorJson = JSON.parse(errorText);
                    console.error('Ошибка в формате JSON:', errorJson);
                } catch (e) {
                    console.error('Ошибка не в формате JSON');
                }
                
                throw new Error(`Ошибка при загрузке информации о бронировании: ${response.status} ${response.statusText}`);
            }
            
            const responseData = await response.text();
            console.log('Сырой ответ:', responseData);
            
            // Пробуем распарсить ответ как JSON
            try {
                bookingData = JSON.parse(responseData);
            } catch (e) {
                console.error('Ошибка парсинга JSON:', e);
                throw new Error('Получен некорректный формат ответа от сервера');
            }
            
            console.log('Данные бронирования:', bookingData);
            
            if (!bookingData || typeof bookingData !== 'object') {
                throw new Error('Получены некорректные данные бронирования');
            }
            
            // Заполняем информацию о фильме и сеансе
            moviePoster.src = bookingData.poster_url || 'assets/images/poster-placeholder.jpg';
            movieTitle.textContent = bookingData.movie_title || 'Название фильма';
            screeningDate.textContent = formatDate(bookingData.screening_date) || 'Дата не указана';
            screeningTime.textContent = formatTime(bookingData.screening_time) || 'Время не указано';
            hallName.textContent = bookingData.hall_name || 'Зал не указан';
            screeningFormat.textContent = bookingData.format || 'Формат не указан';
            
            // Заполняем информацию о бронировании
            bookingNumber.textContent = bookingData.booking_id || 'Номер не указан';
            bookingStatus.textContent = getStatusText(bookingData.status) || 'Статус не указан';
            bookingTime.textContent = formatDateTime(bookingData.booking_time) || 'Время не указано';
            
            if (bookingData.expiry_time && bookingData.status === 'temporary') {
                expiryTime.textContent = formatDateTime(bookingData.expiry_time) || 'Не указано';
            } else {
                expiryTime.textContent = 'Не применимо';
            }
            
            totalPrice.textContent = formatPrice(bookingData.total_price) || '0 ₽';
            
            // Заполняем список мест
            seatsList.innerHTML = '';
            
            if (bookingData.seats && bookingData.seats.length > 0) {
                // Сортируем места по рядам и номерам
                const sortedSeats = bookingData.seats.sort((a, b) => {
                    if (a.seat_row_number === b.seat_row_number) {
                        return a.seat_number - b.seat_number;
                    }
                    return a.seat_row_number - b.seat_row_number;
                });
                
                sortedSeats.forEach(seat => {
                    const seatItem = document.createElement('li');
                    const seatType = seat.seat_type === 'vip' ? 'VIP' : 'Стандарт';
                    seatItem.textContent = `Ряд ${seat.seat_row_number}, Место ${seat.seat_number} (${seatType}) - ${formatPrice(seat.price)}`;
                    seatsList.appendChild(seatItem);
                });
            } else {
                const noSeatsItem = document.createElement('li');
                noSeatsItem.textContent = 'Информация о местах недоступна';
                seatsList.appendChild(noSeatsItem);
            }
            
            // Обновляем статус бронирования
            updateBookingStatus(bookingData.status);
            
            // Запускаем таймер обратного отсчета, если бронирование временное
            if (bookingData.status === 'temporary' && bookingData.expiry_time) {
                timerInterval = setInterval(updateExpiryTimer, 1000);
            }
            
        } catch (error) {
            console.error('Ошибка при загрузке деталей бронирования:', error);
            
            // Обновляем интерфейс для отображения ошибки
            const bookingInfoContainer = document.querySelector('.booking-info');
            if (bookingInfoContainer) {
                bookingInfoContainer.innerHTML = `
                    <div class="error-message">
                        <h2>Ошибка загрузки информации</h2>
                        <p>${error.message || 'Произошла ошибка при загрузке информации о бронировании'}</p>
                        <button class="primary-button" onclick="window.location.href='index.html'">Вернуться на главную</button>
                    </div>
                `;
            }
        }
    };
    
    // Функция для получения текстового представления статуса
    const getStatusText = (status) => {
        switch (status) {
            case 'temporary': return 'Ожидает подтверждения';
            case 'confirmed': return 'Подтверждено';
            case 'cancelled': return 'Отменено';
            default: return 'Неизвестно';
        }
    };
    
    // Обработчик кнопки "Подтвердить бронирование"
    confirmPaymentButton.addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                alert('Для подтверждения бронирования необходимо авторизоваться');
                return;
            }
            
            confirmPaymentButton.disabled = true;
            confirmPaymentButton.textContent = 'Загрузка...';
            
            const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/confirm`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при подтверждении бронирования');
            }
            
            const updatedBooking = await response.json();
            
            // Обновляем данные и интерфейс
            bookingData = updatedBooking.booking;
            updateBookingStatus('confirmed');
            
            // Останавливаем таймер
            clearInterval(timerInterval);
            
            // Обновляем остальные данные
            bookingStatus.textContent = getStatusText(bookingData.status);
            expiryTime.textContent = 'Не применимо';
            
            alert('Бронирование успешно подтверждено!');
            
        } catch (error) {
            console.error('Ошибка при подтверждении бронирования:', error);
            alert('Произошла ошибка при подтверждении бронирования: ' + error.message);
            
            confirmPaymentButton.disabled = false;
            confirmPaymentButton.textContent = 'Подтвердить бронирование';
        }
    });
    
    // Обработчик кнопки "Отменить бронирование"
    cancelBookingButton.addEventListener('click', async () => {
        // Подтверждаем отмену бронирования
        if (!confirm('Вы уверены, что хотите отменить бронирование?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                alert('Для отмены бронирования необходимо авторизоваться');
                return;
            }
            
            cancelBookingButton.disabled = true;
            cancelBookingButton.textContent = 'Загрузка...';
            
            const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при отмене бронирования');
            }
            
            // Обновляем интерфейс
            bookingData.status = 'cancelled';
            updateBookingStatus('cancelled');
            
            // Останавливаем таймер
            clearInterval(timerInterval);
            
            // Обновляем остальные данные
            bookingStatus.textContent = getStatusText(bookingData.status);
            expiryTime.textContent = 'Не применимо';
            
            alert('Бронирование успешно отменено');
            
        } catch (error) {
            console.error('Ошибка при отмене бронирования:', error);
            alert('Произошла ошибка при отмене бронирования: ' + error.message);
            
            cancelBookingButton.disabled = false;
            cancelBookingButton.textContent = 'Отменить бронирование';
        }
    });
    
    // Инициализация страницы
    loadBookingDetails();
}); 