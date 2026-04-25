// Fixture for extractProps tests — basic typed props
interface BasicProps {
  label: string
  count: number
  active: boolean
}

export function BasicComponent({ label, count, active }: BasicProps) {
  return <div>{label} {count} {active}</div>
}
