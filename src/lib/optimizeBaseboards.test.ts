import type {BaseboardConfig} from './utils'

import {describe, expect, test} from 'bun:test'

import {
  calculateBalancedSplits,
  calculateSummaryStats,
  generateBoardName,
  optimizeBaseboards,
} from './utils'

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

    /**
     * large (90) should go first, then medium (50) and small (20) should fit
     * together.
     *
     * Board 1: large (90) - uses 96" board with 6" waste
     *
     * Board 2: medium (50) + kerf (0.125) + small (20) = 70.125 - uses 96"
     */
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

    /**
     * With optimization, all measurements can fit in 96" boards more
     * efficiently:
     *
     * Board 1: wall1 (100) needs 120" (waste: 20")
     * vs.
     * Board 1: wall1 (100) alone in 120" OR
     *
     * Better: Use 96" boards and pack efficiently
     */
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

    /**
     * 132.25 is oversized (> 120, the next available size), so it may be split.
     *
     * Verify all original measurements are accounted for (may result in
     * multiple cuts)
     */
    const allCuts = result.boards.flatMap(board => board.cuts)

    /**
     * Each measurement ID should be present (oversized ones may appear multiple
     * times)
     */
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

    //
    /**
     * With optimization, should use 2x144" boards:
     * Board 1: 60 + 0.125 + 80 = 140.125 (fits in 144" with 3.875" * waste)
     * Board 2: 60 + 0.125 + 80 = 140.125 (fits in 144" with 3.875" * waste)
     * Total: 2 boards, ~7.75" waste
     *
     * Without optimization, would use 4x96" boards:
     * 4 separate boards with much more waste (~124" total waste)
     */
    expect(result.boards).toHaveLength(2)
    expect(result.summary.boardCounts).toEqual({144: 2})
    expect(result.summary.totalWaste).toBeCloseTo(7.75, 2)

    // Verify each board has two cuts
    expect(result.boards[0]?.cuts).toHaveLength(2)
    expect(result.boards[1]?.cuts).toHaveLength(2)
  })

  test('empty measurements array returns empty result', () => {
    const config: BaseboardConfig = {
      measurements: [],
      availableLengths: [96, 120],
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(0)
    expect(result.summary.totalBoards).toBe(0)
    expect(result.summary.boardCounts).toEqual({})
    expect(result.summary.totalWaste).toBe(0)
  })

  test('empty available lengths returns empty result with error', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'wall1', size: 50}],
      availableLengths: [],
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(0)
    expect(result.summary.totalBoards).toBe(0)
    expect(result.summary.boardCounts).toEqual({})
    expect(result.summary.totalWaste).toBe(0)
  })

  test('room and wall metadata is preserved in cuts', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 50, room: 'Living Room', wall: 'North'},
        {id: 'wall2', size: 40, room: 'Bedroom', wall: 'South'},
      ],
      availableLengths: [96],
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(1)
    const cuts = result.boards[0]?.cuts ?? []
    expect(cuts).toHaveLength(2)

    const wall1Cut = cuts.find(c => c.id === 'wall1')
    const wall2Cut = cuts.find(c => c.id === 'wall2')

    expect(wall1Cut).toEqual({
      id: 'wall1',
      size: 50,
      room: 'Living Room',
      wall: 'North',
    })
    expect(wall2Cut).toEqual({
      id: 'wall2',
      size: 40,
      room: 'Bedroom',
      wall: 'South',
    })
  })

  test('board display names are assigned correctly', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 90},
        {id: 'wall2', size: 85},
        {id: 'wall3', size: 80},
      ],
      availableLengths: [96],
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(3)
    expect(result.boards[0]?.displayName).toBe('Board A')
    expect(result.boards[1]?.displayName).toBe('Board B')
    expect(result.boards[2]?.displayName).toBe('Board C')
  })

  test('board downgrading optimization works', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'wall1', size: 70}],
      availableLengths: [96, 120, 144],
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(1)
    // Should use 96" board instead of larger ones for better efficiency
    expect(result.boards[0]?.boardLength).toBe(96)
    expect(result.summary.boardCounts).toEqual({96: 1})
  })

  test('very small measurements are handled correctly', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'trim1', size: 0.25}, // 1/4 inch
        {id: 'trim2', size: 1.5},
        {id: 'trim3', size: 2.75},
      ],
      availableLengths: [96],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(1)
    const cuts = result.boards[0]?.cuts ?? []
    expect(cuts).toHaveLength(3)

    // Total used: 0.25 + 0.125 + 1.5 + 0.125 + 2.75 = 4.75
    // Waste: 96 - 4.75 = 91.25
    expect(result.summary.totalWaste).toBe(91.25)
  })

  test('zero kerf value works correctly', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 48},
        {id: 'wall2', size: 48},
      ],
      availableLengths: [96],
      kerf: 0,
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(1)
    const cuts = result.boards[0]?.cuts ?? []
    expect(cuts).toHaveLength(2)
    // No kerf: 48 + 48 = 96, perfect fit
    expect(result.summary.totalWaste).toBe(0)
  })

  test('measurements with splitEvenly=true use balanced splitting', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'long-wall', size: 200, splitEvenly: true},
        {id: 'normal-wall', size: 50},
      ],
      availableLengths: [96, 120],
    }

    const result = optimizeBaseboards(config)

    // Should have balanced splits for the 200" measurement
    const longWallCuts = result.boards
      .flatMap(b => b.cuts)
      .filter(c => c.id === 'long-wall')

    expect(longWallCuts.length).toBeGreaterThan(1)

    // Verify splits are more balanced than greedy approach
    const sizes = longWallCuts.map(c => c.size)
    const maxSize = Math.max(...sizes)
    const minSize = Math.min(...sizes)
    // Balanced splits should have smaller difference between pieces
    expect(maxSize - minSize).toBeLessThan(40) // Reasonable balance
  })

  test('measurements without splitEvenly use greedy splitting', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'long-wall', size: 200, splitEvenly: false}],
      availableLengths: [96, 120],
    }

    const result = optimizeBaseboards(config)

    const longWallCuts = result.boards
      .flatMap(b => b.cuts)
      .filter(c => c.id === 'long-wall')

    expect(longWallCuts.length).toBeGreaterThan(1)

    // Should use greedy approach: take largest possible first
    const firstCut = longWallCuts[0]
    expect(firstCut?.size).toBe(120) // Max available length
  })

  test('multiple oversized measurements with different split preferences', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 250, splitEvenly: true},
        {id: 'wall2', size: 200, splitEvenly: false},
        {id: 'wall3', size: 50},
      ],
      availableLengths: [96, 120],
    }

    const result = optimizeBaseboards(config)

    // All measurements should be represented
    const allCuts = result.boards.flatMap(b => b.cuts)
    const uniqueIds = new Set(allCuts.map(c => c.id))
    expect(uniqueIds).toContain('wall1')
    expect(uniqueIds).toContain('wall2')
    expect(uniqueIds).toContain('wall3')

    // wall1 should have balanced splits
    const wall1Cuts = allCuts.filter(c => c.id === 'wall1')
    const wall1Sizes = wall1Cuts.map(c => c.size)
    const wall1MaxSize = Math.max(...wall1Sizes)
    const wall1MinSize = Math.min(...wall1Sizes)
    expect(wall1MaxSize - wall1MinSize).toBeLessThan(40)

    // wall2 should have greedy splits (one large piece)
    const wall2Cuts = allCuts.filter(c => c.id === 'wall2')
    const wall2HasMaxLength = wall2Cuts.some(c => c.size === 120)
    expect(wall2HasMaxLength).toBe(true)
  })

  test('strategy comparison works with different board combinations', () => {
    // Test case where using pairs is better than individual lengths
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 70},
        {id: 'wall2', size: 70},
        {id: 'wall3', size: 110},
        {id: 'wall4', size: 110},
      ],
      availableLengths: [96, 120],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    // Should optimize to minimize waste
    expect(result.summary.totalBoards).toBeLessThanOrEqual(4)
    expect(result.summary.totalWaste).toBeLessThan(100)
  })

  test('edge case: measurement exactly equals board length', () => {
    const config: BaseboardConfig = {
      measurements: [{id: 'exact-fit', size: 96}],
      availableLengths: [96, 120],
    }

    const result = optimizeBaseboards(config)

    expect(result.boards).toHaveLength(1)
    expect(result.boards[0]?.boardLength).toBe(96)
    expect(result.summary.totalWaste).toBe(0)
  })

  test('edge case: measurement with kerf exactly equals board length', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 47.9375}, // 47 15/16"
        {id: 'wall2', size: 47.9375}, // 47 15/16"
      ],
      availableLengths: [96],
      kerf: 0.125, // 1/8"
    }

    const result = optimizeBaseboards(config)

    // 47.9375 + 0.125 + 47.9375 = 96 exactly
    expect(result.boards).toHaveLength(1)
    expect(result.summary.totalWaste).toBe(0)
  })

  test('precision handling for 1/16 inch measurements', () => {
    const config: BaseboardConfig = {
      measurements: [
        {id: 'wall1', size: 48.0625}, // 48 1/16"
        {id: 'wall2', size: 47.9375}, // 47 15/16"
      ],
      availableLengths: [96],
      kerf: 0.125,
    }

    const result = optimizeBaseboards(config)

    // 48.0625 + 0.125 + 47.9375 = 96.125, so needs 2 boards
    expect(result.boards).toHaveLength(2)
    const allCuts = result.boards.flatMap(b => b.cuts)
    expect(allCuts).toHaveLength(2)

    // Verify precise measurements are preserved
    expect(allCuts.some(c => c.size === 48.0625)).toBe(true)
    expect(allCuts.some(c => c.size === 47.9375)).toBe(true)
  })
})

describe('calculateBalancedSplits', () => {
  test('splits measurement into minimum equal pieces', () => {
    const splits = calculateBalancedSplits(200, 120)

    // Should split into 2 pieces: 100 each
    expect(splits).toHaveLength(2)
    expect(splits[0]).toBe(100)
    expect(splits[1]).toBe(100)
    expect(splits.reduce((sum, s) => sum + s, 0)).toBe(200)
  })

  test('handles remainder by adjusting last piece', () => {
    const splits = calculateBalancedSplits(250, 120)

    // Should split into 3 pieces, with remainder in last piece
    expect(splits).toHaveLength(3)
    expect(splits.reduce((sum, s) => sum + s, 0)).toBe(250)

    // Pieces should be relatively balanced
    const maxSize = Math.max(...splits)
    const minSize = Math.min(...splits)
    expect(maxSize - minSize).toBeLessThan(5) // Reasonable balance
  })

  test('rounds to 1/16 inch precision', () => {
    const splits = calculateBalancedSplits(100.1, 60)

    expect(splits).toHaveLength(2)
    expect(splits.reduce((sum, s) => sum + s, 0)).toBe(100.1)

    // Check that the base sizes are rounded to 1/16" precision
    // For 100.1 / 2 = 50.05, rounded to nearest 1/16" = 50.0625
    const baseSize = splits[0]
    expect(baseSize).toBeCloseTo(50.0625, 4) // 50 1/16"
  })

  test('handles exact divisible measurements', () => {
    const splits = calculateBalancedSplits(240, 120)

    expect(splits).toHaveLength(2)
    expect(splits[0]).toBe(120)
    expect(splits[1]).toBe(120)
  })

  test('handles very large measurements', () => {
    const splits = calculateBalancedSplits(1000, 120)

    expect(splits).toHaveLength(9) // ceil(1000/120) = 9
    expect(splits.reduce((sum, s) => sum + s, 0)).toBe(1000)

    // Should be reasonably balanced
    const maxSize = Math.max(...splits)
    const minSize = Math.min(...splits)
    expect(maxSize).toBeLessThanOrEqual(120)
    expect(minSize).toBeGreaterThan(100)
  })
})

describe('generateBoardName', () => {
  test('generates single letter names for first 26 boards', () => {
    expect(generateBoardName(0)).toBe('A')
    expect(generateBoardName(1)).toBe('B')
    expect(generateBoardName(25)).toBe('Z')
  })

  test('generates double letter names after 26 boards', () => {
    expect(generateBoardName(26)).toBe('BA')
    expect(generateBoardName(27)).toBe('BB')
    expect(generateBoardName(51)).toBe('BZ')
    expect(generateBoardName(52)).toBe('CA')
  })

  test('generates triple letter names for very high indices', () => {
    expect(generateBoardName(702)).toBe('BBA')
    expect(generateBoardName(703)).toBe('BBB')
  })

  test('handles edge cases', () => {
    expect(generateBoardName(675)).toBe('ZZ')
    expect(generateBoardName(676)).toBe('BAA')
    expect(generateBoardName(701)).toBe('BAZ')
  })
})

describe('calculateSummaryStats', () => {
  // Helper function to create a calculateUsed function with kerf
  const createCalculateUsed =
    (kerf = 0.125) =>
    (cuts: {size: number}[]) => {
      if (cuts.length === 0) return 0
      const cutsTotal = cuts.reduce((sum, cut) => sum + cut.size, 0)
      const kerfTotal = (cuts.length - 1) * kerf
      return cutsTotal + kerfTotal
    }

  test('calculates stats for empty boards array', () => {
    const calculateUsed = createCalculateUsed()
    const result = calculateSummaryStats([], calculateUsed)

    expect(result.totalBoards).toBe(0)
    expect(result.boardCounts).toEqual({})
    expect(result.totalWaste).toBe(0)
  })

  test('calculates stats for single board with one cut', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [{id: 'cut1', size: 50}],
      },
    ]
    const calculateUsed = createCalculateUsed()
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(1)
    expect(result.boardCounts).toEqual({96: 1})
    expect(result.totalWaste).toBe(46) // 96 - 50 = 46
  })

  test('calculates stats for single board with multiple cuts', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [
          {id: 'cut1', size: 40},
          {id: 'cut2', size: 30},
        ],
      },
    ]
    const calculateUsed = createCalculateUsed(0.125)
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(1)
    expect(result.boardCounts).toEqual({96: 1})
    // Used: 40 + 0.125 + 30 = 70.125, Waste: 96 - 70.125 = 25.875
    expect(result.totalWaste).toBe(25.875)
  })

  test('calculates stats for multiple boards of same length', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [{id: 'cut1', size: 50}],
      },
      {
        boardLength: 96,
        cuts: [{id: 'cut2', size: 60}],
      },
      {
        boardLength: 96,
        cuts: [{id: 'cut3', size: 40}],
      },
    ]
    const calculateUsed = createCalculateUsed()
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(3)
    expect(result.boardCounts).toEqual({96: 3})
    // Waste: (96-50) + (96-60) + (96-40) = 46 + 36 + 56 = 138
    expect(result.totalWaste).toBe(138)
  })

  test('calculates stats for multiple boards of different lengths', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [{id: 'cut1', size: 50}],
      },
      {
        boardLength: 120,
        cuts: [{id: 'cut2', size: 100}],
      },
      {
        boardLength: 144,
        cuts: [{id: 'cut3', size: 130}],
      },
      {
        boardLength: 96,
        cuts: [{id: 'cut4', size: 80}],
      },
    ]
    const calculateUsed = createCalculateUsed()
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(4)
    expect(result.boardCounts).toEqual({96: 2, 120: 1, 144: 1})
    // Waste: (96-50) + (120-100) + (144-130) + (96-80) = 46 + 20 + 14 + 16 = 96
    expect(result.totalWaste).toBe(96)
  })

  test('calculates stats with zero kerf', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [
          {id: 'cut1', size: 48},
          {id: 'cut2', size: 48},
        ],
      },
    ]
    const calculateUsed = createCalculateUsed(0) // No kerf
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(1)
    expect(result.boardCounts).toEqual({96: 1})
    expect(result.totalWaste).toBe(0) // Perfect fit: 48 + 48 = 96
  })

  test('calculates stats with larger kerf value', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [
          {id: 'cut1', size: 40},
          {id: 'cut2', size: 30},
        ],
      },
    ]
    const calculateUsed = createCalculateUsed(0.25) // Larger kerf
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(1)
    expect(result.boardCounts).toEqual({96: 1})
    // Used: 40 + 0.25 + 30 = 70.25, Waste: 96 - 70.25 = 25.75
    expect(result.totalWaste).toBe(25.75)
  })

  test('calculates stats for board with no cuts', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [],
      },
    ]
    const calculateUsed = createCalculateUsed()
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(1)
    expect(result.boardCounts).toEqual({96: 1})
    expect(result.totalWaste).toBe(96) // Entire board is waste
  })

  test('calculates stats for mix of boards with and without cuts', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [{id: 'cut1', size: 50}],
      },
      {
        boardLength: 120,
        cuts: [],
      },
      {
        boardLength: 96,
        cuts: [
          {id: 'cut2', size: 30},
          {id: 'cut3', size: 20},
        ],
      },
    ]
    const calculateUsed = createCalculateUsed(0.125)
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(3)
    expect(result.boardCounts).toEqual({96: 2, 120: 1})
    // Waste: (96-50) + 120 + (96-(30+0.125+20)) = 46 + 120 + 45.875 = 211.875
    expect(result.totalWaste).toBe(211.875)
  })

  test('calculates stats with precise measurements', () => {
    const boards = [
      {
        boardLength: 96,
        cuts: [
          {id: 'cut1', size: 48.0625}, // 48 1/16"
          {id: 'cut2', size: 47.8125}, // 47 13/16"
        ],
      },
    ]
    const calculateUsed = createCalculateUsed(0.125)
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(1)
    expect(result.boardCounts).toEqual({96: 1})
    // Used: 48.0625 + 0.125 + 47.8125 = 96, Waste: 96 - 96 = 0
    expect(result.totalWaste).toBe(0)
  })

  test('calculates stats for large number of boards', () => {
    const boards = Array.from({length: 100}, (_, i) => ({
      boardLength: i % 2 === 0 ? 96 : 120,
      cuts: [{id: `cut${i}`, size: 50}],
    }))
    const calculateUsed = createCalculateUsed()
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(100)
    expect(result.boardCounts).toEqual({96: 50, 120: 50})
    // Waste: 50 boards with (96-50=46) + 50 boards with (120-50=70) = 2300 + 3500 = 5800
    expect(result.totalWaste).toBe(5800)
  })

  test('board counts accumulate correctly for duplicate lengths', () => {
    const boards = [
      {boardLength: 96, cuts: [{id: 'cut1', size: 50}]},
      {boardLength: 120, cuts: [{id: 'cut2', size: 60}]},
      {boardLength: 96, cuts: [{id: 'cut3', size: 70}]},
      {boardLength: 120, cuts: [{id: 'cut4', size: 80}]},
      {boardLength: 96, cuts: [{id: 'cut5', size: 40}]},
      {boardLength: 144, cuts: [{id: 'cut6', size: 100}]},
      {boardLength: 120, cuts: [{id: 'cut7', size: 90}]},
    ]
    const calculateUsed = createCalculateUsed()
    const result = calculateSummaryStats(boards, calculateUsed)

    expect(result.totalBoards).toBe(7)
    expect(result.boardCounts).toEqual({96: 3, 120: 3, 144: 1})
  })
})
