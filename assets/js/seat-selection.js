document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    const isUserAuthenticated = () => {
        return localStorage.getItem('token') !== null;
    };
    
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const screeningId = urlParams.get('screening_id');
    
    if (!screeningId) {
        alert('Не указан ID сеанса');
        window.location.href = 'index.html';
        return;
    }
    
    // Глобальные переменные
    let screeningData = null;
    let seatsData = null;
    const selectedSeats = new Map(); // Map для хранения выбранных мест (ключ: id места, значение: данные о месте)
    
    // DOM элементы
    const moviePoster = document.getElementById('moviePoster');
    const movieTitle = document.getElementById('movieTitle');
    const screeningDate = document.getElementById('screeningDate');
    const screeningTime = document.getElementById('screeningTime');
    const hallName = document.getElementById('hallName');
    const screeningFormat = document.getElementById('screeningFormat');
    const seatsContainer = document.getElementById('seatsContainer');
    const selectedSeatsList = document.getElementById('selectedSeatsList');
    const seatsCount = document.getElementById('seatsCount');
    const totalPrice = document.getElementById('totalPrice');
    const continueButton = document.getElementById('continueButton');
    
    // Функция для форматирования даты
    const formatDate = (dateString) => {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };
    
    // Функция для форматирования времени
    const formatTime = (timeString) => {
        return timeString.substring(0, 5);
    };
    
    // Функция для форматирования цены
    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('ru-RU') + ' ₽';
    };
    
    // Загрузка информации о сеансе
    const loadScreeningDetails = async () => {
        try {
            console.log('Загрузка деталей сеанса:', screeningId);
            // Используем функцию из api.js
            screeningData = await window.getScreeningDetails(screeningId);
            console.log('Данные сеанса:', screeningData);
            
            // Заполняем информацию о фильме и сеансе
            moviePoster.src = screeningData.poster_url || 'assets/images/poster-placeholder.jpg';
            movieTitle.textContent = screeningData.title || 'Название фильма';
            screeningDate.textContent = formatDate(screeningData.screening_date) || 'Дата не указана';
            screeningTime.textContent = formatTime(screeningData.screening_time) || 'Время не указано';
            hallName.textContent = screeningData.hall_name || 'Зал не указан';
            screeningFormat.textContent = screeningData.format || 'Формат не указан';
            
            // Загружаем информацию о местах (теперь это отдельный вызов, который последует)
            // await loadSeats(); // loadSeats будет вызвана после успешного loadScreeningDetails
            
            // Проверяем авторизацию и добавляем блюр при необходимости
            applyAuthBlur();
            
        } catch (error) {
            console.error('Ошибка при загрузке деталей сеанса:', error);
            // Отображаем сообщение об ошибке в контейнере для мест, т.к. он основной на этой странице
            seatsContainer.innerHTML = ` 
                <div class="error-message">
                    <p>Произошла ошибка при загрузке информации о сеансе.</p>
                    <p><small>${error.message}</small></p>
                    <button class="primary-button" onclick="loadScreeningDetailsAndSeats()">Попробовать снова</button>
                </div>
            `;
        }
    };
    
    // Загрузка информации о местах
    const loadSeats = async () => {
        if (!screeningData) { // Не пытаемся загрузить места, если нет данных о сеансе
            console.warn('loadSeats: Нет данных о сеансе (screeningData), загрузка мест отменена.');
            return; 
        }
        try {
            console.log('Загрузка мест для сеанса:', screeningId);
            // Используем функцию из api.js
            const data = await window.getScreeningSeats(screeningId);
            console.log('Данные о местах:', data);
            seatsData = data.seats; // Предполагаем, что API возвращает { seats: [...], seatsByRow: {...} } или только seats
            
            // Проверяем, есть ли места
            if (!seatsData || seatsData.length === 0) {
                console.warn('Нет данных о местах!');
                seatsContainer.innerHTML = `
                    <div class="error-message">
                        <p>Не удалось загрузить схему зала. Нет данных о местах.</p>
                        <button class="primary-button" onclick="loadScreeningDetailsAndSeats()">Попробовать снова</button>
                    </div>
                `;
                return;
            }
            
            // Проверяем структуру данных
            // seatsByRow теперь должно приходить с сервера или быть сформировано на клиенте
            const seatsByRowToRender = data.seatsByRow || groupSeatsByRow(seatsData);

            if (Object.keys(seatsByRowToRender).length === 0 && seatsData.length > 0) {
                // Если seatsByRow не пришло, но есть seatsData, это может быть проблемой
                // Однако groupSeatsByRow должен был бы это обработать.
                // Оставим предупреждение для отладки.
                console.warn('Не удалось сгруппировать места по рядам, хотя места присутствуют.');
                 seatsContainer.innerHTML = `
                    <div class="error-message">
                        <p>Ошибка отображения схемы зала: не удалось сгруппировать места.</p>
                        <button class="primary-button" onclick="loadScreeningDetailsAndSeats()">Попробовать снова</button>
                    </div>
                `;
                return;
            } else if (Object.keys(seatsByRowToRender).length === 0 && seatsData.length === 0) {
                 console.warn('Нет данных о местах для рендеринга.');
                 // Сообщение об отсутствии мест уже обработано выше
                 return;
            }
            
            renderSeats(seatsByRowToRender);
            
        } catch (error) {
            console.error('Ошибка при загрузке мест:', error);
            seatsContainer.innerHTML = `
                <div class="error-message">
                    <p>Произошла ошибка при загрузке схемы зала.</p>
                    <p><small>${error.message}</small></p>
                    <button class="primary-button" onclick="loadScreeningDetailsAndSeats()">Попробовать снова</button>
                </div>
            `;
        }
    };

    // Хелпер для группировки мест по рядам, если backend не возвращает seatsByRow
    const groupSeatsByRow = (seatsArray) => {
        if (!seatsArray || seatsArray.length === 0) return {};
        return seatsArray.reduce((acc, seat) => {
            const rowNumber = seat.seat_row_number.toString();
            if (!acc[rowNumber]) {
                acc[rowNumber] = [];
            }
            acc[rowNumber].push(seat);
            return acc;
        }, {});
    };

    // Объединенная функция загрузки данных
    const loadScreeningDetailsAndSeats = async () => {
        showLoadingState(); // Показываем индикатор загрузки
        await loadScreeningDetails();
        // loadSeats вызывается внутри loadScreeningDetails после успешной загрузки данных о сеансе
        // но на случай если loadScreeningDetails не вызовет loadSeats (например, если он упадет раньше),
        // или если мы захотим их вызывать последовательно здесь:
        if (screeningData) { // Только если детали сеанса успешно загружены
            await loadSeats();
        }
        hideLoadingState(); // Скрываем индикатор загрузки
    };

    // Функции для отображения/скрытия состояния загрузки (пример)
    const showLoadingState = () => {
        // Например, показываем спиннер или дизейблим кнопку
        if(document.getElementById('loaderOverlay')) {
            document.getElementById('loaderOverlay').style.display = 'flex';
        }
        seatsContainer.innerHTML = '<div class="loading-message">Загрузка данных о сеансе и местах...</div>';
    };

    const hideLoadingState = () => {
        // Скрываем спиннер
         if(document.getElementById('loaderOverlay')) {
            document.getElementById('loaderOverlay').style.display = 'none';
        }
        // seatsContainer будет обновлен либо данными, либо ошибкой
    };
    
    // Рендеринг схемы зала
    const renderSeats = (seatsByRow) => {
        seatsContainer.innerHTML = '';
        
        // Сортируем ряды по номеру
        const sortedRows = Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b));
        
        sortedRows.forEach(rowNumber => {
            const rowElement = document.createElement('div');
            rowElement.className = 'seat-row';
            
            // Добавляем номер ряда
            const rowNumberElement = document.createElement('div');
            rowNumberElement.className = 'row-number';
            rowNumberElement.textContent = rowNumber;
            rowElement.appendChild(rowNumberElement);
            
            // Сортируем места в ряду по номеру
            const sortedSeats = seatsByRow[rowNumber].sort((a, b) => Number(a.seat_number) - Number(b.seat_number));
            
            // Добавляем места
            sortedSeats.forEach(seat => {
                const seatElement = document.createElement('div');
                seatElement.className = `seat ${seat.seat_type} ${seat.is_booked ? 'occupied' : 'available'}`;
                seatElement.textContent = seat.seat_number;
                seatElement.dataset.seatId = seat.seat_id;
                seatElement.dataset.seatRow = seat.seat_row_number;
                seatElement.dataset.seatNumber = seat.seat_number;
                seatElement.dataset.seatType = seat.seat_type;
                seatElement.dataset.seatPrice = seat.price;
                
                // Добавляем обработчик клика только для доступных мест
                if (!seat.is_booked) {
                    seatElement.addEventListener('click', () => toggleSeatSelection(seat, seatElement));
                }
                
                rowElement.appendChild(seatElement);
            });
            
            seatsContainer.appendChild(rowElement);
        });
    };
    
    // Выбор/снятие выбора с места
    const toggleSeatSelection = (seat, seatElement) => {
        const seatId = seat.seat_id;
        
        if (selectedSeats.has(seatId)) {
            // Снимаем выбор
            selectedSeats.delete(seatId);
            seatElement.classList.remove('selected');
        } else {
            // Выбираем место
            selectedSeats.set(seatId, seat);
            seatElement.classList.add('selected');
        }
        
        // Обновляем список выбранных мест и итоговую стоимость
        updateSelectedSeatsList();
    };
    
    // Обновление списка выбранных мест
    const updateSelectedSeatsList = () => {
        if (selectedSeats.size === 0) {
            selectedSeatsList.innerHTML = '<p class="empty-selection-message">Вы пока не выбрали ни одного места</p>';
            seatsCount.textContent = '0';
            totalPrice.textContent = '0 ₽';
            continueButton.disabled = true;
        } else {
            selectedSeatsList.innerHTML = '';
            let totalPriceValue = 0;
            
            // Сортируем места по рядам и номерам для удобства
            const sortedSeats = Array.from(selectedSeats.values()).sort((a, b) => {
                if (a.seat_row_number === b.seat_row_number) {
                    return a.seat_number - b.seat_number;
                }
                return a.seat_row_number - b.seat_row_number;
            });
            
            sortedSeats.forEach(seat => {
                const seatElement = document.createElement('div');
                seatElement.className = 'selected-seat-item';
                
                const seatInfo = document.createElement('div');
                seatInfo.className = 'seat-info';
                
                const seatLocation = document.createElement('div');
                seatLocation.className = 'seat-location';
                seatLocation.textContent = `Ряд ${seat.seat_row_number}, Место ${seat.seat_number}`;
                
                const seatType = document.createElement('div');
                seatType.className = 'seat-type';
                seatType.textContent = seat.seat_type === 'vip' ? 'VIP' : 'Стандарт';
                
                seatInfo.appendChild(seatLocation);
                seatInfo.appendChild(seatType);
                
                const priceElement = document.createElement('div');
                priceElement.className = 'seat-price';
                priceElement.textContent = formatPrice(seat.price);
                
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-seat-btn';
                removeButton.innerHTML = '✕';
                removeButton.title = 'Удалить';
                removeButton.addEventListener('click', () => {
                    // Удаляем место из выбранных
                    selectedSeats.delete(seat.seat_id);
                    
                    // Снимаем выделение в схеме зала
                    const seatInScheme = document.querySelector(`.seat[data-seat-id="${seat.seat_id}"]`);
                    if (seatInScheme) {
                        seatInScheme.classList.remove('selected');
                    }
                    
                    // Обновляем список
                    updateSelectedSeatsList();
                });
                
                seatElement.appendChild(seatInfo);
                seatElement.appendChild(priceElement);
                seatElement.appendChild(removeButton);
                
                selectedSeatsList.appendChild(seatElement);
                
                // Увеличиваем общую стоимость
                totalPriceValue += parseFloat(seat.price);
            });
            
            seatsCount.textContent = selectedSeats.size;
            totalPrice.textContent = formatPrice(totalPriceValue);
            continueButton.disabled = false;
        }
    };
    
    // Обработчик кнопки "Продолжить"
    continueButton.addEventListener('click', async () => {
        // Проверяем, авторизован ли пользователь
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Для бронирования необходимо авторизоваться');
            // Перенаправляем на страницу входа с редиректом обратно
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
        }
        
        // Проверяем, есть ли выбранные места
        if (selectedSeats.size === 0) {
            alert('Выберите хотя бы одно место');
            return;
        }
        
        // Создаем бронирование
        try {
            continueButton.disabled = true;
            continueButton.textContent = 'Загрузка...';
            
            const seatIds = Array.from(selectedSeats.keys());
            
            const response = await fetch('http://localhost:3001/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    screeningId: screeningId,
                    seatIds: seatIds
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при создании бронирования');
            }
            
            const bookingData = await response.json();
            
            // Перенаправляем на страницу подтверждения бронирования
            window.location.href = `booking-confirmation.html?bookingId=${bookingData.booking.booking_id}`;
            
        } catch (error) {
            console.error('Ошибка при бронировании:', error);
            alert('Произошла ошибка при бронировании: ' + error.message);
            
            continueButton.disabled = false;
            continueButton.textContent = 'Продолжить';
        }
    });
    
    // Применение блюра для неавторизованных пользователей
    const applyAuthBlur = () => {
        // Если пользователь не авторизован, добавляем блюр
        if (!isUserAuthenticated()) {
            console.log('Пользователь не авторизован, добавляем блюр');
            
            // Создаем содержимое сообщения авторизации
            const authOverlayContent = `
                <div class="auth-overlay">
                    <h3>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Требуется авторизация
                    </h3>
                    <p>Для выбора мест и бронирования билетов необходимо войти в аккаунт или зарегистрироваться.</p>
                    <div style="display: flex; gap: 16px;">
                        <a href="login.html" class="auth-button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                            Войти
                        </a>
                        <a href="register.html" class="auth-button" style="background-color: transparent; border: 1px solid white;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                            Регистрация
                        </a>
                    </div>
                </div>
            `;
            
            // Для схемы зала
            const hallSchema = document.querySelector('.hall-schema');
            hallSchema.classList.add('auth-blur-container');
            const hallContent = hallSchema.innerHTML;
            hallSchema.innerHTML = `<div class="auth-blur">${hallContent}</div>${authOverlayContent}`;
            
            // Для списка выбранных мест
            const selectedSeats = document.querySelector('.selected-seats');
            selectedSeats.classList.add('auth-blur-container');
            const selectedContent = selectedSeats.innerHTML;
            selectedSeats.innerHTML = `<div class="auth-blur">${selectedContent}</div>${authOverlayContent}`;
        }
    };
    
    // Инициализация страницы
    if (screeningId) {
        loadScreeningDetailsAndSeats();
    } else {
        // Уже обработано выше, но на всякий случай
        seatsContainer.innerHTML = '<div class="error-message"><p>ID сеанса не указан.</p></div>';
    }
}); 