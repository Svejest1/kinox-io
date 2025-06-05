const db = require('../config/db');

const Booking = {};

// Получение доступных сеансов для фильма
Booking.getScreeningsByMovie = async (movieId) => {
    const query = `
        SELECT s.screening_id, s.screening_date, s.screening_time, s.format, s.base_price,
               h.hall_id, h.hall_name, h.capacity
        FROM screenings s
        JOIN halls h ON s.hall_id = h.hall_id
        WHERE s.movie_id = $1 AND s.screening_date >= CURRENT_DATE
        ORDER BY s.screening_date ASC, s.screening_time ASC
    `;
    
    try {
        const { rows } = await db.query(query, [movieId]);
        return rows;
    } catch (error) {
        console.error('Error getting screenings by movie:', error);
        throw error;
    }
};

// Получение деталей сеанса
Booking.getScreeningDetails = async (screeningId) => {
    const query = `
        SELECT s.screening_id, s.screening_date, s.screening_time, s.format, s.base_price,
               h.hall_id, h.hall_name, h.capacity,
               m.movie_id, m.title, m.duration, m.poster_url
        FROM screenings s
        JOIN halls h ON s.hall_id = h.hall_id
        JOIN movies m ON s.movie_id = m.movie_id
        WHERE s.screening_id = $1
    `;
    
    try {
        const { rows } = await db.query(query, [screeningId]);
        return rows[0];
    } catch (error) {
        console.error('Error getting screening details:', error);
        throw error;
    }
};

// Получение информации о местах в зале для сеанса
Booking.getScreeningSeats = async (screeningId) => {
    console.log(`[getScreeningSeats] Запрос мест для сеанса ID: ${screeningId}`);
    
    // Сначала получим информацию о сеансе для получения ID зала
    const screeningQuery = `
        SELECT s.screening_id, s.hall_id, h.hall_name, s.format
        FROM screenings s
        JOIN halls h ON s.hall_id = h.hall_id
        WHERE s.screening_id = $1
    `;
    
    try {
        // Получаем информацию о сеансе
        const { rows: screeningInfo } = await db.query(screeningQuery, [screeningId]);
        
        if (screeningInfo.length === 0) {
            console.log(`[getScreeningSeats] Сеанс с ID ${screeningId} не найден`);
            return [];
        }
        
        const screening = screeningInfo[0];
        console.log(`[getScreeningSeats] Сеанс: ID=${screening.screening_id}, Зал ID=${screening.hall_id}, Зал=${screening.hall_name}`);
        
        // Получаем схему зала
        const hallLayoutQuery = `
            SELECT layout_id, hall_id
            FROM hall_layouts
            WHERE hall_id = $1
        `;
        
        const { rows: layoutInfo } = await db.query(hallLayoutQuery, [screening.hall_id]);
        
        if (layoutInfo.length === 0) {
            console.log(`[getScreeningSeats] Схема для зала с ID ${screening.hall_id} не найдена`);
            
            // Проверим, есть ли схема для зала с другим ID
            const allLayoutsQuery = `SELECT layout_id, hall_id FROM hall_layouts`;
            const { rows: allLayouts } = await db.query(allLayoutsQuery);
            console.log(`[getScreeningSeats] Доступные схемы залов:`, allLayouts);
            
            // Выберем первую доступную схему (временное решение)
            if (allLayouts.length > 0) {
                console.log(`[getScreeningSeats] Используем первую доступную схему: ID=${allLayouts[0].layout_id}, Hall ID=${allLayouts[0].hall_id}`);
                
                // Запрос мест из первой доступной схемы
                const tempSeatsQuery = `
                    WITH booked_seats AS (
                        SELECT bs.seat_id
                        FROM bookings b
                        JOIN booking_seats bs ON b.booking_id = bs.booking_id
                        WHERE b.screening_id = $1
                          AND (b.status = 'confirmed' OR (b.status = 'temporary' AND b.expiry_time > NOW()))
                    )
                    SELECT s.seat_id, ${allLayouts[0].hall_id} as hall_id, s.seat_row_number, s.seat_number, s.seat_type, s.status,
                           CASE WHEN bs.seat_id IS NOT NULL THEN true ELSE false END AS is_booked,
                           COALESCE(sp.price_multiplier, 1.0) as price_multiplier,
                           (SELECT base_price FROM screenings WHERE screening_id = $1) * COALESCE(sp.price_multiplier, 1.0) AS price
                    FROM seats s
                    LEFT JOIN booked_seats bs ON s.seat_id = bs.seat_id
                    LEFT JOIN seat_prices sp ON sp.screening_id = $1 AND LOWER(sp.seat_type) = LOWER(s.seat_type)
                    WHERE s.hall_id = $2 AND s.status = 'active'
                    ORDER BY s.seat_row_number, s.seat_number
                `;
                
                const { rows: tempSeats } = await db.query(tempSeatsQuery, [screeningId, allLayouts[0].hall_id]);
                console.log(`[getScreeningSeats] Найдено ${tempSeats.length} мест в альтернативной схеме`);
                return tempSeats;
            }
            
            return [];
        }
        
        const layoutId = layoutInfo[0].layout_id;
        console.log(`[getScreeningSeats] Найдена схема зала ID=${layoutId}`);
        
        // Основной запрос на получение мест
        const query = `
            WITH booked_seats AS (
                SELECT bs.seat_id
                FROM bookings b
                JOIN booking_seats bs ON b.booking_id = bs.booking_id
                WHERE b.screening_id = $1
                  AND (b.status = 'confirmed' OR (b.status = 'temporary' AND b.expiry_time > NOW()))
            )
            SELECT s.seat_id, s.hall_id, s.seat_row_number, s.seat_number, s.seat_type, s.status,
                   CASE WHEN bs.seat_id IS NOT NULL THEN true ELSE false END AS is_booked,
                   COALESCE(sp.price_multiplier, 1.0) as price_multiplier,
                   (SELECT base_price FROM screenings WHERE screening_id = $1) * COALESCE(sp.price_multiplier, 1.0) AS price
            FROM seats s
            LEFT JOIN booked_seats bs ON s.seat_id = bs.seat_id
            LEFT JOIN seat_prices sp ON sp.screening_id = $1 AND LOWER(sp.seat_type) = LOWER(s.seat_type)
            WHERE s.hall_id = $2 AND s.status = 'active'
            ORDER BY s.seat_row_number, s.seat_number
        `;
        
        const { rows } = await db.query(query, [screeningId, screening.hall_id]);
        console.log(`[getScreeningSeats] Найдено ${rows.length} мест в зале`);
        return rows;
    } catch (error) {
        console.error('[getScreeningSeats] Ошибка:', error);
        throw error;
    }
};

// Создание временного бронирования
Booking.createBooking = async (userId, screeningId, seatIds) => {
    console.log('bookingModel.createBooking - Начало создания бронирования');
    console.log('bookingModel.createBooking - Данные:', { userId, screeningId, seatIds });
    
    let client = null;
    
    try {
        client = await db.connect();
        console.log('bookingModel.createBooking - Успешное подключение клиента');
        
        await client.query('BEGIN');
        console.log('bookingModel.createBooking - Транзакция начата');
        
        console.log('bookingModel.createBooking - userId (тип):', typeof userId, 'Значение:', userId);
        console.log('bookingModel.createBooking - screeningId (тип):', typeof screeningId, 'Значение:', screeningId);
        
        // Проверяем, не заняты ли выбранные места
        const checkSeatsQuery = `
            SELECT seat_id FROM (
                SELECT bs.seat_id
                FROM bookings b
                JOIN booking_seats bs ON b.booking_id = bs.booking_id
                WHERE b.screening_id = $1
                  AND (b.status = 'confirmed' OR (b.status = 'temporary' AND b.expiry_time > NOW()))
            ) AS booked_seats
            WHERE seat_id = ANY($2::integer[])
        `;
        
        console.log('bookingModel.createBooking - Проверка занятости мест');
        const { rows: bookedSeats } = await client.query(checkSeatsQuery, [screeningId, seatIds]);
        
        if (bookedSeats.length > 0) {
            console.log('bookingModel.createBooking - Обнаружены занятые места:', bookedSeats);
            throw new Error('Некоторые из выбранных мест уже забронированы');
        }
        
        console.log('bookingModel.createBooking - Все места свободны, получаем цены');
        
        // Получаем цены на выбранные места
        const seatPricesQuery = `
            WITH base_price AS (
                SELECT base_price FROM screenings WHERE screening_id = $1
            )
            SELECT s.seat_id, s.seat_type, 
                  CASE 
                      WHEN sp.price_multiplier IS NOT NULL THEN sp.price_multiplier
                      WHEN s.seat_type = 'vip' THEN 1.5
                      ELSE 1.0
                  END as price_multiplier,
                  (SELECT base_price FROM base_price) * 
                  CASE 
                      WHEN sp.price_multiplier IS NOT NULL THEN sp.price_multiplier
                      WHEN s.seat_type = 'vip' THEN 1.5
                      ELSE 1.0
                  END AS price
            FROM seats s
            LEFT JOIN seat_prices sp ON sp.seat_type = s.seat_type AND sp.screening_id = $1
            JOIN screenings scr ON scr.screening_id = $1
            WHERE s.seat_id = ANY($2::integer[]) AND s.hall_id = scr.hall_id
        `;
        
        console.log('bookingModel.createBooking - Запрос цен на места');
        const { rows: seatPrices } = await client.query(seatPricesQuery, [screeningId, seatIds]);
        console.log('bookingModel.createBooking - Получены цены на места:', seatPrices.length);
        
        // Вычисляем общую стоимость
        const totalPrice = seatPrices.reduce((sum, seat) => sum + parseFloat(seat.price), 0);
        console.log('bookingModel.createBooking - Общая стоимость:', totalPrice);
        
        // Создаем бронирование
        const createBookingQuery = `
            INSERT INTO bookings (user_id, screening_id, booking_time, expiry_time, status, total_price)
            VALUES ($1, $2, NOW(), NOW() + INTERVAL '15 minutes', 'temporary', $3)
            RETURNING booking_id
        `;
        
        console.log('bookingModel.createBooking - Создание бронирования');
        const { rows: bookingResult } = await client.query(createBookingQuery, [userId, screeningId, totalPrice]);
        const bookingId = bookingResult[0].booking_id;
        console.log('bookingModel.createBooking - Бронирование создано с ID:', bookingId);
        
        // Добавляем места в бронирование
        console.log('bookingModel.createBooking - Добавление мест в бронирование');
        
        for (const seatPrice of seatPrices) {
            const addSeatQuery = `
                INSERT INTO booking_seats (booking_id, seat_id, price)
                VALUES ($1, $2, $3)
            `;
            await client.query(addSeatQuery, [bookingId, seatPrice.seat_id, seatPrice.price]);
        }
        
        console.log('bookingModel.createBooking - Места добавлены, фиксация транзакции');
        await client.query('COMMIT');
        
        console.log('bookingModel.createBooking - Транзакция успешно завершена');
        
        // Получаем полную информацию о созданном бронировании
        return await Booking.getBookingById(bookingId);
        
    } catch (error) {
        console.error('bookingModel.createBooking - Ошибка:', error);
        
        if (client) {
            console.log('bookingModel.createBooking - Откат транзакции');
            await client.query('ROLLBACK');
        }
        
        throw error;
    } finally {
        if (client) {
            console.log('bookingModel.createBooking - Освобождение клиента');
            client.release();
        }
    }
};

// Получение информации о конкретном бронировании
Booking.getBookingById = async (bookingId) => {
    console.log('bookingModel.getBookingById - Запрос для ID:', bookingId);
    
    const bookingQuery = `
        SELECT b.booking_id, b.user_id, b.screening_id, b.booking_time, b.expiry_time, 
               b.status, b.total_price,
               s.screening_date, s.screening_time, s.format,
               h.hall_name,
               m.title as movie_title, m.poster_url
        FROM bookings b
        JOIN screenings s ON b.screening_id = s.screening_id
        JOIN halls h ON s.hall_id = h.hall_id
        JOIN movies m ON s.movie_id = m.movie_id
        WHERE b.booking_id = $1
    `;
    
    const seatsQuery = `
        SELECT bs.booking_seat_id, bs.seat_id, bs.price,
               s.seat_row_number, s.seat_number, s.seat_type
        FROM booking_seats bs
        JOIN seats s ON bs.seat_id = s.seat_id
        WHERE bs.booking_id = $1
        ORDER BY s.seat_row_number, s.seat_number
    `;
    
    try {
        console.log('bookingModel.getBookingById - Выполнение запроса к бронированию');
        const { rows: bookingRows } = await db.query(bookingQuery, [bookingId]);
        console.log('bookingModel.getBookingById - Результат запроса к бронированию:', bookingRows.length ? 'Найдено' : 'Не найдено');
        
        if (bookingRows.length === 0) {
            console.log('bookingModel.getBookingById - Бронирование не найдено для ID:', bookingId);
            return null;
        }
        
        const booking = bookingRows[0];
        console.log('bookingModel.getBookingById - Бронирование:', {
            booking_id: booking.booking_id,
            user_id: booking.user_id,
            status: booking.status
        });
        
        console.log('bookingModel.getBookingById - Выполнение запроса к местам');
        const { rows: seatRows } = await db.query(seatsQuery, [bookingId]);
        console.log('bookingModel.getBookingById - Найдено мест:', seatRows.length);
        
        // Убедимся, что user_id преобразован в число
        booking.user_id = Number(booking.user_id);
        booking.seats = seatRows;
        
        return booking;
    } catch (error) {
        console.error('bookingModel.getBookingById - Ошибка:', error);
        throw error;
    }
};

// Подтверждение бронирования
Booking.confirmBooking = async (bookingId) => {
    const query = `
        UPDATE bookings
        SET status = 'confirmed', expiry_time = NULL
        WHERE booking_id = $1 AND status = 'temporary'
        RETURNING booking_id
    `;
    
    try {
        const { rows } = await db.query(query, [bookingId]);
        
        if (rows.length === 0) {
            return null;
        }
        
        return await Booking.getBookingById(bookingId);
    } catch (error) {
        console.error('Error confirming booking:', error);
        throw error;
    }
};

// Отмена бронирования
Booking.cancelBooking = async (bookingId) => {
    const query = `
        UPDATE bookings
        SET status = 'cancelled'
        WHERE booking_id = $1 AND (status = 'temporary' OR status = 'confirmed')
        RETURNING booking_id
    `;
    
    try {
        const { rows } = await db.query(query, [bookingId]);
        return rows.length > 0;
    } catch (error) {
        console.error('Error cancelling booking:', error);
        throw error;
    }
};

// Получение всех бронирований пользователя
Booking.getUserBookings = async (userId) => {
    const query = `
        SELECT b.booking_id, b.screening_id, b.booking_time, b.expiry_time, 
               b.status, b.total_price,
               s.screening_date, s.screening_time, s.format,
               h.hall_name,
               m.title as movie_title, m.poster_url,
               (
                   SELECT STRING_AGG('Ряд ' || st.seat_row_number || ' Место ' || st.seat_number, ', ' ORDER BY st.seat_row_number, st.seat_number)
                   FROM booking_seats bs
                   JOIN seats st ON bs.seat_id = st.seat_id
                   WHERE bs.booking_id = b.booking_id
               ) AS booked_seats_details
        FROM bookings b
        JOIN screenings s ON b.screening_id = s.screening_id
        JOIN halls h ON s.hall_id = h.hall_id
        JOIN movies m ON s.movie_id = m.movie_id
        WHERE b.user_id = $1
        ORDER BY 
            CASE 
                WHEN b.status = 'temporary' THEN 1
                WHEN b.status = 'confirmed' THEN 2
                ELSE 3
            END,
            b.booking_time DESC
    `;
    
    try {
        const { rows } = await db.query(query, [userId]);
        return rows;
    } catch (error) {
        console.error('Error getting user bookings:', error);
        throw error;
    }
};

Booking.getByUserId = async (userId) => {
  const query = `
    SELECT
        b.booking_id,
        b.booking_time,
        b.total_price,
        s.screening_date,
        s.screening_time,
        m.title AS movie_title,
        m.poster_url AS movie_poster_url,
        m.duration AS movie_duration,
        h.hall_name,
        (
            SELECT STRING_AGG('Ряд ' || st.seat_row_number || ' Место ' || st.seat_number, ', ' ORDER BY st.seat_row_number, st.seat_number)
            FROM booking_seats bs
            JOIN seats st ON bs.seat_id = st.seat_id
            WHERE bs.booking_id = b.booking_id
        ) AS booked_seats_details
    FROM
        bookings b
    JOIN
        screenings s ON b.screening_id = s.screening_id
    JOIN
        movies m ON s.movie_id = m.movie_id
    JOIN
        halls h ON s.hall_id = h.hall_id
    WHERE
        b.user_id = $1 AND b.status = 'confirmed'
    ORDER BY
        b.booking_time DESC;
  `;
  try {
    const { rows } = await db.query(query, [userId]);
    // Здесь можно добавить форматирование poster_url, если это необходимо, как в movieModel.js
    // Например, rows.map(row => formatMovieData(row)) если movie_poster_url нужно преобразовать.
    // Пока оставим без дополнительного форматирования URL постера, т.к. он уже должен быть корректным из movies.
    return rows;
  } catch (error) {
    console.error('Error getting user booking history:', error);
    throw error;
  }
};

module.exports = Booking; 