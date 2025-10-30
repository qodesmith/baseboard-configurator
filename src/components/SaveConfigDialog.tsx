import type {BoardLengthItem} from '@/lib/globalState'

import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  availableBoardLengthsSelector,
  currentConfigNameAtom,
  kerfAtom,
  measurementsAtom,
} from '@/lib/globalState'

import {useAtom, useAtomValue} from 'jotai'
import {useId, useState} from 'react'

interface SaveConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SavedConfig {
  measurements: unknown
  availableLengths: BoardLengthItem[]
  kerf: number
  timestamp: number
}

export function SaveConfigDialog({open, onOpenChange}: SaveConfigDialogProps) {
  const nameId = useId()
  const measurements = useAtomValue(measurementsAtom)
  const availableLengths = useAtomValue(availableBoardLengthsSelector)
  const kerf = useAtomValue(kerfAtom)
  const [_currentConfigName, setCurrentConfigName] = useAtom(
    currentConfigNameAtom
  )
  const [configName, setConfigName] = useState('')

  const handleSave = () => {
    if (!configName.trim()) {
      alert('Please enter a configuration name')
      return
    }

    // Get existing configurations
    const existingConfigs = localStorage.getItem('baseboard-configs')
    const configs: Record<string, SavedConfig> = existingConfigs
      ? JSON.parse(existingConfigs)
      : {}

    const trimmedName = configName.trim()

    // Save new configuration
    configs[trimmedName] = {
      measurements,
      availableLengths,
      kerf,
      timestamp: Date.now(),
    }

    localStorage.setItem('baseboard-configs', JSON.stringify(configs))
    setCurrentConfigName(trimmedName)

    // Reset and close
    setConfigName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Configuration</DialogTitle>
          <DialogDescription>
            Give your configuration a name so you can load it later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={nameId} className="text-right">
              Name
            </Label>
            <Input
              id={nameId}
              value={configName}
              onChange={e => setConfigName(e.target.value)}
              placeholder="e.g., Living Room"
              className="col-span-3"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSave()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
