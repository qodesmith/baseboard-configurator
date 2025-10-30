import type {BaseboardResult} from '@/lib/utils'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  availableLengthsAtom,
  focusedRoomAtom,
  kerfAtom,
  measurementsAtom,
} from '@/lib/globalState'
import {optimizeBaseboards} from '@/lib/utils'

import {useAtom, useAtomValue} from 'jotai'
import {useEffect, useId, useState} from 'react'

import {BoardLengthSelector} from './BoardLengthSelector'
import {ConfigurationManager} from './ConfigurationManager'
import {Header} from './Header'
import {MeasurementsSection} from './MeasurementsSection'
import {ResultsDisplay} from './ResultsDisplay'

export function BaseboardConfigurator() {
  const kerfId = useId()
  const measurements = useAtomValue(measurementsAtom)
  const [availableLengths, setAvailableLengths] = useAtom(availableLengthsAtom)
  const [kerf, setKerf] = useAtom(kerfAtom)
  const [results, setResults] = useState<BaseboardResult | null>(null)
  const focusedRoom = useAtomValue(focusedRoomAtom)

  // Auto-calculate whenever inputs change
  useEffect(() => {
    // Filter out measurements with size 0 or empty
    const validMeasurements = measurements.filter(m => m.size > 0)

    if (validMeasurements.length === 0 || availableLengths.length === 0) {
      setResults(null)
      return
    }

    const result = optimizeBaseboards({
      measurements: validMeasurements,
      availableLengths,
      kerf,
    })

    setResults(result)
  }, [measurements, availableLengths, kerf])

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
          <Card>
            <CardHeader>
              <CardTitle>Available Board Lengths</CardTitle>
              <CardDescription>
                Select which board lengths are available (inches)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BoardLengthSelector
                selectedLengths={availableLengths}
                onChange={setAvailableLengths}
              />
            </CardContent>
          </Card>

          {/* Kerf Input */}
          <Card>
            <CardHeader>
              <CardTitle>Saw Kerf</CardTitle>
              <CardDescription>
                Width of your saw blade cut (inches)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor={kerfId} className="min-w-fit">
                  Kerf:
                </Label>
                <Input
                  id={kerfId}
                  type="number"
                  step="0.001"
                  min="0"
                  value={kerf}
                  onChange={e => setKerf(parseFloat(e.target.value) || 0)}
                  className="max-w-32"
                />
                <span className="text-muted-foreground text-sm">inches</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div>
          <ResultsDisplay results={results} focusedRoom={focusedRoom} />
        </div>
      </div>
    </div>
  )
}
