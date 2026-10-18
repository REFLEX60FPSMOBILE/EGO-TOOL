// Theme engine for EGO TOOL
// Centralized CSS variables, presets, wallpaper, glass/blur and contextual modes.
// Everything is injected through ONE <style id="ego-theme-engine"> element so it can
// be cleanly added and removed with the plugin.

export interface ThemeEngineSettings {
    preset: string;
    wallpaperUrl: string;
    /** Background alpha (0-100) — 100 = fully opaque, lower exposes the wallpaper. */
    wallpaperOpacity: number;
    /** panel blur radius in px (used by Glass mode) */
    blur: number;
    /** global border radius in px */
    radius: number;
    /** hex accent override, "" keeps the preset accent */
    accent: string;
    /** Glass/Aero mode: translucent blurred panels */
    glass: boolean;
    /** Performance mode: no blur, no animations, no transitions */
    performanceMode: boolean;
}

export interface UiModes {
    focus: boolean;
    stream: boolean;
}

interface ThemePreset {
    id: string;
    name: string;
    description: string;
    bgPrimary: [number, number, number];
    bgSecondary: [number, number, number];
    bgTertiary: [number, number, number];
    text: [number, number, number];
    muted: [number, number, number];
    accent: [number, number, number];
    /** default accent hex chip for the theme picker */
    chip: string;
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: "dark",
        name: "Dark",
        description: "Default Discord dark palette (Nexus base)",
        bgPrimary: [54, 57, 63],
        bgSecondary: [47, 49, 54],
        bgTertiary: [32, 34, 37],
        text: [220, 221, 222],
        muted: [114, 118, 125],
        accent: [88, 101, 242],
        chip: "#5865f2",
    },
    {
        id: "light",
        name: "Light",
        description: "Clean light preset (Material base)",
        bgPrimary: [255, 255, 255],
        bgSecondary: [242, 243, 245],
        bgTertiary: [230, 231, 234],
        text: [6, 6, 7],
        muted: [98, 101, 108],
        accent: [88, 101, 242],
        chip: "#e6e7ea",
    },
    {
        id: "oled",
        name: "OLED",
        description: "Pure black, battery-friendly (AMOLED-Cord)",
        bgPrimary: [0, 0, 0],
        bgSecondary: [14, 14, 14],
        bgTertiary: [24, 24, 24],
        text: [235, 235, 235],
        muted: [110, 110, 110],
        accent: [88, 101, 242],
        chip: "#0e0e0e",
    },
    {
        id: "frost",
        name: "Frost",
        description: "Cold, sombre, glassy blue/cyan (Dark Matter / Frosted Glass)",
        bgPrimary: [26, 36, 48],
        bgSecondary: [20, 28, 38],
        bgTertiary: [15, 21, 28],
        text: [230, 240, 250],
        muted: [116, 138, 160],
        accent: [64, 200, 244],
        chip: "#40c8f4",
    },
    {
        id: "neon",
        name: "Neon",
        description: "Cyberpunk high contrast with neon accents (Cyberpunk 2077)",
        bgPrimary: [22, 12, 32],
        bgSecondary: [16, 9, 24],
        bgTertiary: [10, 6, 16],
        text: [245, 240, 255],
        muted: [140, 110, 170],
        accent: [255, 0, 204],
        chip: "#ff00cc",
    },
    {
        id: "material",
        name: "Material",
        description: "Material You dark surfaces (MaterialDiscord / Discord+)",
        bgPrimary: [28, 27, 31],
        bgSecondary: [36, 35, 40],
        bgTertiary: [48, 47, 53],
        text: [230, 225, 239],
        muted: [122, 119, 134],
        accent: [103, 80, 164],
        chip: "#6750a4",
    },
    {
        id: "terminal",
        name: "Terminal",
        description: "TUI / console look for devs (system24 / Tokyo Night)",
        bgPrimary: [13, 17, 23],
        bgSecondary: [18, 25, 33],
        bgTertiary: [10, 14, 19],
        text: [158, 230, 165],
        muted: [88, 120, 100],
        accent: [63, 185, 80],
        chip: "#0d1117",
    },
];

export function getPresetById(id: string): ThemePreset {
    return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

function rgba(c: [number, number, number], alpha: number): string {
    const clamped = Math.min(1, Math.max(0, alpha));
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${clamped.toFixed(3)})`;
}

export const THEME_STYLE_ID = "ego-theme-engine";
export const FOCUS_BODY_CLASS = "ego-mode-focus";
export const STREAM_BODY_CLASS = "ego-mode-stream";

function buildThemeCSS(engine: ThemeEngineSettings, modes: UiModes): string {
    const preset = getPresetById(engine.preset);

    const opacity = Math.min(100, Math.max(5, engine.wallpaperOpacity)) / 100;
    const accent = engine.accent
        ? engine.accent
        : rgba(preset.accent, 1);
    const blurPx = Math.min(30, Math.max(0, engine.blur));
    const radius = Math.min(24, Math.max(0, engine.radius));

    const rootVars = [
        // Backgrounds (alpha lets the wallpaper show through)
        `--background-primary: ${rgba(preset.bgPrimary, opacity)} !important;`,
        `--background-secondary: ${rgba(preset.bgSecondary, opacity)} !important;`,
        `--background-secondary-alt: ${rgba(preset.bgSecondary, opacity * 0.95)} !important;`,
        `--background-tertiary: ${rgba(preset.bgTertiary, opacity)} !important;`,
        `--background-floating: ${rgba(preset.bgSecondary, Math.min(1, opacity + 0.1))} !important;`,
        `--background-mobile-primary: ${rgba(preset.bgPrimary, opacity)} !important;`,
        `--background-mobile-secondary: ${rgba(preset.bgSecondary, opacity)} !important;`,
        // Text
        `--text-normal: ${rgba(preset.text, 0.98)} !important;`,
        `--text-muted: ${rgba(preset.muted, 0.95)} !important;`,
        `--interactive-normal: ${rgba(preset.text, 0.85)} !important;`,
        `--interactive-hover: ${rgba(preset.text, 1)} !important;`,
        `--interactive-muted: ${rgba(preset.muted, 0.85)} !important;`,
        // Accent
        `--brand-experiment: ${accent} !important;`,
        `--brand-500: ${accent} !important;`,
        `--link-color: ${accent} !important;`,
        // Engine knobs (used by the rules below)
        `--ego-radius: ${radius}px;`,
        `--ego-blur: ${blurPx}px;`,
        `--ego-accent: ${accent};`,
        `--ego-surface: ${rgba(preset.bgSecondary, engine.glass ? Math.min(0.75, Math.max(0.15, opacity - 0.25)) : opacity)};`,
        `--ego-accent-glow: ${rgba(preset.accent, 0.35)};`,
    ];

    const css: string[] = [
        // 1. variables
        `:root { ${rootVars.join("\n            ")} }`,
    ];

    // 2. rounded surfaces (curated selectors, checked styles only)
    if (radius !== 8) {
        css.push(
            `
        [class*="sidebar"] nav, [class*="userPopout"], [class*="profileBadges"],
        [class*="message"], [class*="menu"] {
            border-radius: var(--ego-radius) !important;
        }`
        );
    }

    // 3. wallpaper
    if (engine.wallpaperUrl) {
        const wall = engine.wallpaperUrl.replace(/["\\]/g, "");
        css.push(
            `
        html, #app-mount {
            background: url("${wall}") center / cover no-repeat fixed !important;
        }
        div[class*="app"], div[class*="bg_"] {
            background: transparent !important;
        }`
        );
    }

    // 4. glass / aero mode — translucent + blurred ACTIVE panels only, never the whole window
    if (engine.glass && blurPx > 0) {
        css.push(
            `
        nav[class*="sidebar"], [class*="membersWrap"], [class*="userPopout"],
        [class*="searchResultsPanel"], [class*="standardSidebarView"] > [class*="sidebar"] {
            background: var(--ego-surface) !important;
            backdrop-filter: blur(var(--ego-blur)) !important;
        }`
        );
    }

    // 5. performance mode — kill blur, animations and transitions everywhere
    if (engine.performanceMode) {
        css.push(
            `
        * {
            backdrop-filter: none !important;
            animation: none !important;
            transition: none !important;
        }`
        );
    }

    // 6. Focus mode — hide member list, activity column and animations
    if (modes.focus) {
        css.push(
            `
        body.${FOCUS_BODY_CLASS} [class*="membersWrap"],
        body.${FOCUS_BODY_CLASS} [class*="nowPlayingColumn"] {
            display: none !important;
        }
        body.${FOCUS_BODY_CLASS} * {
            animation: none !important;
        }`
        );
    }

    // 7. Stream mode — hide sensitive on-screen data (account tag, badges, spoiler counts)
    if (modes.stream) {
        css.push(
            `
        body.${STREAM_BODY_CLASS} [class*="nameTag"],
        body.${STREAM_BODY_CLASS} [class*="numberBadge"],
        body.${STREAM_BODY_CLASS} [class*="textBadge"] {
            display: none !important;
        }`
        );
    }

    return css.join("\n\n");
}

function ensureStyleElement(id: string): HTMLStyleElement {
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = id;
        (document.head ?? document.documentElement).appendChild(el);
    }
    return el;
}

export function applyThemeEngine(engine: ThemeEngineSettings, modes: UiModes): void {
    const styleEl = ensureStyleElement(THEME_STYLE_ID);
    styleEl.textContent = buildThemeCSS(engine, modes);

    document.body.classList.toggle(FOCUS_BODY_CLASS, !!modes.focus);
    document.body.classList.toggle(STREAM_BODY_CLASS, !!modes.stream);
}

export function clearThemeEngine(): void {
    document.getElementById(THEME_STYLE_ID)?.remove();
    document.body.classList.remove(FOCUS_BODY_CLASS, STREAM_BODY_CLASS);
}
