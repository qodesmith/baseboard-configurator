import {BaseboardConfigurator} from './components/BaseboardConfigurator'
import {Toaster} from './components/ui/sonner'
import {useSystemTheme} from './hooks/useSystemTheme'
import './index.css'

export function App() {
  useSystemTheme()

  return (
    <>
      <BaseboardConfigurator />
      <Toaster />
    </>
  )
}
