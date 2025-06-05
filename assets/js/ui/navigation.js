document.addEventListener('DOMContentLoaded', () => {
    const burgerBtn = document.querySelector('.burger-menu-btn');
    const mainNav = document.querySelector('.main-nav');

    if (burgerBtn && mainNav) {
        burgerBtn.addEventListener('click', () => {
            mainNav.classList.toggle('nav-open');
            const isExpanded = mainNav.classList.contains('nav-open');
            burgerBtn.setAttribute('aria-expanded', isExpanded.toString());
            if (isExpanded) {
                burgerBtn.setAttribute('aria-label', 'Закрыть меню');
            } else {
                burgerBtn.setAttribute('aria-label', 'Открыть меню');
            }
        });
    }

    // Логика для подсветки активного пункта меню (если еще не реализована)
    // Можно добавить здесь или оставить в main.js, если она уже там.
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPath = window.location.pathname.split('/').pop(); // Получаем имя текущего файла

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        }
    });
}); 