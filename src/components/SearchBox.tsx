import { useMemo } from 'react'
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
 */
export function SearchBox({ countries, query, onQueryChange, onChoose }: SearchBoxProps) {
  const matches = useMemo(() => searchCountries(countries, query), [countries, query])
  const active = query.trim().length >= 2

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
        aria-expanded={active && matches.length > 0}
        aria-controls="pg-search-results"
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {active && matches.length > 0 && (
        <ul
          className="pg-suggestions"
          id="pg-search-results"
          role="listbox"
          data-testid="search-suggestions"
        >
          {matches.map((country) => (
            <li key={country.code} role="option" aria-selected="false">
              <button
                type="button"
                data-testid={`suggestion-${country.code}`}
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
