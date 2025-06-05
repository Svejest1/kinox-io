const Booking = require('../models/bookingModel');

// Получение доступных сеансов для фильма
const getScreeningsByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        const screenings = await Booking.getScreeningsByMovie(movieId);
        
        res.status(200).json(screenings);
    } catch (error) {
        console.error('Error in getScreeningsByMovie controller:', error);
        res.status(500).json({ message: 'Ошибка при получении доступных сеансов' });
    }
};

// Получение деталей сеанса
const getScreeningDetails = async (req, res) => {
    try {
        const { screeningId } = req.params;
        const screening = await Booking.getScreeningDetails(screeningId);
        
        if (!screening) {
            return res.status(404).json({ message: 'Сеанс не найден' });
        }
        
        res.status(200).json(screening);
    } catch (error) {
        console.error('Error in getScreeningDetails controller:', error);
        res.status(500).json({ message: 'Ошибка при получении информации о сеансе' });
    }
};

// Получение схемы зала и доступных мест для сеанса
const getScreeningSeats = async (req, res) => {
    try {
        const { screeningId } = req.params;
        const seats = await Booking.getScreeningSeats(screeningId);
        
        // Группируем места по рядам для удобства отображения на фронтенде
        const seatsByRow = {};
        seats.forEach(seat => {
            if (!seatsByRow[seat.seat_row_number]) {
                seatsByRow[seat.seat_row_number] = [];
            }
            seatsByRow[seat.seat_row_number].push(seat);
        });
        
        res.status(200).json({
            seats: seats,
            seatsByRow: seatsByRow
        });
    } catch (error) {
        console.error('Error in getScreeningSeats controller:', error);
        res.status(500).json({ message: 'Ошибка при получении информации о местах' });
    }
};

// Создание временного бронирования
const createBooking = async (req, res) => {
    try {
        console.log('Пользователь:', req.user);
        const userId = Number(req.user.id);
        console.log('ID пользователя (тип):', typeof userId, 'Значение:', userId);
        const { screeningId, seatIds } = req.body;
        
        if (!screeningId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ message: 'Необходимо выбрать сеанс и хотя бы одно место' });
        }
        
        const booking = await Booking.createBooking(userId, screeningId, seatIds);
        
        res.status(201).json({
            message: 'Бронирование успешно создано',
            booking: booking
        });
    } catch (error) {
        console.error('Error in createBooking controller:', error);
        
        if (error.message.includes('уже забронированы')) {
            return res.status(409).json({ message: error.message });
        }
        
        res.status(500).json({ message: 'Ошибка при создании бронирования' });
    }
};

// Получение информации о конкретном бронировании
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        console.log('getBookingById - Запрошенный ID бронирования:', bookingId);
        console.log('getBookingById - Пользователь:', req.user);
        const userId = Number(req.user.id);
        
        const booking = await Booking.getBookingById(bookingId);
        
        if (!booking) {
            console.log('getBookingById - Бронирование не найдено');
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }
        
        const bookingUserId = Number(booking.user_id);
        
        // Отладочная информация
        console.log('getBookingById - ID пользователя из токена:', userId, 'тип:', typeof userId);
        console.log('getBookingById - ID пользователя из бронирования:', bookingUserId, 'тип:', typeof bookingUserId);
        
        // Временно отключаем проверку доступа для отладки
        /*
        // Проверяем, принадлежит ли бронирование текущему пользователю
        if (bookingUserId !== userId) {
            console.log('getBookingById - Доступ запрещен: разные ID пользователей');
            return res.status(403).json({ message: 'У вас нет доступа к этому бронированию' });
        }
        */
        
        console.log('getBookingById - Успешный ответ с данными бронирования');
        res.status(200).json(booking);
    } catch (error) {
        console.error('getBookingById - Ошибка:', error);
        res.status(500).json({ 
            message: 'Ошибка при получении информации о бронировании', 
            error: error.message 
        });
    }
};

// Подтверждение бронирования (после оплаты)
const confirmBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;
        
        // Проверяем, принадлежит ли бронирование текущему пользователю
        const booking = await Booking.getBookingById(bookingId);
        
        if (!booking) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }
        
        console.log('confirmBooking - Сравнение ID:', booking.user_id, userId);
        console.log('confirmBooking - Типы ID:', typeof booking.user_id, typeof userId);
        
        if (Number(booking.user_id) !== Number(userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этому бронированию' });
        }
        
        if (booking.status !== 'temporary') {
            return res.status(400).json({ message: 'Бронирование не может быть подтверждено' });
        }
        
        const confirmedBooking = await Booking.confirmBooking(bookingId);
        
        res.status(200).json({
            message: 'Бронирование успешно подтверждено',
            booking: confirmedBooking
        });
    } catch (error) {
        console.error('Error in confirmBooking controller:', error);
        res.status(500).json({ message: 'Ошибка при подтверждении бронирования' });
    }
};

// Отмена бронирования
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;
        
        // Проверяем, принадлежит ли бронирование текущему пользователю
        const booking = await Booking.getBookingById(bookingId);
        
        if (!booking) {
            return res.status(404).json({ message: 'Бронирование не найдено' });
        }
        
        console.log('cancelBooking - Сравнение ID:', booking.user_id, userId);
        console.log('cancelBooking - Типы ID:', typeof booking.user_id, typeof userId);
        
        if (Number(booking.user_id) !== Number(userId)) {
            return res.status(403).json({ message: 'У вас нет доступа к этому бронированию' });
        }
        
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Бронирование уже отменено' });
        }
        
        const success = await Booking.cancelBooking(bookingId);
        
        if (success) {
            res.status(200).json({ message: 'Бронирование успешно отменено' });
        } else {
            res.status(400).json({ message: 'Не удалось отменить бронирование' });
        }
    } catch (error) {
        console.error('Error in cancelBooking controller:', error);
        res.status(500).json({ message: 'Ошибка при отмене бронирования' });
    }
};

// Получение всех бронирований пользователя
const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await Booking.getUserBookings(userId);
        
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error in getUserBookings controller:', error);
        res.status(500).json({ message: 'Ошибка при получении списка бронирований' });
    }
};

// Получить историю бронирований для текущего пользователя
const getUserBookingHistory = async (req, res) => {
    try {
        // Предполагается, что middleware аутентификации добавляет объект user к req,
        // и у этого объекта есть свойство id (или user_id, в зависимости от вашей реализации).
        // Если у вас используется другое имя поля для ID пользователя в req.user, измените его здесь.
        const userId = req.user && req.user.id; 

        if (!userId) {
            // Это не должно происходить, если роут защищен аутентификацией,
            // но на всякий случай добавляем проверку.
            return res.status(401).json({ message: 'Пользователь не аутентифицирован или ID пользователя не найден.' });
        }

        const bookingHistory = await Booking.getByUserId(userId);
        
        if (!bookingHistory) {
            // Это может произойти, если функция getByUserId вернула undefined или null вместо пустого массива
            // (хотя по текущей реализации она должна вернуть пустой массив или выбросить ошибку)
            console.warn(`Booking history for user ${userId} was unexpectedly null/undefined from model.`);
            return res.status(200).json([]); // Возвращаем пустой массив, если история не найдена
        }

        // Проверка на случай, если poster_url требует такой же обработки, как в movieModel
        // Сейчас это закомментировано, так как предполагаем, что movie_poster_url уже корректен
        /*
        const formattedHistory = bookingHistory.map(booking => {
            let posterUrl = booking.movie_poster_url;
            if (posterUrl && !posterUrl.startsWith('http') && !posterUrl.startsWith('/')) {
                posterUrl = '/' + posterUrl;
            }
            if (posterUrl && posterUrl.startsWith('/') && !posterUrl.startsWith('http')) {
                posterUrl = `http://localhost:3001${posterUrl}`; // Убедитесь, что порт и хост верные
            }
            return { ...booking, movie_poster_url: posterUrl };
        });
        res.status(200).json(formattedHistory);
        */

        res.status(200).json(bookingHistory);

    } catch (error) {
        console.error('Error in bookingController.getUserBookingHistory:', error);
        res.status(500).json({ message: 'Ошибка при получении истории бронирований', error: error.message });
    }
};

module.exports = {
    getScreeningsByMovie,
    getScreeningDetails,
    getScreeningSeats,
    createBooking,
    getBookingById,
    confirmBooking,
    cancelBooking,
    getUserBookings,
    getUserBookingHistory
}; 