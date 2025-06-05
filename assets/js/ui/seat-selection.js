document.addEventListener('DOMContentLoaded', () => {
    // Элементы DOM
    const movieTitleElement = document.querySelector('#movie-title-for-seats span');
    const sessionInfoElement = document.querySelector('#session-info-for-seats'); // Весь <p>
    const seatMapContainer = document.getElementById('seat-map');
    const selectedSeatsList = document.getElementById('selected-seats-list');
    const totalPriceElement = document.getElementById('total-price-value');
    const checkoutButton = document.getElementById('proceed-to-checkout-btn');

    let currentMovie = null;
    let currentSession = null;
    let hallLayout = []; // Структура зала [ {row: 1, seats: [ {seatNumber: 'A1', type: 'standard', price: 300, status: 'available'} ] } ]
    let allSeatsMap = new Map(); // <--- НОВАЯ КАРТА для быстрого доступа к местам по ID
    const selectedSeats = new Set(); // Хранилище для ID выбранных мест, например "R1S1"

    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('movieId');
    const sessionTime = urlParams.get('sessionTime');
    const sessionHall = decodeURIComponent(urlParams.get('sessionHall')); // Декодируем, т.к. зал может содержать пробелы

    if (!movieId || !sessionTime || !sessionHall) {
        showError('Ошибка: Необходимая информация о сеансе отсутствует в URL.');
        if(seatMapContainer) seatMapContainer.innerHTML = '';
        return;
    }

    async function initializePage() {
        try {
            currentMovie = await getMovieById(movieId); // из api.js
            if (!currentMovie) {
                showError(`Ошибка: Фильм с ID ${movieId} не найден.`);
                return;
            }

            currentSession = currentMovie.sessions.find(s => s.time === sessionTime && s.hall === sessionHall);
            if (!currentSession) {
                showError(`Ошибка: Указанный сеанс (${sessionTime}, ${sessionHall}) для фильма "${currentMovie.title}" не найден.`);
                return;
            }

            updatePageTitle();
            // TODO: Загрузить схему зала на основе currentSession.hall или movieId
            // Пока используем моковую схему
            hallLayout = getMockHallLayout(currentSession.hall);
            
            // Заполняем allSeatsMap для быстрого доступа
            allSeatsMap.clear(); // Очищаем на случай повторной инициализации (хотя здесь это не предполагается)
            hallLayout.forEach(row => {
                row.seats.forEach(seat => {
                    if (seat.id) { // Убедимся, что у места есть ID (не для empty-space без ID)
                        allSeatsMap.set(seat.id, seat);
                    }
                });
            });

            renderSeatMap();

        } catch (error) {
            console.error("Ошибка инициализации страницы выбора мест:", error);
            showError("Не удалось загрузить данные для выбора мест. " + error.message);
        }
    }

    function updatePageTitle() {
        if (movieTitleElement && currentMovie) {
            movieTitleElement.textContent = currentMovie.title;
        }
        if (sessionInfoElement && currentSession) {
            sessionInfoElement.innerHTML = `Сеанс: <span>${currentSession.time}</span> | Зал: <span>${currentSession.hall}</span> | Формат: <span>${currentSession.format}</span>`;
        }
    }
    
    function showError(message) {
        if (movieTitleElement) movieTitleElement.parentElement.textContent = message;
        if (sessionInfoElement) sessionInfoElement.style.display = 'none';
        if (seatMapContainer) seatMapContainer.innerHTML = `<p class="error-message">${message}</p>`;
    }

    // --- Моковая схема зала --- 
    // В реальном приложении это должно приходить с бэкенда или из более сложной конфигурации
    function getMockHallLayout(hallName) {
        // Простой пример: небольшой зал
        // 's' - standard, 'v' - vip, 'o' - occupied, '_' - empty space
        let layout;
        let basePrice = currentSession.price || 400;
        let vipPrice = basePrice * 1.5;

        if (hallName.toLowerCase().includes('imax') || hallName.toLowerCase().includes('зал 1')) {
            layout = [
                "__AAAAAA__AAAAAA__", // Ряд 1 (A)
                "_AAAAAAAA_AAAAAAAA_", // Ряд 2 (B)
                "AAAAAAAAAAAAAAAAAA", // Ряд 3 (C)
                "AAAAAAvoovAAAAAA", // Ряд 4 (D) - v это VIP, o - occupied
                "AAAAAvvvvAAAAA", // Ряд 5 (E)
                "AAAAvvvvvvAAAA", // Ряд 6 (F)
            ];
        } else if (hallName.toLowerCase().includes('зал 2') || hallName.toLowerCase().includes('dolby')) {
             layout = [
                "_AAAAAA_AAAAAA_",
                "_AAAAAA_AAAAAA_",
                "AAAAAAAAAAAAAA",
                "AAvoovooAAAA", 
                "AAAvvvvAAA",
            ];
        } else {
            layout = [
                "_AAAA_AAAA_",
                "_AAAA_AAAA_",
                "_AAAA_AAAA_",
                "AAAAAAAAA",
                "AAvoovAA",
            ];
        }

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return layout.map((rowString, rowIndex) => {
            const rowLabel = alphabet[rowIndex];
            const seats = rowString.split('').map((seatChar, seatIndex) => {
                const seatNumberInRow = seatIndex + 1;
                if (seatChar === '_') {
                    return { id: `R${rowLabel}S${seatNumberInRow}`, type: 'empty', status: 'empty' };
                }
                let type = 'standard';
                let price = basePrice;
                let status = 'available';

                // ОТЛАДКА: Проверяем символ для конкретного проблемного места
                // if (rowLabel === 'E' && seatIndex === 2) { // seatIndex 2 это третье место (RES3)
                //    console.log(`[getMockHallLayout] Отладка для RES3 (ожидаем \'v\'): seatChar='${seatChar}', код символа=${seatChar.charCodeAt(0)}`);
                // }

                if (seatChar.toLowerCase() === 'v') {
                    type = 'vip';
                    price = vipPrice;
                }
                if (seatChar === 'o') {
                    status = 'occupied';
                }
                // Имитация уже занятых мест случайным образом (кроме явно 'o')
                /* else if (status === 'available' && Math.random() < 0.15) { 
                    status = 'occupied';
                } */

                return {
                    id: `R${rowLabel}S${seatNumberInRow}`,
                    row: rowLabel,
                    number: seatNumberInRow,
                    label: `${rowLabel}${seatNumberInRow}`,
                    type: type,
                    price: price,
                    status: status
                };
            });
            return { rowLabel: rowLabel, seats: seats };
        });
    }

    function renderSeatMap() {
        if (!seatMapContainer || !hallLayout) return;
        seatMapContainer.innerHTML = ''; // Очищаем от "Загрузка..."

        const maxSeatsInRow = Math.max(...hallLayout.map(row => row.seats.length));
        seatMapContainer.style.setProperty('--grid-columns', maxSeatsInRow);
        // Динамически задаем количество колонок в гриде, но flex для рядов более гибкий

        hallLayout.forEach(rowObj => {
            const rowElement = document.createElement('div');
            rowElement.classList.add('seat-row');
            rowElement.dataset.rowId = rowObj.rowLabel;

            // Добавляем метку ряда (A, B, C...)
            const rowLabelElement = document.createElement('div');
            // rowElement.appendChild(rowLabelElement); // Пока не добавляем, чтобы не мешать центру Flex

            // ОТЛАДКА: Логируем всю строку перед обработкой
            // console.log(`Rendering row ${rowObj.rowLabel}:`, rowObj.seats.map(s => `ID: ${s.id}, Type: ${s.type}, Status: ${s.status}, Price: ${s.price}`).join('; '));

            rowObj.seats.forEach(seat => {
                const seatElement = document.createElement('div');
                
                // ОТЛАДКА: Логируем каждое обрабатываемое место
                // console.log(`[renderSeatMap] Обработка места: ID=${seat.id}, Тип=${seat.type}, Статус=${seat.status}, Ряд=${rowObj.rowLabel}`);

                if (seat.type === 'empty') {
                    seatElement.classList.add('empty-space');
                    // console.log(`[renderSeatMap] Создано пустое место: ID=${seat.id}`); // Можно раскомментировать при необходимости
                } else {
                    seatElement.classList.add('seat', seat.type, seat.status);
                    seatElement.dataset.seatId = seat.id;
                    seatElement.dataset.price = String(seat.price); // Убедимся, что это строка
                    seatElement.dataset.status = seat.status;
                    seatElement.dataset.type = seat.type;

                    if (seat.status !== 'occupied') {
                        // console.log(`[renderSeatMap] ДОБАВЛЯЕТСЯ обработчик клика для: ID=${seat.id}, Статус=${seat.status}`);
                        seatElement.addEventListener('click', () => handleSeatClick(seat, seatElement));
                    } else {
                        // console.log(`[renderSeatMap] НЕ ДОБАВЛЯЕТСЯ обработчик клика (место занято): ID=${seat.id}, Статус=${seat.status}`);
                        seatElement.title = "Место занято";
                    }
                }
                rowElement.appendChild(seatElement);
            });
            seatMapContainer.appendChild(rowElement);
        });
    }

    function handleSeatClick(seat, seatElement) {
        // console.log(`[handleSeatClick] Вызвана для места: ID=${seat.id}, Тип=${seat.type}, Статус=${seat.status}`);
        if (seat.status === 'occupied' || seat.type === 'empty') {
            // console.log(`[handleSeatClick] Выход (место занято или пустое): ID=${seat.id}, Тип=${seat.type}, Статус=${seat.status}`);
            return;
        }

        if (selectedSeats.has(seat.id)) {
            selectedSeats.delete(seat.id);
            seatElement.classList.remove('selected');
            // seat.status = 'available'; // Не меняем исходный статус, только визуал
        } else {
            // Ограничение на количество выбранных мест (например, 10)
            if (selectedSeats.size >= 10) {
                alert("Вы не можете выбрать более 10 мест одновременно.");
                return;
            }
            selectedSeats.add(seat.id);
            seatElement.classList.add('selected');
            // seat.status = 'selected';
        }
        updateBookingSummary();
    }

    function updateBookingSummary() {
        if (!selectedSeatsList || !totalPriceElement || !checkoutButton) return;

        selectedSeatsList.innerHTML = ''; // Очищаем список
        let currentTotalPrice = 0;

        if (selectedSeats.size === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = 'Нет выбранных мест';
            selectedSeatsList.appendChild(listItem);
            checkoutButton.disabled = true;
        } else {
            selectedSeats.forEach(seatId => {
                const foundSeat = allSeatsMap.get(seatId); // <--- ИСПОЛЬЗУЕМ КАРТУ

                if (foundSeat) {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `Ряд ${foundSeat.row}, Место ${foundSeat.number} <span class="seat-price">(${foundSeat.price} ₽)</span>`;
                    selectedSeatsList.appendChild(listItem);
                    currentTotalPrice += foundSeat.price;
                }
            });
            checkoutButton.disabled = false;
        }
        totalPriceElement.textContent = currentTotalPrice;
    }
    
    // Обработчик для кнопки "Оформить заказ"
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (selectedSeats.size === 0) {
                alert('Пожалуйста, выберите хотя бы одно место.');
                return;
            }

            const seatsDataForCheckout = [];
            selectedSeats.forEach(seatId => {
                let foundSeat = null;
                for (const row of hallLayout) {
                    foundSeat = row.seats.find(s => s.id === seatId);
                    if (foundSeat) break;
                }
                if (foundSeat) {
                    seatsDataForCheckout.push({
                        id: foundSeat.id,
                        row: foundSeat.row,
                        number: foundSeat.number,
                        type: foundSeat.type,
                        price: foundSeat.price
                    });
                }
            });

            const totalPrice = parseFloat(totalPriceElement.textContent);

            // Формируем параметры для URL
            const params = new URLSearchParams();
            params.append('movieId', movieId);
            params.append('sessionTime', encodeURIComponent(currentSession.time)); 
            params.append('sessionDate', encodeURIComponent(currentSession.date || new Date().toLocaleDateString('ru-RU'))); // Добавляем дату сеанса
            params.append('sessionHall', encodeURIComponent(currentSession.hall));
            params.append('seats', encodeURIComponent(JSON.stringify(seatsDataForCheckout)));
            params.append('totalPrice', totalPrice.toString());

            const checkoutUrl = `checkout.html?${params.toString()}`;
            console.log('[seat-selection.js] Переход на URL:', checkoutUrl);
            window.location.href = checkoutUrl;
        });
    }

    // Инициализация
    initializePage();
}); 