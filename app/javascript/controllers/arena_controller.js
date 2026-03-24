import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "introScreen", "battleScreen", "resultScreen",
    "particleCanvas", "battleCanvas", "confettiCanvas",
    "panel1", "panel2",
    "p1Name", "p2Name", "p1Title", "p2Title",
    "hpBar1", "hpBar2", "mpBar1", "mpBar2",
    "hpText1", "hpText2", "mpText1", "mpText2",
    "statusIcons1", "statusIcons2",
    "sprite1", "sprite2", "svgP1", "svgP2",
    "score1", "score2",
    "roundNum", "battleLog", "turnIndicator", "turnText",
    "movesPanel", "movesGrid",
    "vsFlash", "fxOverlay", "fxHit", "fxText",
    "resultBadge", "resultTitle", "resultWinnerName",
    "resultWinnerSvg", "resultStats", "leaderboardPanel", "lbList"
  ]

  static values = { avatars: Object }

  connect() {
    this.mode = "manual"
    this.difficulty = 1
    this.selectedPlayer = null
    this.selectedOpponent = null
    this.gameState = null
    this.autoTimer = null
    this.scores = { p1: 0, p2: 0 }
    this.particles = []
    this.confettiParticles = []

    this._initParticles()
    this._animParticles()
  }

  disconnect() {
    cancelAnimationFrame(this._rafId)
    cancelAnimationFrame(this._battleRafId)
    clearTimeout(this.autoTimer)
  }

  // ─────────────────────────────────────────────────
  //  INTRO ACTIONS
  // ─────────────────────────────────────────────────

  setMode(e) {
    this.mode = e.currentTarget.dataset.mode
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"))
    e.currentTarget.classList.add("active")
    const oppSection = document.querySelector(".opponent-section")
    oppSection.style.display = this.mode === "auto" ? "none" : ""
  }

  pickAvatar(e) {
    const card = e.currentTarget
    const name = card.dataset.avatar
    document.querySelectorAll(".avatar-card").forEach(c => c.classList.remove("selected"))
    card.classList.add("selected")
    this.selectedPlayer = name
  }

  pickOpponent(e) {
    const chip = e.currentTarget
    const name = chip.dataset.opp
    document.querySelectorAll(".opp-chip").forEach(c => c.classList.remove("selected"))
    chip.classList.add("selected")
    this.selectedOpponent = name
  }

  startGame() {
    if (!this.selectedPlayer) {
      this._shake(document.getElementById("avatar-picker")); return
    }
    if (this.mode === "manual" && !this.selectedOpponent) {
      this._shake(document.querySelector(".opponent-chips")); return
    }

    const opp = this.mode === "auto"
      ? this._randomAvatar(this.selectedPlayer)
      : this.selectedOpponent

    if (this.selectedPlayer === opp && this.mode !== "auto") {
      this.selectedOpponent = this._randomAvatar(this.selectedPlayer)
    }

    this._buildGameState(this.selectedPlayer, opp || this.selectedOpponent)
    this._showScreen("battle")
    this._renderBattle()
    this._renderMoves()
    this._startBattleCanvas()

    if (this.mode === "auto") {
      document.getElementById("mode-toggle").checked = true
      setTimeout(() => this._autoTurn(), 1500)
    }
  }

  // ─────────────────────────────────────────────────
  //  BATTLE ACTIONS
  // ─────────────────────────────────────────────────

  toggleMode(e) {
    this.mode = e.target.checked ? "auto" : "manual"
    if (!this.gameState) return
    if (this.mode === "auto") {
      this._addLog("🤖 Auto battle activated!", "buff")
      this.movesPanelTarget.classList.add("hidden")
      this._autoTurn()
    } else {
      clearTimeout(this.autoTimer)
      this._addLog("⚔️ Manual mode. Your turn!", "")
      if (!this.gameState.playerTurn) {
        this.movesPanelTarget.classList.add("hidden")
      } else {
        this.movesPanelTarget.classList.remove("hidden")
      }
    }
  }

  setDifficulty(e) {
    this.difficulty = parseInt(e.currentTarget.dataset.diff)
    document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"))
    e.currentTarget.classList.add("active")
  }

  useMove(e) {
    if (!this.gameState || this.gameState.animating || this.gameState.over) return
    if (!this.gameState.playerTurn) return
    const idx = parseInt(e.currentTarget.dataset.idx)
    this._executeMove("p1", "p2", idx)
  }

  quitGame() {
    clearTimeout(this.autoTimer)
    cancelAnimationFrame(this._battleRafId)
    this._showScreen("intro")
  }

  // ─────────────────────────────────────────────────
  //  RESULT ACTIONS
  // ─────────────────────────────────────────────────

  rematch() {
    this._buildGameState(this.gameState.p1.name, this.gameState.p2.name)
    this._showScreen("battle")
    this._renderBattle()
    this._renderMoves()
    this._startBattleCanvas()
    if (this.mode === "auto") setTimeout(() => this._autoTurn(), 1500)
  }

  backToMenu() {
    this.gameState = null
    this._showScreen("intro")
  }

  // ─────────────────────────────────────────────────
  //  GAME STATE
  // ─────────────────────────────────────────────────

  _buildGameState(p1Name, p2Name) {
    clearTimeout(this.autoTimer)
    const a1 = this.avatarsValue[p1Name]
    const a2 = this.avatarsValue[p2Name]

    const makePlayer = (data, name) => ({
      name,
      title: data.title,
      element: data.element,
      color: data.color,
      glow: data.glow,
      moves: data.moves,
      maxHp: data.hp,
      maxMp: data.mp,
      hp: data.hp,
      mp: data.mp,
      attack: data.attack,
      defense: data.defense,
      speed: data.speed,
      status: [],  // { type, turns }
      atkMod: 1,
      defMod: 1,
      evasion: false
    })

    const s = this.gameState = {
      p1: makePlayer(a1, p1Name),
      p2: makePlayer(a2, p2Name),
      playerTurn: true,
      round: 1,
      over: false,
      animating: false,
      totalRounds: 0,
      log: []
    }

    // Faster side goes first
    if (s.p2.speed > s.p1.speed) s.playerTurn = false

    this.scores = { p1: this.scores.p1 || 0, p2: this.scores.p2 || 0 }
  }

  // ─────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────

  _renderBattle() {
    const s = this.gameState
    if (!s) return

    this.p1NameTarget.textContent   = s.p1.name.toUpperCase()
    this.p2NameTarget.textContent   = s.p2.name.toUpperCase()
    this.p1TitleTarget.textContent  = s.p1.title
    this.p2TitleTarget.textContent  = s.p2.title
    this.roundNumTarget.textContent = s.round
    this.score1Target.textContent   = this.scores.p1
    this.score2Target.textContent   = this.scores.p2

    this._updateBars()
    this._injectSVG(this.svgP1Target, s.p1.name, s.p1.color)
    this._injectSVG(this.svgP2Target, s.p2.name, s.p2.color)
    this.svgP1Target.querySelector("svg").classList.add("idle")
    this.svgP2Target.querySelector("svg").classList.add("idle")

    this.battleLogTarget.innerHTML = '<div class="log-entry intro-entry">The battle begins!</div>'
    this._updateTurnIndicator()
  }

  _renderMoves() {
    const s = this.gameState
    const grid = this.movesGridTarget
    grid.innerHTML = ""
    s.p1.moves.forEach((m, i) => {
      const disabled = m.cost > s.p1.mp
      const btn = document.createElement("button")
      btn.className = "move-btn" + (disabled ? " insufficient-mp" : "")
      btn.disabled = false
      btn.dataset.idx = i
      btn.dataset.action = "click->arena#useMove"
      const dmgStr = m.damage[1] > 0
        ? `<div class="move-btn-dmg">${m.damage[0]}–${m.damage[1]} dmg</div>` : ""
      btn.innerHTML = `
        <span class="move-btn-name">${m.name}</span>
        <div class="move-btn-cost">${m.cost > 0 ? m.cost + " MP" : "FREE"}</div>
        <div class="move-btn-type">${m.type}</div>
        ${dmgStr}
      `
      grid.appendChild(btn)
    })
  }

  _updateBars() {
    const s = this.gameState
    if (!s) return
    const hp1Pct = Math.max(0, (s.p1.hp / s.p1.maxHp) * 100)
    const hp2Pct = Math.max(0, (s.p2.hp / s.p2.maxHp) * 100)
    const mp1Pct = Math.max(0, (s.p1.mp / s.p1.maxMp) * 100)
    const mp2Pct = Math.max(0, (s.p2.mp / s.p2.maxMp) * 100)

    this.hpBar1Target.style.width = hp1Pct + "%"
    this.hpBar2Target.style.width = hp2Pct + "%"
    this.mpBar1Target.style.width = mp1Pct + "%"
    this.mpBar2Target.style.width = mp2Pct + "%"

    this.hpText1Target.textContent = Math.max(0, Math.round(s.p1.hp))
    this.hpText2Target.textContent = Math.max(0, Math.round(s.p2.hp))
    this.mpText1Target.textContent = Math.round(s.p1.mp)
    this.mpText2Target.textContent = Math.round(s.p2.mp)

    const setBarColor = (bar, pct, poisoned) => {
      bar.classList.remove("low", "poisoned")
      if (poisoned) { bar.classList.add("poisoned"); return }
      if (pct <= 25) { bar.style.background = "linear-gradient(90deg,#c62828,#ff1744)"; bar.classList.add("low") }
      else if (pct <= 50) { bar.style.background = "linear-gradient(90deg,#f57f17,#ffea00)" }
      else { bar.style.background = "" }
    }
    const p1poisoned = s.p1.status.some(st => st.type === "poison")
    const p2poisoned = s.p2.status.some(st => st.type === "poison")
    setBarColor(this.hpBar1Target, hp1Pct, p1poisoned)
    setBarColor(this.hpBar2Target, hp2Pct, p2poisoned)

    this._renderStatus(this.statusIcons1Target, s.p1.status)
    this._renderStatus(this.statusIcons2Target, s.p2.status)
    this._renderMoves()
  }

  _renderStatus(el, statuses) {
    const icons = { poison:"☠️", atk_up:"⚔️", def_up:"🛡️", slow:"🐢", evade:"💨", mp_restore:"💧" }
    el.innerHTML = statuses.map(s => `<span class="status-icon" title="${s.type}">${icons[s.type] || "✨"}</span>`).join("")
  }

  _updateTurnIndicator() {
    const s = this.gameState
    if (!s) return
    const name = s.playerTurn ? s.p1.name : s.p2.name
    this.turnTextTarget.textContent = `${name}'s Turn`
    this.turnIndicatorTarget.style.borderColor = s.playerTurn
      ? (this.avatarsValue[s.p1.name]?.color || "var(--accent)")
      : (this.avatarsValue[s.p2.name]?.color || "var(--accent2)")

    if (this.mode === "manual") {
      if (s.playerTurn) {
        this.movesPanelTarget.classList.remove("hidden")
      } else {
        this.movesPanelTarget.classList.add("hidden")
      }
    } else {
      this.movesPanelTarget.classList.add("hidden")
    }
  }

  _addLog(msg, cls = "") {
    const el = document.createElement("div")
    el.className = "log-entry" + (cls ? " " + cls : "")
    el.textContent = msg
    this.battleLogTarget.appendChild(el)
    this.battleLogTarget.scrollTop = this.battleLogTarget.scrollHeight
    if (this.battleLogTarget.children.length > 40) {
      this.battleLogTarget.removeChild(this.battleLogTarget.firstChild)
    }
  }

  // ─────────────────────────────────────────────────
  //  MOVE EXECUTION
  // ─────────────────────────────────────────────────

  _executeMove(attackerId, defenderId, moveIdx) {
    const s = this.gameState
    if (s.animating || s.over) return

    const attacker = s[attackerId]
    const defender = s[defenderId]
    const move = attacker.moves[moveIdx]

    if (move.cost > attacker.mp) {
      this._addLog(`${attacker.name} doesn't have enough MP!`, "")
      if (this.mode === "manual") {
        setTimeout(() => this._aiTurn(), 100)
      }
      return
    }

    s.animating = true
    attacker.mp = Math.max(0, attacker.mp - move.cost)

    const attackerSprite = attackerId === "p1" ? this.svgP1Target : this.svgP2Target
    const defenderSprite = attackerId === "p1" ? this.svgP2Target : this.svgP1Target
    const attackClass = attackerId === "p1" ? "attacking-left" : "attacking-right"

    // Start attack animation
    attackerSprite.querySelector("svg")?.classList.remove("idle")
    attackerSprite.querySelector("svg")?.classList.add(attackClass)

    setTimeout(() => {
      // Process move effect
      let damage = 0
      let logMsg = ""
      let logClass = ""

      if (move.type === "heal") {
        const heal = Math.round(20 + attacker.attack * 0.3 + Math.random() * 15)
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal)
        logMsg = `✨ ${attacker.name} heals for ${heal} HP!`
        logClass = "heal"
        attackerSprite.querySelector("svg")?.classList.add("healing")
        this._fxText("+" + heal + " HP", "#00e676", attackerId)
      } else if (move.type === "buff" || move.type === "defend") {
        if (move.effect === "mp_restore") {
          const mp = 20 + Math.round(Math.random() * 10)
          attacker.mp = Math.min(attacker.maxMp, attacker.mp + mp)
          logMsg = `💧 ${attacker.name} restores ${mp} MP!`
          logClass = "buff"
        } else if (move.effect === "atk_up") {
          attacker.atkMod = Math.min(2.0, attacker.atkMod + 0.3)
          logMsg = `⚔️ ${attacker.name}'s attack rises!`
          logClass = "buff"
        } else if (move.effect === "def_up") {
          attacker.defMod = Math.min(2.0, attacker.defMod + 0.35)
          logMsg = `🛡️ ${attacker.name} raises their guard!`
          logClass = "buff"
        } else if (move.effect === "evade") {
          attacker.evasion = true
          attacker.status.push({ type: "evade", turns: 2 })
          logMsg = `💨 ${attacker.name} vanishes into shadow!`
          logClass = "buff"
        }
        attackerSprite.querySelector("svg")?.classList.add("buffed")
        if (move.effect) attacker.status.push({ type: move.effect, turns: 3 })
      } else {
        // Damage move
        const [minD, maxD] = move.damage
        const baseDmg = minD + Math.random() * (maxD - minD)
        const isCrit = Math.random() < 0.15
        const atkMulti = attacker.atkMod * (isCrit ? 1.8 : 1)
        const defFactor = Math.max(0.3, 1 - (defender.defMod * defender.defense / 120))
        const evaded = defender.evasion && Math.random() < 0.5
        damage = evaded ? 0 : Math.round(baseDmg * atkMulti * defFactor)

        if (evaded) {
          logMsg = `💨 ${defender.name} evades ${attacker.name}'s ${move.name}!`
          this._fxText("MISS!", "#aaa", defenderId)
        } else {
          defender.hp = Math.max(0, defender.hp - damage)
          if (move.effect === "poison" && !evaded) {
            defender.status.push({ type: "poison", turns: 4 })
          }
          if (move.effect === "slow" && !evaded) {
            defender.status.push({ type: "slow", turns: 3 })
          }
          const critTxt = isCrit ? " CRITICAL HIT!" : ""
          logMsg = `💥 ${attacker.name} uses ${move.name} → ${damage} dmg!${critTxt}`
          logClass = isCrit ? "crit" : ""
          defenderSprite.querySelector("svg")?.classList.remove("idle")
          defenderSprite.querySelector("svg")?.classList.add("hit-anim")
          this._fxHit(move.fx, defenderId, isCrit)
          this._fxText(isCrit ? "CRITICAL! " + damage : "-" + damage, isCrit ? "#ff6b35" : "#ff4444", defenderId)
          this._spawnBattleParticles(defenderId, attacker.color)
        }
      }

      this._addLog(logMsg, logClass)
      this._updateBars()

      // Clean up animations
      setTimeout(() => {
        attackerSprite.querySelector("svg")?.classList.remove(attackClass, "healing", "buffed")
        attackerSprite.querySelector("svg")?.classList.add("idle")
        defenderSprite.querySelector("svg")?.classList.remove("hit-anim")
        defenderSprite.querySelector("svg")?.classList.add("idle")

        // Check if game over
        if (defender.hp <= 0) {
          this._endGame(attackerId)
          return
        }

        // Process status effects at end of turn
        this._processStatusEffects(attackerId === "p1" ? "p2" : "p1")

        if (this.gameState.over) return

        // Advance turn
        s.round++
        s.playerTurn = !s.playerTurn
        this.roundNumTarget.textContent = s.round
        this._updateTurnIndicator()
        s.animating = false

        if (s.round > 80) {
          this._endGame("draw")
          return
        }

        if (this.mode === "auto") {
          const delay = this.difficulty === 3 ? 600 : this.difficulty === 2 ? 900 : 1200
          this.autoTimer = setTimeout(() => this._autoTurn(), delay)
        } else if (!s.playerTurn) {
          const aiDelay = 800 + Math.random() * 600
          this.autoTimer = setTimeout(() => this._aiTurn(), aiDelay)
        }
      }, 400)
    }, 350)
  }

  _processStatusEffects(playerId) {
    const s = this.gameState
    const player = s[playerId]
    const toRemove = []

    player.status.forEach((st, i) => {
      if (st.type === "poison") {
        const dmg = Math.round(5 + Math.random() * 6)
        player.hp = Math.max(0, player.hp - dmg)
        this._addLog(`☠️ ${player.name} takes ${dmg} poison damage!`, "poison")
        if (player.hp <= 0) {
          s.over = true
          setTimeout(() => this._endGame(playerId === "p1" ? "p2" : "p1"), 200)
        }
      }
      st.turns--
      if (st.turns <= 0) toRemove.push(i)
    })

    toRemove.reverse().forEach(i => player.status.splice(i, 1))

    // Reset mods if no buff status
    if (!player.status.some(st => st.type === "atk_up")) player.atkMod = Math.max(1, player.atkMod - 0.05)
    if (!player.status.some(st => st.type === "def_up")) player.defMod = Math.max(1, player.defMod - 0.05)
    if (!player.status.some(st => st.type === "evade")) player.evasion = false

    this._updateBars()
  }

  // ─────────────────────────────────────────────────
  //  AI
  // ─────────────────────────────────────────────────

  _autoTurn() {
    const s = this.gameState
    if (!s || s.over || s.animating) return
    const attackerId = s.playerTurn ? "p1" : "p2"
    const idx = this._aiChooseMove(attackerId)
    this._executeMove(attackerId, attackerId === "p1" ? "p2" : "p1", idx)
  }

  _aiTurn() {
    const s = this.gameState
    if (!s || s.over || s.animating) return
    const idx = this._aiChooseMove("p2")
    this._executeMove("p2", "p1", idx)
  }

  _aiChooseMove(playerId) {
    const s = this.gameState
    const ai = s[playerId]
    const opp = s[playerId === "p1" ? "p2" : "p1"]
    const moves = ai.moves

    // Difficulty affects randomness
    const rand = [0.6, 0.3, 0.1, 0.0][this.difficulty] || 0.3
    if (Math.random() < rand) return Math.floor(Math.random() * moves.length)

    // Score each move
    let bestScore = -Infinity, bestIdx = 0

    moves.forEach((m, i) => {
      if (m.cost > ai.mp) return
      let score = 0

      if (m.type === "heal") {
        const healVal = (ai.maxHp - ai.hp) / ai.maxHp
        score = healVal * 80 + (ai.hp < ai.maxHp * 0.3 ? 50 : 0)
      } else if (m.type === "buff" || m.type === "defend") {
        score = 30 + Math.random() * 20
        if (m.effect === "mp_restore" && ai.mp < ai.maxMp * 0.3) score += 40
        if (m.effect === "def_up" && opp.atkMod > 1.2) score += 30
        if (m.effect === "atk_up" && ai.atkMod < 1.3) score += 25
      } else {
        const avgDmg = (m.damage[0] + m.damage[1]) / 2
        score = avgDmg * ai.atkMod * (1 - opp.defMod * opp.defense / 120)
        if (m.type === "fire" || m.type === "dark" || m.type === "earth") score *= 1.1
        if (opp.hp <= avgDmg * 1.5) score *= 2
        if (m.effect === "poison" && !opp.status.some(st => st.type === "poison")) score += 20
      }
      score += Math.random() * 8

      if (score > bestScore) { bestScore = score; bestIdx = i }
    })

    return bestIdx
  }

  // ─────────────────────────────────────────────────
  //  GAME END
  // ─────────────────────────────────────────────────

  _endGame(winnerId) {
    const s = this.gameState
    s.over = true
    s.animating = false
    clearTimeout(this.autoTimer)
    cancelAnimationFrame(this._battleRafId)

    let winner, loser, resultType

    if (winnerId === "draw") {
      resultType = "draw"
      winner = null
      this._addLog("⚖️ DRAW! Both warriors fall!", "crit")
    } else {
      winner = s[winnerId]
      loser  = s[winnerId === "p1" ? "p2" : "p1"]
      resultType = winnerId === "p1" ? "win" : "loss"
      this._addLog(`🏆 ${winner.name} WINS the battle!`, "crit")

      // Death animation for loser
      const loserSprite = winnerId === "p1" ? this.svgP2Target : this.svgP1Target
      loserSprite.querySelector("svg")?.classList.remove("idle")
      loserSprite.querySelector("svg")?.classList.add("dead")
    }

    if (winnerId === "p1") this.scores.p1++
    else if (winnerId === "p2") this.scores.p2++

    // Save score to backend
    const p1 = s.p1.name, p2 = s.p2.name
    const winnerName = winner ? winner.name : "draw"
    fetch("/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content || ""
      },
      body: JSON.stringify({ player1_avatar: p1, player2_avatar: p2, winner: winnerName })
    }).then(r => r.json()).then(data => {
      if (data.leaderboard) this._renderLeaderboard(data.leaderboard)
    }).catch(() => {})

    setTimeout(() => {
      this._showResult(resultType, winner, s)
      if (resultType !== "draw") this._launchConfetti(winner.color)
    }, 1000)
  }

  _showResult(type, winner, state) {
    this._showScreen("result")

    if (type === "win" || type === "loss") {
      const isWin = type === "win"
      this.resultBadgeTarget.textContent = isWin ? "🏆" : "💀"
      this.resultTitleTarget.textContent = isWin ? "VICTORY!" : "DEFEATED!"
      this.resultTitleTarget.className   = "result-title" + (isWin ? "" : " defeat")
      this.resultWinnerNameTarget.textContent = winner.name.toUpperCase() + " — " + winner.title
      this._injectSVG(this.resultWinnerSvgTarget, winner.name, winner.color)
    } else {
      this.resultBadgeTarget.textContent = "⚖️"
      this.resultTitleTarget.textContent = "DRAW!"
      this.resultTitleTarget.className   = "result-title draw"
      this.resultWinnerNameTarget.textContent = "Both warriors fall!"
      this.resultWinnerSvgTarget.innerHTML = ""
    }

    this.resultStatsTarget.innerHTML = `
      <div class="result-stat"><span>ROUNDS</span>${state.round}</div>
      <div class="result-stat"><span>${state.p1.name.toUpperCase()} HP</span>${Math.max(0,Math.round(state.p1.hp))}</div>
      <div class="result-stat"><span>${state.p2.name.toUpperCase()} HP</span>${Math.max(0,Math.round(state.p2.hp))}</div>
      <div class="result-stat"><span>P1 WINS</span>${this.scores.p1}</div>
      <div class="result-stat"><span>P2 WINS</span>${this.scores.p2}</div>
    `
  }

  _renderLeaderboard(lb) {
    this.lbListTarget.innerHTML = lb.slice(0, 5).map((row, i) => `
      <div class="lb-row">
        <span class="lb-rank">#${i+1}</span>
        <span class="lb-name">${row.name}</span>
        <span class="lb-wins">▲${row.wins}</span>
        <span class="lb-losses">▼${row.losses}</span>
        <span class="lb-draws">=&nbsp;${row.draws}</span>
        <span class="lb-rate">${row.win_rate}%</span>
      </div>
    `).join("")
  }

  // ─────────────────────────────────────────────────
  //  SVG INJECTION
  // ─────────────────────────────────────────────────

  _injectSVG(el, name, color) {
    const glow = this.avatarsValue[name]?.glow || color
    const svgs = {
      Richardson: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="22" r="16" fill="#e8c07a" stroke="${color}" stroke-width="2"/>
        <path d="M20,45 Q20,35 40,35 Q60,35 60,45 L65,95 L15,95 Z" fill="${color}" opacity="0.9"/>
        <rect x="14" y="48" width="12" height="30" rx="4" fill="${color}" opacity="0.8"/>
        <rect x="54" y="48" width="12" height="30" rx="4" fill="${color}" opacity="0.8"/>
        <rect x="28" y="95" width="10" height="20" rx="3" fill="#333" opacity="0.9"/>
        <rect x="42" y="95" width="10" height="20" rx="3" fill="#333" opacity="0.9"/>
        <path d="M30,55 L50,55 L50,75 L40,80 L30,75 Z" fill="${glow}" opacity="0.4"/>
        <circle cx="34" cy="19" r="3" fill="#222" opacity="0.8"/>
        <circle cx="46" cy="19" r="3" fill="#222" opacity="0.8"/>
        <path d="M34,27 Q40,31 46,27" stroke="#222" stroke-width="1.5" fill="none"/>
        <polygon points="25,10 30,5 40,8 50,5 55,10 50,2 40,0 30,2" fill="${color}"/>
      </svg>`,
      Maya: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="22" r="15" fill="#d4a0e0" stroke="${color}" stroke-width="2"/>
        <path d="M22,48 Q22,36 40,36 Q58,36 58,48 L62,95 L18,95 Z" fill="${color}" opacity="0.85"/>
        <path d="M10,50 Q12,35 22,48" stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M70,50 Q68,35 58,48" stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <rect x="28" y="95" width="9" height="18" rx="3" fill="#2a0a3a"/>
        <rect x="43" y="95" width="9" height="18" rx="3" fill="#2a0a3a"/>
        <circle cx="35" cy="19" r="2.5" fill="#1a0028" opacity="0.9"/>
        <circle cx="45" cy="19" r="2.5" fill="#1a0028" opacity="0.9"/>
        <circle cx="40" cy="5" r="5" fill="${glow}" opacity="0.8"/>
        <path d="M35,5 Q30,0 28,5 Q30,8 35,5" fill="${color}" opacity="0.7"/>
        <path d="M45,5 Q50,0 52,5 Q50,8 45,5" fill="${color}" opacity="0.7"/>
        <circle cx="20" cy="55" r="4" fill="${glow}" opacity="0.6"/>
        <circle cx="60" cy="55" r="4" fill="${glow}" opacity="0.6"/>
      </svg>`,
      Zephyr: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="21" r="14" fill="#a0e8d0" stroke="${color}" stroke-width="2"/>
        <path d="M24,46 Q24,35 40,35 Q56,35 56,46 L60,95 L20,95 Z" fill="${color}" opacity="0.85"/>
        <path d="M14,46 Q16,32 24,46" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M66,46 Q64,32 56,46" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M14,46 L5,60" stroke="${glow}" stroke-width="3" stroke-linecap="round"/>
        <path d="M66,46 L75,60" stroke="${glow}" stroke-width="3" stroke-linecap="round"/>
        <rect x="28" y="95" width="9" height="17" rx="3" fill="#0a2a20"/>
        <rect x="43" y="95" width="9" height="17" rx="3" fill="#0a2a20"/>
        <circle cx="35" cy="18" r="2.5" fill="#0a2218"/>
        <circle cx="45" cy="18" r="2.5" fill="#0a2218"/>
        <path d="M30,8 Q35,2 40,6 Q45,2 50,8 L50,4 Q40,-2 30,4 Z" fill="${color}" opacity="0.9"/>
        <line x1="40" y1="50" x2="40" y2="90" stroke="${glow}" stroke-width="2" opacity="0.4" stroke-dasharray="4,4"/>
      </svg>`,
      Nova: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="21" r="15" fill="#f5d87a" stroke="${color}" stroke-width="2"/>
        <path d="M20,46 Q20,35 40,35 Q60,35 60,46 L65,95 L15,95 Z" fill="${color}" opacity="0.85"/>
        <rect x="13" y="46" width="13" height="32" rx="5" fill="${color}" opacity="0.8"/>
        <rect x="54" y="46" width="13" height="32" rx="5" fill="${color}" opacity="0.8"/>
        <rect x="28" y="95" width="10" height="18" rx="4" fill="#2a1a00"/>
        <rect x="42" y="95" width="10" height="18" rx="4" fill="#2a1a00"/>
        <circle cx="34" cy="18" r="2.5" fill="#2a1a00"/>
        <circle cx="46" cy="18" r="2.5" fill="#2a1a00"/>
        <path d="M40,0 L43,8 L52,5 L46,12 L54,15 L46,15 L48,24 L40,18 L32,24 L34,15 L26,15 L34,12 L28,5 L37,8 Z" fill="${glow}" opacity="0.9"/>
        <path d="M30,50 L50,50 L52,70 L40,78 L28,70 Z" fill="${glow}" opacity="0.35"/>
      </svg>`,
      Atlas: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="22" r="17" fill="#e8a080" stroke="${color}" stroke-width="2"/>
        <path d="M16,50 Q16,36 40,36 Q64,36 64,50 L70,95 L10,95 Z" fill="${color}" opacity="0.9"/>
        <rect x="8" y="48" width="16" height="36" rx="5" fill="${color}" opacity="0.85"/>
        <rect x="56" y="48" width="16" height="36" rx="5" fill="${color}" opacity="0.85"/>
        <rect x="25" y="95" width="12" height="20" rx="4" fill="#1a0a00"/>
        <rect x="43" y="95" width="12" height="20" rx="4" fill="#1a0a00"/>
        <circle cx="33" cy="18" r="3.5" fill="#1a0a00"/>
        <circle cx="47" cy="18" r="3.5" fill="#1a0a00"/>
        <path d="M32,10 Q40,6 48,10" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M28,52 L52,52 L54,80 L40,88 L26,80 Z" fill="${glow}" opacity="0.25"/>
        <rect x="24" y="50" width="32" height="5" rx="2" fill="${glow}" opacity="0.5"/>
        <path d="M8,64 L0,70" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
        <path d="M72,64 L80,70" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
      </svg>`
    }
    el.innerHTML = svgs[name] || ""
    const svg = el.querySelector("svg")
    if (svg) { svg.style.filter = `drop-shadow(0 0 12px ${glow})`; svg.classList.add("idle") }
  }

  // ─────────────────────────────────────────────────
  //  VISUAL FX
  // ─────────────────────────────────────────────────

  _fxHit(type, targetId, isCrit) {
    const emojis = {
      slash:"⚔️", explosion:"💥", orb:"🔮", rift:"🌀", dash:"💨",
      poison:"☠️", blades:"🗡️", beam:"✨", sunburst:"☀️", quake:"🌋",
      meteor:"☄️", aura:"🌟", shield:"🛡️", heal:"💚", smoke:"💨",
      gravity:"🌌", sparkle:"✨", armor:"🛡️", eruption:"🔥", barrier:"🔷"
    }
    const el = this.fxHitTarget
    el.textContent = emojis[type] || "💥"
    const rect = (targetId === "p1" ? this.sprite1Target : this.sprite2Target).getBoundingClientRect()
    el.style.left = (rect.left + rect.width / 2 - 30) + "px"
    el.style.top  = (rect.top  + rect.height * 0.3) + "px"
    el.style.fontSize = isCrit ? "80px" : "60px"
    el.style.animation = "none"
    void el.offsetWidth
    el.style.animation = "fxHitAnim 0.6s ease forwards"
    el.style.opacity = "1"
    setTimeout(() => el.style.opacity = "0", 600)
  }

  _fxText(text, color, targetId) {
    const el = this.fxTextTarget
    el.textContent = text
    el.style.color = color
    const rect = (targetId === "p1" ? this.sprite1Target : this.sprite2Target).getBoundingClientRect()
    el.style.left = (rect.left + rect.width / 2 - 40) + "px"
    el.style.top  = (rect.top + 20) + "px"
    el.style.animation = "none"
    void el.offsetWidth
    el.style.animation = "fxTextAnim 1s ease forwards"
    el.style.opacity = "1"
    setTimeout(() => el.style.opacity = "0", 1000)
  }

  // ─────────────────────────────────────────────────
  //  PARTICLE SYSTEM — Intro
  // ─────────────────────────────────────────────────

  _initParticles() {
    const canvas = this.particleCanvasTarget
    const ctx = canvas.getContext("2d")
    this._pCtx = ctx
    this._resizeParticleCanvas()
    window.addEventListener("resize", () => this._resizeParticleCanvas())

    for (let i = 0; i < 60; i++) this.particles.push(this._newParticle())
  }

  _resizeParticleCanvas() {
    const c = this.particleCanvasTarget
    c.width = window.innerWidth
    c.height = window.innerHeight
  }

  _newParticle() {
    const colors = ["#7c6cfc","#fc6c9b","#00e676","#ffd700","#2196f3","#ff6b35"]
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.5 + 0.2),
      r: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1
    }
  }

  _animParticles() {
    const ctx = this._pCtx
    if (!ctx) return
    const c = this.particleCanvasTarget
    ctx.clearRect(0, 0, c.width, c.height)

    this.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.003
      if (p.y < 0 || p.life <= 0) this.particles[i] = this._newParticle()
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha * p.life
      ctx.fill()
    })
    ctx.globalAlpha = 1
    this._rafId = requestAnimationFrame(() => this._animParticles())
  }

  // ─────────────────────────────────────────────────
  //  BATTLE CANVAS — arena background
  // ─────────────────────────────────────────────────

  _startBattleCanvas() {
    const canvas = this.battleCanvasTarget
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext("2d")
    this._bCtx = ctx
    this._battleParticles = []
    this._battleRafId = requestAnimationFrame(() => this._animBattleCanvas())
  }

  _animBattleCanvas() {
    const ctx = this._bCtx
    const c = this.battleCanvasTarget
    if (!ctx) return

    ctx.clearRect(0, 0, c.width, c.height)

    // Animated arena floor
    const grad = ctx.createLinearGradient(0, c.height * 0.6, 0, c.height)
    grad.addColorStop(0, "rgba(124,108,252,0.05)")
    grad.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, c.height * 0.6, c.width, c.height * 0.4)

    // Draw battle particles
    this._battleParticles = this._battleParticles.filter(p => p.life > 0)
    this._battleParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy
      p.vy += 0.08
      p.life -= 0.025
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life * 0.8
      ctx.fill()
    })
    ctx.globalAlpha = 1

    this._battleRafId = requestAnimationFrame(() => this._animBattleCanvas())
  }

  _spawnBattleParticles(targetId, color) {
    const sprite = targetId === "p1" ? this.sprite1Target : this.sprite2Target
    const rect = sprite.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 3
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 5 + 2
      this._battleParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        r: Math.random() * 5 + 2,
        color: color,
        life: 1
      })
    }
  }

  // ─────────────────────────────────────────────────
  //  CONFETTI
  // ─────────────────────────────────────────────────

  _launchConfetti(color) {
    const canvas = this.confettiCanvasTarget
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext("2d")
    const colors = [color, "#ffd700", "#fff", "#7c6cfc", "#fc6c9b", "#00e676"]
    this.confettiParticles = []
    for (let i = 0; i < 120; i++) {
      this.confettiParticles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        w: Math.random() * 10 + 4,
        h: Math.random() * 6 + 3,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
        life: 1
      })
    }
    this._animConfetti(ctx, canvas)
  }

  _animConfetti(ctx, canvas) {
    if (!this.confettiParticles?.length) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    this.confettiParticles = this.confettiParticles.filter(p => p.life > 0)
    this.confettiParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.life -= 0.006
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h)
      ctx.restore()
    })
    ctx.globalAlpha = 1
    if (this.confettiParticles.length > 0) {
      requestAnimationFrame(() => this._animConfetti(ctx, canvas))
    }
  }

  // ─────────────────────────────────────────────────
  //  UTILITIES
  // ─────────────────────────────────────────────────

  _showScreen(name) {
    const map = { intro: this.introScreenTarget, battle: this.battleScreenTarget, result: this.resultScreenTarget }
    Object.values(map).forEach(s => s.classList.remove("active"))
    map[name].classList.add("active")
    const flash = document.createElement("div")
    flash.className = "screen-flash"
    flash.style.background = "#fff"
    document.body.appendChild(flash)
    setTimeout(() => flash.remove(), 500)
  }

  _randomAvatar(exclude) {
    const keys = Object.keys(this.avatarsValue).filter(k => k !== exclude)
    return keys[Math.floor(Math.random() * keys.length)]
  }

  _shake(el) {
    el.style.animation = "none"
    void el.offsetWidth
    el.style.animation = "hit-shake 0.4s ease"
    setTimeout(() => el.style.animation = "", 400)
  }
}
