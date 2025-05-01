# ⚔️ Browser RPG

A lightweight, click-based RPG that runs entirely in the browser. Features real-time combat, stat-driven gameplay, and an intuitive UI — all built in plain HTML, CSS, and JavaScript.

---

## 🎮 Features

- 🧙‍♂️ **Turnless Combat**: Real-time attack system with speed determined by Dexterity and gear.
- 🪖 **Inventory & Equipment**: Equip items that boost stats or enhance abilities.
- 📊 **Core Stats**:
  - **Strength** increases melee damage
  - **Dexterity** improves attack speed and precision
- 🧠 **Tooltip System**: Hover over items and stats to learn their effects.
- 🪙 **Three-Tier Currency**: Copper, Silver, Gold system (100 cp = 1 sp, 100 sp = 1 gp).
- 💬 **Combat Log**: Dynamic event feed during fights.
- 📱 **Responsive UI**: Clean two-column layout using Flexbox.

---

## 🚀 Getting Started

1. Clone or download the repository.
2. Open `index.html` in your browser.
3. Click **Fight Enemy** to begin battling and looting!

---

## 🛠 How It Works

- **Stats** are recalculated dynamically based on base values + equipment bonuses.
- **Attack speed** is derived from a base delay (`2000ms`) and reduced via Dexterity and gear.
- Tooltips and UI update automatically with every stat or equipment change.

---

## 🔧 Tech Stack

- HTML
- CSS (Flexbox layout)
- JavaScript (Vanilla)

---

## 🧱 Planned Features

- [ ] Randomized loot drops
- [ ] Shops and gear purchases
- [ ] XP system and stat leveling
- [ ] Save/load functionality with `localStorage`
- [ ] Enemy variety and difficulty scaling

---

## ✨ Screenshots

![Gameplay Screenshot](https://github.com/user-attachments/assets/df6daca1-abb1-4653-a690-ae7448d03a48)


---

## 📄 License

MIT — free to use, modify, or expand.
