const Movie = require('../models/movieModel');

// Получить все фильмы
const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.getAllMovies();
    res.status(200).json(movies);
  } catch (error) {
    console.error('Error in getAllMovies controller:', error);
    res.status(500).json({ message: 'Ошибка при получении списка фильмов', error: error.message });
  }
};

// Получить фильм по ID с его сеансами
const getMovieWithScreenings = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.getMovieById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Фильм не найден' });
    }
    
    const screenings = await Movie.getScreeningsByMovieId(id);
    
    res.status(200).json({
      ...movie,
      screenings
    });
  } catch (error) {
    console.error('Error in getMovieWithScreenings controller:', error);
    res.status(500).json({ message: 'Ошибка при получении информации о фильме', error: error.message });
  }
};

// Добавить новый фильм
const createMovie = async (req, res) => {
  try {
    const { 
      title, duration, releaseDate, description, 
      posterUrl, trailerUrl, director, cast, genre, ageRating 
    } = req.body;
    
    if (!title || !duration) {
      return res.status(400).json({ message: 'Название и продолжительность фильма обязательны' });
    }
    
    const newMovie = await Movie.createMovie({
      title, duration, releaseDate, description, posterUrl, 
      trailerUrl, director, cast, genre, ageRating
    });
    
    res.status(201).json({
      message: 'Фильм успешно добавлен',
      movie: newMovie
    });
  } catch (error) {
    console.error('Error in createMovie controller:', error);
    res.status(500).json({ message: 'Ошибка при добавлении фильма', error: error.message });
  }
};

// Обновить существующий фильм
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, duration, releaseDate, description, 
      posterUrl, trailerUrl, director, cast, genre, ageRating 
    } = req.body;
    
    if (!title || !duration) {
      return res.status(400).json({ message: 'Название и продолжительность фильма обязательны' });
    }
    
    const movie = await Movie.getMovieById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Фильм не найден' });
    }
    
    const updatedMovie = await Movie.updateMovie(id, {
      title, duration, releaseDate, description, posterUrl, 
      trailerUrl, director, cast, genre, ageRating
    });
    
    res.status(200).json({
      message: 'Фильм успешно обновлен',
      movie: updatedMovie
    });
  } catch (error) {
    console.error('Error in updateMovie controller:', error);
    res.status(500).json({ message: 'Ошибка при обновлении фильма', error: error.message });
  }
};

// Изменить статус фильма (активен/неактивен)
const updateMovieStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || (status !== 'active' && status !== 'inactive')) {
      return res.status(400).json({ message: 'Некорректный статус. Допустимые значения: active, inactive' });
    }
    
    const movie = await Movie.getMovieById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Фильм не найден' });
    }
    
    const updatedMovie = await Movie.updateMovieStatus(id, status);
    
    res.status(200).json({
      message: `Статус фильма изменен на ${status}`,
      movie: updatedMovie
    });
  } catch (error) {
    console.error('Error in updateMovieStatus controller:', error);
    res.status(500).json({ message: 'Ошибка при изменении статуса фильма', error: error.message });
  }
};

// Загрузить постер для фильма
const uploadPoster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }
    
    // Формируем URL для сохранения в базе данных
    const posterUrl = `/assets/images/posters/${req.file.filename}`;
    
    res.status(201).json({
      message: 'Постер успешно загружен',
      posterUrl: posterUrl
    });
  } catch (error) {
    console.error('Ошибка при загрузке постера:', error);
    res.status(500).json({ message: 'Ошибка при загрузке постера', error: error.message });
  }
};

// Получить фильмы с активными сеансами
const getMoviesWithScreenings = async (req, res) => {
  try {
    const { date } = req.query; // Получаем date из query параметров
    console.log(`[MovieController] getMoviesWithScreenings called with date: ${date}`);
    // Передаем date в метод модели. Если date не предоставлен, модель может использовать CURRENT_DATE по умолчанию.
    const movies = await Movie.getMoviesWithScreenings(date); 
    res.status(200).json(movies);
  } catch (error) {
    console.error('Error in getMoviesWithScreenings controller:', error);
    res.status(500).json({ message: 'Ошибка при получении фильмов с сеансами', error: error.message });
  }
};

module.exports = {
  getAllMovies,
  getMovieWithScreenings,
  createMovie,
  updateMovie,
  updateMovieStatus,
  uploadPoster,
  getMoviesWithScreenings
}; 