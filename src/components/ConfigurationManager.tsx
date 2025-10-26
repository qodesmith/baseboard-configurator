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
    setMeasurements([{id: crypto.randomUUID(), size: 0, room: '', wall: ''}])
    setAvailableLengths(DEFAULT_BOARD_LENGTHS)
    setKerf(DEFAULT_KERF)
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
    </>
  )
}
