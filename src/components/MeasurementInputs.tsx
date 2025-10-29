import type {Measurement} from '@/lib/utils'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {calculateBalancedSplits} from '@/lib/utils'

import {Home, Plus, Trash2} from 'lucide-react'
import {useState} from 'react'

interface MeasurementInputsProps {
  measurements: Measurement[]
  onChange: (measurements: Measurement[]) => void
  availableLengths: number[]
  focusedRoom: string | null
  onFocusedRoomChange: (room: string | null) => void
}

export function MeasurementInputs({
  measurements,
  onChange,
  availableLengths,
  focusedRoom,
  onFocusedRoomChange,
}: MeasurementInputsProps) {
  // Track which room names are being edited
  const [editingRoomName, setEditingRoomName] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')

  // Calculate max board length
  const maxBoardLength =
    availableLengths.length > 0 ? Math.max(...availableLengths) : Infinity

  // Helper to format a size as a fraction (e.g., 83.3125 => "83 5/16")
  const formatAsFraction = (size: number): string => {
    const whole = Math.floor(size)
    const decimal = size - whole

    // Common fractions for 1/16" precision
    const fractions: [number, string][] = [
      [0, ''],
      [0.0625, '1/16'],
      [0.125, '1/8'],
      [0.1875, '3/16'],
      [0.25, '1/4'],
      [0.3125, '5/16'],
      [0.375, '3/8'],
      [0.4375, '7/16'],
      [0.5, '1/2'],
      [0.5625, '9/16'],
      [0.625, '5/8'],
      [0.6875, '11/16'],
      [0.75, '3/4'],
      [0.8125, '13/16'],
      [0.875, '7/8'],
      [0.9375, '15/16'],
    ]

    // Find closest fraction
    const closest = fractions.reduce((prev, curr) => {
      return Math.abs(curr[0] - decimal) < Math.abs(prev[0] - decimal)
        ? curr
        : prev
    })

    if (closest[1] === '') {
      return `${whole.toString()}"`
    }

    return whole > 0 ? `${whole} ${closest[1]}"` : `${closest[1]}"`
  }

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

  const handleToggleRoom = (roomName: string) => {
    if (focusedRoom === roomName) {
      onFocusedRoomChange(null)
    } else {
      onFocusedRoomChange(roomName)
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedMeasurements).map(
        ([roomName, roomMeasurements]) => {
          const isThisRoomFocused = focusedRoom === roomName
          const shouldGrayOut = focusedRoom !== null && !isThisRoomFocused

          return (
            <div
              key={roomName || 'unnamed'}
              className={`space-y-3 rounded-lg border p-4 transition-opacity ${
                shouldGrayOut ? 'opacity-40' : 'opacity-100'
              }`}
            >
            {/* Room Header */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isThisRoomFocused}
                  onCheckedChange={() => handleToggleRoom(roomName)}
                  aria-label={`Focus on ${roomName || 'Unnamed Room'}`}
                />
                <Home className="h-4 w-4 text-muted-foreground" />
              </div>
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
              {roomMeasurements.map(measurement => {
                const isOversized =
                  measurement.size > maxBoardLength &&
                  maxBoardLength !== Infinity
                const splits = isOversized
                  ? calculateBalancedSplits(measurement.size, maxBoardLength)
                  : []

                return (
                  <div key={measurement.id} className="space-y-1">
                    <div className="flex items-center gap-2">
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
                          step="0.0625"
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

                    {/* Split Evenly Checkbox - only shown if oversized */}
                    {isOversized && (
                      <div className="space-y-1 pl-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`split-${measurement.id}`}
                            checked={measurement.splitEvenly}
                            onCheckedChange={checked => {
                              updateMeasurement(measurement.id, {
                                splitEvenly: checked === true,
                              })
                            }}
                          />
                          <Label
                            htmlFor={`split-${measurement.id}`}
                            className="cursor-pointer font-normal text-sm"
                          >
                            Split evenly
                          </Label>
                        </div>

                        {/* Show split preview if checkbox is enabled */}
                        {measurement.splitEvenly && splits.length > 0 && (
                          <div className="pl-6 text-muted-foreground text-xs">
                            Will create:{' '}
                            {splits.map(formatAsFraction).join(' + ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

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
        }
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
