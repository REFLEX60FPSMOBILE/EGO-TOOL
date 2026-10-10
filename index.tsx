/*
 * EGO TOOL - Vencord userplugin entry point
 * Made by shoyzontop
 *
 * Vencord loads userplugins from an index.ts(x) file at the ROOT of the
 * plugin folder. This file simply re-exports the plugin defined in src/.
 */

export { default } from "./src/index";
export * from "./src/index";
