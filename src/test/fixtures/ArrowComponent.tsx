// Fixture for extractProps tests — arrow function as variable export
interface ArrowProps {
  name: string
  disabled?: boolean
}

export const ArrowComponent = ({ name, disabled }: ArrowProps) => {
  return <button disabled={disabled}>{name}</button>
}
