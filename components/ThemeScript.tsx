export default function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        var storedTheme = localStorage.getItem('vocnix-theme');
        if (storedTheme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
