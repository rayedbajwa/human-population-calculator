import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchBox } from '../../src/components/SearchBox'
import type { DatasetSnapshot } from '../../src/types'
import fixture from '../fixtures/snapshot.fixture.json'

const countries = (fixture as unknown as DatasetSnapshot).countries

function Harness({ onChoose = vi.fn() }: { onChoose?: (code: string) => void }) {
  const [query, setQuery] = useState('')
  return (
    <SearchBox
      countries={countries}
      query={query}
      onQueryChange={setQuery}
      onChoose={onChoose}
    />
  )
}

describe('SearchBox', () => {
  it('shows nothing for fewer than two characters', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByTestId('search-input'), 'j')
    expect(screen.queryByTestId('search-suggestions')).not.toBeInTheDocument()
    expect(screen.queryByTestId('search-no-results')).not.toBeInTheDocument()
  })

  it('suggests matching countries after two characters', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByTestId('search-input'), 'jap')
    expect(screen.getByTestId('suggestion-JPN')).toHaveTextContent('Japan')
  })

  it('matches accent-folded names', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByTestId('search-input'), 'cote')
    expect(screen.getByTestId('suggestion-CIV')).toBeInTheDocument()
  })

  it('calls onChoose with the selected country code', async () => {
    const onChoose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChoose={onChoose} />)
    await user.type(screen.getByTestId('search-input'), 'jap')
    await user.click(screen.getByTestId('suggestion-JPN'))
    expect(onChoose).toHaveBeenCalledWith('JPN')
  })

  it('shows a clear message when nothing matches and does not choose', async () => {
    const onChoose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChoose={onChoose} />)
    await user.type(screen.getByTestId('search-input'), 'zzzzzz')
    expect(screen.getByTestId('search-no-results')).toHaveTextContent(/no countries found/i)
    expect(onChoose).not.toHaveBeenCalled()
  })

  it('chooses the active suggestion with the keyboard', async () => {
    const onChoose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChoose={onChoose} />)
    const input = screen.getByTestId('search-input')
    await user.type(input, 'jap')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChoose).toHaveBeenCalledWith('JPN')
  })

  it('chooses the first suggestion with Enter when none is highlighted', async () => {
    const onChoose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChoose={onChoose} />)
    await user.type(screen.getByTestId('search-input'), 'jap{Enter}')
    expect(onChoose).toHaveBeenCalledWith('JPN')
  })

  it('exposes the active option through aria-activedescendant', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByTestId('search-input')
    await user.type(input, 'jap')
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', 'pg-option-JPN')
    expect(screen.getByTestId('suggestion-JPN').closest('li')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('does not point aria-controls at a missing list when there are no results', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByTestId('search-input'), 'zzzzzz')
    expect(screen.getByTestId('search-input')).not.toHaveAttribute('aria-controls')
  })
})
