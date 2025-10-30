import {useAtom, useAtomValue} from 'jotai'

import {
  availableLengthsAtom,
  focusedRoomAtom,
  measurementsAtom,
} from '../lib/globalState'
import {MeasurementInputs} from './MeasurementInputs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

export function MeasurementsSection() {
  const [measurements, setMeasurements] = useAtom(measurementsAtom)
  const availableLengths = useAtomValue(availableLengthsAtom)
  const [focusedRoom, setFocusedRoom] = useAtom(focusedRoomAtom)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
        <CardDescription>Add your wall measurements in inches</CardDescription>
      </CardHeader>
      <CardContent>
        <MeasurementInputs
          measurements={measurements}
          onChange={setMeasurements}
          availableLengths={availableLengths}
          focusedRoom={focusedRoom}
          onFocusedRoomChange={setFocusedRoom}
        />
      </CardContent>
    </Card>
  )
}
