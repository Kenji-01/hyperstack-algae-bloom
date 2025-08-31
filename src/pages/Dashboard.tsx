import { useEffect, useRef, useState } from "react";

const PI_HOST = "http://raspberrypi.local:8765"; // change if needed
const STATUS_URL = `${PI_HOST}/duckweed_status.json`;

function useStatusPoll(url: string, intervalMs = 1000) {
  const [data, setData] = useState<any>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetcher = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch {}
    };
    fetcher();
    timer.current = setInterval(fetcher, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [url, intervalMs]);

  return data;
}

function HarvestOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", 
      inset: 0, 
      display: "grid", 
      placeItems: "center",
      zIndex: 9999, 
      pointerEvents: "none"
    }}>
      <div style={{
        background: "black", 
        color: "white",
        padding: "20px 36px", 
        borderRadius: 12,
        fontSize: 22, 
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,.4)"
      }}>
        <div style={{ marginBottom: 8 }}>Harvesting Alert</div>
        <div className="duckweed-animation" aria-hidden>🟢</div>
      </div>
      <style>{`
        .duckweed-animation {
          font-size: 36px;
          display: inline-block;
          animation: jump 0.6s ease-in-out infinite alternate;
        }
        @keyframes jump {
          from { transform: translateY(0); }
          to   { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  const [threshold, setThreshold] = useState(70);
  const status = useStatusPoll(STATUS_URL, 1000);

  // Compute coverage display
  const coverage = status?.coverage != null
    ? Math.round(status.coverage * 100)
    : null;

  // Show overlay for 10s only when we see action === "harvest_alert"
  const [showOverlay, setShowOverlay] = useState(false);
  const lastActionRef = useRef("");
  useEffect(() => {
    if (!status) return;
    if (status.action === "harvest_alert" && lastActionRef.current !== "harvest_alert") {
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 10000); // 10 sec
    }
    lastActionRef.current = status.action || "";
  }, [status]);

  // Manual buttons wired later to a REST endpoint; for now they just show toasts
  const openValve = () => alert("Open Valve requested (wire to backend)");
  const closeValve4Min = () => alert("Close Valve 4 min requested (wire to backend)");

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 16, color: "hsl(var(--foreground))" }}>HyperStack AI – Duckweed Control</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Camera tile (replace src with your stream later) */}
        <div style={{ background: "hsl(var(--card))", padding: 12, borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
          <div style={{ color: "hsl(var(--muted-foreground))", marginBottom: 8 }}>Under-Duckweed Camera</div>
          <img
            src="https://placehold.co/640x360/1a1a1a/9aa0a6?text=Camera+Feed"
            alt="camera"
            style={{ width: "100%", borderRadius: 8 }}
          />
        </div>

        {/* Right column */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "hsl(var(--card))", padding: 16, borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>Coverage</div>
            <div style={{ fontSize: 48, fontWeight: 700, marginTop: 6, color: "hsl(var(--foreground))" }}>
              {coverage !== null ? `${coverage}%` : "—"}
            </div>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>
              Threshold: {threshold}%
            </div>
          </div>

          <div style={{ background: "hsl(var(--card))", padding: 16, borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
            <div style={{ marginBottom: 8, color: "hsl(var(--foreground))" }}>Controls</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range" 
                min={40} 
                max={95} 
                value={threshold}
                onChange={e => setThreshold(parseInt(e.target.value))}
                style={{ flexGrow: 1 }}
              />
              <div style={{ color: "hsl(var(--foreground))" }}>{threshold}%</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button 
                onClick={openValve}
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                Open Valve (GPIO16)
              </button>
              <button 
                onClick={closeValve4Min}
                style={{
                  background: "hsl(var(--secondary))",
                  color: "hsl(var(--secondary-foreground))",
                  border: "1px solid hsl(var(--border))",
                  padding: "8px 16px",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                Close Valve 4 min
              </button>
            </div>
          </div>

          <div style={{ background: "hsl(var(--card))", padding: 16, borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
            <div style={{ color: "hsl(var(--foreground))" }}>Status</div>
            <pre style={{ 
              whiteSpace: "pre-wrap", 
              marginTop: 8, 
              color: "hsl(var(--muted-foreground))",
              fontSize: 12,
              overflow: "auto",
              maxHeight: 200
            }}>
{JSON.stringify(status, null, 2) || "Waiting for data…"}
            </pre>
          </div>
        </div>
      </div>

      <HarvestOverlay show={showOverlay} />
    </div>
  );
}
