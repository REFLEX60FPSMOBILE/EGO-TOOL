// Core type definitions for Shoyz Tools

import type { ThemeEngineSettings, UiModes as EngineUiModes } from "../utils/themeEngine";

export type { ThemeEngineSettings } from "../utils/themeEngine";
export type { UiModes } from "../utils/themeEngine";
export type UiModesLike = EngineUiModes;

// Badge types
export interface BadgeInfo {
    key: string;
    label: string;
    src: string;
    kind: "discord" | "vencord" | "other" | "custom";
    category?: string;
    priority?: number;
}

// UI customization types
export interface UITheme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        muted: string;
    };
}

export interface UICustomization {
    enabled: boolean;
    theme: UITheme;
    hideMessageTimestamps: boolean;
    hideUserAvatars: boolean;
    compactMode: boolean;
    customCSS: string;
}

// Moderation types
export interface ModerationRule {
    id: string;
    name: string;
    pattern: string;
    action: "hide" | "warn" | "block";
    enabled: boolean;
}

export interface ModerationStats {
    totalMessages: number;
    hiddenMessages: number;
    warnedUsers: number;
    blockedUsers: number;
}

// Keyboard shortcut types (matched by id against the quick actions handlers)
export interface Shortcut {
    id: string;
    name: string;
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
}

// Main plugin settings
export interface PluginSettings {
    // Badges
    hideAllBadges: boolean;
    hiddenBadges: Record<string, boolean>;
    badgeCatalog: Record<string, BadgeInfo>;
    
    // UI Customization
    uiSettings: UICustomization;
    
    // Moderation
    moderationRules: ModerationRule[];
    moderationEnabled: boolean;
    moderationStats: ModerationStats;
    
    // Quick Actions
    quickActionsEnabled: boolean;
    enabledQuickActions: Record<string, boolean>;
    
    // Performance
    lowPerformanceMode: boolean;
    
    // Keyboard shortcuts
    keyboardShortcuts: Shortcut[];

    // Theme engine
    themeEngine: ThemeEngineSettings;
    uiModes: EngineUiModes;

    // Gaming mode extras
    gamingAutoDnd: boolean;

    // Productivity
    todoTasks: TodoItem[];
    reminders: ReminderItem[];

    // Security
    passcode: string;
    passcodeEnabled: boolean;
}

// Productivity types (ToDoList / Reminder, inspired by BetterDiscord plugins)
export type TodoPriority = "low" | "medium" | "high";

export interface TodoItem {
    id: string;
    text: string;
    priority: TodoPriority;
    done: boolean;
    /** Unix ms deadline, 0 = no deadline */
    deadline: number;
    createdAt: number;
}

export interface ReminderItem {
    id: string;
    text: string;
    /** Unix ms at which the reminder fires */
    dueAt: number;
    /** if set, the reminder re-triggers every N minutes */
    repeatMinutes: number;
    createdAt: number;
}

// Quick action types
export interface QuickAction {
    id: string;
    name: string;
    icon: string;
    action: () => void;
    description: string;
    category: string;
}

// Per-server settings
export interface ServerSettings {
    hideBadges: boolean;
    hiddenBadges: Record<string, boolean>;
}

// Export/Import types
export interface ExportData {
    version: string;
    timestamp: number;
    settings: {
        hideAllBadges: boolean;
        hiddenBadges: Record<string, boolean>;
        badgeCatalog: Record<string, BadgeInfo>;
        uiSettings: UICustomization;
        moderationRules: ModerationRule[];
        moderationStats: ModerationStats;
        enabledQuickActions: Record<string, boolean>;
        keyboardShortcuts: Shortcut[];
        themeEngine?: ThemeEngineSettings;
        uiModes?: EngineUiModes;
        todoTasks?: TodoItem[];
        reminders?: ReminderItem[];
    };
    serverSettings: Record<string, ServerSettings>;
}

// Notification types
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    timestamp: number;
}
