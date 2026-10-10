import { React, useState, useCallback, useMemo } from "@webpack/common";
import type { ModerationRule, ModerationStats } from "../types";
import { MODERATION_ACTIONS } from "../utils/constants";
import { CardStyles, InputStyles, ButtonStyles, ListStyles, SwitchStyles } from "../styles";
import { DiscordColors } from "../styles";
import { deepClone, generateId } from "../utils/helpers";

interface ModerationToolsProps {
    rules: ModerationRule[];
    stats: ModerationStats;
    enabled: boolean;
    onToggle: () => void;
    onAddRule: (rule: ModerationRule) => void;
    onUpdateRule: (id: string, updates: Partial<ModerationRule>) => void;
    onRemoveRule: (id: string) => void;
    onResetStats: () => void;
}

const ACTION_LABELS = {
    [MODERATION_ACTIONS.HIDE]: "Hide",
    [MODERATION_ACTIONS.WARN]: "Warn",
    [MODERATION_ACTIONS.BLOCK]: "Block",
};

const ACTION_COLORS = {
    [MODERATION_ACTIONS.HIDE]: DiscordColors.danger,
    [MODERATION_ACTIONS.WARN]: DiscordColors.warning,
    [MODERATION_ACTIONS.BLOCK]: DiscordColors.danger,
};

const ACTION_ICONS = {
    [MODERATION_ACTIONS.HIDE]: "👁️",
    [MODERATION_ACTIONS.WARN]: "⚠️",
    [MODERATION_ACTIONS.BLOCK]: "🚫",
};

const ACTION_OPTIONS = [
    { value: MODERATION_ACTIONS.HIDE, label: "Hide Message" },
    { value: MODERATION_ACTIONS.WARN, label: "Warn User" },
    { value: MODERATION_ACTIONS.BLOCK, label: "Block User" },
];

const ModerationTools: React.FC<ModerationToolsProps> = ({
    rules,
    stats,
    enabled,
    onToggle,
    onAddRule,
    onUpdateRule,
    onRemoveRule,
    onResetStats,
}) => {
    const [newRule, setNewRule] = useState<Omit<ModerationRule, "id" | "enabled">>({
        name: "",
        pattern: "",
        action: MODERATION_ACTIONS.HIDE,
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRule, setEditRule] = useState<Partial<ModerationRule>>({});

    const handleAddRule = useCallback(() => {
        if (!newRule.name.trim() || !newRule.pattern.trim()) return;
        
        onAddRule({
            id: generateId(),
            name: newRule.name.trim(),
            pattern: newRule.pattern.trim(),
            action: newRule.action,
            enabled: true,
        });
        
        setNewRule({
            name: "",
            pattern: "",
            action: MODERATION_ACTIONS.HIDE,
        });
    }, [newRule, onAddRule]);

    const handleStartEdit = useCallback((rule: ModerationRule) => {
        setEditingId(rule.id);
        setEditRule({
            name: rule.name,
            pattern: rule.pattern,
            action: rule.action,
            enabled: rule.enabled,
        });
    }, []);

    const handleSaveEdit = useCallback(() => {
        if (!editingId || !editRule.name?.trim() || !editRule.pattern?.trim()) return;
        
        onUpdateRule(editingId, {
            name: editRule.name.trim(),
            pattern: editRule.pattern.trim(),
            action: editRule.action,
            enabled: editRule.enabled,
        });
        
        setEditingId(null);
        setEditRule({});
    }, [editingId, editRule, onUpdateRule]);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setEditRule({});
    }, []);

    const enabledRules = useMemo(() => rules.filter(r => r.enabled), [rules]);
    const disabledRules = useMemo(() => rules.filter(r => !r.enabled), [rules]);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>🛡️ Moderation Tools</h3>
                    <p style={CardStyles.description}>
                        Automatically filter and moderate messages using regex patterns
                    </p>
                </div>
            </div>

            {/* Enable/Disable */}
            <div style={{
                ...CardStyles.card,
                marginBottom: "16px",
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <div>
                        <h4 style={CardStyles.cardTitle}>Enable Auto-Moderation</h4>
                        <p style={{
                            fontSize: "13px",
                            color: DiscordColors.textMuted,
                            margin: "4px 0 0 0",
                        }}>
                            Turn on to automatically apply rules to messages
                        </p>
                    </div>
                    <div style={SwitchStyles.container}>
                        <label style={SwitchStyles.label}>
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={onToggle}
                                style={SwitchStyles.input}
                            />
                            <span style={SwitchStyles.slider} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Statistics</h4>
                <div style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: DiscordColors.textNormal }}>
                            {stats.totalMessages}
                        </div>
                        <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase" }}>
                            Total Messages
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: DiscordColors.danger }}>
                            {stats.hiddenMessages}
                        </div>
                        <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase" }}>
                            Hidden
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: DiscordColors.warning }}>
                            {stats.warnedUsers}
                        </div>
                        <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase" }}>
                            Warned
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: DiscordColors.danger }}>
                            {stats.blockedUsers}
                        </div>
                        <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase" }}>
                            Blocked
                        </div>
                    </div>
                </div>
                <button
                    onClick={onResetStats}
                    style={{
                        ...ButtonStyles.ghost,
                        marginTop: "12px",
                    }}
                >
                    Reset Statistics
                </button>
            </div>

            {/* Add Rule */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Add New Rule</h4>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Create a regex pattern to match against messages
                </p>
                
                <div style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                }}>
                    <input
                        style={{ ...InputStyles.text, flex: 1, minWidth: "150px" }}
                        placeholder="Rule name..."
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    />
                    <input
                        style={{ ...InputStyles.text, flex: 1, minWidth: "200px" }}
                        placeholder="Regex pattern..."
                        value={newRule.pattern}
                        onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    />
                    <select
                        style={InputStyles.select}
                        value={newRule.action}
                        onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                    >
                        {ACTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddRule}
                        disabled={!newRule.name.trim() || !newRule.pattern.trim()}
                        style={ButtonStyles.primary}
                    >
                        Add Rule
                    </button>
                </div>

                <div style={{
                    padding: "8px",
                    backgroundColor: DiscordColors.backgroundTertiary,
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: DiscordColors.textMuted,
                }}>
                    <div style={{ marginBottom: "4px" }}>
                        <strong>Regex Examples:</strong>
                    </div>
                    <ul style={{ margin: "0", paddingLeft: "20px", lineHeight: "1.5" }}>
                        <li><code>(http|https)://(bit\.ly|tinyurl)</code> - Match shortened URLs</li>
                        <li><code>(discord\.gg|discord\.com/invite)</code> - Match Discord invites</li>
                        <li><code>(fuck|shit|bitch)</code> - Match profanity</li>
                        <li><code>@everyone|@here</code> - Match mentions</li>
                    </ul>
                    <div style={{ marginTop: "8px" }}>
                        Test your regex on <a href="https://regex101.com/" target="_blank" style={{ color: DiscordColors.link }}>Regex101</a>
                    </div>
                </div>
            </div>

            {/* Edit Rule */}
            {editingId && (
                <div style={CardStyles.card}>
                    <h4 style={CardStyles.cardTitle}>Edit Rule</h4>
                    <div style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "12px",
                        flexWrap: "wrap",
                    }}>
                        <input
                            style={{ ...InputStyles.text, flex: 1, minWidth: "150px" }}
                            placeholder="Rule name..."
                            value={editRule.name || ""}
                            onChange={(e) => setEditRule({ ...editRule, name: e.target.value })}
                        />
                        <input
                            style={{ ...InputStyles.text, flex: 1, minWidth: "200px" }}
                            placeholder="Regex pattern..."
                            value={editRule.pattern || ""}
                            onChange={(e) => setEditRule({ ...editRule, pattern: e.target.value })}
                        />
                        <select
                            style={InputStyles.select}
                            value={editRule.action || newRule.action}
                            onChange={(e) => setEditRule({ ...editRule, action: e.target.value as any })}
                        >
                            {ACTION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div style={SwitchStyles.container}>
                            <label style={SwitchStyles.label}>
                                <input
                                    type="checkbox"
                                    checked={editRule.enabled !== undefined ? editRule.enabled : true}
                                    onChange={(e) => setEditRule({ ...editRule, enabled: e.target.checked })}
                                    style={SwitchStyles.input}
                                />
                                <span style={SwitchStyles.slider} />
                            </label>
                        </div>
                        <button
                            onClick={handleSaveEdit}
                            disabled={!editRule.name?.trim() || !editRule.pattern?.trim()}
                            style={ButtonStyles.success}
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            style={ButtonStyles.ghost}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Rules List */}
            <div style={CardStyles.card}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                }}>
                    <h4 style={CardStyles.cardTitle}>Rules ({rules.length})</h4>
                    <div style={{
                        display: "flex",
                        gap: "8px",
                    }}>
                        <span style={{
                            padding: "4px 8px",
                            backgroundColor: DiscordColors.success,
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "500",
                        }}>
                            {enabledRules.length} Active
                        </span>
                        <span style={{
                            padding: "4px 8px",
                            backgroundColor: DiscordColors.textMuted,
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "500",
                        }}>
                            {disabledRules.length} Disabled
                        </span>
                    </div>
                </div>

                {rules.length > 0 ? (
                    <div style={ListStyles.items}>
                        {rules.map((rule) => (
                            <div
                                key={rule.id}
                                style={{
                                    ...ListStyles.item,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <div style={SwitchStyles.container}>
                                    <label style={SwitchStyles.label}>
                                        <input
                                            type="checkbox"
                                            checked={rule.enabled}
                                            onChange={(e) => onUpdateRule(rule.id, { enabled: e.target.checked })}
                                            style={SwitchStyles.input}
                                        />
                                        <span style={SwitchStyles.slider} />
                                    </label>
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                    }}>
                                        <span>{ACTION_ICONS[rule.action]}</span>
                                        <span>{rule.name}</span>
                                    </div>
                                    <div style={{
                                        fontSize: "12px",
                                        color: DiscordColors.textMuted,
                                        marginTop: "2px",
                                        wordBreak: "break-all",
                                    }}>
                                        {rule.pattern}
                                    </div>
                                </div>

                                <div style={{
                                    display: "flex",
                                    gap: "4px",
                                }}>
                                    <button
                                        onClick={() => handleStartEdit(rule)}
                                        style={{
                                            padding: "4px 8px",
                                            backgroundColor: DiscordColors.buttonSecondary,
                                            color: DiscordColors.textNormal,
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "11px",
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onRemoveRule(rule.id)}
                                        style={{
                                            padding: "4px 8px",
                                            backgroundColor: DiscordColors.danger,
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "11px",
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: "16px",
                        textAlign: "center",
                        color: DiscordColors.textMuted,
                    }}>
                        No rules yet. Add a rule above to get started.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModerationTools;
