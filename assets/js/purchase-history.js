document.addEventListener('DOMContentLoaded', function() {
    const purchaseHistoryContainer = document.getElementById('purchaseHistoryList');
    const emptyStateContainer = document.getElementById('emptyPurchaseState');
    // Предполагаем, что индикатор загрузки находится внутри purchaseHistoryContainer по HTML
    const loadingIndicator = purchaseHistoryContainer ? purchaseHistoryContainer.querySelector('.loading-indicator') : null;

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                }
                return dateString;
            }
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            console.warn("Could not parse date:", dateString, e);
            return dateString;
        }
    }

    function formatTime(timeString) { // "HH:MM:SS"
        if (!timeString || typeof timeString !== 'string') return '';
        return timeString.substring(0, 5); // "HH:MM"
    }

    function formatBookingDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return dateTimeString;
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            console.warn("Could not parse booking date/time:", dateTimeString, e);
            return dateTimeString;
        }
    }

    // Генерация HTML для мест (аналогично user-bookings.js)
    const generateSeatsHTML = (bookedSeatsDetailsString) => {
        if (!bookedSeatsDetailsString) { 
            return '<span class="seat-tag">Информация о местах недоступна</span>';
        }
        const seatsArray = bookedSeatsDetailsString.split(', ');
        if (seatsArray.length === 0 || (seatsArray.length === 1 && !seatsArray[0])) {
             return '<span class="seat-tag">Информация о местах недоступна</span>';
        }
        return seatsArray.map(seatDetail => {
            return `<span class="seat-tag">${seatDetail}</span>`;
        }).join('');
    };

    function displayPurchaseHistory(purchases) {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        if (purchaseHistoryContainer) {
            purchaseHistoryContainer.innerHTML = ''; 
        }

        if (!purchases || purchases.length === 0) {
            if (emptyStateContainer) {
                emptyStateContainer.style.display = 'flex'; 
            }
            return;
        }

        if (emptyStateContainer) emptyStateContainer.style.display = 'none';

        const fragment = document.createDocumentFragment();
        purchases.forEach(purchase => {
            const purchaseCard = document.createElement('div');
            purchaseCard.classList.add('booking-card'); // Используем тот же класс

            let posterUrl = purchase.movie_poster_url || 'assets/images/poster-placeholder.png';
            // Нормализация URL постера, если нужно (оставляем как есть, если уже работает)
            // if (posterUrl && !posterUrl.startsWith('http')) { ... }
            
            const screeningDateFormatted = formatDate(purchase.screening_date);
            const screeningTimeFormatted = formatTime(purchase.screening_time);
            const bookingTimeFormatted = formatBookingDateTime(purchase.booking_time); // Дата покупки
            const totalPriceFormatted = purchase.total_price ? parseFloat(purchase.total_price).toLocaleString('ru-RU') + ' ₽' : 'N/A';

            // Адаптированная структура карточки из user-bookings.js
            purchaseCard.innerHTML = `
                <div class="booking-header">
                    <div class="booking-id">Покупка № ${purchase.booking_id}</div>
                    <div class="booking-status confirmed">Подтверждено</div>
                </div>
                <div class="booking-content">
                    <div class="booking-poster">
                        <img src="${posterUrl}" alt="Постер фильма ${purchase.movie_title || ''}">
                    </div>
                    <div class="booking-details">
                        <h3 class="movie-title">${purchase.movie_title || 'Название фильма не указано'}</h3>
                        <div class="booking-info">
                            <p><strong>Дата сеанса:</strong> ${screeningDateFormatted}</p>
                            <p><strong>Время сеанса:</strong> ${screeningTimeFormatted}</p>
                            <p><strong>Зал:</strong> ${purchase.hall_name || 'N/A'}</p>
                            <p><strong>Дата покупки:</strong> ${bookingTimeFormatted}</p>
                        </div>
                        <div class="booking-seats">
                            <p class="booking-seats-title">Выбранные места:</p>
                            <div class="seats-list">
                               ${generateSeatsHTML(purchase.booked_seats_details)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="booking-footer">
                    <div class="booking-price">${totalPriceFormatted}</div>
                    <div class="booking-actions">
                        <!-- Кнопки действий здесь не нужны для истории покупок -->
                    </div>
                </div>
            `;
            fragment.appendChild(purchaseCard);
        });
        if (purchaseHistoryContainer) purchaseHistoryContainer.appendChild(fragment);
    }

    function loadPurchaseHistory() {
        if (emptyStateContainer) emptyStateContainer.style.display = 'none';
        
        if (purchaseHistoryContainer) {
            // Показываем индикатор загрузки, если он есть в HTML, или создаем его
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            } else if (document.getElementById('purchaseHistoryList')) { // Убедимся, что контейнер существует
                const tempLoading = document.createElement('div');
                tempLoading.classList.add('loading-indicator');
                tempLoading.innerHTML = '<p>Загрузка истории покупок...</p>';
                document.getElementById('purchaseHistoryList').appendChild(tempLoading);
                // loadingIndicator = tempLoading; // Не переназначаем, если он был null
            }
        }

        window.getUserBookingHistoryApi() // Используем ту же API функцию
            .then(purchases => {
                // Удаляем или скрываем индикатор загрузки перед отображением
                const currentLoadingIndicator = purchaseHistoryContainer ? purchaseHistoryContainer.querySelector('.loading-indicator') : null;
                if (currentLoadingIndicator) currentLoadingIndicator.style.display = 'none';
                displayPurchaseHistory(purchases);
            })
            .catch(error => {
                console.error('Ошибка при загрузке истории покупок:', error);
                const currentLoadingIndicator = purchaseHistoryContainer ? purchaseHistoryContainer.querySelector('.loading-indicator') : null;
                if (currentLoadingIndicator) currentLoadingIndicator.style.display = 'none';
                
                if (purchaseHistoryContainer) purchaseHistoryContainer.innerHTML = ''; // Очищаем, если была ошибка
                
                let errorMessage = 'Не удалось загрузить историю покупок. Пожалуйста, попробуйте позже.';
                if (error && error.message) {
                    if (error.message.includes('Токен') || error.message.includes('Сессия истекла')) {
                        errorMessage = `${error.message} <a href="login.html" class="error-link">Войти снова</a>`;
                    } else if (error.message.includes('Failed to fetch')) { 
                         errorMessage = 'Ошибка сети при загрузке истории покупок. Проверьте ваше подключение к интернету или убедитесь, что сервер доступен.';
                    }
                }

                const errorElement = document.createElement('div');
                errorElement.classList.add('error-message-centered');
                errorElement.innerHTML = `<p>${errorMessage}</p>`;
                if (purchaseHistoryContainer) purchaseHistoryContainer.appendChild(errorElement);
            });
    }

    // Первоначальная загрузка истории покупок
    loadPurchaseHistory();
}); 