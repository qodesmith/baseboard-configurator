import type {Measurement} from '@/lib/utils'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'

import {Home, Plus, Trash2} from 'lucide-react'
import {useState} from 'react'

interface MeasurementInputsProps {
  measurements: Measurement[]
  onChange: (measurements: Measurement[]) => void
}

export function MeasurementInputs({
  measurements,
  onChange,
}: MeasurementInputsProps) {
  // Track which room names are being edited
  const [editingRoomName, setEditingRoomName] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')

  // Group measurements by room
  const groupedMeasurements = measurements.reduce(
    (acc, measurement) => {
      const roomName = measurement.room || ''
      if (!acc[roomName]) {
        acc[roomName] = []
      }
      acc[roomName].push(measurement)
      return acc
    },
    {} as Record<string, Measurement[]>
  )

  const addRoom = () => {
    // Add a new room with one empty measurement
    onChange([
      ...measurements,
      {id: crypto.randomUUID(), size: 0, room: '', wall: ''},
    ])
  }

  const addMeasurementToRoom = (roomName: string) => {
    onChange([
      ...measurements,
      {id: crypto.randomUUID(), size: 0, room: roomName, wall: ''},
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

  const updateRoomName = (oldName: string, newName: string) => {
    onChange(
      measurements.map(m => (m.room === oldName ? {...m, room: newName} : m))
    )
    setEditingRoomName(null)
    setNewRoomName('')
  }

  const removeRoom = (roomName: string) => {
    const roomMeasurements = groupedMeasurements[roomName] || []
    if (measurements.length === roomMeasurements.length) {
      // Don't remove the last room
      return
    }
    onChange(measurements.filter(m => m.room !== roomName))
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedMeasurements).map(
        ([roomName, roomMeasurements]) => (
          <div
            key={roomName || 'unnamed'}
            className="space-y-3 rounded-lg border p-4"
          >
            {/* Room Header */}
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              {editingRoomName === roomName ? (
                <Input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  onBlur={() => {
                    if (newRoomName.trim()) {
                      updateRoomName(roomName, newRoomName.trim())
                    } else {
                      setEditingRoomName(null)
                      setNewRoomName('')
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (newRoomName.trim()) {
                        updateRoomName(roomName, newRoomName.trim())
                      }
                    } else if (e.key === 'Escape') {
                      setEditingRoomName(null)
                      setNewRoomName('')
                    }
                  }}
                  placeholder="Enter room name"
                  className="flex-1"
                  autoFocus
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoomName(roomName)
                      setNewRoomName(roomName)
                    }}
                    className="flex-1 text-left font-semibold text-sm hover:text-primary"
                  >
                    {roomName || 'Unnamed Room'}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRoom(roomName)}
                    disabled={
                      measurements.length === roomMeasurements.length &&
                      measurements.length === 1
                    }
                    aria-label="Remove room"
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Wall Measurements */}
            <div className="space-y-2 pl-6">
              {roomMeasurements.map(measurement => (
                <div key={measurement.id} className="flex items-center gap-2">
                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <Input
                      type="text"
                      placeholder="Wall name"
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
                      placeholder="Length (inches)"
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
                    className="h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addMeasurementToRoom(roomName)}
                className="w-full"
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Measurement
              </Button>
            </div>
          </div>
        )
      )}

      {/* Add Room Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addRoom}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Room
      </Button>
    </div>
  )
}
