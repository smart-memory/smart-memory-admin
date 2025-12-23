import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "sonner"
import { AuthProvider } from '@/context/AuthContext'
import { ErrorBoundary } from '@/lib/errorTracking'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Pages />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
