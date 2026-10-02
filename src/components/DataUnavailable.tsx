export interface DataUnavailableProps {
  message: string
}

/** Explicit "data not available" block — never a zero or blank (FR-008). */
export function DataUnavailable({ message }: DataUnavailableProps) {
  return (
    <p className="pg-unavailable" data-testid="data-unavailable">
      {message}
    </p>
  )
}
