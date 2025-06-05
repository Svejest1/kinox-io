const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не определен в файле .env");
    // Не завершаем процесс, но логируем ошибку
}

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Отсутствует токен авторизации.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET не определен на сервере');
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Декодированный токен:', decoded);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }

        console.log('Найден пользователь:', user);
        req.user = user;
        next();
    } catch (error) {
        console.error('Ошибка проверки токена:', error);
        return res.status(401).json({ message: 'Невалидный токен.' });
    }
};

// Проверка роли администратора
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Требуется авторизация' });
    }

    console.log('Проверка прав администратора для пользователя:', req.user);
    console.log('Роль пользователя:', req.user.role);
    
    if (req.user.role !== 'admin') {
        console.log('Роль не соответствует "admin"');
        return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
    }

    console.log('Пользователь имеет права администратора');
    next();
};

module.exports = { verifyToken, isAdmin };