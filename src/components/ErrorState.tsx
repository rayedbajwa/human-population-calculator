export interface ErrorStateProps {
  message: string
  onRetry: () => void
}

/** User-safe load failure with a retry action (FR-014). */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="pg-error pg-card" role="alert" data-testid="error-state">
      <h2>Something went wrong</h2>
      <p className="pg-muted">{message}</p>
      <button type="button" className="pg-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
