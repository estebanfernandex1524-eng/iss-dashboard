import { useState } from "react";
import SectorView    from "./components/SectorView";
import HistoricoView from "./components/HistoricoView";
import "./index.css";

const TABS = [
  { id: "sectores",  label: "Sectores",  icon: "▦" },
  { id: "historico", label: "Análisis de Sector", icon: "⟳" },
];

const YEARS = [2020, 2021, 2022, 2023, 2024];

export default function App() {
  const [tab,  setTab]  = useState("sectores");
  const [anio, setAnio] = useState(2023);

  return (
    <div className="app-shell">
      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <span>ISS</span>
          <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: "0.85rem" }}>
            Índice de Salud Sectorial · Colombia
          </span>
        </div>

        <div className="topbar-right">
          {tab === "sectores" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Año</span>
              <select
                className="year-select"
                value={anio}
                onChange={e => setAnio(Number(e.target.value))}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* ── Nav tabs ── */}
      <nav className="topnav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`topnav-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="topnav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="main-content">
        {tab === "sectores"  && <SectorView anio={anio} />}
        {tab === "historico" && <HistoricoView />}
      </main>
    </div>
  );
}
