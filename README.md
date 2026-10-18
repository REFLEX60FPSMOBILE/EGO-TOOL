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
| 🧱 **Theme Engine** | Presets Dark / OLED / Frost (glass) / Neon / Material / Terminal / Light, variables CSS centralisées, wallpaper (URL), opacité, flou, arrondi, accent, mode Glass/Aero, mode Performance |
| 🎯 **Modes contextuels** | Mode Focus (masque member list + animations), Mode Stream (masque les éléments sensibles), Mode Gaming (compact + notifications réduites) et Mode Staff (densité info) — plus Auto-DND automatique quand un jeu tourne |
| ✅ **Productivité** | ToDoList native (tâches, priorités 🔴🟠🟢, deadlines), Reminders natifs (rappels répétitifs via toasts), exportées/importées avec la config |
| 🔒 **Sécurité** | PasscodeLock : verrouillage du client par code PIN (4-8 chiffres, overlay plein écran au démarrage) |
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

**Optional — Orion (auto quest completer):** add `--orion` to install the OrionQuests userplugin alongside EGO TOOL:
```bash
./inject.sh --orion                                                      # Linux / macOS
./inject.bat --orion                                                     # Windows (double-click wrapper)
powershell -ExecutionPolicy Bypass -File inject.ps1 -Orion               # Windows (PowerShell)
```

### Manual injection

1. Make sure you have **Vencord installed from source** ([guide](https://docs.vencord.dev/installing/)).
2. Clone the plugin inside the userplugins folder:
   ```bash
   cd path/to/Vencord/src/userplugins   # create the folder if needed
   git clone https://github.com/REFLEX60FPSMOBILE/EGO-TOOL EGO-Tool
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
Use `--remove --orion` (or `-Remove -Orion`) to also uninstall OrionQuests.

## ✅ Recommended companion plugins (included with Vencord)

All of the plugins below are **built into Vencord** — no extra install needed.
After injecting EGO TOOL, open **Settings → Vencord → Plugins** and tick the ones you want.

### Serveurs, staff & organisation

| Plugin | What it does | Why it helps | Risk / drawback |
| --- | --- | --- | --- |
| **PinDMs** | Pin & reorder DMs at the top of the list | Essential if you handle lots of DMs, staff, partners, bots | No notable risk |
| **BetterFolders** | Improves server folders: dedicated sidebar, icons, controlled opening | Great for organizing several community servers | Can heavily change the sidebar; disable if a theme breaks |
| **MemberCount** | Shows online / total / voice users | Excellent for monitoring a server without opening stats | Slight visual cost in the member list |
| **ServerInfo** | Shows information about a server | Handy for quick server inspection | Barely useful if you don't admin |
| **PermissionsViewer** | Shows permissions of a user, role or channel | Very useful for staff/moderation or role debugging | May expose things you don't need to see |
| **ViewRaw** | Copy/show the raw content of a message, channel or server | Must-have for debugging IDs, embeds, payloads | Never share a raw containing tokens or sensitive data |

### Messages & quality of life

| Plugin | What it does | Why it helps | Risk / drawback |
| --- | --- | --- | --- |
| **MessageLogger** | Temporarily logs deleted/edited messages locally | Great for settling a dispute or understanding a deletion | Not a server-log replacement; never use it to harass or expose someone |
| **NoReplyMention** | Disables the auto-mention when replying | Avoids pointless pings | May miss important replies if misconfigured |
| **QuickMention** | Adds a quick-mention button on messages | Huge time saver for staff/moderation | No notable risk |
| **MessageClickActions** | Shortcuts: double-click to edit/reply, hold + click to delete | Makes chat navigation much faster | Accidental actions possible at first |
| **CharacterCounter** | Shows character count in the message box | Useful for long messages, announcements, tickets | No notable risk |
| **Translate** | Translates messages via Google Translate, DeepL or Kagi | Perfect for an international community | Sends text to the chosen translation service: avoid for sensitive content |
| **ClearURLs** | Strips tracking parameters from sent links | Better privacy and cleaner links | Can break a link that needs its parameters |
| **AnonymiseFileNames** | Anonymises uploaded file names | Avoids leaking your username, path, project or visible metadata | You lose the readable file name |

### Voice, stream & media

| Plugin | What it does | Why it helps | Risk / drawback |
| --- | --- | --- | --- |
| **CallTimer** | Adds a timer to voice calls | Handy for staff meetings, sessions, events | No notable risk |
| **VoiceMessages** | Sends voice messages like on mobile | Very handy in DMs or staff chat | Desktop voice-sending feature by Vencord |
| **BiggerStreamPreview** | Enlarges stream previews | Better visibility during an event or screen share | Can take too much space on small screens |
| **PictureInPicture** | Adds picture-in-picture for videos | Watch a video while chatting | Can use more resources |
| **WebScreenShareFixes** | Fixes bitrate limits & CPU issues in screen share on Chromium/Vesktop | Great for clean streaming | Mostly relevant on Vesktop/Web, not native Discord Desktop |
| **VolumeBooster** | Lets you exceed max volume per user/stream | Useful for quiet streams/voices | Protect your ears; watch audio saturation |
| **SpotifyControls** | Adds a Spotify controller above the account panel | Quick control without switching apps | Depends on Spotify integration; can break after updates |

### Visual, privacy & security

| Plugin | What it does | Why it helps | Risk / drawback |
| --- | --- | --- | --- |
| **NoTrack** | Disables Discord analytics, metrics & crash reporting | Better privacy | May complicate official Discord support if you hit a bug |
| **BetterSessions** | Improves the sessions menu: timestamps, custom names, new-session alerts | Great account security: you spot suspicious logins fast | Enable it, and check the alerts regularly |
| **BlurNSFW** | Blurs NSFW attachments until hover | Avoids nasty surprises in public or on stream | No notable risk |
| **RoleColorEverywhere** | Applies role color everywhere possible | Cleaner and more personalized UI | May conflict with some themes |

> ⚠️ **Reminder:** using Vencord (and any client mod) is against Discord's Terms of Service. Use at your own risk.

## 🧩 Optional: Orion (OrionQuests)

**[Orion](https://github.com/nyxxbit/discord-quest-completer)** is a third-party userplugin (not bundled with Vencord) that completes Discord Quests automatically — all five quest types, including `ACHIEVEMENT_IN_ACTIVITY`.

- **Install:** run the injector with `--orion` (see [Installation](#-installation)), or clone `https://github.com/nyxxbit/discord-quest-completer` into `src/userplugins/` yourself.
- **Use:** restart Discord, then type `/orion status` in any channel; `/orion start` begins the cycle. Settings live in **Settings → Vencord → UserPlugins → OrionQuests**.
- **Desktop only** — Discord's internal stores don't exist on web/mobile.
- ⚠️ **Read the project's warning before enabling it:** Discord has been enforcing against quest automation since April 2026 (quest restrictions up to ~14 days and named `Account Standing` violations have been reported). The achievement bypass runs a real OAuth2 authorization with your account — if you can't afford to lose it, don't run this on it. **You use it entirely at your own risk; Orion is not part of EGO TOOL and is not endorsed by its author.**

## 🗺️ Roadmap — "Nexus" vision

EGO TOOL évolue vers un client Discord amélioré, modulaire et personnalisable (inspiration : écosystème BetterDiscord sur GitHub — DevEvil99, arg0NNY, samfundev, Strencher — et plugins officiels Vencord) :

- **Thèmes CSS avancés** — dark, OLED, glass/frost, neon, material, terminal, light, wallpapers ✅
- **Modes contextuels** — Focus ✅, Stream ✅, Gaming (CSS ✅ + **Auto-DND** via `getUserSettingLazy("status","status")` + Flux `RUNNING_GAMES_CHANGE`, comme AutoDNDWhilePlaying) ✅, Staff (CSS densité ✅)
- **Plugins intégrés** — ToDoList ✅, Reminder ✅ (toasts toutes les 30 s, répétition), PasscodeLock ✅ (overlay + hash djb2), lazy loading channels ✅ *(content-visibility en mode Performance)* ; à venir : ChannelTabs (patch TitleBar, comme samfundev/BetterDiscordStuff), BetterVolume, ChatFilter, MessageScanAI
- **Performance-first** — blur/GIF/animations optionnels ✅, lazy loading ✅, cache d'assets
- **UI modulaire** — panneaux déplaçables, collapsibles, masquables

> La plupart des plugins listés existent déjà (25 plugins officiels Vencord documentés plus haut — voir « Recommended companion plugins »). Les éléments marqués ✅ sont implémentés nativement dans EGO TOOL. **Orion (OrionQuests)** s'installe à côté via `inject --orion`.

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
