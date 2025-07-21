import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckSquare,
  AlertCircle,
  Filter
} from 'lucide-react'
import blink from '@/blink/client'
import { Task } from '@/types'
import { format, parseISO, isToday, isPast } from 'date-fns'
import toast from 'react-hot-toast'

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadTasks = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const tasksData = await blink.db.tasks.list({ 
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setTasks(tasksData)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadTasks()
    }
  }, [user?.id, loadTasks])

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await blink.db.tasks.update(taskId, {
        status: completed ? 'completed' : 'pending',
        completedAt: completed ? new Date().toISOString() : null
      })
      
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: completed ? 'completed' : 'pending', completedAt: completed ? new Date().toISOString() : undefined }
          : task
      ))
      
      if (completed) {
        toast.success('🎉 Task completed! Great job!')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const addSampleTask = async () => {
    if (!user?.id) return
    
    const sampleTasks = [
      { title: 'Review project proposal', priority: 'high', dueDate: new Date().toISOString() },
      { title: 'Call dentist for appointment', priority: 'medium', dueDate: new Date(Date.now() + 86400000).toISOString() },
      { title: 'Buy groceries', priority: 'low', dueDate: new Date().toISOString() },
      { title: 'Finish quarterly report', priority: 'high', dueDate: new Date(Date.now() + 172800000).toISOString() },
    ]
    
    const randomTask = sampleTasks[Math.floor(Math.random() * sampleTasks.length)]
    
    try {
      const newTask = await blink.db.tasks.create({
        id: `task_${Date.now()}`,
        userId: user.id,
        title: randomTask.title,
        priority: randomTask.priority as 'high' | 'medium' | 'low',
        status: 'pending',
        dueDate: randomTask.dueDate,
        createdAt: new Date().toISOString(),
        isRecurring: false
      })
      
      setTasks(prev => [newTask, ...prev])
      toast.success('Task added successfully!')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
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
          <p className="text-gray-600 mt-2">Sign in to manage your tasks</p>
        </div>
        <Button onClick={() => blink.auth.login()}>
          Sign In
        </Button>
      </div>
    )
  }

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'today':
        return task.dueDate && isToday(parseISO(task.dueDate)) && task.status === 'pending'
      case 'overdue':
        return task.dueDate && isPast(parseISO(task.dueDate)) && task.status === 'pending'
      case 'completed':
        return task.status === 'completed'
      default:
        return true
    }
  })

  const todayCount = tasks.filter(task => 
    task.dueDate && isToday(parseISO(task.dueDate)) && task.status === 'pending'
  ).length

  const overdueCount = tasks.filter(task => 
    task.dueDate && isPast(parseISO(task.dueDate)) && task.status === 'pending'
  ).length

  const completedCount = tasks.filter(task => task.status === 'completed').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Organize and prioritize your daily tasks</p>
        </div>
        <Button onClick={addSampleTask} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Sample Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-700">Today</p>
                <p className="text-2xl font-bold text-blue-900">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-700">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-2xl font-bold text-green-900">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700">Total</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'today', label: 'Today' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'completed', label: 'Completed' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key as any)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Tasks' : 
             filter === 'today' ? 'Today\'s Tasks' :
             filter === 'overdue' ? 'Overdue Tasks' : 'Completed Tasks'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">
                {filter === 'all' ? 'Add your first task to get started!' :
                 filter === 'today' ? 'No tasks scheduled for today' :
                 filter === 'overdue' ? 'Great! No overdue tasks' : 'No completed tasks yet'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-center space-x-4 p-4 border rounded-lg transition-all ${
                  task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                
                <div className={`w-3 h-3 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(parseISO(task.dueDate), 'MMM dd, yyyy')}
                      {isToday(parseISO(task.dueDate)) && (
                        <Badge variant="outline" className="ml-2 text-xs">Today</Badge>
                      )}
                      {isPast(parseISO(task.dueDate)) && task.status === 'pending' && (
                        <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>
                      )}
                    </div>
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
    </div>
  )
}