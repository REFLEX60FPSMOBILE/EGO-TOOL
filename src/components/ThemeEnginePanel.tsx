import { React, useCallback } from "@webpack/common";
import { CardStyles, ButtonStyles, SwitchStyles, InputStyles, DiscordColors } from "../styles";
import { THEME_PRESETS } from "../utils/themeEngine";
import type { UiModes } from "../types";
import type { ThemeEngineSettings } from "../utils/themeEngine";

interface ThemeEnginePanelProps {
    themeEngine: ThemeEngineSettings;
    uiModes: UiModes;
    gamingAutoDnd: boolean;
    onThemeEngineUpdate: (updates: Partial<ThemeEngineSettings>) => void;
    onUiModesUpdate: (updates: Partial<UiModes>) => void;
    onGamingAutoDndUpdate: (value: boolean) => void;
}

const MODES: { key: keyof UiModes; label: string; description: string; icon: string }[] = [
    {
        key: "focus",
        label: "Mode Focus",
        description: "Masque la liste des membres et le panneau d'activité, désactive les animations. Idéal pour lire ou travailler.",
        icon: "🎯",
    },
    {
        key: "stream",
        label: "Mode Stream",
        description: "Masque les éléments sensibles à l'écran (badge de compte, compteurs de notifications, badges texte).",
        icon: "🎥",
    },
    {
        key: "gaming",
        label: "Mode Gaming",
        description: "Compact, sombre, notifications réduites. Combine avec l'Auto-DND ci-dessous.",
        icon: "🎮",
    },
    {
        key: "staff",
        label: "Mode Staff",
        description: "Densité info : horodatages privilégiés, mise en page dense. Pour permissions/audit log, active aussi PermissionsViewer.",
        icon: "🛡️",
    },
];

const SLIDERS: { key: keyof ThemeEngineSettings; label: string; description: string; min: number; max: number }[] = [
    { key: "wallpaperOpacity", label: "Opacité des surfaces", description: "Plus c'est bas, plus le wallpaper transparaît", min: 5, max: 100 },
    { key: "blur", label: "Flou (Glass)", description: "Rayon de flou des panneaux translucides", min: 0, max: 30 },
    { key: "radius", label: "Arrondi global", description: "Rayon des coins des surfaces", min: 0, max: 24 },
];

const ThemeEnginePanel: React.FC<ThemeEnginePanelProps> = ({
    themeEngine,
    uiModes,
    gamingAutoDnd,
    onThemeEngineUpdate,
    onUiModesUpdate,
    onGamingAutoDndUpdate,
}) => {
    const handlePreset = useCallback((id: string) => {
        onThemeEngineUpdate({ preset: id });
    }, [onThemeEngineUpdate]);

    const handleSlider = useCallback((key: keyof ThemeEngineSettings, value: number) => {
        onThemeEngineUpdate({ [key]: value } as Partial<ThemeEngineSettings>);
    }, [onThemeEngineUpdate]);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>🎨 Themes & Modes</h3>
                    <p style={CardStyles.description}>
                        Moteur de thèmes centralisé : presets, wallpaper, glass/blur, modes contextuels
                    </p>
                </div>
            </div>

            {/* Presets */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Presets</h4>
                <p style={{ fontSize: "13px", color: DiscordColors.textMuted, margin: "0 0 12px 0" }}>
                    Dark · OLED · Frost (glass) · Neon (cyberpunk) · Material · Terminal · Light
                </p>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "8px",
                }}>
                    {THEME_PRESETS.map((preset) => {
                        const active = themeEngine.preset === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => handlePreset(preset.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px",
                                    backgroundColor: active ? DiscordColors.buttonSecondary : DiscordColors.backgroundSecondary,
                                    border: active ? `2px solid ${DiscordColors.primary}` : `1px solid ${DiscordColors.border}`,
                                    borderRadius: "8px",
                                    color: DiscordColors.textNormal,
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                <span style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "6px",
                                    flexShrink: 0,
                                    border: `1px solid ${DiscordColors.border}`,
                                    background: `linear-gradient(135deg, ${preset.chip}, ${active ? DiscordColors.primary : "transparent"})`,
                                }} />
                                <span style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{preset.name}</div>
                                    <div style={{ fontSize: "10px", color: DiscordColors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {preset.description}
                                    </div>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sliders */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Réglages du thème</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
                    {SLIDERS.map((slider) => {
                        const value = Number(themeEngine[slider.key]) || slider.min;
                        return (
                            <div key={String(slider.key)}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: 500, color: DiscordColors.textNormal }}>
                                        {slider.label}
                                    </label>
                                    <span style={{ fontSize: "12px", color: DiscordColors.textMuted }}>{value}</span>
                                </div>
                                <input
                                    type="range"
                                    min={slider.min}
                                    max={slider.max}
                                    value={value}
                                    onChange={(e) => handleSlider(slider.key, Number(e.target.value))}
                                    style={{ width: "100%", accentColor: DiscordColors.primary }}
                                />
                                <div style={{ fontSize: "11px", color: DiscordColors.textMuted }}>{slider.description}</div>
                            </div>
                        );
                    })}

                    {/* Accent override */}
                    <div>
                        <label style={{ fontSize: "13px", fontWeight: 500, color: DiscordColors.textNormal }}>
                            Accent personnalisé
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            <input
                                type="color"
                                value={themeEngine.accent || "#5865f2"}
                                onChange={(e) => onThemeEngineUpdate({ accent: e.target.value })}
                                style={{ width: "42px", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                            />
                            <input
                                style={{ ...InputStyles.text, flex: 1 }}
                                placeholder="Laisser vide pour l'accent du preset"
                                value={themeEngine.accent}
                                onChange={(e) => onThemeEngineUpdate({ accent: e.target.value })}
                            />
                            <button
                                onClick={() => onThemeEngineUpdate({ accent: "" })}
                                style={ButtonStyles.ghost}
                            >
                                Preset
                            </button>
                        </div>
                    </div>

                    {/* Wallpaper */}
                    <div>
                        <label style={{ fontSize: "13px", fontWeight: 500, color: DiscordColors.textNormal }}>
                            Wallpaper (URL d’image)
                        </label>
                        <input
                            style={{ ...InputStyles.text, width: "100%", marginTop: "4px" }}
                            placeholder="https://example.com/wallpaper.jpg"
                            value={themeEngine.wallpaperUrl}
                            onChange={(e) => onThemeEngineUpdate({ wallpaperUrl: e.target.value })}
                        />
                        <div style={{ fontSize: "11px", color: DiscordColors.textMuted, marginTop: "2px" }}>
                            Remplie le fond derrière les surfaces rendues translucides par l’opacité.
                        </div>
                    </div>
                </div>
            </div>

            {/* Engine toggles */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Moteur</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                        {
                            key: "glass" as keyof ThemeEngineSettings,
                            title: "Mode Glass / Aero",
                            description: "Panneaux actifs translucides avec flou (sidebar, popouts) — pas toute la fenêtre",
                        },
                        {
                            key: "performanceMode" as keyof ThemeEngineSettings,
                            title: "Mode Performance",
                            description: "Désactive blur, animations et transitions si le GPU/FPS souffre",
                        },
                    ].map((toggle) => (
                        <div key={String(toggle.key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 500, color: DiscordColors.textNormal }}>{toggle.title}</div>
                                <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>{toggle.description}</div>
                            </div>
                            <div style={SwitchStyles.container}>
                                <label style={SwitchStyles.label}>
                                    <input
                                        type="checkbox"
                                        checked={!!themeEngine[toggle.key]}
                                        onChange={(e) => onThemeEngineUpdate({ [toggle.key]: e.target.checked } as Partial<ThemeEngineSettings>)}
                                        style={SwitchStyles.input}
                                    />
                                    <span style={SwitchStyles.slider} />
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contextual modes */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Modes contextuels</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {MODES.map((mode) => (
                        <div key={mode.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 500, color: DiscordColors.textNormal }}>
                                    {mode.icon} {mode.label}
                                </div>
                                <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>{mode.description}</div>
                            </div>
                            <div style={SwitchStyles.container}>
                                <label style={SwitchStyles.label}>
                                    <input
                                        type="checkbox"
                                        checked={!!uiModes[mode.key]}
                                        onChange={(e) => onUiModesUpdate({ [mode.key]: e.target.checked } as Partial<UiModes>)}
                                        style={SwitchStyles.input}
                                    />
                                    <span style={SwitchStyles.slider} />
                                </label>
                            </div>
                        </div>
                    ))}

                    {/* Gaming auto-DND */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${DiscordColors.border}` }}>
                        <div>
                            <div style={{ fontSize: "14px", fontWeight: 500, color: DiscordColors.textNormal }}>
                                🚫 Auto-DND quand un jeu tourne
                            </div>
                            <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                Passe en Ne pas déranger quand un jeu est lancé, et restaure ton statut à la fermeture (inspiré d’AutoDNDWhilePlaying).
                            </div>
                        </div>
                        <div style={SwitchStyles.container}>
                            <label style={SwitchStyles.label}>
                                <input
                                    type="checkbox"
                                    checked={gamingAutoDnd}
                                    onChange={(e) => onGamingAutoDndUpdate(e.target.checked)}
                                    style={SwitchStyles.input}
                                />
                                <span style={SwitchStyles.slider} />
                            </label>
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: "11px", color: DiscordColors.textMuted, marginTop: "12px" }}>
                    Astuce : les presets appliquent les variables CSS (--bg, --surface, --accent, --radius, --blur). Complète avec le CSS custom de l’onglet UI Options.
                </div>
            </div>

            {/* Reset */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => onThemeEngineUpdate({
                        preset: "dark",
                        wallpaperUrl: "",
                        wallpaperOpacity: 80,
                        blur: 0,
                        radius: 8,
                        accent: "",
                        glass: false,
                        performanceMode: false,
                    })}
                    style={ButtonStyles.danger}
                >
                    Réinitialiser le moteur de thèmes
                </button>
            </div>
        </div>
    );
};

export default ThemeEnginePanel;
