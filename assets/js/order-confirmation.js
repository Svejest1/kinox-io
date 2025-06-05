document.addEventListener('DOMContentLoaded', () => {
    const orderDetailsContainer = document.getElementById('order-details-container');

    function displayOrderDetails() {
        const storedOrderData = localStorage.getItem('lastOrderData');

        if (!storedOrderData) {
            orderDetailsContainer.innerHTML = '<p class="warning-message">Информация о заказе не найдена. Возможно, вы перешли на эту страницу напрямую.</p>';
            return;
        }

        try {
            const orderData = JSON.parse(storedOrderData);

            let detailsHTML = `
                <h4>Детали вашего заказа:</h4>
                <p><strong>Фильм:</strong> ${orderData.movieTitle}</p>
                <p><strong>Сеанс:</strong> ${orderData.sessionDate || 'Сегодня'}, ${orderData.sessionTime}</p>
                <p><strong>Зал:</strong> ${orderData.sessionHall || 'Не указан'}</p>
                
                <h4>Выбранные места:</h4>
                <ul>
            `;

            orderData.seats.forEach(seat => {
                detailsHTML += `<li>Ряд ${seat.id.split('-')[0]}, Место ${seat.id.split('-')[1]} (${seat.type === 'vip' ? 'VIP' : 'Стандарт'})</li>`;
            });

            detailsHTML += `
                </ul>
                <hr>
                <p class="total-order-price"><strong>Итоговая сумма:</strong> ${orderData.totalPrice.toFixed(2)} руб.</p>
                <hr>
                <h4>Информация о покупателе:</h4>
                <p><strong>Имя:</strong> ${orderData.customer.name}</p>
                <p><strong>Email:</strong> ${orderData.customer.email}</p>
                <p><strong>Номер заказа (ID):</strong> <small>${orderData.orderTimestamp}</small></p>
                <br>
                <p><em>Билеты отправлены на указанный Email (симуляция).</em></p>
            `;

            orderDetailsContainer.innerHTML = detailsHTML;

            // Очищаем данные из localStorage после отображения, чтобы не показывать их снова при обновлении страницы
            // localStorage.removeItem('lastOrderData'); 
            // Пока оставим для удобства отладки, но в продакшене лучше очищать

        } catch (error) {
            console.error('Ошибка отображения деталей заказа:', error);
            orderDetailsContainer.innerHTML = '<p class="error-message">Произошла ошибка при отображении информации о вашем заказе.</p>';
        }
    }

    displayOrderDetails();
}); 