// Server-specific settings utilities for EGO TOOL

import { BADGE_SELECTORS, CUSTOM_ATTRS } from "./constants";
import { generateBadgeKey, resolveBadgeTarget, setElementHidden } from "./helpers";

declare global {
    interface Window {
        DiscordNative?: {
            app?: {
                guilds?: {
                    getCurrentGuild?: () => { id?: string } | null;
                };
            };
        };
    }
}

// Get current server ID
export function getCurrentServerId(): string | null {
    try {
        // Try to get ID from URL
        const match = window.location.pathname.match(/\/channels\/(?:@me\/)?(\d+)/);
        if (match) {
            return match[1] || null;
        }
        
        // Try to get from DOM elements
        const serverElement = document.querySelector("[class*='guild'], [class*='server']");
        if (serverElement) {
            const id = serverElement.getAttribute("data-guild-id") || 
                       serverElement.getAttribute("data-id") ||
                       serverElement.id;
            if (id) return id;
        }
        
        // Try to get from Discord store
        if (window.DiscordNative) {
            const guild = window.DiscordNative?.app?.guilds?.getCurrentGuild?.();
            if (guild?.id) return guild.id;
        }
        
        return null;
    } catch (e) {
        console.log("Unable to get server ID", e);
        return null;
    }
}

// Get current server name
export function getCurrentServerName(): string {
    try {
        const nameElement = document.querySelector("[class*='guildName'], [class*='serverName'], [class*='title']");
        if (nameElement) {
            return nameElement.textContent?.trim() || "Unknown Server";
        }
        return "Unknown Server";
    } catch (e) {
        return "Unknown Server";
    }
}

// Apply badge hiding settings for a specific server
export function applyServerBadgeSettings(serverId: string, settings: {
    hideAll: boolean;
    hiddenBadges: Record<string, boolean>;
}) {
    const { hideAll, hiddenBadges } = settings;
    
    // Apply to all existing badges
    document.querySelectorAll<HTMLImageElement>(BADGE_SELECTORS.IMG).forEach((img) => {
        if (!img.src) return;
        
        const { key } = generateBadgeKey(img);
        const target = resolveBadgeTarget(img);
        const shouldHide = hideAll || !!hiddenBadges[key];
        
        setElementHidden(target, shouldHide, CUSTOM_ATTRS.HIDDEN);
        target.setAttribute("data-server-id", serverId);
    });
    
    // Observe new badges
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement;
                    const badges = element.querySelectorAll<HTMLImageElement>(BADGE_SELECTORS.IMG);
                    badges.forEach((img) => {
                        if (!img.src) return;
                        const { key } = generateBadgeKey(img);
                        const target = resolveBadgeTarget(img);
                        const shouldHide = hideAll || !!hiddenBadges[key];
                        setElementHidden(target, shouldHide, CUSTOM_ATTRS.HIDDEN);
                        target.setAttribute("data-server-id", serverId);
                    });
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
    
    return observer;
}

// Generate unique key for server settings
export function getServerSettingsKey(serverId: string): string {
    return `server-${serverId}`;
}

// Get settings for a server
export function getServerSettings(
    serverId: string,
    globalSettings: {
        badgeCatalog: Record<string, any>;
        hiddenBadges: Record<string, boolean>;
        hideAllBadges: boolean;
    }
): {
    hideAll: boolean;
    hiddenBadges: Record<string, boolean>;
} {
    // If no server-specific settings, use global settings
    return {
        hideAll: globalSettings.hideAllBadges,
        hiddenBadges: globalSettings.hiddenBadges,
    };
}

// Merge global and server settings
export function mergeServerSettings(
    globalSettings: {
        badgeCatalog: Record<string, any>;
        hiddenBadges: Record<string, boolean>;
        hideAllBadges: boolean;
    },
    serverSettings: Record<string, {
        hideBadges: boolean;
        hiddenBadges: Record<string, boolean>;
    }>,
    serverId: string
): {
    badgeCatalog: Record<string, any>;
    hiddenBadges: Record<string, boolean>;
    hideAll: boolean;
} {
    const serverConfig = serverSettings[serverId] || {};
    
    return {
        badgeCatalog: globalSettings.badgeCatalog,
        hiddenBadges: {
            ...globalSettings.hiddenBadges,
            ...serverConfig.hiddenBadges,
        },
        hideAll: serverConfig.hideBadges !== undefined 
            ? serverConfig.hideBadges 
            : globalSettings.hideAllBadges,
    };
}

// Check if in DM
export function isInDM(): boolean {
    try {
        const path = window.location.pathname;
        return path.includes("/channels/@me/") || path.includes("/channels/me/");
    } catch (e) {
        return false;
    }
}

// Check if in call
export function isInCall(): boolean {
    try {
        return document.querySelector("[class*='call'], [class*='voice']") !== null;
    } catch (e) {
        return false;
    }
}
