import type {PrimitiveAtom} from 'jotai'
import type {BoardLengthItem} from '../lib/globalState'

import {useAtom, useAtomValue} from 'jotai'
import {useCallback, useId} from 'react'

import {boardLengthsAtomsAtom} from '../lib/globalState'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {Checkbox} from './ui/checkbox'
import {Label} from './ui/label'

export function BoardLengthsSection() {
  const boardLengthAtoms = useAtomValue(boardLengthsAtomsAtom)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Board Lengths</CardTitle>
        <CardDescription>
          Select which board lengths are available (inches)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          {boardLengthAtoms.map(boardLengthAtom => {
            return (
              <BoardLength
                key={boardLengthAtom.toString()}
                boardLengthAtom={boardLengthAtom}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function BoardLength({
  boardLengthAtom,
}: {
  boardLengthAtom: PrimitiveAtom<BoardLengthItem>
}) {
  const id = useId()
  const [boardLength, setBoardLength] = useAtom(boardLengthAtom)
  const {length, enabled} = boardLength
  const handleToggleCheck = useCallback(() => {
    setBoardLength(prev => ({...prev, enabled: !prev.enabled}))
  }, [setBoardLength])

  return (
    <div className="flex cursor-pointer gap-2">
      <Checkbox
        id={id}
        className="cursor-pointer"
        checked={enabled}
        onCheckedChange={handleToggleCheck}
      />
      <Label htmlFor={id} className="cursor-pointer">
        {length}" ({length / 12} feet)
      </Label>
    </div>
  )
}
