import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckSquare, 
  Target, 
  TrendingUp, 
  Calendar,
  Clock,
  Flame,
  Trophy,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import blink from '@/blink/client'
import { Task, Habit, Goal } from '@/types'
import { format, isToday, isPast, parseISO } from 'date-fns'

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const [tasksData, habitsData, goalsData] = await Promise.all([
        blink.db.tasks.list({ 
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 10
        }),
        blink.db.habits.list({ 
          where: { userId: user.id, isActive: "1" },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.goals.list({ 
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 5
        })
      ])
      
      setTasks(tasksData)
      setHabits(habitsData)
      setGoals(goalsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id, loadData])

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
          <h2 className="text-2xl font-bold text-gray-900">Welcome to LifeFlow</h2>
          <p className="text-gray-600 mt-2">Please sign in to start organizing your life</p>
        </div>
        <Button onClick={() => blink.auth.login()}>
          Sign In
        </Button>
      </div>
    )
  }

  const todayTasks = tasks.filter(task => 
    task.dueDate && isToday(parseISO(task.dueDate)) && task.status === 'pending'
  )
  
  const overdueTasks = tasks.filter(task => 
    task.dueDate && isPast(parseISO(task.dueDate)) && task.status === 'pending'
  )
  
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const activeGoals = goals.filter(goal => goal.status === 'active')
  const totalStreak = habits.reduce((sum, habit) => sum + habit.currentStreak, 0)
  
  // Calculate daily habit completion percentage
  const totalHabits = habits.length
  const habitCompletionPercentage = totalHabits > 0 ? Math.round((totalStreak / (totalHabits * 7)) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good morning, {user.displayName || user.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Today's Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{todayTasks.length}</div>
            <p className="text-xs text-blue-600 mt-1">
              {overdueTasks.length > 0 && `${overdueTasks.length} overdue`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{completedTasks.length}</div>
            <p className="text-xs text-green-600 mt-1">Tasks finished</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Streak Total</CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{totalStreak}</div>
            <p className="text-xs text-orange-600 mt-1">Days combined</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Habit Progress</CardTitle>
            <Target className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">{habitCompletionPercentage}%</div>
            <p className="text-xs text-teal-600 mt-1">Weekly completion</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Active Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{activeGoals.length}</div>
            <p className="text-xs text-purple-600 mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-indigo-600" />
              Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No tasks for today</p>
                <p className="text-sm">You're all caught up! 🎉</p>
              </div>
            ) : (
              todayTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                  </div>
                  <Badge variant={
                    task.priority === 'high' ? 'destructive' :
                    task.priority === 'medium' ? 'default' : 'secondary'
                  }>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Habits Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="mr-2 h-5 w-5 text-orange-600" />
              Habit Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {habits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No habits tracked yet</p>
                <p className="text-sm">Start building good habits!</p>
              </div>
            ) : (
              habits.slice(0, 4).map((habit) => (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{habit.name}</span>
                    <div className="flex items-center space-x-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-bold text-orange-600">
                        {habit.currentStreak} days
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(habit.currentStreak / Math.max(habit.bestStreak, 7)) * 100} 
                    className="h-2"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Overview */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
              Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.slice(0, 4).map((goal) => (
                <div key={goal.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <span className="text-sm font-bold text-purple-600">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  {goal.targetDate && (
                    <p className="text-xs text-gray-600">
                      Due: {format(parseISO(goal.targetDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}