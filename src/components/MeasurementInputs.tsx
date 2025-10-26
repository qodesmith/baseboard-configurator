import type {Measurement} from '@/lib/utils'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'

import {Plus, Trash2} from 'lucide-react'

interface MeasurementInputsProps {
  measurements: Measurement[]
  onChange: (measurements: Measurement[]) => void
}

export function MeasurementInputs({
  measurements,
  onChange,
}: MeasurementInputsProps) {
  const addMeasurement = () => {
    onChange([...measurements, {id: crypto.randomUUID(), size: 0}])
  }

  const removeMeasurement = (id: string) => {
    if (measurements.length === 1) {
      // Keep at least one measurement
      return
    }
    onChange(measurements.filter(m => m.id !== id))
  }

  const updateMeasurement = (id: string, size: number) => {
    onChange(measurements.map(m => (m.id === id ? {...m, size} : m)))
  }

  return (
    <div className="space-y-4">
      {measurements.map((measurement, index) => (
        <div key={measurement.id} className="flex items-center gap-2">
          <div className="flex-1">
            <Label
              htmlFor={`measurement-${measurement.id}`}
              className="sr-only"
            >
              Measurement {index + 1}
            </Label>
            <Input
              id={`measurement-${measurement.id}`}
              type="number"
              step="0.25"
              min="0"
              placeholder={`Wall ${index + 1} length (inches)`}
              value={measurement.size || ''}
              onChange={e =>
                updateMeasurement(
                  measurement.id,
                  parseFloat(e.target.value) || 0
                )
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeMeasurement(measurement.id)}
            disabled={measurements.length === 1}
            aria-label="Remove measurement"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addMeasurement}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Measurement
      </Button>
    </div>
  )
}
