import type {BaseboardResult, Measurement} from '@/lib/utils'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {optimizeBaseboards} from '@/lib/utils'

import {useEffect, useId, useState} from 'react'

import {BoardLengthSelector} from './BoardLengthSelector'
import {MeasurementInputs} from './MeasurementInputs'
import {ResultsDisplay} from './ResultsDisplay'

const DEFAULT_BOARD_LENGTHS = [96, 120, 144]
const DEFAULT_KERF = 0.125

export function BaseboardConfigurator() {
  const kerfId = useId()
  const [measurements, setMeasurements] = useState<Measurement[]>([
    {id: crypto.randomUUID(), size: 0},
  ])
  const [availableLengths, setAvailableLengths] = useState<number[]>(
    DEFAULT_BOARD_LENGTHS
  )
  const [kerf, setKerf] = useState(DEFAULT_KERF)
  const [results, setResults] = useState<BaseboardResult | null>(null)

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
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-4xl">Baseboard Configurator</h1>
        <p className="text-muted-foreground">
          Optimize your baseboard cuts and minimize waste
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          {/* Measurements Input */}
          <Card>
            <CardHeader>
              <CardTitle>Measurements</CardTitle>
              <CardDescription>
                Add your wall measurements in inches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeasurementInputs
                measurements={measurements}
                onChange={setMeasurements}
              />
            </CardContent>
          </Card>

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
          <ResultsDisplay results={results} />
        </div>
      </div>
    </div>
  )
}
