import type {BaseboardResult} from '@/lib/utils'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  availableLengthsAtom,
  currentConfigNameAtom,
  DEFAULT_BOARD_LENGTHS,
  DEFAULT_KERF,
  kerfAtom,
  measurementsAtom,
} from '@/lib/globalState'

import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {Copy, Download, RotateCcw, Save} from 'lucide-react'
import {useState} from 'react'
import {toast} from 'sonner'

import {LoadConfigDialog} from './LoadConfigDialog'
import {SaveConfigDialog} from './SaveConfigDialog'

interface ConfigurationManagerProps {
  results: BaseboardResult | null
}

export function ConfigurationManager({results}: ConfigurationManagerProps) {
  const measurements = useAtomValue(measurementsAtom)
  const availableLengths = useAtomValue(availableLengthsAtom)
  const kerf = useAtomValue(kerfAtom)
  const setMeasurements = useSetAtom(measurementsAtom)
  const setAvailableLengths = useSetAtom(availableLengthsAtom)
  const setKerf = useSetAtom(kerfAtom)
  const [currentConfigName, setCurrentConfigName] = useAtom(
    currentConfigNameAtom
  )
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false)
  const [exportCopied, setExportCopied] = useState(false)

  const handleSaveClick = () => {
    if (currentConfigName) {
      setOverwriteDialogOpen(true)
    } else {
      setSaveDialogOpen(true)
    }
  }

  const handleOverwrite = () => {
    // Get existing configurations
    const existingConfigs = localStorage.getItem('baseboard-configs')
    const configs = existingConfigs ? JSON.parse(existingConfigs) : {}

    if (!currentConfigName) {
      throw new Error('No config found to overwrite')
    }

    // Overwrite the current configuration
    configs[currentConfigName] = {
      measurements,
      availableLengths,
      kerf,
      timestamp: Date.now(),
    }

    localStorage.setItem('baseboard-configs', JSON.stringify(configs))
    setOverwriteDialogOpen(false)
  }

  const handleSaveAsNew = () => {
    setOverwriteDialogOpen(false)
    setSaveDialogOpen(true)
  }

  const handleReset = () => {
    setMeasurements([{id: crypto.randomUUID(), size: 0, room: '', wall: ''}])
    setAvailableLengths(DEFAULT_BOARD_LENGTHS)
    setKerf(DEFAULT_KERF)
    setCurrentConfigName(null)
  }

  const handleExportConfig = async () => {
    const config = {
      measurements,
      availableLengths,
      kerf,
      ...(currentConfigName && {name: currentConfigName}),
      ...(results && {cuttingPlan: results}),
      exportedAt: new Date().toISOString(),
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      setExportCopied(true)
      setTimeout(() => setExportCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Save and load your baseboard configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentConfigName && (
            <div className="mb-4 rounded-md bg-muted p-3">
              <p className="text-muted-foreground text-sm">
                Current configuration:
              </p>
              <p className="font-medium">{currentConfigName}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default" size="sm" onClick={handleSaveClick}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoadDialogOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportConfig}
              disabled={exportCopied}
            >
              <Copy className="mr-2 h-4 w-4" />
              {exportCopied ? 'Copied!' : 'Export'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reset all settings to defaults?
                    This will clear your current configuration.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <SaveConfigDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
      />
      <LoadConfigDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
      />

      <AlertDialog
        open={overwriteDialogOpen}
        onOpenChange={setOverwriteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              You're currently working with "{currentConfigName}". Do you want
              to overwrite it or save as a new configuration?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleSaveAsNew}>
              Save as New
            </Button>
            <AlertDialogAction onClick={handleOverwrite}>
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
