import { BADGE_CATEGORIES } from "./constants";
import { BADGE_SELECTORS, CUSTOM_ATTRS } from "./constants";

type BadgeKind = typeof BADGE_CATEGORIES[keyof typeof BADGE_CATEGORIES];

// Generate a unique key for a badge
export function generateBadgeKey(img: HTMLImageElement): { key: string; kind: BadgeKind } {
    const src = img.currentSrc || img.src || "";
    
    // Official Discord badges
    const discordMatch = src.match(/badge-icons\/([a-zA-Z0-9_-]+)/);
    if (discordMatch) {
        return { key: `d:${discordMatch[1]}`, kind: BADGE_CATEGORIES.DISCORD };
    }
    
    // Vencord badges
    if (img.classList.contains("vc-user-badge")) {
        const name = img.alt?.trim() || img.getAttribute("aria-label") || src.split("?")[0];
        return { key: `v:${name}`, kind: BADGE_CATEGORIES.VENCORD };
    }
    
    // Custom or other badges
    const customName = img.alt?.trim() || img.getAttribute("aria-label") || "";
    if (customName) {
        return { key: `c:${customName}`, kind: BADGE_CATEGORIES.CUSTOM };
    }
    
    return { key: `o:${src.split("?")[0].slice(-80)}`, kind: BADGE_CATEGORIES.OTHER };
}

// Get badge label
export function getBadgeLabel(img: HTMLImageElement, key: string): string {
    const alt = img.alt?.trim();
    if (alt) return alt;
    
    const aria = img.closest("[aria-label]")?.getAttribute("aria-label")?.trim();
    if (aria) return aria;
    
    const title = img.title?.trim();
    if (title) return title;
    
    return `Badge ${key.slice(2, 10)}`;
}

// Resolve badge target element
export function resolveBadgeTarget(img: HTMLElement): HTMLElement {
    let target = img;
    for (let i = 0; i < 3; i++) {
        const parent = target.parentElement;
        if (!parent || parent.matches(BADGE_SELECTORS.CONTAINERS) || parent.childElementCount > 1) break;
        target = parent;
    }
    return target;
}

// Hide or show an element with custom attribute
export function setElementHidden(el: HTMLElement, hidden: boolean, attr: string): void {
    if (hidden) {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.setAttribute(attr, "true");
    } else {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.removeAttribute(attr);
    }
}

// Check if element is hidden
export function isElementHidden(el: HTMLElement, attr: string): boolean {
    return el.getAttribute(attr) === "true";
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Batch process elements
export function batchProcess<T>(items: T[], processFn: (item: T) => void, batchSize = 50): void {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        requestAnimationFrame(() => {
            batch.forEach(item => processFn(item));
        });
    }
}

// Deep clone object
export function deepClone<T>(obj: T): T {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch {
        return obj;
    }
}

// Generate unique ID
export function generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Hash a PIN (djb2) before storing it — PasscodeLock
export function hashPin(pin: string): string {
    let hash = 5381;
    for (let i = 0; i < pin.length; i++) {
        hash = ((hash << 5) + hash + pin.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
}

// Wait for selector to appear in DOM
export function waitForSelector(selector: string, timeout = 10000): Promise<Element | null> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const check = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime < timeout) {
                requestAnimationFrame(check);
            } else {
                resolve(null);
            }
        };
        
        check();
    });
}

// Cleanup all injected elements
export function cleanupAll(): void {
    const styles = document.querySelectorAll('style[id^="vc-"]');
    styles.forEach(style => style.remove());
    
    const elements = document.querySelectorAll(`[${CUSTOM_ATTRS.HIDDEN}], [${CUSTOM_ATTRS.MODERATED}]`);
    elements.forEach(el => {
        (el as HTMLElement).style.removeProperty("display");
        (el as HTMLElement).style.removeProperty("visibility");
        (el as HTMLElement).style.removeProperty("opacity");
        el.removeAttribute(CUSTOM_ATTRS.HIDDEN);
        el.removeAttribute(CUSTOM_ATTRS.MODERATED);
    });
}
