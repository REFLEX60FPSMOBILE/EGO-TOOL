import { React } from "@webpack/common";
import { useUserLookup } from "./useUserLookup";

export function UserLookupPanel() {
  const { result, loading, error, lookup, getThreatColor } = useUserLookup();
  const [input, setInput] = React.useState("");

  return (
    <div className="shoyz-user-lookup">
      <div className="shoyz-lookup-header">
        <h3>User Lookup</h3>
        <span className="shoyz-lookup-subtitle">Educational OSINT · Public data only</span>
      </div>

      <div className="shoyz-lookup-search">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter user ID or username..."
        />
        <button onClick={() => lookup(input)} disabled={loading || !input}>
          {loading ? "Scanning..." : "Analyze"}
        </button>
      </div>

      {error && <div className="shoyz-lookup-error">{error}</div>}

      {result && (
        <div className="shoyz-lookup-result">
          <div className="shoyz-lookup-score" style={{ borderColor: getThreatColor(result.threatLevel) }}>
            <span className="shoyz-score-value">{result.threatScore}</span>
            <span className="shoyz-score-label">{result.threatLevel}</span>
          </div>
          <div className="shoyz-lookup-details">
            <div><strong>User:</strong> {result.username}</div>
            <div><strong>ID:</strong> {result.userId}</div>
            <div><strong>Account Age:</strong> {result.accountAgeDays} days</div>
            <div><strong>Flags:</strong> {result.flags.length || "None"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
