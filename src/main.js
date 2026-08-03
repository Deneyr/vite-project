import './style.css'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
<div class="dashboard-shell">
  <header class="sheet-header">
    <div class="title-block">
      <span class="persona-label">Personnage</span>
      <div class="main-title">
        <span>Tu es un</span>
        <strong>SORCIER</strong>
      </div>
      <div class="character-grid">
        <div class="character-row">
          <span>Joueuse / joueur</span>
          <strong>Aria Valion</strong>
        </div>
        <div class="character-row">
          <span>Table</span>
          <strong>L’Académie</strong>
        </div>
        <div class="character-row">
          <span>Époque</span>
          <strong>Renaissance magique</strong>
        </div>
      </div>
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
        <div class="center-score">16</div>
      </div>
      <div class="node node-top">
        <svg class="node-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 8 L38 28 L60 28 L42 40 L48 60 L32 48 L16 60 L22 40 L4 28 L26 28 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        </svg>
        <div class="node-copy">
          <strong>14</strong>
          <span>Esprit</span>
          <small>Mental</small>
        </div>
      </div>
      <div class="node node-left">
        <svg class="node-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 54s22-14 22-28S40 8 32 8 10 18 10 26s22 28 22 28Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        </svg>
        <div class="node-copy">
          <strong>12</strong>
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
          <strong>13</strong>
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
        <strong>Ambition</strong>
        <p>Découvrir l’ancien savoir des sorciers et changer le destin du monde.</p>
      </div>
      <div class="core-touch small">
        <strong>Points d’éveil</strong>
        <p>5</p>
      </div>
    </div>
  </section>

  <section class="bottom-grid">
    <article class="panel panel-left">
      <div class="panel-title">
        <span>Sortilèges</span>
        <strong>Liste</strong>
      </div>
      <ul class="panel-list">
        <li>Éclair silencieux</li>
        <li>Barrière d’ombre</li>
        <li>Transmutation lunaire</li>
        <li>Portail d’éther</li>
      </ul>
    </article>

    <article class="panel panel-right">
      <div class="panel-title">
        <span>Possessions</span>
        <strong>Équipement</strong>
      </div>
      <p>Grimoire ancien, baguette d’onyx, cape d’invisibilité, orbe des rêves, potion de régénération.</p>
      <button id="counter" type="button" class="counter">Points d’action</button>
    </article>
  </section>
</div>
`

setupCounter(document.querySelector('#counter'))
