import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Target, 
  CheckSquare,
  Calendar,
  Flame,
  Trophy,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import blink from '@/blink/client'
import { Task, Habit, Goal } from '@/types'
import { format, subDays, isAfter, parseISO, startOfWeek, endOfWeek } from 'date-fns'

export function ProgressView() {
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
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.habits.list({ 
          where: { userId: user.id, isActive: "1" },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.goals.list({ 
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
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
          <h2 className="text-2xl font-bold text-gray-900">Please sign in</h2>
          <p className="text-gray-600 mt-2">Sign in to view your progress analytics</p>
        </div>
        <Button onClick={() => blink.auth.login()}>
          Sign In
        </Button>
      </div>
    )
  }

  // Calculate analytics
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const pendingTasks = tasks.filter(task => task.status === 'pending')
  const totalTasks = tasks.length
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const totalHabits = habits.length
  const totalStreak = habits.reduce((sum, habit) => sum + habit.currentStreak, 0)
  const averageStreak = totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0
  const bestOverallStreak = Math.max(...habits.map(h => h.bestStreak), 0)

  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')
  const averageGoalProgress = activeGoals.length > 0 ? 
    Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length) : 0

  // Priority distribution
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length
  const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium').length
  const lowPriorityTasks = tasks.filter(task => task.priority === 'low').length

  // Weekly progress (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTasks = tasks.filter(task => 
      task.completedAt && format(parseISO(task.completedAt), 'yyyy-MM-dd') === dateStr
    ).length
    return {
      date: format(date, 'EEE'),
      tasks: dayTasks
    }
  })

  const maxDailyTasks = Math.max(...last7Days.map(day => day.tasks), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress Analytics</h1>
          <p className="text-gray-600 mt-1">Track your productivity and habit consistency</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Task Completion</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{taskCompletionRate}%</div>
            <p className="text-xs text-blue-600 mt-1">
              {completedTasks.length} of {totalTasks} tasks
            </p>
            <Progress value={taskCompletionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Average Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{averageStreak}</div>
            <p className="text-xs text-orange-600 mt-1">days per habit</p>
            <Progress value={Math.min(100, (averageStreak / 30) * 100)} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Goal Progress</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{averageGoalProgress}%</div>
            <p className="text-xs text-purple-600 mt-1">average completion</p>
            <Progress value={averageGoalProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Best Streak</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{bestOverallStreak}</div>
            <p className="text-xs text-green-600 mt-1">personal record</p>
            <Progress value={Math.min(100, (bestOverallStreak / 50) * 100)} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Task Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-indigo-600" />
              Weekly Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {last7Days.map((day, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 text-sm font-medium text-gray-600">{day.date}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(day.tasks / maxDailyTasks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-6">{day.tasks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-indigo-600" />
              Task Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">High Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{highPriorityTasks}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${totalTasks > 0 ? (highPriorityTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Medium Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{mediumPriorityTasks}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${totalTasks > 0 ? (mediumPriorityTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Low Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{lowPriorityTasks}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${totalTasks > 0 ? (lowPriorityTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-orange-600" />
              Habit Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No habits to analyze</p>
                <p className="text-sm">Start tracking habits to see progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {habits.slice(0, 5).map((habit) => (
                  <div key={habit.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="font-medium text-gray-900 text-sm">{habit.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span className="text-sm font-bold text-orange-600">
                          {habit.currentStreak}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={(habit.currentStreak / Math.max(habit.bestStreak, 7)) * 100} 
                        className="h-2 flex-1"
                      />
                      <span className="text-xs text-gray-500 w-12">
                        {Math.round((habit.currentStreak / Math.max(habit.bestStreak, 7)) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
              Goals Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No goals to track</p>
                <p className="text-sm">Set goals to monitor progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{activeGoals.length}</div>
                    <div className="text-xs text-gray-600">Active</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{averageGoalProgress}%</div>
                    <div className="text-xs text-gray-600">Avg Progress</div>
                  </div>
                </div>
                
                {activeGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">{goal.title}</span>
                      <span className="text-sm font-bold text-purple-600">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{totalTasks}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">{totalHabits}</div>
              <div className="text-sm text-gray-600">Active Habits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{goals.length}</div>
              <div className="text-sm text-gray-600">Total Goals</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{totalStreak}</div>
              <div className="text-sm text-gray-600">Combined Streaks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}