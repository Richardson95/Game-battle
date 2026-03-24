// ARENA — Epic Battle Game | Vanilla JS + Detailed Human Superhero Sprites
"use strict";
(function () {

  // ── FX keyframes ──────────────────────────────────────────
  const kf = document.createElement("style");
  kf.textContent = `
    @keyframes fxHitAnim { 0%{transform:scale(.4) rotate(-15deg);opacity:1} 60%{transform:scale(1.4) rotate(8deg);opacity:1} 100%{transform:scale(1) translateY(-40px);opacity:0} }
    @keyframes fxTextAnim { 0%{transform:translateY(0) scale(1);opacity:1} 75%{transform:translateY(-55px) scale(1.3);opacity:1} 100%{transform:translateY(-90px) scale(1);opacity:0} }
    @keyframes flashFade { 0%{opacity:.6} 100%{opacity:0} }
    @keyframes energyRing { 0%{transform:scale(0);opacity:1} 100%{transform:scale(3);opacity:0} }
  `;
  document.head.appendChild(kf);

  // ── state ──────────────────────────────────────────────────
  let mode = "manual", difficulty = 1;
  let selectedPlayer = null, selectedOpponent = null;
  let gameState = null, autoTimer = null;
  let blockActive = false, blockTimer = null;
  let scores = { p1: 0, p2: 0 };
  let particles = [], battleParticles = [], confettiParticles = [];
  let rafId, battleRafId, pCtx, bCtx;
  const AVATARS = window.AVATARS || {};

  // ── helpers ────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const qsa = sel => document.querySelectorAll(sel);
  const showScreen = name => {
    qsa(".screen").forEach(s => s.classList.remove("active"));
    $(`${name}-screen`).classList.add("active");
    const f = document.createElement("div");
    f.className = "screen-flash"; f.style.cssText = "position:fixed;inset:0;background:#fff;pointer-events:none;z-index:999";
    document.body.appendChild(f); setTimeout(() => f.remove(), 400);
  };
  const randomAvatar = ex => { const k = Object.keys(AVATARS).filter(k=>k!==ex); return k[Math.floor(Math.random()*k.length)]; };
  const shake = el => { el.style.animation="none"; void el.offsetWidth; el.style.animation="hit-stagger .4s ease"; setTimeout(()=>el.style.animation="",400); };

  // ── HUMAN SUPERHERO SVGs ────────────────────────────────────
  // Realistic humans in original superhero suits — limb groups enable CSS fight animations
  const CHARACTER_SVGS = {

    // Richardson — Crimson Sentinel: Dark-skinned man in angular red+black exo-armor
    Richardson: (c, g) => `
      <ellipse cx="60" cy="197" rx="26" ry="5" fill="rgba(0,0,0,0.5)"/>
      <g class="leg-l">
        <path d="M50,122 Q44,150 42,172 Q42,182 50,185 Q58,185 58,174 Q58,150 54,122 Z" fill="#7a0000"/>
        <path d="M50,124 Q46,152 46,172" stroke="#cc2020" stroke-width="2" fill="none" opacity="0.4"/>
        <ellipse cx="47" cy="170" rx="9" ry="6" fill="#440000"/>
        <ellipse cx="47" cy="168" rx="6" ry="4" fill="${c}" opacity="0.55"/>
        <path d="M41,176 Q40,190 44,197 Q50,201 58,199 Q60,191 58,181 Q52,177 46,175 Z" fill="#550000"/>
        <path d="M40,195 Q43,201 52,202 Q60,200 60,194" stroke="#220000" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <g class="leg-r">
        <path d="M70,122 Q76,150 78,172 Q78,182 70,185 Q62,185 62,174 Q62,150 66,122 Z" fill="#7a0000"/>
        <path d="M70,124 Q74,152 74,172" stroke="#cc2020" stroke-width="2" fill="none" opacity="0.4"/>
        <ellipse cx="73" cy="170" rx="9" ry="6" fill="#440000"/>
        <ellipse cx="73" cy="168" rx="6" ry="4" fill="${c}" opacity="0.55"/>
        <path d="M79,176 Q80,190 76,197 Q70,201 62,199 Q60,191 62,181 Q68,177 74,175 Z" fill="#550000"/>
        <path d="M80,195 Q77,201 68,202 Q60,200 60,194" stroke="#220000" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M36,68 Q18,110 16,170 Q18,184 28,182 Q34,160 38,108 L44,70 Z" fill="#380000" opacity="0.9"/>
      <path d="M84,68 Q102,110 104,170 Q102,184 92,182 Q86,160 82,108 L76,70 Z" fill="#380000" opacity="0.9"/>
      <g class="body">
        <path d="M26,66 Q26,50 60,48 Q94,50 94,66 L92,120 L28,120 Z" fill="#1c0000"/>
        <path d="M28,64 Q28,52 60,50 L60,118 L28,118 Z" fill="${c}" opacity="0.32"/>
        <path d="M92,64 Q92,52 60,50 L60,118 L92,118 Z" fill="#880000" opacity="0.52"/>
        <path d="M60,52 L60,118" stroke="${g}" stroke-width="1.5" opacity="0.32"/>
        <path d="M60,68 Q46,70 40,82 Q36,92 38,102" stroke="${c}" stroke-width="2" fill="none" opacity="0.65"/>
        <path d="M60,68 Q74,70 80,82 Q84,92 82,102" stroke="${c}" stroke-width="2" fill="none" opacity="0.65"/>
        <circle cx="60" cy="70" r="10" fill="#0a0000"/>
        <circle cx="60" cy="70" r="7" fill="${c}" opacity="0.6"/>
        <circle cx="60" cy="70" r="4" fill="${g}"/>
        <circle cx="60" cy="70" r="2" fill="white" opacity="0.85"/>
        <path d="M20,58 Q14,48 20,40 Q30,36 38,48 L40,66 L26,68 Z" fill="${c}"/>
        <path d="M100,58 Q106,48 100,40 Q90,36 82,48 L80,66 L94,68 Z" fill="${c}"/>
        <path d="M30,118 L90,118 L88,130 L32,130 Z" fill="#330000"/>
      </g>
      <g class="arm-l">
        <path d="M24,62 Q10,72 6,96 Q4,114 14,124 Q24,130 30,120 Q36,106 34,84 L32,64 Z" fill="#880000"/>
        <path d="M24,64 Q12,72 10,94 Q8,112 16,122" stroke="${c}" stroke-width="1.5" fill="none" opacity="0.38"/>
        <ellipse cx="18" cy="122" rx="8" ry="6" fill="#440000"/>
        <ellipse cx="18" cy="121" rx="5" ry="3.5" fill="${c}" opacity="0.42"/>
        <path d="M10,122 Q4,138 6,156 Q10,168 20,166 Q30,163 28,150 Q26,132 18,124 Z" fill="#660000"/>
        <path d="M4,152 Q2,168 8,178 Q16,184 24,180 Q30,172 26,158 Z" fill="#1a0000"/>
        <path d="M6,160 Q4,170 10,176 Q18,180 24,176" stroke="${c}" stroke-width="1.5" fill="none" opacity="0.6"/>
      </g>
      <g class="arm-r">
        <path d="M96,62 Q110,72 114,96 Q116,114 106,124 Q96,130 90,120 Q84,106 86,84 L88,64 Z" fill="#880000"/>
        <path d="M96,64 Q108,72 110,94 Q112,112 104,122" stroke="${c}" stroke-width="1.5" fill="none" opacity="0.38"/>
        <ellipse cx="102" cy="122" rx="8" ry="6" fill="#440000"/>
        <ellipse cx="102" cy="121" rx="5" ry="3.5" fill="${c}" opacity="0.42"/>
        <path d="M110,122 Q116,138 114,156 Q110,168 100,166 Q90,163 92,150 Q94,132 102,124 Z" fill="#660000"/>
        <path d="M116,152 Q118,168 112,178 Q104,184 96,180 Q90,172 94,158 Z" fill="#1a0000"/>
        <rect x="108" y="170" width="8" height="20" rx="3" fill="#2a2a2a"/>
        <rect x="102" y="166" width="18" height="5" rx="2.5" fill="#666"/>
        <path d="M109,164 L112,62 L115,164 Z" fill="${c}" opacity="0.82"/>
        <path d="M110,162 L112,70 L114,162 Z" fill="white" opacity="0.48"/>
        <path d="M108,164 L112,56 L116,164 Z" fill="${c}" opacity="0.18"/>
      </g>
      <g class="head">
        <path d="M42,34 Q42,8 60,6 Q78,8 78,34 L78,46 Q78,56 60,58 Q42,56 42,46 Z" fill="#8a5230"/>
        <path d="M40,30 Q38,10 60,6 Q82,10 80,30 Q80,16 60,14 Q40,16 40,30 Z" fill="#cc1a1a"/>
        <path d="M40,30 Q36,36 38,48 Q42,54 46,52 L44,36 Z" fill="#440000"/>
        <path d="M80,30 Q84,36 82,48 Q78,54 74,52 L76,36 Z" fill="#440000"/>
        <path d="M57,6 Q60,0 63,6 L63,12 L57,12 Z" fill="${c}"/>
        <rect x="42" y="24" width="36" height="5" rx="2.5" fill="#220000" opacity="0.85"/>
        <ellipse cx="52" cy="33" rx="6.5" ry="5" fill="#0a0000" opacity="0.7"/>
        <ellipse cx="68" cy="33" rx="6.5" ry="5" fill="#0a0000" opacity="0.7"/>
        <ellipse cx="52" cy="33" rx="4" ry="3.2" fill="#1a0000"/>
        <ellipse cx="68" cy="33" rx="4" ry="3.2" fill="#1a0000"/>
        <ellipse cx="52" cy="33" rx="2.8" ry="2.2" fill="${c}"/>
        <ellipse cx="68" cy="33" rx="2.8" ry="2.2" fill="${c}"/>
        <ellipse cx="51" cy="32" rx="1" ry="0.9" fill="white" opacity="0.75"/>
        <ellipse cx="67" cy="32" rx="1" ry="0.9" fill="white" opacity="0.75"/>
        <path d="M57,38 Q58,43 60,44 Q62,43 63,38" stroke="#6a3820" stroke-width="1.2" fill="none" opacity="0.65"/>
        <path d="M52,50 Q56,53 60,52 Q64,53 68,50" stroke="#5a2a18" stroke-width="1.4" fill="none"/>
        <path d="M44,26 Q50,22 55,25" stroke="#2a1005" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M65,25 Q70,22 76,26" stroke="#2a1005" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy="41" rx="5" ry="3" fill="#b06040" opacity="0.22"/>
        <ellipse cx="70" cy="41" rx="5" ry="3" fill="#b06040" opacity="0.22"/>
      </g>
    `,

    // Maya — Void Weaver: Dark-skinned woman in midnight void suit with bioluminescent patterns
    Maya: (c, g) => `
      <ellipse cx="60" cy="197" rx="24" ry="5" fill="rgba(0,0,0,0.5)"/>
      <g class="leg-l">
        <path d="M52,120 Q46,148 44,172 Q44,182 52,184 Q60,184 60,172 Q60,148 56,120 Z" fill="#1a0040"/>
        <path d="M52,122 Q48,152 48,170" stroke="${c}" stroke-width="1.5" fill="none" opacity="0.5"/>
        <ellipse cx="50" cy="170" rx="8" ry="5.5" fill="${c}" opacity="0.38"/>
        <path d="M44,176 Q42,190 46,197 Q52,201 60,199 Q62,191 60,181 Q54,177 48,175 Z" fill="#0d0028"/>
        <path d="M42,195 Q45,201 54,202 Q62,200 62,194" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
      </g>
      <g class="leg-r">
        <path d="M68,120 Q74,148 76,172 Q76,182 68,184 Q60,184 60,172 Q60,148 64,120 Z" fill="#1a0040"/>
        <path d="M68,122 Q72,152 72,170" stroke="${c}" stroke-width="1.5" fill="none" opacity="0.5"/>
        <ellipse cx="70" cy="170" rx="8" ry="5.5" fill="${c}" opacity="0.38"/>
        <path d="M76,176 Q78,190 74,197 Q68,201 60,199 Q58,191 60,181 Q66,177 72,175 Z" fill="#0d0028"/>
        <path d="M78,195 Q75,201 66,202 Q58,200 58,194" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
      </g>
      <path d="M38,64 Q20,100 16,162 Q18,178 28,176 Q34,152 38,102 L42,68 Z" fill="#0d0020" opacity="0.85"/>
      <path d="M82,64 Q100,100 104,162 Q102,178 92,176 Q86,152 82,102 L78,68 Z" fill="#0d0020" opacity="0.85"/>
      <path d="M38,72 Q24,108 20,160" stroke="${c}" stroke-width="1" fill="none" opacity="0.35"/>
      <path d="M82,72 Q96,108 100,160" stroke="${c}" stroke-width="1" fill="none" opacity="0.35"/>
      <g class="body">
        <path d="M28,64 Q28,50 60,48 Q92,50 92,64 L90,120 L30,120 Z" fill="#120030"/>
        <path d="M44,56 L76,56 L78,118 L42,118 Z" fill="${c}" opacity="0.07"/>
        <path d="M60,50 L60,118" stroke="${g}" stroke-width="1.2" opacity="0.35"/>
        <path d="M48,60 Q44,72 44,86 Q44,96 50,102" stroke="${g}" stroke-width="1" fill="none" opacity="0.55"/>
        <path d="M72,60 Q76,72 76,86 Q76,96 70,102" stroke="${g}" stroke-width="1" fill="none" opacity="0.55"/>
        <circle cx="60" cy="72" r="10" fill="#0a0020"/>
        <circle cx="60" cy="72" r="7" fill="${c}" opacity="0.55"/>
        <circle cx="60" cy="72" r="4" fill="${g}"/>
        <circle cx="60" cy="72" r="2" fill="white" opacity="0.9"/>
        <path d="M60,82 Q50,88 46,98 Q44,106 48,112" stroke="${c}" stroke-width="1.2" fill="none" opacity="0.6"/>
        <path d="M60,82 Q70,88 74,98 Q76,106 72,112" stroke="${c}" stroke-width="1.2" fill="none" opacity="0.6"/>
        <path d="M30,118 L90,118 L88,128 L32,128 Z" fill="#0d0028"/>
        <path d="M18,60 Q10,50 16,40 Q26,34 36,46 L38,64 L24,66 Z" fill="${c}" opacity="0.7"/>
        <path d="M102,60 Q110,50 104,40 Q94,34 84,46 L82,64 L96,66 Z" fill="${c}" opacity="0.7"/>
      </g>
      <circle cx="16" cy="100" r="7" fill="${g}" opacity="0.55"/>
      <circle cx="16" cy="100" r="4.5" fill="white" opacity="0.7"/>
      <circle cx="104" cy="92" r="6" fill="${g}" opacity="0.55"/>
      <circle cx="104" cy="92" r="3.8" fill="white" opacity="0.7"/>
      <g class="arm-l">
        <path d="M26,62 Q12,72 8,96 Q6,114 16,124 Q26,130 32,120 Q38,106 36,84 L32,64 Z" fill="#1a0040"/>
        <path d="M26,64 Q14,72 12,94 Q10,112 18,122" stroke="${g}" stroke-width="1.2" fill="none" opacity="0.4"/>
        <ellipse cx="20" cy="122" rx="8" ry="6" fill="#0d0028"/>
        <path d="M10,122 Q4,138 6,156 Q10,168 20,166 Q30,163 28,150 Q26,132 18,124 Z" fill="#120030"/>
        <path d="M4,152 Q2,168 8,178 Q16,184 24,180 Q30,172 26,158 Z" fill="#0a0020"/>
        <path d="M6,158 Q6,170 12,178 Q20,182 26,178" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.7"/>
        <circle cx="14" cy="172" r="9" fill="${c}" opacity="0.5"/>
        <circle cx="14" cy="172" r="5.5" fill="${g}" opacity="0.7"/>
        <circle cx="14" cy="172" r="3" fill="white" opacity="0.8"/>
      </g>
      <g class="arm-r">
        <path d="M94,62 Q108,72 112,96 Q114,114 104,124 Q94,130 88,120 Q82,106 84,84 L88,64 Z" fill="#1a0040"/>
        <path d="M94,64 Q106,72 108,94 Q110,112 102,122" stroke="${g}" stroke-width="1.2" fill="none" opacity="0.4"/>
        <ellipse cx="100" cy="122" rx="8" ry="6" fill="#0d0028"/>
        <path d="M110,122 Q116,138 114,156 Q110,168 100,166 Q90,163 92,150 Q94,132 102,124 Z" fill="#120030"/>
        <path d="M116,152 Q118,168 112,178 Q104,184 96,180 Q90,172 94,158 Z" fill="#0a0020"/>
        <path d="M114,158 Q114,170 108,178 Q100,182 94,178" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.7"/>
        <circle cx="106" cy="172" r="9" fill="${c}" opacity="0.5"/>
        <circle cx="106" cy="172" r="5.5" fill="${g}" opacity="0.7"/>
        <circle cx="106" cy="172" r="3" fill="white" opacity="0.8"/>
      </g>
      <g class="head">
        <ellipse cx="60" cy="20" rx="22" ry="20" fill="#0a0510"/>
        <path d="M38,25 Q34,12 42,6 Q60,0 78,6 Q86,12 82,25" fill="#0a0510"/>
        <ellipse cx="44" cy="14" rx="10" ry="8" fill="#0a0510"/>
        <ellipse cx="76" cy="14" rx="10" ry="8" fill="#0a0510"/>
        <path d="M44,22 Q44,8 60,6 Q76,8 76,22 L76,44 Q76,54 60,56 Q44,54 44,44 Z" fill="#5a2e12"/>
        <path d="M42,22 Q40,6 60,4 Q80,6 78,22" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.6"/>
        <path d="M46,16 Q50,10 60,8 Q70,10 74,16" stroke="${g}" stroke-width="2" fill="none"/>
        <circle cx="60" cy="10" r="3.5" fill="${g}"/>
        <circle cx="60" cy="10" r="2" fill="white" opacity="0.9"/>
        <ellipse cx="52" cy="29" rx="6" ry="4.5" fill="#0a0000" opacity="0.6"/>
        <ellipse cx="68" cy="29" rx="6" ry="4.5" fill="#0a0000" opacity="0.6"/>
        <ellipse cx="52" cy="29" rx="4" ry="3" fill="#1a0030"/>
        <ellipse cx="68" cy="29" rx="4" ry="3" fill="#1a0030"/>
        <ellipse cx="52" cy="29" rx="2.5" ry="2" fill="${c}"/>
        <ellipse cx="68" cy="29" rx="2.5" ry="2" fill="${c}"/>
        <ellipse cx="51" cy="28" rx="1" ry="0.9" fill="white" opacity="0.8"/>
        <ellipse cx="67" cy="28" rx="1" ry="0.9" fill="white" opacity="0.8"/>
        <path d="M57,34 Q58,39 60,40 Q62,39 63,34" stroke="#4a1e08" stroke-width="1.2" fill="none" opacity="0.65"/>
        <path d="M52,48 Q56,51 60,50 Q64,51 68,48" stroke="#7a3020" stroke-width="1.8" fill="none"/>
        <path d="M54,48 Q60,52 66,48" stroke="#9a4030" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M45,23 Q50,19 56,22" stroke="#1a0808" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M64,22 Q70,19 75,23" stroke="#1a0808" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
    `,

    // Zephyr — Phase Runner: Asian-featured man in teal nanosuit with twin wrist blades
    Zephyr: (c, g) => `
      <ellipse cx="60" cy="197" rx="24" ry="5" fill="rgba(0,0,0,0.5)"/>
      <path d="M8,100 Q16,96 24,100 Q20,104 8,108 Z" fill="${c}" opacity="0.15"/>
      <path d="M6,120 Q16,116 28,120 Q22,124 6,128 Z" fill="${c}" opacity="0.1"/>
      <g class="leg-l">
        <path d="M50,120 Q44,150 42,172 Q42,182 50,184 Q58,184 58,172 Q58,148 54,120 Z" fill="#003a40"/>
        <path d="M50,122 Q46,152 46,170" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
        <ellipse cx="48" cy="170" rx="8" ry="5.5" fill="#001a20"/>
        <ellipse cx="48" cy="168" rx="5" ry="3.5" fill="${c}" opacity="0.45"/>
        <path d="M42,174 Q40,190 44,197 Q50,201 58,199 Q60,191 58,181 Q52,177 46,175 Z" fill="#002028"/>
        <path d="M40,195 Q43,201 52,202 Q60,200 60,194" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
      </g>
      <g class="leg-r">
        <path d="M70,120 Q76,150 78,172 Q78,182 70,184 Q62,184 62,172 Q62,148 66,120 Z" fill="#003a40"/>
        <path d="M70,122 Q74,152 74,170" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
        <ellipse cx="72" cy="170" rx="8" ry="5.5" fill="#001a20"/>
        <ellipse cx="72" cy="168" rx="5" ry="3.5" fill="${c}" opacity="0.45"/>
        <path d="M78,174 Q80,190 76,197 Q70,201 62,199 Q60,191 62,181 Q68,177 74,175 Z" fill="#002028"/>
        <path d="M80,195 Q77,201 68,202 Q60,200 60,194" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
      </g>
      <g class="body">
        <path d="M28,64 Q28,50 60,48 Q92,50 92,64 L90,120 L30,120 Z" fill="#002830"/>
        <path d="M36,58 L84,58 L86,118 L34,118 Z" fill="${c}" opacity="0.06"/>
        <path d="M60,50 L60,118" stroke="${g}" stroke-width="1" opacity="0.3"/>
        <path d="M44,64 L44,90 M36,78 L44,78" stroke="${g}" stroke-width="1" fill="none" opacity="0.3"/>
        <path d="M76,64 L76,90 M76,78 L84,78" stroke="${g}" stroke-width="1" fill="none" opacity="0.3"/>
        <path d="M40,70 Q54,66 60,68 Q66,66 80,70" stroke="${c}" stroke-width="2" fill="none" opacity="0.6"/>
        <circle cx="60" cy="78" r="9" fill="#001820"/>
        <circle cx="60" cy="78" r="6" fill="${c}" opacity="0.6"/>
        <circle cx="60" cy="78" r="3.5" fill="${g}"/>
        <circle cx="60" cy="78" r="1.8" fill="white" opacity="0.9"/>
        <rect x="28" y="85" width="10" height="20" rx="3" fill="#001820"/>
        <rect x="82" y="85" width="10" height="20" rx="3" fill="#001820"/>
        <line x1="30" y1="90" x2="36" y2="90" stroke="${g}" stroke-width="1" opacity="0.4"/>
        <line x1="30" y1="96" x2="36" y2="96" stroke="${g}" stroke-width="1" opacity="0.4"/>
        <line x1="30" y1="102" x2="36" y2="102" stroke="${g}" stroke-width="1" opacity="0.4"/>
        <line x1="84" y1="90" x2="90" y2="90" stroke="${g}" stroke-width="1" opacity="0.4"/>
        <line x1="84" y1="96" x2="90" y2="96" stroke="${g}" stroke-width="1" opacity="0.4"/>
        <line x1="84" y1="102" x2="90" y2="102" stroke="${g}" stroke-width="1" opacity="0.4"/>
        <path d="M30,118 L90,118 L88,128 L32,128 Z" fill="#001820"/>
        <path d="M18,58 Q12,48 18,40 Q28,36 36,48 L38,64 L22,66 Z" fill="${c}"/>
        <path d="M102,58 Q108,48 102,40 Q92,36 84,48 L82,64 L98,66 Z" fill="${c}"/>
      </g>
      <g class="arm-l">
        <path d="M26,62 Q12,72 8,96 Q6,114 16,124 Q26,130 32,120 Q38,106 36,84 L32,64 Z" fill="#003040"/>
        <path d="M26,64 Q14,72 12,94 Q10,112 18,122" stroke="${g}" stroke-width="1.2" fill="none" opacity="0.4"/>
        <ellipse cx="20" cy="122" rx="8" ry="6" fill="#001820"/>
        <path d="M10,122 Q4,138 6,156 Q10,168 20,166 Q30,163 28,150 Q26,132 18,124 Z" fill="#002028"/>
        <path d="M4,152 Q2,168 8,178 Q16,184 24,180 Q30,172 26,158 Z" fill="#001018"/>
        <path d="M8,160 L2,148 L6,146 L12,160 Z" fill="${c}" opacity="0.75"/>
        <path d="M8,160 L2,148 L4,147 L10,160 Z" fill="${g}" opacity="0.85"/>
      </g>
      <g class="arm-r">
        <path d="M94,62 Q108,72 112,96 Q114,114 104,124 Q94,130 88,120 Q82,106 84,84 L88,64 Z" fill="#003040"/>
        <path d="M94,64 Q106,72 108,94 Q110,112 102,122" stroke="${g}" stroke-width="1.2" fill="none" opacity="0.4"/>
        <ellipse cx="100" cy="122" rx="8" ry="6" fill="#001820"/>
        <path d="M110,122 Q116,138 114,156 Q110,168 100,166 Q90,163 92,150 Q94,132 102,124 Z" fill="#002028"/>
        <path d="M116,152 Q118,168 112,178 Q104,184 96,180 Q90,172 94,158 Z" fill="#001018"/>
        <path d="M112,158 L120,140 L116,138 L108,158 Z" fill="${c}" opacity="0.82"/>
        <path d="M112,158 L120,140 L118,139 L110,158 Z" fill="${g}" opacity="0.88"/>
        <path d="M116,148 L120,138" stroke="white" stroke-width="1" opacity="0.4"/>
      </g>
      <g class="head">
        <ellipse cx="60" cy="22" rx="18" ry="16" fill="#0a0806"/>
        <path d="M42,26 Q40,8 60,4 Q80,8 78,26" fill="#0a0806"/>
        <circle cx="60" cy="16" r="8" fill="#0f0c08"/>
        <ellipse cx="60" cy="12" rx="7" ry="6" fill="#0a0806"/>
        <rect x="58" y="6" width="2" height="10" rx="1" fill="${g}"/>
        <circle cx="59" cy="6" r="2.5" fill="${g}"/>
        <path d="M42,28 Q38,36 40,44" stroke="#0a0806" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M78,28 Q82,36 80,44" stroke="#0a0806" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M44,24 Q44,10 60,8 Q76,10 76,24 L76,44 Q76,54 60,56 Q44,54 44,44 Z" fill="#c09060"/>
        <rect x="42" y="24" width="36" height="13" rx="6" fill="#0a1820"/>
        <rect x="44" y="26" width="14" height="9" rx="5" fill="#001828"/>
        <rect x="62" y="26" width="14" height="9" rx="5" fill="#001828"/>
        <ellipse cx="51" cy="30" rx="5" ry="3.5" fill="${c}" opacity="0.35"/>
        <ellipse cx="69" cy="30" rx="5" ry="3.5" fill="${c}" opacity="0.35"/>
        <ellipse cx="51" cy="30" rx="3" ry="2" fill="${g}" opacity="0.5"/>
        <ellipse cx="69" cy="30" rx="3" ry="2" fill="${g}" opacity="0.5"/>
        <rect x="44" y="38" width="32" height="10" rx="5" fill="#081014" opacity="0.88"/>
        <path d="M56,47 Q58,50 60,50 Q62,50 64,47" stroke="#a07050" stroke-width="1.2" fill="none" opacity="0.65"/>
        <path d="M52,52 Q56,55 60,54 Q64,55 68,52" stroke="#806040" stroke-width="1.3" fill="none"/>
      </g>
    `,

    // Nova — Radiant Paladin: Mediterranean woman in crystalline white+gold armor
    Nova: (c, g) => `
      <ellipse cx="60" cy="197" rx="26" ry="5" fill="rgba(0,0,0,0.5)"/>
      <path d="M60,50 L52,10 L62,20 Z" fill="${g}" opacity="0.15"/>
      <path d="M60,50 L68,10 L58,20 Z" fill="${g}" opacity="0.15"/>
      <path d="M60,50 L30,20 L46,30 Z" fill="${g}" opacity="0.1"/>
      <path d="M60,50 L90,20 L74,30 Z" fill="${g}" opacity="0.1"/>
      <g class="leg-l">
        <path d="M50,120 Q44,148 42,172 Q42,182 50,186 Q58,186 58,174 Q58,148 54,120 Z" fill="#b89010"/>
        <path d="M50,122 Q46,152 46,170" stroke="${g}" stroke-width="2" fill="none" opacity="0.45"/>
        <ellipse cx="48" cy="170" rx="9" ry="7" fill="#806000"/>
        <ellipse cx="48" cy="168" rx="6" ry="4" fill="${g}" opacity="0.6"/>
        <path d="M42,176 Q40,190 44,198 Q50,202 58,200 Q60,192 58,182 Q52,178 46,176 Z" fill="#a08000"/>
        <path d="M40,198 Q43,202 52,204 Q60,202 60,196" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.6"/>
      </g>
      <g class="leg-r">
        <path d="M70,120 Q76,148 78,172 Q78,182 70,186 Q62,186 62,174 Q62,148 66,120 Z" fill="#b89010"/>
        <path d="M70,122 Q74,152 74,170" stroke="${g}" stroke-width="2" fill="none" opacity="0.45"/>
        <ellipse cx="72" cy="170" rx="9" ry="7" fill="#806000"/>
        <ellipse cx="72" cy="168" rx="6" ry="4" fill="${g}" opacity="0.6"/>
        <path d="M78,176 Q80,190 76,198 Q70,202 62,200 Q60,192 62,182 Q68,178 74,176 Z" fill="#a08000"/>
        <path d="M80,198 Q77,202 68,204 Q60,202 60,196" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.6"/>
      </g>
      <path d="M34,68 Q14,112 12,172 Q14,186 24,184 Q30,162 36,108 L42,70 Z" fill="${c}" opacity="0.7"/>
      <path d="M86,68 Q106,112 108,172 Q106,186 96,184 Q90,162 84,108 L78,70 Z" fill="${c}" opacity="0.7"/>
      <g class="body">
        <path d="M28,66 Q28,50 60,48 Q92,50 92,66 L90,120 L30,120 Z" fill="${c}"/>
        <path d="M28,66 L60,50 L60,118 Z" fill="${g}" opacity="0.2"/>
        <path d="M92,66 L60,50 L60,118 Z" fill="${g}" opacity="0.1"/>
        <path d="M42,72 L60,62 L60,104 L44,110 Z" fill="white" opacity="0.1"/>
        <path d="M78,72 L60,62 L60,104 L76,110 Z" fill="white" opacity="0.08"/>
        <circle cx="60" cy="75" r="11" fill="${g}" opacity="0.4"/>
        <circle cx="60" cy="75" r="7.5" fill="${g}" opacity="0.7"/>
        <circle cx="60" cy="75" r="4" fill="white"/>
        <path d="M60,62 L60,68 M60,82 L60,88 M47,75 L53,75 M67,75 L73,75 M51,66 L55,70 M65,80 L69,84 M69,66 L65,70 M55,80 L51,84" stroke="${g}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M30,118 L90,118 L88,130 L32,130 Z" fill="${c}" opacity="0.8"/>
        <path d="M16,56 Q8,44 16,34 Q26,28 36,40 L38,66 L22,64 Z" fill="${c}"/>
        <path d="M16,56 Q10,44 16,36 Q24,30 32,40" stroke="${g}" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M104,56 Q112,44 104,34 Q94,28 84,40 L82,66 L98,64 Z" fill="${c}"/>
        <path d="M104,56 Q110,44 104,36 Q96,30 88,40" stroke="${g}" stroke-width="2" fill="none" opacity="0.5"/>
      </g>
      <g class="arm-l">
        <path d="M26,64 Q12,74 8,98 Q6,116 16,126 Q26,132 32,122 Q38,108 36,84 L32,66 Z" fill="${c}" opacity="0.9"/>
        <path d="M24,64 Q12,74 10,96 Q8,114 18,124" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.4"/>
        <ellipse cx="20" cy="124" rx="8" ry="6" fill="#a08000"/>
        <ellipse cx="20" cy="122" rx="5.5" ry="4" fill="${g}" opacity="0.5"/>
        <path d="M10,124 Q4,140 6,158 Q10,170 20,168 Q30,165 28,152 Q26,134 18,126 Z" fill="#c8a800"/>
        <path d="M4,154 Q2,170 8,180 Q16,186 24,182 Q30,174 26,160 Z" fill="#a08000"/>
        <path d="M4,142 Q0,158 6,166" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
      </g>
      <g class="arm-r">
        <path d="M94,64 Q108,74 112,98 Q114,116 104,126 Q94,132 88,122 Q82,108 84,84 L88,66 Z" fill="${c}" opacity="0.9"/>
        <path d="M96,64 Q108,74 110,96 Q112,114 102,124" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.4"/>
        <ellipse cx="100" cy="124" rx="8" ry="6" fill="#a08000"/>
        <ellipse cx="100" cy="122" rx="5.5" ry="4" fill="${g}" opacity="0.5"/>
        <path d="M110,124 Q116,140 114,158 Q110,170 100,168 Q90,165 92,152 Q94,134 102,126 Z" fill="#c8a800"/>
        <path d="M116,154 Q118,170 112,180 Q104,186 96,182 Q90,174 94,160 Z" fill="#a08000"/>
        <rect x="108" y="172" width="7" height="22" rx="3" fill="#c8a800"/>
        <rect x="103" y="167" width="17" height="6" rx="3" fill="${g}"/>
        <path d="M109,166 L112,58 L115,166 Z" fill="${g}" opacity="0.82"/>
        <path d="M110,164 L112,66 L114,164 Z" fill="white" opacity="0.55"/>
        <path d="M108,166 L112,52 L116,166 Z" fill="${g}" opacity="0.2"/>
        <circle cx="112" cy="56" r="6" fill="${g}" opacity="0.8"/>
        <circle cx="112" cy="56" r="3" fill="white"/>
      </g>
      <g class="head">
        <path d="M44,22 Q40,6 60,4 Q80,6 76,22 Q80,10 76,18 Q80,28 78,38" fill="#c8a000" opacity="0.9"/>
        <path d="M40,24 Q36,12 40,6 Q52,2 60,4" fill="#e8c000" opacity="0.8"/>
        <path d="M78,22 Q86,28 84,44 Q82,52 78,54" stroke="#c8a000" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.85"/>
        <path d="M44,22 Q44,8 60,6 Q76,8 76,22 L76,44 Q76,54 60,56 Q44,54 44,44 Z" fill="#c8885a"/>
        <path d="M44,18 Q52,10 60,8 Q68,10 76,18" stroke="${g}" stroke-width="2.5" fill="none"/>
        <circle cx="60" cy="10" r="4" fill="${g}"/>
        <circle cx="60" cy="10" r="2.5" fill="white"/>
        <circle cx="50" cy="14" r="2.5" fill="${g}" opacity="0.7"/>
        <circle cx="70" cy="14" r="2.5" fill="${g}" opacity="0.7"/>
        <ellipse cx="52" cy="28" rx="6" ry="4.5" fill="#0a0a20" opacity="0.6"/>
        <ellipse cx="68" cy="28" rx="6" ry="4.5" fill="#0a0a20" opacity="0.6"/>
        <ellipse cx="52" cy="28" rx="4" ry="3" fill="#001040"/>
        <ellipse cx="68" cy="28" rx="4" ry="3" fill="#001040"/>
        <ellipse cx="52" cy="28" rx="2.5" ry="2" fill="${c}"/>
        <ellipse cx="68" cy="28" rx="2.5" ry="2" fill="${c}"/>
        <ellipse cx="51" cy="27" rx="1" ry="0.9" fill="white" opacity="0.8"/>
        <ellipse cx="67" cy="27" rx="1" ry="0.9" fill="white" opacity="0.8"/>
        <path d="M57,33 Q58,38 60,39 Q62,38 63,33" stroke="#a06840" stroke-width="1.2" fill="none" opacity="0.65"/>
        <path d="M52,48 Q56,51 60,50 Q64,51 68,48" stroke="#9a5030" stroke-width="1.6" fill="none"/>
        <path d="M54,48 Q60,52 66,48" stroke="#c06040" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M45,22 Q50,18 55,21" stroke="#8a5020" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M65,21 Q70,18 75,22" stroke="#8a5020" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="48" cy="38" rx="6" ry="3.5" fill="#e8a070" opacity="0.22"/>
        <ellipse cx="72" cy="38" rx="6" ry="3.5" fill="#e8a070" opacity="0.22"/>
      </g>
    `,

    // Atlas — Titan Juggernaut: Massive dark-skinned man in obsidian geo-tectonic power armor
    Atlas: (c, g) => `
      <ellipse cx="60" cy="197" rx="30" ry="6" fill="rgba(0,0,0,0.6)"/>
      <path d="M20,196 Q32,186 44,192 Q52,186 60,190 Q68,186 76,192 Q88,186 100,196" stroke="${g}" stroke-width="2" fill="none" opacity="0.4"/>
      <path d="M34,200 Q40,194 48,196" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.3"/>
      <path d="M72,196 Q80,194 86,200" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.3"/>
      <g class="leg-l">
        <path d="M44,122 Q36,150 34,172 Q34,184 44,188 Q54,188 56,176 Q56,150 50,122 Z" fill="#1a1a28"/>
        <path d="M44,124 Q38,154 38,172" stroke="${c}" stroke-width="2" fill="none" opacity="0.4"/>
        <ellipse cx="40" cy="170" rx="11" ry="8" fill="#0e0e1e"/>
        <ellipse cx="40" cy="168" rx="7" ry="5" fill="${c}" opacity="0.45"/>
        <path d="M32,176 Q30,192 36,198 Q44,202 54,198 Q58,190 56,180 Q48,176 40,174 Z" fill="#111120"/>
        <path d="M30,196 Q34,202 46,204 Q56,202 58,194" stroke="${g}" stroke-width="2" fill="none" opacity="0.4"/>
      </g>
      <g class="leg-r">
        <path d="M76,122 Q84,150 86,172 Q86,184 76,188 Q66,188 64,176 Q64,150 70,122 Z" fill="#1a1a28"/>
        <path d="M76,124 Q82,154 82,172" stroke="${c}" stroke-width="2" fill="none" opacity="0.4"/>
        <ellipse cx="80" cy="170" rx="11" ry="8" fill="#0e0e1e"/>
        <ellipse cx="80" cy="168" rx="7" ry="5" fill="${c}" opacity="0.45"/>
        <path d="M88,176 Q90,192 84,198 Q76,202 66,198 Q62,190 64,180 Q72,176 80,174 Z" fill="#111120"/>
        <path d="M90,196 Q86,202 74,204 Q64,202 62,194" stroke="${g}" stroke-width="2" fill="none" opacity="0.4"/>
      </g>
      <g class="body">
        <path d="M18,68 Q18,46 60,44 Q102,46 102,68 L100,122 L20,122 Z" fill="#1a1a28"/>
        <path d="M22,66 L60,46 L60,120 L22,120 Z" fill="${c}" opacity="0.1"/>
        <path d="M98,66 L60,46 L60,120 L98,120 Z" fill="#2a2a38" opacity="0.5"/>
        <path d="M26,68 L60,52 L94,68 L92,110 L28,110 Z" fill="#222232"/>
        <path d="M30,70 L60,56 L90,70 L88,108 L32,108 Z" fill="#28283a"/>
        <path d="M60,58 Q48,68 44,82 Q40,96 44,106" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
        <path d="M60,58 Q72,68 76,82 Q80,96 76,106" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.5"/>
        <path d="M44,82 L60,78 L76,82" stroke="${g}" stroke-width="1" fill="none" opacity="0.35"/>
        <circle cx="60" cy="72" r="12" fill="#0e0e1e"/>
        <circle cx="60" cy="72" r="8.5" fill="${c}" opacity="0.55"/>
        <circle cx="60" cy="72" r="5" fill="${g}"/>
        <circle cx="60" cy="72" r="2.5" fill="white" opacity="0.85"/>
        <path d="M10,64 Q2,48 10,34 Q22,26 36,38 L40,68 L16,70 Z" fill="${c}"/>
        <path d="M8,62 Q2,48 10,36 Q20,28 30,38" stroke="${g}" stroke-width="2" fill="none" opacity="0.4"/>
        <path d="M110,64 Q118,48 110,34 Q98,26 84,38 L80,68 L104,70 Z" fill="${c}"/>
        <path d="M112,62 Q118,48 110,36 Q100,28 90,38" stroke="${g}" stroke-width="2" fill="none" opacity="0.4"/>
        <path d="M20,120 L100,120 L102,134 L18,134 Z" fill="#111120"/>
        <path d="M20,126 L100,126" stroke="${g}" stroke-width="1" opacity="0.3"/>
      </g>
      <g class="arm-l">
        <path d="M20,66 Q6,78 2,104 Q0,122 12,132 Q22,138 30,128 Q38,112 36,88 L32,68 Z" fill="#1a1a28"/>
        <path d="M20,68 Q8,80 4,104 Q2,120 12,130" stroke="${c}" stroke-width="2" fill="none" opacity="0.35"/>
        <ellipse cx="12" cy="130" rx="11" ry="8" fill="#0e0e1e"/>
        <ellipse cx="12" cy="128" rx="7" ry="5" fill="${c}" opacity="0.4"/>
        <path d="M4,132 Q0,152 2,170 Q6,182 18,180 Q28,176 26,160 Q24,140 14,132 Z" fill="#16162a"/>
        <path d="M2,168 Q0,182 6,190 Q14,196 22,192 Q28,184 24,170 Z" fill="#0e0e1e"/>
        <path d="M2,178 Q4,190 12,194 Q20,196 24,190" stroke="${g}" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M4,182 Q10,178 18,180" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.6"/>
      </g>
      <g class="arm-r">
        <path d="M100,66 Q114,78 118,104 Q120,122 108,132 Q98,138 90,128 Q82,112 84,88 L88,68 Z" fill="#1a1a28"/>
        <path d="M100,68 Q112,80 116,104 Q118,120 108,130" stroke="${c}" stroke-width="2" fill="none" opacity="0.35"/>
        <ellipse cx="108" cy="130" rx="11" ry="8" fill="#0e0e1e"/>
        <ellipse cx="108" cy="128" rx="7" ry="5" fill="${c}" opacity="0.4"/>
        <path d="M116,132 Q120,152 118,170 Q114,182 102,180 Q92,176 94,160 Q96,140 106,132 Z" fill="#16162a"/>
        <path d="M118,168 Q120,182 114,190 Q106,196 98,192 Q92,184 96,170 Z" fill="#0e0e1e"/>
        <path d="M118,178 Q116,190 108,194 Q100,196 96,190" stroke="${g}" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M116,184 Q110,180 102,182" stroke="${g}" stroke-width="1.5" fill="none" opacity="0.6"/>
        <circle cx="114" cy="180" r="8" fill="${c}" opacity="0.2"/>
        <circle cx="114" cy="180" r="5" fill="${g}" opacity="0.25"/>
      </g>
      <g class="head">
        <path d="M38,32 Q38,6 60,4 Q82,6 82,32 L82,46 Q82,58 60,60 Q38,58 38,46 Z" fill="#0e0e1e"/>
        <path d="M42,18 Q38,6 32,2 Q34,12 40,22 Z" fill="${c}"/>
        <path d="M78,18 Q82,6 88,2 Q86,12 80,22 Z" fill="${c}"/>
        <path d="M44,24 Q44,10 60,8 Q76,10 76,24 L76,46 Q76,56 60,58 Q44,56 44,46 Z" fill="#5a3010"/>
        <rect x="40" y="22" width="40" height="7" rx="3.5" fill="#0e0e1e"/>
        <rect x="40" y="22" width="40" height="4" rx="2" fill="${c}" opacity="0.3"/>
        <path d="M40,28 Q36,36 38,48 Q42,58 46,56 L44,42 Z" fill="#111120"/>
        <path d="M80,28 Q84,36 82,48 Q78,58 74,56 L76,42 Z" fill="#111120"/>
        <ellipse cx="52" cy="34" rx="7" ry="5" fill="#0a0800" opacity="0.7"/>
        <ellipse cx="68" cy="34" rx="7" ry="5" fill="#0a0800" opacity="0.7"/>
        <ellipse cx="52" cy="34" rx="4.5" ry="3.2" fill="#1a0800"/>
        <ellipse cx="68" cy="34" rx="4.5" ry="3.2" fill="#1a0800"/>
        <ellipse cx="52" cy="34" rx="3" ry="2.2" fill="${c}"/>
        <ellipse cx="68" cy="34" rx="3" ry="2.2" fill="${c}"/>
        <ellipse cx="51" cy="33" rx="1.2" ry="1" fill="white" opacity="0.75"/>
        <ellipse cx="67" cy="33" rx="1.2" ry="1" fill="white" opacity="0.75"/>
        <path d="M44,28 Q50,24 56,27" stroke="#2a1008" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M64,27 Q70,24 76,28" stroke="#2a1008" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M56,40 Q56,45 60,46 Q64,45 64,40" stroke="#4a2008" stroke-width="1.8" fill="none" opacity="0.7"/>
        <path d="M46,52 Q54,58 60,58 Q66,58 74,52" stroke="#3a1808" stroke-width="2" fill="none" opacity="0.5"/>
      </g>
    `
  };

  // ── DRAW INTRO PORTRAITS ───────────────────────────────────
  function drawIntroPortraits() {
    Object.keys(AVATARS).forEach(name => {
      const el = $(`portrait-${name}`);
      if (!el) return;
      const av = AVATARS[name];
      el.innerHTML = `<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <radialGradient id="bg-${name}" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stop-color="${av.color}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#060611" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="120" height="200" fill="url(#bg-${name})"/>
        ${(CHARACTER_SVGS[name] || (() => ""))(av.color, av.glow)}
      </svg>`;
    });
  }

  // ── DRAW BATTLE SPRITES ────────────────────────────────────
  function drawBattleSprite(svgEl, name, isP2) {
    const av = AVATARS[name];
    if (!av || !svgEl) return;
    const flip = isP2;
    svgEl.setAttribute("viewBox", "0 0 120 200");
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgEl.style.filter = `drop-shadow(0 0 16px ${av.glow}) drop-shadow(0 8px 24px rgba(0,0,0,0.9))`;
    if (flip) svgEl.style.transform = "scaleX(-1)";
    const body = CHARACTER_SVGS[name] ? CHARACTER_SVGS[name](av.color, av.glow) : "";
    svgEl.innerHTML = `
      <defs>
        <radialGradient id="grd-${name}" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stop-color="${av.color}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="120" height="200" fill="url(#grd-${name})"/>
      ${body}
    `;
  }

  // ── EVENTS ────────────────────────────────────────────────
  $("btn-manual").addEventListener("click", () => {
    mode = "manual"; qsa(".mode-btn").forEach(b=>b.classList.remove("active")); $("btn-manual").classList.add("active");
    $("opponent-section").style.display = "";
  });
  $("btn-auto").addEventListener("click", () => {
    mode = "auto"; qsa(".mode-btn").forEach(b=>b.classList.remove("active")); $("btn-auto").classList.add("active");
    $("opponent-section").style.display = "none";
  });
  qsa(".avatar-card").forEach(card => card.addEventListener("click", () => {
    qsa(".avatar-card").forEach(c=>c.classList.remove("selected")); card.classList.add("selected");
    selectedPlayer = card.dataset.avatar;
  }));
  qsa(".opp-chip").forEach(chip => chip.addEventListener("click", () => {
    qsa(".opp-chip").forEach(c=>c.classList.remove("selected")); chip.classList.add("selected");
    selectedOpponent = chip.dataset.opp;
  }));
  $("start-btn").addEventListener("click", () => {
    if (!selectedPlayer) { shake($("avatar-picker")); return; }
    if (mode === "manual" && !selectedOpponent) { shake($("opponent-picker")); return; }
    const opp = mode === "auto" ? randomAvatar(selectedPlayer) : selectedOpponent;
    buildGameState(selectedPlayer, opp);
    showScreen("battle");
    renderBattle();
    renderMoves();
    startBattleCanvas();
    if (mode === "auto") { $("mode-toggle").checked = true; setTimeout(() => autoTurn(), 1800); }
    else if (!gameState.playerTurn) { setTimeout(() => aiTurn(), 1000); }
  });
  $("mode-toggle").addEventListener("change", e => {
    mode = e.target.checked ? "auto" : "manual";
    if (!gameState) return;
    if (mode === "auto") { addLog("🤖 Auto battle activated!", "buff"); $("moves-panel").classList.add("hidden"); autoTurn(); }
    else { clearTimeout(autoTimer); addLog("⚔️ Manual mode — your turn!", ""); updateTurnIndicator(); }
  });
  $("quit-btn").addEventListener("click", () => { clearTimeout(autoTimer); clearTimeout(blockTimer); blockActive=false; $("block-btn-wrap").classList.add("hidden"); cancelAnimationFrame(battleRafId); showScreen("intro"); });
  qsa(".diff-btn").forEach(btn => btn.addEventListener("click", () => {
    difficulty = parseInt(btn.dataset.diff); qsa(".diff-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active");
  }));
  $("moves-grid").addEventListener("click", e => {
    const btn = e.target.closest(".move-btn"); if (!btn) return;
    if (!gameState || gameState.animating || gameState.over || !gameState.playerTurn || mode==="auto") return;
    executeMove("p1", "p2", parseInt(btn.dataset.idx));
  });
  $("btn-rematch").addEventListener("click", () => {
    buildGameState(gameState.p1.name, gameState.p2.name);
    showScreen("battle"); renderBattle(); renderMoves(); startBattleCanvas();
    if (mode === "auto") setTimeout(() => autoTurn(), 1800);
    else if (!gameState.playerTurn) setTimeout(() => aiTurn(), 1000);
  });
  $("btn-menu").addEventListener("click", () => { gameState = null; showScreen("intro"); });
  $("block-btn").addEventListener("click", () => {
    const wrap = $("block-btn-wrap");
    if (wrap.classList.contains("hidden")) return;
    blockActive = true;
    clearTimeout(blockTimer);
    wrap.classList.add("hidden");
    fxText("🛡️ BLOCKING!", "#00e5ff", "p1");
  });

  // ── GAME STATE ────────────────────────────────────────────
  function buildGameState(p1Name, p2Name) {
    clearTimeout(autoTimer);
    const mk = (d, n) => ({ name:n, title:d.title, element:d.element, color:d.color, glow:d.glow, moves:d.moves,
      maxHp:d.hp, maxMp:d.mp, hp:d.hp, mp:d.mp, attack:d.attack, defense:d.defense, speed:d.speed,
      status:[], atkMod:1, defMod:1, evasion:false });
    gameState = { p1: mk(AVATARS[p1Name], p1Name), p2: mk(AVATARS[p2Name], p2Name),
      playerTurn: true, round: 1, over: false, animating: false };
    if (gameState.p2.speed > gameState.p1.speed) gameState.playerTurn = false;
  }

  function renderBattle() {
    const s = gameState;
    $("p1-name").textContent = s.p1.name.toUpperCase(); $("p2-name").textContent = s.p2.name.toUpperCase();
    $("round-num").textContent = s.round;
    $("score-p1").textContent = scores.p1; $("score-p2").textContent = scores.p2;
    updateBars();
    // Draw character sprites
    drawBattleSprite($("char-svg-p1"), s.p1.name, false);
    drawBattleSprite($("char-svg-p2"), s.p2.name, true);
    $("sprite-p1").className = "fighter-sprite idle";
    $("sprite-p2").className = "fighter-sprite idle";
    $("battle-log").innerHTML = '<div class="log-entry intro-entry">The battle begins!</div>';
    updateTurnIndicator();
  }

  function renderMoves() {
    const s = gameState, grid = $("moves-grid"); grid.innerHTML = "";
    s.p1.moves.forEach((m, i) => {
      const btn = document.createElement("button");
      btn.className = "move-btn" + (m.cost > s.p1.mp ? " insufficient-mp" : "");
      btn.dataset.idx = i;
      const dmg = m.damage[1] > 0 ? `<div class="move-btn-dmg">${m.damage[0]}–${m.damage[1]}</div>` : "";
      btn.innerHTML = `<span class="move-btn-name">${m.name}</span><div class="move-btn-cost">${m.cost>0?m.cost+' MP':'FREE'}</div><div class="move-btn-type">${m.type}</div>${dmg}`;
      grid.appendChild(btn);
    });
  }

  function updateBars() {
    const s = gameState; if (!s) return;
    const hp1 = Math.max(0, s.p1.hp/s.p1.maxHp*100), hp2 = Math.max(0, s.p2.hp/s.p2.maxHp*100);
    $("hp-bar-p1").style.width = hp1+"%"; $("hp-bar-p2").style.width = hp2+"%";
    $("mp-bar-p1").style.width = Math.max(0,s.p1.mp/s.p1.maxMp*100)+"%";
    $("mp-bar-p2").style.width = Math.max(0,s.p2.mp/s.p2.maxMp*100)+"%";
    $("hp-text-p1").textContent = Math.max(0,Math.round(s.p1.hp));
    $("hp-text-p2").textContent = Math.max(0,Math.round(s.p2.hp));
    $("mp-text-p1").textContent = Math.round(s.p1.mp);
    $("mp-text-p2").textContent = Math.round(s.p2.mp);
    const sc = (bar,pct,psn) => {
      bar.classList.remove("low","poisoned");
      if(psn){bar.classList.add("poisoned");return;}
      if(pct<=25){bar.style.background="linear-gradient(90deg,#c62828,#ff1744)";bar.classList.add("low");}
      else if(pct<=50) bar.style.background="linear-gradient(90deg,#f57f17,#ffea00)";
      else bar.style.background="";
    };
    sc($("hp-bar-p1"),hp1,s.p1.status.some(st=>st.type==="poison"));
    sc($("hp-bar-p2"),hp2,s.p2.status.some(st=>st.type==="poison"));
    renderStatus($("status-p1"),s.p1.status); renderStatus($("status-p2"),s.p2.status);
    renderMoves();
  }

  function renderStatus(el,statuses) {
    const ic={poison:"☠️",atk_up:"⚔️",def_up:"🛡️",slow:"🐢",evade:"💨",mp_restore:"💧"};
    el.innerHTML=statuses.map(s=>`<span class="status-icon">${ic[s.type]||"✨"}</span>`).join("");
  }

  function updateTurnIndicator() {
    const s = gameState; if (!s) return;
    $("turn-text").textContent = (s.playerTurn ? s.p1.name : s.p2.name)+"'s Turn";
    $("turn-indicator").style.borderColor = s.playerTurn ? s.p1.color : s.p2.color;
    const mp = $("moves-panel");
    if (mode==="manual" && s.playerTurn && !s.over) mp.classList.remove("hidden");
    else mp.classList.add("hidden");
  }

  function addLog(msg, cls) {
    const el = document.createElement("div"); el.className = "log-entry"+(cls?" "+cls:""); el.textContent = msg;
    const log = $("battle-log"); log.appendChild(el); log.scrollTop = log.scrollHeight;
    if (log.children.length > 40) log.removeChild(log.firstChild);
  }

  // ── MOVE EXECUTION ────────────────────────────────────────
  function executeMove(atkId, defId, moveIdx) {
    const s = gameState; if (s.animating || s.over) return;
    const atk = s[atkId], def = s[defId], move = atk.moves[moveIdx];
    if (move.cost > atk.mp) {
      // Manual player picked an unaffordable move — just warn, let them choose again
      if (mode==="manual" && atkId==="p1") { addLog(`⚠️ ${atk.name} needs more MP — pick another move!`); return; }
      // AI / auto: restore MP, log it, then advance the turn cleanly
      const restore = Math.max(15, Math.round(atk.maxMp * 0.35));
      atk.mp = Math.min(atk.maxMp, atk.mp + restore);
      addLog(`💧 ${atk.name} recovers ${restore} MP!`, "buff"); updateBars();
      s.round++; s.playerTurn = !s.playerTurn;
      $("round-num").textContent = s.round; updateTurnIndicator();
      if (s.round > 80) { endGame("draw"); return; }
      if (mode==="auto") { autoTimer=setTimeout(()=>autoTurn(),([1200,900,600,350][difficulty]||900)); }
      else if (!s.playerTurn) { autoTimer=setTimeout(()=>aiTurn(), 800+Math.random()*500); }
      return;
    }
    s.animating = true; atk.mp = Math.max(0, atk.mp - move.cost);

    // Character attack animation
    const atkSprite = $(atkId==="p1"?"sprite-p1":"sprite-p2");
    const defSprite = $(atkId==="p1"?"sprite-p2":"sprite-p1");
    atkSprite.className = "fighter-sprite " + (atkId==="p1" ? "p1-attacking" : "p2-attacking");

    // Spawn rush particles
    spawnRushParticles(atkId, atk.color);

    setTimeout(() => {
      let logMsg = "", logClass = "";

      if (move.type === "heal") {
        const heal = Math.round(20 + atk.attack * 0.3 + Math.random() * 15);
        atk.hp = Math.min(atk.maxHp, atk.hp + heal);
        logMsg = `✨ ${atk.name} heals for ${heal} HP!`; logClass = "heal";
        atkSprite.className = "fighter-sprite healing";
        fxText("+"+heal+" HP","#00e676",atkId);

      } else if (move.type==="buff" || move.type==="defend") {
        if(move.effect==="mp_restore"){const mp=20+Math.round(Math.random()*10);atk.mp=Math.min(atk.maxMp,atk.mp+mp);logMsg=`💧 ${atk.name} restores ${mp} MP!`;logClass="buff";}
        else if(move.effect==="atk_up"){atk.atkMod=Math.min(2,atk.atkMod+0.3);logMsg=`⚔️ ${atk.name}'s power rises!`;logClass="buff";}
        else if(move.effect==="def_up"){atk.defMod=Math.min(2,atk.defMod+0.35);logMsg=`🛡️ ${atk.name} fortifies!`;logClass="buff";}
        else if(move.effect==="evade"){atk.evasion=true;atk.status.push({type:"evade",turns:2});logMsg=`💨 ${atk.name} enters stealth!`;logClass="buff";}
        atkSprite.className = "fighter-sprite buffing";
        if(move.effect) atk.status.push({type:move.effect,turns:3});

      } else {
        const base = move.damage[0] + Math.random()*(move.damage[1]-move.damage[0]);
        const isCrit = Math.random() < 0.15;
        const factor = Math.max(0.3, 1 - def.defMod*def.defense/120);
        const evaded = def.evasion && Math.random() < 0.5;
        const blocked = blockActive; blockActive = false;
        $("block-btn-wrap").classList.add("hidden");
        const rawDmg = evaded ? 0 : Math.round(base * atk.atkMod * (isCrit?1.8:1) * factor);
        const dmg = (blocked && !evaded) ? Math.round(rawDmg * 0.35) : rawDmg;
        if (evaded) { logMsg=`💨 ${def.name} dodges!`; fxText("DODGE!","#aaa",defId); }
        else if (blocked) {
          def.hp = Math.max(0, def.hp-dmg);
          logMsg = `🛡️ ${def.name} BLOCKS! → only ${dmg} DMG`;
          logClass = "buff";
          defSprite.className = "fighter-sprite " + (defId==="p1"?"p1-hit":"p2-hit");
          fxHit("shield", defId, false);
          fxText("BLOCKED! -"+dmg, "#00e5ff", defId);
          spawnImpactParticles(defId, "#00e5ff", false);
        } else {
          def.hp = Math.max(0, def.hp-dmg);
          if(move.effect==="poison") def.status.push({type:"poison",turns:4});
          if(move.effect==="slow")   def.status.push({type:"slow",turns:3});
          logMsg = `💥 ${atk.name} → ${move.name}${isCrit?" [CRIT!]":""} → ${dmg} DMG`;
          logClass = isCrit ? "crit" : "";
          // Hit animation
          defSprite.className = "fighter-sprite " + (defId==="p1"?"p1-hit":"p2-hit");
          fxHit(move.fx, defId, isCrit);
          fxText(isCrit?"💥 CRIT! "+dmg:"-"+dmg, isCrit?"#ff6b35":"#ff4444", defId);
          spawnImpactParticles(defId, atk.color, isCrit);
        }
      }

      addLog(logMsg, logClass); updateBars();

      setTimeout(() => {
        atkSprite.className = "fighter-sprite idle";
        defSprite.className = "fighter-sprite idle";
        if (def.hp <= 0) { endGame(atkId); return; }
        processStatus(atkId==="p1"?"p2":"p1");
        if (s.over) return;
        // Natural MP regen each turn — ensures neither fighter ever runs completely dry
        s.p1.mp = Math.min(s.p1.maxMp, s.p1.mp + 10);
        s.p2.mp = Math.min(s.p2.maxMp, s.p2.mp + 10);
        s.round++; s.playerTurn = !s.playerTurn;
        $("round-num").textContent = s.round;
        updateTurnIndicator(); s.animating = false; updateBars();
        if (s.round > 80) { endGame("draw"); return; }
        if (mode==="auto") { const d=[1200,900,600,350][difficulty]||900; autoTimer=setTimeout(()=>autoTurn(),d); }
        else if (!s.playerTurn) { autoTimer=setTimeout(()=>aiTurn(),800+Math.random()*600); }
      }, 420);
    }, 380);
  }

  function processStatus(pid) {
    const pl = gameState[pid]; const rm = [];
    pl.status.forEach((st,i)=>{
      if(st.type==="poison"){const d=Math.round(5+Math.random()*6);pl.hp=Math.max(0,pl.hp-d);addLog(`☠️ ${pl.name} takes ${d} poison dmg!`,"poison");if(pl.hp<=0){gameState.over=true;setTimeout(()=>endGame(pid==="p1"?"p2":"p1"),200);}}
      st.turns--; if(st.turns<=0)rm.push(i);
    });
    rm.reverse().forEach(i=>pl.status.splice(i,1));
    if(!pl.status.some(s=>s.type==="atk_up"))pl.atkMod=Math.max(1,pl.atkMod-0.05);
    if(!pl.status.some(s=>s.type==="def_up"))pl.defMod=Math.max(1,pl.defMod-0.05);
    if(!pl.status.some(s=>s.type==="evade"))pl.evasion=false;
    updateBars();
  }

  // ── AI ────────────────────────────────────────────────────
  const autoTurn = () => { const s=gameState; if(!s||s.over)return; if(s.animating){autoTimer=setTimeout(()=>autoTurn(),300);return;} const id=s.playerTurn?"p1":"p2"; executeMove(id,id==="p1"?"p2":"p1",aiChoose(id)); };
  const aiTurn  = () => {
    const s=gameState; if(!s||s.over)return; if(s.animating){autoTimer=setTimeout(()=>aiTurn(),300);return;}
    const moveIdx=aiChoose("p2"), move=s.p2.moves[moveIdx];
    if(mode==="manual" && move.type!=="heal" && move.type!=="buff" && move.type!=="defend" && move.cost<=s.p2.mp) {
      addLog(`⚡ ${s.p2.name} charges ${move.name}!`,"");
      showBlockBtn(600);
      autoTimer=setTimeout(()=>executeMove("p2","p1",moveIdx), 650);
    } else {
      executeMove("p2","p1",moveIdx);
    }
  };

  function showBlockBtn(ms) {
    blockActive = false;
    clearTimeout(blockTimer);
    const wrap = $("block-btn-wrap");
    wrap.classList.remove("hidden");
    const fill = $("block-timer-fill");
    fill.style.animation = "none"; void fill.offsetWidth;
    fill.style.animation = `blockDrain ${ms}ms linear forwards`;
    blockTimer = setTimeout(() => { wrap.classList.add("hidden"); blockActive = false; }, ms);
  }

  function aiChoose(pid) {
    const ai=gameState[pid], opp=gameState[pid==="p1"?"p2":"p1"];
    // Build list of affordable move indices; fall back to cheapest if none affordable
    const can=ai.moves.reduce((a,m,i)=>{if(m.cost<=ai.mp)a.push(i);return a;},[]);
    if(!can.length) return ai.moves.reduce((bi,m,i)=>m.cost<ai.moves[bi].cost?i:bi,0);
    const rand=[0.6,0.3,0.1,0.0][difficulty]||0.3;
    // Random path only picks from AFFORDABLE moves
    if(Math.random()<rand) return can[Math.floor(Math.random()*can.length)];
    let best=-Infinity, bi=can[0];
    ai.moves.forEach((m,i)=>{
      if(m.cost>ai.mp)return; let sc=0;
      if(m.type==="heal") sc=((ai.maxHp-ai.hp)/ai.maxHp)*80+(ai.hp<ai.maxHp*.3?50:0);
      else if(m.type==="buff"||m.type==="defend"){sc=30;if(m.effect==="mp_restore"&&ai.mp<ai.maxMp*.3)sc+=40;if(m.effect==="atk_up"&&ai.atkMod<1.3)sc+=25;}
      else{const avg=(m.damage[0]+m.damage[1])/2;sc=avg*ai.atkMod*Math.max(.3,1-opp.defMod*opp.defense/120);if(opp.hp<=avg*1.5)sc*=2;if(m.effect==="poison"&&!opp.status.some(s=>s.type==="poison"))sc+=20;}
      sc+=Math.random()*8;if(sc>best){best=sc;bi=i;}
    });return bi;
  }

  // ── GAME END ──────────────────────────────────────────────
  function endGame(winnerId) {
    const s = gameState; s.over=true; s.animating=false; clearTimeout(autoTimer); clearTimeout(blockTimer); blockActive=false; $("block-btn-wrap").classList.add("hidden"); cancelAnimationFrame(battleRafId);
    let winner = null;
    if (winnerId==="draw") { addLog("⚖️ DRAW! Both warriors fall!","crit"); }
    else {
      winner = s[winnerId]; addLog(`🏆 ${winner.name} WINS!`,"crit");
      const loserSprite = $(winnerId==="p1"?"sprite-p2":"sprite-p1");
      loserSprite.className = "fighter-sprite "+(winnerId==="p1"?"p2-dead":"p1-dead");
      if(winnerId==="p1")scores.p1++;else scores.p2++;
    }
    fetch("/scores",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Token":window.CSRF_TOKEN||""},
      body:JSON.stringify({player1_avatar:s.p1.name,player2_avatar:s.p2.name,winner:winner?winner.name:"draw"})
    }).then(r=>r.json()).then(d=>{if(d.leaderboard)renderLeaderboard(d.leaderboard);}).catch(()=>{});
    setTimeout(()=>{showResult(winnerId,winner,s);if(winner)launchConfetti(winner.color);},1200);
  }

  function showResult(wid, winner, s) {
    showScreen("result");
    const isDraw=wid==="draw", isWin=wid==="p1";
    $("result-badge").textContent=isDraw?"⚖️":isWin?"🏆":"💀";
    $("result-title").textContent=isDraw?"DRAW!":isWin?"VICTORY!":"DEFEATED!";
    $("result-title").className="result-title"+(isDraw?" draw":isWin?"":" defeat");
    $("result-winner-name").textContent=isDraw?"Both warriors fall!":winner.name.toUpperCase()+" — "+winner.title;
    if(winner){const el=$("result-winner-svg");el.innerHTML=`<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${(CHARACTER_SVGS[winner.name]||((c,g)=>""))(winner.color,winner.glow)}</svg>`;el.querySelector("svg").style.filter=`drop-shadow(0 0 20px ${winner.glow})`;}
    else $("result-winner-svg").innerHTML="";
    $("result-stats").innerHTML=`<div class="result-stat"><span>ROUNDS</span>${s.round}</div><div class="result-stat"><span>${s.p1.name.toUpperCase()} HP</span>${Math.max(0,Math.round(s.p1.hp))}</div><div class="result-stat"><span>${s.p2.name.toUpperCase()} HP</span>${Math.max(0,Math.round(s.p2.hp))}</div><div class="result-stat"><span>P1 WINS</span>${scores.p1}</div><div class="result-stat"><span>P2 WINS</span>${scores.p2}</div>`;
  }

  function renderLeaderboard(lb) {
    $("lb-list").innerHTML=lb.slice(0,5).map((r,i)=>`<div class="lb-row"><span class="lb-rank">#${i+1}</span><span class="lb-name">${r.name}</span><span class="lb-wins">▲${r.wins}</span><span class="lb-losses">▼${r.losses}</span><span class="lb-draws">=${r.draws}</span><span class="lb-rate">${r.win_rate}%</span></div>`).join("");
  }

  // ── FX ────────────────────────────────────────────────────
  function fxHit(type, targetId, isCrit) {
    const em={slash:"⚔️",explosion:"💥",orb:"🔮",rift:"🌀",dash:"💨",poison:"☠️",blades:"🗡️",beam:"✨",sunburst:"☀️",quake:"🌋",meteor:"☄️",aura:"🌟",shield:"🛡️",heal:"💚",smoke:"💨",gravity:"🌌",sparkle:"✨",armor:"🛡️",eruption:"🔥",barrier:"🔷"};
    const el=$("fx-hit"); el.textContent=em[type]||"💥";
    const rect=$(targetId==="p1"?"wrap-p1":"wrap-p2").getBoundingClientRect();
    el.style.cssText=`left:${rect.left+rect.width/2-35}px;top:${rect.top+rect.height*.25}px;font-size:${isCrit?90:65}px;animation:none;opacity:1;position:absolute;pointer-events:none;`;
    void el.offsetWidth; el.style.animation="fxHitAnim 0.7s ease forwards";
    setTimeout(()=>el.style.opacity="0",700);
  }

  function fxText(text, color, targetId) {
    const el=$("fx-text"); el.textContent=text; el.style.color=color;
    const rect=$(targetId==="p1"?"wrap-p1":"wrap-p2").getBoundingClientRect();
    el.style.cssText=`left:${rect.left+rect.width/2-50}px;top:${rect.top+10}px;color:${color};animation:none;opacity:1;position:absolute;pointer-events:none;`;
    void el.offsetWidth; el.style.animation="fxTextAnim 1s ease forwards";
    setTimeout(()=>el.style.opacity="0",1000);
  }

  // ── CANVAS PARTICLES ─────────────────────────────────────
  function initParticles() {
    const c=$("particle-canvas"); pCtx=c.getContext("2d");
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize); window.addEventListener("orientationchange",()=>setTimeout(resize,120));
    const cols=["#7c6cfc","#fc6c9b","#00e676","#ffd700","#2196f3","#ff6b35"];
    for(let i=0;i<60;i++) particles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:(Math.random()-.5)*.4,vy:-(Math.random()*.5+.2),r:Math.random()*2.5+.5,alpha:Math.random()*.6+.1,color:cols[Math.floor(Math.random()*cols.length)],life:1});
    animParticles();
  }

  function animParticles() {
    const c=$("particle-canvas"); pCtx.clearRect(0,0,c.width,c.height);
    particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;p.life-=.003;if(p.y<0||p.life<=0){const cols=["#7c6cfc","#fc6c9b","#00e676","#ffd700","#2196f3","#ff6b35"];particles[i]={x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.4,vy:-(Math.random()*.5+.2),r:Math.random()*2.5+.5,alpha:Math.random()*.6+.1,color:cols[Math.floor(Math.random()*cols.length)],life:1};return;}
      pCtx.beginPath();pCtx.arc(p.x,p.y,p.r,0,Math.PI*2);pCtx.fillStyle=p.color;pCtx.globalAlpha=p.alpha*p.life;pCtx.fill();});
    pCtx.globalAlpha=1; rafId=requestAnimationFrame(animParticles);
  }

  function startBattleCanvas() {
    const c=$("battle-canvas");
    const resizeB=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resizeB(); window.addEventListener("resize",resizeB); window.addEventListener("orientationchange",()=>setTimeout(resizeB,120));
    bCtx=c.getContext("2d"); battleParticles=[];
    const loop=()=>{bCtx.clearRect(0,0,c.width,c.height);battleParticles=battleParticles.filter(p=>p.life>0);
      battleParticles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.life-=.02;bCtx.beginPath();bCtx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);bCtx.fillStyle=p.color;bCtx.globalAlpha=p.life*.8;bCtx.fill();});
      bCtx.globalAlpha=1; battleRafId=requestAnimationFrame(loop);};
    loop();
  }

  function spawnRushParticles(atkId, color) {
    const rect=$(atkId==="p1"?"wrap-p1":"wrap-p2").getBoundingClientRect();
    const dir = atkId==="p1" ? 1 : -1;
    for(let i=0;i<12;i++){const a=Math.random()*Math.PI-.5;const spd=Math.random()*6+3;
      battleParticles.push({x:rect.left+rect.width/2,y:rect.top+rect.height*.5,vx:Math.cos(a)*spd*dir,vy:Math.sin(a)*spd,r:Math.random()*4+2,color,life:1});}
  }

  function spawnImpactParticles(targetId, color, isCrit) {
    const rect=$(targetId==="p1"?"wrap-p1":"wrap-p2").getBoundingClientRect();
    const n = isCrit ? 30 : 18;
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,spd=Math.random()*(isCrit?8:5)+2;
      battleParticles.push({x:rect.left+rect.width/2,y:rect.top+rect.height*.35,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-2,r:Math.random()*(isCrit?7:4)+2,color,life:1});}
    // Extra white flash for crit
    if(isCrit){for(let i=0;i<15;i++){const a=Math.random()*Math.PI*2,spd=Math.random()*10+4;
      battleParticles.push({x:rect.left+rect.width/2,y:rect.top+rect.height*.35,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-3,r:Math.random()*5+3,color:"#ffffff",life:1});}}
  }

  function launchConfetti(color) {
    const c=$("confetti-canvas"); c.width=window.innerWidth; c.height=window.innerHeight;
    const ctx=c.getContext("2d"); const cols=[color,"#ffd700","#fff","#7c6cfc","#fc6c9b","#00e676"];
    confettiParticles=Array.from({length:150},()=>({x:Math.random()*c.width,y:-30-Math.random()*100,vx:(Math.random()-.5)*3,vy:Math.random()*4+2,color:cols[Math.floor(Math.random()*cols.length)],w:Math.random()*10+4,h:Math.random()*6+3,rot:Math.random()*Math.PI*2,rotV:(Math.random()-.5)*.2,life:1}));
    const loop=()=>{ctx.clearRect(0,0,c.width,c.height);confettiParticles=confettiParticles.filter(p=>p.life>0);
      confettiParticles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.rot+=p.rotV;p.life-=.005;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.globalAlpha=p.life;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
      ctx.globalAlpha=1;if(confettiParticles.length>0)requestAnimationFrame(loop);};
    loop();
  }

  // ── BOOT ─────────────────────────────────────────────────
  drawIntroPortraits();
  initParticles();
  console.log("ARENA loaded ⚔️ Warriors:", Object.keys(AVATARS).join(", "));

})();
