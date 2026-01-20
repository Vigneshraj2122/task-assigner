// Theme management script
(function () {
    'use strict';

    const THEME_KEY = 'theme-preference';
    const THEME_ATTRIBUTE = 'data-theme';

    // Get saved theme or default to system preference
    function getTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) return savedTheme;

        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Set theme
    function setTheme(theme) {
        document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
        localStorage.setItem(THEME_KEY, theme);
        updateThemeToggleIcon(theme);
    }

    // Toggle between light and dark
    function toggleTheme() {
        const currentTheme = getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    // Update theme toggle icon
    function updateThemeToggleIcon(theme) {
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        toggleButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                    btn.setAttribute('aria-label', 'Switch to light mode');
                } else {
                    icon.className = 'fas fa-moon';
                    btn.setAttribute('aria-label', 'Switch to dark mode');
                }
            }
        });
    }

    // Initialize theme on page load
    function initTheme() {
        const savedTheme = getTheme();
        setTheme(savedTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(THEME_KEY)) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Make functions available globally
    window.toggleTheme = toggleTheme;
    window.initTheme = initTheme;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
