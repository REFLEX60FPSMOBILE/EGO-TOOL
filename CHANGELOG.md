# Changelog

All notable changes to Shoyz Tools will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Theme Engine** (`src/utils/themeEngine.ts` + `src/components/ThemeEnginePanel.tsx`) : presets Dark/OLED/Frost/Neon/Material/Terminal/Light basés sur variables CSS centralisées, wallpaper par URL, réglages opacité/flou/arrondi/accent, mode Glass/Aero (blur des panneaux actifs uniquement)
- **Modes contextuels** Focus (masque member list + animations) et Stream (masque données sensibles à l'écran)
- **Mode Performance** : désactive blur/animations/transitions
- **Nouvel onglet "Themes & Modes"** dans le panneau de réglages
- **Modes Gaming (CSS compact + Auto-DND via @api/UserSettings et Flux RUNNING_GAMES_CHANGE, restauré proprement à la fermeture du jeu) et Staff (densité info)**
- **ToDoList native** (tâches, priorités, deadlines) et **Reminders natifs** (toasts toutes les 30 s, répétition configurable) — inspirés des plugins BetterDiscord de DevEvil99
- **PasscodeLock** : verrouillage du client par PIN hashé (djb2) avec overlay plein écran et compteur d'échecs — inspiré du PasscodeLock de arg0NNY
- **Lazy loading** des messages/channels via content-visibility en mode Performance
- **Onglet "Productivité"** combinant ToDoList, Reminders et PasscodeLock

### Fixed
- 97 erreurs TypeScript et bugs runtime réparés : `useEffect` manquant (MessageScanner), `TabStyles` non importé (UserLookup), conflit d'import `ServerSettings` (SettingsPanel), types `UserLookupResult`/`ThreatLevel` manquants, styles `CardStyles.card` / `DiscordColors.muted` / `buttonSecondary` / `ListStyles.title` inexistants (~50 usages), raccourcis clavier absents de l'export, mock data OSINT, `":hover"` invalide en style React, `window.DiscordNative` non déclaré, imports inutilisés

### Added
- Recommended companion plugins guide in README (25 built-in Vencord plugins: PinDMs, BetterFolders, MemberCount, ServerInfo, PermissionsViewer, ViewRaw, MessageLogger, NoReplyMention, QuickMention, MessageClickActions, CharacterCounter, Translate, ClearURLs, AnonymiseFileNames, CallTimer, VoiceMessages, BiggerStreamPreview, PictureInPicture, WebScreenShareFixes, VolumeBooster, SpotifyControls, NoTrack, BetterSessions, BlurNSFW, RoleColorEverywhere) with use cases and risks
- Optional `--orion` (`-Orion`) and `--remove-orion` (`-RemoveOrion`) flags on inject.sh / inject.ps1 / inject.bat to install and uninstall the OrionQuests userplugin alongside EGO TOOL

### Planned
- Modes Gaming (DND auto) et Staff
- Plugins intégrés (ChannelTabs, ToDoList, Reminder, ChatFilter, BetterVolume…)
- Lazy loading des channels
- Full OSINT module (User Lookup, Server Analysis, Message Scanner)
- Advanced UI customization (glassmorphism, dynamic themes)
- Moderation tools (regex filters, automated actions)

### Changed
- Injector repo URL updated to the current EGO-TOOL repository

## [1.0.0] - 2026-10-09

### Added
- Initial release of **Shoyz Tools** (formerly HideBadgesGUI)
- Badge management system (visual + list-based)
- Plugin settings interface with preview
- Search bar for badge filtering
- "Hide all" / "Show all" quick actions
- Instant application without Discord reload

### Changed
- Rebranded from **HideBadgesGUI** to **Shoyz Tools**
- Expanded scope to full professional tool suite

### Security
- Educational use only
- Public data only
- GPL-3.0 license

[Unreleased]: https://github.com/REFLEX60FPSMOBILE/vencord-hidebadges/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/REFLEX60FPSMOBILE/vencord-hidebadges/releases/tag/v1.0.0
