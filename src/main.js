import './style.css'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
<div class="dashboard-shell">
  <header class="sheet-header">
    <div class="title-block">
      <div class="title-meta">
        <span class="persona-label">Personnage</span>
        <div class="main-title">
          <span>Tu es un</span>
          <strong>SORCIER</strong>
        </div>
        <div class="character-grid">
          <div class="character-row editable-row">
            <label>Joueuse / joueur</label>
            <input class="input-field" type="text" value="Aria Valion" />
          </div>
          <div class="character-row editable-row">
            <label>Table</label>
            <input class="input-field" type="text" value="L’Académie" />
          </div>
          <div class="character-row editable-row">
            <label>Époque</label>
            <input class="input-field" type="text" value="Renaissance magique" />
          </div>
        </div>
      </div>
      <button id="toggle-edit" class="toggle-edit">Edit</button>
    </div>

    <div class="right-panel">
      <div class="shield-card">
        <svg class="shield-icon" viewBox="0 0 84 100" aria-hidden="true">
          <path d="M42 4 L74 18 L74 52 C74 74 58 92 42 98 C26 92 10 74 10 52 L10 18 Z" fill="none" stroke="currentColor" stroke-width="5"/>
          <path d="M42 20 L42 62" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          <path d="M42 74 c-10 -10 -10 -18 0 -28 c10 10 10 18 0 28" fill="none" stroke="currentColor" stroke-width="4"/>
          <circle cx="42" cy="40" r="6" fill="currentColor"/>
        </svg>
        <div>
          <span>Action de Maître</span>
          <strong>+5</strong>
        </div>
      </div>
      <div class="status-cards">
        <div class="status-chip">
          <span>Année scolaire</span>
          <strong>en cours</strong>
        </div>
        <div class="status-chip">
          <span>B.U.S.E.</span>
          <strong>A.S.P.I.C.</strong>
        </div>
      </div>
    </div>
  </header>

  <section class="core-shell">
    <div class="center-forest">
      <div class="triangle-backdrop"></div>
      <div class="circle-center">
        <div class="circle-label">MAGIE</div>
        <input class="center-input" type="number" value="16" min="0" />
      </div>
      <div class="node node-top">
        <svg class="node-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 8 L38 28 L60 28 L42 40 L48 60 L32 48 L16 60 L22 40 L4 28 L26 28 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        </svg>
        <div class="node-copy">
          <input class="node-value" type="number" value="14" min="0" />
          <span>Esprit</span>
          <small>Mental</small>
        </div>
      </div>
      <div class="node node-left">
        <svg class="node-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 54s22-14 22-28S40 8 32 8 10 18 10 26s22 28 22 28Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        </svg>
        <div class="node-copy">
          <input class="node-value" type="number" value="12" min="0" />
          <span>Cœur</span>
          <small>Social</small>
        </div>
      </div>
      <div class="node node-right">
        <svg class="node-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M16 16h32v20L32 52 16 36V16Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
          <path d="M24 16v-6h16v6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <div class="node-copy">
          <input class="node-value" type="number" value="13" min="0" />
          <span>Corps</span>
          <small>Physique</small>
        </div>
      </div>
      <div class="triangle-lines">
        <div class="connector connector-top"></div>
        <div class="connector connector-left"></div>
        <div class="connector connector-right"></div>
      </div>
    </div>
    <div class="core-notes">
      <div class="core-touch">
        <label class="field-label" for="ambition">Ambition</label>
        <textarea id="ambition" class="textarea-field">Découvrir l’ancien savoir des sorciers et changer le destin du monde.</textarea>
      </div>
      <div class="core-touch small">
        <label class="field-label" for="wakepoints">Points d’éveil</label>
        <input id="wakepoints" class="input-field" type="number" value="5" min="0" />
      </div>
    </div>
  </section>

  <section class="bottom-grid">
    <article class="panel panel-left">
      <div class="panel-title">
        <span>Sortilèges</span>
        <strong>Liste</strong>
      </div>
      <textarea class="textarea-field" rows="5">Éclair silencieux
Barrière d’ombre
Transmutation lunaire
Portail d’éther</textarea>
    </article>

    <article class="panel panel-right">
      <div class="panel-title">
        <span>Possessions</span>
        <strong>Équipement</strong>
      </div>
      <textarea class="textarea-field" rows="4">Grimoire ancien, baguette d’onyx, cape d’invisibilité, orbe des rêves, potion de régénération.</textarea>
      <button id="counter" type="button" class="counter">Points d’action</button>
    </article>
  </section>
</div>
`

setupCounter(document.querySelector('#counter'))

const toggleEditBtn = document.querySelector('#toggle-edit')
const editableFields = Array.from(document.querySelectorAll('.input-field, .textarea-field, .center-input, .node-value'))
let readonlyMode = true

const setReadonly = (readonly) => {
  readonlyMode = readonly
  editableFields.forEach((field) => {
    field.readOnly = readonly
    field.classList.toggle('readonly-field', readonly)
  })
  toggleEditBtn.textContent = readonly ? 'Edit' : 'Lock'
}

toggleEditBtn.addEventListener('click', () => setReadonly(!readonlyMode))

setReadonly(true)
