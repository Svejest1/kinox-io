const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/profile - Защищенный роут, требует валидный JWT токен
router.get('/profile', authMiddleware.verifyToken, userController.getProfile);

// PUT /api/profile - Обновление данных профиля
router.put('/profile', authMiddleware.verifyToken, userController.updateProfile);

module.exports = router;