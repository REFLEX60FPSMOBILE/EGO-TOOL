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
import { getUserSettingLazy } from "@api/UserSettings";
import definePlugin, { OptionType } from "@utils/types";
import { React, FluxDispatcher, Toasts } from "@webpack/common";

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
    ExportData,
    TodoItem,
    TodoPriority,
    ReminderItem,
    UiModes
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

import { applyThemeEngine as renderThemeEngine, clearThemeEngine as resetThemeEngine, getDefaultUiModes } from "./utils/themeEngine";

import { 
    generateBadgeKey, 
    getBadgeLabel, 
    resolveBadgeTarget, 
    setElementHidden,
    debounce,
    generateId,
    hashPin
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
            uiModes={settings.store.uiModes ?? getDefaultUiModes()}
            onThemeEngineUpdate={(updates) => updateThemeEngineSettings(updates)}
            onUiModesUpdate={(updates) => updateUiModes(updates)}
            
            // Gaming
            gamingAutoDnd={settings.store.gamingAutoDnd ?? false}
            onGamingAutoDndUpdate={(value) => {
                settings.store.gamingAutoDnd = value;
                setupDndAutomation();
            }}
            
            // Productivity
            todoTasks={settings.store.todoTasks ?? []}
            reminders={settings.store.reminders ?? []}
            onAddTodo={(text, priority, deadline) => addTodo(text, priority, deadline)}
            onToggleTodo={(id) => toggleTodo(id)}
            onRemoveTodo={(id) => removeTodo(id)}
            onClearDoneTodos={() => clearDoneTodos()}
            onAddReminder={(text, dueAt, repeatMinutes) => addReminder(text, dueAt, repeatMinutes)}
            onRemoveReminder={(id) => removeReminder(id)}
            
            // Security
            passcodeEnabled={settings.store.passcodeEnabled ?? false}
            onSetPasscode={(pin) => setPasscode(pin)}
            onSetPasscodeEnabled={(value) => setPasscodeEnabled(value)}
        />,
    },
}).withPrivateSettings<PluginSettings & {
    serverSettings: Record<string, ServerSettings>;
    gamingAutoDnd: boolean;
    todoTasks: TodoItem[];
    reminders: ReminderItem[];
    passcode: string;
    passcodeEnabled: boolean;
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

function updateUiModes(updates: Partial<UiModes>) {
    const current = settings.store.uiModes ?? getDefaultUiModes();
    settings.store.uiModes = { ...current, ...updates };
    applyThemeEngine();
}

// ============================================================================
// GAMING MODE — AUTO DND (inspired by Vencord's AutoDNDWhilePlaying)
// ============================================================================

let dndSavedStatus: string | null = null;
let dndStatusModule: { getSetting(): string | undefined; updateSetting(value: string): Promise<void> | void } | null = null;
let onRunningGamesChange: ((payload: unknown) => void) | null = null;

function ensureDndModule() {
    if (dndStatusModule) return dndStatusModule;
    try {
        dndStatusModule = getUserSettingLazy("status", "status");
    } catch (e) {
        console.log("EGO TOOL: unable to load the user status setting module", e);
        dndStatusModule = null;
    }
    return dndStatusModule;
}

function handleRunningGamesChange(payload: unknown): void {
    if (!(settings.store.gamingAutoDnd ?? false)) return;
    const games = (payload as { games?: unknown[] } | null)?.games;
    const gaming = Array.isArray(games) && games.length > 0;
    
    const mod = ensureDndModule();
    if (!mod) return;
    
    const current = mod.getSetting();
    
    if (gaming) {
        if (current === "invisible") return;
        if (current !== "dnd") {
            dndSavedStatus = current ?? null;
            try { void mod.updateSetting("dnd"); } catch { /* noop */ }
        }
    } else if (dndSavedStatus !== null) {
        const restore = dndSavedStatus;
        dndSavedStatus = null;
        if (current === "dnd") {
            try { void mod.updateSetting(restore); } catch { /* noop */ }
        }
    }
}

function setupDndAutomation() {
    if (!(settings.store.gamingAutoDnd ?? false)) return removeDndAutomation();
    if (onRunningGamesChange) return;
    onRunningGamesChange = handleRunningGamesChange;
    try {
        FluxDispatcher.subscribe("RUNNING_GAMES_CHANGE", onRunningGamesChange);
    } catch (e) {
        console.log("EGO TOOL: RUNNING_GAMES_CHANGE unavailable", e);
        onRunningGamesChange = null;
    }
}

function removeDndAutomation() {
    if (onRunningGamesChange) {
        try { FluxDispatcher.unsubscribe("RUNNING_GAMES_CHANGE", onRunningGamesChange); } catch { /* noop */ }
        onRunningGamesChange = null;
    }
    // restore status if the automation is being turned off while a game is running
    if (dndSavedStatus !== null) {
        const mod = ensureDndModule();
        const restore = dndSavedStatus;
        dndSavedStatus = null;
        if (mod && mod.getSetting() === "dnd") {
            try { void mod.updateSetting(restore); } catch { /* noop */ }
        }
    }
}

// ============================================================================
// PRODUCTIVITY — TO-DO LIST & REMINDERS (inspired by BetterDiscord's ToDoList/Reminder)
// ============================================================================

let reminderIntervalId: ReturnType<typeof setInterval> | null = null;

function addTodo(text: string, priority: TodoPriority, deadline: number) {
    const todos = settings.store.todoTasks ?? [];
    const item: TodoItem = {
        id: generateId(),
        text: text.trim(),
        priority,
        done: false,
        deadline,
        createdAt: Date.now(),
    };
    settings.store.todoTasks = [...todos, item];
    return item;
}

function toggleTodo(id: string) {
    const todos = settings.store.todoTasks ?? [];
    settings.store.todoTasks = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
}

function removeTodo(id: string) {
    settings.store.todoTasks = (settings.store.todoTasks ?? []).filter(t => t.id !== id);
}

function clearDoneTodos() {
    settings.store.todoTasks = (settings.store.todoTasks ?? []).filter(t => !t.done);
}

function addReminder(text: string, dueAt: number, repeatMinutes: number): ReminderItem {
    const reminder: ReminderItem = {
        id: generateId(),
        text: text.trim(),
        dueAt,
        repeatMinutes,
        createdAt: Date.now(),
    };
    settings.store.reminders = [...(settings.store.reminders ?? []), reminder];
    return reminder;
}

function removeReminder(id: string) {
    settings.store.reminders = (settings.store.reminders ?? []).filter(r => r.id !== id);
}

function checkDueReminders() {
    const now = Date.now();
    let reminders = settings.store.reminders ?? [];
    let changed = false;
    
    for (const reminder of reminders) {
        if (reminder.dueAt > now) continue;
        
        const overdueBy = now - reminder.dueAt;
        if (overdueBy > 60000) continue; // fired while the client was closed — leave it alone
        
        try {
            Toasts.show({ message: `⏰ ${reminder.text}` });
        } catch (e) {
            console.log("EGO TOOL: reminders", e);
        }
        
        if (reminder.repeatMinutes > 0) {
            // reschedule — dueAt may drift backwards from its miss, forward-correct it
            let next = reminder.dueAt + reminder.repeatMinutes * 60000;
            while (next <= now) next += reminder.repeatMinutes * 60000;
            settings.store.reminders = (settings.store.reminders ?? []).map(r =>
                r.id === reminder.id ? { ...r, dueAt: next } : r
            );
        } else {
            settings.store.reminders = (settings.store.reminders ?? []).filter(r => r.id !== reminder.id);
            changed = true;
        }
    }
    
    if (changed) {
        settings.store.reminders = settings.store.reminders ?? [];
    }
}

function setupReminderTicker() {
    if (reminderIntervalId) return;
    reminderIntervalId = setInterval(checkDueReminders, 30000);
}

function removeReminderTicker() {
    if (reminderIntervalId) {
        clearInterval(reminderIntervalId);
        reminderIntervalId = null;
    }
}

// ============================================================================
// SECURITY — PASSCODE LOCK (overlay, inspired by BetterDiscord's PasscodeLock)
// ============================================================================

let passcodeAttempts = 0;

function isClientLocked(): boolean {
    return !!document.getElementById("ego-lock-overlay");
}

function lockClient() {
    if (isClientLocked()) return;
    const storedHash = settings.store.passcode ?? "";
    if (!storedHash) return;
    
    const overlay = document.createElement("div");
    overlay.id = "ego-lock-overlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(10,10,14,0.97);color:#eee;font-family:sans-serif";
    overlay.innerHTML = `
        <div style="font-size:22px;font-weight:700">🔒 EGO TOOL — client verrouillé</div>
        <input id="ego-lock-input" type="password" inputmode="numeric" maxlength="8" placeholder="Code..." autocomplete="off"
            style="font-size:20px;letter-spacing:6px;text-align:center;padding:10px;border-radius:8px;border:1px solid #444;background:#1c1c22;color:#fff;width:180px" />
        <div id="ego-lock-msg" style="font-size:12px;color:#888">Entrez votre code pour déverrouiller.</div>
        <button id="ego-lock-ok" type="button" style="padding:8px 18px;border-radius:6px;border:none;background:#5865f2;color:#fff;cursor:pointer;font-size:14px">Déverrouiller</button>
        <div style="max-width:280px;text-align:center;font-size:11px;color:#666">
            Mot de passe oublié ? Désactivez EGO TOOL depuis le launcher, ou allez dans Paramètres → Vencord et coupez le plugin.
        </div>
    `;
    
    const done = (): void => {
        overlay.remove();
    };
    
    const fail = (): void => {
        const msg = overlay.querySelector("#ego-lock-msg");
        passcodeAttempts++;
        if (msg) msg.textContent = passcodeAttempts >= 10 ? "⚠️ 10 échecs. Désactivez le plugin si vous avez oublié le code." : `Code incorrect (${passcodeAttempts}).`;
    };
    
    overlay.querySelector("#ego-lock-ok")?.addEventListener("click", () => {
        const input = overlay.querySelector<HTMLInputElement>("#ego-lock-input");
        if (input && hashPin(input.value) === storedHash) done();
        else fail();
    });
    overlay.querySelector("#ego-lock-input")?.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") {
            const input = overlay.querySelector<HTMLInputElement>("#ego-lock-input");
            if (input && hashPin(input.value) === storedHash) done();
            else fail();
        }
    });
    
    (document.body ?? document.documentElement).appendChild(overlay);
    (overlay.querySelector("#ego-lock-input") as HTMLInputElement | null)?.focus();
}

function setupPasscodeLock() {
    if ((settings.store.passcodeEnabled ?? false) && (settings.store.passcode ?? "")) {
        lockClient();
    }
}

function setPasscode(pin: string | null) {
    if (pin) {
        settings.store.passcode = hashPin(pin);
        settings.store.passcodeEnabled = true;
        lockClient();
    } else {
        settings.store.passcode = "";
        settings.store.passcodeEnabled = false;
        document.getElementById("ego-lock-overlay")?.remove();
        passcodeAttempts = 0;
    }
}

function setPasscodeEnabled(value: boolean) {
    settings.store.passcodeEnabled = value;
    if (value && (settings.store.passcode ?? "")) lockClient();
    else if (!value) document.getElementById("ego-lock-overlay")?.remove();
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
            todoTasks: settings.store.todoTasks ?? [],
            reminders: settings.store.reminders ?? [],
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
            settings.store.todoTasks = data.settings.todoTasks ?? [];
            settings.store.reminders = data.settings.reminders ?? [];
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
        if (!settings.store.todoTasks) {
            settings.store.todoTasks = [];
        }
        if (!settings.store.reminders) {
            settings.store.reminders = [];
        }
        if (settings.store.gamingAutoDnd === undefined) {
            settings.store.gamingAutoDnd = false;
        }
        if (settings.store.passcode === undefined) {
            settings.store.passcode = "";
        }
        if (settings.store.passcodeEnabled === undefined) {
            settings.store.passcodeEnabled = false;
        }
        if (!settings.store.themeEngine) {
            settings.store.themeEngine = getDefaultThemeEngineSettings();
        }
        if (!settings.store.uiModes) {
            settings.store.uiModes = getDefaultUiModes();
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
        
        // Gaming auto-DND, reminders and passcode lock
        setupDndAutomation();
        setupReminderTicker();
        setupPasscodeLock();
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
        
        // Teardown productivity + security + gaming
        removeDndAutomation();
        removeReminderTicker();
        
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
