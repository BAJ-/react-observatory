import { useState, useCallback, useRef, useEffect } from 'react'
import type { SerializableProps } from './resolveProps'
import type { Timeline } from './timelineTree'
import {
  createTimeline,
  addNode as addTimelineNode,
  goToNode as goToTimelineNode,
  getActiveNode,
  getMarkedSequence,
  toggleMarked as toggleTimelineMarked,
} from './timelineTree'

interface UseTimelineReturn {
  timeline: Timeline
  activeProps: SerializableProps
  isReplaying: boolean
  handlePropChange: (key: string, value: unknown) => void
  goToNode: (id: string) => void
  toggleMarked: (id: string) => void
  initTimeline: (props: SerializableProps) => void
  mergeActiveProps: (baseProps: SerializableProps) => void
  replay: (stepMs?: number) => void
  cancelReplay: () => void
}

export function useTimeline(
  initialProps: SerializableProps = {},
): UseTimelineReturn {
  const [timeline, setTimeline] = useState<Timeline>(() =>
    createTimeline(initialProps),
  )
  const [isReplaying, setIsReplaying] = useState(false)
  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const timelineRef = useRef(timeline)

  useEffect(() => {
    timelineRef.current = timeline
  }, [timeline])

  // Clear any in-flight replay timers on unmount
  useEffect(() => {
    return () => {
      for (const t of replayTimersRef.current) clearTimeout(t)
    }
  }, [])

  const activeProps = getActiveNode(timeline).props

  const cancelReplay = useCallback(() => {
    for (const t of replayTimersRef.current) clearTimeout(t)
    replayTimersRef.current = []
    setIsReplaying(false)
  }, [])

  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      cancelReplay()
      setTimeline((prev) => {
        const currentProps = getActiveNode(prev).props
        if (currentProps[key] === value) return prev
        return addTimelineNode(prev, { ...currentProps, [key]: value })
      })
    },
    [cancelReplay],
  )

  const goToNode = useCallback(
    (id: string) => {
      cancelReplay()
      setTimeline((prev) => goToTimelineNode(prev, id))
    },
    [cancelReplay],
  )

  const toggleMarked = useCallback(
    (id: string) => {
      cancelReplay()
      setTimeline((prev) => toggleTimelineMarked(prev, id))
    },
    [cancelReplay],
  )

  const initTimeline = useCallback((props: SerializableProps) => {
    setTimeline(createTimeline(props))
  }, [])

  const mergeActiveProps = useCallback((baseProps: SerializableProps) => {
    setTimeline((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({
        ...n,
        props: { ...baseProps, ...n.props },
      })),
    }))
  }, [])

  const replay = useCallback((stepMs = 600) => {
    const sequence = getMarkedSequence(timelineRef.current)
    if (sequence.length === 0) return

    // Cancel any in-progress replay
    for (const t of replayTimersRef.current) clearTimeout(t)
    replayTimersRef.current = []

    setIsReplaying(true)

    // Navigate to first marked node immediately
    setTimeline((prev) => goToTimelineNode(prev, sequence[0].id))

    // Schedule remaining steps
    const remaining = sequence.slice(1)
    remaining.forEach((node, i) => {
      const timer = setTimeout(
        () => {
          setTimeline((prev) => goToTimelineNode(prev, node.id))
          if (i === remaining.length - 1) {
            replayTimersRef.current = []
            setIsReplaying(false)
          }
        },
        stepMs * (i + 1),
      )
      replayTimersRef.current.push(timer)
    })

    if (remaining.length === 0) {
      setIsReplaying(false)
    }
  }, [])

  return {
    timeline,
    activeProps,
    isReplaying,
    handlePropChange,
    goToNode,
    toggleMarked,
    initTimeline,
    mergeActiveProps,
    replay,
    cancelReplay,
  }
}
