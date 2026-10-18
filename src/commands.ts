// /ego slash commands for EGO TOOL
// Registered via Vencord's @api/Commands and unregistered on plugin stop.
// Response style: plain "echo" replies ({ content }) so results stay local.

import { registerCommand } from "@api/Commands";
import type { ModerationStats, TodoItem, ReminderItem, UiModes } from "./types";
import type { ModuleLogger } from "./utils/logger";

export interface EgoCommandHandlers {
    log: ModuleLogger;
    getUptimeMs(): number;
    getStartedAt(): number;
    getPresetName(): string;
    getModes(): UiModes;
    getGamingAutoDnd(): boolean;
    onToggleMode(mode: string): boolean;
    onToggleGamingAutoDnd(): boolean;
    onAddReminder(text: string, minutes: number): void;
    getModerationEnabled(): boolean;
    getModerationStats(): ModerationStats;
    getTodoTasks(): TodoItem[];
    getReminders(): ReminderItem[];
    getBadgeCatalogSize(): number;
    isVerboseEnabled(): boolean;
    onToggleVerbose(value: boolean): boolean;
}

export interface EgoCommandRegistry {
    stop(): void;
}

const APPLICATION_COMMAND_OPTION_TYPE_STRING = 3; // ApplicationCommandOptionType.STRING (discord-types)
const APPLICATION_COMMAND_OPTION_TYPE_INTEGER = 4; // ApplicationCommandOptionType.INTEGER

const MODE_LABELS: Record<string, string> = {
    focus: "🎯 Focus",
    stream: "🎥 Stream",
    gaming: "🎮 Gaming",
    staff: "🛡️ Staff",
};

function formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function setupEgoCommands(handlers: EgoCommandHandlers): EgoCommandRegistry {
    const unregisters: (() => void)[] = [];
    const { log } = handlers;

    const register = (def: Record<string, unknown>) => {
        try {
            const registered = registerCommand(def);
            if (typeof registered?.unregister === "function") unregisters.push(registered.unregister);
        } catch (e) {
            log.error("registerCommand failed for", def.name, e);
        }
    };

    // ---------------------------------------------------------------- /ego status
    register({
        name: "ego-status",
        description: "EGO TOOL — état du plugin",
        options: [],
        execute: (args?: unknown[]) => {
            void args;
            const modes = handlers.getModes();
            const active = Object.entries(MODE_LABELS)
                .filter(([k]) => modes[k as keyof UiModes])
                .map(([, label]) => label);
            const pendingTodos = handlers.getTodoTasks().filter(t => !t.done).length;
            const content = [
                "**EGO TOOL** — v1.1.0",
                `⏱️ uptime : ${formatDuration(handlers.getUptimeMs())}`,
                `🎨 thème : \`${handlers.getPresetName()}\``,
                `🧩 modes actifs : ${active.length ? active.join(", ") : "aucun"}`,
                `🚫 Auto-DND : ${handlers.getGamingAutoDnd() ? "ON" : "off"}  ·  🛡️ modération : ${handlers.getModerationEnabled() ? "ON" : "off"}`,
                `✅ todos : ${pendingTodos} en cours  ·  ⏰ reminders : ${handlers.getReminders().length}  ·  🏅 badges catalogués : ${handlers.getBadgeCatalogSize()}`,
                `📝 logs verbeux : ${handlers.isVerboseEnabled() ? "ON" : "off"}`,
            ].join("\n");
            log.debug("/ego-status executed");
            return { content };
        },
    });

    // ---------------------------------------------------------------- /ego mode
    register({
        name: "ego-mode",
        description: "EGO TOOL — basculer un mode (focus | stream | gaming | staff | autodnd)",
        options: [
            {
                name: "mode",
                description: "Mode à basculer",
                type: APPLICATION_COMMAND_OPTION_TYPE_STRING,
                required: true,
            },
        ],
        execute: (args?: unknown[]) => {
            const mode = String((args?.[0] as { value?: unknown } | undefined)?.value ?? "").toLowerCase();
            if (mode === "autodnd") {
                const value = handlers.onToggleGamingAutoDnd();
                return { content: `🚫 Auto-DND : **${value ? "ON" : "off"}**` };
            }
            if (!(mode in MODE_LABELS)) {
                return { content: `❌ Mode inconnu. Options : ${[...Object.keys(MODE_LABELS), "autodnd"].join(" | ")}` };
            }
            const active = handlers.onToggleMode(mode);
            return { content: `${MODE_LABELS[mode]} : **${active ? "ON" : "off"}**` };
        },
    });

    // ---------------------------------------------------------------- /ego remind
    register({
        name: "ego-remind",
        description: "EGO TOOL — créer un reminder dans X minutes",
        options: [
            { name: "minutes", description: "Dans combien de minutes", type: APPLICATION_COMMAND_OPTION_TYPE_INTEGER, required: true },
            { name: "texte", description: "Objet du rappel", type: APPLICATION_COMMAND_OPTION_TYPE_STRING, required: true },
        ],
        execute: (args?: unknown[]) => {
            const minutes = Number((args?.[0] as { value?: unknown } | undefined)?.value ?? 0);
            const text = String((args?.[1] as { value?: unknown } | undefined)?.value ?? "").trim();
            if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 10080) {
                return { content: "❌ Minutes invalide (1 à 10080)." };
            }
            if (!text) return { content: "❌ Texte manquant." };
            handlers.onAddReminder(text, minutes);
            return { content: `⏰ Reminder créé : « ${text} » dans ${minutes} min.` };
        },
    });

    // ---------------------------------------------------------------- /ego stats
    register({
        name: "ego-stats",
        description: "EGO TOOL — statistiques de modération et d'usage",
        options: [],
        execute: (args?: unknown[]) => {
            void args;
            const stats = handlers.getModerationStats();
            return {
                content: [
                    "**EGO TOOL — Stats**",
                    `⏱️ uptime : ${formatDuration(handlers.getUptimeMs())}`,
                    `💬 messages analysés : ${stats.totalMessages}`,
                    `🚫 cachés : ${stats.hiddenMessages}  ·  ⚠️ avertis : ${stats.warnedUsers}  ·  🛑 bloqués : ${stats.blockedUsers}`,
                    `🏅 badges catalogués : ${handlers.getBadgeCatalogSize()}`,
                ].join("\n"),
            };
        },
    });

    // ---------------------------------------------------------------- /ego debug
    register({
        name: "ego-debug",
        description: "EGO TOOL — activer/couper les logs verbeux dans la console",
        options: [
            { name: "etat", description: "on ou off", type: APPLICATION_COMMAND_OPTION_TYPE_STRING, required: true },
        ],
        execute: (args?: unknown[]) => {
            const raw = String((args?.[0] as { value?: unknown } | undefined)?.value ?? "").toLowerCase();
            if (raw !== "on" && raw !== "off") return { content: "❌ Utilisation : /ego-debug etat:on|off" };
            const value = handlers.onToggleVerbose(raw === "on");
            return { content: `📝 Logs verbeux : **${value ? "ON" : "off"}**` };
        },
    });

    log.info("/ego commands registered (status, mode, remind, stats, debug)");

    return {
        stop(): void {
            for (const unregister of unregisters) {
                try { unregister(); } catch { /* noop */ }
            }
            log.info("/ego commands unregistered");
        },
    };
}
