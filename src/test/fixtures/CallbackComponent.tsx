// Fixture for extractProps tests — function prop with return type
interface CallbackProps {
  getData: () => string
  transform: (input: number) => boolean
  fetchUser: () => Promise<{ name: string }>
}

export function CallbackComponent(props: CallbackProps) {
  return <div data-fn={typeof props.getData} />
}
