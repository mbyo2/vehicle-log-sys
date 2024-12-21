import { AppRoutes } from './routes'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'
import './App.css'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen transition-theme">
        <AppRoutes />
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App