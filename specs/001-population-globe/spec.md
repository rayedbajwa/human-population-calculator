# Feature Specification: Population Globe

**Scope**: mvp
**Feature Branch**: `001-population-globe` · **Created**: 2026-10-01 · **Status**: Draft
**Input**: "Create a web ui with globe of populations diveristy"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore world population on an interactive globe (Priority: P1)

A visitor opens the web page and sees a three-dimensional globe representing the world. They rotate and zoom it with a mouse, trackpad or touch, and each country is shaded by its total population. Hovering or selecting a country reveals its name and population figure.

**Why P1**: It is the core idea of the request — population made spatially understandable at a glance.

**Independent test**: Load the page on a desktop browser: a globe renders, countries are shaded by population, a legend is visible, and selecting a country shows its population.

**Acceptance Scenarios**:

1. **Given** a visitor opens the application, **When** the page finishes loading, **Then** a rotatable globe is displayed with every country in the dataset shaded according to its total population and a visible legend mapping colours to population ranges.
2. **Given** the globe is displayed, **When** the visitor drags or swipes across it, **Then** the globe rotates smoothly and continues to show all shaded countries.
3. **Given** the globe is displayed, **When** the visitor selects a country, **Then** a detail panel opens showing the country name, total population, and the reference year of the data.
4. **Given** the globe is displayed, **When** the visitor scrolls or pinches, **Then** the view zooms in or out without losing the current selection.
5. **Given** the page has just loaded and the visitor has not interacted, **When** they look at the globe, **Then** an on-screen hint explains how to rotate, zoom and select a country.
6. **Given** a country with a population over one million is selected, **When** the detail panel opens, **Then** the exact number is shown with thousands separators and an approximate short form is shown alongside it.

### User Story 2 - Understand population diversity per country (Priority: P1)

Once a country is selected, the visitor sees how its population is composed — the main ethnic, linguistic or religious groups and their approximate shares — together with a single diversity indicator that summarises how mixed the country is. Countries where this data is not available are clearly marked rather than shown as empty or zero.

**Why P1**: "Populations diversity" is the distinguishing idea of the request; without it the feature is just a population map.

**Independent test**: Select a country with known diversity data and confirm the breakdown shares and indicator are shown with a source and year; select a country without such data and confirm an explicit "not available" state.

**Acceptance Scenarios**:

1. **Given** a selected country has diversity data, **When** the detail panel opens, **Then** it lists the named groups and their percentage shares, and displays a diversity indicator with its scale and reference year.
2. **Given** a selected country has no diversity data, **When** the detail panel opens, **Then** it shows an explicit "diversity data not available" message and no indicator, and the population figure is still shown.
3. **Given** the detail panel shows figures, **When** the visitor looks for provenance, **Then** the data source name is visible for both the population and the diversity data.

### User Story 3 - Find a specific country quickly (Priority: P1)

A visitor who already has a country in mind types its name into a search field and the globe focuses on that country, opening its detail panel, instead of having to rotate the globe to find it.

**Why P1**: Without search the globe is hard to navigate for small or unfamiliar countries, which would make the MVP impractical.

**Independent test**: Type a country name, choose it from the results, and confirm the globe centres on it with the detail panel open.

**Acceptance Scenarios**:

1. **Given** the search field is visible, **When** the visitor types at least two characters, **Then** matching country names are suggested.
2. **Given** suggestions are shown, **When** the visitor chooses one, **Then** the globe focuses on that country and its detail panel opens.
3. **Given** the visitor types a term that matches no country, **When** results are evaluated, **Then** a clear "no countries found" message is shown and the globe is unchanged.

### Edge Cases

- A country has no recorded population → shown as "no data", excluded from the population shading legend, and still searchable.
- A country has population but no diversity data → population and year shown, diversity section shows an explicit unavailable state.
- A territory or very small country is too small to click → still reachable through search and highlighted when focused.
- Disputed or overlapping territories → a single documented country list is used consistently, and the list's source is disclosed.
- Data fails to load or the network is slow → a clear error state with a retry action; the page does not appear blank or broken.
- A visitor has reduced-motion enabled → automatic spinning is disabled; manual rotation still works.
- Touch-only device → tap selects a country and pinch zooms, with no control hidden behind hover.
- Duplicate or accented country names → search matches both the local and common name.
- Window resized or rotated → layout reflows without horizontal scrolling and controls remain reachable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an interactive 3D globe of the world on a web page that visitors can rotate and zoom.
- **FR-002**: System MUST shade every country with available data according to its total population and MUST show a legend mapping shading to population ranges.
- **FR-003**: Users MUST be able to select a country on the globe and see a detail panel with its name, total population, and data reference year.
- **FR-004**: System MUST show, for a selected country, the breakdown of its population by named ethnic, linguistic or religious groups, with percentage shares, when such data exists.
- **FR-005**: System MUST display a single diversity indicator per country, with its scale and reference year, when such data exists.
- **FR-006**: System MUST provide a search field that suggests matching countries after at least two characters and focuses the globe on the chosen country.
- **FR-007**: System MUST display the data source name and reference year for all population and diversity figures shown.
- **FR-008**: System MUST render an explicit "data not available" state for any missing population or diversity value, and MUST NOT display zero or blank as if it were a real value.
- **FR-009**: System MUST indicate how to interact with the globe (rotate, zoom, select) on first use.
- **FR-010**: System MUST be usable on current desktop and mobile browsers, with controls reachable at viewport widths from 360px to 1920px.
- **FR-011**: System MUST format population figures with thousands separators and, for values over one million, an approximate short form alongside the exact number.
- **FR-012**: System MUST default to a whole-world view at the most recent reference year available in the dataset.
- **FR-013**: System MUST keep the last selected country and search state when the browser window is resized or the device is rotated.
- **FR-014**: System MUST show a clear error state with a retry action if population data cannot be loaded or rendered.

### Out of Scope (this increment)

- User accounts, sign-in and saved views.
- Editing or uploading population data.
- Historical time series, future projections and "what-if" population calculation.
- Subnational, city or cohort-level detail.
- Exporting or printing reports.
- Offline / installable app behaviour.
- Additional languages beyond English.
- Detailed statistical significance or confidence intervals for diversity figures.

### Key Entities *(if the feature involves data)*

- **Country**: A sovereign state or territory; attributes: name, common name, country code, region, total population, reference year, data source.
- **Diversity Breakdown**: The composition of one country's population; attributes: country, dimension (ethnic / linguistic / religious), group name, share percentage, data source, reference year.
- **Diversity Indicator**: A single summary score of how mixed a country is; attributes: country, indicator name, value, scale/minimum/maximum, data source, reference year.
- **Dataset Snapshot**: The fixed set of country and diversity figures the application serves; attributes: source, reference year, retrieval date, version.

### Dependencies

- A published, citable population and diversity dataset (for example UN or World Bank) must be available and captured as a versioned snapshot before the globe can show real figures.
- The interface depends on current desktop and mobile browsers supporting interactive 3D rendering; older browsers may receive a reduced or unavailable experience.

## Success Criteria *(mandatory)*

- **SC-001**: A first-time visitor can identify the world's most populous country within 60 seconds of opening the page, without external instructions.
- **SC-002**: Selecting a country shows its population and diversity summary within 2 seconds.
- **SC-003**: 95% of countries in the dataset render with population shading on first load.
- **SC-004**: At least 95% of valid country searches return a matching suggestion within 1 second.
- **SC-005**: A first-time visitor can rotate, zoom and select a country using only on-screen hints, succeeding on the first attempt at least 90% of the time in usability checks.
- **SC-006**: The page remains fully usable, with no horizontal scrolling and all controls reachable, at viewport widths of 360px, 768px, 1280px and 1920px.
- **SC-007**: Every displayed figure is traceable to a named source and reference year within the same view (no figure is shown without provenance).

## Assumptions

- "Populations diversity" means both the total population per country and each country's demographic composition; the feature shows both. This was chosen as the most useful reading of an ambiguous phrase.
- Data comes from authoritative public population datasets (for example UN or World Bank) captured as a versioned snapshot; no live third-party calls are required for the MVP, so the globe works from a bundled dataset.
- The reference year is the most recent year present in the snapshot; there is no year selector in the MVP.
- The audience is the general public and no sign-in is required; no personal data is collected.
- The interface is in English only for the MVP.
- Country boundaries and the country list follow the chosen dataset's documented list, including its treatment of territories and disputed areas.
- "Diversity indicator" uses whatever established index the chosen dataset publishes (for example an ethnic, linguistic or religious fractionalisation index); the exact index name is recorded from the source rather than invented.
- Where a country has no population figure at all, it is still selectable and visible, but marked as "no data".
- A reasonable default of a high-contrast, colour-blind-safe shading palette is assumed without further input.
