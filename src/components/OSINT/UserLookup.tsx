import { React, useState, useCallback, useEffect, useMemo } from "@webpack/common";
import { CardStyles, ButtonStyles, InputStyles, ListStyles, TabStyles } from "../../styles";
import { DiscordColors } from "../../styles";
import { DiscordUser, UserBadge, RiskLevel, RISK_LEVELS } from "../../types/osint";
import { 
    formatDate, 
    getAccountAge, 
    isVerified, 
    generateUserSummary
} from "../../utils/osintHelpers";

interface UserLookupProps {
    onUserSelect: (user: DiscordUser) => void;
}

// Mock data for demonstration (in real plugin, this would come from Discord API)
const MOCK_USERS: DiscordUser[] = [
    {
        id: "123456789012345678",
        username: "JohnDoe",
        discriminator: "1234",
        globalName: "John Doe",
        avatar: "https://cdn.discordapp.com/avatars/123456789012345678/a_1234567890abcdef.png",
        avatarDecoration: null,
        banner: "https://cdn.discordapp.com/banners/123456789012345678/a_abcdef1234567890.png",
        accentColor: 0x5865f2,
        bot: false,
        system: false,
        publicFlags: 0x40, // Nitro
        flags: 0,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        badges: [
            { id: "premium", name: "Nitro", description: "Discord Nitro subscriber", icon: "https://cdn.discordapp.com/badge-icons/premium.png", type: "discord" },
            { id: "early_supporter", name: "Early Supporter", description: "Early Discord supporter", icon: "https://cdn.discordapp.com/badge-icons/early_supporter.png", type: "discord" },
        ],
        mutualGuilds: [
            { id: "111111111111111111", name: "Community Server", icon: "https://cdn.discordapp.com/icons/111111111111111111/a_1234567890abcdef.png", memberCount: 10000, owner: false, permissions: 0x20000000, features: ["COMMUNITY"] },
            { id: "222222222222222222", name: "Gaming Hub", icon: "https://cdn.discordapp.com/icons/222222222222222222/b_abcdef1234567890.png", memberCount: 5000, owner: true, permissions: 0x80000000, features: ["ANIMATED_ICON"] },
        ],
        mutualFriends: 42,
        email: "john.doe@example.com",
        phone: "+1 555 123 4567",
        ipHistory: ["192.168.1.100", "10.0.0.50"],
        locations: ["New York, USA", "Los Angeles, USA"],
        previousUsernames: [
            { username: "JohnDoe2020", discriminator: "0001", changedAt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString() },
            { username: "JohnTheGreat", discriminator: "1234", changedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        associatedAccounts: [
            { platform: "Twitter", username: "@JohnDoe", url: "https://twitter.com/JohnDoe", verified: true },
            { platform: "GitHub", username: "johndoe", url: "https://github.com/johndoe", verified: true },
        ],
        lastActive: new Date().toISOString(),
        status: "online",
        threatScore: 5,
        riskLevel: "MEDIUM" as RiskLevel,
    },
    {
        id: "987654321098765432",
        username: "SuspiciousUser",
        discriminator: "0001",
        globalName: "Suspicious Account",
        avatar: null,
        avatarDecoration: null,
        banner: null,
        accentColor: null,
        bot: false,
        system: false,
        publicFlags: 0,
        flags: 0,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        badges: [],
        mutualGuilds: [],
        mutualFriends: 0,
        email: "suspicious@example.com",
        
        ipHistory: ["192.168.1.200"],
        locations: ["Unknown"],
        previousUsernames: [
            { username: "FreeNitroGiver", discriminator: "0001", changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { username: "TrustMe", discriminator: "0002", changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        associatedAccounts: [],
        lastActive: new Date().toISOString(),
        status: "idle",
        threatScore: 95,
        riskLevel: "CRITICAL" as RiskLevel,
    },
    {
        id: "555555555555555555",
        username: "SafeUser",
        discriminator: "5678",
        globalName: "Safe Account",
        avatar: "https://cdn.discordapp.com/avatars/555555555555555555/c_def4567890abcdef.png",
        avatarDecoration: null,
        banner: null,
        accentColor: null,
        bot: false,
        system: false,
        publicFlags: 0x40,
        flags: 0,
        createdAt: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        badges: [
            { id: "premium", name: "Nitro", description: "Discord Nitro subscriber", icon: "https://cdn.discordapp.com/badge-icons/premium.png", type: "discord" },
        ],
        mutualGuilds: [
            { id: "333333333333333333", name: "Trusted Server", icon: "https://cdn.discordapp.com/icons/333333333333333333/c_1234567890abcdef.png", memberCount: 5000, owner: false, permissions: 0x20000000, features: ["NEWS"] },
        ],
        mutualFriends: 156,
        
        
        ipHistory: [],
        locations: ["Verified Location"],
        previousUsernames: [],
        associatedAccounts: [
            { platform: "Twitter", username: "@SafeUser", url: "https://twitter.com/SafeUser", verified: true },
        ],
        lastActive: new Date().toISOString(),
        status: "online",
        threatScore: 5,
        riskLevel: "SAFE" as RiskLevel,
    },
    {
        id: "111111111111111111",
        username: "BotHelper",
        discriminator: "0000",
        globalName: "Helper Bot",
        avatar: "https://cdn.discordapp.com/avatars/111111111111111111/d_boticon.png",
        avatarDecoration: null,
        banner: null,
        accentColor: null,
        bot: true,
        system: false,
        publicFlags: 0x40000,
        flags: 0,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        badges: [],
        mutualGuilds: [
            { id: "111111111111111111", name: "Support Server", icon: "https://cdn.discordapp.com/icons/111111111111111111/a_1234567890abcdef.png", memberCount: 10000, owner: false, permissions: 0, features: [] },
        ],
        mutualFriends: 0,
        
        
        ipHistory: [],
        locations: [],
        previousUsernames: [],
        associatedAccounts: [],
        lastActive: new Date().toISOString(),
        status: "online",
        threatScore: 1,
        riskLevel: "SAFE" as RiskLevel,
    },
];

// Threat factors for users
const USER_THREAT_FACTORS = [
    { id: "new_account", name: "New Account", description: "Account created less than 30 days ago", severity: "HIGH" as RiskLevel, emoji: "⚠️" },
    { id: "no_avatar", name: "No Avatar", description: "User has no profile picture", severity: "LOW" as RiskLevel, emoji: "⚠️" },
    { id: "no_badges", name: "No Badges", description: "User has no Discord badges", severity: "LOW" as RiskLevel, emoji: "⚠️" },
    { id: "no_mutual_servers", name: "No Mutual Servers", description: "No shared servers with this user", severity: "MEDIUM" as RiskLevel, emoji: "💀" },
    { id: "no_mutual_friends", name: "No Mutual Friends", description: "No shared friends with this user", severity: "LOW" as RiskLevel, emoji: "⚠️" },
    { id: "suspicious_username", name: "Suspicious Username", description: "Username contains suspicious keywords", severity: "HIGH" as RiskLevel, emoji: "🚨" },
    { id: "frequent_username_changes", name: "Frequent Username Changes", description: "User changes username often", severity: "MEDIUM" as RiskLevel, emoji: "💀" },
    { id: "no_associated_accounts", name: "No Associated Accounts", description: "No linked social media accounts", severity: "LOW" as RiskLevel, emoji: "⚠️" },
    { id: "bot_account", name: "Bot Account", description: "This is a bot account", severity: "SAFE" as RiskLevel, emoji: "✅" },
    { id: "verified", name: "Verified", description: "User has verified badge", severity: "SAFE" as RiskLevel, emoji: "✅" },
];

// Suspicious username keywords
const SUSPICIOUS_USERNAME_KEYWORDS = [
    "free", "nitro", "gift", "win", "prize", "hack", "crack",
    "scam", "trust", "official", "support", "admin", "mod",
    "vip", "premium", "cheap", "buy", "sell", "trade"
];

const UserLookup: React.FC<UserLookupProps> = ({ onUserSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<DiscordUser | null>(null);
    const [searchResults, setSearchResults] = useState<DiscordUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("search");

    // User search
    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setError(null);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // Simulate search
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Filter mock users
            const results = MOCK_USERS.filter(user => 
                user.username.toLowerCase().includes(query.toLowerCase()) ||
                user.globalName?.toLowerCase().includes(query.toLowerCase()) ||
                user.id.includes(query)
            );
            
            setSearchResults(results);
            
            if (results.length === 0) {
                setError("No user found. Try a different name or ID.");
            }
        } catch (e) {
            setError("Error during search.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-search after delay
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleSelectUser = useCallback((user: DiscordUser) => {
        setSelectedUser(user);
        setSearchQuery(user.username);
        onUserSelect(user);
        setActiveTab("dossier");
    }, [onUserSelect]);

    const handleClear = useCallback(() => {
        setSearchQuery("");
        setSelectedUser(null);
        setSearchResults([]);
        setError(null);
        setActiveTab("search");
    }, []);

    // Calculate threat factors for selected user
    const threatFactors = useMemo(() => {
        if (!selectedUser) return [];
        
        const factors: { id: string; name: string; description: string; severity: RiskLevel; emoji: string }[] = [];
        
        // Check account age
        const accountAgeDays = Math.floor((Date.now() - new Date(selectedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (accountAgeDays < 30) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "new_account")!);
        }
        
        // Check avatar
        if (!selectedUser.avatar) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "no_avatar")!);
        }
        
        // Check badges
        if (selectedUser.badges.length === 0) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "no_badges")!);
        }
        
        // Check mutual servers
        if (selectedUser.mutualGuilds.length === 0) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "no_mutual_servers")!);
        }
        
        // Check mutual friends
        if (selectedUser.mutualFriends === 0) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "no_mutual_friends")!);
        }
        
        // Check associated accounts
        if (selectedUser.associatedAccounts?.length === 0) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "no_associated_accounts")!);
        }
        
        // Check username history
        if ((selectedUser.previousUsernames?.length ?? 0) > 3) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "frequent_username_changes")!);
        }
        
        // Check for suspicious keywords in username
        const usernameLower = selectedUser.username.toLowerCase();
        const hasSuspiciousKeyword = SUSPICIOUS_USERNAME_KEYWORDS.some(kw => usernameLower.includes(kw));
        if (hasSuspiciousKeyword) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "suspicious_username")!);
        }
        
        // Bot accounts are safer
        if (selectedUser.bot) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "bot_account")!);
        }
        
        // Verified accounts are safer
        if (isVerified(selectedUser)) {
            factors.push(USER_THREAT_FACTORS.find(f => f.id === "verified")!);
        }
        
        return factors;
    }, [selectedUser]);

    const riskLevel = useMemo(() => {
        if (!selectedUser) return RISK_LEVELS.SAFE;
        return RISK_LEVELS[selectedUser.riskLevel || "SAFE"];
    }, [selectedUser]);

    const accountAge = useMemo(() => {
        if (!selectedUser) return "";
        return getAccountAge(selectedUser.createdAt);
    }, [selectedUser]);

    const userBadges = useMemo((): UserBadge[] => {
        if (!selectedUser) return [];
        return selectedUser.badges;
    }, [selectedUser]);

    const tabs = [
        { id: "search", label: "Search", icon: "🔍" },
        { id: "dossier", label: "Dossier", icon: "📁" },
        { id: "social", label: "Social", icon: "🌐" },
        { id: "history", label: "History", icon: "📜" },
        { id: "threats", label: "Threats", icon: "🚨" },
    ];

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={{ ...CardStyles.title, color: riskLevel?.color }}>
                        {selectedUser ? `🔍 ${selectedUser.globalName || selectedUser.username}'s Dossier` : "🔍 User Lookup"}
                    </h3>
                    <p style={CardStyles.description}>
                        Search for Discord users and analyze their public information
                    </p>
                </div>
            </div>

            {/* Threat Assessment Panel (when user selected) */}
            {selectedUser && (
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
                                THREAT ASSESSMENT: {selectedUser.riskLevel || "SAFE"}
                            </h4>
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                                Risk Level: {riskLevel?.label}
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                {selectedUser.threatScore || 0}
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                / 100
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>
                                Threat Score
                            </div>
                        </div>
                        
                        <div style={{ height: "60px", width: "2px", background: "rgba(255,255,255,0.3)" }} />
                        
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                {selectedUser.mutualGuilds.length}
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                Servers
                            </div>
                        </div>
                        
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                {selectedUser.mutualFriends}
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                Friends
                            </div>
                        </div>
                        
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                {selectedUser.badges.length}
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                Badges
                            </div>
                        </div>
                    </div>

                    {threatFactors.length > 0 && (
                        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                            <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
                                Risk Factors ({threatFactors.length})
                            </h5>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {threatFactors.slice(0, 5).map((factor, index) => {
                                    return (
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
                                            <span>{factor.emoji}</span>
                                            <span>{factor.name}</span>
                                        </span>
                                    );
                                })}
                                {threatFactors.length > 5 && (
                                    <span style={{
                                        background: "rgba(255,255,255,0.15)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "11px"
                                    }}>
                                        +{threatFactors.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search bar */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
                flexWrap: "wrap"
            }}>
                <input
                    style={{ ...InputStyles.text, flex: 1, minWidth: "250px" }}
                    placeholder="Username, global name, or ID..."
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
            {error && !searchResults.length && !selectedUser && (
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

            {/* Tabs for user details */}
            {selectedUser && (
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
            )}

            {/* Search results */}
            {searchResults.length > 0 && !selectedUser && (
                <div style={ListStyles.container}>
                    <h4 style={{ ...CardStyles.cardTitle, marginBottom: "8px" }}>Search Results ({searchResults.length})</h4>
                    <div style={ListStyles.items}>
                        {searchResults.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                style={{
                                    ...ListStyles.item,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px"
                                }}
                            >
                                {user.avatar && (
                                    <img
                                        src={user.avatar}
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
                                        {user.globalName || user.username}
                                    </div>
                                    <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                        {user.username}#{user.discriminator} • ID: {user.id.slice(0, 16)}...
                                    </div>
                                </div>
                                {user.bot && (
                                    <span style={{
                                        padding: "2px 6px",
                                        background: "#5865F2",
                                        color: "white",
                                        borderRadius: "3px",
                                        fontSize: "10px",
                                        fontWeight: "500"
                                    }}>
                                        BOT
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* User Dossier */}
            {selectedUser && activeTab === "dossier" && (
                <div style={{ marginTop: "16px" }}>
                    <div style={CardStyles.card}>
                        <h4 style={CardStyles.cardTitle}>User Information</h4>
                        
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                            {selectedUser.avatar && (
                                <img
                                    src={selectedUser.avatar}
                                    alt=""
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "50%",
                                        objectFit: "cover"
                                    }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <span style={{ fontWeight: "600", fontSize: "18px" }}>
                                        {selectedUser.globalName || selectedUser.username}
                                    </span>
                                    {selectedUser.bot && (
                                        <span style={{
                                            padding: "2px 6px",
                                            background: "#5865F2",
                                            color: "white",
                                            borderRadius: "3px",
                                            fontSize: "10px",
                                            fontWeight: "500"
                                        }}>
                                            BOT
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                    {selectedUser.username}#{selectedUser.discriminator}
                                </div>
                                <div style={{ fontSize: "12px", color: DiscordColors.textMuted, marginTop: "4px" }}>
                                    ID: {selectedUser.id}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                            <div>
                                <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                    Account Age
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "500" }}>
                                    {accountAge}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                    Created
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "500" }}>
                                    {formatDate(selectedUser.createdAt)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                    Status
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "500", textTransform: "capitalize" }}>
                                    {selectedUser.status}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                    Last Active
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "500" }}>
                                    {selectedUser.lastActive ? formatDate(selectedUser.lastActive) : "Unknown"}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                Summary
                            </div>
                            <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                {generateUserSummary(selectedUser)}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                Badges ({userBadges.length})
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {userBadges.map(badge => (
                                    <div
                                        key={badge.id}
                                        style={{
                                            padding: "4px 8px",
                                            background: DiscordColors.backgroundSecondary,
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}
                                    >
                                        <img
                                            src={badge.icon}
                                            alt={badge.name}
                                            style={{ width: "16px", height: "16px" }}
                                        />
                                        <span>{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={CardStyles.card}>
                        <h4 style={CardStyles.cardTitle}>Account Details</h4>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                            {selectedUser.email && (
                                <div>
                                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                        Email
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: "500", wordBreak: "break-all" }}>
                                        {selectedUser.email}
                                    </div>
                                </div>
                            )}
                            {selectedUser.phone && (
                                <div>
                                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                        Phone
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: "500" }}>
                                        {selectedUser.phone}
                                    </div>
                                </div>
                            )}
                            {!!selectedUser.locations?.length && (
                                <div>
                                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                        Locations
                                    </div>
                                    <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                        {selectedUser.locations?.join(", ")}
                                    </div>
                                </div>
                            )}
                            {!!selectedUser.ipHistory?.length && (
                                <div>
                                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                        IP History
                                    </div>
                                    <div style={{ fontSize: "13px", lineHeight: "1.5", wordBreak: "break-all" }}>
                                        {selectedUser.ipHistory?.join(", ")}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={CardStyles.card}>
                        <h4 style={CardStyles.cardTitle}>Mutual Information</h4>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                            <div>
                                <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                    Mutual Servers
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "500" }}>
                                    {selectedUser.mutualGuilds.length}
                                </div>
                                {selectedUser.mutualGuilds.slice(0, 3).map(guild => (
                                    <div key={guild.id} style={{ fontSize: "12px", color: DiscordColors.textMuted, marginTop: "4px" }}>
                                        • {guild.name}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                    Mutual Friends
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "500" }}>
                                    {selectedUser.mutualFriends}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Social Tab */}
            {selectedUser && activeTab === "social" && (
                <div style={{ marginTop: "16px" }}>
                    <div style={CardStyles.card}>
                        <h4 style={CardStyles.cardTitle}>Associated Accounts</h4>
                        <p style={{ fontSize: "13px", color: DiscordColors.textMuted, marginBottom: "12px" }}>
                            Linked social media and external accounts
                        </p>
                        
                        {selectedUser.associatedAccounts && selectedUser.associatedAccounts.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {selectedUser.associatedAccounts.map((account, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px",
                                            background: DiscordColors.backgroundSecondary,
                                            borderRadius: "6px"
                                        }}
                                    >
                                        <div style={{ width: "32px", height: "32px", background: DiscordColors.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ color: "white", fontWeight: "bold" }}>{account.platform.charAt(0)}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: "600", fontSize: "14px" }}>
                                                {account.platform}
                                            </div>
                                            <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                                {account.username}
                                            </div>
                                        </div>
                                        {account.verified && (
                                            <span style={{ color: DiscordColors.success, fontSize: "16px" }}>✓</span>
                                        )}
                                        <a href={account.url} target="_blank" rel="noreferrer" style={{ color: DiscordColors.link, fontSize: "14px" }}>
                                            Link
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: "16px", textAlign: "center", color: DiscordColors.textMuted }}>
                                No associated accounts found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* History Tab */}
            {selectedUser && activeTab === "history" && (
                <div style={{ marginTop: "16px" }}>
                    <div style={CardStyles.card}>
                        <h4 style={CardStyles.cardTitle}>Username History</h4>
                        
                        {selectedUser.previousUsernames && selectedUser.previousUsernames.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {selectedUser.previousUsernames.map((username, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px",
                                            background: DiscordColors.backgroundSecondary,
                                            borderRadius: "6px"
                                        }}
                                    >
                                        <div style={{ width: "32px", height: "32px", background: DiscordColors.info, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ color: "white", fontWeight: "bold" }}>{index + 1}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: "600", fontSize: "14px" }}>
                                                {username.username}#{username.discriminator}
                                            </div>
                                            <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                                Changed: {formatDate(username.changedAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: "16px", textAlign: "center", color: DiscordColors.textMuted }}>
                                No username history available
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Threats Tab */}
            {selectedUser && activeTab === "threats" && (
                <div style={{ marginTop: "16px" }}>
                    <div style={CardStyles.card}>
                        <h4 style={{ ...CardStyles.cardTitle, color: riskLevel?.color }}>
                            {riskLevel?.emoji} Threat Analysis
                        </h4>
                        
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "4px" }}>
                                Overall Threat Score
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "100%", height: "12px", background: DiscordColors.backgroundSecondary, borderRadius: "6px", overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${(selectedUser.threatScore || 0) * 100 / 100}%`,
                                        background: `linear-gradient(90deg, ${riskLevel?.color} 0%, ${riskLevel?.color}aa 100%)`,
                                        borderRadius: "6px"
                                    }} />
                                </div>
                                <span style={{ fontWeight: "600" }}>{selectedUser.threatScore || 0}/100</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "8px" }}>
                                Risk Factors ({threatFactors.length})
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {threatFactors.map((factor, index) => {
                                    const level = RISK_LEVELS[factor.severity];
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "12px",
                                                background: level.bg,
                                                border: `1px solid ${level.color}`,
                                                borderRadius: "6px"
                                            }}
                                        >
                                            <span style={{ fontSize: "20px" }}>{factor.emoji}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: "600", fontSize: "14px", color: level.color }}>
                                                    {factor.name}
                                                </div>
                                                <div style={{ fontSize: "12px", color: DiscordColors.textMuted, marginTop: "2px" }}>
                                                    {factor.description}
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: "2px 6px",
                                                background: level.bg,
                                                color: level.color,
                                                borderRadius: "3px",
                                                fontSize: "10px",
                                                fontWeight: "500"
                                            }}>
                                                {level.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase", marginBottom: "8px" }}>
                                Recommendations
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {selectedUser.riskLevel === "CRITICAL" && (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(237, 66, 69, 0.1)", borderRadius: "4px" }}>
                                            <span style={{ color: DiscordColors.danger, fontSize: "16px" }}>☠️</span>
                                            <span style={{ fontSize: "13px" }}>This account poses a CRITICAL threat. Do not interact with this user.</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(237, 66, 69, 0.1)", borderRadius: "4px" }}>
                                            <span style={{ color: DiscordColors.danger, fontSize: "16px" }}>🚨</span>
                                            <span style={{ fontSize: "13px" }}>Report this user to Discord Trust & Safety immediately.</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(237, 66, 69, 0.1)", borderRadius: "4px" }}>
                                            <span style={{ color: DiscordColors.danger, fontSize: "16px" }}>💀</span>
                                            <span style={{ fontSize: "13px" }}>Block this user to prevent any further contact.</span>
                                        </div>
                                    </>
                                )}
                                {selectedUser.riskLevel === "HIGH" && (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(250, 166, 26, 0.1)", borderRadius: "4px" }}>
                                            <span style={{ color: DiscordColors.warning, fontSize: "16px" }}>🚨</span>
                                            <span style={{ fontSize: "13px" }}>Be extremely cautious with this account.</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(250, 166, 26, 0.1)", borderRadius: "4px" }}>
                                            <span style={{ color: DiscordColors.warning, fontSize: "16px" }}>⚠️</span>
                                            <span style={{ fontSize: "13px" }}>Do not share personal information with this user.</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(250, 166, 26, 0.1)", borderRadius: "4px" }}>
                                            <span style={{ color: DiscordColors.warning, fontSize: "16px" }}>💀</span>
                                            <span style={{ fontSize: "13px" }}>                                            Verify the user’s identity before trusting them.</span>
                                        </div>
                                    </>
                                )}
                                {(selectedUser.riskLevel === "MEDIUM" || selectedUser.riskLevel === "LOW") && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(59, 165, 92, 0.1)", borderRadius: "4px" }}>
                                        <span style={{ color: DiscordColors.success, fontSize: "16px" }}>✅</span>
                                        <span style={{ fontSize: "13px" }}>This account appears to be safe, but always exercise caution online.</span>
                                    </div>
                                )}
                                {selectedUser.riskLevel === "SAFE" && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(59, 165, 92, 0.1)", borderRadius: "4px" }}>
                                        <span style={{ color: DiscordColors.success, fontSize: "16px" }}>✅</span>
                                        <span style={{ fontSize: "13px" }}>This account is safe to interact with.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserLookup;
