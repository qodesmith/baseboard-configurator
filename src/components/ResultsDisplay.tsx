import type {BaseboardResult} from '@/lib/utils'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {Package, Ruler, TrendingDown} from 'lucide-react'

interface ResultsDisplayProps {
  results: BaseboardResult | null
  focusedRoom: string | null
}

// Color palette for different cuts
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-cyan-500',
]

export function ResultsDisplay({results, focusedRoom}: ResultsDisplayProps) {
  if (!results) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Cutting Plan</CardTitle>
          <CardDescription>
            Add measurements and select board lengths to see the optimized
            cutting plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Ruler className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No results yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter boards based on focused room
  const filteredBoards = focusedRoom 
    ? results.boards.filter(board => 
        board.cuts.some(cut => cut.room === focusedRoom)
      )
    : results.boards

  // Create a color map for each unique measurement ID
  const colorMap = new Map<string, string>()
  let colorIndex = 0

  filteredBoards.forEach(board => {
    board.cuts.forEach(cut => {
      if (!colorMap.has(cut.id)) {
        const color = COLORS[colorIndex % COLORS.length]
        colorMap.set(cut.id, color || 'bg-gray-500')
        colorIndex++
      }
    })
  })

  // Calculate filtered summary statistics
  const filteredSummary = focusedRoom ? {
    totalBoards: filteredBoards.length,
    totalWaste: filteredBoards.reduce((sum, board) => {
      const usedSpace = board.cuts.reduce((cutSum, cut) => cutSum + cut.size, 0)
      const kerfSpace = board.cuts.length > 1 ? (board.cuts.length - 1) * 0.125 : 0
      return sum + (board.boardLength - usedSpace - kerfSpace)
    }, 0),
    boardCounts: filteredBoards.reduce((counts, board) => {
      counts[board.boardLength] = (counts[board.boardLength] || 0) + 1
      return counts
    }, {} as Record<number, number>)
  } : results.summary

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary{focusedRoom ? ` - ${focusedRoom}` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-primary" />
              <div className="font-bold text-2xl">
                {filteredSummary.totalBoards}
              </div>
              <div className="text-muted-foreground text-xs">Total Boards</div>
            </div>
            <div className="text-center">
              <TrendingDown className="mx-auto mb-2 h-8 w-8 text-orange-500" />
              <div className="font-bold text-2xl">
                {filteredSummary.totalWaste.toFixed(1)}"
              </div>
              <div className="text-muted-foreground text-xs">Total Waste</div>
            </div>
            <div className="text-center">
              <Ruler className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <div className="font-bold text-2xl">
                {filteredSummary.totalBoards > 0 ? (
                  filteredSummary.totalWaste / filteredSummary.totalBoards
                ).toFixed(1) : '0'}
                "
              </div>
              <div className="text-muted-foreground text-xs">
                Avg Waste/Board
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle>Shopping List{focusedRoom ? ` - ${focusedRoom}` : ''}</CardTitle>
          <CardDescription>Boards you need to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(filteredSummary.boardCounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([length, count]) => (
                <div
                  key={length}
                  className="flex items-center justify-between rounded bg-muted p-2"
                >
                  <span className="font-medium">
                    {length}" boards ({(Number(length) / 12).toFixed(1)} ft)
                  </span>
                  <span className="text-muted-foreground">× {count}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Cutting Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Cutting Plan{focusedRoom ? ` - ${focusedRoom}` : ''}</CardTitle>
          <CardDescription>Visual representation of each board</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {filteredBoards.map((board, boardIndex) => {
            const usedSpace = board.cuts.reduce((sum, cut) => sum + cut.size, 0)
            const kerfSpace =
              board.cuts.length > 1 ? (board.cuts.length - 1) * 0.125 : 0
            const wasteSpace = board.boardLength - usedSpace - kerfSpace

            return (
              <div key={boardIndex} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Board {boardIndex + 1} ({board.boardLength}")
                  </span>
                  <span className="text-muted-foreground">
                    Waste: {wasteSpace.toFixed(1)}"
                  </span>
                </div>

                {/* Visual board representation */}
                <div className="relative h-12 overflow-hidden rounded border bg-muted">
                  {board.cuts.map((cut, cutIndex) => {
                    // Calculate position
                    const previousCuts = board.cuts.slice(0, cutIndex)
                    const previousSpace = previousCuts.reduce(
                      (sum, c) => sum + c.size,
                      0
                    )
                    const previousKerfs = cutIndex * 0.125
                    const leftPercent =
                      ((previousSpace + previousKerfs) / board.boardLength) *
                      100
                    const widthPercent = (cut.size / board.boardLength) * 100

                    const label =
                      cut.room && cut.wall
                        ? `${cut.room} - ${cut.wall}`
                        : cut.room || cut.wall || cut.id

                    return (
                      <div
                        key={cutIndex}
                        className={`absolute flex h-full items-center justify-center border-white border-r font-medium text-white text-xs opacity-80 ${colorMap.get(cut.id) || 'bg-gray-500'}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        title={`${label}: ${cut.size}"`}
                      >
                        <span className="truncate px-1">{cut.size}"</span>
                      </div>
                    )
                  })}
                </div>

                {/* Cut details */}
                <div className="pl-2 text-muted-foreground text-xs">
                  {board.cuts.map((cut, idx) => {
                    const label =
                      cut.room && cut.wall
                        ? `${cut.room} - ${cut.wall}`
                        : cut.room || cut.wall || 'Unlabeled'

                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded ${colorMap.get(cut.id) || 'bg-gray-500'}`}
                        />
                        <span>
                          {label}: {cut.size}"
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
