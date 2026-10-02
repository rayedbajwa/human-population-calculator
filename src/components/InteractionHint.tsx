export interface InteractionHintProps {
  onDismiss: () => void
}

/** First-use hint covering rotate, zoom and select (FR-009). */
export function InteractionHint({ onDismiss }: InteractionHintProps) {
  return (
    <div className="pg-hint" role="status" data-testid="interaction-hint">
      <p className="pg-small" style={{ margin: 0 }}>
        <strong>Rotate</strong> by dragging, <strong>zoom</strong> with scroll or pinch, and{' '}
        <strong>select</strong> a country to see its population and diversity.
      </p>
      <button type="button" className="pg-close" onClick={onDismiss} aria-label="Dismiss hint">
        Dismiss
      </button>
    </div>
  )
}
