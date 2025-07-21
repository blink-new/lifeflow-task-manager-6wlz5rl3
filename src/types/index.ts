export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed' | 'overdue'
  dueDate?: string
  category?: string
  createdAt: string
  completedAt?: string
  isRecurring: boolean
}

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  targetFrequency: number
  currentStreak: number
  bestStreak: number
  color: string
  createdAt: string
  isActive: boolean
}

export interface HabitLog {
  id: string
  habitId: string
  userId: string
  completedDate: string
  completedAt: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  description?: string
  targetDate?: string
  progress: number
  status: 'active' | 'completed' | 'paused'
  category?: string
  createdAt: string
  completedAt?: string
}

export interface User {
  id: string
  email: string
  displayName?: string
}