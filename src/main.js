import './style.css'
import portraitImg from './assets/portrait.svg'
import gryffImg from './assets/Gryffondor.png'
import serpImg from './assets/Serpentard.png'
import poufImg from './assets/Poufsouffle.png'
import serdImg from './assets/Serdaigle.png'
import { collectState, applyState, StorageAdapter } from './persistence.js'

const houseImages = {
  griffondor: gryffImg,
  serpentard: serpImg,
  poufsouffle: poufImg,
  serdaigle: serdImg,
}

/* ---------- data ---------- */

const mainCourses = [
  'Astronomie',
  'Botanique',
  'Défense contre les forces du Mal',
  'Enchantement',
  'Histoire de la Magie',
  'Métamorphose',
  'Potions',
  'Vol',
]

const secondaryCourses = [
  'Arithmancie',
  'Divination',
  'Étude des Moldus',
  'Étude des Runes',
  'Soins aux créatures magiques',
]

const espritSkillsLeft = ['Bluff', 'Farce', 'Tactique', 'Rumeur']
const espritSkillsRight = ['Bagarre', 'Endurance', 'Perception', 'Précision']
const coeurCorpsSkills = ['Décorum', 'Discrétion', 'Persuasion', 'Romance']

const PIPS_PER_SKILL = 5

// Course rank track: filled-pip-count -> malus/bonus, per "Nul(-2) / Moyen(0)
// / Bon(2) / Excellent(4) / Génie(6)". At least 1 pip is always filled (0 is
// not a valid state — you're never worse than "Nul"), so table[0] is unused
// padding and the real range is index 1..5.
const COURSE_MALUS_TABLE = [-2, -2, 0, 2, 4, 6]
const COURSE_NEG_PIP_COUNT = 2 // the first N pips only ever reach a <= 0 malus
const COURSE_MIN_FILLED = 1 // a course can never have zero pips filled

/* ---------- helpers ---------- */

// Turns "Défense contre les forces du Mal" into "defense-contre-les-forces-du-mal".
// Used to build stable, readable data-field ids from human labels.
const slugify = (str) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const formatMalus = (value) => (value > 0 ? `+${value}` : `${value}`)

/* ---------- small render helpers ---------- */

const diamond = (fieldId, extraClass = '', on = false) =>
  `<button type="button" class="diamond${extraClass ? ` ${extraClass}` : ''}${on ? ' on' : ''}" aria-label="rang" data-field="${fieldId}" data-field-type="toggle"></button>`

const pipRow = (fieldBase, count = PIPS_PER_SKILL) =>
  `<div class="pip-row">${Array.from({ length: count }, (_, i) =>
    diamond(`${fieldBase}.pip.${i}`, i < COURSE_NEG_PIP_COUNT ? 'diamond-neg' : '', i < COURSE_MIN_FILLED)
  ).join('')}</div>`

const skillRow = (name) => `
  <li class="skill-row">
    <span class="skill-name">${name}</span>
    ${pipRow(`skill.${slugify(name)}`)}
    <span class="skill-malus">${formatMalus(COURSE_MALUS_TABLE[COURSE_MIN_FILLED])}</span>
  </li>
`

const subItem = (name) => `
  <div class="substat"><span>${name}</span><input class="substat-input" type="number" min="0" data-field="substat.${slugify(name)}" /></div>
`

const bookIcon = () => `
  <svg viewBox="0 0 24 24"><path d="M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4Z"/><path d="M20 4h-7a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20Z"/></svg>
`

const boltIcon = () => `
  <svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z" stroke-linejoin="round"/></svg>
`

const diceIcon = () => `
  <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none"/></svg>
`

const flaskIcon = () => `
  <svg viewBox="0 0 24 24"><path d="M9 2v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-11V2"/><path d="M9 2h6"/><path d="M6.5 15h11"/></svg>
`

const chessIcon = () => `
  <svg viewBox="0 0 24 24"><path d="M9 20h6"/><path d="M8 20l1-6h6l1 6"/><path d="M9.5 14c-1-2 0-3.5 1-4.5s1-2 0-3"/><path d="M13.5 14c1-2 0-3.5-1-4.5s-1-2 0-3"/><circle cx="12" cy="4.5" r="1.6"/></svg>
`

const personIcon = () => `
  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6"/></svg>
`

const wandIcon = () => `
  <svg viewBox="0 0 24 24"><path d="M3 21 14 10" stroke-linecap="round"/><path d="M17 2l1.1 2.9L21 6l-2.9 1.1L17 10l-1.1-2.9L13 6l2.9-1.1Z" stroke-linejoin="round"/><path d="M14.5 3.2v1.8M19.5 8.5h1.8" stroke-linecap="round"/></svg>
`

// `id` is a stable key for persistence — independent from the title text,
// so renaming a grimoire later won't orphan its saved notes/counters.
const grimoireCard = (id, title, used = 0, total = 10) => `
  <article class="grimoire-card">
    <div class="grimoire-title">
      <span class="grimoire-title-line"></span>
      <input class="line-input grimoire-title-input" type="text" value="${title}" style="width: ${title.length + 2}ch" data-field="grimoire.${id}.title" />
      <span class="grimoire-title-line"></span>
    </div>
    <textarea class="grimoire-notes" rows="6" placeholder="" data-field="grimoire.${id}.notes"></textarea>
    <div class="grimoire-footer">
      <div class="grimoire-badge">${bookIcon()}</div>
      <div class="grimoire-ticket">
        <input class="mini-input grimoire-ticket-input" type="number" value="${used}" min="0" data-field="grimoire.${id}.used" />
        <span>/</span>
        <input class="mini-input grimoire-ticket-input" type="number" value="${total}" min="0" data-field="grimoire.${id}.total" />
      </div>
      <span class="grimoire-footer-line"></span>
    </div>
  </article>
`

/* ---------- markup ---------- */

document.querySelector('#app').innerHTML = `
<div class="sheet-shell">

  <header class="title-banner">
    <span class="eyebrow">Tu es un</span>
    <h1>Sorcier</h1>
    <div class="edit-controls">
      <button id="toggle-edit" class="toggle-edit">Édition</button>
      <button id="save-edit" class="toggle-edit save-edit" hidden>Sauvegarder</button>
      <button id="cancel-edit" class="toggle-edit cancel-edit" hidden>Annuler</button>
    </div>
  </header>

  <div class="tabs-bar">
    <button type="button" class="tab-button active" data-tab="overview">Fiche</button>
    <button type="button" class="tab-button" data-tab="bibliotheque">Bibliothèque</button>
    <button type="button" class="tab-button" data-tab="relations">Relations</button>
    <button type="button" class="tab-button" data-tab="constellations">Constellations</button>
    <button type="button" class="tab-button" data-tab="familiers">Familiers</button>
  </div>

  <div class="tabs-content">
    <section class="tab-panel active" data-tab="overview">

      <section class="top-grid">
        <div class="parchment-block character-block">
          <div class="character-top">
            <div class="character-info">
              <span class="block-label">Personnage</span>
              <div class="identity-main">
                <div class="field-row">
                  <span>Nom</span>
                  <div class="name-with-sex">
                    <input class="input-field" type="text" value="Aria Valion" data-field="identity.nom" />
                    <select class="sex-select" aria-label="Sexe" data-field="identity.sexe">
                      <option value="F" selected>♀</option>
                      <option value="M">♂</option>
                      <option value="A">?</option>
                    </select>
                  </div>
                </div>
                <div class="field-row"><span>Table</span><input class="input-field" type="text" value="L’Académie" data-field="identity.table" /></div>
                <div class="field-row"><span>Époque</span><input class="input-field" type="text" value="Renaissance magique" data-field="identity.epoque" /></div>
                <div class="field-row ambition-field-row">
                  <span>Ambition</span>
                  <textarea class="line-input textarea-field" rows="2" data-field="identity.ambition">Découvrir l’ancien savoir des sorciers et changer le destin du monde.</textarea>
                </div>
              </div>
            </div>
            <div class="character-portrait">
              <div class="portrait-frame">
                  <div class="portrait-placeholder">
                    <img src="${portraitImg}" alt="Portrait d'exemple" />
                  </div>
              </div>
            </div>
          </div>
          <div class="identity-side">
            <div class="sub-section origin-block">
              <span class="block-label">Origine</span>
              <div class="origin-options">
                <label class="origin-choice"><span class="diamond origin-pip on" data-field="origin.pip.0" data-field-type="toggle"></span>Né-Moldu</label>
                <label class="origin-choice"><span class="diamond origin-pip" data-field="origin.pip.1" data-field-type="toggle"></span>Sang-Mêlé</label>
                <label class="origin-choice"><span class="diamond origin-pip" data-field="origin.pip.2" data-field-type="toggle"></span>Sang-Pur</label>
              </div>
            </div>
            <div class="sub-section school-block">
              <span class="block-label">Année scolaire</span>
              <div class="school-status">
                <span class="school-status-text">en cours</span>
                <select class="year-input" aria-label="Année scolaire en cours" data-field="school.year">
                  <option value="1" selected>1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </div>
              <div class="track-row">
                <span>B.U.S.E</span>
                <div class="track-split">
                  <input class="mini-input" type="number" min="0" value="" data-field="school.buse.1" />
                  <span class="track-sep">/</span>
                  <input class="mini-input" type="number" min="0" value="" data-field="school.buse.2" />
                </div>
              </div>
              <div class="track-row">
                <span>A.S.P.I.C</span>
                <div class="track-split">
                  <input class="mini-input" type="number" min="0" value="" data-field="school.aspic.1" />
                  <span class="track-sep">/</span>
                  <input class="mini-input" type="number" min="0" value="" data-field="school.aspic.2" />
                </div>
              </div>
            </div>
            <div class="sub-section wand-block">
              <div class="wand-header">
                <span class="wand-badge">${wandIcon()}</span>
                <span class="block-label">Baguette magique</span>
              </div>
              <div class="wand-fields">
                <div class="field-row"><span>Bois</span><input class="input-field" type="text" value="Houx" data-field="wand.bois" /></div>
                <div class="field-row"><span>Cœur</span><input class="input-field" type="text" value="Plume de phénix" data-field="wand.coeur" /></div>
                <div class="field-row"><span>Taille</span><input class="input-field" type="number" value="28" min="0" data-field="wand.taille" /></div>
              </div>
            </div>
          </div>
        </div>

          <div class="parchment-block house-block griffondor">
          <div class="house-shield">
            <img class="shield-icon" src="${houseImages.griffondor}" alt="Blason de maison" />
            <select class="house-select" aria-label="Choisir le blason de maison" data-field="house.select">
              <option value="griffondor" selected>Gryffondor</option>
              <option value="serpentard">Serpentard</option>
              <option value="poufsouffle">Poufsouffle</option>
              <option value="serdaigle">Serdaigle</option>
            </select>
          </div>
          <div class="house-action">
            <span>Action de Maison</span>
            <div class="mini-input always-readonly action-value" aria-hidden="true">+5</div>
          </div>
          <div class="points-eveil">
            <span class="points-title">Points d’éveil</span>
            <div class="points-grid">
              <div class="points-column">
                <div class="points-value"><input class="mini-input" type="number" value="3" min="0" data-field="house.points.restant" /></div>
                <div class="points-label">Restant</div>
              </div>
              <div class="points-column">
                <div class="points-value"><input class="mini-input" type="number" value="2" min="0" data-field="house.points.depense" /></div>
                <div class="points-label">Dépensé</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="skills-and-core">
        <div class="skills-col">
          <ul class="skill-list">
            ${mainCourses.map(skillRow).join('')}
          </ul>
          <p class="skill-note">1ère &amp; 2nde année : 7 cours principaux + vol<br>3ème année : 2 cours secondaires au choix minimum<br>Nul (-2) / Moyen (0) / Bon (2) / Excellent (4) / Génie (6)</p>
          <ul class="skill-list">
            ${secondaryCourses.map(skillRow).join('')}
          </ul>
        </div>

        <div class="core-triangle">
          <div class="side-list left">
            ${espritSkillsLeft.map(subItem).join('')}
          </div>

          <div class="triangle-frame">
            <svg class="triangle-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path class="edge-line" d="M30 16 L-15 90" />
              <path class="edge-line" d="M30 16 L75 90" />
              <path class="edge-line" d="M-15 90 L75 90" />
              <line class="spoke-line" x1="30" y1="16" x2="30" y2="65" />
              <line class="spoke-line" x1="-15" y1="90" x2="30" y2="65" />
              <line class="spoke-line" x1="75" y1="90" x2="30" y2="65" />
            </svg>

            <div class="node-circle node-esprit">
              <div>
                <div class="node-sub">mental</div>
                <div class="node-label">Esprit</div>
                <input class="stat-input" type="number" value="14" min="0" data-field="core.esprit" />
              </div>
            </div>

            <div class="node-circle node-magie">
              <div>
                <div class="node-label">Magie</div>
                <input class="stat-input" type="number" value="16" min="0" data-field="core.magie" />
              </div>
            </div>

            <div class="node-circle node-coeur">
              <div>
                <div class="node-sub">social</div>
                <div class="node-label">Cœur</div>
                <input class="stat-input" type="number" value="12" min="0" data-field="core.coeur" />
              </div>
            </div>

            <div class="node-circle node-corps">
              <div>
                <div class="node-sub">physique</div>
                <div class="node-label">Corps</div>
                <input class="stat-input" type="number" value="13" min="0" data-field="core.corps" />
              </div>
            </div>

            <div class="edge-icon icon-top">${bookIcon()}</div>
            <div class="edge-icon icon-left">${personIcon()}</div>
            <div class="edge-icon icon-right">${boltIcon()}</div>
          </div>

          <div class="side-list right">
            ${espritSkillsRight.map(subItem).join('')}
          </div>

          <div class="sub-row bottom">
            <div class="sub-column">
              ${coeurCorpsSkills.slice(0, 2).map(subItem).join('')}
            </div>
            <div class="sub-column">
              ${coeurCorpsSkills.slice(2).map(subItem).join('')}
            </div>
          </div>
        </div>

        <div class="traits-panel">
          <span class="block-label">Traits</span>
          <div class="traits-list">
            ${Array.from({ length: 7 }, (_, i) => `<div class="trait-line"><input class="trait-input" type="text" title="" data-field="traits.${i}" /></div>`).join('')}
          </div>
        </div>
        <p class="traits-note">1d20 + Caract. Principale + Compétence
          <br>Relance = Caract. Secondaire · Score Magie ajouté quand utilisée · Double 1 = Catastrophe</p>
      </section>

      <section class="trackers-row">
        <div class="tracker erudition">
          <span class="tracker-label">Érudition</span>
          <div class="tracker-icons">
            ${Array.from({ length: 5 }, (_, i) => `<button type="button" class="icon-toggle" data-field="erudition.${i}" data-field-type="toggle">${bookIcon()}</button>`).join('')}
          </div>
        </div>
        <div class="tracker energie">
          <div class="tracker-icons">
            ${Array.from({ length: 4 }, (_, i) => `<button type="button" class="icon-toggle" data-field="energie.${i}" data-field-type="toggle">${boltIcon()}</button>`).join('')}
          </div>
          <span class="tracker-label">Énergie</span>
        </div>
      </section>

      <section class="bottom-grid">
        <article class="panel spells-panel">
          <div class="panel-title">Sortilèges</div>
          <ul class="spell-list">
            ${[
    'Éclair silencieux',
    'Barrière d’ombre',
    'Transmutation lunaire',
    'Portail d’éther',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]
    .map(
      (v, i) => `
              <li class="spell-row">
                <button type="button" class="diamond" aria-label="maîtrisé" data-field="spell.${i}.mastered" data-field-type="toggle"></button>
                <input class="line-input" type="text" value="${v}" data-field="spell.${i}.name" />
              </li>`
    )
    .join('')}
          </ul>
          <p class="spell-note"><span class="diamond on" style="pointer-events:none"></span> si sortilège est maîtrisé</p>
        </article>

        <article class="panel possessions-panel">
          <div>
            <div class="panel-title">Possessions</div>
            <textarea class="textarea-field" rows="5" data-field="possessions.items">Grimoire ancien, baguette d’onyx, cape d’invisibilité, orbe des rêves, potion de régénération.</textarea>
            <div class="pages-block">
              <div class="panel-title">Pages</div>
              <textarea class="textarea-field" placeholder="Notes, journal, pages arrachées du grimoire..." data-field="possessions.pages"></textarea>
            </div>
          </div>
        </article>
      </section>
    </section>
    <section class="tab-panel" data-tab="bibliotheque">
      <div class="grimoire-grid">
        ${grimoireCard('bibliotheque', 'Bibliothèque', 3, 10)}
        ${grimoireCard('grimoire-des-sortileges', 'Grimoire des Sortilèges', 5, 12)}
        ${grimoireCard('carnet-de-recherche', 'Carnet de Recherche', 1, 6)}
        ${grimoireCard('almanach-celeste', 'Almanach Céleste', 0, 8)}
      </div>
    </section>
    <section class="tab-panel" data-tab="relations">
      <div class="placeholder-panel">
        <div class="placeholder-title">Relations</div>
        <p>Contenu de l’onglet Relations à compléter ici pour les alliés, rivaux et contacts.</p>
      </div>
    </section>
    <section class="tab-panel" data-tab="constellations">
      <div class="placeholder-panel">
        <div class="placeholder-title">Constellations</div>
        <p>Contenu de l’onglet Constellations à compléter ici pour les cartes célestes et signes.</p>
      </div>
    </section>
    <section class="tab-panel" data-tab="familiers">
      <div class="placeholder-panel">
        <div class="placeholder-title">Familiers</div>
        <p>Contenu de l’onglet Familiers à compléter ici pour les créatures et compagnons.</p>
      </div>
    </section>
  </div>
</div>
`

/* ---------- behaviour ---------- */

// Recomputes and displays a course's malus/bonus from its filled pip count.
const updateCourseMalus = (row) => {
  const malusEl = row.querySelector('.skill-malus')
  if (!malusEl) return
  const filled = row.querySelectorAll('.pip-row .diamond.on').length
  const value = COURSE_MALUS_TABLE[Math.min(Math.max(filled, COURSE_MIN_FILLED), COURSE_MALUS_TABLE.length - 1)]
  malusEl.textContent = formatMalus(value)
  malusEl.classList.toggle('positive', value > 0)
}

// Guards against a course ending up with 0 filled pips — including a saved
// state from before this rule existed, which could still have 0 stored.
// Re-run after any bulk state change (initial load, cancel) to self-heal.
const enforceMinimumCoursePips = () => {
  document.querySelectorAll('.pip-row').forEach((row) => {
    const pips = row.querySelectorAll('.diamond')
    const filledCount = row.querySelectorAll('.diamond.on').length
    if (filledCount < COURSE_MIN_FILLED) {
      for (let i = 0; i < COURSE_MIN_FILLED && i < pips.length; i += 1) {
        pips[i].classList.add('on')
      }
    }
  })
}

// clickable pips (skill ranks / spell mastery) toggle fill up to the clicked pip
document.querySelectorAll('.pip-row').forEach((row) => {
  const pips = Array.from(row.querySelectorAll('.diamond'))
  const skillRowEl = row.closest('.skill-row')
  pips.forEach((pip, index) => {
    pip.addEventListener('click', () => {
      if (readonlyMode) return
      const alreadyFull = pip.classList.contains('on') && (pips[index + 1] ? !pips[index + 1].classList.contains('on') : true)
      const targetCount = alreadyFull ? index : index + 1
      const clampedCount = Math.max(targetCount, COURSE_MIN_FILLED)
      pips.forEach((p, i) => p.classList.toggle('on', i < clampedCount))
      if (skillRowEl) updateCourseMalus(skillRowEl)
    })
  })
})

// single mastery pip per spell just toggles on/off
document.querySelectorAll('.spell-row .diamond').forEach((pip) => {
  pip.addEventListener('click', () => {
    if (readonlyMode) return
    pip.classList.toggle('on')
  })
})

// origin: single-select among the three choices
const originPips = document.querySelectorAll('.origin-pip')
originPips.forEach((pip) => {
  pip.addEventListener('click', () => {
    if (readonlyMode) return
    originPips.forEach((p) => p.classList.remove('on'))
    pip.classList.add('on')
  })
})

const houseBlock = document.querySelector('.house-block')
const houseSelect = document.querySelector('.house-select')
if (houseSelect) {
  houseSelect.addEventListener('change', () => {
    houseBlock.classList.remove('griffondor', 'serpentard', 'poufsouffle', 'serdaigle')
    houseBlock.classList.add(houseSelect.value)
    const shieldImg = houseBlock.querySelector('.shield-icon')
    if (shieldImg && houseImages[houseSelect.value]) {
      shieldImg.src = houseImages[houseSelect.value]
    }
  })
}

const tabButtons = document.querySelectorAll('.tab-button')
const tabPanels = document.querySelectorAll('.tab-panel')
if (tabButtons.length && tabPanels.length) {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab
      tabButtons.forEach((btn) => btn.classList.toggle('active', btn === button))
      tabPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.tab === tab))
    })
  })
}

// érudition / énergie icons: simple toggle
document.querySelectorAll('.tracker-icons .icon-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (readonlyMode) return
    btn.classList.toggle('on')
  })
})

const toggleEditBtn = document.querySelector('#toggle-edit')
const saveEditBtn = document.querySelector('#save-edit')
const cancelEditBtn = document.querySelector('#cancel-edit')
const editableFields = Array.from(document.querySelectorAll('.input-field:not(.always-readonly), .mini-input:not(.always-readonly), .line-input:not(.always-readonly), .textarea-field:not(.always-readonly), .stat-input:not(.always-readonly), .substat-input:not(.always-readonly), .year-input:not(.always-readonly), .house-select:not(.always-readonly), .trait-input:not(.always-readonly), .grimoire-notes:not(.always-readonly), .sex-select:not(.always-readonly)'))
let readonlyMode = true

const setReadonly = (readonly) => {
  readonlyMode = readonly
  document.body.classList.toggle('readonly-mode', readonly)
  editableFields.forEach((field) => {
    if ('readOnly' in field) {
      field.readOnly = readonly
    }
    if (field.tagName === 'SELECT') {
      field.disabled = readonly
    }
    field.classList.toggle('readonly-field', readonly)
  })
  toggleEditBtn.hidden = !readonly
  saveEditBtn.hidden = readonly
  cancelEditBtn.hidden = readonly
}

const refreshAllCourseMalus = () => {
  document.querySelectorAll('.skill-row').forEach(updateCourseMalus)
}

toggleEditBtn.addEventListener('click', () => setReadonly(false))

saveEditBtn.addEventListener('click', () => {
  StorageAdapter.save(collectState())
  setReadonly(true)
})

cancelEditBtn.addEventListener('click', () => {
  applyState(StorageAdapter.load() ?? defaultsState)
  enforceMinimumCoursePips()
  refreshAllCourseMalus()
  setReadonly(true)
})

// Snapshot of the template's built-in values, captured once, before any
// saved state is applied. This is what "Annuler" falls back to when the
// person cancels an edit session but has never saved anything yet.
const defaultsState = collectState()

// On boot: if a save exists, restore it over the defaults (this also fires
// 'change' on <select> fields, e.g. re-syncing the house shield artwork).
applyState(StorageAdapter.load())
enforceMinimumCoursePips()
refreshAllCourseMalus()

setReadonly(true)
