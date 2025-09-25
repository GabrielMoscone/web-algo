import { api } from '../client/apiClient.js'

const form = document.getElementById('registerForm')
form?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const fullName = document.getElementById('rg_name').value || ''
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ')

  if (parts.length < 2) {
    alert('Informe o nome completo (nome e sobrenome).')
    if (typeof showStep === 'function') {
      currentStep = 0
      showStep(0)
    }
    return
  }

  const firstName = parts[0]
  const secondName = parts.slice(1).join(' ')

  const payload = {
    firstName,
    secondName,
    username: document.getElementById('rg_login').value.trim(),
    email: document.getElementById('rg_email').value.trim(),
    obs: document.getElementById('rg_role').value,
    gender: document.querySelector('input[name="rg_sex"]:checked').value,
    city: document.getElementById('rg_city').value.trim(),
    state: document.getElementById('rg_state').value.trim(),
    password: document.getElementById('rg_pwd').value,
  }
  const pwd2 = document.getElementById('rg_pwd2').value

  if (payload.password !== pwd2) {
    alert('As senhas não coincidem.')
    return
  } else if (payload.password.length < 7 || payload.password.length > 10) {
    alert('A senha informada não atende aos critérios!')
    return
  }

  try {
    await api('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    alert('Usuário criado com sucesso.')
    window.location.replace('/login.html')
  } catch (ex) {
    alert(ex.message || 'Falha ao registrar usuário')
  }
})
