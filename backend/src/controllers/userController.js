const User = require('../models/userModel');

const getProfile = async (req, res) => {
    try {
        // req.user теперь содержит информацию о пользователе, полученную из JWT токена
        // благодаря middleware verifyToken
        const user = req.user;

        // Убедимся, что есть все необходимые поля, даже если они не заполнены
        res.status(200).json({
            username: user.username,
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone_number: user.phone_number || ''
        });
    } catch (error) {
        console.error('Ошибка при получении профиля:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при получении профиля.' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email, first_name, last_name, phone_number } = req.body;
        
        // Проверка обязательных полей
        if (!username || !email) {
            return res.status(400).json({ message: 'Имя пользователя и email являются обязательными полями' });
        }
        
        // Проверка, не занято ли имя пользователя другим пользователем
        const existingUser = await User.findByUsername(username);
        if (existingUser && existingUser.id !== userId) {
            return res.status(409).json({ message: 'Это имя пользователя уже занято' });
        }
        
        // Проверка, не занят ли email другим пользователем
        const existingEmail = await User.findByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
            return res.status(409).json({ message: 'Этот email уже используется' });
        }
        
        // Обновляем профиль
        const updatedUser = await User.updateProfile(userId, {
            username,
            email,
            first_name: first_name || '',
            last_name: last_name || '',
            phone_number: phone_number || ''
        });
        
        res.status(200).json({
            message: 'Профиль успешно обновлен',
            user: {
                username: updatedUser.username,
                email: updatedUser.email,
                first_name: updatedUser.first_name || '',
                last_name: updatedUser.last_name || '',
                phone_number: updatedUser.phone_number || '',
                registration_date: updatedUser.registration_date
            }
        });
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при обновлении профиля.' });
    }
};

module.exports = { getProfile, updateProfile };