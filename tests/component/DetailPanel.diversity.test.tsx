import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DetailPanel } from '../../src/components/DetailPanel'
import type { DatasetSnapshot } from '../../src/types'
import fixture from '../fixtures/snapshot.fixture.json'

const snapshot = fixture as unknown as DatasetSnapshot
const byCode = (code: string) => snapshot.countries.find((country) => country.code === code)!

describe('DetailPanel diversity block', () => {
  it('groups breakdown rows by dimension and shows the indicator with scale and provenance', () => {
    render(<DetailPanel country={byCode('USA')} sources={snapshot.sources} onClose={vi.fn()} />)
    expect(screen.getByTestId('breakdown-ethnic')).toHaveTextContent('White')
    expect(screen.getByTestId('breakdown-religious')).toHaveTextContent('Christian')
    expect(screen.getByTestId('diversity-indicator')).toHaveTextContent('Ethnic fractionalisation (fixture)')
    expect(screen.getByTestId('indicator-value')).toHaveTextContent('0.58')
    expect(screen.getByTestId('indicator-value')).toHaveTextContent('0–1')
    expect(screen.getAllByText(/fixture diversity source/i).length).toBeGreaterThan(0)
  })

  it('shows an explicit unavailable state for population-only countries but keeps the population', () => {
    render(<DetailPanel country={byCode('CIV')} sources={snapshot.sources} onClose={vi.fn()} />)
    expect(screen.getByTestId('diversity-block')).toHaveTextContent(/diversity data not available/i)
    expect(screen.queryByTestId('diversity-indicator')).not.toBeInTheDocument()
    expect(screen.getByTestId('population-exact')).toHaveTextContent('32,711,547')
  })

  it('renders a breakdown without an indicator when only group shares exist', () => {
    render(<DetailPanel country={byCode('NGA')} sources={snapshot.sources} onClose={vi.fn()} />)
    expect(screen.getByTestId('breakdown-ethnic')).toHaveTextContent('Yoruba')
    expect(screen.queryByTestId('diversity-indicator')).not.toBeInTheDocument()
  })
})
