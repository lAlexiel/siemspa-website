(() => {
  const system = matchMedia('(prefers-color-scheme: dark)');
  let button;

  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Activar modo claro' : 'Activar modo oscuro';
    }
  }

  applyTheme(system.matches);
  system.addEventListener('change', event => applyTheme(event.matches));
  document.addEventListener('DOMContentLoaded', () => {
    button = document.querySelector('.theme-toggle');
    button.hidden = false;
    applyTheme(system.matches);
    button.addEventListener('click', () => {
      applyTheme(document.documentElement.dataset.theme !== 'dark');
    });
  });
})();
