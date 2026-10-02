import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Legend } from '../../src/components/Legend'
import { NO_DATA_LABEL, POPULATION_BUCKETS } from '../../src/lib/diversity'

describe('Legend', () => {
  it('renders a swatch and label for every population bucket', () => {
    render(<Legend buckets={POPULATION_BUCKETS} noDataLabel={NO_DATA_LABEL} />)
    expect(screen.getAllByTestId('legend-item')).toHaveLength(POPULATION_BUCKETS.length)
    for (const bucket of POPULATION_BUCKETS) {
      expect(screen.getByText(bucket.label)).toBeInTheDocument()
    }
  })

  it('renders a distinct no-data swatch', () => {
    render(<Legend buckets={POPULATION_BUCKETS} noDataLabel={NO_DATA_LABEL} />)
    const noData = screen.getByTestId('legend-no-data')
    expect(noData).toHaveTextContent(NO_DATA_LABEL)
  })

  it('exposes an accessible heading', () => {
    render(<Legend buckets={POPULATION_BUCKETS} noDataLabel={NO_DATA_LABEL} />)
    expect(screen.getByRole('heading', { name: /population/i })).toBeInTheDocument()
  })
})
