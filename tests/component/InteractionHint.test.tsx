import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InteractionHint } from '../../src/components/InteractionHint'

/**
 * SC-005: a visitor can rotate, zoom and select using the on-screen hints.
 * The gesture mechanics are driven in the E2E suite; this asserts the hint
 * itself documents all three actions and is dismissible (FR-009).
 */
describe('InteractionHint (FR-009 / SC-005)', () => {
  it('explains rotate, zoom and select', () => {
    render(<InteractionHint onDismiss={vi.fn()} />)
    const hint = screen.getByTestId('interaction-hint')
    expect(hint).toHaveTextContent(/rotate/i)
    expect(hint).toHaveTextContent(/zoom/i)
    expect(hint).toHaveTextContent(/select/i)
  })

  it('dismisses on the close button', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(<InteractionHint onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: /dismiss hint/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
