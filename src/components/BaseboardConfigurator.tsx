import type {BaseboardResult} from '@/lib/utils'

import {
  availableBoardLengthsSelector,
  focusedRoomAtom,
  kerfAtom,
  measurementsAtom,
} from '@/lib/globalState'
import {optimizeBaseboards} from '@/lib/utils'

import {useAtomValue} from 'jotai'
import {useEffect, useState} from 'react'

import {BoardLengthsSection} from './BoardLengthsSection'
import {ConfigurationManager} from './ConfigurationManager'
import {Header} from './Header'
import {KerfSection} from './KerfSection'
import {MeasurementsSection} from './MeasurementsSection'
import {ResultsDisplay} from './ResultsDisplay'

export function BaseboardConfigurator() {
  const measurements = useAtomValue(measurementsAtom)
  const availableBoardLengths = useAtomValue(availableBoardLengthsSelector)
  const kerf = useAtomValue(kerfAtom)
  const [results, setResults] = useState<BaseboardResult | null>(null)
  const focusedRoom = useAtomValue(focusedRoomAtom)

  // Auto-calculate whenever inputs change
  useEffect(() => {
    // Filter out measurements with size 0 or empty
    const validMeasurements = measurements.filter(m => m.size > 0)

    if (validMeasurements.length === 0 || availableBoardLengths.length === 0) {
      setResults(null)
      return
    }

    const result = optimizeBaseboards({
      measurements: validMeasurements,
      availableLengths: availableBoardLengths.map(({length}) => length),
      kerf,
    })

    setResults(result)
  }, [availableBoardLengths, kerf, measurements.filter])

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      <Header />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          {/* Configuration Manager */}
          <ConfigurationManager results={results} />

          {/* Measurements Input */}
          <MeasurementsSection />

          {/* Board Lengths Selection */}
          <BoardLengthsSection />

          {/* Kerf Input */}
          <KerfSection />
        </div>

        {/* Right Column - Results */}
        <div>
          <ResultsDisplay results={results} focusedRoom={focusedRoom} />
        </div>
      </div>
    </div>
  )
}
