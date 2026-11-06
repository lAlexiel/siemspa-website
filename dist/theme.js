(() => {
  const system = matchMedia('(prefers-color-scheme: dark)');
  const key = 'siem-theme';
  let choice;
  let button;
  try {
    choice = localStorage.getItem(key);
  } catch {}

  function applyTheme() {
    const dark = choice === 'dark' || (choice !== 'light' && system.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Activar modo claro' : 'Activar modo oscuro';
    }
  }

  applyTheme();
  system.addEventListener('change', applyTheme);
  document.addEventListener('DOMContentLoaded', () => {
    button = document.querySelector('.theme-toggle');
    button.hidden = false;
    applyTheme();
    button.addEventListener('click', () => {
      choice = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      try {
        localStorage.setItem(key, choice);
      } catch {}
    });
  });
})();
