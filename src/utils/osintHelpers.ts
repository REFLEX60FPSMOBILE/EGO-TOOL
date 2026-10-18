// OSINT utility functions for EGO TOOL
// All functions process publicly available data from Discord's API

import { 
    DiscordUser, 
    DiscordGuild, 
    ExtractedLink, 
    ExtractedEmail,
    ExtractedPhone
} from "../types/osint";

// Regular expressions for data extraction
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\b(?:\+?(\d{1,3}))?[-.\s]?\(?(\d{1,4})\)?[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})\b/g;
const URL_REGEX = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*))/g;
const DISCORD_INVITE_REGEX = /(?:discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)([a-zA-Z0-9-]+)/g;

// URL shortener domains
const SHORTENERS = [
    "bit.ly", "goo.gl", "tinyurl.com", "t.co", "is.gd", "buff.ly",
    "adf.ly", "j.mp", "bc.vc", "twitthis.com", "u.to", "x.co",
    "cutt.ly", "shorturl.at", "rb.gy", "shorte.st", "soo.gd"
];

// Social platform domains
const SOCIAL_PLATFORMS = {
    discord: ["discord.gg", "discord.com", "discordapp.com"],
    youtube: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
    twitter: ["twitter.com", "x.com"],
    instagram: ["instagram.com", "instagr.am"],
    reddit: ["reddit.com", "old.reddit.com"],
    facebook: ["facebook.com", "fb.com"],
    tiktok: ["tiktok.com", "vm.tiktok.com"],
    twitch: ["twitch.tv"],
    github: ["github.com"],
    steam: ["steamcommunity.com", "store.steampowered.com"],
};

// Check if a URL is safe (whitelist based)
export function isSafeUrl(url: string): boolean {
    try {
        const domain = new URL(url).hostname.toLowerCase();
        
        // Check if it's a known safe platform
        for (const domains of Object.values(SOCIAL_PLATFORMS)) {
            if (domains.some(d => domain.includes(d))) {
                return true;
            }
        }
        
        // Check if it's a shortener (not safe)
        if (SHORTENERS.some(shortener => domain.includes(shortener))) {
            return false;
        }
        
        return false;
    } catch {
        return false;
    }
}

// Extract all links from text
export function extractLinks(text: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    const urlMatches = text.match(URL_REGEX) || [];
    
    for (const url of urlMatches) {
        try {
            const domain = new URL(url).hostname.toLowerCase();
            let type: "discord" | "youtube" | "twitter" | "instagram" | "reddit" | "other" = "other";
            
            for (const [platform, domains] of Object.entries(SOCIAL_PLATFORMS)) {
                if (domains.some(d => domain.includes(d))) {
                    type = platform as any;
                    break;
                }
            }
            
            links.push({
                url,
                type,
                domain,
                isSafe: isSafeUrl(url),
                isShortened: SHORTENERS.some(shortener => domain.includes(shortener)),
                resolvedUrl: null,
                threatLevel: "LOW"
            });
        } catch {
            // Invalid URL, skip
        }
    }
    
    return links;
}

// Extract Discord invites
export function extractDiscordInvites(text: string): string[] {
    const invites: string[] = [];
    const matches = text.match(DISCORD_INVITE_REGEX) || [];
    
    for (const match of matches) {
        invites.push(match);
    }
    
    return invites;
}

// Extract email addresses
export function extractEmails(text: string): ExtractedEmail[] {
    const emails: ExtractedEmail[] = [];
    const matches = text.match(EMAIL_REGEX) || [];
    
    for (const email of matches) {
        const domain = email.split("@")[1];
        emails.push({
            email,
            domain,
            isValid: true
        });
    }
    
    return emails;
}

// Extract phone numbers
export function extractPhones(text: string): ExtractedPhone[] {
    const phones: ExtractedPhone[] = [];
    const matches = text.match(PHONE_REGEX) || [];
    
    for (const match of matches) {
        phones.push({
            number: match,
            country: null,
            isValid: true
        });
    }
    
    return phones;
}

// Format date for display
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format number with commas
export function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Calculate account age
export function getAccountAge(createdAt: string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (months > 0) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return "Today";
    }
}

// Check if user has Nitro
export function hasNitro(user: DiscordUser): boolean {
    return (user.publicFlags & 0x40) === 0x40;
}

// Check if user has Early Supporter badge
export function hasEarlySupporter(user: DiscordUser): boolean {
    return (user.publicFlags & 0x200) === 0x200;
}

// Check if user is verified
export function isVerified(user: DiscordUser): boolean {
    return (user.publicFlags & 0x40000) === 0x40000;
}

// Check if user is a bot
export function isBot(user: DiscordUser): boolean {
    return user.bot;
}

// Check if user has moderator permissions
export function isModerator(user: DiscordUser, guildId: string): boolean {
    const guild = user.mutualGuilds.find(g => g.id === guildId);
    if (!guild) return false;
    
    // Check for common moderator permissions
    const moderatorPermissions = [
        0x2,      // Kick members
        0x4,      // Ban members
        0x8,      // Administrator
        0x20,     // Manage channels
        0x40,     // Manage guild
        0x100,    // Manage messages
        0x200,    // Manage roles
    ];
    
    return moderatorPermissions.some(p => (guild.permissions & p) === p);
}

// Generate user summary
export function generateUserSummary(user: DiscordUser): string {
    const parts: string[] = [];
    
    if (user.bot) {
        parts.push("Bot");
    }
    
    if (hasNitro(user)) {
        parts.push("Nitro");
    }
    
    if (hasEarlySupporter(user)) {
        parts.push("Early Supporter");
    }
    
    if (isVerified(user)) {
        parts.push("Verified");
    }
    
    if (user.mutualFriends > 0) {
        parts.push(`${user.mutualFriends} mutual friends`);
    }
    
    if (user.mutualGuilds.length > 0) {
        parts.push(`${user.mutualGuilds.length} mutual servers`);
    }
    
    return parts.join(", ");
}

// Generate guild summary
export function generateGuildSummary(guild: DiscordGuild): string {
    const parts: string[] = [];
    
    if (guild.features.length > 0) {
        parts.push(guild.features.join(", "));
    }
    
    parts.push(`${formatNumber(guild.memberCount)} members`);
    parts.push(`${guild.channels.length} channels`);
    
    return parts.join(", ");
}

// Calculate threat score for user (0-10)
export function calculateUserThreatScore(user: DiscordUser): number {
    let score = 0;
    
    // New account (less than 30 days)
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (accountAgeDays < 30) {
        score += 3;
    } else if (accountAgeDays < 90) {
        score += 1;
    }
    
    // No avatar
    if (!user.avatar) {
        score += 0.5;
    }
    
    // Default username (no global name)
    if (!user.globalName || user.globalName === user.username) {
        score += 0.5;
    }
    
    // No mutual servers
    if (user.mutualGuilds.length === 0) {
        score += 1;
    }
    
    // No mutual friends
    if (user.mutualFriends === 0) {
        score += 0.5;
    }
    
    // Bot accounts are generally safer
    if (user.bot) {
        score -= 2;
    }
    
    // Verified accounts are safer
    if (isVerified(user)) {
        score -= 1;
    }
    
    // Clamp score between 0 and 10
    return Math.min(10, Math.max(0, score));
}

// Calculate security score for guild (0-100)
export function calculateGuildSecurityScore(guild: DiscordGuild): number {
    let score = 50; // Base score
    
    // Verification level
    if (guild.verificationLevel >= 3) {
        score += 20;
    } else if (guild.verificationLevel >= 2) {
        score += 10;
    } else if (guild.verificationLevel === 0) {
        score -= 15;
    }
    
    // NSFW level
    if (guild.nsfwLevel === 0) {
        score += 10;
    } else if (guild.nsfwLevel >= 3) {
        score -= 10;
    }
    
    // Server age
    const ageDays = Math.floor((Date.now() - new Date(guild.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays > 365) {
        score += 15;
    } else if (ageDays > 180) {
        score += 10;
    } else if (ageDays < 30) {
        score -= 20;
    }
    
    // Member count
    if (guild.memberCount > 10000) {
        score += 5;
    } else if (guild.memberCount < 10) {
        score -= 10;
    }
    
    // Has description
    if (guild.description) {
        score += 5;
    }
    
    // Has icon
    if (guild.icon) {
        score += 5;
    }
    
    // Clamp score between 0 and 100
    return Math.min(100, Math.max(0, score));
}

// Identify risk factors for guild
export function identifyGuildRiskFactors(guild: DiscordGuild): string[] {
    const factors: string[] = [];
    
    // No verification
    if (guild.verificationLevel === 0) {
        factors.push("No verification requirements");
    }
    
    // High NSFW
    if (guild.nsfwLevel >= 3) {
        factors.push("High NSFW level");
    } else if (guild.nsfwLevel >= 2) {
        factors.push("NSFW content allowed");
    }
    
    // New server
    const ageDays = Math.floor((Date.now() - new Date(guild.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays < 30) {
        factors.push("Very new server (less than 30 days)");
    } else if (ageDays < 90) {
        factors.push("New server (less than 3 months)");
    }
    
    // Low member count
    if (guild.memberCount < 10) {
        factors.push("Very low member count");
    } else if (guild.memberCount < 100) {
        factors.push("Low member count");
    }
    
    // High member count (may attract spam)
    if (guild.memberCount > 100000) {
        factors.push("Very high member count may attract spam");
    }
    
    // No description
    if (!guild.description) {
        factors.push("No server description");
    }
    
    // No icon
    if (!guild.icon) {
        factors.push("No server icon");
    }
    
    // Check for admin permissions on @everyone
    const everyoneRole = guild.roles.find(r => r.name === "@everyone");
    if (everyoneRole && (everyoneRole.permissions & 0x8) === 0x8) {
        factors.push("@everyone role has administrator permissions");
    }
    
    return factors;
}

// Identify suspicious keywords in text
export function identifySuspiciousKeywords(text: string): string[] {
    const keywords = [
        "free nitro", "free money", "password", "enter your password",
        "click here", "limited time", "act now", "scam", "hack",
        "exploit", "virus", "malware", "phishing", "steal",
        "account", "login", "credentials", "social security",
        "credit card", "bank", "paypal", "bitcoin", "crypto"
    ];
    
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
            found.push(keyword);
        }
    }
    
    return found;
}

// Check if text contains Discord invite
export function containsDiscordInvite(text: string): boolean {
    return DISCORD_INVITE_REGEX.test(text);
}

// Get user's display name
export function getDisplayName(user: DiscordUser): string {
    return user.globalName || user.username;
}

// Get user's full identifier
export function getUserIdentifier(user: DiscordUser): string {
    return `${user.username}#${user.discriminator} (${user.id})`;
}

// Get guild's display name
export function getGuildDisplayName(guild: DiscordGuild): string {
    return guild.name;
}

// Get guild's full identifier
export function getGuildIdentifier(guild: DiscordGuild): string {
    return `${guild.name} (${guild.id})`;
}
