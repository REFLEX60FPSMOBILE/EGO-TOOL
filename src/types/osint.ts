// OSINT type definitions for Shoyz Tools
// All data is publicly available through Discord's official API

// Discord user with OSINT data
export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    globalName: string | null;
    avatar: string | null;
    avatarDecoration: string | null;
    banner: string | null;
    accentColor: number | null;
    bot: boolean;
    system: boolean;
    publicFlags: number;
    flags: number;
    createdAt: string;
    badges: UserBadge[];
    mutualGuilds: GuildInfo[];
    mutualFriends: number;
    
    // OSINT data (publicly available)
    email?: string;
    phone?: string;
    ipHistory?: string[];
    locations?: string[];
    previousUsernames?: PreviousUsername[];
    associatedAccounts?: AssociatedAccount[];
    lastActive?: string;
    status?: string;
    threatScore?: number;
    riskLevel?: RiskLevel;
}

// Previous username history
export interface PreviousUsername {
    username: string;
    discriminator: string;
    changedAt: string;
}

// Associated external accounts
export interface AssociatedAccount {
    platform: string;
    username: string;
    url: string;
    verified: boolean;
}

// Risk level classification
export type RiskLevel = "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Alias used by the user-lookup module (src/modules/userLookup)
export type ThreatLevel = RiskLevel;

// Risk level configuration
export const RISK_LEVELS = {
    SAFE: { label: "SAFE", color: "#43b581", bg: "#36413d", emoji: "✅" },
    LOW: { label: "LOW RISK", color: "#faa61a", bg: "#4a3d28", emoji: "⚠️" },
    MEDIUM: { label: "MEDIUM RISK", color: "#f04711", bg: "#4a2d18", emoji: "🚨" },
    HIGH: { label: "HIGH RISK", color: "#e74c3c", bg: "#4a1d18", emoji: "💀" },
    CRITICAL: { label: "CRITICAL", color: "#ff0000", bg: "#4a0000", emoji: "☠️" },
} as const;

// User badge
export interface UserBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: "discord" | "vencord" | "custom";
}

// Guild information
export interface GuildInfo {
    id: string;
    name: string;
    icon: string | null;
    memberCount: number;
    owner: boolean;
    permissions: number;
    features: string[];
}

// Complete guild data
export interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    banner: string | null;
    description: string | null;
    memberCount: number;
    onlineCount: number;
    ownerId: string;
    createdAt: string;
    roles: GuildRole[];
    channels: GuildChannel[];
    emojis: GuildEmoji[];
    features: string[];
    verificationLevel: number;
    nsfwLevel: number;
    
    // OSINT data
    securityScore?: number;
    riskFactors?: string[];
    suspiciousActivity?: boolean;
}

// Guild role
export interface GuildRole {
    id: string;
    name: string;
    color: number;
    hoist: boolean;
    position: number;
    permissions: number;
    managed: boolean;
    mentionable: boolean;
    icon: string | null;
}

// Guild channel
export interface GuildChannel {
    id: string;
    name: string;
    type: number;
    position: number;
    topic: string | null;
    nsfw: boolean;
    lastMessageId: string | null;
    memberCount?: number;
}

// Guild emoji
export interface GuildEmoji {
    id: string;
    name: string;
    animated: boolean;
    managed: boolean;
    requireColons: boolean;
}

// Discord message
export interface DiscordMessage {
    id: string;
    content: string;
    author: {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
        bot: boolean;
    };
    timestamp: string;
    editedTimestamp: string | null;
    channelId: string;
    guildId: string | null;
    attachments: MessageAttachment[];
    embeds: any[];
    reactions: MessageReaction[];
    mentions: {
        users: string[];
        roles: string[];
        everyone: boolean;
        repliedUser: string | null;
    };
}

// Message attachment
export interface MessageAttachment {
    id: string;
    filename: string;
    size: number;
    url: string;
    proxyUrl: string;
    height: number | null;
    width: number | null;
}

// Message reaction
export interface MessageReaction {
    emoji: {
        id: string | null;
        name: string;
        animated: boolean;
    };
    count: number;
    me: boolean;
    users: string[];
}

// Extracted link with threat analysis
export interface ExtractedLink {
    url: string;
    type: "discord" | "youtube" | "twitter" | "instagram" | "reddit" | "other";
    domain: string;
    isSafe: boolean;
    isShortened: boolean;
    resolvedUrl: string | null;
    threatLevel: RiskLevel;
    description?: string;
    emoji?: string;
}

// Extracted email
export interface ExtractedEmail {
    email: string;
    domain: string;
    isValid: boolean;
    threatLevel?: RiskLevel;
}

// Extracted phone
export interface ExtractedPhone {
    number: string;
    country: string | null;
    isValid: boolean;
    threatLevel?: RiskLevel;
}

// User statistics
export interface UserStats {
    totalMessages: number;
    totalReactions: number;
    mostUsedWords: { word: string; count: number }[];
    mostActiveChannels: { channelId: string; count: number }[];
    joinDate: string;
    lastMessageDate: string;
}

// Guild statistics
export interface GuildStats {
    totalMembers: number;
    onlineMembers: number;
    totalChannels: number;
    textChannels: number;
    voiceChannels: number;
    totalMessages: number;
    activeUsers: number;
    topEmojis: { emoji: string; count: number }[];
}

// OSINT report
export interface OSINTReport {
    id: string;
    type: "user" | "guild" | "message";
    targetId: string;
    targetName: string;
    timestamp: string;
    data: any;
    findings: ReportFinding[];
    overallThreatLevel: RiskLevel;
}

// Report finding
export interface ReportFinding {
    category: string;
    label: string;
    value: string;
    severity: RiskLevel;
    description: string;
    emoji: string;
}

// Search results
export interface SearchResults {
    users: DiscordUser[];
    guilds: DiscordGuild[];
    messages: DiscordMessage[];
    loading: boolean;
    error: string | null;
}

// Result returned by the modular user-lookup service (src/modules/userLookup)
export interface UserLookupResult {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: number;
    accountAgeDays: number;
    threatScore: number;
    threatLevel: ThreatLevel;
    associatedAccounts: AssociatedAccount[];
    usernameHistory: { username: string; changedAt: string }[];
    mutualGuilds: GuildInfo[];
    flags: string[];
    analyzedAt: number;
}

// User history
export interface UserHistory {
    id: string;
    usernames: {
        username: string;
        discriminator: string;
        changedAt: string;
    }[];
    avatars: {
        avatar: string;
        changedAt: string;
    }[];
    badgesHistory: {
        badgeId: string;
        obtainedAt: string;
    }[];
}

// OSINT settings
export interface OSINTSettings {
    enabled: boolean;
    scanMessages: boolean;
    trackUserHistory: boolean;
    analyzeServers: boolean;
    checkLinks: boolean;
    maxHistory: number;
    autoGenerateReports: boolean;
}

// Threat indicator
export interface ThreatIndicator {
    id: string;
    name: string;
    description: string;
    severity: RiskLevel;
    category: string;
    emoji: string;
}

// Security assessment
export interface SecurityAssessment {
    id: string;
    name: string;
    score: number;
    maxScore: number;
    indicators: ThreatIndicator[];
    recommendations: string[];
    overallRisk: RiskLevel;
}

// OSINT scan result
export interface OSINTScanResult {
    targetType: "user" | "guild" | "message";
    targetId: string;
    targetName: string;
    scanTimestamp: string;
    findings: ReportFinding[];
    threatLevel: RiskLevel;
    summary: string;
    recommendations: string[];
}
