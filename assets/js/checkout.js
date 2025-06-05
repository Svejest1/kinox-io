document.addEventListener('DOMContentLoaded', () => {
    console.log('[checkout.js] Загружена страница. Текущий URL:', window.location.href);
    const params = new URLSearchParams(window.location.search);
    console.log('[checkout.js] Полученные параметры URL:', params.toString());

    const movieDetailsContainer = document.getElementById('checkout-movie-details');
    const selectedSeatsList = document.getElementById('checkout-selected-seats-list');
    const totalPriceElement = document.getElementById('checkout-total-price');
    const checkoutForm = document.getElementById('checkout-form');

    const movieId = params.get('movieId');
    let seats = null;
    let totalPrice = NaN;

    try {
        if (params.has('seats')) {
            seats = JSON.parse(decodeURIComponent(params.get('seats')));
        }
        if (params.has('totalPrice')) {
            totalPrice = parseFloat(params.get('totalPrice'));
        }
    } catch (e) {
        console.error("Ошибка парсинга параметров URL:", e);
        if (movieDetailsContainer) {
             movieDetailsContainer.innerHTML = '<p class="error-message">Ошибка в данных заказа. Пожалуйста, попробуйте сформировать заказ заново.</p>';
        }
        if (checkoutForm) checkoutForm.querySelector('.cta-button').disabled = true;
        return; // Прекращаем выполнение, если параметры невалидны
    }

    const sessionTime = params.has('sessionTime') ? decodeURIComponent(params.get('sessionTime')) : null;
    const sessionDate = params.has('sessionDate') ? decodeURIComponent(params.get('sessionDate')) : null;
    const sessionHall = params.has('sessionHall') ? decodeURIComponent(params.get('sessionHall')) : null;

    async function loadOrderDetails() {
        // Проверяем, что все КЛЮЧЕВЫЕ параметры существуют и корректны
        if (!movieId || seats === null || isNaN(totalPrice) || !sessionTime || !sessionHall) {
            let errorMsg = 'Не удалось загрузить детали заказа. Отсутствуют или некорректны следующие данные: ';
            const missingParams = [];
            if (!movieId) missingParams.push('ID фильма');
            if (seats === null) missingParams.push('информация о местах');
            if (isNaN(totalPrice)) missingParams.push('общая стоимость');
            if (!sessionTime) missingParams.push('время сеанса');
            if (!sessionHall) missingParams.push('зал');
            errorMsg += missingParams.join(', ') + '. Пожалуйста, попробуйте снова.';
            
            movieDetailsContainer.innerHTML = `<p class="error-message">${errorMsg}</p>`;
            if (checkoutForm) checkoutForm.querySelector('.cta-button').disabled = true;
            return;
        }

        try {
            const movie = await getMovieById(movieId);
            if (!movie) {
                movieDetailsContainer.innerHTML = '<p class="error-message">Информация о фильме не найдена.</p>';
                if (checkoutForm) checkoutForm.querySelector('.cta-button').disabled = true;
                return;
            }

            // Отображение информации о фильме и сеансе
            let sessionInfoHTML = `
                <h3>${movie.title}</h3>
                <p><strong>Сеанс:</strong> ${sessionDate || 'Сегодня'}, ${sessionTime}</p>
                <p><strong>Зал:</strong> ${sessionHall}</p>
            `;
            movieDetailsContainer.innerHTML = sessionInfoHTML;

            // Отображение выбранных мест
            selectedSeatsList.innerHTML = ''; 
            if (seats.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'Места не выбраны (это не должно было произойти).';
                selectedSeatsList.appendChild(li);
            } else {
                seats.forEach(seat => {
                    const li = document.createElement('li');
                    // Предполагаем, что seat.id это строка типа "A1", "B12"
                    // Если seat.id это R${rowLabel}S${seatNumberInRow}, то надо адаптировать
                    // На основе последнего seat-selection.js, seat.id это `${rowLabel}${seatNumberInRow}`
                    const rowDisplay = seat.id.match(/[A-Z]+/)?.[0] || 'N/A';
                    const numberDisplay = seat.id.match(/[0-9]+/)?.[0] || 'N/A';
                    li.textContent = `Ряд ${rowDisplay}, Место ${numberDisplay} (${seat.type === 'vip' ? 'VIP' : 'Стандарт'}) - ${seat.price} руб.`;
                    selectedSeatsList.appendChild(li);
                });
            }

            // Отображение общей стоимости
            totalPriceElement.textContent = totalPrice.toFixed(2);

        } catch (error) {
            console.error('Ошибка загрузки деталей заказа:', error);
            movieDetailsContainer.innerHTML = '<p class="error-message">Произошла ошибка при загрузке деталей заказа.</p>';
            if (checkoutForm) checkoutForm.querySelector('.cta-button').disabled = true;
        }
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const userName = document.getElementById('user-name').value;
            const userEmail = document.getElementById('user-email').value;

            if (!userName || !userEmail) {
                alert('Пожалуйста, заполните все поля формы.');
                return;
            }

            const orderData = {
                movieId,
                movieTitle: document.querySelector('#checkout-movie-details h3')?.textContent || 'N/A',
                sessionTime,
                sessionDate,
                sessionHall,
                seats,
                totalPrice,
                customer: {
                    name: userName,
                    email: userEmail
                },
                orderTimestamp: new Date().toISOString()
            };

            console.log('Данные заказа:', orderData);

            localStorage.setItem('lastOrderData', JSON.stringify(orderData));
            window.location.href = `order-success.html`; 
        });
    }

    loadOrderDetails();
}); 