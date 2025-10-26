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
  DEFAULT_BOARD_LENGTHS,
  DEFAULT_KERF,
  kerfAtom,
  measurementsAtom,
} from '@/lib/atoms'

import {useSetAtom} from 'jotai'
import {Download, RotateCcw, Save} from 'lucide-react'
import {useState} from 'react'

import {LoadConfigDialog} from './LoadConfigDialog'
import {SaveConfigDialog} from './SaveConfigDialog'

export function ConfigurationManager() {
  const setMeasurements = useSetAtom(measurementsAtom)
  const setAvailableLengths = useSetAtom(availableLengthsAtom)
  const setKerf = useSetAtom(kerfAtom)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset all settings to defaults? This will clear your current configuration.'
      )
    ) {
      setMeasurements([{id: crypto.randomUUID(), size: 0, room: '', wall: ''}])
      setAvailableLengths(DEFAULT_BOARD_LENGTHS)
      setKerf(DEFAULT_KERF)
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
            >
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
              onClick={handleReset}
              className="ml-auto"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
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
    </>
  )
}
