import {BaseboardConfigurator} from './components/BaseboardConfigurator'
import {useSystemTheme} from './hooks/useSystemTheme'
import './index.css'

export function App() {
  useSystemTheme()
  return <BaseboardConfigurator />
}
