import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'

interface BoardLengthSelectorProps {
  selectedLengths: number[]
  onChange: (lengths: number[]) => void
}

const COMMON_LENGTHS = [96, 120, 144] as const

export function BoardLengthSelector({
  selectedLengths,
  onChange,
}: BoardLengthSelectorProps) {
  const toggleLength = (length: number) => {
    if (selectedLengths.includes(length)) {
      // Remove if already selected
      onChange(selectedLengths.filter(l => l !== length))
    } else {
      // Add and sort
      onChange([...selectedLengths, length].sort((a, b) => a - b))
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {COMMON_LENGTHS.map(length => (
          <div key={length} className="flex items-center space-x-2">
            <Checkbox
              id={`length-${length}`}
              checked={selectedLengths.includes(length)}
              onCheckedChange={() => toggleLength(length)}
            />
            <Label
              htmlFor={`length-${length}`}
              className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {length}" ({(length / 12).toFixed(1)} feet)
            </Label>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        Select the board lengths available to you
      </p>
    </div>
  )
}
