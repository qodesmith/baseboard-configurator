import type {Measurement} from './utils'

import {atom, createStore} from 'jotai'
import {atomWithReset, splitAtom} from 'jotai/utils'

export const store = createStore()

const initialMeasurements: Measurement[] = [
  {id: crypto.randomUUID(), size: 0, room: '', wall: ''},
]

export const measurementsAtom = atomWithReset(initialMeasurements)

const initialBoardLengths = [
  {length: 96, enabled: true}, // 8'
  {length: 120, enabled: true}, // 10'
  {length: 144, enabled: true}, // 12'
]

export type BoardLengthItem = (typeof initialBoardLengths)[number]

export const boardLengthsAtom = atomWithReset(initialBoardLengths)
export const boardLengthsAtomsAtom = splitAtom(boardLengthsAtom)
export const availableBoardLengthsSelector = atom(get => {
  const boardLengths = get(boardLengthsAtom)
  return boardLengths.filter(({enabled}) => enabled)
})

export const kerfAtom = atomWithReset<number>(1 / 8)

export const currentConfigNameAtom = atom<string | null>(null)

export const focusedRoomAtom = atom<string | null>(null)
