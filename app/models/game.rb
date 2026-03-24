class Game < ApplicationRecord
  AVATARS = {
    "Richardson" => {
      title: "The Iron Warlord",
      element: "Fire",
      hp: 140, mp: 70,
      attack: 22, defense: 15, speed: 12,
      color: "#FF4500",
      glow: "#FF6B35",
      moves: [
        { name: "Iron Strike",      cost: 0,  damage: [18,26], type: "physical", fx: "slash" },
        { name: "Inferno Blade",    cost: 25, damage: [35,50], type: "fire",     fx: "explosion" },
        { name: "War Cry",          cost: 15, damage: [0,0],   type: "buff",     fx: "aura",      effect: "atk_up" },
        { name: "Molten Shield",    cost: 20, damage: [0,0],   type: "defend",   fx: "shield",    effect: "def_up" }
      ]
    },
    "Maya" => {
      title: "The Void Sorceress",
      element: "Arcane",
      hp: 105, mp: 120,
      attack: 28, defense: 8, speed: 18,
      color: "#9B59B6",
      glow: "#D7BDE2",
      moves: [
        { name: "Arcane Bolt",      cost: 0,  damage: [16,24], type: "magic",    fx: "orb" },
        { name: "Void Rift",        cost: 30, damage: [45,65], type: "dark",     fx: "rift" },
        { name: "Mana Surge",       cost: 10, damage: [0,0],   type: "buff",     fx: "sparkle",   effect: "mp_restore" },
        { name: "Gravity Well",     cost: 35, damage: [30,40], type: "dark",     fx: "gravity",   effect: "slow" }
      ]
    },
    "Zephyr" => {
      title: "The Shadow Rogue",
      element: "Wind",
      hp: 110, mp: 85,
      attack: 25, defense: 10, speed: 25,
      color: "#1ABC9C",
      glow: "#76EEC6",
      moves: [
        { name: "Shadow Slash",     cost: 0,  damage: [14,28], type: "physical", fx: "dash" },
        { name: "Poison Storm",     cost: 25, damage: [20,30], type: "poison",   fx: "poison",    effect: "poison" },
        { name: "Vanish",           cost: 20, damage: [0,0],   type: "buff",     fx: "smoke",     effect: "evade" },
        { name: "Death Mark",       cost: 40, damage: [55,70], type: "physical", fx: "blades" }
      ]
    },
    "Nova" => {
      title: "The Celestial Paladin",
      element: "Light",
      hp: 130, mp: 95,
      attack: 20, defense: 18, speed: 14,
      color: "#F39C12",
      glow: "#FFF176",
      moves: [
        { name: "Holy Strike",      cost: 0,  damage: [15,22], type: "light",    fx: "beam" },
        { name: "Solar Flare",      cost: 30, damage: [40,55], type: "light",    fx: "sunburst" },
        { name: "Divine Heal",      cost: 25, damage: [0,0],   type: "heal",     fx: "heal",      effect: "heal" },
        { name: "Celestial Aegis",  cost: 20, damage: [0,0],   type: "defend",   fx: "barrier",   effect: "def_up" }
      ]
    },
    "Atlas" => {
      title: "The Earthborn Titan",
      element: "Earth",
      hp: 160, mp: 60,
      attack: 30, defense: 20, speed: 8,
      color: "#E74C3C",
      glow: "#EC7063",
      moves: [
        { name: "Titan Smash",      cost: 0,  damage: [22,32], type: "physical", fx: "quake" },
        { name: "Meteor Drop",      cost: 35, damage: [50,75], type: "earth",    fx: "meteor" },
        { name: "Stone Skin",       cost: 15, damage: [0,0],   type: "defend",   fx: "armor",     effect: "def_up" },
        { name: "Tectonic Rage",    cost: 40, damage: [40,60], type: "earth",    fx: "eruption" }
      ]
    }
  }.freeze

  validates :player1_avatar, inclusion: { in: AVATARS.keys }
  validates :player2_avatar, inclusion: { in: AVATARS.keys }
  validates :mode, inclusion: { in: %w[manual auto] }
  validates :status, inclusion: { in: %w[pending active finished] }
end
