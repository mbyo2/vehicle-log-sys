import { AppRoutes } from './routes'
import { Toaster } from '@/components/ui/toaster'
import './App.css'

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  )
}

export default App