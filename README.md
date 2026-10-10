<div align="center">

# 🧠 EGO TOOL

**Professional Vencord plugin suite — OSINT, UI customization & moderation tools.**

<sub>Made by **shoyzontop** · formerly *Shoyz Tools / HideBadgesGUI*</sub>

<p>
  <img alt="License" src="https://img.shields.io/badge/License-GPL--3.0-blue.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-100%25-3178C6">
  <img alt="Vencord" src="https://img.shields.io/badge/Made%20for-Vencord-5865F2">
  <img alt="Author" src="https://img.shields.io/badge/Author-shoyzontop-FF73FA">
</p>

<p>
  <a href="https://discord.gg/jGXd8adHPJ"><img alt="Discord" src="https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord"></a>
</p>

</div>

---

## 🌟 Overview

**EGO TOOL** is a modular, high-end plugin suite for **Vencord** (the modded Discord client).
It bundles an educational OSINT module, deep UI customization, and powerful moderation tools into one clean, fully-typed plugin.

## ✨ Features

| Module | What it does |
| --- | --- |
| 🔍 **OSINT / User Lookup** | Complete user dossiers with tabs, threat score (0–100), risk levels (SAFE → CRITICAL), public data analysis |
| 🏰 **Server Analysis** | Server security evaluation, risk-factor analysis and detailed reports |
| 📡 **Message Scanner** | Real-time message analysis, link extraction & classification, suspicious keyword detection |
| 🎨 **UI Customization** | Glassmorphism themes, blur effects, dynamic dark/light/accent themes, compact mode, custom CSS |
| 🛡️ **Moderation** | Regex-based filter rules, automated actions, moderation stats |
| 🏅 **Badge Manager** | Visual badge catalog, per-badge or hide-all control, per-server overrides |
| ⌨️ **Productivity** | Global keyboard shortcuts, quick actions, per-server settings, export/import configs |

## ⚡ Installation

### One-click injection (recommended)

**Windows** — download the repo (Code → Download ZIP), extract it, then run:
```bat
inject.bat
```

**Linux / macOS / Git Bash** — from the repo folder:
```bash
chmod +x inject.sh
./inject.sh
```

> The injector auto-detects your Vencord source folder, clones EGO TOOL into `src/userplugins/EGO-Tool`, and rebuilds Vencord with `pnpm build`.
> If it cannot find Vencord, pass the path manually:
```bash
./inject.sh --vencord-dir /path/to/Vencord   # Linux / macOS
powershell -ExecutionPolicy Bypass -File inject.ps1 -VencordDir "C:\path\to\Vencord"  # Windows
```

### Manual injection

1. Make sure you have **Vencord installed from source** ([guide](https://docs.vencord.dev/installing/)).
2. Clone the plugin inside the userplugins folder:
   ```bash
   cd path/to/Vencord/src/userplugins   # create the folder if needed
   git clone https://github.com/REFLEX60FPSMOBILE/vencord-hidebadges EGO-Tool
   ```
3. Rebuild Vencord:
   ```bash
   cd path/to/Vencord
   pnpm build
   ```
4. Fully restart Discord → **Settings → Vencord → Plugins → enable EGO TOOL**.

### Remove

```bash
./inject.sh --remove                                        # Linux / macOS
powershell -ExecutionPolicy Bypass -File inject.ps1 -Remove  # Windows
```

## 🏛️ Join Our Discord

Support, updates and community discussion: **[discord.gg/jGXd8adHPJ](https://discord.gg/jGXd8adHPJ)**

## 📚 Documentation

- **Changelog** — [CHANGELOG.md](./CHANGELOG.md)
- **Support** — [Discord](https://discord.gg/jGXd8adHPJ)

## 🛡️ License

GPL-3.0 — see [LICENSE](./LICENSE).

## ⚠️ Disclaimer

EGO TOOL is designed for **legal and educational use only**, based on **publicly available data**.
Any use for harassment, malicious doxxing or other illegal activities is strictly prohibited.

---

<div align="center">

Made with ❤️ by **shoyzontop**

</div>