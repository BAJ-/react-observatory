// Fixture for extractProps tests — optional, enum, function props
interface ComplexProps {
  size: 'small' | 'medium' | 'large'
  onClick: () => void
  onChange?: (value: string) => void
  title?: string
  items: string[]
  config: { theme: string }
}

export default function ComplexComponent(props: ComplexProps) {
  return <div data-size={props.size} />
}
