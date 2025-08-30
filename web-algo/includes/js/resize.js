document.addEventListener('DOMContentLoaded', function () {
  function moveEditorConsole() {
    const isMobile = window.innerWidth < 768
    const code = document.getElementById('code-container')
    const consoleEl = document.getElementById('console-container')
    const mobileCodeTarget = document.getElementById('codigo')
    const mobileConsoleTarget = document.getElementById('resposta')
    const desktopTarget = document.querySelector('.desktop-right-layout')

    if (isMobile) {
      if (!mobileCodeTarget.contains(code)) mobileCodeTarget.appendChild(code)
      if (!mobileConsoleTarget.contains(consoleEl))
        mobileConsoleTarget.appendChild(consoleEl)
    } else {
      if (!desktopTarget.contains(code)) desktopTarget.appendChild(code)
      if (!desktopTarget.contains(consoleEl))
        desktopTarget.appendChild(consoleEl)
    }
  }
  moveEditorConsole()
  window.addEventListener('resize', moveEditorConsole)
})
