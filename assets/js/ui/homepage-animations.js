// assets/js/ui/homepage-animations.js

document.addEventListener('DOMContentLoaded', () => {
    const galaxy = document.querySelector('.movie-galaxy');
    if (!galaxy) return;

    const planets = galaxy.querySelectorAll('.movie-planet');
    if (planets.length === 0) return;

    // 1. Параллакс эффект при движении мыши
    galaxy.addEventListener('mousemove', (e) => {
        const rect = galaxy.getBoundingClientRect();
        // Нормализуем координаты мыши относительно центра контейнера (-0.5 до 0.5)
        const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

        // Небольшой коэффициент для силы параллакса
        const parallaxStrength = 10; // в пикселях

        planets.forEach((planet, index) => {
            // Можно добавить индивидуальные модификаторы, чтобы планеты двигались по-разному
            // Например, на основе их индекса или случайного значения
            const planetStrengthX = parallaxStrength * ( (index % 2 === 0) ? 1 : 1.5 ); // разные слои
            const planetStrengthY = parallaxStrength * ( (index % 3 === 0) ? 1 : 1.3 );
            
            const translateX = -x * planetStrengthX;
            const translateY = -y * planetStrengthY;
            
            // Используем requestAnimationFrame для более плавных анимаций
            requestAnimationFrame(() => {
                planet.style.transform = `translate(${translateX}px, ${translateY}px) rotateY(${x * 5}deg) scale(1)`; // Сохраняем базовый scale, ховер его изменит
            });
        });
    });

    // Сбрасываем трансформации, когда мышь уходит из контейнера, чтобы ховер-эффекты CSS работали корректно
    galaxy.addEventListener('mouseleave', () => {
        planets.forEach(planet => {
            requestAnimationFrame(() => {
                 // Возвращаем только те трансформации, которые не конфликтуют с CSS-ховером
                 // или полностью сбрасываем, если CSS ховер их переопределит
                planet.style.transform = 'translate(0px, 0px) rotateY(0deg) scale(1)'; 
            });
        });
    });


    // 2. (Опционально) Легкий эффект "дрейфа" для каждой планеты
    planets.forEach((planet, index) => {
        // Уникальные параметры для каждой планеты
        const randomDelay = Math.random() * 5; // Задержка от 0 до 5 секунд
        const randomDuration = 10 + Math.random() * 10; // Продолжительность от 10 до 20 секунд
        const randomXMax = 10 + Math.random() * 10; // Максимальное смещение по X
        const randomYMax = 10 + Math.random() * 10; // Максимальное смещение по Y
        const randomRotateMax = 2 + Math.random() * 3; // Максимальный угол поворота

        planet.style.setProperty('--drift-delay', `${randomDelay}s`);
        planet.style.setProperty('--drift-duration', `${randomDuration}s`);
        planet.style.setProperty('--drift-x-max', `${randomXMax}px`);
        planet.style.setProperty('--drift-y-max', `${randomYMax}px`);
        planet.style.setProperty('--drift-rotate-max', `${randomRotateMax}deg`);

        planet.classList.add('drifting-planet');
    });
}); 