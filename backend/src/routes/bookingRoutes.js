const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Маршруты для получения информации о сеансах
// GET /api/bookings/screenings/:movieId
router.get('/screenings/:movieId', bookingController.getScreeningsByMovie);
// GET /api/bookings/screenings/:screeningId/details
router.get('/screenings/:screeningId/details', bookingController.getScreeningDetails);
// GET /api/bookings/screenings/:screeningId/seats
router.get('/screenings/:screeningId/seats', bookingController.getScreeningSeats);

// Получить историю покупок (подтвержденных бронирований) для текущего пользователя
// GET /api/bookings/history
router.get('/history', verifyToken, bookingController.getUserBookingHistory);

// Получение всех бронирований пользователя (включая разные статусы)
// GET /api/bookings/user/bookings
router.get('/user/bookings', verifyToken, bookingController.getUserBookings);

// Создание временного бронирования
// POST /api/bookings/
router.post('/', verifyToken, bookingController.createBooking);

// Получение информации о конкретном бронировании
// GET /api/bookings/:bookingId
router.get('/:bookingId', verifyToken, bookingController.getBookingById);

// Подтверждение бронирования (после оплаты)
// PUT /api/bookings/:bookingId/confirm
router.put('/:bookingId/confirm', verifyToken, bookingController.confirmBooking);

// Отмена бронирования
// DELETE /api/bookings/:bookingId
router.delete('/:bookingId', verifyToken, bookingController.cancelBooking);

module.exports = router; 