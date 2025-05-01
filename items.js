const items = {
  "Rusty Dagger": {
    name: "Rusty Dagger",
    slot: "weapon",
    bonuses: {
      damageRange: [1, 4],
      attackSpeed: -300,
      dexterity: +1
    },
    description: `A dull dagger that still gets the job done.<br>
      <span class="bonus">-300ms attack delay</span><br>
      <span class="bonus">+1 Dexterity</span><br>
  },

  "Tattered Cloak": {
    name: "Tattered Cloak",
    slot: "armor",
    bonuses: {
      regen: +0.1
    },
    tooltip: `Worn and threadbare, but still offers some comfort.<br>
      <span class="bonus">+0.1 HP regen per tick</span>`
  },

  "Lucky Coin": {
    name: "Lucky Coin",
    slot: "accessory",
    bonuses: {
      dexterity: +2
    },
    tooltip: `A shiny coin that seems to bring good fortune.<br>
      <span class="bonus">+2 Dexterity</span>`
  }
};
