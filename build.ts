#!/usr/bin/env bun

import {existsSync} from 'node:fs'
import {rm} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import plugin from 'bun-plugin-tailwind'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  process.exit(0)
}

const toCamelCase = (str: string): string =>
  str.replace(/-([a-z])/g, g => g[1].toUpperCase())

const parseValue = (value: string): any => {
  if (value === 'true') return true
  if (value === 'false') return false

  if (/^\d+$/.test(value)) return parseInt(value, 10)
  if (/^\d*\.\d+$/.test(value)) return parseFloat(value)

  if (value.includes(',')) return value.split(',').map(v => v.trim())

  return value
}

function parseArgs(): Partial<Bun.BuildConfig> {
  const config: Partial<Bun.BuildConfig> = {}
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === undefined) continue
    if (!arg.startsWith('--')) continue

    if (arg.startsWith('--no-')) {
      const key = toCamelCase(arg.slice(5))
      config[key] = false
      continue
    }

    if (
      !arg.includes('=') &&
      (i === args.length - 1 || args[i + 1]?.startsWith('--'))
    ) {
      const key = toCamelCase(arg.slice(2))
      config[key] = true
      continue
    }

    let key: string
    let value: string

    if (arg.includes('=')) {
      ;[key, value] = arg.slice(2).split('=', 2) as [string, string]
    } else {
      key = arg.slice(2)
      value = args[++i] ?? ''
    }

    key = toCamelCase(key)

    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.')
      config[parentKey] = config[parentKey] || {}
      config[parentKey][childKey] = parseValue(value)
    } else {
      config[key] = parseValue(value)
    }
  }

  return config
}

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const cliConfig = parseArgs()
const outdir = cliConfig.outdir || path.join(process.cwd(), 'dist')

if (existsSync(outdir)) {
  await rm(outdir, {recursive: true, force: true})
}

const start = performance.now()

const entrypoints = [...new Bun.Glob('**.html').scanSync('src')]
  .map(a => path.resolve('src', a))
  .filter(dir => !dir.includes('node_modules'))

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: true,
  target: 'browser',
  sourcemap: 'linked',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  ...cliConfig,
})

const end = performance.now()

const outputTable = result.outputs.map(output => ({
  File: path.relative(process.cwd(), output.path),
  Type: output.kind,
  Size: formatFileSize(output.size),
}))
const buildTime = (end - start).toFixed(2)
