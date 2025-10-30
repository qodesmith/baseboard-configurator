import type {Measurement} from './utils'

import {atom, createStore} from 'jotai'

export const store = createStore()

// Default values
export const DEFAULT_BOARD_LENGTHS = [8, 10, 12].map(feet => feet * 12)
export const DEFAULT_KERF = 1 / 8

// Atoms for application state (not auto-persisted)
export const measurementsAtom = atom<Measurement[]>([
  {id: crypto.randomUUID(), size: 0, room: '', wall: ''},
])

export const availableLengthsAtom = atom<number[]>(DEFAULT_BOARD_LENGTHS)

export const kerfAtom = atom<number>(DEFAULT_KERF)

// TODO - string | undefined instead?
export const currentConfigNameAtom = atom<string | null>(null)

// TODO - string | undefined instead?
export const focusedRoomAtom = atom<string | null>(null)
