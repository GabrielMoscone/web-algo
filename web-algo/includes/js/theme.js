const aplicarTema = (theme) => {
  document.body.classList.toggle('dark-mode', theme === 'dark')
  localStorage.setItem('theme', theme)
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light'
aplicarTema(savedTheme)

// Restore font size
const savedFontSize = localStorage.getItem('fontSize')
if (savedFontSize) {
  document.body.style.fontSize = `${savedFontSize}rem`
}
