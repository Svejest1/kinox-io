const mockMovies = [
    {
        id: 1,
        title: "Дюна: Часть Вторая",
        genre: "Фантастика, Приключения",
        duration: "166 мин",
        rating: 8.9,
        year: 2024,
        director: "Дени Вильнёв",
        stars: ["Тимоти Шаламе", "Зендея", "Ребекка Фергюсон"],
        synopsis: "Пол Атрейдес объединяется с Чани и фрименами, чтобы отомстить заговорщикам, уничтожившим его семью. Ему предстоит сделать выбор между любовью всей своей жизни и судьбой вселенной.",
        posterUrl: "assets/images/posters/dune2.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=42RV2e1GyzM",
        sessions: [
            { time: "10:00", hall: "Зал 1 (IMAX)", price: 550, format: "2D" },
            { time: "13:30", hall: "Зал 2 (Dolby Atmos)", price: 600, format: "3D" },
            { time: "17:00", hall: "Зал 1 (IMAX)", price: 580, format: "2D" },
            { time: "20:30", hall: "Зал 3", price: 500, format: "2D" },
        ]
    },
    {
        id: 2,
        title: "Оппенгеймер",
        genre: "Биография, Драма, История",
        duration: "180 мин",
        rating: 8.4,
        year: 2023,
        director: "Кристофер Нолан",
        stars: ["Киллиан Мёрфи", "Эмили Блант", "Мэтт Дэймон"],
        synopsis: "История жизни американского физика Роберта Оппенгеймера, который стоял во главе первых разработок ядерного оружия.",
        posterUrl: "assets/images/posters/oppenheimer.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=PFepj-rWbFE",
        sessions: [
            { time: "11:00", hall: "Зал 4", price: 450, format: "2D" },
            { time: "15:00", hall: "Зал 2 (Dolby Atmos)", price: 550, format: "2D" },
            { time: "19:30", hall: "Зал 4", format: "2D", availableSeats: 50, price: 500 },
        ]
    },
    {
        id: 3,
        title: "Кунг-фу Панда 4",
        genre: "Мультфильм, Комедия, Семейный",
        duration: "94 мин",
        rating: 6.5,
        year: 2024,
        director: "Майк Митчелл, Стефани Стайн",
        stars: ["Джек Блэк", "Аквафина", "Виола Дэвис"],
        synopsis: "По предстоит выбрать нового Воина Дракона, но на его пути появляется новая злодейка — Хамелеонша, способная принимать облик любого мастера кунг-фу.",
        posterUrl: "assets/images/posters/kungfupanda4.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=Xq7PsTU7vCQ",
        sessions: [
            { time: "09:30", hall: "Зал 5 (Kids)", price: 350, format: "2D" },
            { time: "12:00", hall: "Зал 3", price: 400, format: "3D" },
            { time: "14:30", hall: "Зал 5 (Kids)", price: 380, format: "2D" },
            { time: "16:45", hall: "Зал 3", price: 420, format: "2D" },
        ]
    },
    {
        id: 4,
        title: "Годзилла и Конг: Новая империя",
        genre: "Фантастика, Боевик",
        duration: "115 мин",
        rating: 7.0,
        year: 2024,
        director: "Адам Вингард",
        stars: ["Ребекка Холл", "Брайан Тайри Генри", "Дэн Стивенс"],
        synopsis: "Два древних титана, Годзилла и Конг, сталкиваются в эпической битве, в то время как человечество раскрывает их общее происхождение и связь с тайнами Острова Черепа.",
        posterUrl: "assets/images/posters/godzillakong.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=0e6E06uGi2Q",
        sessions: [
            { time: "10:45", hall: "Зал 1 (IMAX)", price: 600, format: "3D" },
            { time: "14:00", hall: "Зал 2 (Dolby Atmos)", price: 650, format: "3D" },
            { time: "18:15", hall: "Зал 1 (IMAX)", price: 620, format: "3D" },
            { time: "21:00", hall: "Зал 4", price: 550, format: "2D" },
        ]
    },
];

// Определяем базовый URL API
const BASE_API_URL = 'http://localhost:3001/api';
// Альтернативный URL для локальной разработки
const ALT_API_URL = 'http://127.0.0.1:3001/api';

// Функция для выполнения запроса к API с автоматическим переключением URL при необходимости
async function fetchWithFallback(endpoint, options = {}) {
    const url = endpoint.startsWith('/bookings') ? BASE_API_URL : BASE_API_URL; // Все эндпоинты теперь с /api в BASE_API_URL
    const altUrl = endpoint.startsWith('/bookings') ? ALT_API_URL : ALT_API_URL;
    
    try {
        // Пробуем основной URL
        console.log('API.js - Trying primary URL:', `${url}${endpoint}`);
        const response = await fetch(`${url}${endpoint}`, options);
        return response;
    } catch (error) {
        // Если основной URL недоступен, пробуем альтернативный
        console.log('API.js - Primary URL failed, trying alternative:', `${altUrl}${endpoint}`);
        const altResponse = await fetch(`${altUrl}${endpoint}`, options);
        return altResponse;
    }
}

function getAllMovies() {
    console.log('API.js - getAllMovies called');
    
    return fetchWithFallback('/movies')
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось получить фильмы из API');
            }
            return response.json();
        })
        .catch(error => {
            console.error('API.js - Ошибка при получении фильмов:', error);
            return [];
        });
}

function getMovieById(id) {
    console.log(`API.js - getMovieById called with ID: ${id}`);
    
    return fetchWithFallback(`/movies/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Фильм с ID ${id} не найден`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`API.js - Ошибка при получении фильма с ID ${id}:`, error);
            throw error;
        });
}

function getMoviesWithScreenings(dateString) {
    console.log('API.js - getMoviesWithScreenings called', dateString ? 'for date: ' + dateString : ' ');
    
    let endpoint = '/movies/with-screenings'; // Этот эндпоинт остается /api/movies/with-screenings
    if (dateString) {
        endpoint += '?date=' + dateString;
    }

    return fetchWithFallback(endpoint)
        .then(response => {
            console.log('API.js - API response status:', response.status);
            if (!response.ok) {
                throw new Error(`Не удалось получить фильмы с сеансами. Статус: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API.js - Received data:', data);
            return data;
        })
        .catch(error => {
            console.error('API.js - Ошибка при получении фильмов с сеансами:', error);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error('API.js - Похоже, сервер недоступен. Убедитесь, что бэкенд запущен на http://localhost:3001 или http://127.0.0.1:3001');
            }
            return [];
        });
}

async function getUserBookingHistoryApi() {
    console.log('API.js - getUserBookingHistoryApi called');
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('API.js - Auth token not found (using key \'token\') for getUserBookingHistoryApi');
        // Возвращаем ошибку, чтобы ее можно было обработать в user-bookings.js
        // или можно вернуть Promise.reject(), чтобы вызвать .catch()
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему.');
    }

    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    return fetchWithFallback('/bookings/history', options)
        .then(response => {
            console.log('API.js - getUserBookingHistoryApi response status:', response.status);
            if (response.status === 401) { // Неавторизован (например, неверный токен)
                 localStorage.removeItem('authToken'); // Удаляем невалидный токен
                 throw new Error('Сессия истекла или токен недействителен. Пожалуйста, войдите снова.');
            }
            if (!response.ok) {
                throw new Error(`Не удалось получить историю бронирований. Статус: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API.js - Received booking history data:', data);
            return data; // Это должен быть массив бронирований
        })
        .catch(error => {
            console.error('API.js - Ошибка при получении истории бронирований:', error);
            // Перебрасываем ошибку дальше, чтобы ее мог обработать вызывающий код
            throw error; 
        });
}

// Получение деталей сеанса
async function getScreeningDetails(screeningId) {
    console.log(`API.js - getScreeningDetails called for screening ID: ${screeningId}`);
    const endpoint = `/bookings/screenings/${screeningId}/details`;
    return fetchWithFallback(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Не удалось получить детали сеанса ${screeningId}. Статус: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`API.js - Ошибка при получении деталей сеанса ${screeningId}:`, error);
            throw error;
        });
}

// Получение мест для сеанса
async function getScreeningSeats(screeningId) {
    console.log(`API.js - getScreeningSeats called for screening ID: ${screeningId}`);
    const endpoint = `/bookings/screenings/${screeningId}/seats`;
    return fetchWithFallback(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Не удалось получить места для сеанса ${screeningId}. Статус: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`API.js - Ошибка при получении мест для сеанса ${screeningId}:`, error);
            throw error;
        });
}

// Создание бронирования
async function createBooking(bookingData) {
    console.log('API.js - createBooking called with data:', bookingData);
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('API.js - Auth token not found for createBooking');
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему.');
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
    };
    const endpoint = '/bookings/'; // POST /api/bookings/
    return fetchWithFallback(endpoint, options)
        .then(response => {
            // Важно: createBooking на сервере может возвращать 201 Created или 200 OK
            // Также нужно обработать возможные ошибки валидации (400) или другие (500)
            if (!response.ok && response.status !== 201) { 
                // Попытаемся прочитать тело ошибки, если оно есть
                return response.json().catch(() => null).then(errorBody => {
                    const errorMessage = errorBody?.message || `Не удалось создать бронирование. Статус: ${response.status}`;
                    throw new Error(errorMessage);
                });
            }
            // Если ответ пустой (например, 201 No Content, хотя обычно 201 возвращает созданный ресурс)
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                return {}; // или null, или какое-то подтверждение
            }
            return response.json();
        })
        .catch(error => {
            console.error('API.js - Ошибка при создании бронирования:', error);
            throw error;
        });
}

// Получение всех бронирований пользователя (для страницы "История Бронирований")
async function getUserAllBookingsApi() {
    console.log('API.js - getUserAllBookingsApi called');
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('API.js - Auth token not found for getUserAllBookingsApi');
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему.');
    }

    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    // Используем новый эндпоинт, как определено в bookingRoutes.js
    const endpoint = '/bookings/user/bookings'; 

    return fetchWithFallback(endpoint, options)
        .then(response => {
            console.log('API.js - getUserAllBookingsApi response status:', response.status);
            if (response.status === 401) {
                 localStorage.removeItem('token'); 
                 throw new Error('Сессия истекла или токен недействителен. Пожалуйста, войдите снова.');
            }
            if (!response.ok) {
                throw new Error(`Не удалось получить все бронирования. Статус: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API.js - Received all bookings data:', data);
            return data;
        })
        .catch(error => {
            console.error('API.js - Ошибка при получении всех бронирований:', error);
            throw error; 
        });
}

// Экспорт функций для использования в других JS-файлах
window.getAllMovies = getAllMovies;
window.getMovieById = getMovieById;
window.getMoviesWithScreenings = getMoviesWithScreenings;
window.getUserBookingHistoryApi = getUserBookingHistoryApi; // Экспортируем новую функцию
window.getScreeningDetails = getScreeningDetails; // Экспорт
window.getScreeningSeats = getScreeningSeats;     // Экспорт
window.createBooking = createBooking;             // Экспорт
window.getUserAllBookingsApi = getUserAllBookingsApi; // Экспорт