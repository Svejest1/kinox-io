const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Регистрация нового пользователя
router.post('/register', authController.onRegister);

// Вход пользователя
router.post('/login', authController.onLogin);

// Проверка токена и прав администратора
router.get('/check-admin', authMiddleware.verifyToken, authMiddleware.isAdmin, (req, res) => {
    res.status(200).json({ message: 'Пользователь имеет права администратора', userId: req.user.user_id });
});

// Проверка валидности токена и получение информации о пользователе
router.get('/verify', authMiddleware.verifyToken, (req, res) => {
    // Если middleware verifyToken прошел успешно, значит токен валиден
    res.status(200).json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
    });
});

module.exports = router;