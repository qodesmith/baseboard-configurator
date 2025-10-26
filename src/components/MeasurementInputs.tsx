import type {Measurement} from '@/lib/utils'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'

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
    onChange([
      ...measurements,
      {id: crypto.randomUUID(), size: 0, room: '', wall: ''},
    ])
  }

  const removeMeasurement = (id: string) => {
    if (measurements.length === 1) {
      // Keep at least one measurement
      return
    }
    onChange(measurements.filter(m => m.id !== id))
  }

  const updateMeasurement = (id: string, updates: Partial<Measurement>) => {
    onChange(measurements.map(m => (m.id === id ? {...m, ...updates} : m)))
  }

  // Group measurements by room
  const groupedMeasurements = measurements.reduce(
    (acc, measurement) => {
      const roomName = measurement.room || 'Unlabeled'
      if (!acc[roomName]) {
        acc[roomName] = []
      }
      acc[roomName].push(measurement)
      return acc
    },
    {} as Record<string, Measurement[]>
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedMeasurements).map(
        ([roomName, roomMeasurements]) => (
          <div key={roomName} className="space-y-3">
            {roomName !== 'Unlabeled' && (
              <h3 className="font-semibold text-sm">{roomName}</h3>
            )}
            <div className="space-y-2">
              {roomMeasurements.map(measurement => (
                <div key={measurement.id} className="flex items-center gap-2">
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    <Input
                      type="text"
                      placeholder="Room"
                      value={measurement.room || ''}
                      onChange={e =>
                        updateMeasurement(measurement.id, {
                          room: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Wall"
                      value={measurement.wall || ''}
                      onChange={e =>
                        updateMeasurement(measurement.id, {
                          wall: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="Length"
                      value={measurement.size || ''}
                      onChange={e =>
                        updateMeasurement(measurement.id, {
                          size: parseFloat(e.target.value) || 0,
                        })
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
            </div>
          </div>
        )
      )}

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
