const db = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const User = {};

User.create = async ({ username, email, password }) => {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const query = `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING user_id as id, username, email, registration_date;
    `;
    const values = [username, email, hashedPassword];
    try {
        const { rows } = await db.query(query, values);
        return rows[0];
    } catch (error) {
        console.error('Error creating user in model:', error);
        throw error;
    }
};

User.findByEmail = async (email) => {
    const query = `
        SELECT user_id as id, username, email, password_hash, registration_date, role
        FROM users
        WHERE email = $1;
    `;
    try {
        const { rows } = await db.query(query, [email]);
        return rows[0];
    } catch (error) {
        console.error('Error finding user by email in model:', error);
        throw error;
    }
};

User.findByUsername = async (username) => {
    const query = `
        SELECT user_id as id, username, email, password_hash, registration_date, role
        FROM users
        WHERE username = $1;
    `;
    try {
        const { rows } = await db.query(query, [username]);
        return rows[0];
    } catch (error) {
        console.error('Error finding user by username in model:', error);
        throw error;
    }
};

User.findById = async (id) => {
    const query = `
        SELECT user_id as id, username, email, registration_date, role, 
               first_name, last_name, phone_number
        FROM users
        WHERE user_id = $1;
    `;
    try {
        const { rows } = await db.query(query, [id]);
        return rows[0];
    } catch (error) {
        console.error('Error finding user by id in model:', error);
        throw error;
    }
};

User.updateProfile = async (userId, userData) => {
    const { username, email, first_name, last_name, phone_number } = userData;
    
    const query = `
        UPDATE users 
        SET username = $1, 
            email = $2, 
            first_name = $3, 
            last_name = $4, 
            phone_number = $5
        WHERE user_id = $6
        RETURNING user_id as id, username, email, registration_date, role, 
                 first_name, last_name, phone_number;
    `;
    
    try {
        const { rows } = await db.query(query, [
            username, 
            email, 
            first_name, 
            last_name, 
            phone_number, 
            userId
        ]);
        return rows[0];
    } catch (error) {
        console.error('Error updating user profile in model:', error);
        throw error;
    }
};

User.verifyPassword = async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
};

module.exports = User;