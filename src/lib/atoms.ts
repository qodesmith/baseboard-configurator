import type {Measurement} from './utils'

import {atom} from 'jotai'

// Default values
export const DEFAULT_BOARD_LENGTHS = [96, 120, 144]
export const DEFAULT_KERF = 0.125

// Atoms for application state (not auto-persisted)
export const measurementsAtom = atom<Measurement[]>([
  {id: crypto.randomUUID(), size: 0, room: '', wall: ''},
])

export const availableLengthsAtom = atom<number[]>(DEFAULT_BOARD_LENGTHS)

export const kerfAtom = atom<number>(DEFAULT_KERF)
