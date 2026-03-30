import type { Timeline, TimelineNode } from './timelineTree'
import { getChildren } from './timelineTree'
import { UNSET } from './generateProps'

interface TimelinePanelProps {
  timeline: Timeline
  isReplaying: boolean
  onGoToNode: (id: string) => void
  onToggleMarked: (id: string) => void
  onReplay: () => void
  onCancelReplay: () => void
}

export function TimelinePanel({
  timeline,
  isReplaying,
  onGoToNode,
  onToggleMarked,
  onReplay,
  onCancelReplay,
}: TimelinePanelProps) {
  const root = timeline.nodes.find((n) => n.parentId === null)
  if (!root) return null

  const hasMarked = timeline.nodes.some((n) => n.marked)

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <h3>Timeline</h3>
        {hasMarked && (
          <button
            className="timeline-replay-btn"
            onClick={isReplaying ? onCancelReplay : onReplay}
          >
            {isReplaying ? 'Stop' : 'Replay'}
          </button>
        )}
      </div>
      <div className="timeline-tree">
        <NodeRow
          node={root}
          timeline={timeline}
          depth={0}
          onGoToNode={onGoToNode}
          onToggleMarked={onToggleMarked}
        />
      </div>
    </div>
  )
}

function NodeRow({
  node,
  timeline,
  depth,
  onGoToNode,
  onToggleMarked,
}: {
  node: TimelineNode
  timeline: Timeline
  depth: number
  onGoToNode: (id: string) => void
  onToggleMarked: (id: string) => void
}) {
  const children = getChildren(timeline, node.id)
  const isActive = node.id === timeline.activeId
  const label = getChangeLabel(node, timeline)

  return (
    <>
      <div className={`timeline-node${isActive ? ' active' : ''}`}>
        <span
          className="timeline-indent"
          style={{ width: `${depth * 12}px` }}
        />
        <button
          className={`timeline-mark${node.marked ? ' marked' : ''}`}
          onClick={() => onToggleMarked(node.id)}
          aria-label={node.marked ? 'Unmark node' : 'Mark node'}
        />
        <button className="timeline-label" onClick={() => onGoToNode(node.id)}>
          {label}
        </button>
      </div>
      {children.map((child) => (
        <NodeRow
          key={child.id}
          node={child}
          timeline={timeline}
          depth={depth + 1}
          onGoToNode={onGoToNode}
          onToggleMarked={onToggleMarked}
        />
      ))}
    </>
  )
}

function getChangeLabel(node: TimelineNode, timeline: Timeline): string {
  if (!node.parentId) return 'initial'
  const parent = timeline.nodes.find((n) => n.id === node.parentId)
  if (!parent) return 'initial'

  const changed: string[] = []
  for (const [key, value] of Object.entries(node.props)) {
    if (parent.props[key] !== value) {
      changed.push(`${key}: ${formatValue(value)}`)
    }
  }

  return changed.length > 0 ? changed.join(', ') : 'no change'
}

function formatValue(value: unknown): string {
  if (value === UNSET) return 'unset'
  if (typeof value === 'string') {
    return value.length > 20 ? `'${value.slice(0, 20)}…'` : `'${value}'`
  }
  return String(value)
}
