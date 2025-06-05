// Функция для загрузки всех фильмов
async function loadMovies() {
  try {
    const response = await fetch('http://localhost:3001/api/movies');
    if (!response.ok) {
      throw new Error('Ошибка при загрузке фильмов');
    }
    
    const movies = await response.json();
    displayMovies(movies);
  } catch (error) {
    console.error('Ошибка:', error);
    document.querySelector('.movie-galaxy').innerHTML = 
      '<p class="error-message">Не удалось загрузить фильмы. Пожалуйста, попробуйте позже.</p>';
  }
}

// Функция для отображения фильмов на странице
function displayMovies(movies) {
  const container = document.querySelector('.movie-galaxy');
  
  // Очищаем контейнер, чтобы избежать дублирования
  container.innerHTML = '';
  
  if (movies.length === 0) {
    container.innerHTML = '<p>Нет фильмов в прокате</p>';
    return;
  }
  
  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    
    // Форматирование даты релиза
    const releaseDate = new Date(movie.release_date);
    const formattedDate = releaseDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    movieCard.innerHTML = `
      <div class="movie-poster">
        <img src="${movie.poster_url || 'assets/images/poster-placeholder.jpg'}" alt="${movie.title}">
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title} <span class="age-rating">${movie.age_rating}</span></h3>
        <div class="movie-meta">
          <span>${movie.genre}</span>
          <span>${movie.duration} мин</span>
        </div>
        <p class="movie-release">Премьера: ${formattedDate}</p>
        <a href="movie.html?id=${movie.movie_id}" class="btn-details">Подробнее</a>
      </div>
    `;
    
    container.appendChild(movieCard);
  });
}

// Загрузка фильмов при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  console.log('Загрузка фильмов из API...');
  loadMovies();
}); 