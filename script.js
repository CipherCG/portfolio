/**
 * Main Interactive Script:
 * - Theme Toggle (Dark/Light Mode)
 * - Secret Easter Egg Modal Control
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. DARK / LIGHT THEME TOGGLE LOGIC
  // ==========================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon') : null;

  // Check saved theme preference or default to system setting
  const savedTheme = localStorage.getItem('portfolio-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateToggleIcon(true);
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    updateToggleIcon(false);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const isDark = currentTheme === 'dark';

      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('portfolio-theme', 'light');
        updateToggleIcon(false);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('portfolio-theme', 'dark');
        updateToggleIcon(true);
      }
    });
  }

  function updateToggleIcon(isDark) {
    if (themeIcon) {
      themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
  }

  // ==========================================
  // 2. SECRET EASTER EGG MODAL LOGIC
  // ==========================================
  const secretBtn = document.getElementById('secret-easter-egg');
  const modalOverlay = document.getElementById('secret-modal');
  const modalCloseBtn = document.getElementById('modal-close');

  if (secretBtn && modalOverlay && modalCloseBtn) {
    // Open modal on secret top-left corner click
    secretBtn.addEventListener('click', () => {
      modalOverlay.classList.add('active');
      modalOverlay.setAttribute('aria-hidden', 'false');
    });

    // Close modal when clicking the 'X'
    modalCloseBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      modalOverlay.setAttribute('aria-hidden', 'true');
    });

    // Close modal when clicking anywhere on the dark background
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        modalOverlay.setAttribute('aria-hidden', 'true');
      }
    });
  }
});
