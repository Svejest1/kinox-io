const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("authController.js: FATAL ERROR: JWT_SECRET is not defined in .env file. Exiting.");
}
const JWT_EXPIRES_IN = '1h';

const onRegister = async (req, res) => {
    try {
        if (!JWT_SECRET) throw new Error('JWT_SECRET не определен для регистрации');
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Пожалуйста, заполните все обязательные поля.' });
        }

        const existingUserByEmail = await User.findByEmail(email);
        if (existingUserByEmail) {
            return res.status(409).json({ message: 'Пользователь с таким email уже существует.' });
        }
        const existingUserByUsername = await User.findByUsername(username);
        if (existingUserByUsername) {
            return res.status(409).json({ message: 'Пользователь с таким именем уже существует.' });
        }

        const newUser = await User.create({ username, email, password });

        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован.',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                registration_date: newUser.registration_date
            }
        });

    } catch (error) {
        console.error('authController.js: Ошибка при регистрации:', error);
        if (error.code === '23505') {
             return res.status(409).json({ message: 'Имя пользователя или email уже заняты (ошибка БД).' });
        }
        res.status(500).json({ message: 'Внутренняя ошибка сервера при регистрации.', error: error.message });
    }
};

const onLogin = async (req, res) => {
    try {
        if (!JWT_SECRET) throw new Error('JWT_SECRET не определен для входа');
        const { emailOrUsername, password } = req.body;

        if (!emailOrUsername || !password) {
            return res.status(400).json({ message: 'Пожалуйста, укажите имя пользователя/email и пароль.' });
        }

        let user;
        user = await User.findByUsername(emailOrUsername);

        if (!user && emailOrUsername.includes('@')) {
            user = await User.findByEmail(emailOrUsername);
        }

        if (!user) {
            return res.status(401).json({ message: 'Неверные учетные данные (пользователь не найден).' });
        }

        const isPasswordMatch = await User.verifyPassword(password, user.password_hash);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Неверные учетные данные (неверный пароль).' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: 'Вход выполнен успешно.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            }
        });

    } catch (error) {
        console.error('authController.js: Ошибка при входе:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера при входе.', error: error.message });
    }
};

module.exports = {
    onRegister,
    onLogin,
}; 