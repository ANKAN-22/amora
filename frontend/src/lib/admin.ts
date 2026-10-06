const adminSessionKey = 'amora.admin'

function envValue(name: 'VITE_ADMIN_EMAIL' | 'VITE_ADMIN_PASSWORD') {
  const value = import.meta.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

export const localAdmin = {
  email: envValue('VITE_ADMIN_EMAIL'),
  password: envValue('VITE_ADMIN_PASSWORD'),
}

export function hasAdminSession() {
  return sessionStorage.getItem(adminSessionKey) === 'yes'
}

export function loginAdmin(email: string, password: string) {
  if (!localAdmin.email || !localAdmin.password) return false
  const sameEmail = email.trim().toLowerCase() === localAdmin.email.toLowerCase()
  if (!sameEmail || password !== localAdmin.password) return false
  sessionStorage.setItem(adminSessionKey, 'yes')
  return true
}

export function logoutAdmin() {
  sessionStorage.removeItem(adminSessionKey)
}
