import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Flame, 
  Target, 
  CheckCircle,
  Calendar
} from 'lucide-react'
import blink from '@/blink/client'
import { Habit, HabitLog } from '@/types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export function HabitsView() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadHabits = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const habitsData = await blink.db.habits.list({ 
        where: { userId: user.id, isActive: "1" },
        orderBy: { createdAt: 'desc' }
      })
      setHabits(habitsData)
    } catch (error) {
      console.error('Error loading habits:', error)
      toast.error('Failed to load habits')
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadHabits()
    }
  }, [user?.id, loadHabits])

  const markHabitComplete = async (habitId: string) => {
    if (!user?.id) return
    
    const today = format(new Date(), 'yyyy-MM-dd')
    
    try {
      // Check if already completed today
      const existingLog = await blink.db.habitLogs.list({
        where: { habitId, userId: user.id, completedDate: today }
      })
      
      if (existingLog.length > 0) {
        toast.error('Habit already completed today!')
        return
      }
      
      // Add habit log
      await blink.db.habitLogs.create({
        id: `log_${Date.now()}`,
        habitId,
        userId: user.id,
        completedDate: today,
        completedAt: new Date().toISOString()
      })
      
      // Update habit streak
      const habit = habits.find(h => h.id === habitId)
      if (habit) {
        const newStreak = habit.currentStreak + 1
        const newBestStreak = Math.max(habit.bestStreak, newStreak)
        
        await blink.db.habits.update(habitId, {
          currentStreak: newStreak,
          bestStreak: newBestStreak
        })
        
        // Optimistic update
        setHabits(prev => prev.map(h => 
          h.id === habitId 
            ? { ...h, currentStreak: newStreak, bestStreak: newBestStreak }
            : h
        ))
        
        toast.success(`🔥 Habit completed! ${newStreak} day streak!`)
      }
    } catch (error) {
      console.error('Error marking habit complete:', error)
      toast.error('Failed to mark habit complete')
    }
  }

  const addSampleHabit = async () => {
    if (!user?.id) return
    
    const sampleHabits = [
      { name: 'Drink 8 glasses of water', color: '#3B82F6' },
      { name: 'Exercise for 30 minutes', color: '#EF4444' },
      { name: 'Read for 20 minutes', color: '#10B981' },
      { name: 'Meditate for 10 minutes', color: '#8B5CF6' },
      { name: 'Write in journal', color: '#F59E0B' },
    ]
    
    const randomHabit = sampleHabits[Math.floor(Math.random() * sampleHabits.length)]
    
    try {
      const newHabit = await blink.db.habits.create({
        id: `habit_${Date.now()}`,
        userId: user.id,
        name: randomHabit.name,
        targetFrequency: 1,
        currentStreak: 0,
        bestStreak: 0,
        color: randomHabit.color,
        createdAt: new Date().toISOString(),
        isActive: true
      })
      
      setHabits(prev => [newHabit, ...prev])
      toast.success('Habit added successfully!')
    } catch (error) {
      console.error('Error adding habit:', error)
      toast.error('Failed to add habit')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in</h2>
          <p className="text-gray-600 mt-2">Sign in to track your habits</p>
        </div>
        <Button onClick={() => blink.auth.login()}>
          Sign In
        </Button>
      </div>
    )
  }

  const totalStreak = habits.reduce((sum, habit) => sum + habit.currentStreak, 0)
  const averageStreak = habits.length > 0 ? Math.round(totalStreak / habits.length) : 0
  const bestOverallStreak = Math.max(...habits.map(h => h.bestStreak), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Habits</h1>
          <p className="text-gray-600 mt-1">Build consistency and track your daily habits</p>
        </div>
        <Button onClick={addSampleHabit} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Sample Habit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Flame className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-orange-700">Total Streak</p>
                <p className="text-3xl font-bold text-orange-900">{totalStreak}</p>
                <p className="text-xs text-orange-600">Days combined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-700">Average Streak</p>
                <p className="text-3xl font-bold text-blue-900">{averageStreak}</p>
                <p className="text-xs text-blue-600">Days per habit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-700">Best Streak</p>
                <p className="text-3xl font-bold text-purple-900">{bestOverallStreak}</p>
                <p className="text-xs text-purple-600">Personal record</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Target className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
              <p className="text-gray-600 mb-4">Start building good habits to improve your daily routine</p>
              <Button onClick={addSampleHabit} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          habits.map((habit) => (
            <Card key={habit.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => markHabitComplete(habit.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Streak */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Current Streak</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {habit.currentStreak}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to best</span>
                    <span>{Math.min(100, Math.round((habit.currentStreak / Math.max(habit.bestStreak, 1)) * 100))}%</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (habit.currentStreak / Math.max(habit.bestStreak, 1)) * 100)}
                    className="h-2"
                  />
                </div>

                {/* Best Streak */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Best streak</span>
                  <span className="font-medium">{habit.bestStreak} days</span>
                </div>

                {/* Target Frequency */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Target</span>
                  <span>{habit.targetFrequency}x per day</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Today's Progress */}
      {habits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="font-medium text-gray-900">{habit.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markHabitComplete(habit.id)}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Mark Done
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}