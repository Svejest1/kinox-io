const db = require('../config/db');

const Movie = {};

// Форматирование данных фильма с полным URL для постера
const formatMovieData = (movie) => {
  if (movie && movie.poster_url) {
    console.log(`Исходный URL постера для ${movie.title}: ${movie.poster_url}`);
    
    // Если путь начинается с http или https, то это уже полный URL
    if (!movie.poster_url.startsWith('http') && !movie.poster_url.startsWith('/')) {
      // Добавляем слеш в начало, если его нет
      movie.poster_url = '/' + movie.poster_url;
      console.log(`Добавлен слеш в начало: ${movie.poster_url}`);
    }
    
    // Если путь начинается со слеша, но не с http/https, формируем полный URL
    if (movie.poster_url.startsWith('/') && !movie.poster_url.startsWith('http')) {
      // Формируем полный URL для постера
      movie.poster_url = `http://localhost:3001${movie.poster_url}`;
      console.log(`Сформирован полный URL: ${movie.poster_url}`);
    }
  } else {
    console.log(`Для фильма ${movie ? movie.title : 'неизвестно'} нет URL постера`);
  }
  return movie;
};

// Получить все фильмы
Movie.getAllMovies = async () => {
  const query = `
    SELECT movie_id, title, duration, release_date, description, 
           poster_url, trailer_url, director, movie_cast, genre, age_rating, status
    FROM movies
    WHERE status = 'active'
    ORDER BY release_date DESC;
  `;
  try {
    const { rows } = await db.query(query);
    // Форматируем URL для каждого фильма
    return rows.map(formatMovieData);
  } catch (error) {
    console.error('Error getting all movies:', error);
    throw error;
  }
};

// Получить фильм по ID
Movie.getMovieById = async (id) => {
  const query = `
    SELECT movie_id, title, duration, release_date, description, 
           poster_url, trailer_url, director, movie_cast, genre, age_rating, status
    FROM movies
    WHERE movie_id = $1;
  `;
  try {
    const { rows } = await db.query(query, [id]);
    return formatMovieData(rows[0]);
  } catch (error) {
    console.error('Error getting movie by id:', error);
    throw error;
  }
};

// Получить сеансы для фильма
Movie.getScreeningsByMovieId = async (movieId) => {
  const query = `
    SELECT s.screening_id, s.screening_date, s.screening_time, s.format, s.base_price,
           h.hall_name as hall_name, h.hall_type
    FROM screenings s
    JOIN halls h ON s.hall_id = h.hall_id
    WHERE s.movie_id = $1 AND s.screening_date >= CURRENT_DATE
    ORDER BY s.screening_date, s.screening_time;
  `;
  try {
    const { rows } = await db.query(query, [movieId]);
    return rows;
  } catch (error) {
    console.error('Error getting screenings for movie:', error);
    throw error;
  }
};

// Добавить новый фильм
Movie.createMovie = async (movieData) => {
  const { title, duration, releaseDate, description, posterUrl, trailerUrl, director, cast, genre, ageRating } = movieData;
  
  const query = `
    INSERT INTO movies (
      title, duration, release_date, description, poster_url, 
      trailer_url, director, movie_cast, genre, age_rating, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;
  
  const values = [
    title, 
    duration, 
    releaseDate, 
    description, 
    posterUrl, 
    trailerUrl, 
    director, 
    cast, 
    genre, 
    ageRating,
    'active'
  ];
  
  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating movie:', error);
    throw error;
  }
};

// Обновить существующий фильм
Movie.updateMovie = async (id, movieData) => {
  const { title, duration, releaseDate, description, posterUrl, trailerUrl, director, cast, genre, ageRating } = movieData;
  
  const query = `
    UPDATE movies
    SET title = $1, 
        duration = $2, 
        release_date = $3, 
        description = $4, 
        poster_url = $5, 
        trailer_url = $6, 
        director = $7, 
        movie_cast = $8, 
        genre = $9, 
        age_rating = $10
    WHERE movie_id = $11
    RETURNING *;
  `;
  
  const values = [
    title, 
    duration, 
    releaseDate, 
    description, 
    posterUrl, 
    trailerUrl, 
    director, 
    cast, 
    genre, 
    ageRating,
    id
  ];
  
  try {
    const { rows } = await db.query(query, values);
    return formatMovieData(rows[0]);
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
};

// Обновить статус фильма
Movie.updateMovieStatus = async (id, status) => {
  const query = `
    UPDATE movies
    SET status = $1
    WHERE movie_id = $2
    RETURNING *;
  `;
  
  try {
    const { rows } = await db.query(query, [status, id]);
    return formatMovieData(rows[0]);
  } catch (error) {
    console.error('Error updating movie status:', error);
    throw error;
  }
};

// Получить фильмы с активными сеансами
Movie.getMoviesWithScreenings = async (dateString) => {
  // Валидация dateString (простой пример, можно улучшить)
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.error('Invalid dateString format. Expected YYYY-MM-DD. Falling back to no date filter or handling error.');
    // Можно вернуть ошибку или пустой массив, или выполнить запрос без даты, если это допустимо
    // В данном случае, для соответствия предыдущей логике при ошибке, вернем все активные фильмы без фильтра по дате в сеансах (или с ошибкой)
    // Но лучше всего вернуть ошибку или пустой массив, чтобы фронтенд знал о проблеме.
    // Для примера, здесь мы выбросим ошибку.
    throw new Error('Invalid date format provided to getMoviesWithScreenings');
  }

  console.log(`[INFO] Movie.getMoviesWithScreenings called with dateString: ${dateString}`);

  const query = `
    WITH target_date AS (SELECT $1::date as s_date)
    SELECT 
      m.movie_id, m.title, m.duration, m.release_date, m.description, 
      m.poster_url, m.trailer_url, m.director, m.movie_cast, m.genre, m.age_rating, m.status,
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'screening_id', s_inner.screening_id,
            'screening_date', s_inner.screening_date, 
            'screening_time', s_inner.screening_time,
            'format', s_inner.format,
            'base_price', s_inner.base_price,
            'hall_id', h_inner.hall_id,
            'hall_name', h_inner.hall_name,
            'hall_type', h_inner.hall_type 
          )
          ORDER BY s_inner.screening_date ASC, s_inner.screening_time ASC
        ), '[]'::json) -- Если нет сеансов, вернуть пустой JSON массив
        FROM screenings s_inner
        JOIN halls h_inner ON s_inner.hall_id = h_inner.hall_id
        WHERE s_inner.movie_id = m.movie_id AND s_inner.screening_date = (SELECT s_date FROM target_date)
      ) as screenings
    FROM movies m
    WHERE m.status = 'active' AND
          EXISTS ( -- Показываем фильм, только если у него есть сеансы на указанную дату
            SELECT 1
            FROM screenings s_exists
            JOIN target_date ON s_exists.screening_date = target_date.s_date
            WHERE s_exists.movie_id = m.movie_id
          )
    ORDER BY m.movie_id, m.release_date DESC;
  `;
  
  try {
    // Передаем dateString как параметр запроса
    const { rows } = await db.query(query, [dateString]); 
    console.log(`[INFO] Found ${rows.length} movies with screenings for date ${dateString}.`);
    
    const formattedRows = rows.map(movie => {
      const formattedMovie = formatMovieData(movie); 
      // movie.screenings уже должен быть '[]'::json если сеансов нет, благодаря COALESCE
      // но на всякий случай, если вдруг COALESCE не сработает или вернет null из-за чего-то другого
      if (formattedMovie.screenings === null) {
        console.warn(`[WARN] Movie ${formattedMovie.title} had null screenings, converting to empty array.`);
        formattedMovie.screenings = []; 
      }
      // Логирование для отладки количества сеансов
      if (formattedMovie.screenings && formattedMovie.screenings.length > 0) {
        console.log(`[DEBUG] Movie: ${formattedMovie.title}, Screenings for ${dateString}: ${formattedMovie.screenings.length}`);
      } else {
        console.log(`[DEBUG] Movie: ${formattedMovie.title}, No screenings found for ${dateString} (screenings array is empty).`);
      }
      return formattedMovie;
    });
    
    return formattedRows;
  } catch (error) {
    console.error(`[ERROR] Error getting movies with screenings for date ${dateString}:`, error);
    throw error;
  }
};

module.exports = Movie; 