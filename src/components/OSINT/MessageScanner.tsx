import { React, useState, useCallback, useMemo } from "@webpack/common";
import { CardStyles, ButtonStyles, InputStyles, ListStyles } from "../../styles";
import { DiscordColors } from "../../styles";
import { 
    ExtractedLink, 
    ExtractedEmail, 
    ExtractedPhone,
    DiscordMessage,
    RiskLevel,
    RISK_LEVELS
} from "../../types/osint";
import { 
    extractLinks, 
    extractEmails, 
    extractPhones,
    extractDiscordInvites,
    isSafeUrl,
    formatNumber
} from "../../utils/osintHelpers";

// Mock data for demonstration
const MOCK_MESSAGES: DiscordMessage[] = [
    {
        id: "111111111111111111",
        content: "Hey everyone! Check out my new website: https://my-website.com and contact me at contact@my-website.com",
        author: {
            id: "123456789012345678",
            username: "TestUser",
            discriminator: "1234",
            avatar: "https://cdn.discordapp.com/avatars/123456789012345678/a_1234567890abcdef.png",
            bot: false,
        },
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        editedTimestamp: null,
        channelId: "111111111111111112",
        guildId: "111111111111111111",
        attachments: [],
        embeds: [],
        reactions: [],
        mentions: {
            users: [],
            roles: [],
            everyone: false,
            repliedUser: null,
        },
    },
    {
        id: "222222222222222222",
        content: "Join my Discord server: discord.gg/abc123 or https://discord.gg/xyz456. Also check out this video: https://youtube.com/watch?v=dQw4w9WgXcQ",
        author: {
            id: "987654321098765432",
            username: "AnotherUser",
            discriminator: "5678",
            avatar: null,
            bot: false,
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        editedTimestamp: null,
        channelId: "111111111111111112",
        guildId: "111111111111111111",
        attachments: [],
        embeds: [],
        reactions: [],
        mentions: {
            users: [],
            roles: [],
            everyone: false,
            repliedUser: null,
        },
    },
    {
        id: "333333333333333333",
        content: "My phone number: +1 555 123 4567. Call me anytime! Also email me at john.doe@example.com",
        author: {
            id: "123456789012345678",
            username: "TestUser",
            discriminator: "1234",
            avatar: "https://cdn.discordapp.com/avatars/123456789012345678/a_1234567890abcdef.png",
            bot: false,
        },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        editedTimestamp: null,
        channelId: "111111111111111112",
        guildId: "111111111111111111",
        attachments: [],
        embeds: [],
        reactions: [],
        mentions: {
            users: [],
            roles: [],
            everyone: false,
            repliedUser: null,
        },
    },
    {
        id: "444444444444444444",
        content: "Check this out: https://youtube.com/watch?v=dQw4w9WgXcQ and https://bit.ly/malicious-link and https://tinyurl.com/phishing",
        author: {
            id: "987654321098765432",
            username: "AnotherUser",
            discriminator: "5678",
            avatar: null,
            bot: false,
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        editedTimestamp: null,
        channelId: "111111111111111112",
        guildId: "111111111111111111",
        attachments: [],
        embeds: [],
        reactions: [],
        mentions: {
            users: [],
            roles: [],
            everyone: false,
            repliedUser: null,
        },
    },
    {
        id: "555555555555555555",
        content: "Free Nitro! Just click here: bit.ly/free-nitro-scams and enter your password to claim!",
        author: {
            id: "111111111111111111",
            username: "SuspiciousUser",
            discriminator: "0001",
            avatar: null,
            bot: false,
        },
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        editedTimestamp: null,
        channelId: "111111111111111112",
        guildId: "111111111111111111",
        attachments: [],
        embeds: [],
        reactions: [],
        mentions: {
            users: [],
            roles: [],
            everyone: false,
            repliedUser: null,
        },
    },
];

// URL threat database
const URL_THREATS: Record<string, { severity: RiskLevel; description: string; emoji: string }> = {
    "bit.ly": { severity: "HIGH", description: "URL shortener, may hide malicious links", emoji: "🚨" },
    "tinyurl.com": { severity: "HIGH", description: "URL shortener, may hide malicious links", emoji: "🚨" },
    "goo.gl": { severity: "HIGH", description: "URL shortener, may hide malicious links", emoji: "🚨" },
    "ow.ly": { severity: "HIGH", description: "URL shortener, may hide malicious links", emoji: "🚨" },
    "is.gd": { severity: "HIGH", description: "URL shortener, may hide malicious links", emoji: "🚨" },
    "youtube.com": { severity: "SAFE", description: "Video sharing platform", emoji: "✅" },
    "youtu.be": { severity: "SAFE", description: "Video sharing platform", emoji: "✅" },
    "twitch.tv": { severity: "SAFE", description: "Live streaming platform", emoji: "✅" },
    "twitter.com": { severity: "LOW", description: "Social media platform", emoji: "⚠️" },
    "instagram.com": { severity: "LOW", description: "Social media platform", emoji: "⚠️" },
    "reddit.com": { severity: "LOW", description: "Discussion forum", emoji: "⚠️" },
    "discord.gg": { severity: "MEDIUM", description: "Discord server invite", emoji: "💀" },
    "discord.com/invite": { severity: "MEDIUM", description: "Discord server invite", emoji: "💀" },
};

// Suspicious keywords
const SUSPICIOUS_KEYWORDS: { keyword: string; severity: RiskLevel; description: string; emoji: string }[] = [
    { keyword: "free nitro", severity: "CRITICAL", description: "Common scam keyword", emoji: "☠️" },
    { keyword: "free money", severity: "CRITICAL", description: "Common scam keyword", emoji: "☠️" },
    { keyword: "password", severity: "CRITICAL", description: "Sensitive information request", emoji: "☠️" },
    { keyword: "enter your password", severity: "CRITICAL", description: "Phishing attempt", emoji: "☠️" },
    { keyword: "click here", severity: "HIGH", description: "Suspicious call to action", emoji: "🚨" },
    { keyword: "limited time", severity: "HIGH", description: "Urgency tactic", emoji: "🚨" },
    { keyword: "act now", severity: "HIGH", description: "Urgency tactic", emoji: "🚨" },
    { keyword: "scam", severity: "MEDIUM", description: "Scam-related content", emoji: "💀" },
    { keyword: "hack", severity: "MEDIUM", description: "Potentially malicious", emoji: "💀" },
    { keyword: "exploit", severity: "MEDIUM", description: "Potentially malicious", emoji: "💀" },
];

// Security recommendations for different threat levels
const LINK_RECOMMENDATIONS: Record<string, string[]> = {
    CRITICAL: [
        "☠️ DO NOT CLICK THIS LINK! This is a confirmed malicious link.",
        "🚨 Report this message immediately to server moderators.",
        "💀 Block the user who sent this message.",
        "⚠️ Do not share any personal information with this user."
    ],
    HIGH: [
        "🚨 Be extremely cautious with this link.",
        "⚠️ Hover over the link to see the real URL before clicking.",
        "🔍 Use a link scanner to check if it's safe.",
        "🛡️ Consider using a browser with built-in phishing protection."
    ],
    MEDIUM: [
        "⚠️ Be cautious with this link.",
        "🔍 Verify the source before clicking.",
        "🛡️ Check if the website is legitimate.",
        "📋 Review the website's reputation online."
    ],
    LOW: [
        "✅ This link appears to be safe.",
        "👍 Continue to follow standard security practices.",
        "🔄 Always verify links before entering sensitive information."
    ],
    SAFE: [
        "✅ This link is safe to click.",
        "👍 No significant security concerns detected.",
        "🎉 You can proceed with confidence."
    ],
};

const MessageScanner: React.FC = () => {
    const [selectedMessage, setSelectedMessage] = useState<DiscordMessage | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DiscordMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract and analyze all data from message
    const extractedData = useMemo(() => {
        if (!selectedMessage) return { links: [], emails: [], phones: [], invites: [] };

        const content = selectedMessage.content;
        
        // Extract links
        const allLinks = extractLinks(content);
        const analyzedLinks = allLinks.map(link => {
            const domain = new URL(link.url).hostname.replace("www.", "");
            const isShortened = ["bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "is.gd"].some(d => domain.includes(d));
            const threatInfo = URL_THREATS[domain] || { severity: "LOW", description: "Unknown domain", emoji: "⚠️" };
            
            return {
                url: link.url,
                type: link.type,
                domain,
                isSafe: !isShortened && threatInfo.severity === "SAFE",
                isShortened,
                resolvedUrl: null,
                threatLevel: threatInfo.severity,
                description: threatInfo.description,
                emoji: threatInfo.emoji
            } as ExtractedLink;
        });

        // Extract emails
        const allEmails = extractEmails(content);
        const analyzedEmails = allEmails.map(email => ({
            email: email.email,
            domain: email.domain,
            isValid: email.isValid,
            threatLevel: "LOW" as RiskLevel,
            emoji: "⚠️"
        }));

        // Extract phones
        const allPhones = extractPhones(content);
        const analyzedPhones = allPhones.map(phone => ({
            number: phone.number,
            country: phone.country,
            isValid: phone.isValid,
            threatLevel: "MEDIUM" as RiskLevel,
            emoji: "💀"
        }));

        // Extract Discord invites
        const invites = extractDiscordInvites(content);
        const analyzedInvites = invites.map(invite => ({
            url: invite,
            type: "discord" as const,
            domain: "discord.gg",
            isSafe: false,
            isShortened: false,
            resolvedUrl: null,
            threatLevel: "MEDIUM" as RiskLevel,
            description: "Discord server invite",
            emoji: "💀"
        }));

        return {
            links: analyzedLinks,
            emails: analyzedEmails,
            phones: analyzedPhones,
            invites: analyzedInvites
        };
    }, [selectedMessage]);

    // Detect suspicious keywords in message
    const suspiciousKeywords = useMemo(() => {
        if (!selectedMessage) return [];
        
        const content = selectedMessage.content.toLowerCase();
        return SUSPICIOUS_KEYWORDS.filter(kw => content.includes(kw.keyword));
    }, [selectedMessage]);

    // Overall threat level
    const overallThreatLevel = useMemo((): RiskLevel => {
        if (!selectedMessage) return "SAFE";
        
        const allFindings = [
            ...extractedData.links.map(l => l.threatLevel),
            ...extractedData.emails.map(e => e.threatLevel),
            ...extractedData.phones.map(p => p.threatLevel),
            ...extractedData.invites.map(i => i.threatLevel),
            ...suspiciousKeywords.map(k => k.severity)
        ];
        
        if (allFindings.includes("CRITICAL")) return "CRITICAL";
        if (allFindings.includes("HIGH")) return "HIGH";
        if (allFindings.includes("MEDIUM")) return "MEDIUM";
        if (allFindings.includes("LOW")) return "LOW";
        return "SAFE";
    }, [selectedMessage, extractedData, suspiciousKeywords]);

    const riskLevel = RISK_LEVELS[overallThreatLevel];

    // Scan message
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
            
            const results = MOCK_MESSAGES.filter(msg => 
                msg.content.toLowerCase().includes(query.toLowerCase()) ||
                msg.author.username.toLowerCase().includes(query.toLowerCase()) ||
                msg.id.includes(query)
            );
            
            setSearchResults(results);
            
            if (results.length === 0) {
                setError("No messages found. Try a different search query.");
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

    const handleSelectMessage = useCallback((message: DiscordMessage) => {
        setSelectedMessage(message);
        setSearchQuery(`"${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`);
    }, []);

    const handleClear = useCallback(() => {
        setSearchQuery("");
        setSelectedMessage(null);
        setSearchResults([]);
        setError(null);
    }, []);

    const totalFindings = useMemo(() => {
        return extractedData.links.length + extractedData.emails.length + extractedData.phones.length + extractedData.invites.length + suspiciousKeywords.length;
    }, [extractedData, suspiciousKeywords]);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={{ ...CardStyles.title, color: riskLevel?.color }}>
                        {selectedMessage ? `🔍 ${selectedMessage.author.username}'s Message Analysis` : "📧 Message Scanner"}
                    </h3>
                    <p style={CardStyles.description}>
                        Scan messages for links, emails, phones, and security threats
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
                    placeholder="Search messages..."
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
            {searchResults.length > 0 && !selectedMessage && (
                <div style={ListStyles.container}>
                    <h4 style={ListStyles.title}>Search Results ({searchResults.length})</h4>
                    <div style={ListStyles.items}>
                        {searchResults.map(message => (
                            <button
                                key={message.id}
                                onClick={() => handleSelectMessage(message)}
                                style={{
                                    ...ListStyles.item,
                                    cursor: "pointer",
                                    textAlign: "left"
                                }}
                            >
                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                    {message.author.avatar && (
                                        <img
                                            src={message.author.avatar}
                                            alt=""
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                objectFit: "cover"
                                            }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                            <span style={{ fontWeight: "600", fontSize: "14px" }}>
                                                {message.author.username}
                                            </span>
                                            {message.author.bot && (
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
                                        <div style={{ fontSize: "12px", color: DiscordColors.muted, lineHeight: "1.4" }}>
                                            {message.content.substring(0, 100)}{message.content.length > 100 ? "..." : ""}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected message analysis */}
            {selectedMessage && (
                <div style={{ marginTop: "16px" }}>
                    {/* Threat Assessment Panel */}
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
                                    THREAT ASSESSMENT: {overallThreatLevel}
                                </h4>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                                    Risk Level: {riskLevel?.label}
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                    {totalFindings}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                    Findings
                                </div>
                            </div>
                            
                            <div style={{ height: "60px", width: "2px", background: "rgba(255,255,255,0.3)" }} />
                            
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                    {extractedData.links.length}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                    Links
                                </div>
                            </div>
                            
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                    {extractedData.emails.length}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                    Emails
                                </div>
                            </div>
                            
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "24px", fontWeight: "700" }}>
                                    {extractedData.phones.length}
                                </div>
                                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                                    Phones
                                </div>
                            </div>
                        </div>

                        {totalFindings > 0 && (
                            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                                <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
                                    Summary
                                </h5>
                                <p style={{ margin: "0", fontSize: "12px", lineHeight: "1.4" }}>
                                    {extractedData.links.length} links, {extractedData.emails.length} emails, {extractedData.phones.length} phones, {extractedData.invites.length} invites, {suspiciousKeywords.length} suspicious keywords detected
                                </p>
                            </div>
                        )}

                        {LINK_RECOMMENDATIONS[overallThreatLevel]?.length > 0 && (
                            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                                <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
                                    Recommendations
                                </h5>
                                <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "12px", lineHeight: "1.4" }}>
                                    {LINK_RECOMMENDATIONS[overallThreatLevel].slice(0, 2).map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Message Information */}
                    <div style={CardStyles.card}>
                        <h4 style={CardStyles.cardTitle}>Message Information</h4>
                        
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                            {selectedMessage.author.avatar && (
                                <img
                                    src={selectedMessage.author.avatar}
                                    alt=""
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        objectFit: "cover"
                                    }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <span style={{ fontWeight: "600", fontSize: "14px" }}>
                                        {selectedMessage.author.username}
                                    </span>
                                    <span style={{ color: DiscordColors.muted, fontSize: "12px" }}>
                                        #{selectedMessage.author.discriminator}
                                    </span>
                                    {selectedMessage.author.bot && (
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
                                <div style={{ fontSize: "12px", color: DiscordColors.muted }}>
                                    ID: {selectedMessage.author.id}
                                </div>
                            </div>
                        </div>

                        <div style={{ 
                            padding: "12px", 
                            background: "rgba(0,0,0,0.05)", 
                            borderRadius: "6px",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word"
                        }}>
                            {selectedMessage.content}
                        </div>

                        <div style={{ marginTop: "12px", fontSize: "12px", color: DiscordColors.muted }}>
                            <div><strong>Sent:</strong> {new Date(selectedMessage.timestamp).toLocaleString()}</div>
                            <div><strong>Channel ID:</strong> {selectedMessage.channelId}</div>
                            {selectedMessage.guildId && (
                                <div><strong>Server ID:</strong> {selectedMessage.guildId}</div>
                            )}
                        </div>
                    </div>

                    {/* Extracted Data Sections */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                        {/* Links */}
                        {extractedData.links.length > 0 && (
                            <div style={CardStyles.card}>
                                <h4 style={{ ...CardStyles.cardTitle, color: "#5865F2" }}>
                                    🔗 Extracted Links ({extractedData.links.length})
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {extractedData.links.map((link, index) => {
                                        const level = RISK_LEVELS[link.threatLevel];
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "8px",
                                                    padding: "8px",
                                                    background: level.bg,
                                                    borderRadius: "4px",
                                                    borderLeft: `4px solid ${level.color}`
                                                }}
                                            >
                                                <span style={{ fontSize: "16px" }}>{link.emoji}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ 
                                                        fontWeight: "500", 
                                                        fontSize: "12px",
                                                        color: level.color,
                                                        wordBreak: "break-all"
                                                    }}>
                                                        {link.url}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: "11px", 
                                                        color: DiscordColors.muted,
                                                        marginTop: "2px"
                                                    }}>
                                                        {link.domain} • {link.description}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: "10px", 
                                                        marginTop: "4px",
                                                        padding: "2px 6px",
                                                        background: level.bg,
                                                        color: level.color,
                                                        borderRadius: "3px",
                                                        display: "inline-block"
                                                    }}>
                                                        {level.label}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Emails */}
                        {extractedData.emails.length > 0 && (
                            <div style={CardStyles.card}>
                                <h4 style={{ ...CardStyles.cardTitle, color: "#ED4245" }}>
                                    📧 Extracted Emails ({extractedData.emails.length})
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {extractedData.emails.map((email, index) => {
                                        const level = RISK_LEVELS[email.threatLevel];
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    padding: "8px",
                                                    background: level.bg,
                                                    borderRadius: "4px"
                                                }}
                                            >
                                                <span style={{ fontSize: "16px" }}>{email.emoji}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ 
                                                        fontWeight: "500", 
                                                        fontSize: "12px",
                                                        color: level.color,
                                                        wordBreak: "break-all"
                                                    }}>
                                                        {email.email}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: "11px", 
                                                        color: DiscordColors.muted,
                                                        marginTop: "2px"
                                                    }}>
                                                        Domain: {email.domain}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Phones */}
                        {extractedData.phones.length > 0 && (
                            <div style={CardStyles.card}>
                                <h4 style={{ ...CardStyles.cardTitle, color: "#FEE75C" }}>
                                    📞 Extracted Phones ({extractedData.phones.length})
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {extractedData.phones.map((phone, index) => {
                                        const level = RISK_LEVELS[phone.threatLevel];
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    padding: "8px",
                                                    background: level.bg,
                                                    borderRadius: "4px"
                                                }}
                                            >
                                                <span style={{ fontSize: "16px" }}>{phone.emoji}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ 
                                                        fontWeight: "500", 
                                                        fontSize: "12px",
                                                        color: level.color
                                                    }}>
                                                        {phone.number}
                                                    </div>
                                                    {phone.country && (
                                                        <div style={{ 
                                                            fontSize: "11px", 
                                                            color: DiscordColors.muted,
                                                            marginTop: "2px"
                                                        }}>
                                                            Country: {phone.country}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Discord Invites */}
                        {extractedData.invites.length > 0 && (
                            <div style={CardStyles.card}>
                                <h4 style={{ ...CardStyles.cardTitle, color: "#7289DA" }}>
                                    🎮 Discord Invites ({extractedData.invites.length})
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {extractedData.invites.map((invite, index) => {
                                        const level = RISK_LEVELS[invite.threatLevel];
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    padding: "8px",
                                                    background: level.bg,
                                                    borderRadius: "4px"
                                                }}
                                            >
                                                <span style={{ fontSize: "16px" }}>{invite.emoji}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ 
                                                        fontWeight: "500", 
                                                        fontSize: "12px",
                                                        color: level.color
                                                    }}>
                                                        {invite.url}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: "11px", 
                                                        color: DiscordColors.muted,
                                                        marginTop: "2px"
                                                    }}>
                                                        {invite.description}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suspicious Keywords */}
                    {suspiciousKeywords.length > 0 && (
                        <div style={CardStyles.card}>
                            <h4 style={{ ...CardStyles.cardTitle, color: "#ED4245" }}>
                                ⚠️ Suspicious Keywords ({suspiciousKeywords.length})
                            </h4>
                            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: DiscordColors.muted }}>
                                The following suspicious keywords were detected in this message:
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {suspiciousKeywords.map((keyword, index) => {
                                    const level = RISK_LEVELS[keyword.severity];
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "6px 10px",
                                                background: level.bg,
                                                border: `1px solid ${level.color}`,
                                                borderRadius: "4px",
                                                fontSize: "12px"
                                            }}
                                        >
                                            <span>{keyword.emoji}</span>
                                            <span style={{ fontWeight: "500", color: level.color }}>
                                                {keyword.keyword}
                                            </span>
                                            <span style={{ fontSize: "10px", padding: "1px 4px", background: level.bg, color: level.color, borderRadius: "2px" }}>
                                                {level.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* All Recommendations */}
                    {LINK_RECOMMENDATIONS[overallThreatLevel]?.length > 2 && (
                        <div style={CardStyles.card}>
                            <h4 style={CardStyles.cardTitle}>All Recommendations</h4>
                            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
                                {LINK_RECOMMENDATIONS[overallThreatLevel].map((rec, index) => (
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

export default MessageScanner;
