import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const source = resolve('node_modules/@mediapipe/tasks-vision/wasm')
const destination = resolve('public/mediapipe/wasm')

if (!existsSync(source)) {
  throw new Error(`MediaPipe WASM directory was not found: ${source}`)
}

mkdirSync(dirname(destination), { recursive: true })
if (existsSync(destination)) rmSync(destination, { recursive: true, force: true })
cpSync(source, destination, { recursive: true })

console.log('Copied MediaPipe WASM assets into public/mediapipe/wasm')
