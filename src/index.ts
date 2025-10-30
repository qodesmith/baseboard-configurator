import {$, serve} from 'bun'
import process from 'node:process'

import index from './index.html'

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    '/*': index,
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
})

const url = server.url.href
const start =
  process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'start'
      : 'xdg-open'

await $`${{raw: start}} ${{raw: url}}`

// biome-ignore lint/suspicious/noConsole: it's ok
console.log(`🚀 Server running at ${url}`)
