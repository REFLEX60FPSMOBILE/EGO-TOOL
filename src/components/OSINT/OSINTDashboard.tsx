import { React, useState, useCallback } from "@webpack/common";
import { TabStyles } from "../../styles";
import { DiscordColors } from "../../styles";
import UserLookup from "./UserLookup";
import ServerAnalysis from "./ServerAnalysis";
import MessageScanner from "./MessageScanner";

const OSINTDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("user");

    const tabs = [
        { id: "user", label: "User Lookup", icon: "👤" },
        { id: "server", label: "Server Analysis", icon: "🏢" },
        { id: "message", label: "Message Scanner", icon: "📧" },
    ];

    const renderContent = useCallback(() => {
        switch (activeTab) {
            case "user":
                return <UserLookup onUserSelect={(user) => console.log("User selected:", user)} />;
            case "server":
                return <ServerAnalysis />;
            case "message":
                return <MessageScanner />;
            default:
                return null;
        }
    }, [activeTab]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        }}>
            {/* Header */}
            <div style={{
                padding: "16px",
                backgroundColor: DiscordColors.backgroundPrimary,
                borderRadius: "8px",
                border: `1px solid ${DiscordColors.border}`,
            }}>
                <h3 style={{
                    color: DiscordColors.textNormal,
                    fontSize: "18px",
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                }}>
                    🔍 OSINT Tools
                </h3>
                <p style={{
                    color: DiscordColors.textMuted,
                    fontSize: "14px",
                    margin: "0",
                }}>
                    Open Source Intelligence tools for public Discord data analysis
                </p>
            </div>

            {/* Disclaimer */}
            <div style={{
                padding: "12px 16px",
                backgroundColor: "rgba(240, 71, 17, 0.1)",
                border: `1px solid ${DiscordColors.warning}`,
                borderRadius: "8px",
                fontSize: "13px",
                color: DiscordColors.warning,
            }}>
                <strong>⚠️ Educational Use Only:</strong> All OSINT tools process only publicly available data through Discord’s official API. No private data is accessed or stored. For educational and security research purposes only.
            </div>

            {/* Tabs */}
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

            {/* Content */}
            <div style={TabStyles.contentActive}>
                {renderContent()}
            </div>

            {/* Footer */}
            <div style={{
                padding: "12px 16px",
                backgroundColor: DiscordColors.backgroundTertiary,
                borderRadius: "8px",
                fontSize: "12px",
                color: DiscordColors.textMuted,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>💡</span>
                    <strong>Tip:</strong> Right-click on users, servers, or messages to quickly access OSINT tools
                </div>
            </div>
        </div>
    );
};

export default OSINTDashboard;
