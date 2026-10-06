const accountKey = 'amora.account'
const sessionKey = 'amora.session'

export type VerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'
  | 'SUSPENDED'

function isStatus(value: unknown): value is VerificationStatus {
  return (
    value === 'PENDING' ||
    value === 'APPROVED' ||
    value === 'REJECTED' ||
    value === 'RESUBMISSION_REQUIRED' ||
    value === 'SUSPENDED'
  )
}

export type StudentAccount = {
  name: string
  age: number
  email: string
  password: string
  department: string
  year: string
  studentId: string
  verificationStatus: VerificationStatus
}

export function readAccount(): StudentAccount | null {
  const raw = localStorage.getItem(accountKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StudentAccount>
    if (!parsed || typeof parsed.email !== 'string' || typeof parsed.name !== 'string') return null
    return {
      name: parsed.name,
      age: typeof parsed.age === 'number' ? parsed.age : 0,
      email: parsed.email,
      password: typeof parsed.password === 'string' ? parsed.password : '',
      department: typeof parsed.department === 'string' ? parsed.department : '',
      year: typeof parsed.year === 'string' ? parsed.year : '',
      studentId: typeof parsed.studentId === 'string' ? parsed.studentId : '',
      verificationStatus: isStatus(parsed.verificationStatus) ? parsed.verificationStatus : 'PENDING',
    }
  } catch {
    return null
  }
}

export function saveAccount(account: StudentAccount) {
  localStorage.setItem(accountKey, JSON.stringify(account))
  localStorage.setItem(sessionKey, account.email)
}

export function readSessionEmail(): string | null {
  return localStorage.getItem(sessionKey)
}

export function clearSession() {
  localStorage.removeItem(sessionKey)
}

export function login(email: string, password: string): boolean {
  const account = readAccount()
  if (!account) return false
  const sameEmail = account.email.toLowerCase() === email.trim().toLowerCase()
  if (!sameEmail || account.password !== password) return false
  localStorage.setItem(sessionKey, account.email)
  return true
}

export function hasSession() {
  const account = readAccount()
  const email = readSessionEmail()
  if (!account || !email) return false
  return account.email.toLowerCase() === email.toLowerCase()
}
