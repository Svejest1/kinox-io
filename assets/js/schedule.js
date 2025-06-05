document.addEventListener('DOMContentLoaded', function() {
    console.log('Schedule.js - DOM loaded (DEBUG MODE - FILTERS DISABLED)');
    
    const dateTabsContainer = document.getElementById('date-tabs-container');
    const filterButtons = document.querySelectorAll('.filter-options .filter-button');
    const scheduleContainer = document.getElementById('schedule-container');
    
    const initialDate = new Date(2025, 5, 3); // Июнь - 5-й месяц (0-индексация)
    let activeDateGlobal = ''; // Глобальная переменная для хранения текущей активной даты YYYY-MM-DD
    let currentLoadToken = null; // Используем объект-токен для отслеживания

    function formatDateForDisplay(date) {
        const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
        const day = date.getDate();
        const weekday = weekdays[date.getDay()];
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const compareDate = new Date(date);
        compareDate.setHours(0,0,0,0);

        let dayLabel = weekday;
        if (compareDate.getTime() === today.getTime()) {
            dayLabel = "Сегодня";
        }
        
        return {
            dayLabel: dayLabel,
            dateLabel: `${day} ${date.toLocaleDateString('ru-RU', { month: 'long' })}`
        };
    }

    function generateDateTabs() {
        dateTabsContainer.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            const date = new Date(initialDate);
            date.setDate(initialDate.getDate() + i);
            
            const displayDate = formatDateForDisplay(date);
            
            // Формируем dateValue вручную, чтобы избежать проблем с часовыми поясами
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Месяцы 0-11, добавляем 1
            const day = date.getDate().toString().padStart(2, '0');
            const dateValue = `${year}-${month}-${day}`;

            const tab = document.createElement('button');
            tab.classList.add('date-tab');
            tab.dataset.date = dateValue;
            
            const weekdayDiv = document.createElement('div');
            weekdayDiv.classList.add('weekday');
            weekdayDiv.textContent = displayDate.dayLabel;
            
            const dateDiv = document.createElement('div');
            dateDiv.classList.add('date');
            dateDiv.textContent = displayDate.dateLabel;
            
            tab.appendChild(weekdayDiv);
            tab.appendChild(dateDiv);
            
            if (i === 0) {
                tab.classList.add('active');
                // Устанавливаем activeDateGlobal здесь, т.к. это начальная активная дата
                activeDateGlobal = dateValue; 
            }
            
            tab.addEventListener('click', function() {
                const newSelectedDate = this.dataset.date;
                const tabTextContent = this.textContent.replace(/\s+/g, ' ').trim(); // Получаем текст вкладки
                console.log(`DEBUG: Clicked Tab Text is "${tabTextContent}", its dataset.date is "${newSelectedDate}"`); // НОВЫЙ ЛОГ
                console.log(`Tab clicked for date: ${newSelectedDate}`);
                document.querySelectorAll('#date-tabs-container .date-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                // Не обновляем activeDateGlobal здесь, это сделает loadMoviesWithScreenings
                loadMoviesWithScreenings(newSelectedDate);
            });
            dateTabsContainer.appendChild(tab);
        }
    }

    // РАСКОММЕНТИРУЕМ ОБРАБОТЧИКИ ФИЛЬТРОВ
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log(`Filter button clicked. Current activeDateGlobal: ${activeDateGlobal}`);
            const group = this.closest('.filter-options');
            const buttonsInGroup = group.querySelectorAll('.filter-button');
            
            buttonsInGroup.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (activeDateGlobal) {
                loadMoviesWithScreenings(activeDateGlobal); // Перезагружаем с учетом новых фильтров
            } else {
                 console.error("Schedule.js - activeDateGlobal not set when changing filter!");
                 // Попытка загрузить для первой активной или доступной даты, если activeDateGlobal не установлена
                 const firstTab = dateTabsContainer.querySelector('.date-tab.active');
                 if (firstTab && firstTab.dataset.date) {
                    console.log(`Filter click: activeDateGlobal was empty, using date from active tab: ${firstTab.dataset.date}`);
                    loadMoviesWithScreenings(firstTab.dataset.date);
                 } else {
                    const firstAvailableTab = dateTabsContainer.querySelector('.date-tab'); 
                    if(firstAvailableTab && firstAvailableTab.dataset.date){
                        console.log(`Filter click: activeDateGlobal and active tab empty, using date from first available tab: ${firstAvailableTab.dataset.date}`);
                        loadMoviesWithScreenings(firstAvailableTab.dataset.date);
                    } else {
                        console.error("Schedule.js - Cannot apply filter: no date selected or available.");
                    }
                 }
            }
        });
    });
    
    async function loadMoviesWithScreenings(dateToLoad) { 
        const localLoadToken = {}; // Создаем новый уникальный токен для этого вызова
        currentLoadToken = localLoadToken; // Устанавливаем его как текущий активный токен

        console.log(`loadMoviesWithScreenings START for date: ${dateToLoad}. Token:`, localLoadToken);
        
        // Обновляем activeDateGlobal только когда мы *начинаем* загрузку для этой даты
        // и если это все еще актуальная операция
        if (currentLoadToken === localLoadToken) {
            activeDateGlobal = dateToLoad;
            console.log(`activeDateGlobal is NOW: ${activeDateGlobal}`);
        }

        if (!dateToLoad) {
            console.error("Schedule.js - dateToLoad is undefined or null!");
            if (currentLoadToken === localLoadToken) { 
                scheduleContainer.innerHTML = '<p style="text-align: center; padding: 50px 0;">Ошибка: дата для загрузки не определена.</p>';
            }
            return;
        }
        
        if (currentLoadToken === localLoadToken) {
             scheduleContainer.innerHTML = `<p style="text-align: center; padding: 50px 0;">Загрузка расписания для ${dateToLoad} (ФИЛЬТРЫ ОТКЛЮЧЕНЫ)...</p>`;
        }
        
        try {
            console.log(`Fetching movies for date: ${dateToLoad}. Token:`, localLoadToken);
            const moviesData = await getMoviesWithScreenings(dateToLoad); 
            
            if (currentLoadToken !== localLoadToken) {
                console.log(`loadMoviesWithScreenings STALE for date ${dateToLoad}. Current token:`, currentLoadToken, `This call token:`, localLoadToken, ". Aborting UI update.");
                return;
            }
            console.log(`Received raw movies data for ${dateToLoad}:`, moviesData, "Token:", localLoadToken);

            const movies = Array.isArray(moviesData) ? moviesData : (moviesData && Array.isArray(moviesData.movies) ? moviesData.movies : []);

            if (!movies || movies.length === 0) {
                scheduleContainer.innerHTML = `<p style="text-align: center; padding: 50px 0;">На ${dateToLoad} нет доступных сеансов (ответ от сервера пуст)</p>`;
                return;
            }
            
            const filteredMovies = applyFilters(movies); // РАСКОММЕНТИРУЕМ ФИЛЬТРАЦИЮ
            // console.log("[DEBUG] Skipping applyFilters. Passing all movies to displayMovies.", movies);
            
            if (!filteredMovies || filteredMovies.length === 0) { 
                scheduleContainer.innerHTML = `<p style="text-align: center; padding: 50px 0;">Нет сеансов на ${dateToLoad}, соответствующих выбранным фильтрам.</p>`;
                return;
            }
            // displayMovies(movies, dateToLoad); // СТАРЫЙ ВЫЗОВ
            displayMovies(filteredMovies, dateToLoad); // Передаем отфильтрованные фильмы
            
        } catch (error) {
            console.error(`Error loading schedule for ${dateToLoad}:`, error, "Token:", localLoadToken);
            if (currentLoadToken === localLoadToken) { 
                scheduleContainer.innerHTML = `
                    <p style="text-align: center; padding: 50px 0;">Ошибка при загрузке расписания. Пожалуйста, попробуйте позже.</p>
                    <p style="text-align: center; color: #888; font-size: 0.8em;">Детали: ${error.message || 'Неизвестная ошибка'}</p>
                `;
            }
        }
    }
    
    function applyFilters(movies) { // Убедимся, что функция использует правильные поля для фильтрации
        const hallFilterElem = document.querySelector('.filter-options:nth-of-type(1) .filter-button.active');
        const formatFilterElem = document.querySelector('.filter-options:nth-of-type(2) .filter-button.active');
            
        const activeHallFilter = hallFilterElem ? hallFilterElem.textContent.trim() : 'Все залы';
        const activeFormatFilter = formatFilterElem ? formatFilterElem.textContent.trim() : 'Все форматы';
            
        console.log('[applyFilters] Applying filters - Hall:', activeHallFilter, 'Format:', activeFormatFilter);

        return movies.map(movie => {
            // Клонируем фильм, чтобы не изменять исходный объект в общем списке movies
            // Важно также клонировать массив сеансов, если он есть
            const movieClone = { 
                ...movie,
                // Инициализируем sessions в клоне как пустой массив, если screenings отсутствует или не массив
                sessions: (movie.screenings && Array.isArray(movie.screenings)) ? [...movie.screenings] : [] 
            };

            // Теперь работаем с movieClone.sessions, который является копией movie.screenings
            if (movieClone.sessions.length > 0) { 
                console.log(`[applyFilters] Movie: ${movieClone.title}, processing ${movieClone.sessions.length} sessions. Hall filter: '${activeHallFilter}', Format filter: '${activeFormatFilter}'`);
                movieClone.sessions = movieClone.sessions.filter(session => {
                    console.log(`[applyFilters]   Session details: hall_name='${session.hall_name}', format='${session.format}'`);
                    
                    const hallMatch = activeHallFilter === 'Все залы' || session.hall_name === activeHallFilter;
                    const formatMatch = activeFormatFilter === 'Все форматы' || session.format === activeFormatFilter;
                    
                    console.log(`[applyFilters]     Hall match: ${hallMatch} (Session: '${session.hall_name}' vs Filter: '${activeHallFilter}')`);
                    console.log(`[applyFilters]     Format match: ${formatMatch} (Session: '${session.format}' vs Filter: '${activeFormatFilter}')`);
                    
                    return hallMatch && formatMatch;
                });
                console.log(`[applyFilters] Movie: ${movieClone.title}, ${movieClone.sessions.length} sessions REMAIN after filtering.`);
            } else {
                // Этот лог теперь будет означать, что у фильма изначально не было сеансов (movie.screenings был пуст или не массив)
                console.log(`[applyFilters] Movie: ${movieClone.title}, no initial sessions to filter (movie.screenings was empty or not an array).`);
            }
            return movieClone;
        }).filter(movie => {
            const hasSessions = movie.sessions && movie.sessions.length > 0;
            if (!hasSessions) {
                console.log(`[applyFilters] Movie: ${movie.title} is being REMOVED as it has no remaining sessions.`);
            }
            return hasSessions;
        });
    }
    
    function displayMovies(movies, dateForLinks) { 
        console.log(`Displaying ${movies.length} movies for date ${dateForLinks} (ФИЛЬТРЫ ОТКЛЮЧЕНЫ)`);
        if (!movies || movies.length === 0) { // Эта проверка остается на случай, если бэкенд вернул пустой массив
             scheduleContainer.innerHTML = `<p style="text-align: center; padding: 50px 0;">На ${dateForLinks} нет доступных сеансов (displayMovies получила пустой список).</p>`;
            return;
        }
 
        let html = '<div class="movies-grid-schedule">';
        
        movies.forEach(movie => {
            const posterUrl = movie.poster_url || movie.posterUrl || 'assets/images/placeholder-poster.png';

            html += `
                <div class="movie-card-schedule">
                    <div class="movie-poster-schedule">
                        <img src="${posterUrl}" alt="Постер фильма ${movie.title}">
                    </div>
                    <div class="movie-info-schedule">
                        <h3 class="movie-title-schedule">${movie.title}</h3>
                        <p class="movie-meta-schedule">${movie.genre || 'Жанр не указан'} • ${movie.duration_minutes || movie.duration || 'N/A'} мин.</p>
                        <div class="sessions-container">`;
            
            if (movie.sessions && movie.sessions.length > 0) {
                movie.sessions.forEach(session => {
                    const hallName = session.hall || session.hall_name || 'Зал не указан';
                    const sessionId = session.id || session.screening_id || `${movie.id || movie.movie_id}_${(session.screening_time || session.time || 'notime').replace(':', '')}_${dateForLinks.replace(/-/g, '')}`;
                    const displayTime = session.screening_time || session.time; // Используем screening_time, если есть, иначе time
                    
                    if (!displayTime) {
                        console.warn('Session object is missing time information (screening_time and time are undefined):', session);
                        html += `<span class="session-time-btn disabled">--:--</span>`; // Показать что-то, если времени нет
                        return; // Пропустить этот сеанс, если нет времени
                    }

                    html += `<a href="seat-selection.html?movieId=${movie.id || movie.movie_id}&sessionId=${sessionId}&date=${dateForLinks}&time=${displayTime}&hall=${encodeURIComponent(hallName)}" class="session-time-btn">${displayTime}</a>`;
                });
            } else {
                // Поскольку фильтры отключены, а сеансы теперь должны быть встроены бэкендом,
                // это сообщение будет означать, что бэкенд вернул фильм без сеансов.
                html += '<p>Для этого фильма нет сеансов.</p>';
            }
                        
            html += `
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        scheduleContainer.innerHTML = html;
    }

    generateDateTabs();
    if (activeDateGlobal) {
        console.log(`Initial load for activeDateGlobal: ${activeDateGlobal} (ФИЛЬТРЫ ОТКЛЮЧЕНЫ)`);
        loadMoviesWithScreenings(activeDateGlobal);
    } else {
        const firstTab = dateTabsContainer.querySelector('.date-tab.active'); // Ищем активную вкладку при инициализации
        if (firstTab && firstTab.dataset.date) {
            console.log(`Initial load: activeDateGlobal was empty, using date from active tab: ${firstTab.dataset.date} (ФИЛЬТРЫ ОТКЛЮЧЕНЫ)`);
            loadMoviesWithScreenings(firstTab.dataset.date);
        } else {
            const firstAvailableTab = dateTabsContainer.querySelector('.date-tab');
             if(firstAvailableTab && firstAvailableTab.dataset.date){
                console.log(`Initial load: activeDateGlobal and active tab were empty, using date from first available tab: ${firstAvailableTab.dataset.date} (ФИЛЬТРЫ ОТКЛЮЧЕНЫ)`);
                loadMoviesWithScreenings(firstAvailableTab.dataset.date);
             } else {
                console.error("Schedule.js - Cannot perform initial load: no date tab found.");
                scheduleContainer.innerHTML = '<p style="text-align: center; padding: 50px 0;">Не удалось загрузить даты для расписания.</p>';
             }
        }
    }
}); 