import {Provider as JotaiProvider} from 'jotai'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import {App} from './App'
import {store} from './lib/atoms'

const elem = document.getElementById('root')

if (!elem) {
  throw new Error('No root element found!')
}

// Apply dark mode immediately based on system preference to prevent flash
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark')
}

const app = (
  <StrictMode>
    <JotaiProvider store={store}>
      <App />
    </JotaiProvider>
  </StrictMode>
)

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  // biome-ignore lint/suspicious/noAssignInExpressions: original Bun code
  const root = (import.meta.hot.data.root ??= createRoot(elem))
  root.render(app)
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app)
}
