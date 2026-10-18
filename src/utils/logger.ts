// Structured logger for EGO TOOL
// Usage:
//   const log = createLogger("themeEngine");
//   log.info("applied preset", presetId);
//   log.debug(...)  // only shows when verbose logging is enabled
//
// Verbose state is centralized; index.tsx wires it to the plugin setting.

export type LogLevel = "debug" | "info" | "warn" | "error";

const PREFIX_STYLES = "color:#5865f2;font-weight:700";
const PREFIX_TEXT = "[EGO TOOL]";

let verbose = false;

export function setVerboseLogs(value: boolean): void {
    verbose = value;
}

export function getVerboseLogs(): boolean {
    return verbose;
}

function emit(level: LogLevel, module: string, args: unknown[]): void {
    const method =
        level === "error" ? console.error :
        level === "warn" ? console.warn :
        console.log;
    try {
        method(
            `${PREFIX_STYLES}%c${PREFIX_TEXT} ${module} [${level.toUpperCase()}]`,
            PREFIX_STYLES,
            "color:inherit",
            ...args
        );
    } catch {
        // logging must never break the plugin
    }
}

export interface ModuleLogger {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}

export function createLogger(module: string): ModuleLogger {
    return {
        debug: (...args) => { if (verbose) emit("debug", module, args); },
        info: (...args) => emit("info", module, args),
        warn: (...args) => emit("warn", module, args),
        error: (...args) => emit("error", module, args),
    };
}
