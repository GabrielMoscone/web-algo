const dragHandle = document.getElementById('drag-handle')
const leftPanel = document.querySelector('.left-panel')
const rightPanel = document.querySelector('.right-panel')

let isDragging = false

const startDrag = (clientX) => {
  isDragging = true
  document.body.style.cursor = 'col-resize'
  moveDrag(clientX) // Ajusta imediatamente caso comece em um ponto específico
}

const moveDrag = (clientX) => {
  if (!isDragging) return

  const totalWidth = leftPanel.parentElement.offsetWidth
  let newLeftWidth = clientX
  let newRightWidth = totalWidth - newLeftWidth - dragHandle.offsetWidth

  // Limites mínimos
  const minLeft = totalWidth * 0.3
  const minRight = totalWidth * 0.5

  if (newLeftWidth < minLeft) newLeftWidth = minLeft
  if (newRightWidth < minRight)
    newLeftWidth = totalWidth - minRight - dragHandle.offsetWidth

  leftPanel.style.width = `${newLeftWidth}px`
  rightPanel.style.width = `${
    totalWidth - newLeftWidth - dragHandle.offsetWidth
  }px`
}

const stopDrag = () => {
  if (isDragging) {
    isDragging = false
    document.body.style.cursor = 'default'
  }
}

// Eventos para mouse
dragHandle.addEventListener('mousedown', (e) => startDrag(e.clientX))
document.addEventListener('mousemove', (e) => moveDrag(e.clientX))
document.addEventListener('mouseup', stopDrag)

// Eventos para touch (celular/tablet)
dragHandle.addEventListener('touchstart', (e) =>
  startDrag(e.touches[0].clientX)
)
document.addEventListener('touchmove', (e) => {
  moveDrag(e.touches[0].clientX)
  e.preventDefault() // impede scroll ao arrastar
})
document.addEventListener('touchend', stopDrag)
