// URL базового API
const API_BASE_URL = 'http://localhost:3001/api';

// DOM элементы
const moviesList = document.getElementById('moviesList');
const movieModal = document.getElementById('movieModal');
const movieForm = document.getElementById('movieForm');
const modalTitle = document.getElementById('modalTitle');
const addMovieBtn = document.getElementById('addMovieBtn');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close-btn');
const posterInput = document.getElementById('posterInput');
const selectPosterBtn = document.getElementById('selectPosterBtn');
const uploadPosterBtn = document.getElementById('uploadPosterBtn');
const posterPreview = document.getElementById('posterPreview');
const posterUrl = document.getElementById('posterUrl');
const uploadStatus = document.getElementById('uploadStatus');
const profileButton = document.getElementById('profileButton');
const userDropdownContainer = document.getElementById('userDropdownContainer');
const logoutButton = document.getElementById('logoutButton');

let currentMovieId = null;

// Проверка авторизации и прав администратора
document.addEventListener('DOMContentLoaded', async function() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = '../../login.html?redirect=frontend/admin-movies.html';
      return;
    }
    
    // Проверка прав администратора
    const response = await fetch(`${API_BASE_URL}/auth/check-admin`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        alert('У вас нет прав администратора');
        window.location.href = '../../index.html';
      } else {
        throw new Error('Ошибка авторизации');
      }
      return;
    }
    
    // Загрузка списка фильмов
    loadMovies();
    
    // Настройка выпадающего меню пользователя
    setupUserDropdownMenu();
    
  } catch (error) {
    console.error('Ошибка при проверке авторизации:', error);
    alert('Ошибка авторизации. Пожалуйста, войдите снова.');
    window.location.href = '../login.html';
  }
});

// Настройка выпадающего меню пользователя
function setupUserDropdownMenu() {
  if (profileButton && userDropdownContainer) {
    profileButton.addEventListener('click', function(event) {
      event.stopPropagation();
      userDropdownContainer.style.display = userDropdownContainer.style.display === 'block' ? 'none' : 'block';
    });
    
    // Закрытие выпадающего меню при клике вне него
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.user-menu-container')) {
        userDropdownContainer.style.display = 'none';
      }
    });
    
    // Обработка выхода из системы
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
      });
    }
  }
}

// Загрузка списка фильмов
async function loadMovies() {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`);
    if (!response.ok) {
      throw new Error('Ошибка при загрузке фильмов');
    }
    
    const movies = await response.json();
    displayMovies(movies);
  } catch (error) {
    console.error('Ошибка:', error);
    moviesList.innerHTML = '<p class="error-message">Не удалось загрузить фильмы. Пожалуйста, попробуйте позже.</p>';
  }
}

// Отображение списка фильмов
function displayMovies(movies) {
  if (movies.length === 0) {
    moviesList.innerHTML = '<p>Нет фильмов в базе данных</p>';
    return;
  }
  
  let html = '';
  
  movies.forEach(movie => {
    // Форматирование даты релиза
    const releaseDate = new Date(movie.release_date);
    const formattedDate = releaseDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Сокращаем жанр, если он слишком длинный
    const genre = movie.genre && movie.genre.length > 25 
      ? movie.genre.substring(0, 25) + '...' 
      : movie.genre || 'Не указан';
    
    html += `
      <div class="movie-item" data-id="${movie.movie_id}">
        <div class="movie-item-poster">
          <img src="${movie.poster_url || 'assets/images/poster-placeholder.jpg'}" alt="${movie.title}">
        </div>
        <div class="movie-item-info">
          <h3 class="movie-item-title">${movie.title} <span class="age-rating">${movie.age_rating}</span></h3>
          <div class="movie-item-meta">
            <span>Жанр: ${genre}</span>
            <span>${movie.duration} мин</span>
            <span>Премьера: ${formattedDate}</span>
          </div>
          <div class="movie-item-status">
            <span class="status ${movie.status}">${movie.status === 'active' ? 'Активен' : 'Неактивен'}</span>
          </div>
        </div>
        <div class="movie-item-actions">
          <button class="btn-edit" data-id="${movie.movie_id}">Редактировать</button>
          <button class="btn-toggle-status" data-id="${movie.movie_id}" data-status="${movie.status}">
            ${movie.status === 'active' ? 'Деактивировать' : 'Активировать'}
          </button>
        </div>
      </div>
    `;
  });
  
  moviesList.innerHTML = html;
  
  // Добавляем обработчики событий для кнопок
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', function() {
      const movieId = this.dataset.id;
      editMovie(movieId);
    });
  });
  
  document.querySelectorAll('.btn-toggle-status').forEach(button => {
    button.addEventListener('click', function() {
      const movieId = this.dataset.id;
      const currentStatus = this.dataset.status;
      toggleMovieStatus(movieId, currentStatus);
    });
  });
}

// Обработчик кнопки добавления фильма
addMovieBtn.addEventListener('click', function() {
  openModalForNewMovie();
});

// Обработчик кнопки отмены
cancelBtn.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(event) {
  if (event.target === movieModal) {
    closeModal();
  }
});

// Открытие модального окна для нового фильма
function openModalForNewMovie() {
  modalTitle.textContent = 'Добавить новый фильм';
  movieForm.reset();
  posterPreview.src = 'assets/images/poster-placeholder.jpg';
  posterUrl.value = '';
  currentMovieId = null;
  uploadStatus.textContent = '';
  uploadPosterBtn.disabled = true;
  movieModal.style.display = 'block';
}

// Открытие модального окна для редактирования фильма
async function editMovie(movieId) {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
    if (!response.ok) {
      throw new Error('Ошибка при получении данных фильма');
    }
    
    const movie = await response.json();
    
    modalTitle.textContent = 'Редактировать фильм';
    document.getElementById('title').value = movie.title;
    document.getElementById('duration').value = movie.duration;
    document.getElementById('releaseDate').value = new Date(movie.release_date).toISOString().split('T')[0];
    document.getElementById('description').value = movie.description || '';
    document.getElementById('director').value = movie.director || '';
    document.getElementById('cast').value = movie.movie_cast || '';
    document.getElementById('genre').value = movie.genre || '';
    document.getElementById('ageRating').value = movie.age_rating;
    document.getElementById('trailerUrl').value = movie.trailer_url || '';
    
    if (movie.poster_url) {
      posterPreview.src = movie.poster_url;
      posterUrl.value = movie.poster_url;
    } else {
      posterPreview.src = 'assets/images/poster-placeholder.jpg';
      posterUrl.value = '';
    }
    
    currentMovieId = movie.movie_id;
    uploadStatus.textContent = '';
    uploadPosterBtn.disabled = true;
    
    movieModal.style.display = 'block';
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось загрузить информацию о фильме');
  }
}

// Закрытие модального окна
function closeModal() {
  movieModal.style.display = 'none';
  movieForm.reset();
}

// Обработчик выбора файла постера
selectPosterBtn.addEventListener('click', function() {
  posterInput.click();
});

// Отображение выбранного файла и активация кнопки загрузки
posterInput.addEventListener('change', function() {
  const file = this.files[0];
  
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      posterPreview.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
    uploadPosterBtn.disabled = false;
    uploadStatus.textContent = 'Файл выбран. Нажмите "Загрузить постер"';
    uploadStatus.className = 'status-info';
  }
});

// Загрузка постера на сервер
uploadPosterBtn.addEventListener('click', async function() {
  const file = posterInput.files[0];
  
  if (!file) {
    uploadStatus.textContent = 'Пожалуйста, выберите файл';
    uploadStatus.className = 'status-error';
    return;
  }
  
  try {
    uploadStatus.textContent = 'Загрузка...';
    uploadStatus.className = 'status-loading';
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Вы не авторизованы');
    }
    
    const formData = new FormData();
    formData.append('poster', file);
    
    const response = await fetch(`${API_BASE_URL}/movies/upload-poster`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Ошибка при загрузке постера');
    }
    
    const result = await response.json();
    
    // Сохраняем URL постера в скрытое поле
    posterUrl.value = result.posterUrl;
    
    // Обновляем превью с полным URL
    posterPreview.src = `http://localhost:3001${result.posterUrl}`;
    
    uploadStatus.textContent = 'Постер успешно загружен';
    uploadStatus.className = 'status-success';
    uploadPosterBtn.disabled = true;
    
  } catch (error) {
    console.error('Ошибка при загрузке постера:', error);
    uploadStatus.textContent = 'Ошибка при загрузке: ' + error.message;
    uploadStatus.className = 'status-error';
  }
});

// Обработчик отправки формы фильма
movieForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('title').value,
    duration: parseInt(document.getElementById('duration').value),
    releaseDate: document.getElementById('releaseDate').value,
    description: document.getElementById('description').value,
    director: document.getElementById('director').value,
    cast: document.getElementById('cast').value,
    genre: document.getElementById('genre').value,
    ageRating: document.getElementById('ageRating').value,
    trailerUrl: document.getElementById('trailerUrl').value,
    posterUrl: posterUrl.value
  };
  
  try {
    const token = localStorage.getItem('token');
    let url = `${API_BASE_URL}/movies`;
    let method = 'POST';
    
    if (currentMovieId) {
      url = `${API_BASE_URL}/movies/${currentMovieId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error('Ошибка при сохранении фильма');
    }
    
    const result = await response.json();
    
    alert(currentMovieId ? 'Фильм успешно обновлен' : 'Фильм успешно добавлен');
    closeModal();
    loadMovies();
    
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Ошибка при сохранении фильма');
  }
});

// Изменение статуса фильма (активен/неактивен)
async function toggleMovieStatus(movieId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error('Ошибка при изменении статуса фильма');
    }
    
    await response.json();
    
    alert(`Статус фильма изменен на "${newStatus === 'active' ? 'Активен' : 'Неактивен'}"`);
    loadMovies();
    
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Ошибка при изменении статуса фильма');
  }
} 