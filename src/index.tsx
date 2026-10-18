/*
 * EGO TOOL - A comprehensive Discord tool suite for Vencord
 * 
 * This plugin provides:
 * - Advanced badge hiding with visual selection
 * - Profile preview with clickable badges
 * - Discord UI customization
 * - Automatic moderation tools
 * - Quick actions and keyboard shortcuts
 * - Per-server settings
 * - Export/Import configurations
 * - OSINT capabilities for public data analysis
 * 
 * Author: shoyzontop
 * Version: 1.0.0
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

// Import types
import type { 
    BadgeInfo, 
    UITheme, 
    UICustomization, 
    ModerationRule, 
    ModerationStats,
    QuickAction,
    PluginSettings,
    ServerSettings,
    ExportData
} from "./types";

// Import constants and utilities
import { 
    BADGE_SELECTORS, 
    CUSTOM_ATTRS, 
    PRESET_THEMES,
    DEFAULT_QUICK_ACTIONS,
    DEFAULT_MODERATION_RULES,
    DEFAULT_SHORTCUTS,
    MODERATION_ACTIONS 
} from "./utils/constants";

import { applyThemeEngine as renderThemeEngine, clearThemeEngine as resetThemeEngine } from "./utils/themeEngine";

import { 
    generateBadgeKey, 
    getBadgeLabel, 
    resolveBadgeTarget, 
    setElementHidden,
    debounce
} from "./utils/helpers";

import { getCurrentServerId } from "./utils/serverHelpers";

// Import components
import SettingsPanel from "./components/SettingsPanel";

// ============================================================================
// SETTINGS DEFINITION
// ============================================================================

const settings = definePluginSettings({
    // Badges
    hideAllBadges: {
        type: OptionType.BOOLEAN,
        description: "Hide ALL badges (ignores the list below)",
        default: false,
        onChange: () => applyAllBadgeSettings(),
    },
    badgeManager: {
        type: OptionType.COMPONENT,
        component: () => <SettingsPanel
            // Badges
            badgeCatalog={settings.store.badgeCatalog ?? {}}
            hiddenBadges={settings.store.hiddenBadges ?? {}}
            hideAllBadges={settings.store.hideAllBadges ?? false}
            onBadgeToggle={(key) => toggleBadge(key)}
            onBadgeToggleAll={(value) => setAllBadgesHidden(value)}
            onScanBadges={() => scanAllBadges()}
            onResetBadges={() => resetBadges()}
            
            // UI Customization
            uiSettings={settings.store.uiSettings ?? getDefaultUISettings()}
            onUISettingsUpdate={(updates) => updateUISettings(updates)}
            
            // Moderation
            moderationRules={settings.store.moderationRules ?? [...DEFAULT_MODERATION_RULES]}
            moderationStats={settings.store.moderationStats ?? getDefaultModerationStats()}
            moderationEnabled={settings.store.moderationEnabled ?? false}
            onModerationToggle={() => toggleModeration()}
            onAddModerationRule={(rule) => addModerationRule(rule)}
            onUpdateModerationRule={(id, updates) => updateModerationRule(id, updates)}
            onRemoveModerationRule={(id) => removeModerationRule(id)}
            onResetModerationStats={() => resetModerationStats()}
            
            // Quick Actions
            quickActions={getQuickActions()}
            enabledQuickActions={settings.store.enabledQuickActions ?? {}}
            onQuickActionToggle={(id) => toggleQuickAction(id)}
            onQuickActionExecute={(id) => executeQuickAction(id)}
            
            // Server Settings
            serverSettings={settings.store.serverSettings ?? {}}
            currentServerId={currentServerId}
            onUpdateServerSettings={(serverId, updates) => updateServerSettings(serverId, updates)}
            onResetServer={(serverId) => resetServerSettings(serverId)}
            
            // Export/Import
            onExport={() => exportSettings()}
            onImport={(data) => importSettings(data)}
            
            // Theme Engine
            themeEngine={settings.store.themeEngine ?? getDefaultThemeEngineSettings()}
            uiModes={settings.store.uiModes ?? { focus: false, stream: false }}
            onThemeEngineUpdate={(updates) => updateThemeEngineSettings(updates)}
            onUiModesUpdate={(updates) => updateUiModes(updates)}
        />,
    },
}).withPrivateSettings<PluginSettings & {
    serverSettings: Record<string, ServerSettings>;
}>();

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let currentServerId: string | null = null;
let observer: MutationObserver | null = null;
let profileObserver: MutationObserver | null = null;
let moderationObserver: MutationObserver | null = null;
let queue: Set<Element> = new Set();
let scheduled: boolean = false;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function getDefaultUISettings(): UICustomization {
    return {
        enabled: false,
        theme: PRESET_THEMES[0],
        hideMessageTimestamps: false,
        hideUserAvatars: false,
        compactMode: false,
        customCSS: "",
    };
}

function getDefaultModerationStats(): ModerationStats {
    return {
        totalMessages: 0,
        hiddenMessages: 0,
        warnedUsers: 0,
        blockedUsers: 0,
    };
}

function getDefaultThemeEngineSettings() {
    return {
        preset: "dark",
        wallpaperUrl: "",
        wallpaperOpacity: 80,
        blur: 0,
        radius: 8,
        accent: "",
        glass: false,
        performanceMode: false,
    };
}

function applyThemeEngine() {
    const themeEngine = settings.store.themeEngine ?? getDefaultThemeEngineSettings();
    const uiModes = settings.store.uiModes ?? { focus: false, stream: false };
    renderThemeEngine(themeEngine, uiModes);
}

function updateThemeEngineSettings(updates: Partial<ReturnType<typeof getDefaultThemeEngineSettings>>) {
    const current = settings.store.themeEngine ?? getDefaultThemeEngineSettings();
    settings.store.themeEngine = { ...current, ...updates };
    applyThemeEngine();
}

function updateUiModes(updates: Partial<{ focus: boolean; stream: boolean }>) {
    const current = settings.store.uiModes ?? { focus: false, stream: false };
    settings.store.uiModes = { ...current, ...updates };
    applyThemeEngine();
}

function getQuickActions(): QuickAction[] {
    return Object.entries(DEFAULT_QUICK_ACTIONS).map(([id, config]) => ({
        id,
        name: config.name,
        description: config.description,
        category: config.category,
        icon: getIconForAction(id),
        action: () => executeQuickAction(id),
    }));
}

function getIconForAction(id: string): string {
    const icons: Record<string, string> = {
        toggleBadges: "🏳️",
        toggleAvatars: "👤",
        toggleTimestamps: "⏰",
        compactMode: "📄",
        clearCache: "🗑️",
        scanBadges: "🔍",
    };
    return icons[id] || "⚡";
}

// ============================================================================
// BADGE MANAGEMENT
// ============================================================================

function flushBadgeQueue() {
    scheduled = false;
    const imgs = new Set<HTMLImageElement>();

    for (const el of queue) {
        if (!el.isConnected) continue;
        if (el.matches(BADGE_SELECTORS.IMG)) imgs.add(el as HTMLImageElement);
        el.querySelectorAll<HTMLImageElement>(BADGE_SELECTORS.IMG).forEach((i) => imgs.add(i));
    }
    queue = new Set();

    if (imgs.size) processBadgeImages(imgs);
}

function enqueueForBadgeProcessing(el: Element) {
    queue.add(el);
    if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flushBadgeQueue);
    }
}

function processBadgeImages(imgs: Iterable<HTMLImageElement>) {
    const catalog = settings.store.badgeCatalog ?? {};
    const hidden = settings.store.hiddenBadges ?? {};
    const hideAll = settings.store.hideAllBadges ?? false;
    const serverSettings = settings.store.serverSettings ?? {};
    const found: Record<string, BadgeInfo> = {};

    for (const img of imgs) {
        if (!img.src) continue;
        
        const { key, kind } = generateBadgeKey(img);

        if (!catalog[key] && !found[key]) {
            found[key] = {
                key,
                kind,
                label: getBadgeLabel(img, key),
                src: img.currentSrc || img.src,
            };
        }

        // Hide the element
        const target = resolveBadgeTarget(img);
        
        // Check for server-specific settings
        if (currentServerId && serverSettings[currentServerId]) {
            const serverConfig = serverSettings[currentServerId];
            const shouldHide = serverConfig.hideBadges || 
                             serverConfig.hiddenBadges?.[key] || 
                             hideAll || 
                             !!hidden[key];
            setElementHidden(target, shouldHide, CUSTOM_ATTRS.HIDDEN);
        } else {
            const shouldHide = hideAll || !!hidden[key];
            setElementHidden(target, shouldHide, CUSTOM_ATTRS.HIDDEN);
        }
    }

    if (Object.keys(found).length) {
        settings.store.badgeCatalog = { ...catalog, ...found };
    }
}

function scanAllBadges() {
    processBadgeImages(document.querySelectorAll<HTMLImageElement>(BADGE_SELECTORS.IMG));
}

function toggleBadge(key: string) {
    const hidden = settings.store.hiddenBadges ?? {};
    const newHidden = { ...hidden, [key]: !hidden[key] };
    settings.store.hiddenBadges = newHidden;
    applyAllBadgeSettings();
}

function setAllBadgesHidden(value: boolean) {
    const catalog = settings.store.badgeCatalog ?? {};
    const newHidden: Record<string, boolean> = {};
    for (const key of Object.keys(catalog)) {
        newHidden[key] = value;
    }
    settings.store.hiddenBadges = newHidden;
    settings.store.hideAllBadges = value;
    applyAllBadgeSettings();
}

function resetBadges() {
    settings.store.badgeCatalog = {};
    settings.store.hiddenBadges = {};
    settings.store.hideAllBadges = false;
    scanAllBadges();
}

function applyAllBadgeSettings() {
    const hideAll = settings.store.hideAllBadges ?? false;
    const hidden = settings.store.hiddenBadges ?? {};
    const serverSettings = settings.store.serverSettings ?? {};
    
    document.querySelectorAll<HTMLElement>(`[${CUSTOM_ATTRS.HIDDEN}]`).forEach((el) => {
        const key = el.getAttribute("data-badge-key") || "";
        const serverId = el.getAttribute("data-server-id") || "";
        
        let shouldHide = hideAll || !!hidden[key];
        
        // Check server settings
        if (serverId && serverSettings[serverId]) {
            shouldHide = serverSettings[serverId].hideBadges || 
                       serverSettings[serverId].hiddenBadges?.[key] || 
                       shouldHide;
        }
        
        setElementHidden(el, shouldHide, CUSTOM_ATTRS.HIDDEN);
    });
    
    scanAllBadges();
}

// ============================================================================
// SERVER SETTINGS
// ============================================================================

function updateServerSettings(serverId: string, updates: Partial<ServerSettings>) {
    const serverSettings = settings.store.serverSettings ?? {};
    const current = serverSettings[serverId] || { hideBadges: false, hiddenBadges: {} };
    settings.store.serverSettings = {
        ...serverSettings,
        [serverId]: { ...current, ...updates },
    };
    applyAllBadgeSettings();
}

function resetServerSettings(serverId: string) {
    const serverSettings = settings.store.serverSettings ?? {};
    const newSettings = { ...serverSettings };
    delete newSettings[serverId];
    settings.store.serverSettings = newSettings;
    applyAllBadgeSettings();
}

function updateCurrentServer() {
    const newServerId = getCurrentServerId();
    if (newServerId !== currentServerId) {
        currentServerId = newServerId;
        applyAllBadgeSettings();
    }
}

// ============================================================================
// UI CUSTOMIZATION
// ============================================================================

function updateUISettings(updates: Partial<UICustomization>) {
    const current = settings.store.uiSettings ?? getDefaultUISettings();
    settings.store.uiSettings = { ...current, ...updates };
    applyUISettings();
}

function applyUISettings() {
    const uiSettings = settings.store.uiSettings ?? getDefaultUISettings();
    
    if (!uiSettings.enabled) {
        removeCustomStyles();
        return;
    }
    
    applyTheme(uiSettings.theme);
    
    if (uiSettings.hideMessageTimestamps) {
        applyHideTimestamps();
    } else {
        removeHideTimestamps();
    }
    
    if (uiSettings.hideUserAvatars) {
        applyHideAvatars();
    } else {
        removeHideAvatars();
    }
    
    if (uiSettings.compactMode) {
        applyCompactMode();
    } else {
        removeCompactMode();
    }
    
    if (uiSettings.customCSS) {
        applyCustomCSS(uiSettings.customCSS);
    } else {
        removeCustomCSS();
    }
}

function applyTheme(theme: UITheme) {
    const style = document.getElementById("vc-ego-tool-theme");
    if (!style) {
        const newStyle = document.createElement("style");
        newStyle.id = "vc-ego-tool-theme";
        document.head.appendChild(newStyle);
    }
    
    const css = `
        :root {
            --vc-theme-primary: ${theme.colors.primary};
            --vc-theme-secondary: ${theme.colors.secondary};
            --vc-theme-accent: ${theme.colors.accent};
            --vc-theme-background: ${theme.colors.background};
            --vc-theme-text: ${theme.colors.text};
            --vc-theme-muted: ${theme.colors.muted};
        }
    `;
    
    if (style) {
        style.textContent = css;
    }
}

function applyHideTimestamps() {
    const style = document.getElementById("vc-hide-timestamps");
    if (!style) {
        const newStyle = document.createElement("style");
        newStyle.id = "vc-hide-timestamps";
        document.head.appendChild(newStyle);
    }
    
    const css = `
        .message-timestamp, .timestamp, [class*="timestamp"] {
            display: none !important;
        }
    `;
    
    if (style) {
        style.textContent = css;
    }
}

function removeHideTimestamps() {
    const style = document.getElementById("vc-hide-timestamps");
    if (style) {
        style.remove();
    }
}

function applyHideAvatars() {
    const style = document.getElementById("vc-hide-avatars");
    if (!style) {
        const newStyle = document.createElement("style");
        newStyle.id = "vc-hide-avatars";
        document.head.appendChild(newStyle);
    }
    
    const css = `
        .avatar, .user-avatar, [class*="avatar"] {
            display: none !important;
        }
    `;
    
    if (style) {
        style.textContent = css;
    }
}

function removeHideAvatars() {
    const style = document.getElementById("vc-hide-avatars");
    if (style) {
        style.remove();
    }
}

function applyCompactMode() {
    const style = document.getElementById("vc-compact-mode");
    if (!style) {
        const newStyle = document.createElement("style");
        newStyle.id = "vc-compact-mode";
        document.head.appendChild(newStyle);
    }
    
    const css = `
        .message, [class*="message"] {
            padding: 8px 12px !important;
            margin: 2px 0 !important;
        }
        .message-content, [class*="messageContent"] {
            gap: 4px !important;
        }
    `;
    
    if (style) {
        style.textContent = css;
    }
}

function removeCompactMode() {
    const style = document.getElementById("vc-compact-mode");
    if (style) {
        style.remove();
    }
}

function applyCustomCSS(css: string) {
    const style = document.getElementById("vc-custom-css");
    if (!style) {
        const newStyle = document.createElement("style");
        newStyle.id = "vc-custom-css";
        document.head.appendChild(newStyle);
    }
    
    if (style) {
        style.textContent = css;
    }
}

function removeCustomCSS() {
    const style = document.getElementById("vc-custom-css");
    if (style) {
        style.remove();
    }
}

function removeCustomStyles() {
    removeHideTimestamps();
    removeHideAvatars();
    removeCompactMode();
    removeCustomCSS();
}

// ============================================================================
// MODERATION TOOLS
// ============================================================================

function toggleModeration() {
    const enabled = settings.store.moderationEnabled ?? false;
    settings.store.moderationEnabled = !enabled;
    
    if (!enabled) {
        setupModerationObserver();
    } else {
        removeModerationObserver();
    }
}

function addModerationRule(rule: ModerationRule) {
    const rules = settings.store.moderationRules ?? [];
    settings.store.moderationRules = [...rules, rule];
}

function updateModerationRule(id: string, updates: Partial<ModerationRule>) {
    const rules = settings.store.moderationRules ?? [];
    const index = rules.findIndex((r) => r.id === id);
    if (index !== -1) {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], ...updates };
        settings.store.moderationRules = newRules;
    }
}

function removeModerationRule(id: string) {
    const rules = settings.store.moderationRules ?? [];
    settings.store.moderationRules = rules.filter((r) => r.id !== id);
}

function resetModerationStats() {
    settings.store.moderationStats = getDefaultModerationStats();
}



function setupModerationObserver() {
    if (moderationObserver) return;
    
    moderationObserver = new MutationObserver(debounce((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        checkMessageForModeration(node as HTMLElement);
                    }
                }
            }
        }
    }, 500));
    
    moderationObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

function removeModerationObserver() {
    if (moderationObserver) {
        moderationObserver.disconnect();
        moderationObserver = null;
    }
}

function checkMessageForModeration(element: HTMLElement) {
    const rules = settings.store.moderationRules ?? [];
    const enabledRules = rules.filter((r) => r.enabled);
    
    if (enabledRules.length === 0) return;
    
    if (!element.querySelector?.(".message-content, [class*='messageContent']")) return;
    
    const textContent = element.textContent?.toLowerCase() || "";
    
    for (const rule of enabledRules) {
        try {
            const regex = new RegExp(rule.pattern, "gi");
            if (regex.test(textContent)) {
                executeModerationAction(element, rule.action);
                break;
            }
        } catch (e) {
            console.error("Invalid regex pattern:", rule.pattern, e);
        }
    }
}

function executeModerationAction(element: HTMLElement, action: string) {
    const stats = settings.store.moderationStats ?? getDefaultModerationStats();
    
    switch (action) {
        case MODERATION_ACTIONS.HIDE:
            setElementHidden(element, true, CUSTOM_ATTRS.MODERATED);
            stats.hiddenMessages++;
            break;
            
        case MODERATION_ACTIONS.WARN:
            stats.warnedUsers++;
            break;
            
        case MODERATION_ACTIONS.BLOCK:
            stats.blockedUsers++;
            break;
    }
    
    stats.totalMessages++;
    settings.store.moderationStats = stats;
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

function toggleQuickAction(id: string) {
    const enabled = settings.store.enabledQuickActions ?? {};
    settings.store.enabledQuickActions = { ...enabled, [id]: !enabled[id] };
}

function executeQuickAction(id: string) {
    switch (id) {
        case "toggleBadges":
            const hideAll = settings.store.hideAllBadges ?? false;
            setAllBadgesHidden(!hideAll);
            break;
            
        case "toggleAvatars":
            const uiSettings = settings.store.uiSettings ?? getDefaultUISettings();
            updateUISettings({ hideUserAvatars: !uiSettings.hideUserAvatars });
            break;
            
        case "toggleTimestamps":
            const currentUISettings = settings.store.uiSettings ?? getDefaultUISettings();
            updateUISettings({ hideMessageTimestamps: !currentUISettings.hideMessageTimestamps });
            break;
            
        case "compactMode":
            const currentSettings = settings.store.uiSettings ?? getDefaultUISettings();
            updateUISettings({ compactMode: !currentSettings.compactMode });
            break;
            
        case "clearCache":
            resetBadges();
            break;
            
        case "scanBadges":
            scanAllBadges();
            break;
    }
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        const shortcuts = settings.store.keyboardShortcuts ?? DEFAULT_SHORTCUTS;
        
        for (const shortcut of shortcuts) {
            if (e.key.toUpperCase() === shortcut.key.toUpperCase() &&
                e.ctrlKey === shortcut.ctrl &&
                e.shiftKey === shortcut.shift &&
                e.altKey === shortcut.alt) {
                
                e.preventDefault();
                executeQuickAction(shortcut.id);
            }
        }
    });
}

// ============================================================================
// EXPORT/IMPORT
// ============================================================================

function exportSettings(): ExportData {
    return {
        version: "1.0.0",
        timestamp: Date.now(),
        settings: {
            hideAllBadges: settings.store.hideAllBadges ?? false,
            hiddenBadges: settings.store.hiddenBadges ?? {},
            badgeCatalog: settings.store.badgeCatalog ?? {},
            uiSettings: settings.store.uiSettings ?? getDefaultUISettings(),
            moderationRules: settings.store.moderationRules ?? [...DEFAULT_MODERATION_RULES],
            moderationStats: settings.store.moderationStats ?? getDefaultModerationStats(),
            enabledQuickActions: settings.store.enabledQuickActions ?? {},
            keyboardShortcuts: settings.store.keyboardShortcuts ?? DEFAULT_SHORTCUTS,
        },
        serverSettings: settings.store.serverSettings ?? {},
    };
}

function importSettings(data: ExportData) {
    // Check version for compatibility
    if (data.version) {
        // Import main settings
        if (data.settings) {
            settings.store.hideAllBadges = data.settings.hideAllBadges ?? false;
            settings.store.hiddenBadges = data.settings.hiddenBadges ?? {};
            settings.store.badgeCatalog = data.settings.badgeCatalog ?? {};
            settings.store.uiSettings = data.settings.uiSettings ?? getDefaultUISettings();
            settings.store.moderationRules = data.settings.moderationRules ?? [...DEFAULT_MODERATION_RULES];
            settings.store.moderationStats = data.settings.moderationStats ?? getDefaultModerationStats();
            settings.store.enabledQuickActions = data.settings.enabledQuickActions ?? {};
            settings.store.keyboardShortcuts = data.settings.keyboardShortcuts ?? DEFAULT_SHORTCUTS;
        }
        
        // Import server settings
        if (data.serverSettings) {
            settings.store.serverSettings = data.serverSettings;
        }
        
        // Apply changes
        applyAllBadgeSettings();
        applyUISettings();
    }
}

// ============================================================================
// PROFILE OBSERVER
// ============================================================================

function setupProfileObserver() {
    if (profileObserver) return;
    
    profileObserver = new MutationObserver(debounce((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement;
                    if (element.querySelector?.(".userProfileModal, [class*='userProfile'], [class*='profileModal']")) {
                        scanProfileForBadges(element);
                    }
                    if (element.querySelector?.(".userPopout, [class*='userPopout'], [class*='profilePopout']")) {
                        scanProfileForBadges(element);
                    }
                }
            }
        }
    }, 300));
    
    profileObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

function scanProfileForBadges(element: HTMLElement) {
    const profileBadges = element.querySelectorAll<HTMLImageElement>(BADGE_SELECTORS.IMG);
    if (profileBadges.length > 0) {
        processBadgeImages(profileBadges);
    }
    
    const profileObserver = new MutationObserver(debounce(() => {
        const badges = element.querySelectorAll<HTMLImageElement>(BADGE_SELECTORS.IMG);
        if (badges.length > 0) {
            processBadgeImages(badges);
        }
    }, 200));
    
    profileObserver.observe(element, {
        childList: true,
        subtree: true,
    });
    
    setTimeout(() => {
        profileObserver.disconnect();
    }, 10000);
}

// ============================================================================
// BADGE OBSERVER
// ============================================================================

function setupBadgeObserver() {
    if (observer) return;
    
    observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "attributes") {
                enqueueForBadgeProcessing(mutation.target as Element);
            } else {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        enqueueForBadgeProcessing(node as Element);
                    }
                });
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "class"],
    });
}

// ============================================================================
// SERVER OBSERVER
// ============================================================================

function setupServerObserver() {
    const serverObserver = new MutationObserver(debounce(() => {
        updateCurrentServer();
    }, 100));
    
    serverObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
    
    return serverObserver;
}

// ============================================================================
// MAIN PLUGIN
// ============================================================================

export default definePlugin({
    name: "EGO TOOL",
    description: "A comprehensive Discord tool suite with OSINT capabilities, badge management, UI customization, and server analysis",
    authors: [
        { name: "shoyzontop", id: 0n },
    ],
    version: "1.0.0",
    settings,
    
    // Initialization
    start() {
        // Initialize default settings if needed
        if (!settings.store.badgeCatalog) {
            settings.store.badgeCatalog = {};
        }
        if (!settings.store.hiddenBadges) {
            settings.store.hiddenBadges = {};
        }
        if (!settings.store.uiSettings) {
            settings.store.uiSettings = getDefaultUISettings();
        }
        if (!settings.store.moderationRules) {
            settings.store.moderationRules = [...DEFAULT_MODERATION_RULES];
        }
        if (!settings.store.moderationStats) {
            settings.store.moderationStats = getDefaultModerationStats();
        }
        if (!settings.store.enabledQuickActions) {
            settings.store.enabledQuickActions = {};
        }
        if (!settings.store.serverSettings) {
            settings.store.serverSettings = {};
        }
        if (!settings.store.themeEngine) {
            settings.store.themeEngine = getDefaultThemeEngineSettings();
        }
        if (!settings.store.uiModes) {
            settings.store.uiModes = { focus: false, stream: false };
        }
        
        // Apply theme engine + contextual modes
        applyThemeEngine();
        
        // Get current server
        currentServerId = getCurrentServerId();
        
        // Scan existing badges
        scanAllBadges();
        
        // Apply UI settings
        applyUISettings();
        
        // Setup observers
        setupBadgeObserver();
        setupProfileObserver();
        setupServerObserver();
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Setup moderation observer if enabled
        if (settings.store.moderationEnabled) {
            setupModerationObserver();
        }
    },
    
    // Plugin stop
    stop() {
        // Disconnect observers
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        
        if (profileObserver) {
            profileObserver.disconnect();
            profileObserver = null;
        }
        
        if (moderationObserver) {
            moderationObserver.disconnect();
            moderationObserver = null;
        }
        
        // Reset
        currentServerId = null;
        queue = new Set();
        scheduled = false;
        
        // Show all hidden elements
        document.querySelectorAll<HTMLElement>(`[${CUSTOM_ATTRS.HIDDEN}]`).forEach((el) => {
            setElementHidden(el, false, CUSTOM_ATTRS.HIDDEN);
        });
        
        document.querySelectorAll<HTMLElement>(`[${CUSTOM_ATTRS.MODERATED}]`).forEach((el) => {
            setElementHidden(el, false, CUSTOM_ATTRS.MODERATED);
        });
        
        // Remove injected styles
        resetThemeEngine();
        
        const styles = [
            "vc-ego-tool-theme",
            "vc-hide-timestamps",
            "vc-hide-avatars",
            "vc-compact-mode",
            "vc-custom-css",
        ];
        
        for (const id of styles) {
            const style = document.getElementById(id);
            if (style) {
                style.remove();
            }
        }
    },
});
