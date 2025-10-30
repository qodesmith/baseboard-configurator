import {useAtom} from 'jotai'
import {useId} from 'react'

import {kerfAtom} from '../lib/globalState'
import {Button} from './ui/button'
import {ButtonGroup} from './ui/button-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {Input} from './ui/input'
import {Label} from './ui/label'

export function KerfSection() {
  const id = useId()
  const [kerf, setKerf] = useAtom(kerfAtom)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saw Kerf</CardTitle>
        <CardDescription>Width of your saw blade cut (inches)</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor={id} className="min-w-fit">
            Kerf:
          </Label>
          <Input
            id={id}
            type="number"
            step={1 / 16}
            min="0"
            value={kerf}
            onChange={e => setKerf(parseFloat(e.target.value) || 0)}
            className="max-w-32"
          />
          <span className="text-muted-foreground text-sm">inches</span>
        </div>
        <ButtonGroup orientation="vertical">
          <Button variant="outline" size="sm" onClick={() => setKerf(3 / 32)}>
            3/32" (thin)
          </Button>
          <Button variant="outline" size="sm" onClick={() => setKerf(1 / 8)}>
            1/8" (standard)
          </Button>
        </ButtonGroup>
      </CardContent>
    </Card>
  )
}
