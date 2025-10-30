import {MeasurementInputs} from './MeasurementInputs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

export function MeasurementsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
        <CardDescription>Add your wall measurements in inches</CardDescription>
      </CardHeader>
      <CardContent>
        <MeasurementInputs />
      </CardContent>
    </Card>
  )
}
