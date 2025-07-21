import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react'
import blink from '@/blink/client'
import { Goal } from '@/types'
import { format, parseISO, isFuture, isPast } from 'date-fns'
import toast from 'react-hot-toast'

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadGoals = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const goalsData = await blink.db.goals.list({ 
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setGoals(goalsData)
    } catch (error) {
      console.error('Error loading goals:', error)
      toast.error('Failed to load goals')
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadGoals()
    }
  }, [user?.id, loadGoals])

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    try {
      const updateData: any = { progress: newProgress }
      
      if (newProgress >= 100) {
        updateData.status = 'completed'
        updateData.completedAt = new Date().toISOString()
      }
      
      await blink.db.goals.update(goalId, updateData)
      
      // Optimistic update
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, progress: newProgress, status: newProgress >= 100 ? 'completed' : goal.status, completedAt: newProgress >= 100 ? new Date().toISOString() : goal.completedAt }
          : goal
      ))
      
      if (newProgress >= 100) {
        toast.success('🎉 Goal completed! Congratulations!')
      } else {
        toast.success('Progress updated!')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal')
    }
  }

  const addSampleGoal = async () => {
    if (!user?.id) return
    
    const sampleGoals = [
      { 
        title: 'Learn a new programming language', 
        description: 'Master TypeScript fundamentals',
        progress: 25,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Learning'
      },
      { 
        title: 'Run a 5K marathon', 
        description: 'Complete a 5K run without stopping',
        progress: 40,
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Fitness'
      },
      { 
        title: 'Read 12 books this year', 
        description: 'Read one book per month',
        progress: 33,
        targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Personal'
      },
      { 
        title: 'Save $5000 for vacation', 
        description: 'Build emergency fund for travel',
        progress: 60,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Financial'
      },
    ]
    
    const randomGoal = sampleGoals[Math.floor(Math.random() * sampleGoals.length)]
    
    try {
      const newGoal = await blink.db.goals.create({
        id: `goal_${Date.now()}`,
        userId: user.id,
        title: randomGoal.title,
        description: randomGoal.description,
        progress: randomGoal.progress,
        status: 'active',
        targetDate: randomGoal.targetDate,
        category: randomGoal.category,
        createdAt: new Date().toISOString()
      })
      
      setGoals(prev => [newGoal, ...prev])
      toast.success('Goal added successfully!')
    } catch (error) {
      console.error('Error adding goal:', error)
      toast.error('Failed to add goal')
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
          <p className="text-gray-600 mt-2">Sign in to track your goals</p>
        </div>
        <Button onClick={() => blink.auth.login()}>
          Sign In
        </Button>
      </div>
    )
  }

  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')
  const averageProgress = goals.length > 0 ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-600 mt-1">Set and achieve your long-term objectives</p>
        </div>
        <Button onClick={addSampleGoal} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Sample Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-700">Active Goals</p>
                <p className="text-3xl font-bold text-blue-900">{activeGoals.length}</p>
                <p className="text-xs text-blue-600">In progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-3xl font-bold text-green-900">{completedGoals.length}</p>
                <p className="text-xs text-green-600">Achieved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-700">Avg Progress</p>
                <p className="text-3xl font-bold text-purple-900">{averageProgress}%</p>
                <p className="text-xs text-purple-600">Overall</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Target className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-600 mb-4">Set your first goal to start achieving your dreams</p>
              <Button onClick={addSampleGoal} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{goal.title}</CardTitle>
                    {goal.description && (
                      <p className="text-gray-600 text-sm">{goal.description}</p>
                    )}
                  </div>
                  <Badge variant={
                    goal.status === 'completed' ? 'default' :
                    goal.status === 'paused' ? 'secondary' : 'outline'
                  }>
                    {goal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-2xl font-bold text-indigo-600">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-3" />
                </div>

                {/* Category */}
                {goal.category && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category</span>
                    <Badge variant="outline">{goal.category}</Badge>
                  </div>
                )}

                {/* Target Date */}
                {goal.targetDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Target Date</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span className={
                        goal.status === 'completed' ? 'text-green-600' :
                        isPast(parseISO(goal.targetDate)) ? 'text-red-600' :
                        'text-gray-900'
                      }>
                        {format(parseISO(goal.targetDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {goal.status === 'active' && (
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progress + 10))}
                      className="flex-1"
                    >
                      +10%
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progress + 25))}
                      className="flex-1"
                    >
                      +25%
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateGoalProgress(goal.id, 100)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Complete
                    </Button>
                  </div>
                )}

                {/* Completion Badge */}
                {goal.status === 'completed' && goal.completedAt && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Completed on {format(parseISO(goal.completedAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" />
              Quick Progress Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.slice(0, 4).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={goal.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-indigo-600">{goal.progress}%</span>
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progress + 10))}
                    >
                      +10%
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}