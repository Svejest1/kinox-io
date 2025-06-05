document.addEventListener('DOMContentLoaded', () => {
    const movieDetailsContainer = document.getElementById('movie-details-container');
    if (!movieDetailsContainer) {
        console.error('Контейнер #movie-details-container не найден.');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        movieDetailsContainer.innerHTML = '<p>Ошибка: ID фильма не указан в URL.</p>';
        // Возможно, стоит перенаправить на главную или страницу ошибки
        return;
    }

    loadMovieDetails(movieId, movieDetailsContainer);
});

async function loadMovieDetails(id, container) {
    container.innerHTML = '<p class="loading-message">Загрузка информации о фильме...</p>'; // Сообщение о загрузке

    try {
        const movie = await getMovieById(id); // Функция из api.js
        if (!movie) {
            // getMovieById уже должен был бы вызвать reject, но на всякий случай
            container.innerHTML = `<p>Фильм с ID ${id} не найден.</p>`;
            document.title = "Фильм не найден - Кинотеатр Будущего";
            return;
        }

        // Преобразуем имена полей в соответствии с ожидаемыми
        const formattedMovie = {
            id: movie.movie_id,
            title: movie.title,
            duration: movie.duration + ' мин',
            year: new Date(movie.release_date).getFullYear(),
            rating: movie.age_rating || 'N/A',
            synopsis: movie.description,
            posterUrl: movie.poster_url,
            trailerUrl: movie.trailer_url,
            director: movie.director,
            stars: movie.movie_cast ? movie.movie_cast.split(',').map(star => star.trim()) : [],
            genre: movie.genre,
            // Преобразуем screenings в sessions
            sessions: movie.screenings ? movie.screenings.map(screening => ({
                time: screening.screening_time.substring(0, 5), // Берем только HH:MM
                hall: screening.hall_name,
                format: screening.format,
                price: screening.base_price,
                screeningId: screening.screening_id // Добавляем ID сеанса для корректного бронирования
            })) : []
        };

        console.log('Преобразованные данные фильма:', formattedMovie);

        document.title = `${formattedMovie.title} - Кинотеатр Будущего`; // Устанавливаем заголовок страницы
        renderMovieDetails(formattedMovie, container);

    } catch (error) {
        console.error('Ошибка при загрузке деталей фильма:', error);
        container.innerHTML = `<p>Не удалось загрузить информацию о фильме. ${error.message}</p>`;
        document.title = "Ошибка загрузки - Кинотеатр Будущего";
    }
}

function renderMovieDetails(movie, container) {
    // Очищаем контейнер от сообщения "Загрузка..."
    container.innerHTML = '';

    // --- Hero Section ---
    const heroSection = document.createElement('section');
    heroSection.classList.add('movie-hero');

    const backgroundImg = document.createElement('img');
    backgroundImg.classList.add('movie-hero__background');
    // Для фона лучше использовать широкоформатный кадр или специальный арт, если есть.
    // Пока используем постер.
    backgroundImg.src = movie.posterUrl || 'assets/images/posters/placeholder.png';
    backgroundImg.alt = `Фон для фильма ${movie.title}`;

    const heroContent = document.createElement('div');
    heroContent.classList.add('movie-hero__content');

    const title = document.createElement('h1');
    title.classList.add('movie-hero__title');
    title.textContent = movie.title;

    const meta = document.createElement('div');
    meta.classList.add('movie-hero__meta');
    meta.innerHTML = `
        <span>
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            ${movie.year}
        </span>
        <span>
            <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            ${movie.duration}
        </span>
        <span>
            <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            ${movie.rating || 'N/A'}
        </span>
    `;

    const synopsis = document.createElement('p');
    synopsis.classList.add('movie-hero__synopsis');
    synopsis.textContent = movie.synopsis;

    const actions = document.createElement('div');
    actions.classList.add('movie-actions');

    const buyTicketButton = document.createElement('button');
    buyTicketButton.classList.add('btn', 'btn--primary');
    buyTicketButton.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm4-4h8v2h-8z"/></svg>
        Купить билет
    `;
    buyTicketButton.addEventListener('click', () => {
        console.log('Нажата кнопка "Купить билет" для фильма:', movie.title);
        // Действие: прокрутить к секции с сеансами
        const sessionsSection = document.querySelector('.sessions-section');
        if (sessionsSection) {
            sessionsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    actions.appendChild(buyTicketButton);

    if (movie.trailerUrl) {
        const watchTrailerButton = document.createElement('button');
        watchTrailerButton.classList.add('btn', 'btn--secondary');
        watchTrailerButton.innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            Смотреть трейлер
        `;
        watchTrailerButton.addEventListener('click', () => {
            const trailerSection = document.querySelector('#trailer-section');
            if (trailerSection) {
                trailerSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        actions.appendChild(watchTrailerButton);
    }

    heroContent.appendChild(title);
    heroContent.appendChild(meta);
    heroContent.appendChild(synopsis);
    heroContent.appendChild(actions);

    heroSection.appendChild(backgroundImg);
    heroSection.appendChild(heroContent);

    // --- Additional Info (Director, Stars) ---
    const additionalInfoSection = document.createElement('section');
    additionalInfoSection.classList.add('movie-additional-info');

    if (movie.director) {
        const directorBlock = document.createElement('div');
        directorBlock.classList.add('info-block');
        directorBlock.innerHTML = `<h3>Режиссёр</h3><p><strong>${movie.director}</strong></p>`;
        additionalInfoSection.appendChild(directorBlock);
    }

    if (movie.stars && movie.stars.length > 0) {
        const starsBlock = document.createElement('div');
        starsBlock.classList.add('info-block');
        starsBlock.innerHTML = `<h3>В ролях</h3><ul>${movie.stars.map(star => `<li>${star}</li>`).join('')}</ul>`;
        additionalInfoSection.appendChild(starsBlock);
    }
    
    if (movie.genre) {
        const genreBlock = document.createElement('div');
        genreBlock.classList.add('info-block');
        genreBlock.innerHTML = `<h3>Жанр</h3><p>${movie.genre}</p>`;
        additionalInfoSection.appendChild(genreBlock);
    }

    // --- Trailer Section (if available) ---
    let trailerSectionHTML = '';
    if (movie.trailerUrl && movie.trailerUrl.includes('youtube.com/watch?v=')) {
        const videoId = movie.trailerUrl.split('v=')[1];
        const ampersandPosition = videoId ? videoId.indexOf('&') : -1;
        const finalVideoId = ampersandPosition !== -1 ? videoId.substring(0, ampersandPosition) : videoId;
        
        trailerSectionHTML = `
            <section class="trailer-section" id="trailer-section">
                <h2>Трейлер</h2>
                <div class="trailer-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${finalVideoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            </section>
        `;
    }

    // --- Sessions Section ---
    let sessionsSectionHTML = '<section class="sessions-section"><h2>Расписание сеансов</h2>';
    if (movie.sessions && movie.sessions.length > 0) {
        sessionsSectionHTML += '<div class="sessions-list">';
        movie.sessions.forEach(session => {
            sessionsSectionHTML += `
                <div class="session-item">
                    <div class="session-item__time">${session.time}</div>
                    <div class="session-item__hall">${session.hall}</div>
                    <div class="session-item__format">${session.format}</div>
                    <div class="session-item__price">${session.price} ₽</div>
                    <button class="btn btn--primary session-item__book-btn" onclick="handleBooking(${movie.id}, ${session.screeningId})">Выбрать места</button>
                </div>
            `;
        });
        sessionsSectionHTML += '</div>';
    } else {
        sessionsSectionHTML += '<p>На данный момент нет доступных сеансов для этого фильма.</p>';
    }
    sessionsSectionHTML += '</section>';

    // Глобальная функция для кнопки бронирования
    window.handleBooking = (movieId, screeningId) => {
        console.log(`Бронирование: Фильм ID ${movieId}, ID сеанса: ${screeningId}`);
        // Переход на страницу выбора мест:
        window.location.href = `seat-selection.html?screening_id=${screeningId}`;
    };

    // Собираем все секции
    container.appendChild(heroSection);
    if (additionalInfoSection.hasChildNodes()) {
         container.appendChild(additionalInfoSection);
    }
    if (trailerSectionHTML) {
        container.insertAdjacentHTML('beforeend', trailerSectionHTML);
    }
    container.insertAdjacentHTML('beforeend', sessionsSectionHTML);
} 