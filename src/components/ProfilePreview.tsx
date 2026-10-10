import { React, useState, useEffect, useRef, useCallback } from "@webpack/common";
import { BadgeInfo } from "../types";
import { CardStyles, ButtonStyles } from "../styles";
import { DiscordColors } from "../styles";
import { CUSTOM_ATTRS } from "../utils/constants";

interface ProfilePreviewProps {
    catalog: Record<string, BadgeInfo>;
    hidden: Record<string, boolean>;
    onToggle: (key: string) => void;
    onScan: () => void;
}

interface ProfileBadge {
    key: string;
    src: string;
    label: string;
    kind: string;
    isHidden: boolean;
}

const ProfilePreview: React.FC<ProfilePreviewProps> = ({
    catalog,
    hidden,
    onToggle,
    onScan,
}) => {
    const [badges, setBadges] = useState<ProfileBadge[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [previewUser, setPreviewUser] = useState<{
        name: string;
        avatar: string;
        banner: string;
    }>({
        name: "Your Profile",
        avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
        banner: "",
    });
    const previewRef = useRef<HTMLDivElement>(null);

    // Load user profile info
    useEffect(() => {
        loadUserProfile();
        const interval = setInterval(loadUserProfile, 5000);
        return () => clearInterval(interval);
    }, []);

    // Update badges from catalog
    useEffect(() => {
        updateBadgesFromCatalog();
    }, [catalog, hidden]);

    const loadUserProfile = useCallback(() => {
        try {
            // Try to get user info from Discord DOM
            const userNameElement = document.querySelector("[class*='username'], [class*='userName']");
            const avatarElement = document.querySelector("[class*='avatar'], [class*='userAvatar'] img");
            const bannerElement = document.querySelector("[class*='banner'], [class*='userBanner'] img");

            const name = userNameElement?.textContent?.trim() || "Your Profile";
            const avatar = avatarElement?.getAttribute("src") || "https://cdn.discordapp.com/embed/avatars/0.png";
            const banner = bannerElement?.getAttribute("src") || "";

            setPreviewUser({ name, avatar, banner });
        } catch (e) {
            // Use defaults if unable to get user info
        }
    }, []);

    const updateBadgesFromCatalog = useCallback(() => {
        const badgeList: ProfileBadge[] = [];
        
        for (const [key, info] of Object.entries(catalog)) {
            badgeList.push({
                key,
                src: info.src,
                label: info.label,
                kind: info.kind,
                isHidden: !!hidden[key],
            });
        }
        
        setBadges(badgeList);
    }, [catalog, hidden]);

    const handleBadgeClick = useCallback((badgeKey: string) => {
        onToggle(badgeKey);
    }, [onToggle]);

    const visibleBadges = showAll ? badges : badges.slice(0, 12);
    const hiddenCount = badges.filter(b => b.isHidden).length;
    const totalCount = badges.length;

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>👤 My Profile</h3>
                    <p style={CardStyles.description}>
                        Click on badges to hide or show them. Changes apply immediately everywhere in Discord.
                    </p>
                </div>
            </div>

            {/* Profile Preview Card */}
            <div style={{
                backgroundColor: DiscordColors.backgroundSecondary,
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "16px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Banner */}
                {previewUser.banner && (
                    <img
                        src={previewUser.banner}
                        alt=""
                        style={{
                            width: "100%",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "8px 8px 0 0",
                            position: "absolute",
                            top: "0",
                            left: "0",
                        }}
                    />
                )}

                <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Avatar */}
                    <div style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        margin: "0 auto 12px",
                        border: `4px solid ${DiscordColors.backgroundSecondary}`,
                        background: DiscordColors.backgroundPrimary,
                    }}>
                        <img
                            src={previewUser.avatar}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                objectFit: "cover",
                            }}
                        />
                    </div>

                    {/* Username */}
                    <h4 style={{
                        color: DiscordColors.textNormal,
                        fontSize: "18px",
                        fontWeight: 700,
                        margin: "0 0 4px 0",
                    }}>
                        {previewUser.name}
                    </h4>

                    {/* Badge Statistics */}
                    <p style={{
                        color: DiscordColors.textMuted,
                        fontSize: "13px",
                        margin: "0",
                    }}>
                        {totalCount} badges detected • {hiddenCount} hidden
                    </p>

                    {/* Badges Preview */}
                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: "8px",
                        marginTop: "16px",
                        padding: "12px",
                        backgroundColor: "rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                    }}>
                        {visibleBadges.map((badge) => (
                            <div
                                key={badge.key}
                                onClick={() => handleBadgeClick(badge.key)}
                                style={{
                                    position: "relative",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    opacity: badge.isHidden ? 0.3 : 1,
                                    filter: badge.isHidden ? "grayscale(100%)" : "none",
                                }}
                            >
                                <img
                                    src={badge.src}
                                    alt={badge.label}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        objectFit: "contain",
                                    }}
                                />
                                {badge.isHidden && (
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
                        ))}
                    </div>

                    {/* Show More / Less */}
                    {totalCount > 12 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            style={{
                                ...ButtonStyles.ghost,
                                marginTop: "12px",
                                fontSize: "12px",
                            }}
                        >
                            {showAll ? "▲ Show Less" : `▼ Show All +${totalCount - 12}`}
                        </button>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div style={{
                padding: "12px 16px",
                backgroundColor: DiscordColors.backgroundTertiary,
                borderRadius: "8px",
                fontSize: "13px",
                color: DiscordColors.textMuted,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span>💡</span>
                    <strong>How to use:</strong>
                </div>
                <ol style={{ margin: "0", paddingLeft: "24px", lineHeight: "1.5" }}>
                    <li>Open any Discord profile (yours or someone else's)</li>
                    <li>Badges will appear in your profile preview above</li>
                    <li><strong>Click on a badge</strong> to hide it (it will show a red ✕)</li>
                    <li><strong>Click again</strong> to show it</li>
                    <li>Changes apply <strong>immediately</strong> to ALL profiles (yours AND others)</li>
                </ol>
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${DiscordColors.border}` }}>
                    <button
                        onClick={onScan}
                        style={ButtonStyles.primary}
                    >
                        🔍 Scan for New Badges
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePreview;
