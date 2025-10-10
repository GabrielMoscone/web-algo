const dragHandle = document.getElementById('drag-handle')
const leftPanel = document.querySelector('.left-panel')
const rightPanel = document.querySelector('.right-panel')

let isDragging = false

dragHandle.addEventListener('mousedown', (e) => {
  isDragging = true
  document.body.style.cursor = 'col-resize'
})

document.addEventListener('mouseup', () => {
  isDragging = false
  document.body.style.cursor = 'default'
})

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return

  const totalWidth = leftPanel.parentElement.offsetWidth
  let newLeftWidth = e.clientX
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
})

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false
    document.body.style.cursor = 'default'
  }
})
