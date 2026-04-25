// Fixture for extractProps tests — function prop with return type
interface CallbackProps {
  getData: () => string
  transform: (input: number) => boolean
  fetchUser: () => Promise<{ name: string }>
}

export function CallbackComponent(_props: CallbackProps) {
  return <div />
}
