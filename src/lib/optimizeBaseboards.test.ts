import type {BaseboardConfig} from './utils'

import {describe, expect, test} from 'bun:test'

import {optimizeBaseboards} from './utils'

describe('optimizeBaseboards', () => {
  test('single measurement fits in smallest available board', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'wall1', size: 50}],
      availableLengths: [96, 120, 144],
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(1)
    const board0 = result.boards[0]
    expect(board0).toBeDefined()
    expect(board0?.boardLength).toBe(96)
    expect(board0?.cuts).toEqual([{id: 'wall1', size: 50}])
    expect(result.summary.totalBoards).toBe(1)
    expect(result.summary.boardCounts).toEqual({96: 1})
  })

  test('multiple measurements fit on one board', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 40},
        {id: 'wall2', size: 30},
      ],
      availableLengths: [96],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(1)
    const board0 = result.boards[0]
    expect(board0).toBeDefined()
    expect(board0?.cuts).toHaveLength(2)
    // Should have both cuts: 40 + 0.125 (kerf) + 30 = 70.125 total
    expect(result.summary.totalBoards).toBe(1)
  })

  test('multiple measurements require multiple boards', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 90},
        {id: 'wall2', size: 85},
      ],
      availableLengths: [96],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    // Each measurement needs its own board (90 + 0.125 + 85 = 175.125 > 96)
    expect(result.boards).toHaveLength(2)
    expect(result.summary.totalBoards).toBe(2)
    expect(result.summary.boardCounts).toEqual({96: 2})
  })

  test('oversized measurement splits across multiple boards', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'long-wall', size: 200}],
      availableLengths: [96, 120],
    }

    const result = optimizeBaseboards(config)

    // Should split: 120 + 80 (on a 96 board)
    expect(result.boards).toHaveLength(2)
    const board0 = result.boards[0]
    const board1 = result.boards[1]
    expect(board0).toBeDefined()
    expect(board1).toBeDefined()
    expect(board0?.boardLength).toBe(120)
    expect(board0?.cuts[0]).toEqual({id: 'long-wall', size: 120})
    expect(board1?.boardLength).toBe(96)
    expect(board1?.cuts[0]).toEqual({id: 'long-wall', size: 80})
  })

  test('First Fit Decreasing: largest measurements processed first', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'small', size: 20},
        {id: 'large', size: 90},
        {id: 'medium', size: 50},
      ],
      availableLengths: [96, 120],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    // large (90) should go first, then medium (50) and small (20) should fit together
    // Board 1: large (90) - uses 96" board with 6" waste
    // Board 2: medium (50) + kerf (0.125) + small (20) = 70.125 - uses 96" board
    expect(result.boards).toHaveLength(2)

    // First board should have the largest measurement
    const board0 = result.boards[0]
    const board1 = result.boards[1]
    expect(board0).toBeDefined()
    expect(board1).toBeDefined()
    expect(board0?.cuts[0]?.id).toBe('large')

    // Second board should have medium and small
    expect(board1?.cuts).toHaveLength(2)
    const ids = board1?.cuts.map(cut => cut.id) ?? []
    expect(ids).toContain('medium')
    expect(ids).toContain('small')
  })

  test('custom kerf value is applied', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 48},
        {id: 'wall2', size: 48},
      ],
      availableLengths: [96],
      kerf: 0.25, // larger kerf
    }

    const result = optimizeBaseboards(config)

    // 48 + 0.25 + 48 = 96.25 - won't fit, needs 2 boards
    expect(result.boards).toHaveLength(2)
  })

  test('waste calculation is accurate', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'wall1', size: 50}],
      availableLengths: [96],
      kerf: 0,
    }

    const result = optimizeBaseboards(config)

    // 96 - 50 = 46 inches of waste
    expect(result.summary.totalWaste).toBe(46)
  })

  test('waste calculation includes kerf', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 40},
        {id: 'wall2', size: 30},
      ],
      availableLengths: [96],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    // Used: 40 + 0.125 + 30 = 70.125
    // Waste: 96 - 70.125 = 25.875
    expect(result.summary.totalWaste).toBe(25.875)
  })

  test('board counts summary is accurate', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 100},
        {id: 'wall2', size: 80},
        {id: 'wall3', size: 60},
      ],
      availableLengths: [96, 120],
    }

    const result = optimizeBaseboards(config)

    // With optimization, all measurements can fit in 96" boards more efficiently:
    // Board 1: wall1 (100) needs 120" (waste: 20")
    // vs.
    // Board 1: wall1 (100) alone in 120" OR
    // Better: Use 96" boards and pack efficiently
    expect(result.summary.totalBoards).toBe(3)
    // The optimizer should choose the configuration with least waste
    const totalBoardsUsed = Object.values(result.summary.boardCounts).reduce(
      (sum, count) => sum + count,
      0
    )
    expect(totalBoardsUsed).toBe(3)
  })

  test('complex real-world scenario', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'living room wall 1', size: 132.25},
        {id: 'living room wall 2', size: 98.5},
        {id: 'bedroom wall 1', size: 110},
        {id: 'bedroom wall 2', size: 87.75},
        {id: 'hallway', size: 45.5},
        {id: 'closet', size: 24},
      ],
      availableLengths: [96, 120, 144],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    // 132.25 is oversized (> 120, the next available size), so it may be split
    // Verify all original measurements are accounted for (may result in multiple cuts)
    const allCuts = result.boards.flatMap(board => board.cuts)

    // Each measurement ID should be present (oversized ones may appear multiple times)
    const uniqueIds = new Set(allCuts.map(cut => cut.id))
    expect(uniqueIds).toContain('bedroom wall 1')
    expect(uniqueIds).toContain('bedroom wall 2')
    expect(uniqueIds).toContain('closet')
    expect(uniqueIds).toContain('hallway')
    expect(uniqueIds).toContain('living room wall 1')
    expect(uniqueIds).toContain('living room wall 2')

    // Verify total boards is reasonable (should be optimized)
    expect(result.summary.totalBoards).toBeLessThanOrEqual(6)
  })

  test('very large measurement requires multiple max-length boards', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'extremely-long-wall', size: 350}],
      availableLengths: [96, 120, 144],
    }

    const result = optimizeBaseboards(config)

    // Algorithm will choose the board size that minimizes waste
    // 144" boards: 144 + 144 + 62 = 350 (waste: 144-62 = 82")
    // 120" boards: 120 + 120 + 110 = 350 (waste: 120-110 = 10")
    // So 120" is optimal!
    expect(result.boards).toHaveLength(3)

    // All cuts should have the same ID
    const uniqueIds = new Set(result.boards.flatMap(b => b.cuts.map(c => c.id)))
    expect(uniqueIds.size).toBe(1)
    expect(uniqueIds.has('extremely-long-wall')).toBe(true)

    // Should use 120" boards for better optimization
    expect(result.summary.boardCounts).toEqual({120: 3})
    expect(result.summary.totalWaste).toBe(10) // 120 - 110 = 10
  })

  test('optimization chooses larger boards when they minimize waste', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 60},
        {id: 'wall2', size: 60},
        {id: 'wall3', size: 80},
        {id: 'wall4', size: 80},
      ],
      availableLengths: [96, 120, 144],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    // With optimization, should use 2x144" boards:
    // Board 1: 60 + 0.125 + 80 = 140.125 (fits in 144" with 3.875" waste)
    // Board 2: 60 + 0.125 + 80 = 140.125 (fits in 144" with 3.875" waste)
    // Total: 2 boards, ~7.75" waste
    //
    // Without optimization, would use 4x96" boards:
    // 4 separate boards with much more waste (~124" total waste)

    expect(result.boards).toHaveLength(2)
    expect(result.summary.boardCounts).toEqual({144: 2})
    expect(result.summary.totalWaste).toBeCloseTo(7.75, 2)

    // Verify each board has two cuts
    expect(result.boards[0]?.cuts).toHaveLength(2)
    expect(result.boards[1]?.cuts).toHaveLength(2)
  })
})
