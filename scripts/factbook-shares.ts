/**
 * Parsing of CIA World Factbook "People and Society" share strings.
 *
 * Extracted from `scripts/fetch-dataset.ts` so the range / modifier handling and
 * the per-dimension completeness guard are unit-testable without network access.
 *
 * Factbook share strings are messy: they contain ranges ("15-20%"), qualifiers
 * ("more than 95%", "approximately 15%", "other <1%"), HTML entities and, at
 * least once, a slash used as a decimal point ("Christian 93/1%"). A parser
 * that silently drops those rows produces materially incomplete compositions
 * that the app would otherwise render as if complete.
 */

export interface ParsedShare {
  groupName: string
  share: number
}

/** A parsed dimension (ethnic / religious / linguistic) within one country. */
export interface ParsedDimension {
  rows: ParsedShare[]
  total: number
}

/** A dimension whose rows sum outside this window is treated as unavailable. */
export const DIMENSION_TOTAL_MIN = 90
export const DIMENSION_TOTAL_MAX = 110

const NAMED_ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
  '&ccedil;': 'ç',
  '&eacute;': 'é',
  '&egrave;': 'è',
  '&iacute;': 'í',
  '&aacute;': 'á',
  '&agrave;': 'à',
  '&oacute;': 'ó',
  '&uacute;': 'ú',
  '&atilde;': 'ã',
  '&otilde;': 'õ',
  '&ntilde;': 'ñ',
  '&auml;': 'ä',
  '&ouml;': 'ö',
  '&uuml;': 'ü',
  '&szlig;': 'ß',
  '&ecirc;': 'ê',
  '&ocirc;': 'ô',
  '&ucirc;': 'û',
  '&ndash;': '–',
  '&mdash;': '—',
  '&rsquo;': '’',
  '&lsquo;': '‘',
}

/** Decode the HTML entities that appear in Factbook field text. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    // Unknown named entities are left intact rather than collapsed to a space,
    // so a missing mapping is visible in the data instead of silently changing
    // the label.
    .replace(/&[a-z]+;/gi, (entity) => NAMED_ENTITIES[entity.toLowerCase()] ?? entity)
}

/** Strip HTML tags/entities and collapse whitespace. */
export function stripHtml(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

const MODIFIER = /\b(?:approximately|about|around|nearly|roughly|over|under|more than|less than|up to|some)\b/gi
// A share token: `15`, `15.5`, `93/1` (slash decimal) or a leading-dot
// decimal such as `.06`.
const NUMBER = String.raw`(?:\d+(?:[./]\d+)?|\.\d+)`
const SHARE_PATTERN = new RegExp(String.raw`(${NUMBER})(?:\s*[-–]\s*(${NUMBER}))?\s*%`)

function parseNumeric(token: string): number {
  // A handful of Factbook entries use a slash as a decimal point (e.g. "93/1%").
  return Number(token.replace('/', '.'))
}

function cleanGroupName(raw: string): string {
  return raw
    .replace(MODIFIER, ' ')
    .replace(/[<>]/g, ' ')
    .trim()
    // Factbook text carries conjunction prefixes, a trailing tilde used as
    // "approximately", unmatched closing parentheses and full stops. Left in
    // place they ship as malformed group names (e.g. "and other", "Arab ~").
    .replace(/^(?:and|or|the|of|with|including)\s+/i, '')
    .replace(/[~.)\s–-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse a Factbook "Ethnic groups" / "Religions" / "Languages" string into
 * named shares. Ranges take the midpoint; `more/less than` take the bound.
 */
export function parseShares(text: string): ParsedShare[] {
  const clean = stripHtml(text).replace(/\([^)]*\)/g, ' ')
  const rows: ParsedShare[] = []
  for (const segment of clean.split(/[;,]/)) {
    const trimmed = segment.trim()
    if (!trimmed) continue
    const match = SHARE_PATTERN.exec(trimmed)
    if (!match || match.index == null) continue
    const low = parseNumeric(match[1]!)
    const high = match[2] ? parseNumeric(match[2]) : low
    if (!Number.isFinite(low) || !Number.isFinite(high)) continue
    const share = (low + high) / 2
    if (share <= 0 || share > 100) continue
    const groupName = cleanGroupName(trimmed.slice(0, match.index))
    if (!groupName) continue
    rows.push({ groupName, share: Math.round(share * 10) / 10 })
  }
  return rows
}

/** Sum the parsed shares of one dimension. */
export function dimensionTotal(rows: ParsedShare[]): number {
  return rows.reduce((total, row) => total + row.share, 0)
}

/**
 * A dimension is only safe to render when its parsed shares plausibly describe
 * a whole composition. Rows for a partial field (e.g. Russia's "practicing
 * worshipers" religions) or a multi-response language census (Tokelau at 182%)
 * fall outside the window and are dropped so the UI shows "not available"
 * instead of a wrong breakdown.
 */
export function isPlausibleDimension(rows: ParsedShare[]): boolean {
  if (rows.length === 0) return false
  const total = dimensionTotal(rows)
  return total >= DIMENSION_TOTAL_MIN && total <= DIMENSION_TOTAL_MAX
}
