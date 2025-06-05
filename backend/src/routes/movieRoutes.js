const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const movieController = require('../controllers/movieController');
const authMiddleware = require('../middleware/authMiddleware');

// Путь для хранения постеров фильмов
const postersDir = path.join(__dirname, '../../..', 'assets/images/posters');

// Создаем директорию для постеров, если она не существует
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
  console.log('Директория для постеров создана:', postersDir);
}

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, postersDir);
  },
  filename: function(req, file, cb) {
    // Генерируем уникальное имя файла с временной меткой
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'poster-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB макс
  fileFilter: (req, file, cb) => {
    // Проверяем тип файла
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения могут быть загружены!'), false);
    }
  }
});

// Публичные маршруты
// Получить все фильмы
router.get('/', movieController.getAllMovies);

// Получить фильмы с активными сеансами
router.get('/with-screenings', movieController.getMoviesWithScreenings);

// Получить конкретный фильм с сеансами
router.get('/:id', movieController.getMovieWithScreenings);

// Защищенные маршруты (только для админов)
// Добавить новый фильм
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, movieController.createMovie);

// Загрузить постер для фильма
router.post('/upload-poster', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('poster'), movieController.uploadPoster);

// Обновить существующий фильм
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, movieController.updateMovie);

// Обновить статус фильма
router.patch('/:id/status', authMiddleware.verifyToken, authMiddleware.isAdmin, movieController.updateMovieStatus);

module.exports = router; 