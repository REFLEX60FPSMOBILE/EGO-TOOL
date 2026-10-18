import { React, useCallback, useMemo } from "@webpack/common";
import { QuickAction } from "../types";
import { CardStyles, ButtonStyles, ListStyles } from "../styles";
import { DiscordColors } from "../styles";

interface QuickActionsProps {
    actions: QuickAction[];
    enabledActions: Record<string, boolean>;
    onToggle: (id: string) => void;
    onExecute: (id: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
    actions,
    enabledActions,
    onToggle,
    onExecute,
}) => {
    const categories = useMemo(() => {
        const map: Record<string, QuickAction[]> = {};
        for (const action of actions) {
            if (!map[action.category]) {
                map[action.category] = [];
            }
            map[action.category].push(action);
        }
        return map;
    }, [actions]);

    const executeAction = useCallback((id: string) => {
        onExecute(id);
    }, [onExecute]);

    const toggleAction = useCallback((id: string) => {
        onToggle(id);
    }, [onToggle]);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>⚡ Quick Actions</h3>
                    <p style={CardStyles.description}>
                        One-click access to useful features
                    </p>
                </div>
            </div>

            <div style={ListStyles.container}>
                {Object.entries(categories).map(([category, categoryActions]) => (
                    <div key={category} style={{ marginBottom: "16px" }}>
                        <h4 style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: DiscordColors.textNormal,
                            margin: "0 0 8px 0",
                            paddingBottom: "4px",
                            borderBottom: `1px solid ${DiscordColors.border}`,
                        }}>
                            {category}
                        </h4>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: "8px",
                        }}>
                            {categoryActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => executeAction(action.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "12px",
                                        backgroundColor: DiscordColors.backgroundSecondary,
                                        border: enabledActions[action.id]
                                            ? `2px solid ${DiscordColors.success}`
                                            : `1px solid ${DiscordColors.border}`,
                                        borderRadius: "6px",
                                        color: DiscordColors.textNormal,
                                        cursor: "pointer",
                                        fontSize: "13px",                                        textAlign: "left",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <span style={{ fontSize: "16px" }}>{action.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: "600", fontSize: "13px" }}>
                                            {action.name}
                                        </div>
                                        <div style={{
                                            fontSize: "11px",
                                            color: DiscordColors.textMuted,
                                            marginTop: "2px",
                                        }}>
                                            {action.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Keyboard Shortcuts Help */}
            <div style={{
                ...CardStyles.card,
                marginTop: "16px",
            }}>
                <h4 style={CardStyles.cardTitle}>Keyboard Shortcuts</h4>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Use these keyboard shortcuts for quick access
                </p>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "8px",
                }}>
                    <div style={{
                        padding: "8px",
                        backgroundColor: DiscordColors.backgroundSecondary,
                        borderRadius: "4px",
                        fontSize: "12px",
                    }}>
                        <div style={{ fontWeight: "600", color: DiscordColors.textNormal }}>
                            Ctrl + B
                        </div>
                        <div style={{ color: DiscordColors.textMuted }}>
                            Toggle Badges
                        </div>
                    </div>
                    <div style={{
                        padding: "8px",
                        backgroundColor: DiscordColors.backgroundSecondary,
                        borderRadius: "4px",
                        fontSize: "12px",
                    }}>
                        <div style={{ fontWeight: "600", color: DiscordColors.textNormal }}>
                            Ctrl + U
                        </div>
                        <div style={{ color: DiscordColors.textMuted }}>
                            Toggle UI
                        </div>
                    </div>
                    <div style={{
                        padding: "8px",
                        backgroundColor: DiscordColors.backgroundSecondary,
                        borderRadius: "4px",
                        fontSize: "12px",
                    }}>
                        <div style={{ fontWeight: "600", color: DiscordColors.textNormal }}>
                            Ctrl + Shift + S
                        </div>
                        <div style={{ color: DiscordColors.textMuted }}>
                            Scan Badges
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickActions;
