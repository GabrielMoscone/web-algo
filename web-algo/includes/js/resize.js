document.addEventListener('DOMContentLoaded', function () {
  function moveEditorConsole() {
    const isMobile = window.innerWidth < 768
    const code = document.getElementById('code-container')
    const consoleEl = document.getElementById('console-container')
    const mobileCodeTarget = document.getElementById('codigo')
    const desktopTarget = document.querySelector('.desktop-right-layout')

    const acessibilityBox = document.querySelector('.accessibility-box')
    const desktopAccessibility = document.querySelector(
      '.accessibility-container-desktop'
    )
    const mobileAccessibility = document.querySelector(
      '.accessibility-container-mobile'
    )

    if (isMobile) {
      if (!mobileAccessibility.contains(acessibilityBox))
        mobileAccessibility.appendChild(acessibilityBox)
      if (!mobileCodeTarget.contains(code)) mobileCodeTarget.appendChild(code)
      if (!mobileCodeTarget.contains(consoleEl))
        mobileCodeTarget.appendChild(consoleEl)
    } else {
      if (!desktopAccessibility.contains(acessibilityBox))
        desktopAccessibility.appendChild(acessibilityBox)
      if (!desktopTarget.contains(code)) desktopTarget.appendChild(code)
      if (!desktopTarget.contains(consoleEl))
        desktopTarget.appendChild(consoleEl)
    }
  }
  moveEditorConsole()
  window.addEventListener('resize', moveEditorConsole)
})
