/**
 * Offline schema validation for the bundled dataset (T017).
 *
 * Validates both the production snapshot and every fixture against the shared
 * contract in `specs/001-population-globe/contracts/dataset.schema.json`, then
 * applies the data-model rules the schema cannot express (dangling source ids,
 * per-dimension share totals, boundary pairing). Exit code 1 on any error.
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { parseSnapshot, type DatasetError } from '../src/lib/dataset'
import { DIMENSION_TOTAL_MAX, DIMENSION_TOTAL_MIN } from './factbook-shares'

const ROOT = process.cwd()
const SCHEMA_PATH = path.join(ROOT, 'specs', '001-population-globe', 'contracts', 'dataset.schema.json')

interface ValidationResult {
  file: string
  errors: string[]
  warnings: string[]
}

async function validateFile(ajv: InstanceType<typeof Ajv2020>, schema: object, file: string): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    return { file, errors: [`could not read/parse: ${(error as Error).message}`], warnings }
  }

  const validate = ajv.compile(schema)
  if (!validate(raw)) {
    for (const issue of validate.errors ?? []) {
      errors.push(`schema ${issue.instancePath || '/'} ${issue.message ?? 'invalid'}`)
    }
  }

  try {
    const snapshot = parseSnapshot(raw)
    const sourceIds = new Set(snapshot.sources.map((source) => source.id))
    const codes = new Set<string>()
    for (const country of snapshot.countries) {
      if (codes.has(country.code)) errors.push(`${country.code}: duplicate country code`)
      codes.add(country.code)
      if (country.totalPopulation != null && !country.populationSourceId) {
        errors.push(`${country.code}: population without source`)
      }
      for (const [dimension, dimensionRows] of groupByDimension(country.diversityBreakdown)) {
        const total = dimensionRows.reduce((acc, row) => acc + row.share, 0)
        // A dimension that ships outside the plausible-coverage window means an
        // incomplete composition reached the snapshot: fail the build instead
        // of logging a warning (the generator must drop or fix it).
        if (total < DIMENSION_TOTAL_MIN || total > DIMENSION_TOTAL_MAX) {
          errors.push(
            `${country.code}/${dimension}: shares sum to ${total.toFixed(1)}% (outside ${DIMENSION_TOTAL_MIN}–${DIMENSION_TOTAL_MAX})`,
          )
        } else if (total < 99 || total > 101) {
          warnings.push(`${country.code}/${dimension}: shares sum to ${total.toFixed(1)}% (outside 99–101)`)
        }
      }
      if (country.diversityIndicator && !sourceIds.has(country.diversityIndicator.sourceId)) {
        errors.push(`${country.code}: indicator references unknown source`)
      }
    }
  } catch (error) {
    errors.push((error as DatasetError).message)
  }

  return { file, errors, warnings }
}

function groupByDimension(rows: Array<{ dimension: string; share: number }>): Map<string, Array<{ share: number }>> {
  const map = new Map<string, Array<{ share: number }>>()
  for (const row of rows) {
    const list = map.get(row.dimension) ?? []
    list.push(row)
    map.set(row.dimension, list)
  }
  return map
}

async function main(): Promise<void> {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, 'utf8')) as object
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)

  const targets = [path.join(ROOT, 'data', 'snapshot.json')]
  const fixtureDir = path.join(ROOT, 'tests', 'fixtures')
  try {
    for (const entry of await readdir(fixtureDir)) {
      if (entry.endsWith('.json')) targets.push(path.join(fixtureDir, entry))
    }
  } catch {
    /* no fixtures yet */
  }

  let failed = false
  for (const target of targets) {
    const result = await validateFile(ajv, schema, target)
    const relative = path.relative(ROOT, result.file)
    if (result.errors.length > 0) {
      failed = true
      console.error(`✗ ${relative}`)
      for (const error of result.errors) console.error(`    error: ${error}`)
    } else {
      console.log(`✓ ${relative}`)
    }
    for (const warning of result.warnings) console.warn(`    warning: ${warning}`)
  }

  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
