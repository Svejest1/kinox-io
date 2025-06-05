// Загрузка деталей фильма и сеансов
async function loadMovieDetails() {
  try {
    // Получаем ID фильма из URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    
    if (!movieId) {
      showError('ID фильма не указан в URL');
      return;
    }
    
    // Запрос к API для получения деталей фильма и сеансов
    const response = await fetch(`http://localhost:3001/api/movies/${movieId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        showError('Фильм не найден');
      } else {
        showError('Ошибка при загрузке информации о фильме');
      }
      return;
    }
    
    const movie = await response.json();
    
    // Отображаем информацию о фильме и сеансы
    displayMovieDetails(movie);
    displayScreenings(movie.screenings);
    
    // Устанавливаем заголовок страницы
    document.title = `${movie.title} - КиноX`;
    
  } catch (error) {
    console.error('Ошибка:', error);
    showError('Произошла ошибка при загрузке данных');
  }
}

// Отображение деталей фильма
function displayMovieDetails(movie) {
  const detailsContainer = document.getElementById('movie-details');
  
  // Форматирование даты релиза
  const releaseDate = new Date(movie.release_date);
  const formattedDate = releaseDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  detailsContainer.innerHTML = `
    <div class="movie-header">
      <div class="movie-poster-large">
        <img src="${movie.poster_url || 'assets/images/poster-placeholder.jpg'}" alt="${movie.title}">
      </div>
      <div class="movie-info-large">
        <h1 class="movie-title">${movie.title} <span class="age-rating">${movie.age_rating}</span></h1>
        <div class="movie-meta">
          <span><strong>Жанр:</strong> ${movie.genre}</span>
          <span><strong>Продолжительность:</strong> ${movie.duration} мин</span>
          <span><strong>Премьера:</strong> ${formattedDate}</span>
          ${movie.director ? `<span><strong>Режиссер:</strong> ${movie.director}</span>` : ''}
        </div>
        <div class="movie-description">
          ${movie.description || 'Описание отсутствует'}
        </div>
        ${movie.trailer_url ? `
          <div class="movie-trailer">
            <a href="${movie.trailer_url}" target="_blank" class="btn-trailer">
              Смотреть трейлер
            </a>
          </div>
        ` : ''}
      </div>
    </div>
    ${movie.movie_cast ? `
      <div class="movie-cast">
        <h3>В ролях</h3>
        <p>${movie.movie_cast}</p>
      </div>
    ` : ''}
  `;
}

// Отображение сеансов фильма
function displayScreenings(screenings) {
  const screeningsContainer = document.getElementById('screenings-list');
  
  if (!screenings || screenings.length === 0) {
    screeningsContainer.innerHTML = '<p>Нет доступных сеансов</p>';
    return;
  }
  
  // Группируем сеансы по датам
  const screeningsByDate = {};
  
  screenings.forEach(screening => {
    const date = new Date(screening.screening_date);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!screeningsByDate[dateKey]) {
      screeningsByDate[dateKey] = {
        date: date,
        screenings: []
      };
    }
    
    screeningsByDate[dateKey].screenings.push(screening);
  });
  
  // Сортируем даты
  const sortedDates = Object.keys(screeningsByDate).sort();
  
  let html = '';
  
  sortedDates.forEach(dateKey => {
    const dateInfo = screeningsByDate[dateKey];
    const formattedDate = dateInfo.date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });

    // ОТЛАДОЧНЫЕ ЛОГИ
    console.log('[movie-details.js] Date Info:', dateInfo);
    console.log('[movie-details.js] Formatted Date for H4:', formattedDate);
    console.log('[movie-details.js] Date Object being used:', dateInfo.date);
    // Убедимся, что dateInfo.date это валидный объект Date
    if (!(dateInfo.date instanceof Date) || isNaN(dateInfo.date.getTime())) {
        console.error('[movie-details.js] ERROR: dateInfo.date is NOT a valid Date object! Value:', dateInfo.date);
    }

    html += `
      <div class="screening-date">
        <h4>${formattedDate}</h4>
        <div class="screening-times">
    `;
    
    // Сортируем сеансы по времени
    dateInfo.screenings.sort((a, b) => a.screening_time.localeCompare(b.screening_time));
    
    dateInfo.screenings.forEach(screening => {
      // Форматируем время
      const timeArr = screening.screening_time.split(':');
      const formattedTime = `${timeArr[0]}:${timeArr[1]}`;
      
      html += `
        <div class="screening-time-card" data-id="${screening.screening_id}">
          <div class="time">${formattedTime}</div>
          <div class="format">${screening.format}</div>
          <div class="hall">${screening.hall_name}</div>
          <div class="price">от ${screening.base_price} ₽</div>
          <a href="seat-selection.html?screening_id=${screening.screening_id}" class="btn-buy">Выбрать места</a>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  screeningsContainer.innerHTML = html;
}

// Отображение ошибки
function showError(message) {
  const detailsContainer = document.getElementById('movie-details');
  const screeningsContainer = document.getElementById('screenings-list');
  
  detailsContainer.innerHTML = `<div class="error-message">${message}</div>`;
  screeningsContainer.innerHTML = '';
  document.getElementById('movie-screenings').style.display = 'none';
}

// Загружаем информацию о фильме при загрузке страницы
document.addEventListener('DOMContentLoaded', loadMovieDetails); 