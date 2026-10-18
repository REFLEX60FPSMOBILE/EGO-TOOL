// Constants for EGO TOOL plugin

import type { ModerationRule } from "../types";

// CSS selectors for badges
export const BADGE_SELECTORS = {
    IMG: [
        'img[src*="/badge-icons/"]',
        "img.vc-user-badge",
        '[class*="profileBadge"] img',
        '[class*="badgesContainer"] img',
        '[class*="userBadges"] img',
        '[class*="badge"] img',
    ].join(","),
    
    CONTAINERS: [
        '[class*="profileBadges"]',
        '[class*="badgesContainer"]',
        '[class*="userBadges"]',
        '[class*="badgeContainer"]',
    ].join(","),
};

// Custom attributes
export const CUSTOM_ATTRS = {
    HIDDEN: "data-vc-shoyz-tools-hidden",
    CUSTOM_THEME: "data-vc-custom-theme",
    MODERATED: "data-vc-moderated",
};

// Badge categories
export const BADGE_CATEGORIES = {
    DISCORD: "discord",
    VENCORD: "vencord",
    CUSTOM: "custom",
    OTHER: "other",
} as const;

// Moderation actions
export const MODERATION_ACTIONS = {
    HIDE: "hide",
    WARN: "warn",
    BLOCK: "block",
} as const;

// Preset themes
export const PRESET_THEMES = [
    {
        id: "default",
        name: "Default",
        colors: {
            primary: "#5865f2",
            secondary: "#4752c4",
            accent: "#7289da",
            background: "#36393f",
            text: "#ffffff",
            muted: "#99aab5",
        },
    },
    {
        id: "dark",
        name: "Dark",
        colors: {
            primary: "#2f3136",
            secondary: "#202225",
            accent: "#5865f2",
            background: "#1e1e1e",
            text: "#ffffff",
            muted: "#72767d",
        },
    },
    {
        id: "light",
        name: "Light",
        colors: {
            primary: "#7289da",
            secondary: "#99aab5",
            accent: "#5865f2",
            background: "#ffffff",
            text: "#000000",
            muted: "#4f545c",
        },
    },
    {
        id: "green",
        name: "Green",
        colors: {
            primary: "#3ba55c",
            secondary: "#2e8b57",
            accent: "#43b581",
            background: "#36393f",
            text: "#ffffff",
            muted: "#99aab5",
        },
    },
    {
        id: "red",
        name: "Red",
        colors: {
            primary: "#ed4245",
            secondary: "#c73a3d",
            accent: "#ff0000",
            background: "#36393f",
            text: "#ffffff",
            muted: "#99aab5",
        },
    },
    {
        id: "purple",
        name: "Purple",
        colors: {
            primary: "#9b59b6",
            secondary: "#8e44ad",
            accent: "#a569bd",
            background: "#36393f",
            text: "#ffffff",
            muted: "#99aab5",
        },
    },
];

// Default quick actions
export const DEFAULT_QUICK_ACTIONS = {
    toggleBadges: {
        id: "toggleBadges",
        name: "Toggle Badges",
        description: "Show or hide all badges globally",
        category: "Badges",
    },
    toggleAvatars: {
        id: "toggleAvatars",
        name: "Toggle Avatars",
        description: "Show or hide user avatars",
        category: "UI",
    },
    toggleTimestamps: {
        id: "toggleTimestamps",
        name: "Toggle Timestamps",
        description: "Show or hide message timestamps",
        category: "UI",
    },
    compactMode: {
        id: "compactMode",
        name: "Compact Mode",
        description: "Enable or disable compact message spacing",
        category: "UI",
    },
    clearCache: {
        id: "clearCache",
        name: "Clear Cache",
        description: "Clear badge catalog and cached data",
        category: "System",
    },
    scanBadges: {
        id: "scanBadges",
        name: "Scan Badges",
        description: "Scan for new badges on the page",
        category: "Badges",
    },
};

// Default moderation rules
export const DEFAULT_MODERATION_RULES: ModerationRule[] = [
    {
        id: "hide-short-links",
        name: "Hide Shortened Links",
        pattern: "(https?://)?(bit.ly|tinyurl.com|goo.gl|ow.ly|is.gd)",
        action: "hide",
        enabled: true,
    },
    {
        id: "warn-discord-invites",
        name: "Warn for Discord Invites",
        pattern: "(discord.gg|discord.com/invite)",
        action: "warn",
        enabled: false,
    },
    {
        id: "hide-profanity",
        name: "Hide Profanity",
        pattern: "(fuck|shit|bitch|asshole|cunt|dick|pussy|bastard)",
        action: "hide",
        enabled: false,
    },
    {
        id: "hide-spam",
        name: "Hide Spam Messages",
        pattern: "(BUY|FREE|WIN|PRIZE|CLICK|LIMITED|URGENT|ACT NOW)",
        action: "hide",
        enabled: false,
    },
];

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS = [
    {
        id: "toggleBadges",
        name: "Toggle Badges",
        key: "b",
        ctrl: true,
        shift: false,
        alt: false,
    },
    {
        id: "toggleAvatars",
        name: "Toggle Avatars",
        key: "u",
        ctrl: true,
        shift: false,
        alt: false,
    },
    {
        id: "scanBadges",
        name: "Scan Badges",
        key: "s",
        ctrl: true,
        shift: true,
        alt: false,
    },
];

// Performance settings
export const PERFORMANCE = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 500,
    BATCH_SIZE: 50,
    MAX_QUEUE_SIZE: 100,
    SCAN_INTERVAL: 5000,
};
