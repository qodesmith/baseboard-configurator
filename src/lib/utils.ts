import type {ClassValue} from 'clsx'

import {clsx} from 'clsx'
import {toast} from 'sonner'
import {twMerge} from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate board display name using letter sequence: A, B, C, ..., Z, AA, AB,
 * ..., AZ, BA, BB, etc.
 *
 * @param index Zero-based index of the board
 * @returns Display name like "A", "Z", "AA", "BA", etc.
 */
export function generateBoardName(index: number): string {
  let result = ''
  let num = index

  do {
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26)
  } while (num > 0)

  return result
}

// Baseboard optimization types
export interface Measurement {
  id: string
  size: number
  room?: string
  wall?: string
  splitEvenly?: boolean
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
  displayName?: string
}

export interface BaseboardResult {
  boards: Board[]
  summary: {
    totalBoards: number
    boardCounts: Record<number, number>
    totalWaste: number
  }
}

/**
 * Calculate balanced splits for a measurement that exceeds max board length.
 * Splits the measurement into the minimum number of roughly equal pieces,
 * rounded to 1/16" precision, to avoid large + tiny piece scenarios.
 */
export function calculateBalancedSplits(
  totalSize: number,
  maxBoardLength: number
): number[] {
  const precision = 1 / 16

  // Calculate minimum number of pieces needed
  const numPieces = Math.ceil(totalSize / maxBoardLength)

  // Calculate base size per piece and round to nearest 1/16"
  const baseSize = totalSize / numPieces
  const roundedBaseSize = Math.round(baseSize / precision) * precision

  // Create array with base size
  const pieces = new Array(numPieces).fill(roundedBaseSize)

  // Calculate the difference from the actual total
  const currentTotal = roundedBaseSize * numPieces
  const diff = totalSize - currentTotal

  // Adjust the last piece to make the total exact
  pieces[numPieces - 1] += diff

  return pieces
}

/**
 * Calculate summary statistics for optimized baseboard results including total
 * boards, board counts by length, and total waste.
 */
export function calculateSummaryStats(
  boards: Board[],
  calculateUsed: (cuts: Cut[]) => number
): BaseboardResult['summary'] {
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
    totalBoards,
    boardCounts,
    totalWaste,
  }
}

export function optimizeBaseboards(config: BaseboardConfig): BaseboardResult {
  const {measurements, availableLengths, kerf = 0.125} = config

  if (availableLengths.length === 0) {
    toast.error('No available board lengths provided')
    return {
      boards: [],
      summary: {
        totalBoards: 0,
        boardCounts: {},
        totalWaste: 0,
      },
    }
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
    /**
     * NOTE: This always uses greedy approach - splitEvenly is handled in
     * post-processing
     */
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

      /**
       * Find the best existing board (one with least remaining space after
       * adding this cut)
       */
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

    // Prefer less waste first, then fewer boards as tie-breaker
    if (
      waste < minWaste ||
      (waste === minWaste && boards.length < bestBoards.length)
    ) {
      minWaste = waste
      bestBoards = boards
    }
  }

  // Strategy 2: Try using all available lengths together
  const allLengthsBoards = tryPackingStrategy(sortedLengths)
  const allLengthsWaste = calculateTotalWaste(allLengthsBoards)

  // Prefer less waste first, then fewer boards as tie-breaker
  if (
    allLengthsWaste < minWaste ||
    (allLengthsWaste === minWaste &&
      allLengthsBoards.length < bestBoards.length)
  ) {
    minWaste = allLengthsWaste
    bestBoards = allLengthsBoards
  }

  /**
   * Strategy 3: Try pairs of board sizes (for up to 4 sizes, to keep it
   * performant)
   */
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

        // Prefer less waste first, then fewer boards as tie-breaker
        if (
          waste < minWaste ||
          (waste === minWaste && boards.length < bestBoards.length)
        ) {
          minWaste = waste
          bestBoards = boards
        }
      }
    }
  }

  /**
   * Post-processing: Apply splitEvenly for oversized measurements
   *
   * This ensures splitEvenly only affects the specific measurement, not others
   */
  const maxBoardLength = sortedLengths.at(-1)
  if (maxBoardLength !== undefined) {
    for (const measurement of measurements) {
      if (measurement.splitEvenly && measurement.size > maxBoardLength) {
        /**
         * Remove cuts for this measurement from all boards, keeping other
         * cuts intact
         */
        for (const board of bestBoards) {
          board.cuts = board.cuts.filter(cut => cut.id !== measurement.id)
        }

        // Remove any boards that became empty
        bestBoards = bestBoards.filter(board => board.cuts.length > 0)

        // Calculate balanced splits
        const splits = calculateBalancedSplits(measurement.size, maxBoardLength)

        /**
         * Re-optimize each split piece into the existing solution using
         * bin-packing
         */
        for (const splitSize of splits) {
          const splitCut: Cut = {
            id: measurement.id,
            size: splitSize,
            room: measurement.room,
            wall: measurement.wall,
          }

          // Try to fit this split into an existing board (Best Fit)
          let bestBoardIndex = -1
          let minRemainingSpace = Infinity

          for (let i = 0; i < bestBoards.length; i++) {
            const board = bestBoards[i]

            if (board && canFit(board, splitSize)) {
              const currentUsed = calculateUsed(board.cuts)
              const kerfNeeded = board.cuts.length > 0 ? kerf : 0
              const remainingAfter =
                board.boardLength - (currentUsed + kerfNeeded + splitSize)

              if (remainingAfter < minRemainingSpace) {
                minRemainingSpace = remainingAfter
                bestBoardIndex = i
              }
            }
          }

          // Add to existing board if found
          const bestBoard = bestBoards[bestBoardIndex]
          if (bestBoardIndex !== -1 && bestBoard) {
            bestBoard.cuts.push(splitCut)
          } else {
            // Create new board only if no existing board can fit it
            let bestLength: number | null = null
            let minWaste = Infinity

            for (const length of sortedLengths) {
              if (splitSize <= length) {
                const waste = length - splitSize
                if (waste < minWaste) {
                  minWaste = waste
                  bestLength = length
                }
              }
            }

            if (bestLength) {
              bestBoards.push({
                boardLength: bestLength,
                cuts: [splitCut],
              })
            }
          }
        }
      }
    }
  }

  /**
   * Post-processing: Optimize board sizes by downgrading to smaller lengths
   * when possible
   */
  for (const board of bestBoards) {
    const currentUsed = calculateUsed(board.cuts)

    // Find the smallest available board length that can fit all cuts
    let bestSmallerLength: number | null = null
    for (const length of sortedLengths) {
      if (length < board.boardLength && currentUsed <= length) {
        bestSmallerLength = length
        break // sortedLengths is sorted ascending, so first fit is smallest
      }
    }

    // If we found a smaller board that works, downgrade it
    if (bestSmallerLength) {
      board.boardLength = bestSmallerLength
    }
  }

  // Calculate summary statistics
  const summary = calculateSummaryStats(bestBoards, calculateUsed)

  // Assign display names to boards
  const boardsWithNames = bestBoards.map((board, index) => ({
    ...board,
    displayName: `Board ${generateBoardName(index)}`,
  }))

  return {
    boards: boardsWithNames,
    summary,
  }
}
