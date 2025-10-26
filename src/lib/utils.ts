import type {ClassValue} from 'clsx'

import {clsx} from 'clsx'
import {twMerge} from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Baseboard optimization types
export interface Measurement {
  id: string
  size: number
  room?: string
  wall?: string
}

export interface BaseboardConfig {
  measurements: Measurement[]
  availableLengths: number[]
  kerf?: number
}

export interface Cut {
  id: string
  size: number
  room?: string
  wall?: string
}

export interface Board {
  boardLength: number
  cuts: Cut[]
}

export interface BaseboardResult {
  boards: Board[]
  summary: {
    totalBoards: number
    boardCounts: Record<number, number>
    totalWaste: number
  }
}

export function optimizeBaseboards(config: BaseboardConfig): BaseboardResult {
  const {measurements, availableLengths, kerf = 0.125} = config
  const boards: Board[] = []

  // Sort available lengths for easy access to max
  const sortedLengths = [...availableLengths].sort((a, b) => a - b)
  const maxBoardLength = sortedLengths.at(-1)

  if (maxBoardLength === undefined) {
    throw new Error('maxBoardLength is undefined')
  }

  // Sort measurements by size (largest first) for First Fit Decreasing
  const sortedMeasurements = [...measurements].sort((a, b) => b.size - a.size)

  // Helper: calculate used space on a board
  const calculateUsed = (cuts: Cut[]): number => {
    if (cuts.length === 0) return 0
    const cutsTotal = cuts.reduce((sum, cut) => sum + cut.size, 0)
    const kerfTotal = (cuts.length - 1) * kerf
    return cutsTotal + kerfTotal
  }

  // Helper: check if a cut fits in a board
  const canFit = (board: Board, cutSize: number): boolean => {
    const currentUsed = calculateUsed(board.cuts)
    const kerfNeeded = board.cuts.length > 0 ? kerf : 0
    return currentUsed + kerfNeeded + cutSize <= board.boardLength
  }

  // Helper: find smallest available board that fits a size
  const findSmallestFit = (size: number): number | null => {
    for (const length of sortedLengths) {
      if (size <= length) return length
    }
    return null
  }

  // Helper: handle oversized measurements that need multiple boards
  const handleOversized = (measurement: Measurement): void => {
    let remaining = measurement.size

    while (remaining > 0) {
      // Try to use the largest board
      if (remaining <= maxBoardLength) {
        // Last piece - use smallest that fits
        const boardLength = findSmallestFit(remaining)
        if (boardLength) {
          boards.push({
            boardLength,
            cuts: [
              {
                id: measurement.id,
                size: remaining,
                room: measurement.room,
                wall: measurement.wall,
              },
            ],
          })
        }
        remaining = 0
      } else {
        // Cut a full board's worth
        boards.push({
          boardLength: maxBoardLength,
          cuts: [
            {
              id: measurement.id,
              size: maxBoardLength,
              room: measurement.room,
              wall: measurement.wall,
            },
          ],
        })
        remaining -= maxBoardLength
      }
    }
  }

  // Main algorithm: First Fit Decreasing
  for (const measurement of sortedMeasurements) {
    // Handle oversized measurements
    if (measurement.size > maxBoardLength) {
      handleOversized(measurement)
      continue
    }

    // Try to fit in an existing board
    let fitted = false
    for (const board of boards) {
      if (canFit(board, measurement.size)) {
        board.cuts.push({
          id: measurement.id,
          size: measurement.size,
          room: measurement.room,
          wall: measurement.wall,
        })
        fitted = true
        break
      }
    }

    // If doesn't fit anywhere, open a new board (smallest that fits)
    if (!fitted) {
      const boardLength = findSmallestFit(measurement.size)
      if (boardLength) {
        boards.push({
          boardLength,
          cuts: [
            {
              id: measurement.id,
              size: measurement.size,
              room: measurement.room,
              wall: measurement.wall,
            },
          ],
        })
      }
    }
  }

  // Calculate summary statistics
  const totalBoards = boards.length
  const boardCounts: Record<number, number> = {}
  let totalWaste = 0

  for (const board of boards) {
    // Count boards by length
    boardCounts[board.boardLength] = (boardCounts[board.boardLength] || 0) + 1

    // Calculate waste
    const used = calculateUsed(board.cuts)
    const waste = board.boardLength - used
    totalWaste += waste
  }

  return {
    boards,
    summary: {
      totalBoards,
      boardCounts,
      totalWaste,
    },
  }
}
