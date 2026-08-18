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

// What the Action de Maison +5 bonus applies to, per house.
const houseActionDomains = {
  griffondor: 'Héroïsme',
  serdaigle: 'Connaissance',
  poufsouffle: 'Amitié',
  serpentard: 'Complot',
}

// Single source of truth for the triangle's starting values, so the template
// markup and the friend-card seeding logic can't drift apart.
const DEFAULT_CORE_STATS = { esprit: 14, magie: 16, coeur: 12, corps: 13 }

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
      <input class="line-input grimoire-title-input" type="text" value="${title}" data-field="grimoire.${id}.title" />
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

const HOUSE_PICK_OPTIONS = [
  { key: 'neutre', label: 'N' },
  { key: 'griffondor', label: 'G' }, // Gryffindor
  { key: 'poufsouffle', label: 'H' }, // Hufflepuff
  { key: 'serdaigle', label: 'R' }, // Ravenclaw
  { key: 'serpentard', label: 'S' }, // Slytherin
]

// `id` is a stable key for persistence, same rationale as grimoireCard's id.
// The ticket ("+2/+4", "+5/+10"...) is a fixed reminder, not per-friend data
// — no data-field for it. `options` covers the "Ami Fantastique" variant
// (Arcanes tab): a different ticket value, an explanatory caption next to
// it, and no house-affiliation picker (a magical creature has no house).
const friendCard = (
  id,
  title = 'Ami',
  { defaultHouse = 'neutre', ticketText = '+2/+4', ticketCaption = '', showHousePicker = true } = {}
) => `
  <article class="grimoire-card friend-card">
    <div class="grimoire-title">
      <span class="grimoire-title-line"></span>
      <input class="line-input grimoire-title-input" type="text" value="${title}" data-field="relation.${id}.title" />
      <span class="grimoire-title-line"></span>
    </div>
    <textarea class="grimoire-notes" rows="4" data-field="relation.${id}.notes"></textarea>
    <div class="friend-subtitle">
      <span class="friend-subtitle-line"></span>
      <span class="friend-subtitle-text">Description &amp; Traits</span>
      <span class="friend-subtitle-line"></span>
    </div>
    <textarea class="grimoire-notes friend-notes-small" rows="3" data-field="relation.${id}.traits"></textarea>
    <div class="friend-footer">
      <div class="friend-footer-left">
        <div class="grimoire-badge">${personIcon()}</div>
        <div class="grimoire-ticket always-readonly" aria-hidden="true">${ticketText}</div>
        ${ticketCaption ? `<span class="friend-ticket-caption">${ticketCaption}</span>` : ''}
      </div>
      ${
        showHousePicker
          ? `<div class="friend-houses">
        ${HOUSE_PICK_OPTIONS.map(
          (opt) => `
        <label class="house-pick${opt.key === defaultHouse ? ' selected' : ''}">
          <span class="diamond house-pip${opt.key === defaultHouse ? ' on' : ''}" data-field="relation.${id}.house.${opt.key}" data-field-type="toggle"></span>
          <span class="house-pick-shape ${opt.key}">${opt.label}</span>
        </label>`
        ).join('')}
      </div>`
          : ''
      }
    </div>
  </article>
`

const starIcon = () => `
  <svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" stroke-linecap="round"/></svg>
`

// Zigzag progress track, normalized to a 0-100 box (see the core-triangle for
// the same SVG-lines-plus-absolutely-positioned-nodes pattern). 7 stages.
const CONSTELLATION_NODES = [
  { left: 6, top: 22 },
  { left: 21, top: 74 },
  { left: 35, top: 22 },
  { left: 50, top: 74 },
  { left: 65, top: 22 },
  { left: 79, top: 74 },
  { left: 94, top: 22 },
]

// `id` is a stable key for persistence, same rationale as the other cards.
const constellationCard = (id, title = 'Constellation') => `
  <article class="grimoire-card constellation-card">
    <div class="grimoire-title">
      <span class="grimoire-title-line"></span>
      <input class="line-input grimoire-title-input" type="text" value="${title}" data-field="arcane.${id}.title" />
      <span class="grimoire-title-line"></span>
    </div>
    <div class="constellation-track-wrap">
      <svg class="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline class="constellation-edge" points="${CONSTELLATION_NODES.map((p) => `${p.left},${p.top}`).join(' ')}" />
      </svg>
      ${CONSTELLATION_NODES.map(
        (p, i) =>
          `<button type="button" class="diamond constellation-node" style="left:${p.left}%;top:${p.top}%" aria-label="étape ${i + 1}" data-field="arcane.${id}.pip.${i}" data-field-type="toggle"></button>`
      ).join('')}
      <span class="constellation-label">Progression</span>
    </div>
    <div class="field-row constellation-benefit-row">
      <span>Bénéfices</span>
      <input class="line-input" type="text" data-field="arcane.${id}.benefices" />
    </div>
    <div class="constellation-steps">
      <span class="block-label constellation-steps-label">Étapes</span>
      <ol class="constellation-steps-list">
        ${CONSTELLATION_NODES.map(
          (_, i) => `
        <li class="constellation-step-row">
          <span class="constellation-step-index">${i + 1}</span>
          <input class="line-input" type="text" data-field="arcane.${id}.step.${i}" />
        </li>`
        ).join('')}
      </ol>
    </div>
    <div class="friend-footer">
      <div class="grimoire-badge">${starIcon()}</div>
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
    <button type="button" class="tab-button" data-tab="arcanes">Arcanes</button>
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
            <span class="house-action-domain">Héroïsme</span>
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
                <input class="stat-input" type="number" value="${DEFAULT_CORE_STATS.esprit}" min="0" data-field="core.esprit" />
              </div>
            </div>

            <div class="node-circle node-magie">
              <div>
                <div class="node-label">Magie</div>
                <input class="stat-input" type="number" value="${DEFAULT_CORE_STATS.magie}" min="0" data-field="core.magie" />
              </div>
            </div>

            <div class="node-circle node-coeur">
              <div>
                <div class="node-sub">social</div>
                <div class="node-label">Cœur</div>
                <input class="stat-input" type="number" value="${DEFAULT_CORE_STATS.coeur}" min="0" data-field="core.coeur" />
              </div>
            </div>

            <div class="node-circle node-corps">
              <div>
                <div class="node-sub">physique</div>
                <div class="node-label">Corps</div>
                <input class="stat-input" type="number" value="${DEFAULT_CORE_STATS.corps}" min="0" data-field="core.corps" />
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
      <div class="grimoire-grid friend-grid">
        ${Array.from({ length: DEFAULT_CORE_STATS.coeur }, (_, i) => friendCard(`ami-${i + 1}`, 'Ami', { defaultHouse: 'neutre' })).join('')}
      </div>
    </section>
    <section class="tab-panel" data-tab="arcanes">
      <div class="grimoire-grid arcanes-grid">
        ${friendCard('arcane-ami', 'Ami')}
        ${constellationCard('constellation-1', 'Constellation')}
        ${friendCard('arcane-ami-fantastique', 'Ami Fantastique', {
          ticketText: '+5/+10',
          ticketCaption: 'pour une action liée à ses pouvoirs',
          showHousePicker: false,
        })}
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

// Shared "cascade" behaviour for a row of ordered diamonds: clicking one
// fills every pip up to and including it; clicking the current highest one
// again empties back down to `minFilled`. Used by course rank tracks and by
// the constellation progress track — same interaction, different minimums.
const bindCascadeToggleGroup = (row, { minFilled = 0, onChange } = {}) => {
  const pips = Array.from(row.querySelectorAll('.diamond'))
  pips.forEach((pip, index) => {
    pip.addEventListener('click', () => {
      if (readonlyMode) return
      const alreadyFull = pip.classList.contains('on') && (pips[index + 1] ? !pips[index + 1].classList.contains('on') : true)
      const targetCount = alreadyFull ? index : index + 1
      const clampedCount = Math.max(targetCount, minFilled)
      pips.forEach((p, i) => p.classList.toggle('on', i < clampedCount))
      if (onChange) onChange()
    })
  })
}

// clickable pips (skill ranks) toggle fill up to the clicked pip
document.querySelectorAll('.pip-row').forEach((row) => {
  const skillRowEl = row.closest('.skill-row')
  bindCascadeToggleGroup(row, {
    minFilled: COURSE_MIN_FILLED,
    onChange: () => {
      if (skillRowEl) updateCourseMalus(skillRowEl)
    },
  })
})

// constellation progress track: same cascade interaction, no minimum (an
// untouched constellation legitimately starts fully unfilled).
document.querySelectorAll('.constellation-track-wrap').forEach((wrap) => {
  bindCascadeToggleGroup(wrap, { minFilled: 0 })
})

// single mastery pip per spell just toggles on/off
document.querySelectorAll('.spell-row .diamond').forEach((pip) => {
  pip.addEventListener('click', () => {
    if (readonlyMode) return
    pip.classList.toggle('on')
  })
})

// origin: single-select among the three choices — clicking anywhere on the
// row (label text included), not just the tiny diamond, selects it.
const originPips = document.querySelectorAll('.origin-pip')
document.querySelectorAll('.origin-choice').forEach((choice) => {
  choice.addEventListener('click', (event) => {
    if (readonlyMode) return
    event.preventDefault() // avoid any native label/checkbox side-effect
    const pip = choice.querySelector('.origin-pip')
    if (!pip) return
    originPips.forEach((p) => p.classList.remove('on'))
    pip.classList.add('on')
  })
})

// relation cards: house affiliation is single-select, but scoped PER CARD
// (each friend card has its own independent group of 5 house choices).
// Wrapped in a named function because the card count changes at runtime
// (see renderFriendCards) — every rebuild needs to re-bind fresh elements.
const syncFriendHousePicks = (card) => {
  card.querySelectorAll('.house-pick').forEach((wrapper) => {
    const pip = wrapper.querySelector('.house-pip')
    wrapper.classList.toggle('selected', Boolean(pip && pip.classList.contains('on')))
  })
}
const bindFriendCardInteractivity = () => {
  document.querySelectorAll('.friend-card').forEach((card) => {
    const housePips = card.querySelectorAll('.house-pip')
    card.querySelectorAll('.house-pick').forEach((choice) => {
      choice.addEventListener('click', (event) => {
        if (readonlyMode) return
        event.preventDefault()
        const pip = choice.querySelector('.house-pip')
        if (!pip) return
        housePips.forEach((p) => p.classList.remove('on'))
        pip.classList.add('on')
        syncFriendHousePicks(card)
      })
    })
  })
}

// Renders exactly `count` friend cards (ami-1 .. ami-count) into the
// Relations grid. Cards beyond the new count are removed from view but NOT
// deleted from storage (StorageAdapter.save merges rather than replaces —
// see persistence.js), so raising Cœur again later brings their old
// content back. Called only at boot / Sauvegarder / Annuler, never live
// while typing, so the list doesn't jump around mid-edit.
const renderFriendCards = (count) => {
  const grid = document.querySelector('.friend-grid')
  if (!grid) return

  // Whatever is currently on screen for these cards — including edits made
  // this session that haven't been saved yet — must survive the rebuild.
  const inProgress = collectState(grid)

  const safeCount = Number.isFinite(count) ? Math.max(count, 0) : 0
  grid.innerHTML = Array.from({ length: safeCount }, (_, i) => friendCard(`ami-${i + 1}`, 'Ami', { defaultHouse: 'neutre' })).join('')

  bindFriendCardInteractivity()
  // Scoped to `grid` only — an unscoped applyState() here would also touch
  // matching data-fields elsewhere in the document (core.coeur itself lives
  // outside the grid!) and could clobber an in-progress, not-yet-saved edit.
  applyState(StorageAdapter.load(), grid) // last saved content, for ids that pre-date this rebuild
  applyState(inProgress, grid) // this session's unsaved edits take priority over the saved copy
  refreshAllFriendHousePicks()
}

const getCoeurCardCount = () => {
  const el = document.querySelector('[data-field="core.coeur"]')
  const value = el ? parseInt(el.value, 10) : DEFAULT_CORE_STATS.coeur
  return Number.isFinite(value) ? Math.max(value, 0) : 0
}

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
    const domainEl = houseBlock.querySelector('.house-action-domain')
    if (domainEl && houseActionDomains[houseSelect.value]) {
      domainEl.textContent = houseActionDomains[houseSelect.value]
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
const EDITABLE_SELECTOR =
  '.input-field:not(.always-readonly), .mini-input:not(.always-readonly), .line-input:not(.always-readonly), .textarea-field:not(.always-readonly), .stat-input:not(.always-readonly), .substat-input:not(.always-readonly), .year-input:not(.always-readonly), .house-select:not(.always-readonly), .trait-input:not(.always-readonly), .grimoire-notes:not(.always-readonly), .sex-select:not(.always-readonly)'
let readonlyMode = true

const setReadonly = (readonly) => {
  readonlyMode = readonly
  document.body.classList.toggle('readonly-mode', readonly)
  // Queried fresh every call (rather than cached once) because
  // renderFriendCards() can create new fields at runtime — a stale cached
  // list would leave those unlocked/locked incorrectly.
  document.querySelectorAll(EDITABLE_SELECTOR).forEach((field) => {
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

const refreshAllFriendHousePicks = () => {
  document.querySelectorAll('.friend-card').forEach(syncFriendHousePicks)
}

toggleEditBtn.addEventListener('click', () => setReadonly(false))

saveEditBtn.addEventListener('click', () => {
  // Resize the friend-card list to match Cœur *before* collecting/saving,
  // so the save reflects the count the person is committing to.
  renderFriendCards(getCoeurCardCount())
  StorageAdapter.save(collectState())
  setReadonly(true)
})

cancelEditBtn.addEventListener('click', () => {
  applyState(StorageAdapter.load() ?? defaultsState)
  enforceMinimumCoursePips()
  refreshAllCourseMalus()
  // Cœur may have just been reverted above — resize the friend-card list
  // to match whatever it reverted back to.
  renderFriendCards(getCoeurCardCount())
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
// Cœur may have just been restored to a saved value above — make sure the
// friend-card count (and any of their own previously-saved content) matches.
renderFriendCards(getCoeurCardCount())

setReadonly(true)
