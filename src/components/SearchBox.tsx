import { useMemo, useState } from 'react'
import type { Country } from '../types'
import { searchCountries } from '../lib/search'

export interface SearchBoxProps {
  countries: Country[]
  query: string
  onQueryChange: (query: string) => void
  onChoose: (code: string) => void
}

/**
 * Country search. Fewer than two characters shows nothing; two or more shows
 * ranked suggestions or a clear "no countries found" message (FR-006, US3).
 * Implements the ARIA combobox keyboard pattern (ArrowUp/Down, Enter, Escape).
 */
export function SearchBox({ countries, query, onQueryChange, onChoose }: SearchBoxProps) {
  const matches = useMemo(() => searchCountries(countries, query), [countries, query])
  const active = query.trim().length >= 2
  const hasResults = active && matches.length > 0
  const [activeIndex, setActiveIndex] = useState(-1)

  const activeOption =
    activeIndex >= 0 && activeIndex < matches.length ? matches[activeIndex] : undefined

  const handleQueryChange = (value: string): void => {
    setActiveIndex(-1)
    onQueryChange(value)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!hasResults) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length)
    } else if (event.key === 'Enter' && activeOption) {
      event.preventDefault()
      onChoose(activeOption.code)
    } else if (event.key === 'Escape') {
      setActiveIndex(-1)
    }
  }

  return (
    <div className="pg-search">
      <label className="pg-small pg-muted" htmlFor="pg-search-input">
        Search countries
      </label>
      <input
        id="pg-search-input"
        data-testid="search-input"
        type="search"
        value={query}
        placeholder="Type at least 2 characters"
        autoComplete="off"
        role="combobox"
        aria-expanded={hasResults}
        aria-autocomplete="list"
        aria-controls={hasResults ? 'pg-search-results' : undefined}
        aria-activedescendant={activeOption ? `pg-option-${activeOption.code}` : undefined}
        onKeyDown={onKeyDown}
        onChange={(event) => handleQueryChange(event.target.value)}
      />
      {hasResults && (
        <ul
          className="pg-suggestions"
          id="pg-search-results"
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA combobox listbox pattern; focus stays on the input via aria-activedescendant.
          role="listbox"
          data-testid="search-suggestions"
        >
          {matches.map((country, index) => (
            <li
              key={country.code}
              id={`pg-option-${country.code}`}
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: standard option role inside a combobox listbox.
              role="option"
              aria-selected={index === activeIndex}
              tabIndex={-1}
            >
              <button
                type="button"
                data-testid={`suggestion-${country.code}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onChoose(country.code)}
              >
                {country.commonName}
              </button>
            </li>
          ))}
        </ul>
      )}
      {active && matches.length === 0 && (
        <p
          className="pg-no-results pg-small"
          id="pg-search-results"
          role="status"
          data-testid="search-no-results"
        >
          No countries found
        </p>
      )}
    </div>
  )
}
