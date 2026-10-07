import { BrowserRouter } from 'react-router-dom'
import { ConfigGate } from '@/components/ConfigGate.tsx'
import { AppRoutes } from '@/routes/router.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <ConfigGate>
        <AppRoutes />
      </ConfigGate>
    </BrowserRouter>
  )
}
