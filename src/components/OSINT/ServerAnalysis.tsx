import { React, useState, useCallback, useEffect, useMemo } from "@webpack/common";
import { CardStyles, ButtonStyles, InputStyles, ListStyles } from "../../styles";
import { DiscordColors } from "../../styles";
import { DiscordGuild, GuildRole, GuildChannel, RiskLevel, RISK_LEVELS, ThreatIndicator, SecurityAssessment } from "../../types/osint";
import { formatDate, formatNumber, generateGuildSummary } from "../../utils/osintHelpers";

// Mock data for demonstration
const MOCK_GUILDS: DiscordGuild[] = [
    {
        id: "111111111111111111",
        name: "Community Server",
        icon: "https://cdn.discordapp.com/icons/111111111111111111/a_1234567890abcdef.png",
        banner: "https://cdn.discordapp.com/banners/111111111111111111/a_abcdef1234567890.png",
        description: "A community server for general discussions.",
        memberCount: 15420,
        onlineCount: 3456,
        ownerId: "123456789012345678",
        createdAt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        roles: [
            { id: "111111111111111111", name: "@everyone", color: 0, hoist: false, position: 0, permissions: 0x100000000, managed: false, mentionable: false, icon: null },
            { id: "222222222222222222", name: "Member", color: 0x7289DA, hoist: false, position: 1, permissions: 0x20000000, managed: false, mentionable: false, icon: null },
            { id: "333333333333333333", name: "VIP", color: 0xFFD700, hoist: true, position: 2, permissions: 0x20000000, managed: false, mentionable: false, icon: null },
            { id: "444444444444444444", name: "Moderator", color: 0x5E84F1, hoist: true, position: 3, permissions: 0x200000000, managed: false, mentionable: true, icon: null },
            { id: "555555555555555555", name: "Administrator", color: 0xED4245, hoist: true, position: 4, permissions: 0x80000000, managed: false, mentionable: true, icon: null },
        ],
        channels: [
            { id: "111111111111111112", name: "welcome", type: 0, position: 0, topic: "Welcome to the server!", nsfw: false, lastMessageId: "999999999999999999" },
            { id: "111111111111111113", name: "rules", type: 0, position: 1, topic: null, nsfw: false, lastMessageId: "888888888888888888" },
            { id: "111111111111111114", name: "announcements", type: 0, position: 2, topic: null, nsfw: false, lastMessageId: "777777777777777777" },
            { id: "111111111111111115", name: "general-chat", type: 0, position: 3, topic: "General discussions", nsfw: false, lastMessageId: "666666666666666666" },
            { id: "111111111111111116", name: "general-voice", type: 2, position: 4, topic: null, nsfw: false, lastMessageId: null },
            { id: "111111111111111117", name: "music", type: 2, position: 5, topic: null, nsfw: false, lastMessageId: null },
        ],
        emojis: [
            { id: "123456789012345678", name: "happy", animated: false, managed: false, requireColons: true },
            { id: "987654321098765432", name: "sad", animated: false, managed: false, requireColons: true },
            { id: "555555555555555555", name: "dance", animated: true, managed: false, requireColons: true },
        ],
        features: ["VIP_REGIONS", "COMMUNITY", "NEWS"],
        verificationLevel: 2,
        nsfwLevel: 1,
        securityScore: 85,
        riskFactors: ["High member count may attract spam", "NSFW content allowed"],
        suspiciousActivity: false,
    },
    {
        id: "222222222222222222",
        name: "Gaming Server",
        icon: "https://cdn.discordapp.com/icons/222222222222222222/b_abcdef1234567890.png",
        banner: null,
        description: null,
        memberCount: 856,
        onlineCount: 123,
        ownerId: "987654321098765432",
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        roles: [
            { id: "111111111111111111", name: "@everyone", color: 0, hoist: false, position: 0, permissions: 0, managed: false, mentionable: false, icon: null },
            { id: "222222222222222222", name: "Player", color: 0x00FF00, hoist: false, position: 1, permissions: 0, managed: false, mentionable: false, icon: null },
        ],
        channels: [
            { id: "222222222222222223", name: "general", type: 0, position: 0, topic: null, nsfw: false, lastMessageId: "555555555555555555" },
            { id: "222222222222222224", name: "lfg", type: 0, position: 1, topic: "Find game partners", nsfw: false, lastMessageId: "444444444444444444" },
        ],
        emojis: [],
        features: ["ANIMATED_ICON"],
        verificationLevel: 0,
        nsfwLevel: 0,
        securityScore: 40,
        riskFactors: ["No verification", "Low member count", "New server"],
        suspiciousActivity: true,
    },
    {
        id: "333333333333333333",
        name: "Suspicious Server",
        icon: null,
        banner: null,
        description: "Join for free Nitro!",
        memberCount: 50,
        onlineCount: 5,
        ownerId: "111111111111111111",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        roles: [
            { id: "111111111111111111", name: "@everyone", color: 0, hoist: false, position: 0, permissions: 0x200000000, managed: false, mentionable: false, icon: null },
        ],
        channels: [
            { id: "333333333333333334", name: "get-nitro-here", type: 0, position: 0, topic: "DM me for free Nitro", nsfw: false, lastMessageId: "333333333333333333" },
        ],
        emojis: [],
        features: [],
        verificationLevel: 0,
        nsfwLevel: 0,
        securityScore: 10,
        riskFactors: ["Suspicious description", "Very new server", "Admin permissions for everyone", "No verification"],
        suspiciousActivity: true,
    },
];

// Threat indicators for servers
const SERVER_THREAT_INDICATORS: ThreatIndicator[] = [
    { id: "new_server", name: "New Server", description: "Server created less than 30 days ago", severity: "MEDIUM", category: "Age", emoji: "⚠️" },
    { id: "no_verification", name: "No Verification", description: "Server has no verification requirements", severity: "HIGH", category: "Security", emoji: "🚨" },
    { id: "high_nsfw", name: "High NSFW Level", description: "Server allows explicit content", severity: "MEDIUM", category: "Content", emoji: "🔞" },
    { id: "admin_for_all", name: "Admin for Everyone", description: "@everyone role has administrator permissions", severity: "CRITICAL", category: "Permissions", emoji: "☠️" },
    { id: "suspicious_name", name: "Suspicious Name", description: "Server name contains suspicious keywords", severity: "HIGH", category: "Metadata", emoji: "💀" },
    { id: "suspicious_desc", name: "Suspicious Description", description: "Server description contains suspicious keywords", severity: "HIGH", category: "Metadata", emoji: "💀" },
    { id: "low_members", name: "Low Member Count", description: "Server has very few members", severity: "LOW", category: "Activity", emoji: "⚠️" },
    { id: "high_members", name: "High Member Count", description: "Server has many members, may attract spam", severity: "LOW", category: "Activity", emoji: "⚠️" },
];

// Security recommendations
const SECURITY_RECOMMENDATIONS: Record<string, string[]> = {
    CRITICAL: [
        "🚨 Leave this server immediately! It poses a critical security risk.",
        "☠️ Do not share any personal information in this server.",
        "💀 Report this server to Discord Trust & Safety.",
        "⚠️ Warn other members about this server."
    ],
    HIGH: [
        "🚨 Be extremely cautious in this server.",
        "⚠️ Do not click on any suspicious links.",
        "🔍 Verify the identity of other members before trusting them.",
        "🛡️ Consider enabling two-factor authentication."
    ],
    MEDIUM: [
        "⚠️ Be cautious when sharing information.",
        "🔍 Review the server rules and moderation.",
        "🛡️ Check if the server has active moderators.",
        "📋 Verify the server owner's reputation."
    ],
    LOW: [
        "✅ This server appears to be safe.",
        "👍 Continue to follow standard security practices.",
        "🔄 Regularly review server settings and permissions."
    ],
    SAFE: [
        "✅ This server is safe to use.",
        "👍 No significant security concerns detected.",
        "🎉 Enjoy your time in this server!"
    ],
};

const ServerAnalysis: React.FC = () => {
    const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DiscordGuild[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate security assessment
    const securityAssessment = useMemo((): SecurityAssessment => {
        if (!selectedGuild) {
            return {
                id: "none",
                name: "No server selected",
                score: 0,
                maxScore: 100,
                indicators: [],
                recommendations: [],
                overallRisk: "SAFE"
            };
        }

        const indicators: ThreatIndicator[] = [];
        const score = selectedGuild.securityScore ?? 50;

        // Check for risk factors
        SERVER_THREAT_INDICATORS.forEach(indicator => {
            if (selectedGuild.riskFactors?.includes(indicator.description)) {
                indicators.push(indicator);
            }
        });

        // Additional checks
        if (selectedGuild.verificationLevel === 0) {
            indicators.push(SERVER_THREAT_INDICATORS.find(i => i.id === "no_verification")!);
        }

        if (selectedGuild.nsfwLevel >= 2) {
            indicators.push(SERVER_THREAT_INDICATORS.find(i => i.id === "high_nsfw")!);
        }

        if (selectedGuild.createdAt && new Date(selectedGuild.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
            indicators.push(SERVER_THREAT_INDICATORS.find(i => i.id === "new_server")!);
        }

        if (selectedGuild.memberCount < 100) {
            indicators.push(SERVER_THREAT_INDICATORS.find(i => i.id === "low_members")!);
        }

        if (selectedGuild.memberCount > 10000) {
            indicators.push(SERVER_THREAT_INDICATORS.find(i => i.id === "high_members")!);
        }

        // Check for admin permissions on @everyone
        const everyoneRole = selectedGuild.roles.find(r => r.name === "@everyone");
        if (everyoneRole && (everyoneRole.permissions & 0x8) === 0x8) {
            indicators.push(SERVER_THREAT_INDICATORS.find(i => i.id === "admin_for_all")!);
        }

        // Determine overall risk level
        let overallRisk: RiskLevel = "SAFE";
        if (indicators.some(i => i.severity === "CRITICAL")) {
            overallRisk = "CRITICAL";
        } else if (indicators.some(i => i.severity === "HIGH")) {
            overallRisk = "HIGH";
        } else if (indicators.some(i => i.severity === "MEDIUM")) {
            overallRisk = "MEDIUM";
        } else if (indicators.some(i => i.severity === "LOW")) {
            overallRisk = "LOW";
        }

        return {
            id: selectedGuild.id,
            name: selectedGuild.name,
            score,
            maxScore: 100,
            indicators,
            recommendations: SECURITY_RECOMMENDATIONS[overallRisk] || [],
            overallRisk
        };
    }, [selectedGuild]);

    // Server search
    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setError(null);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const results = MOCK_GUILDS.filter(guild => 
                guild.name.toLowerCase().includes(query.toLowerCase()) ||
                guild.id.includes(query)
            );
            
            setSearchResults(results);
            
            if (results.length === 0) {
                setError("No server found. Try a different name or ID.");
            }
        } catch (e) {
            setError("Error during search.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleSelectGuild = useCallback((guild: DiscordGuild) => {
        setSelectedGuild(guild);
        setSearchQuery(guild.name);
    }, []);

    const handleClear = useCallback(() => {
        setSearchQuery("");
        setSelectedGuild(null);
        setSearchResults([]);
        setError(null);
    }, []);

    const textChannels = useMemo(() => {
        if (!selectedGuild) return [];
        return selectedGuild.channels.filter(c => c.type === 0);
    }, [selectedGuild]);

    const voiceChannels = useMemo(() => {
        if (!selectedGuild) return [];
        return selectedGuild.channels.filter(c => c.type === 2);
    }, [selectedGuild]);

    const hoistedRoles = useMemo(() => {
        if (!selectedGuild) return [];
        return selectedGuild.roles.filter(r => r.hoist).sort((a, b) => b.position - a.position);
    }, [selectedGuild]);

    const normalRoles = useMemo(() => {
        if (!selectedGuild) return [];
        return selectedGuild.roles.filter(r => !r.hoist && r.id !== selectedGuild.id).sort((a, b) => b.position - a.position);
    }, [selectedGuild]);

    const onlinePercentage = useMemo(() => {
        if (!selectedGuild || selectedGuild.memberCount === 0) return 0;
        return Math.round((selectedGuild.onlineCount / selectedGuild.memberCount) * 100);
    }, [selectedGuild]);

    const riskLevel = RISK_LEVELS[securityAssessment.overallRisk];

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={{ ...CardStyles.title, color: riskLevel?.color }}>
                        {selectedGuild ? `🛡️ ${selectedGuild.name} Security Assessment` : "🔍 Server Analysis"}
                    </h3>
                    <p style={CardStyles.description}>
                        Analyze public server information and security risks
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <div style={{ 
                display: "flex", 
                gap: "8px", 
                marginBottom: "16px",
                flexWrap: "wrap"
            }}>
                <input
                    style={{ ...InputStyles.text, flex: 1, minWidth: "250px" }}
                    placeholder="Server name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading}
                />
                <button
                    style={ButtonStyles.primary}
                    onClick={() => handleSearch(searchQuery)}
                    disabled={loading || !searchQuery.trim()}
                >
                    {loading ? "🔄 Searching..." : "🔍 Search"}
                </button>
                <button
                    style={ButtonStyles.ghost}
                    onClick={handleClear}
                    disabled={!searchQuery}
                >
                    🗑️ Clear
                </button>
            </div>

            {/* Error message */}
            {error && !searchResults.length && (
                <div style={{
                    padding: "12px",
                    backgroundColor: "rgba(237, 66, 69, 0.1)",
                    border: `1px solid ${DiscordColors.danger}`,
                    borderRadius: "6px",
                    color: DiscordColors.danger,
                    fontSize: "13px",
                    marginBottom: "16px"
                }}>
                    {error}
                </div>
            )}

            {/* Search results */}
            {searchResults.length > 0 && !selectedGuild && (
                <div style={ListStyles.container}>
                    <h4 style={ListStyles.title}>Search Results ({searchResults.length})</h4>
                    <div style={ListStyles.items}>
                        {searchResults.map(guild => (
                            <button
                                key={guild.id}
                                onClick={() => handleSelectGuild(guild)}
                                style={{
                                    ...ListStyles.item,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px"
                                }}
                            >
                                {guild.icon && (
                                    <img
                                        src={guild.icon}
                                        alt=""
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            objectFit: "cover"
                                        }}
                                    />
                                )}
                                <div>
                                    <div style={{ fontWeight: "600", fontSize: "14px" }}>
                                        {guild.name}
                                    </div>
                                    <div style={{ fontSize: "12px", color: DiscordColors.muted }}>
                                        {formatNumber(guild.memberCount)} members • {guild.features.join(", ")}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected guild analysis */}
            {selectedGuild && (
                <div style={{ marginTop: "16px" }}>
                    {/* Security Assessment Panel */}
                    <div style={{
                        background: `linear-gradient(135deg, ${riskLevel?.bg} 0%, ${riskLevel?.bg}cc 100%)`,
                        border: `2px solid ${riskLevel?.color}`,
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "16px",
                        color: "white"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <span style={{ fontSize: "24px" }}>{riskLevel?.emoji}</span>
                            <div>
                                <h4 style={{ margin: "0", fontSize: "16px", fontWeight: "700" }}>
                                    SECURITY ASSESSMENT: {securityAssessment.overallRisk}
                                </h4>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                                    Threat Level: {riskLevel?.label}
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                    {securityAssessment.score}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                    / {securityAssessment.maxScore}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>
                                    Security Score
                                </div>
                            </div>
                            
                            <div style={{ height: "60px", width: "2px", background: "rgba(255,255,255,0.3)" }} />
                            
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                    {selectedGuild.memberCount}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                    Members
                                </div>
                            </div>
                            
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                    {selectedGuild.channels.length}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                    Channels
                                </div>
                            </div>
                        </div>

                        {securityAssessment.indicators.length > 0 && (
                            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                                <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
                                    Risk Factors ({securityAssessment.indicators.length})
                                </h5>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {securityAssessment.indicators.slice(0, 5).map((indicator, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                background: "rgba(255,255,255,0.15)",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}
                                        >
                                            <span>{indicator.emoji}</span>
                                            <span>{indicator.name}</span>
                                        </span>
                                    ))}
                                    {securityAssessment.indicators.length > 5 && (
                                        <span style={{
                                            background: "rgba(255,255,255,0.15)",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "11px"
                                        }}>
                                            +{securityAssessment.indicators.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {securityAssessment.recommendations.length > 0 && (
                            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                                <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
                                    Recommendations
                                </h5>
                                <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "12px", lineHeight: "1.4" }}>
                                    {securityAssessment.recommendations.slice(0, 3).map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Server Overview */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                        <div style={CardStyles.card}>
                            <h4 style={CardStyles.cardTitle}>Server Information</h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                {selectedGuild.icon && (
                                    <img
                                        src={selectedGuild.icon}
                                        alt=""
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "50%",
                                            objectFit: "cover"
                                        }}
                                    />
                                )}
                                <div>
                                    <div style={{ fontWeight: "600" }}>{selectedGuild.name}</div>
                                    <div style={{ fontSize: "12px", color: DiscordColors.muted }}>
                                        ID: {selectedGuild.id}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                <div><strong>Owner ID:</strong> {selectedGuild.ownerId}</div>
                                <div><strong>Created:</strong> {formatDate(selectedGuild.createdAt)}</div>
                                <div><strong>Age:</strong> {Math.round((Date.now() - new Date(selectedGuild.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</div>
                            </div>
                            
                            {selectedGuild.description && (
                                <div style={{ marginTop: "12px", padding: "8px", background: "rgba(0,0,0,0.1)", borderRadius: "4px", fontSize: "12px" }}>
                                    <strong>Description:</strong><br />
                                    {selectedGuild.description}
                                </div>
                            )}
                        </div>

                        <div style={CardStyles.card}>
                            <h4 style={CardStyles.cardTitle}>Member Statistics</h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#43b581" }}>
                                        {formatNumber(selectedGuild.memberCount)}
                                    </div>
                                    <div style={{ fontSize: "11px", color: DiscordColors.muted }}>
                                        Total Members
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#faa61a" }}>
                                        {formatNumber(selectedGuild.onlineCount)}
                                    </div>
                                    <div style={{ fontSize: "11px", color: DiscordColors.muted }}>
                                        Online ({onlinePercentage}%)
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                <div style={{
                                    height: "8px",
                                    flex: 1,
                                    background: "rgba(0,0,0,0.1)",
                                    borderRadius: "4px",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${onlinePercentage}%`,
                                        background: `linear-gradient(90deg, #43b581 0%, #57f287 100%)`,
                                        borderRadius: "4px"
                                    }} />
                                </div>
                                <span style={{ fontSize: "12px", color: DiscordColors.muted }}>
                                    {onlinePercentage}% Online
                                </span>
                            </div>
                        </div>

                        <div style={CardStyles.card}>
                            <h4 style={CardStyles.cardTitle}>Verification & Security</h4>
                            <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                <div>
                                    <strong>Verification Level:</strong> 
                                    <span style={{ 
                                        color: selectedGuild.verificationLevel >= 3 ? "#43b581" : 
                                               selectedGuild.verificationLevel >= 2 ? "#faa61a" : "#ed4245"
                                    }}>
                                        Level {selectedGuild.verificationLevel}
                                    </span>
                                </div>
                                <div>
                                    <strong>NSFW Level:</strong> 
                                    <span style={{ 
                                        color: selectedGuild.nsfwLevel >= 3 ? "#ed4245" : 
                                               selectedGuild.nsfwLevel >= 2 ? "#faa61a" : "#43b581"
                                    }}>
                                        Level {selectedGuild.nsfwLevel}
                                    </span>
                                </div>
                                <div><strong>Features:</strong> {selectedGuild.features.length > 0 ? selectedGuild.features.join(", ") : "None"}</div>
                            </div>
                        </div>

                        <div style={CardStyles.card}>
                            <h4 style={CardStyles.cardTitle}>Channels</h4>
                            <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                <div><strong>Text Channels:</strong> {textChannels.length}</div>
                                <div><strong>Voice Channels:</strong> {voiceChannels.length}</div>
                                <div><strong>Total:</strong> {selectedGuild.channels.length}</div>
                            </div>
                            
                            <div style={{ marginTop: "12px" }}>
                                <h5 style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                                    Top Channels
                                </h5>
                                <div style={{ fontSize: "12px" }}>
                                    {selectedGuild.channels.slice(0, 3).map(channel => (
                                        <div key={channel.id} style={{ padding: "4px 0" }}>
                                            {channel.type === 0 ? "💬" : "🔊"} {channel.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role Hierarchy */}
                    <div style={CardStyles.card}>
                        <h4 style={CardStyles.cardTitle}>Role Hierarchy ({selectedGuild.roles.length - 1})</h4>
                        
                        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "12px", height: "12px", background: "#7289DA", borderRadius: "3px" }} />
                                <span style={{ fontSize: "12px" }}>Hoisted ({hoistedRoles.length})</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "12px", height: "12px", background: "#99AAB5", borderRadius: "3px" }} />
                                <span style={{ fontSize: "12px" }}>Normal ({normalRoles.length})</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {hoistedRoles.length > 0 && (
                                <div>
                                    <h5 style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: DiscordColors.muted }}>
                                        Hoisted Roles
                                    </h5>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {hoistedRoles.map(role => (
                                            <span
                                                key={role.id}
                                                style={{
                                                    padding: "4px 8px",
                                                    background: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : "#99AAB5",
                                                    color: "white",
                                                    borderRadius: "4px",
                                                    fontSize: "12px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                {role.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {normalRoles.length > 0 && (
                                <div>
                                    <h5 style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: DiscordColors.muted }}>
                                        Normal Roles
                                    </h5>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {normalRoles.map(role => (
                                            <span
                                                key={role.id}
                                                style={{
                                                    padding: "4px 8px",
                                                    background: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : "#99AAB5",
                                                    color: "white",
                                                    borderRadius: "4px",
                                                    fontSize: "12px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                {role.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Emoji List */}
                    {selectedGuild.emojis.length > 0 && (
                        <div style={CardStyles.card}>
                            <h4 style={CardStyles.cardTitle}>Custom Emojis ({selectedGuild.emojis.length})</h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {selectedGuild.emojis.map(emoji => (
                                    <div
                                        key={emoji.id}
                                        style={{
                                            padding: "6px",
                                            background: "rgba(0,0,0,0.1)",
                                            borderRadius: "6px",
                                            textAlign: "center"
                                        }}
                                    >
                                        <img
                                            src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}`}
                                            alt={emoji.name}
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                                objectFit: "contain"
                                            }}
                                        />
                                        <div style={{ fontSize: "11px", marginTop: "4px" }}>
                                            :{emoji.name}:
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Risk Analysis */}
                    {securityAssessment.indicators.length > 0 && (
                        <div style={CardStyles.card}>
                            <h4 style={{ ...CardStyles.cardTitle, color: riskLevel?.color }}>
                                {riskLevel?.emoji} Detailed Risk Analysis
                            </h4>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {securityAssessment.indicators.map((indicator, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "12px",
                                            padding: "12px",
                                            background: "rgba(0,0,0,0.05)",
                                            borderRadius: "6px",
                                            borderLeft: `4px solid ${RISK_LEVELS[indicator.severity].color}`
                                        }}
                                    >
                                        <span style={{ fontSize: "20px" }}>{indicator.emoji}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontWeight: "600", 
                                                fontSize: "14px",
                                                color: RISK_LEVELS[indicator.severity].color
                                            }}>
                                                {indicator.name}
                                            </div>
                                            <div style={{ 
                                                fontSize: "12px", 
                                                color: DiscordColors.muted,
                                                marginTop: "4px"
                                            }}>
                                                {indicator.description}
                                            </div>
                                            <div style={{ 
                                                fontSize: "11px", 
                                                marginTop: "6px",
                                                padding: "2px 6px",
                                                background: RISK_LEVELS[indicator.severity].bg,
                                                color: RISK_LEVELS[indicator.severity].color,
                                                borderRadius: "3px",
                                                display: "inline-block"
                                            }}>
                                                Severity: {RISK_LEVELS[indicator.severity].label}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Recommendations */}
                    {securityAssessment.recommendations.length > 3 && (
                        <div style={CardStyles.card}>
                            <h4 style={CardStyles.cardTitle}>All Recommendations</h4>
                            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
                                {securityAssessment.recommendations.map((rec, index) => (
                                    <li key={index} style={{ marginBottom: "8px" }}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ServerAnalysis;
