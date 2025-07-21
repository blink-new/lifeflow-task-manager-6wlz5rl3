import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { TasksView } from '@/components/tasks/TasksView'
import { HabitsView } from '@/components/habits/HabitsView'
import { ProgressView } from '@/components/progress/ProgressView'
import { Toaster } from 'react-hot-toast'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'tasks':
        return <TasksView />
      case 'habits':
        return <HabitsView />
      case 'progress':
        return <ProgressView />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 lg:ml-64">
          <div className="min-h-screen">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App