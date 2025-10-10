const dragHandle = document.getElementById('drag-handle')
const leftPanel = document.querySelector('.left-panel')
const rightPanel = document.querySelector('.right-panel')

let isDragging = false
let lastClientX = 0
let animationFrame = null

const startDrag = (clientX) => {
  isDragging = true
  lastClientX = clientX
  document.body.style.cursor = 'col-resize'
  requestUpdate()
}

const moveDrag = (clientX) => {
  if (!isDragging) return
  lastClientX = clientX
  requestUpdate()
}

const stopDrag = () => {
  if (!isDragging) return
  isDragging = false
  document.body.style.cursor = 'default'
  cancelAnimationFrame(animationFrame)
}

const requestUpdate = () => {
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(updatePanels)
  }
}

const updatePanels = () => {
  animationFrame = null
  if (!isDragging) return

  const totalWidth = leftPanel.parentElement.offsetWidth
  const dragWidth = dragHandle.offsetWidth
  let newLeftWidth = lastClientX
  let newRightWidth = totalWidth - newLeftWidth - dragWidth

  const minLeft = totalWidth * 0.3
  const minRight = totalWidth * 0.5

  if (newLeftWidth < minLeft) newLeftWidth = minLeft
  if (newRightWidth < minRight) newLeftWidth = totalWidth - minRight - dragWidth

  leftPanel.style.width = `${newLeftWidth}px`
  rightPanel.style.width = `${totalWidth - newLeftWidth - dragWidth}px`
}

// Mouse
dragHandle.addEventListener('mousedown', (e) => {
  e.preventDefault()
  startDrag(e.clientX)
})
document.addEventListener('mousemove', (e) => moveDrag(e.clientX))
document.addEventListener('mouseup', stopDrag)

// Touch
dragHandle.addEventListener('touchstart', (e) =>
  startDrag(e.touches[0].clientX)
)
document.addEventListener('touchmove', (e) => {
  moveDrag(e.touches[0].clientX)
  e.preventDefault()
})
document.addEventListener('touchend', stopDrag)
