import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataUnavailable } from '../../src/components/DataUnavailable'

describe('DataUnavailable', () => {
  it('renders the explicit unavailable copy instead of a zero or blank', () => {
    render(<DataUnavailable message="Population data not available" />)
    expect(screen.getByTestId('data-unavailable')).toHaveTextContent('Population data not available')
    expect(screen.getByTestId('data-unavailable')).not.toHaveTextContent('0')
  })
})
