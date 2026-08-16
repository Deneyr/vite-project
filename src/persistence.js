/**
 * Persistence layer for the character sheet.
 *
 * Design:
 * - Any element that should be saved/restored carries a `data-field="unique.id"`
 *   attribute. That's the ONLY thing a new field needs to participate in
 *   save/cancel/reload — no registry to update by hand elsewhere.
 * - Elements that represent a boolean toggle (pips, icon buttons, mastery
 *   marks, ...) additionally carry `data-field-type="toggle"`; their state is
 *   read/written via the `on` CSS class instead of `.value`.
 * - `collectState()` / `applyState()` are pure DOM <-> plain-object functions.
 * - `StorageAdapter` is the only place that knows about `localStorage`. A
 *   future file-based adapter (download/upload, or the File System Access
 *   API) only needs to implement the same save/load/clear shape and can be
 *   swapped in without touching collectState/applyState or main.js.
 */

const STORAGE_KEY = 'sorcier-sheet:v1'

function getFieldValue(el) {
  if (el.dataset.fieldType === 'toggle') {
    return el.classList.contains('on')
  }
  return el.value
}

function setFieldValue(el, value) {
  if (el.dataset.fieldType === 'toggle') {
    el.classList.toggle('on', Boolean(value))
    return
  }
  el.value = value ?? ''
  if (el.tagName === 'SELECT') {
    // Programmatic value changes don't fire 'change' on their own; some
    // selects (house) drive extra UI (shield art) off that event.
    el.dispatchEvent(new Event('change'))
  }
}

/** Reads every [data-field] element under `root` into a plain object. */
export function collectState(root = document) {
  const state = {}
  root.querySelectorAll('[data-field]').forEach((el) => {
    state[el.dataset.field] = getFieldValue(el)
  })
  return state
}

/** Writes a plain object of { fieldId: value } back onto the matching elements. */
export function applyState(state, root = document) {
  if (!state) return
  root.querySelectorAll('[data-field]').forEach((el) => {
    const key = el.dataset.field
    if (Object.prototype.hasOwnProperty.call(state, key)) {
      setFieldValue(el, state[key])
    }
  })
}

/** localStorage-backed storage. Swap this object out to change where saves live. */
export const StorageAdapter = {
  // Merges into whatever is already stored rather than replacing it wholesale.
  // This matters for fields that can be temporarily absent from the DOM (e.g.
  // a friend card hidden because Cœur went down) — their last known value
  // stays in storage instead of being wiped just because collectState()
  // didn't see them this time. Pass { replace: true } to opt out and force
  // a full overwrite instead.
  save(state, { replace = false } = {}) {
    try {
      const next = replace ? state : { ...(this.load() || {}), ...state }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return true
    } catch (err) {
      console.error('Sauvegarde impossible :', err)
      return false
    }
  },
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (err) {
      console.error('Lecture de la sauvegarde impossible :', err)
      return null
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error('Suppression de la sauvegarde impossible :', err)
    }
  },
}

/**
 * Triggers a browser download of the given state as a .json file.
 * Not wired to any button yet (the person asked to keep this for later),
 * but it's a ready-made building block for a future "Exporter" action —
 * same collectState() output, just a different destination than localStorage.
 */
export function downloadStateAsFile(state, filename = 'fiche-sorcier.json') {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Reads a user-selected .json file (e.g. from an <input type="file"> change
 * event) and resolves to the parsed state object. Building block for a
 * future "Importer" action, symmetrical to downloadStateAsFile().
 */
export function readStateFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
