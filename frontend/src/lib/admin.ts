const adminSessionKey = 'amora.admin'

export const localAdmin = {
  email: 'admin@amora.local',
  password: 'amora-admin',
}

export function hasAdminSession() {
  return sessionStorage.getItem(adminSessionKey) === 'yes'
}

export function loginAdmin(email: string, password: string) {
  const sameEmail = email.trim().toLowerCase() === localAdmin.email
  if (!sameEmail || password !== localAdmin.password) return false
  sessionStorage.setItem(adminSessionKey, 'yes')
  return true
}

export function logoutAdmin() {
  sessionStorage.removeItem(adminSessionKey)
}
