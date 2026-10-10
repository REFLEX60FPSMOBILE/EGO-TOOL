import { React, useState, useCallback } from "@webpack/common";
import type { UICustomization, UITheme } from "../types";
import { PRESET_THEMES } from "../utils/constants";
import { CardStyles, InputStyles, ButtonStyles, SwitchStyles } from "../styles";
import { DiscordColors } from "../styles";

interface UICustomizationProps {
    settings: UICustomization;
    onUpdate: (updates: Partial<UICustomization>) => void;
}

const UICustomizationPanel: React.FC<UICustomizationProps> = ({ settings, onUpdate }) => {
    const [customTheme, setCustomTheme] = useState<Partial<UITheme>>({
        colors: { ...settings.theme?.colors },
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleThemeSelect = useCallback((theme: UITheme) => {
        onUpdate({ theme });
    }, [onUpdate]);

    const handleCustomColorChange = useCallback((color: string, value: string) => {
        setCustomTheme((prev) => ({
            ...prev,
            colors: {
                ...prev.colors,
                [color]: value,
            },
        }));
    }, []);

    const handleApplyCustomTheme = useCallback(() => {
        onUpdate({
            theme: {
                id: "custom",
                name: "Custom",
                colors: customTheme.colors as UITheme["colors"],
            },
        });
    }, [onUpdate, customTheme]);

    const handleToggle = useCallback((key: keyof UICustomization) => {
        onUpdate({ [key]: !settings[key] } as Partial<UICustomization>);
    }, [settings, onUpdate]);

    const handleCSSChange = useCallback((value: string) => {
        onUpdate({ customCSS: value });
    }, [onUpdate]);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>🎨 UI Customization</h3>
                    <p style={CardStyles.description}>
                        Customize Discord's appearance with themes, toggles, and custom CSS
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
                        <h4 style={CardStyles.cardTitle}>Enable UI Customization</h4>
                        <p style={{
                            fontSize: "13px",
                            color: DiscordColors.textMuted,
                            margin: "4px 0 0 0",
                        }}>
                            Turn on to apply custom themes and styles
                        </p>
                    </div>
                    <div style={SwitchStyles.container}>
                        <label style={SwitchStyles.label}>
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={() => handleToggle("enabled")}
                                style={SwitchStyles.input}
                            />
                            <span style={SwitchStyles.slider} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Preset Themes */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Preset Themes</h4>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Choose from pre-defined color schemes
                </p>
                <div style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                }}>
                    {PRESET_THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeSelect(theme)}
                            style={{
                                padding: "8px 12px",
                                backgroundColor: settings.theme?.id === theme.id
                                    ? theme.colors.primary
                                    : DiscordColors.backgroundSecondary,
                                border: `2px solid ${theme.colors.primary}`,
                                borderRadius: "6px",
                                color: settings.theme?.id === theme.id ? "white" : DiscordColors.textNormal,
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {theme.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Theme */}
            {showAdvanced && (
                <div style={CardStyles.card}>
                    <h4 style={CardStyles.cardTitle}>Custom Theme</h4>
                    <p style={{
                        fontSize: "13px",
                        color: DiscordColors.textMuted,
                        margin: "0 0 12px 0",
                    }}>
                        Create your own color scheme
                    </p>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: "12px",
                    }}>
                        {Object.entries(customTheme.colors || {}).map(([color, value]) => (
                            <div key={color}>
                                <label style={{
                                    display: "block",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: DiscordColors.textNormal,
                                    marginBottom: "4px",
                                    textTransform: "capitalize",
                                }}>
                                    {color}
                                </label>
                                <input
                                    type="color"
                                    value={value}
                                    onChange={(e) => handleCustomColorChange(color, e.target.value)}
                                    style={{
                                        width: "100%",
                                        height: "36px",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleApplyCustomTheme}
                        style={{
                            ...ButtonStyles.primary,
                            marginTop: "12px",
                        }}
                    >
                        Apply Custom Theme
                    </button>
                </div>
            )}

            {/* Toggle Options */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Display Options</h4>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Toggle various UI elements
                </p>
                
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}>
                        <div>
                            <label style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                color: DiscordColors.textNormal,
                                cursor: "pointer",
                            }}>
                                Hide Message Timestamps
                            </label>
                            <p style={{
                                fontSize: "12px",
                                color: DiscordColors.textMuted,
                                margin: "2px 0 0 0",
                            }}>
                                Remove timestamps from messages
                            </p>
                        </div>
                        <div style={SwitchStyles.container}>
                            <label style={SwitchStyles.label}>
                                <input
                                    type="checkbox"
                                    checked={settings.hideMessageTimestamps}
                                    onChange={() => handleToggle("hideMessageTimestamps")}
                                    style={SwitchStyles.input}
                                />
                                <span style={SwitchStyles.slider} />
                            </label>
                        </div>
                    </div>

                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}>
                        <div>
                            <label style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                color: DiscordColors.textNormal,
                                cursor: "pointer",
                            }}>
                                Hide User Avatars
                            </label>
                            <p style={{
                                fontSize: "12px",
                                color: DiscordColors.textMuted,
                                margin: "2px 0 0 0",
                            }}>
                                Remove avatars from messages
                            </p>
                        </div>
                        <div style={SwitchStyles.container}>
                            <label style={SwitchStyles.label}>
                                <input
                                    type="checkbox"
                                    checked={settings.hideUserAvatars}
                                    onChange={() => handleToggle("hideUserAvatars")}
                                    style={SwitchStyles.input}
                                />
                                <span style={SwitchStyles.slider} />
                            </label>
                        </div>
                    </div>

                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}>
                        <div>
                            <label style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                color: DiscordColors.textNormal,
                                cursor: "pointer",
                            }}>
                                Compact Mode
                            </label>
                            <p style={{
                                fontSize: "12px",
                                color: DiscordColors.textMuted,
                                margin: "2px 0 0 0",
                            }}>
                                Reduce message spacing
                            </p>
                        </div>
                        <div style={SwitchStyles.container}>
                            <label style={SwitchStyles.label}>
                                <input
                                    type="checkbox"
                                    checked={settings.compactMode}
                                    onChange={() => handleToggle("compactMode")}
                                    style={SwitchStyles.input}
                                />
                                <span style={SwitchStyles.slider} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS */}
            <div style={CardStyles.card}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                }}>
                    <h4 style={CardStyles.cardTitle}>Custom CSS</h4>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={ButtonStyles.ghost}
                    >
                        {showAdvanced ? "Hide Advanced" : "Show Advanced"}
                    </button>
                </div>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Add custom CSS to modify Discord's appearance. Use F12 to inspect elements.
                </p>
                <textarea
                    value={settings.customCSS}
                    onChange={(e) => handleCSSChange(e.target.value)}
                    placeholder={`Example:
.message { background: rgba(255, 0, 0, 0.1) !important; }

[class*="container"] { border-radius: 8px !important; }`}
                    style={{
                        ...InputStyles.textarea,
                        minHeight: "120px",
                        fontFamily: "monospace",
                    }}
                />
                <button
                    onClick={() => handleCSSChange("")}
                    style={{
                        ...ButtonStyles.ghost,
                        marginTop: "8px",
                    }}
                >
                    Clear CSS
                </button>
            </div>

            {/* Reset */}
            <div style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
            }}>
                <button
                    onClick={() => onUpdate({
                        enabled: false,
                        theme: PRESET_THEMES[0],
                        hideMessageTimestamps: false,
                        hideUserAvatars: false,
                        compactMode: false,
                        customCSS: "",
                    })}
                    style={ButtonStyles.danger}
                >
                    Reset All UI Settings
                </button>
            </div>
        </div>
    );
};

export default UICustomizationPanel;
