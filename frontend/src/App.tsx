import { BrowserRouter } from 'react-router-dom'
import { ConfigGate } from '@/shared/ConfigGate.tsx'
import { AppRoutes } from '@/routes.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <ConfigGate>
        <AppRoutes />
      </ConfigGate>
    </BrowserRouter>
  )
}
