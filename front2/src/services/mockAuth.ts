import type { User } from '@/types'

// Mock users for testing
const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@universal.com',
    password: 'admin123',
    role: 'Admin' as const,
    companies: ['Universal', 'Avanza', 'Platinium'],
  },
  {
    id: '2',
    name: 'Gestionnaire Universal',
    email: 'user@universal.com',
    password: 'user123',
    role: 'Gestionnaire' as const,
    companies: ['Universal'],
  },
  {
    id: '3',
    name: 'Gestionnaire Multi',
    email: 'multi@universal.com',
    password: 'multi123',
    role: 'Gestionnaire' as const,
    companies: ['Universal', 'Avanza'],
  },
]

export const mockLogin = async (
  email: string,
  password: string
): Promise<{ token: string; user: User }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = MOCK_USERS.find(
    (u) => u.email === email && u.password === password
  )

  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Generate a mock JWT token
  const token = `mock_token_${user.id}_${Date.now()}`

  // Return user without password
  const { password: _, ...userWithoutPassword } = user

  return {
    token,
    user: userWithoutPassword,
  }
}

export const mockLogout = async (): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))
}

// Export mock credentials for easy reference
export const MOCK_CREDENTIALS = {
  admin: {
    email: 'admin@universal.com',
    password: 'admin123',
  },
  user: {
    email: 'user@universal.com',
    password: 'user123',
  },
  multi: {
    email: 'multi@universal.com',
    password: 'multi123',
  },
}
