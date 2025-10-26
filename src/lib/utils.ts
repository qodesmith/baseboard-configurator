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

  if (availableLengths.length === 0) {
    throw new Error('No available board lengths provided')
  }

  // Sort available lengths
  const sortedLengths = [...availableLengths].sort((a, b) => a - b)

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

  // Helper: calculate total waste for a set of boards
  const calculateTotalWaste = (boards: Board[]): number => {
    return boards.reduce((total, board) => {
      const used = calculateUsed(board.cuts)
      return total + (board.boardLength - used)
    }, 0)
  }

  // Try packing with a specific set of allowed board lengths
  const tryPackingStrategy = (allowedLengths: number[]): Board[] => {
    const boards: Board[] = []
    const sortedAllowed = [...allowedLengths].sort((a, b) => a - b)
    const maxAllowed = sortedAllowed.at(-1)

    if (maxAllowed === undefined) {
      return []
    }

    // Sort measurements by size (largest first) for Best Fit Decreasing
    const sortedMeasurements = [...measurements].sort((a, b) => b.size - a.size)

    // Helper: find best board to open (minimizes waste)
    const findBestNewBoard = (size: number): number | null => {
      let bestLength: number | null = null
      let minWaste = Infinity

      for (const length of sortedAllowed) {
        if (size <= length) {
          const waste = length - size
          if (waste < minWaste) {
            minWaste = waste
            bestLength = length
          }
        }
      }
      return bestLength
    }

    // Helper: handle oversized measurements that need multiple boards
    const handleOversized = (measurement: Measurement): void => {
      let remaining = measurement.size

      while (remaining > 0) {
        if (remaining <= maxAllowed) {
          // Last piece - use board that minimizes waste
          const boardLength = findBestNewBoard(remaining)
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
            boardLength: maxAllowed,
            cuts: [
              {
                id: measurement.id,
                size: maxAllowed,
                room: measurement.room,
                wall: measurement.wall,
              },
            ],
          })
          remaining -= maxAllowed
        }
      }
    }

    // Main algorithm: Best Fit Decreasing
    for (const measurement of sortedMeasurements) {
      // Handle oversized measurements
      if (measurement.size > maxAllowed) {
        handleOversized(measurement)
        continue
      }

      // Find the best existing board (one with least remaining space after adding this cut)
      let bestBoardIndex = -1
      let minRemainingSpace = Infinity

      for (let i = 0; i < boards.length; i++) {
        const board = boards[i]

        if (board && canFit(board, measurement.size)) {
          const currentUsed = calculateUsed(board.cuts)
          const kerfNeeded = board.cuts.length > 0 ? kerf : 0
          const remainingAfter =
            board.boardLength - (currentUsed + kerfNeeded + measurement.size)

          if (remainingAfter < minRemainingSpace) {
            minRemainingSpace = remainingAfter
            bestBoardIndex = i
          }
        }
      }

      // If we found a suitable board, add the cut to it
      const bestBoard = boards[bestBoardIndex]

      if (bestBoardIndex !== -1 && bestBoard) {
        bestBoard.cuts.push({
          id: measurement.id,
          size: measurement.size,
          room: measurement.room,
          wall: measurement.wall,
        })
      } else {
        // Open a new board with the size that minimizes waste
        const boardLength = findBestNewBoard(measurement.size)
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

    return boards
  }

  // Try different packing strategies and find the best one
  let bestBoards: Board[] = []
  let minWaste = Infinity

  // Strategy 1: Try each individual board size
  for (const length of sortedLengths) {
    const boards = tryPackingStrategy([length])
    const waste = calculateTotalWaste(boards)

    if (waste < minWaste) {
      minWaste = waste
      bestBoards = boards
    }
  }

  // Strategy 2: Try using all available lengths together
  const allLengthsBoards = tryPackingStrategy(sortedLengths)
  const allLengthsWaste = calculateTotalWaste(allLengthsBoards)

  if (allLengthsWaste < minWaste) {
    minWaste = allLengthsWaste
    bestBoards = allLengthsBoards
  }

  // Strategy 3: Try pairs of board sizes (for up to 4 sizes, to keep it performant)
  if (sortedLengths.length <= 4) {
    for (let i = 0; i < sortedLengths.length; i++) {
      for (let j = i + 1; j < sortedLengths.length; j++) {
        const sortedLength1 = sortedLengths[i]
        const sortedLength2 = sortedLengths[j]
        const boards =
          sortedLength1 !== undefined && sortedLength2 !== undefined
            ? tryPackingStrategy([sortedLength1, sortedLength2])
            : []
        const waste = calculateTotalWaste(boards)

        if (waste < minWaste) {
          minWaste = waste
          bestBoards = boards
        }
      }
    }
  }

  // Calculate summary statistics
  const totalBoards = bestBoards.length
  const boardCounts: Record<number, number> = {}
  let totalWaste = 0

  for (const board of bestBoards) {
    // Count boards by length
    boardCounts[board.boardLength] = (boardCounts[board.boardLength] || 0) + 1

    // Calculate waste
    const used = calculateUsed(board.cuts)
    const waste = board.boardLength - used
    totalWaste += waste
  }

  return {
    boards: bestBoards,
    summary: {
      totalBoards,
      boardCounts,
      totalWaste,
    },
  }
}
