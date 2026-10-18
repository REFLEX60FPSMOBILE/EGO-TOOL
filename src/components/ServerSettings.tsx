import { React, useState, useCallback, useMemo } from "@webpack/common";
import { CardStyles, ButtonStyles, InputStyles, ListStyles } from "../styles";
import { DiscordColors } from "../styles";

interface ServerSettingsProps {
    serverSettings: Record<string, {
        hideBadges: boolean;
        hiddenBadges: Record<string, boolean>;
    }>;
    currentServerId: string | null;
    onUpdateServerSettings: (serverId: string, updates: Partial<{
        hideBadges: boolean;
        hiddenBadges: Record<string, boolean>;
    }>) => void;
    onResetServer: (serverId: string) => void;
}

const ServerSettings: React.FC<ServerSettingsProps> = ({
    serverSettings,
    currentServerId,
    onUpdateServerSettings,
    onResetServer,
}) => {
    const [newServerId, setNewServerId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredServers = useMemo(() => {
        const servers = Object.entries(serverSettings);
        const query = searchQuery.toLowerCase();
        return servers.filter(([id]) => id.toLowerCase().includes(query));
    }, [serverSettings, searchQuery]);

    const handleAddServer = useCallback(() => {
        if (!newServerId.trim()) return;
        onUpdateServerSettings(newServerId, {
            hideBadges: true,
            hiddenBadges: {},
        });
        setNewServerId("");
    }, [newServerId, onUpdateServerSettings]);

    const handleToggleGlobal = useCallback((serverId: string, value: boolean) => {
        const current = serverSettings[serverId] || { hideBadges: false, hiddenBadges: {} };
        onUpdateServerSettings(serverId, {
            ...current,
            hideBadges: value,
        });
    }, [serverSettings, onUpdateServerSettings]);

    const handleResetServer = useCallback((serverId: string) => {
        onResetServer(serverId);
    }, [onResetServer]);

    const getServerName = useCallback((serverId: string): string => {
        try {
            const element = document.querySelector(`[data-guild-id="${serverId}"], [data-id="${serverId}"]`);
            if (element) {
                return element.textContent?.trim() || `Server ${serverId.slice(0, 6)}...`;
            }
            return `Server ${serverId.slice(0, 6)}...`;
        } catch {
            return `Server ${serverId.slice(0, 6)}...`;
        }
    }, []);

    const totalServers = Object.keys(serverSettings).length;

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>🏢 Per Server Settings</h3>
                    <p style={CardStyles.description}>
                        Configure different settings for each Discord server
                    </p>
                </div>
            </div>

            {/* Current Server Info */}
            {currentServerId && (
                <div style={{
                    ...CardStyles.card,
                    marginBottom: "16px",
                    border: `2px solid ${DiscordColors.info}`,
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}>
                        <span style={{ fontSize: "20px" }}>🎯</span>
                        <div>
                            <div style={{ fontWeight: "600", fontSize: "14px" }}>
                                Current Server
                            </div>
                            <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                ID: {currentServerId}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: `1px solid ${DiscordColors.border}`,
                    }}>
                        <p style={{ fontSize: "13px", color: DiscordColors.textMuted, marginBottom: "8px" }}>
                            Quick toggle for this server:
                        </p>
                        <button
                            onClick={() => currentServerId && handleToggleGlobal(currentServerId, true)}
                            style={{
                                ...ButtonStyles.danger,
                                marginRight: "8px",
                            }}
                        >
                            Hide All Badges
                        </button>
                        <button
                            onClick={() => currentServerId && handleToggleGlobal(currentServerId, false)}
                            style={ButtonStyles.success}
                        >
                            Show All Badges
                        </button>
                    </div>
                </div>
            )}

            {/* Add Server */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Add Server</h4>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Add a server by its ID to configure custom settings
                </p>
                <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                }}>
                    <input
                        style={{ ...InputStyles.text, flex: 1, minWidth: "250px" }}
                        placeholder="Server ID..."
                        value={newServerId}
                        onChange={(e) => setNewServerId(e.target.value)}
                    />
                    <button
                        onClick={handleAddServer}
                        disabled={!newServerId.trim()}
                        style={ButtonStyles.primary}
                    >
                        Add Server
                    </button>
                </div>
                <p style={{
                    fontSize: "12px",
                    color: DiscordColors.textMuted,
                    margin: "8px 0 0 0",
                }}>
                    Get server ID from Discord settings or URL. Example: <code>123456789012345678</code>
                </p>
            </div>

            {/* Server List */}
            <div style={CardStyles.card}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                }}>
                    <h4 style={CardStyles.cardTitle}>Configured Servers ({totalServers})</h4>
                    <input
                        style={{ ...InputStyles.text, width: "200px" }}
                        placeholder="Search servers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {totalServers > 0 ? (
                    <div style={ListStyles.items}>
                        {filteredServers.map(([serverId, settings]) => {
                            const serverName = getServerName(serverId);
                            const hiddenCount = Object.values(settings.hiddenBadges || {}).filter(h => h).length;
                            const isCurrent = serverId === currentServerId;

                            return (
                                <div
                                    key={serverId}
                                    style={{
                                        ...ListStyles.item,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                    }}
                                >
                                    <div style={{
                                        width: "32px",
                                        height: "32px",
                                        background: isCurrent 
                                            ? DiscordColors.success 
                                            : DiscordColors.backgroundSecondary,
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "14px",
                                    }}>
                                        {isCurrent ? "✓" : ""}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "600", fontSize: "14px" }}>
                                            {serverName}
                                        </div>
                                        <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                            ID: {serverId.slice(0, 16)}...
                                        </div>
                                        <div style={{
                                            fontSize: "11px",
                                            color: DiscordColors.textMuted,
                                            marginTop: "4px",
                                        }}>
                                            {settings.hideBadges ? "All badges hidden" : `${hiddenCount} badges hidden`}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        gap: "4px",
                                    }}>
                                        <button
                                            onClick={() => handleToggleGlobal(serverId, !settings.hideBadges)}
                                            style={{
                                                padding: "4px 8px",
                                                backgroundColor: settings.hideBadges 
                                                    ? DiscordColors.success 
                                                    : DiscordColors.textMuted,
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                            }}
                                        >
                                            {settings.hideBadges ? "Show All" : "Hide All"}
                                        </button>
                                        <button
                                            onClick={() => handleResetServer(serverId)}
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
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        padding: "16px",
                        textAlign: "center",
                        color: DiscordColors.textMuted,
                    }}>
                        No servers configured yet. Add a server above to get started.
                    </div>
                )}
            </div>

            {/* Help */}
            <div style={{
                ...CardStyles.card,
                marginTop: "16px",
            }}>
                <h4 style={CardStyles.cardTitle}>How to Use</h4>
                <ol style={{
                    margin: "0",
                    paddingLeft: "20px",
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    lineHeight: "1.6",
                }}>
                    <li>Get the server ID from Discord settings or the URL</li>
                    <li>Add the server using the form above</li>
                    <li>Configure badge hiding for that server</li>
                    <li>Settings automatically apply when you switch servers</li>
                    <li>Use “Current Server” section for quick access to current server</li>
                </ol>
            </div>
        </div>
    );
};

export default ServerSettings;
