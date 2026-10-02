import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DetailPanel } from '../../src/components/DetailPanel'
import type { Country, Source } from '../../src/types'

/**
 * Security: Factbook group names and country names are untrusted text. React
 * must render them as text, so a markup-like label can never become live DOM.
 */
const sources: Source[] = [
  {
    id: 'test-source',
    name: 'Test <b>Source</b>',
    url: 'https://example.org',
    license: 'public-domain',
    referenceYear: 2024,
  },
]

const hostileCountry: Country = {
  code: 'XSS',
  name: '<script>alert("name")</script>',
  commonName: '<img src=x onerror=alert(1)>',
  region: 'Test',
  totalPopulation: 1000,
  populationSourceId: 'test-source',
  populationReferenceYear: 2024,
  diversityBreakdown: [
    {
      dimension: 'ethnic',
      groupName: '<script>alert("group")</script>',
      share: 50,
      sourceId: 'test-source',
      referenceYear: 2024,
    },
    { dimension: 'ethnic', groupName: 'other', share: 50, sourceId: 'test-source', referenceYear: 2024 },
  ],
  diversityIndicator: null,
}

describe('DetailPanel markup safety', () => {
  it('renders untrusted names as text, not as live DOM', () => {
    const { container } = render(
      <DetailPanel country={hostileCountry} sources={sources} onClose={vi.fn()} />,
    )
    expect(screen.getByTestId('breakdown-ethnic')).toHaveTextContent(
      '<script>alert("group")</script>',
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('onerror=alert(1)')
  })
})
