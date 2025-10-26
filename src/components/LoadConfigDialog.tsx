import type {Measurement} from '@/lib/utils'

import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {availableLengthsAtom, kerfAtom, measurementsAtom} from '@/lib/atoms'

import {useSetAtom} from 'jotai'
import {Trash2} from 'lucide-react'
import {useCallback, useEffect, useState} from 'react'

interface LoadConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SavedConfig {
  measurements: Measurement[]
  availableLengths: number[]
  kerf: number
  timestamp: number
}

export function LoadConfigDialog({open, onOpenChange}: LoadConfigDialogProps) {
  const setMeasurements = useSetAtom(measurementsAtom)
  const setAvailableLengths = useSetAtom(availableLengthsAtom)
  const setKerf = useSetAtom(kerfAtom)
  const [configs, setConfigs] = useState<Record<string, SavedConfig>>({})
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null)

  const loadConfigs = useCallback(() => {
    const existingConfigs = localStorage.getItem('baseboard-configs')
    if (existingConfigs) {
      setConfigs(JSON.parse(existingConfigs))
    } else {
      setConfigs({})
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadConfigs()
    }
  }, [open, loadConfigs])

  const handleLoad = () => {
    if (!(selectedConfig && configs[selectedConfig])) {
      alert('Please select a configuration to load')
      return
    }

    const config = configs[selectedConfig]
    setMeasurements(config.measurements)
    setAvailableLengths(config.availableLengths)
    setKerf(config.kerf)

    onOpenChange(false)
    setSelectedConfig(null)
  }

  const handleDelete = (configName: string) => {
    if (confirm(`Are you sure you want to delete "${configName}"?`)) {
      const updatedConfigs = {...configs}
      delete updatedConfigs[configName]
      setConfigs(updatedConfigs)
      localStorage.setItem('baseboard-configs', JSON.stringify(updatedConfigs))

      if (selectedConfig === configName) {
        setSelectedConfig(null)
      }
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const configNames = Object.keys(configs).sort((a, b) => {
    return configs[b].timestamp - configs[a].timestamp
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Load Configuration</DialogTitle>
          <DialogDescription>
            Select a saved configuration to load.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto py-4">
          {configNames.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No saved configurations found.
            </div>
          ) : (
            <div className="space-y-2">
              {configNames.map(name => (
                <div
                  key={name}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    selectedConfig === name
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <button
                    type="button"
                    className="flex-1 cursor-pointer text-left"
                    onClick={() => setSelectedConfig(name)}
                  >
                    <div className="font-medium">{name}</div>
                    <div className="text-muted-foreground text-sm">
                      Saved on {formatDate(configs[name].timestamp)}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(name)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleLoad} disabled={!selectedConfig}>
            Load
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
