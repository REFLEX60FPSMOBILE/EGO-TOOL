import { React, useState, useCallback, useMemo } from "@webpack/common";
import { TabStyles } from "../styles";
import { DiscordColors } from "../styles";
import ProfilePreview from "./ProfilePreview";
import BadgeSelection from "./BadgeSelection";
import UICustomizationPanel from "./UICustomization";
import ModerationTools from "./ModerationTools";
import QuickActions from "./QuickActions";
import ServerSettings from "./ServerSettings";
import ExportImport from "./ExportImport";
import ThemeEnginePanel from "./ThemeEnginePanel";
import ProductivityPanel from "./ProductivityPanel";
import type { 
    BadgeInfo, 
    UICustomization, 
    ModerationRule, 
    ModerationStats, 
    QuickAction, 
    ServerSettings as ServerSettingsConfig,
    ExportData,
    UiModes,
    TodoItem,
    TodoPriority,
    ReminderItem
} from "../types";
import type { ThemeEngineSettings } from "../utils/themeEngine";

interface SettingsPanelProps {
    // Badges
    badgeCatalog: Record<string, BadgeInfo>;
    hiddenBadges: Record<string, boolean>;
    hideAllBadges: boolean;
    onBadgeToggle: (key: string) => void;
    onBadgeToggleAll: (value: boolean) => void;
    onScanBadges: () => void;
    onResetBadges: () => void;
    
    // UI Customization
    uiSettings: UICustomization;
    onUISettingsUpdate: (updates: Partial<UICustomization>) => void;
    
    // Moderation
    moderationRules: ModerationRule[];
    moderationStats: ModerationStats;
    moderationEnabled: boolean;
    onModerationToggle: () => void;
    onAddModerationRule: (rule: ModerationRule) => void;
    onUpdateModerationRule: (id: string, updates: Partial<ModerationRule>) => void;
    onRemoveModerationRule: (id: string) => void;
    onResetModerationStats: () => void;
    
    // Quick Actions
    quickActions: QuickAction[];
    enabledQuickActions: Record<string, boolean>;
    onQuickActionToggle: (id: string) => void;
    onQuickActionExecute: (id: string) => void;
    
    // Server Settings
    serverSettings: Record<string, ServerSettingsConfig>;
    currentServerId: string | null;
    onUpdateServerSettings: (serverId: string, updates: Partial<ServerSettingsConfig>) => void;
    onResetServer: (serverId: string) => void;

    // Theme Engine
    themeEngine: ThemeEngineSettings;
    uiModes: UiModes;
    onThemeEngineUpdate: (updates: Partial<ThemeEngineSettings>) => void;
    onUiModesUpdate: (updates: Partial<UiModes>) => void;

    // Gaming
    gamingAutoDnd: boolean;
    onGamingAutoDndUpdate: (value: boolean) => void;

    // Productivity
    todoTasks: TodoItem[];
    reminders: ReminderItem[];
    onAddTodo: (text: string, priority: TodoPriority, deadline: number) => TodoItem;
    onToggleTodo: (id: string) => void;
    onRemoveTodo: (id: string) => void;
    onClearDoneTodos: () => void;
    onAddReminder: (text: string, dueAt: number, repeatMinutes: number) => ReminderItem;
    onRemoveReminder: (id: string) => void;

    // Security
    passcodeEnabled: boolean;
    onSetPasscode: (pin: string | null) => void;
    onSetPasscodeEnabled: (value: boolean) => void;
    
    // Export/Import
    onExport: () => ExportData;
    onImport: (data: ExportData) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    // Badges
    badgeCatalog,
    hiddenBadges,
    hideAllBadges,
    onBadgeToggle,
    onBadgeToggleAll,
    onScanBadges,
    onResetBadges,
    
    // UI
    uiSettings,
    onUISettingsUpdate,
    
    // Moderation
    moderationRules,
    moderationStats,
    moderationEnabled,
    onModerationToggle,
    onAddModerationRule,
    onUpdateModerationRule,
    onRemoveModerationRule,
    onResetModerationStats,
    
    // Quick Actions
    quickActions,
    enabledQuickActions,
    onQuickActionToggle,
    onQuickActionExecute,
    
    // Server Settings
    serverSettings,
    currentServerId,
    onUpdateServerSettings,
    onResetServer,
    
    // Theme Engine
    themeEngine,
    uiModes,
    onThemeEngineUpdate,
    onUiModesUpdate,
    
    // Gaming
    gamingAutoDnd,
    onGamingAutoDndUpdate,
    
    // Productivity
    todoTasks,
    reminders,
    onAddTodo,
    onToggleTodo,
    onRemoveTodo,
    onClearDoneTodos,
    onAddReminder,
    onRemoveReminder,
    
    // Security
    passcodeEnabled,
    onSetPasscode,
    onSetPasscodeEnabled,
    
    // Export/Import
    onExport,
    onImport,
}) => {
    const [activeTab, setActiveTab] = useState("profile");

    const tabs = useMemo(() => [
        { id: "profile", label: "My Profile", icon: "👤" },
        { id: "badges", label: "Badge List", icon: "🏳️" },
        { id: "themes", label: "Themes & Modes", icon: "🎨" },
        { id: "servers", label: "Per Server", icon: "🏢" },
        { id: "productivity", label: "Productivité", icon: "✅" },
        { id: "ui", label: "UI Options", icon: "🧩" },
        { id: "moderation", label: "Moderation", icon: "🛡️" },
        { id: "actions", label: "Quick Actions", icon: "⚡" },
        { id: "export", label: "Export/Import", icon: "📦" },
    ], []);

    const renderContent = useCallback(() => {
        switch (activeTab) {
            case "profile":
                return (
                    <ProfilePreview
                        catalog={badgeCatalog}
                        hidden={hiddenBadges}
                        onToggle={onBadgeToggle}
                        onScan={onScanBadges}
                    />
                );
            case "badges":
                return (
                    <BadgeSelection
                        catalog={badgeCatalog}
                        hidden={hiddenBadges}
                        onToggle={onBadgeToggle}
                        onToggleAll={onBadgeToggleAll}
                        onScan={onScanBadges}
                    />
                );
            case "themes":
                return (
                    <ThemeEnginePanel
                        themeEngine={themeEngine}
                        uiModes={uiModes}
                        gamingAutoDnd={gamingAutoDnd}
                        onThemeEngineUpdate={onThemeEngineUpdate}
                        onUiModesUpdate={onUiModesUpdate}
                        onGamingAutoDndUpdate={onGamingAutoDndUpdate}
                    />
                );
            
            case "productivity":
                return (
                    <ProductivityPanel
                        todoTasks={todoTasks}
                        reminders={reminders}
                        passcodeEnabled={passcodeEnabled}
                        onAddTodo={onAddTodo}
                        onToggleTodo={onToggleTodo}
                        onRemoveTodo={onRemoveTodo}
                        onClearDoneTodos={onClearDoneTodos}
                        onAddReminder={onAddReminder}
                        onRemoveReminder={onRemoveReminder}
                        onSetPasscode={onSetPasscode}
                        onSetPasscodeEnabled={onSetPasscodeEnabled}
                    />
                );
            
            case "servers":
                return (
                    <ServerSettings
                        serverSettings={serverSettings}
                        currentServerId={currentServerId}
                        onUpdateServerSettings={onUpdateServerSettings}
                        onResetServer={onResetServer}
                    />
                );
            
            case "ui":
                return (
                    <UICustomizationPanel
                        settings={uiSettings}
                        onUpdate={onUISettingsUpdate}
                    />
                );
            
            case "moderation":
                return (
                    <ModerationTools
                        rules={moderationRules}
                        stats={moderationStats}
                        enabled={moderationEnabled}
                        onToggle={onModerationToggle}
                        onAddRule={onAddModerationRule}
                        onUpdateRule={onUpdateModerationRule}
                        onRemoveRule={onRemoveModerationRule}
                        onResetStats={onResetModerationStats}
                    />
                );
            
            case "actions":
                return (
                    <QuickActions
                        actions={quickActions}
                        enabledActions={enabledQuickActions}
                        onToggle={onQuickActionToggle}
                        onExecute={onQuickActionExecute}
                    />
                );
            
            case "export":
                return (
                    <ExportImport
                        onExport={onExport}
                        onImport={onImport}
                    />
                );
            
            default:
                return null;
        }
    }, [
        activeTab,
        badgeCatalog,
        hiddenBadges,
        hideAllBadges,
        onBadgeToggle,
        onBadgeToggleAll,
        onScanBadges,
        onResetBadges,
        uiSettings,
        onUISettingsUpdate,
        moderationRules,
        moderationStats,
        moderationEnabled,
        onModerationToggle,
        onAddModerationRule,
        onUpdateModerationRule,
        onRemoveModerationRule,
        onResetModerationStats,
        quickActions,
        enabledQuickActions,
        onQuickActionToggle,
        onQuickActionExecute,
        serverSettings,
        currentServerId,
        onUpdateServerSettings,
        onResetServer,
        onExport,
        onImport,
        themeEngine,
        uiModes,
        onThemeEngineUpdate,
        onUiModesUpdate,
        gamingAutoDnd,
        onGamingAutoDndUpdate,
        todoTasks,
        reminders,
        onAddTodo,
        onToggleTodo,
        onRemoveTodo,
        onClearDoneTodos,
        onAddReminder,
        onRemoveReminder,
        passcodeEnabled,
        onSetPasscode,
        onSetPasscodeEnabled,
    ]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        }}>
            {/* Plugin header */}
            <div style={{
                padding: "16px",
                backgroundColor: DiscordColors.backgroundPrimary,
                borderRadius: "8px",
                border: `1px solid ${DiscordColors.border}`,
            }}>
                <h2 style={{
                    color: DiscordColors.textNormal,
                    fontSize: "20px",
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: "4px",
                }}>
                    EGO TOOL
                </h2>
                <p style={{
                    color: DiscordColors.textMuted,
                    fontSize: "14px",
                    margin: 0,
                }}>
                    A modular Discord tool suite — theme engine, productivity and moderation
                </p>
            </div>

            {/* Tabs */}
            <div style={TabStyles.container}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        style={{
                            ...TabStyles.tab,
                            ...(activeTab === tab.id ? TabStyles.tabActive : {}),
                        }}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span style={{ marginRight: "4px" }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={TabStyles.contentActive}>
                {renderContent()}
            </div>

            {/* Footer */}
            <div style={{
                padding: "12px 16px",
                backgroundColor: DiscordColors.backgroundTertiary,
                borderRadius: "8px",
                fontSize: "12px",
                color: DiscordColors.textMuted,
                textAlign: "center",
            }}>
                EGO TOOL v1.0.0 - A Vencord plugin by shoyzontop
            </div>
        </div>
    );
};

export default SettingsPanel;
