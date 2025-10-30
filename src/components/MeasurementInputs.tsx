import type {Measurement} from '@/lib/utils'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {calculateBalancedSplits, cn} from '@/lib/utils'

import {useAtom, useAtomValue} from 'jotai'
import {Home, Plus, Trash2} from 'lucide-react'
import {useCallback, useMemo, useState} from 'react'

import {
  availableBoardLengthsSelector,
  focusedRoomAtom,
  measurementsAtom,
} from '../lib/globalState'
import {formatAsFraction} from '../lib/measurementInputUtils'

export function MeasurementInputs() {
  const availableLengths = useAtomValue(availableBoardLengthsSelector).map(
    ({length}) => length
  )
  const [measurements, setMeasurements] = useAtom(measurementsAtom)
  const [focusedRoom, setFocusedRoom] = useAtom(focusedRoomAtom)

  // Track which room names are being edited
  const [editingRoomName, setEditingRoomName] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')

  // Calculate max board length
  const maxBoardLength =
    availableLengths.length > 0 ? Math.max(...availableLengths) : Infinity

  // Group measurements by room
  const groupedMeasurements = useMemo(
    () =>
      measurements.reduce(
        (acc, measurement) => {
          const roomName = measurement.room || ''
          if (!acc[roomName]) {
            acc[roomName] = []
          }
          acc[roomName].push(measurement)
          return acc
        },
        {} as Record<string, Measurement[]>
      ),
    [measurements]
  )

  const addRoom = useCallback(() => {
    // Add a new room with one empty measurement
    setMeasurements(currentMeasurements => [
      ...currentMeasurements,
      {id: crypto.randomUUID(), size: 0, room: '', wall: ''},
    ])
  }, [setMeasurements])

  const addMeasurementToRoom = useCallback(
    (roomName: string) => {
      setMeasurements(currentMeasurements => [
        ...currentMeasurements,
        {id: crypto.randomUUID(), size: 0, room: roomName, wall: ''},
      ])
    },
    [setMeasurements]
  )

  const removeMeasurement = useCallback(
    (id: string) => {
      if (measurements.length === 1) {
        // Keep at least one measurement
        return
      }

      setMeasurements(currentMeasurements =>
        currentMeasurements.filter(m => m.id !== id)
      )
    },
    [measurements.length, setMeasurements]
  )

  const updateMeasurement = useCallback(
    (id: string, updates: Partial<Measurement>) => {
      setMeasurements(currentMeasurements =>
        currentMeasurements.map(m => (m.id === id ? {...m, ...updates} : m))
      )
    },
    [setMeasurements]
  )

  const updateRoomName = useCallback(
    (oldName: string, newName: string) => {
      setMeasurements(currentMeasurements =>
        currentMeasurements.map(m =>
          m.room === oldName ? {...m, room: newName} : m
        )
      )
      setEditingRoomName(null)
      setNewRoomName('')
    },
    [setMeasurements]
  )

  const removeRoom = useCallback(
    (roomName: string) => {
      const roomMeasurements = groupedMeasurements[roomName] || []
      if (measurements.length === roomMeasurements.length) {
        // Don't remove the last room
        return
      }
      setMeasurements(currentMeasurements =>
        currentMeasurements.filter(m => m.room !== roomName)
      )
    },
    [groupedMeasurements, measurements.length, setMeasurements]
  )

  const handleToggleRoom = useCallback(
    (roomName: string) => {
      setFocusedRoom(currentRoom => {
        return currentRoom === roomName ? null : roomName
      })
    },
    [setFocusedRoom]
  )

  return (
    <div className="space-y-4">
      {Object.entries(groupedMeasurements).map(
        ([roomName, roomMeasurements]) => {
          const isThisRoomFocused = focusedRoom === roomName
          const shouldGrayOut = focusedRoom !== null && !isThisRoomFocused

          return (
            <div
              key={roomName || 'unnamed'}
              className={cn(
                'space-y-3 rounded-lg border p-4 transition-opacity',
                shouldGrayOut ? 'opacity-40' : 'opacity-100'
              )}
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
                      className="flex-1 cursor-text text-left font-semibold text-sm hover:text-primary"
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
