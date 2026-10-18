import { React, useState, useCallback } from "@webpack/common";
import { BadgeInfo } from "../types";
import { CardStyles, ButtonStyles, ListStyles, InputStyles } from "../styles";
import { DiscordColors } from "../styles";

interface BadgeSelectionProps {
    catalog: Record<string, BadgeInfo>;
    hidden: Record<string, boolean>;
    onToggle: (key: string) => void;
    onToggleAll: (value: boolean) => void;
    onScan: () => void;
}

const BadgeSelection: React.FC<BadgeSelectionProps> = ({
    catalog,
    hidden,
    onToggle,
    onToggleAll,
    onScan,
}) => {
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showOnlyHidden, setShowOnlyHidden] = useState(false);

    const allBadges = Object.values(catalog);
    const q = query.trim().toLowerCase();

    const filteredBadges = allBadges.filter((badge) => {
        if (selectedCategory && badge.kind !== selectedCategory) return false;
        if (showOnlyHidden && !hidden[badge.key]) return false;
        if (!q) return true;
        return (
            badge.label.toLowerCase().includes(q) ||
            badge.kind.toLowerCase().includes(q) ||
            badge.key.toLowerCase().includes(q)
        );
    });

    const categories = Array.from(new Set(allBadges.map((b) => b.kind)));

    const hiddenCount = Object.values(hidden).filter((h) => h).length;
    const totalCount = allBadges.length;

    const handleToggle = useCallback((key: string) => {
        onToggle(key);
    }, [onToggle]);

    const handleToggleAll = useCallback((value: boolean) => {
        onToggleAll(value);
    }, [onToggleAll]);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>🏳️ Badge List</h3>
                    <p style={CardStyles.description}>
                        Manage which badges to hide. Use search and filters to find specific badges.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: "flex",
                gap: "16px",
                marginBottom: "16px",
                flexWrap: "wrap",
                padding: "12px",
                backgroundColor: DiscordColors.backgroundSecondary,
                borderRadius: "8px",
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: DiscordColors.textNormal }}>
                        {totalCount}
                    </div>
                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase" }}>
                        Total Badges
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: DiscordColors.danger }}>
                        {hiddenCount}
                    </div>
                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase" }}>
                        Hidden
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: DiscordColors.success }}>
                        {totalCount - hiddenCount}
                    </div>
                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted, textTransform: "uppercase" }}>
                        Visible
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
                flexWrap: "wrap",
            }}>
                <input
                    style={{ ...InputStyles.text, flex: 1, minWidth: "200px" }}
                    placeholder="Search badges..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <select
                    style={InputStyles.select}
                    value={selectedCategory || ""}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                    ))}
                </select>
                <button
                    style={{
                        ...ButtonStyles.ghost,
                        backgroundColor: showOnlyHidden ? DiscordColors.buttonSecondary : "",
                    }}
                    onClick={() => setShowOnlyHidden(!showOnlyHidden)}
                >
                    {showOnlyHidden ? "👁️ Show All" : "🔴 Hidden Only"}
                </button>
            </div>

            {/* Actions */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
                flexWrap: "wrap",
            }}>
                <button
                    style={ButtonStyles.danger}
                    onClick={() => handleToggleAll(true)}
                    disabled={totalCount === 0}
                >
                    🔴 Hide All
                </button>
                <button
                    style={ButtonStyles.success}
                    onClick={() => handleToggleAll(false)}
                    disabled={totalCount === 0}
                >
                    🟢 Show All
                </button>
                <button
                    style={ButtonStyles.primary}
                    onClick={onScan}
                >
                    🔍 Scan for New Badges
                </button>
            </div>

            {/* Badge List */}
            {filteredBadges.length > 0 ? (
                <div style={ListStyles.container}>
                    <div style={ListStyles.items}>
                        {filteredBadges.map((badge) => (
                            <div
                                key={badge.key}
                                style={{
                                    ...ListStyles.item,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    cursor: "pointer",
                                }}
                                onClick={() => handleToggle(badge.key)}
                            >
                                <div style={{ position: "relative" }}>
                                    <img
                                        src={badge.src}
                                        alt={badge.label}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            objectFit: "contain",
                                            opacity: hidden[badge.key] ? 0.3 : 1,
                                            filter: hidden[badge.key] ? "grayscale(100%)" : "none",
                                        }}
                                    />
                                    {hidden[badge.key] && (
                                        <div style={{
                                            position: "absolute",
                                            top: "0",
                                            left: "0",
                                            right: "0",
                                            bottom: "0",
                                            background: "rgba(237, 66, 69, 0.8)",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "16px",
                                            fontWeight: "bold",
                                            color: "white",
                                        }}>
                                            ✕
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "600", fontSize: "14px" }}>
                                        {badge.label}
                                    </div>
                                    <div style={{ fontSize: "12px", color: DiscordColors.textMuted }}>
                                        {badge.kind} • {badge.key}
                                    </div>
                                </div>
                                <div style={{
                                    padding: "4px 8px",
                                    background: hidden[badge.key] 
                                        ? DiscordColors.danger 
                                        : DiscordColors.success,
                                    color: "white",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                }}>
                                    {hidden[badge.key] ? "Hidden" : "Visible"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{
                    padding: "24px",
                    textAlign: "center",
                    backgroundColor: DiscordColors.backgroundSecondary,
                    borderRadius: "8px",
                }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔍</div>
                    <h4 style={{ color: DiscordColors.textNormal, margin: "0 0 4px 0" }}>
                        No badges found
                    </h4>
                    <p style={{ color: DiscordColors.textMuted, fontSize: "13px", margin: "0" }}>
                        {query || selectedCategory || showOnlyHidden
                            ? "Try adjusting your filters or search query"
                            : "Scan for badges by opening Discord profiles"
                        }
                    </p>
                    <button
                        onClick={onScan}
                        style={{
                            ...ButtonStyles.primary,
                            marginTop: "16px",
                        }}
                    >
                        🔍 Scan Now
                    </button>
                </div>
            )}
        </div>
    );
};

export default BadgeSelection;
