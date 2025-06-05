document.addEventListener('DOMContentLoaded', () => {
    // Глобальные переменные
    let bookingsData = [];
    let currentFilter = 'all';
    
    // DOM элементы
    const bookingsList = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    // Функция для форматирования даты
    const formatDate = (dateString) => {
        const options = { weekday: 'short', day: 'numeric', month: 'long' };
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
    
    // Функция для получения текстового представления статуса
    const getStatusText = (status) => {
        switch (status) {
            case 'temporary': return 'Ожидает подтверждения';
            case 'confirmed': return 'Подтверждено';
            case 'cancelled': return 'Отменено';
            default: return 'Неизвестно';
        }
    };
    
    // Функция для получения класса статуса
    const getStatusClass = (status) => {
        switch (status) {
            case 'temporary': return 'temporary';
            case 'confirmed': return 'confirmed';
            case 'cancelled': return 'cancelled';
            default: return '';
        }
    };
    
    // Загрузка бронирований пользователя
    const loadUserBookings = async () => {
        try {
            // Токен проверяется внутри getUserAllBookingsApi, но можно оставить и здесь для быстрой проверки
            if (!localStorage.getItem('token')) {
                alert('Для просмотра истории бронирований необходимо авторизоваться');
                window.location.href = 'login.html?redirect=user-bookings.html';
                return;
            }

            // Используем новую функцию из api.js
            bookingsData = await window.getUserAllBookingsApi();
            
            // Фильтрация и отображение бронирований
            filterAndDisplayBookings();
            
        } catch (error) {
            console.error('Ошибка при загрузке бронирований:', error);
            let errorMessage = 'Произошла ошибка при загрузке бронирований.';
            if (error.message.includes('Токен авторизации не найден') || error.message.includes('Сессия истекла')) {
                errorMessage = error.message + " Пожалуйста, войдите снова.";
                // Опционально: перенаправить на логин или показать кнопку входа
                 window.location.href = 'login.html?redirect=user-bookings.html'; // Пример перенаправления
            }

            bookingsList.innerHTML = `
                <div class="error-message">
                    <p>${errorMessage}</p>
                    <button class="primary-button" onclick="loadUserBookings()">Попробовать снова</button>
                </div>
            `;
             emptyState.style.display = 'none'; // Скрываем пустое состояние, если есть ошибка
             bookingsList.style.display = 'block'; // Показываем блок с ошибкой
        }
    };
    
    // Фильтрация и отображение бронирований
    const filterAndDisplayBookings = () => {
        if (!bookingsData || bookingsData.length === 0) {
            // Нет бронирований, показываем пустое состояние
            bookingsList.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        // Фильтруем бронирования по статусу
        let filteredBookings = bookingsData;
        
        if (currentFilter !== 'all') {
            filteredBookings = bookingsData.filter(booking => booking.status === currentFilter);
        }
        
        if (filteredBookings.length === 0) {
            // Нет бронирований с текущим фильтром, показываем пустое состояние
            bookingsList.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        // Сортируем бронирования по дате (сначала новые)
        filteredBookings.sort((a, b) => new Date(b.booking_time) - new Date(a.booking_time));
        
        // Отображаем бронирования
        bookingsList.style.display = 'flex';
        emptyState.style.display = 'none';
        
        bookingsList.innerHTML = '';
        
        filteredBookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            
            // Формируем HTML для карточки бронирования
            bookingCard.innerHTML = `
                <div class="booking-header">
                    <div class="booking-id">№ ${booking.booking_id}</div>
                    <div class="booking-status ${getStatusClass(booking.status)}">${getStatusText(booking.status)}</div>
                </div>
                <div class="booking-content">
                    <div class="booking-poster">
                        <img src="${booking.poster_url || 'assets/images/poster-placeholder.jpg'}" alt="${booking.movie_title}">
                    </div>
                    <div class="booking-details">
                        <h3 class="movie-title">${booking.movie_title || 'Название фильма'}</h3>
                        <div class="booking-info">
                            <p><strong>Дата:</strong> ${formatDate(booking.screening_date)}</p>
                            <p><strong>Время:</strong> ${formatTime(booking.screening_time)}</p>
                            <p><strong>Зал:</strong> ${booking.hall_name}</p>
                            <p><strong>Формат:</strong> ${booking.format}</p>
                        </div>
                        <div class="booking-seats">
                            <p class="booking-seats-title">Выбранные места:</p>
                            <div class="seats-list">
                                ${generateSeatsHTML(booking.booked_seats_details)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="booking-footer">
                    <div class="booking-price">${formatPrice(booking.total_price)}</div>
                    <div class="booking-actions">
                        <button class="view-button" data-booking-id="${booking.booking_id}">Просмотр</button>
                        ${booking.status !== 'cancelled' ? 
                            `<button class="cancel-button" data-booking-id="${booking.booking_id}" ${booking.status === 'confirmed' ? 'disabled' : ''}>Отменить</button>` : 
                            ''}
                    </div>
                </div>
            `;
            
            bookingsList.appendChild(bookingCard);
        });
        
        // Добавляем обработчики для кнопок просмотра и отмены
        attachButtonEventListeners();
    };
    
    // Генерация HTML для мест
    const generateSeatsHTML = (bookedSeatsDetailsString) => {
        if (!bookedSeatsDetailsString) { // Проверяем на null, undefined или пустую строку
            return '<span class="seat-tag">Информация о местах недоступна</span>';
        }
        
        // bookedSeatsDetailsString - это строка типа "Ряд 1 Место 5, Ряд 2 Место 10"
        const seatsArray = bookedSeatsDetailsString.split(', '); // Разделяем на отдельные места
        
        if (seatsArray.length === 0 || (seatsArray.length === 1 && !seatsArray[0])) {
             return '<span class="seat-tag">Информация о местах недоступна</span>';
        }

        return seatsArray.map(seatDetail => {
            // Каждое seatDetail - это уже готовая строка "Ряд X Место Y"
            // Можно добавить класс vip, если такая информация будет доступна в строке, но пока нет.
            return `<span class="seat-tag">${seatDetail}</span>`;
        }).join('');
    };
    
    // Прикрепление обработчиков событий к кнопкам
    const attachButtonEventListeners = () => {
        // Кнопки просмотра бронирования
        const viewButtons = document.querySelectorAll('.view-button');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const bookingId = button.dataset.bookingId;
                window.location.href = `booking-confirmation.html?bookingId=${bookingId}`;
            });
        });
        
        // Кнопки отмены бронирования
        const cancelButtons = document.querySelectorAll('.cancel-button');
        cancelButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const bookingId = button.dataset.bookingId;
                
                if (confirm('Вы уверены, что хотите отменить бронирование?')) {
                    await cancelBooking(bookingId, button);
                }
            });
        });
    };
    
    // Отмена бронирования
    const cancelBooking = async (bookingId, buttonElement) => {
        try {
            const token = localStorage.getItem('token'); // Токен все еще нужен для прямого вызова
            
            if (!token) {
                alert('Для отмены бронирования необходимо авторизоваться');
                return;
            }
            
            buttonElement.disabled = true;
            buttonElement.textContent = 'Отмена...';
            
            // URL для отмены /api/bookings/:bookingId должен быть корректным
            // Предполагаем, что window.cancelBookingApi будет добавлена в api.js для консистентности
            // А пока оставляем прямой fetch, так как URL /api/bookings/:id должен работать
            const response = await fetch(`${BASE_API_URL}/bookings/${bookingId}`, { // Используем BASE_API_URL, если он доступен глобально, или полный путь
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при отмене бронирования');
            }
            
            // Обновляем данные и перерисовываем список
            const bookingIndex = bookingsData.findIndex(booking => booking.booking_id === Number(bookingId));
            
            if (bookingIndex !== -1) {
                bookingsData[bookingIndex].status = 'cancelled';
                filterAndDisplayBookings();
                
                alert('Бронирование успешно отменено');
            }
            
        } catch (error) {
            console.error('Ошибка при отмене бронирования:', error);
            alert('Произошла ошибка при отмене бронирования');
            
            buttonElement.disabled = false;
            buttonElement.textContent = 'Отменить';
        }
    };
    
    // Обработчики для вкладок фильтрации
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Снимаем активный класс со всех вкладок
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс выбранной вкладке
            button.classList.add('active');
            
            // Обновляем текущий фильтр и перерисовываем список
            currentFilter = button.dataset.status;
            filterAndDisplayBookings();
        });
    });
    
    // Инициализация загрузки данных при загрузке страницы
    loadUserBookings();
}); 