import { React, useState, useCallback } from "@webpack/common";
import { CardStyles, ButtonStyles, InputStyles } from "../styles";
import { DiscordColors } from "../styles";
import { ExportData } from "../types";

interface ExportImportProps {
    onExport: () => ExportData;
    onImport: (data: ExportData) => void;
}

const ExportImport: React.FC<ExportImportProps> = ({ onExport, onImport }) => {
    const [importData, setImportData] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleExport = useCallback(() => {
        try {
            const data = onExport();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `shoyz-tools-export-${data.timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setSuccess("✅ Export successful! File has been downloaded.");
            setError(null);
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            setError("❌ Export error: " + (e as Error).message);
            setSuccess(null);
        }
    }, [onExport]);

    const handleImport = useCallback(() => {
        try {
            setError(null);
            setSuccess(null);
            
            if (!importData.trim()) {
                setError("❌ Please paste your export data.");
                return;
            }
            
            const data = JSON.parse(importData) as ExportData;
            
            if (!data.version || !data.settings) {
                setError("❌ Invalid import data format.");
                return;
            }
            
            onImport(data);
            setImportData("");
            setSuccess("✅ Import successful! Settings have been applied.");
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            setError("❌ Import error: " + (e as Error).message);
            setSuccess(null);
        }
    }, [importData, onImport]);

    const handleCopyToClipboard = useCallback(() => {
        try {
            const data = onExport();
            const json = JSON.stringify(data, null, 2);
            navigator.clipboard.writeText(json);
            setSuccess("✅ Export copied to clipboard!");
            setError(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            setError("❌ Failed to copy to clipboard.");
        }
    }, [onExport]);

    const handlePasteFromClipboard = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            setImportData(text);
            setSuccess("✅ Pasted from clipboard!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            setError("❌ Failed to paste from clipboard.");
        }
    }, []);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>📦 Export/Import</h3>
                    <p style={CardStyles.description}>
                        Backup and restore your plugin settings
                    </p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div style={{
                    padding: "12px",
                    backgroundColor: "rgba(79, 172, 254, 0.1)",
                    border: `1px solid ${DiscordColors.success}`,
                    borderRadius: "6px",
                    color: DiscordColors.success,
                    fontSize: "13px",
                    marginBottom: "16px",
                }}>
                    {success}
                </div>
            )}
            
            {error && (
                <div style={{
                    padding: "12px",
                    backgroundColor: "rgba(237, 66, 69, 0.1)",
                    border: `1px solid ${DiscordColors.danger}`,
                    borderRadius: "6px",
                    color: DiscordColors.danger,
                    fontSize: "13px",
                    marginBottom: "16px",
                }}>
                    {error}
                </div>
            )}

            {/* Export Section */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Export Settings</h4>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Save your current settings to a file
                </p>
                <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                }}>
                    <button
                        onClick={handleExport}
                        style={ButtonStyles.primary}
                    >
                        💾 Download Export File
                    </button>
                    <button
                        onClick={handleCopyToClipboard}
                        style={ButtonStyles.ghost}
                    >
                        📋 Copy to Clipboard
                    </button>
                </div>
                <p style={{
                    fontSize: "12px",
                    color: DiscordColors.textMuted,
                    margin: "8px 0 0 0",
                }}>
                    Export includes: Badge settings, UI customization, moderation rules, server settings
                </p>
            </div>

            {/* Import Section */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>Import Settings</h4>
                <p style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    margin: "0 0 12px 0",
                }}>
                    Restore settings from a previous export
                </p>
                <div style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                }}>
                    <button
                        onClick={handlePasteFromClipboard}
                        style={ButtonStyles.ghost}
                    >
                        📋 Paste from Clipboard
                    </button>
                </div>
                <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder={`Paste your export JSON here...
{
  "version": "1.0.0",
  "timestamp": 1234567890,
  "settings": { ... },
  "serverSettings": { ... }
}`}
                    style={{
                        ...InputStyles.textarea,
                        minHeight: "150px",
                        fontFamily: "monospace",
                    }}
                />
                <button
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    style={{
                        ...ButtonStyles.primary,
                        marginTop: "8px",
                    }}
                >
                    📥 Import Settings
                </button>
                <button
                    onClick={() => setImportData("")}
                    style={{
                        ...ButtonStyles.ghost,
                        marginTop: "8px",
                    }}
                >
                    Clear
                </button>
            </div>

            {/* Help Section */}
            <div style={{
                ...CardStyles.card,
                marginTop: "16px",
            }}>
                <h4 style={CardStyles.cardTitle}>Help</h4>
                <div style={{
                    fontSize: "13px",
                    color: DiscordColors.textMuted,
                    lineHeight: "1.6",
                }}>
                    <p style={{ margin: "0 0 12px 0" }}>
                        <strong>Export:</strong> Saves all your plugin settings to a JSON file. You can share this file or use it as a backup.
                    </p>
                    <p style={{ margin: "0 0 12px 0" }}>
                        <strong>Import:</strong> Restores settings from a previously exported JSON file. This will overwrite your current settings.
                    </p>
                    <p style={{ margin: "0" }}>
                        <strong>Note:</strong> Importing settings from a different Discord account may not work correctly as some IDs may not match.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportImport;
