import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DetailPanel } from '../../src/components/DetailPanel'
import type { DatasetSnapshot } from '../../src/types'
import fixture from '../fixtures/snapshot.fixture.json'

const snapshot = fixture as unknown as DatasetSnapshot
const byCode = (code: string) => snapshot.countries.find((country) => country.code === code)!

describe('DetailPanel population block', () => {
  it('shows the exact population with separators, the short form and provenance', () => {
    render(<DetailPanel country={byCode('USA')} sources={snapshot.sources} onClose={vi.fn()} />)
    expect(screen.getByTestId('population-exact')).toHaveTextContent('341,784,857')
    expect(screen.getByTestId('population-short')).toHaveTextContent('341.8M')
    expect(screen.getByTestId('population-provenance')).toHaveTextContent('Fixture Population Source')
    expect(screen.getByTestId('population-provenance')).toHaveTextContent('2024')
  })

  it('renders an explicit unavailable state instead of zero when population is missing', () => {
    render(<DetailPanel country={byCode('VAT')} sources={snapshot.sources} onClose={vi.fn()} />)
    expect(screen.getByTestId('population-block')).toHaveTextContent(/population data not available/i)
    expect(screen.queryByTestId('population-exact')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('calls onClose from the accessible close button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<DetailPanel country={byCode('JPN')} sources={snapshot.sources} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close detail panel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
