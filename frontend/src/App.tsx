import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes/router.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
