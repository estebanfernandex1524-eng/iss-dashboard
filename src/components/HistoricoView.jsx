import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  ResponsiveContainer, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

/* ══════════════════════════════════════════════
   CONFIGURACIÓN DE INDICADORES
   (pesos, thresholds, scoring — igual que en el Excel)
══════════════════════════════════════════════ */
const INDICADORES = [
  {
    grupo: "Ratios de Rentabilidad",
    pesoBloque: 30,
    key: "bloque_rentabilidad",
    items: [
      {
        key: "roa", label: "ROA", peso: 6, fmt: "pct",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 10%",        check: v => v > 0.10 },
          { score: 4, label: "Bueno",     desc: "6% – 10%",     check: v => v >= 0.06 },
          { score: 3, label: "Regular",   desc: "3% – 5,99%",   check: v => v >= 0.03 },
          { score: 2, label: "Malo",      desc: "1% – 2,99%",   check: v => v >= 0.01 },
          { score: 1, label: "Crítico",   desc: "< 1%",         check: () => true },
        ],
      },
      {
        key: "roe", label: "ROE", peso: 9, fmt: "pct",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 20%",          check: v => v > 0.20 },
          { score: 4, label: "Bueno",     desc: "12% – 20%",      check: v => v >= 0.12 },
          { score: 3, label: "Regular",   desc: "6% – 11,99%",    check: v => v >= 0.06 },
          { score: 2, label: "Malo",      desc: "1% – 5,99%",     check: v => v >= 0.01 },
          { score: 1, label: "Crítico",   desc: "< 1%",           check: () => true },
        ],
      },
      {
        key: "margen_operativo", label: "Margen Operativo", peso: 9, fmt: "pct",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 25%",          check: v => v > 0.25 },
          { score: 4, label: "Bueno",     desc: "15% – 25%",      check: v => v >= 0.15 },
          { score: 3, label: "Regular",   desc: "8% – 14,99%",    check: v => v >= 0.08 },
          { score: 2, label: "Malo",      desc: "3% – 7,99%",     check: v => v >= 0.03 },
          { score: 1, label: "Crítico",   desc: "< 3%",           check: () => true },
        ],
      },
      {
        key: "margen_neto", label: "Margen Neto", peso: 6, fmt: "pct",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 20%",          check: v => v > 0.20 },
          { score: 4, label: "Bueno",     desc: "10% – 20%",      check: v => v >= 0.10 },
          { score: 3, label: "Regular",   desc: "5% – 9,99%",     check: v => v >= 0.05 },
          { score: 2, label: "Malo",      desc: "1% – 4,99%",     check: v => v >= 0.01 },
          { score: 1, label: "Crítico",   desc: "< 1%",           check: () => true },
        ],
      },
    ],
  },
  {
    grupo: "Ratios de Endeudamiento",
    pesoBloque: 25,
    key: "bloque_endeudamiento",
    items: [
      {
        key: "cobertura_intereses", label: "Razón de cobertura de intereses", peso: 10, fmt: "num2",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 5",            check: v => v > 5 },
          { score: 4, label: "Bueno",     desc: "3 – 5",          check: v => v >= 3 },
          { score: 3, label: "Regular",   desc: "2 – 2,99",       check: v => v >= 2 },
          { score: 2, label: "Malo",      desc: "1 – 1,99",       check: v => v >= 1 },
          { score: 1, label: "Crítico",   desc: "< 1",            check: () => true },
        ],
      },
      {
        key: "razon_endeudamiento", label: "Nivel de endeudamiento", peso: 7, fmt: "pct",
        thresholds: [
          { score: 5, label: "Excelente", desc: "< 45%",          check: v => v < 0.45 },
          { score: 4, label: "Bueno",     desc: "45% – 58%",      check: v => v < 0.58 },
          { score: 3, label: "Regular",   desc: "58% – 69%",      check: v => v < 0.69 },
          { score: 2, label: "Malo",      desc: "70% – 85%",      check: v => v < 0.85 },
          { score: 1, label: "Crítico",   desc: "> 85%",          check: () => true },
        ],
      },
      {
        key: "estructura_capital", label: "Estructura de Capital", peso: 8, fmt: "num2",
        thresholds: [
          { score: 5, label: "Excelente", desc: "< 0,5",          check: v => v < 0.5 },
          { score: 4, label: "Bueno",     desc: "0,5 – 0,99",     check: v => v < 1.0 },
          { score: 3, label: "Regular",   desc: "1 – 1,49",       check: v => v < 1.5 },
          { score: 2, label: "Malo",      desc: "1,5 – 1,99",     check: v => v < 2.0 },
          { score: 1, label: "Crítico",   desc: "> 2",            check: () => true },
        ],
      },
    ],
  },
  {
    grupo: "Ratios de Actividad",
    pesoBloque: 20,
    key: "bloque_actividad",
    items: [
      {
        key: "rot_cartera_dias", label: "Rotación de cartera", peso: 7, fmt: "num1",
        thresholds: [
          { score: 5, label: "Excelente", desc: "< 30",           check: v => v < 30 },
          { score: 4, label: "Bueno",     desc: "30 – 45",        check: v => v <= 45 },
          { score: 3, label: "Regular",   desc: "46 – 60",        check: v => v <= 60 },
          { score: 2, label: "Malo",      desc: "61 – 85",        check: v => v <= 85 },
          { score: 1, label: "Crítico",   desc: "> 85",           check: () => true },
        ],
      },
      {
        key: "rot_inventarios_dias", label: "Rotación de inventarios", peso: 7, fmt: "num1",
        thresholds: [
          { score: 5, label: "Excelente", desc: "< 45",           check: v => v < 45 },
          { score: 4, label: "Bueno",     desc: "45 – 60",        check: v => v <= 60 },
          { score: 3, label: "Regular",   desc: "61 – 80",        check: v => v <= 80 },
          { score: 2, label: "Malo",      desc: "81 – 100",       check: v => v <= 100 },
          { score: 1, label: "Crítico",   desc: "> 100",          check: () => true },
        ],
      },
      {
        key: "rot_activos_fijos", label: "Rotación de Activos Fijos", peso: 2, fmt: "num2",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 4",            check: v => v > 4 },
          { score: 4, label: "Bueno",     desc: "3 – 4",          check: v => v >= 3 },
          { score: 3, label: "Regular",   desc: "2,0 – 2,99",     check: v => v >= 2 },
          { score: 2, label: "Malo",      desc: "1 – 1,99",       check: v => v >= 1 },
          { score: 1, label: "Crítico",   desc: "< 1",            check: () => true },
        ],
      },
      {
        key: "rot_activos_totales", label: "Rotación de Activos Totales", peso: 4, fmt: "num2",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 2",            check: v => v > 2 },
          { score: 4, label: "Bueno",     desc: "1,5 – 2,0",      check: v => v >= 1.5 },
          { score: 3, label: "Regular",   desc: "1 – 1,49",       check: v => v >= 1 },
          { score: 2, label: "Malo",      desc: "0,5 – 0,99",     check: v => v >= 0.5 },
          { score: 1, label: "Crítico",   desc: "< 0,5",          check: () => true },
        ],
      },
    ],
  },
  {
    grupo: "Indicadores de Liquidez",
    pesoBloque: 15,
    key: "bloque_liquidez",
    items: [
      {
        key: "razon_corriente", label: "Razón corriente", peso: 7, fmt: "num3",
        thresholds: [
          { score: 5, label: "Excelente", desc: "2,0 – 3",        check: v => v >= 2.0 && v <= 3.0 },
          { score: 4, label: "Bueno",     desc: "1,5 – 2,0",      check: v => v >= 1.5 },
          { score: 3, label: "Regular",   desc: "1,2 – 1,49",     check: v => v >= 1.2 },
          { score: 2, label: "Malo",      desc: "1,0 – 1,19",     check: v => v >= 1.0 },
          { score: 1, label: "Crítico",   desc: "< 1,0 o >3",     check: () => true },
        ],
      },
      {
        key: "prueba_acida", label: "Prueba ácida", peso: 8, fmt: "num3",
        thresholds: [
          { score: 5, label: "Excelente", desc: "1,5 – 2",        check: v => v >= 1.5 && v <= 2.0 },
          { score: 4, label: "Bueno",     desc: "1,2 – 1,49",     check: v => v >= 1.2 },
          { score: 3, label: "Regular",   desc: "1 – 1,19",       check: v => v >= 1.0 },
          { score: 2, label: "Malo",      desc: "0,8 – 0,99",     check: v => v >= 0.8 },
          { score: 1, label: "Crítico",   desc: "< 0,8 o >2",     check: () => true },
        ],
      },
    ],
  },
  {
    grupo: "Ratios de Crecimiento",
    pesoBloque: 10,
    key: "bloque_crecimiento",
    items: [
      {
        key: "crecimiento_ventas", label: "Tasa de crecimiento en ventas", peso: 4, fmt: "pct",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 15%",          check: v => v > 0.15 },
          { score: 4, label: "Bueno",     desc: "12% – 15%",      check: v => v >= 0.12 },
          { score: 3, label: "Regular",   desc: "5% – 11,99%",    check: v => v >= 0.05 },
          { score: 2, label: "Malo",      desc: "1% – 4,99%",     check: v => v >= 0.01 },
          { score: 1, label: "Crítico",   desc: "< 1%",           check: () => true },
        ],
      },
      {
        key: "crecimiento_utilidad", label: "Tasa de crecimiento en utilidad neta", peso: 6, fmt: "pct",
        thresholds: [
          { score: 5, label: "Excelente", desc: "> 20%",          check: v => v > 0.20 },
          { score: 4, label: "Bueno",     desc: "10% – 20%",      check: v => v >= 0.10 },
          { score: 3, label: "Regular",   desc: "3% – 9,99%",     check: v => v >= 0.03 },
          { score: 2, label: "Malo",      desc: "0% – 2,99%",     check: v => v >= 0.00 },
          { score: 1, label: "Crítico",   desc: "< 0%",           check: () => true },
        ],
      },
    ],
  },
];

const ESCALA_ISS = [
  { rango: "0 – 1", resultado: "Salud Crítica",   color: "#f85149", bg: "rgba(248,81,73,0.08)",
    accion_inm: "Frenar gastos no esenciales y revisar urgencias de liquidez y deuda.",
    accion_est: "Reestructurar el modelo operativo y financiero antes de crecer." },
  { rango: "1 – 2", resultado: "Salud Mala",      color: "#e05c2a", bg: "rgba(224,92,42,0.08)",
    accion_inm: "Corregir los indicadores más débiles con medidas de control y reducción de pérdidas.",
    accion_est: "Fortalecer rentabilidad, liquidez y eficiencia con un plan de mejora integral." },
  { rango: "2 – 3", resultado: "Salud Regular",   color: "#d29922", bg: "rgba(210,153,34,0.08)",
    accion_inm: "Optimizar procesos y priorizar los rubros que más afectan el resultado.",
    accion_est: "Consolidar una gestión más eficiente para mover la empresa a un nivel estable." },
  { rango: "3 – 4", resultado: "Salud Buena",     color: "#58a6ff", bg: "rgba(88,166,255,0.08)",
    accion_inm: "Mantener el desempeño y corregir desviaciones puntuales.",
    accion_est: "Escalar con inversión selectiva en innovación, productividad y expansión." },
  { rango: "4 – 5", resultado: "Salud Excelente", color: "#3fb950", bg: "rgba(63,185,80,0.08)",
    accion_inm: "Sostener los resultados y monitorear riesgos para no perder desempeño.",
    accion_est: "Reforzar liderazgo, diversificación y crecimiento sostenible." },
];

/* ── Helpers ── */
const YEARS = [2020, 2021, 2022, 2023, 2024];

function fmt(value, type) {
  if (value == null || isNaN(value)) return "—";
  switch (type) {
    case "pct":  return (value * 100).toFixed(2) + "%";
    case "num1": return value.toFixed(1);
    case "num2": return value.toFixed(2);
    case "num3": return value.toFixed(3);
    default:     return value.toFixed(2);
  }
}

function score(value, thresholds) {
  if (value == null || isNaN(value)) return null;
  for (const t of thresholds) {
    if (t.check(value)) return t;
  }
  return thresholds[thresholds.length - 1];
}

function issColor(v) {
  if (v >= 4) return "#3fb950";
  if (v >= 3) return "#58a6ff";
  if (v >= 2) return "#d29922";
  if (v >= 1) return "#e05c2a";
  return "#f85149";
}

function scoreColor(s) {
  if (!s) return "var(--text-dim)";
  if (s.score === 5) return "#3fb950";
  if (s.score === 4) return "#58a6ff";
  if (s.score === 3) return "#d29922";
  if (s.score === 2) return "#e05c2a";
  return "#f85149";
}

function avg(arr) {
  const clean = arr.filter(v => v != null && !isNaN(v));
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#141b23", border: "1px solid #1e2d3d", borderRadius: 8, padding: "10px 14px", fontSize: "0.78rem" }}>
      <div style={{ color: "#fff", fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || "var(--accent)", display: "flex", gap: 10, justifyContent: "space-between" }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════
   COMPONENTES DE TABLA
══════════════════════════════════════════════ */
function GrupoHeader({ grupo, pesoBloque, puntajeBloque }) {
  return (
    <tr style={{ background: "#0f172a" }}>
      <td colSpan={2} style={{ padding: "10px 16px", fontWeight: 800, fontSize: "0.8rem", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {grupo}
      </td>
      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent)", fontWeight: 700, textAlign: "center" }}>
        {puntajeBloque != null ? puntajeBloque.toFixed(2) : "—"}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "monospace" }}>
        {pesoBloque}%
      </td>
      {YEARS.map(y => <td key={y} />)}
      <td /><td /><td colSpan={5} />
    </tr>
  );
}

function IndicadorRow({ item, byYear }) {
  const values = YEARS.map(y => byYear[y]?.[item.key] ?? null);
  const promedio = avg(values);
  const s = score(promedio, item.thresholds);

  return (
    <tr style={{ borderBottom: "1px solid #0d1117" }}>
      <td style={{ padding: "9px 16px 9px 28px", fontSize: "0.78rem", color: "var(--text-dim)" }}>
        {item.label}
      </td>
      <td style={{ padding: "9px 12px", textAlign: "center", fontFamily: "monospace", fontSize: "0.72rem", color: "var(--text-dim)" }}>
        {item.peso}%
      </td>
      <td style={{ padding: "9px 12px", textAlign: "center" }} />
      <td style={{ padding: "9px 12px", textAlign: "center" }} />
      {YEARS.map((y, i) => {
        const v = values[i];
        const sv = v != null ? score(v, item.thresholds) : null;
        return (
          <td key={y} style={{
            padding: "9px 8px", textAlign: "right", fontFamily: "monospace", fontSize: "0.78rem",
            color: sv ? scoreColor(sv) : "var(--text-dim)",
          }}>
            {fmt(v, item.fmt)}
          </td>
        );
      })}
      {/* Promedio */}
      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", color: s ? scoreColor(s) : "var(--text-dim)", fontWeight: 700, borderLeft: "1px solid #1e2d3d" }}>
        {fmt(promedio, item.fmt)}
      </td>
      {/* Escala descriptiva (las 5 celdas) */}
      {item.thresholds.map((t, i) => (
        <td key={i} style={{
          padding: "6px 6px", fontSize: "0.62rem", color: scoreColor(t), textAlign: "center",
          whiteSpace: "nowrap", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {t.desc}
        </td>
      ))}
      {/* Calificación + puntaje */}
      <td style={{ padding: "9px 10px", textAlign: "center", borderLeft: "1px solid #1e2d3d" }}>
        {s && (
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.68rem",
            fontWeight: 700, background: `${scoreColor(s)}22`, color: scoreColor(s),
          }}>
            {s.label}
          </span>
        )}
      </td>
      <td style={{ padding: "9px 10px", textAlign: "center", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: s ? scoreColor(s) : "var(--text-dim)" }}>
        {s?.score ?? "—"}
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function HistoricoView() {
  const [ciiu,    setCiiu]    = useState("");
  const [sector,  setSector]  = useState("");
  const [tamano,  setTamano]  = useState("");
  const [depto,   setDepto]   = useState("");
  const [zona,    setZona]    = useState("");

  const [ciiuOpts,  setCiiuOpts]  = useState([]);
  const [sectorOpts,setSectorOpts]= useState([]);
  const [tamanoOpts,setTamanoOpts]= useState([]);
  const [deptoOpts, setDeptoOpts] = useState([]);
  const [zonaOpts,  setZonaOpts]  = useState([]);

  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [optsLoading, setOptsLoading] = useState(true);
  const [error,   setError]   = useState(null);

  /* Carga opciones al montar */
  useEffect(() => {
    async function loadOpts() {
      setOptsLoading(true);
      // Fetches distinct CIIU from v_iss_sector where each year has only ~439 entries.
      const { data: c } = await supabase.from("v_iss_sector").select("ciiu").eq("anio", 2023).limit(5000);
      
      const uniq = (arr, key) => [...new Set((arr || []).map(r => r[key]).filter(Boolean))].sort();
      setCiiuOpts(uniq(c, "ciiu"));
      
      setTamanoOpts(["Micro", "Pequeña", "Mediana", "Grande"]);
      setDeptoOpts([
        "AMAZONAS", "ANTIOQUIA", "ARAUCA", "ATLANTICO", "BOGOTA D.C.", "BOLIVAR", "BOYACA", 
        "CALDAS", "CAQUETA", "CASANARE", "CAUCA", "CESAR", "CHOCO", "CORDOBA", 
        "CUNDINAMARCA", "GUAINIA", "GUAVIARE", "HUILA", "LA GUAJIRA", "MAGDALENA", 
        "META", "NARIÑO", "NORTE DE SANTANDER", "PUTUMAYO", "QUINDIO", "RISARALDA", 
        "SAN ANDRES Y PROVIDENCIA", "SANTANDER", "SUCRE", "TOLIMA", "VALLE DEL CAUCA", 
        "VAUPES", "VICHADA"
      ]);
      setZonaOpts(["BOGOTA", "CENTRAL", "COSTA", "OCCIDENTE", "ORINOQUIA Y AMAZONIA"]);

      setOptsLoading(false);
    }
    loadOpts();
  }, []);

  /* Carga datos cuando hay CIIU seleccionado */
  useEffect(() => {
    if (!ciiu) { setRows([]); return; }
    loadData();
  }, [ciiu, tamano, depto, zona]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("v_iss_historico")
        .select("*")
        .eq("ciiu", ciiu)
        .order("anio");

      if (tamano) q = q.eq("tamano", tamano);
      if (depto)  q = q.eq("departamento", depto);
      if (zona)   q = q.eq("zona", zona);

      q = q.limit(5000);
      const { data, error: err } = await q;
      if (err) throw err;
      setRows(data || []);
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  /* Pivote: { año -> { campo -> promedio } } */
  const byYear = useMemo(() => {
    const map = {};
    YEARS.forEach(y => { map[y] = {}; });

    // Para cada campo, acumular valores por año
    const keys = INDICADORES.flatMap(g => g.items.map(i => i.key));
    const sums = {};   // { año: { key: [values] } }
    YEARS.forEach(y => { sums[y] = {}; keys.forEach(k => { sums[y][k] = []; }); });

    rows.forEach(r => {
      const y = r.anio;
      if (!YEARS.includes(y)) return;
      keys.forEach(k => {
        const v = r[k];
        if (v != null && !isNaN(v) && isFinite(v)) sums[y][k].push(Number(v));
      });
    });

    YEARS.forEach(y => {
      keys.forEach(k => {
        const arr = sums[y][k];
        map[y][k] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      });
    });
    return map;
  }, [rows]);

  /* Años con datos */
  const yearsWithData = useMemo(() =>
    YEARS.filter(y => rows.some(r => r.anio === y)),
    [rows]
  );

  /* ISS por año (desde v_iss_final para el mismo CIIU) */
  const [issData, setIssData] = useState([]);
  useEffect(() => {
    if (!ciiu) { setIssData([]); return; }
    supabase.from("v_iss_sector")
      .select("anio, iss_sector, bloque_rentabilidad, bloque_endeudamiento, bloque_liquidez, bloque_actividad, bloque_crecimiento, estado_sector")
      .eq("ciiu", ciiu)
      .order("anio")
      .then(({ data }) => setIssData(data || []));
  }, [ciiu]);

  /* Puntaje por bloque (calculado a partir de los promedios multi-año) */
  const bloqueScores = useMemo(() => {
    const result = {};
    INDICADORES.forEach(grupo => {
      const scores = [];
      grupo.items.forEach(item => {
        const yValues = YEARS.map(y => byYear[y]?.[item.key] ?? null).filter(v => v != null);
        const prom = yValues.length ? yValues.reduce((a, b) => a + b) / yValues.length : null;
        const s = prom != null ? score(prom, item.thresholds) : null;
        if (s) scores.push({ score: s.score, peso: item.peso });
      });
      const totalPeso = scores.reduce((a, b) => a + b.peso, 0);
      const puntaje = totalPeso ? scores.reduce((a, b) => a + b.score * b.peso, 0) / totalPeso : null;
      result[grupo.key] = puntaje;
    });
    return result;
  }, [byYear]);

  /* ISS calculado del promedio multi-año */
  const issCalculado = useMemo(() => {
    const parts = INDICADORES.map(g => {
      const bp = bloqueScores[g.key];
      return bp != null ? bp * g.pesoBloque : null;
    });
    const valid = parts.filter(v => v != null);
    if (!valid.length) return null;
    const totalPeso = INDICADORES.filter((_, i) => parts[i] != null).reduce((a, g) => a + g.pesoBloque, 0);
    return valid.reduce((a, b) => a + b, 0) / totalPeso;
  }, [bloqueScores]);

  /* Chart ISS por año */
  const issChartData = useMemo(() =>
    issData.map(d => ({ anio: String(d.anio), "ISS Sector": d.iss_sector })),
    [issData]
  );

  /* Radar bloques */
  const radarData = useMemo(() => {
    const labels = { bloque_rentabilidad: "Rentabilidad", bloque_endeudamiento: "Endeudamiento", bloque_liquidez: "Liquidez", bloque_actividad: "Actividad", bloque_crecimiento: "Crecimiento" };
    return Object.entries(labels).map(([k, label]) => ({
      subject: label,
      value: bloqueScores[k] != null ? +bloqueScores[k].toFixed(2) : 0,
      fullMark: 5,
    }));
  }, [bloqueScores]);

  /* Estado del ISS */
  const issEstado = useMemo(() => {
    if (issCalculado == null) return null;
    return ESCALA_ISS.find((e, i) => {
      const min = i;
      const max = i + 1;
      return issCalculado >= min && issCalculado < max;
    }) || ESCALA_ISS[ESCALA_ISS.length - 1];
  }, [issCalculado]);

  /* Empresas en el análisis */
  const empresasInfo = useMemo(() => {
    const unique = new Set(rows.map(r => r.empresas_5_anios));
    const maxN = Math.max(...[...unique].filter(Boolean));
    const total = rows.filter(r => r.anio === YEARS[0])?.length || 0;
    return { total: rows.length / (yearsWithData.length || 1), maxN };
  }, [rows, yearsWithData]);

  const hasData = rows.length > 0;

  /* ── Render ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Encabezado + Filtros ── */}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: 4 }}>
          Análisis de Sector por CIIU
        </h2>
        <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: 20 }}>
          Selecciona un CIIU para ver la evolución histórica de todos los indicadores financieros sectoriales.
        </p>

        <div className="panel">
          <div className="panel-header">
            <span>Filtros</span>
            {optsLoading && <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Cargando opciones…</span>}
          </div>
          <div style={{ padding: "14px 20px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
            {/* CIIU — filtro principal */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 300px", minWidth: 240 }}>
              <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", fontWeight: 700 }}>
                CIIU *
              </label>
              <select
                className="year-select"
                style={{ fontSize: "0.78rem", width: "100%" }}
                value={ciiu}
                onChange={e => { setCiiu(e.target.value); }}
                disabled={optsLoading}
              >
                <option value="">— Selecciona un CIIU —</option>
                {ciiuOpts.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>

            {/* Filtros secundarios */}
            {[
              { label: "Tamaño",       val: tamano, set: setTamano, opts: tamanoOpts },
              { label: "Departamento", val: depto,  set: setDepto,  opts: deptoOpts },
              { label: "Zona",         val: zona,   set: setZona,   opts: zonaOpts },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
                  {f.label}
                </label>
                <select
                  className="year-select"
                  style={{ fontSize: "0.78rem" }}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  disabled={!ciiu || optsLoading}
                >
                  <option value="">Todos</option>
                  {f.opts.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
            ))}

            {(ciiu || tamano || depto || zona) && (
              <button
                onClick={() => { setCiiu(""); setTamano(""); setDepto(""); setZona(""); }}
                style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.3)", color: "var(--accent)", padding: "6px 14px", borderRadius: 6, fontSize: "0.72rem", cursor: "pointer", alignSelf: "flex-end" }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Estados de carga ── */}
      {!ciiu && (
        <div className="panel">
          <div style={{ padding: "56px 32px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.2 }}>▦</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Selecciona un CIIU para comenzar
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", maxWidth: 400, margin: "0 auto" }}>
              El análisis mostrará la evolución histórica de todos los indicadores financieros del sector de 2020 a 2024.
            </p>
          </div>
        </div>
      )}

      {ciiu && loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Cargando indicadores para {ciiu}…</span>
        </div>
      )}

      {ciiu && error && !loading && (
        <div className="loading-state" style={{ color: "var(--red)" }}>
          Error: {error}
        </div>
      )}

      {ciiu && !loading && !error && !hasData && (
        <div className="panel">
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>Sin datos para este CIIU</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Prueba con otro CIIU o ajusta los filtros secundarios.</p>
          </div>
        </div>
      )}

      {hasData && !loading && (
        <>
          {/* ── Contexto del análisis ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "rgba(88,166,255,0.06)", border: "1px solid rgba(88,166,255,0.15)", borderRadius: 8, fontSize: "0.75rem", color: "var(--text-dim)" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>ℹ</span>
            <div>
              <strong style={{ color: "#cdd9e5" }}>Años con datos: </strong>
              {yearsWithData.join(", ")} · {" "}
              <strong style={{ color: "#cdd9e5" }}>Registros incluidos: </strong>
              {rows.length} observaciones empresa-año.
              Los valores de cada año son el <strong style={{ color: "#cdd9e5" }}>promedio</strong> de todas las empresas del CIIU seleccionado con datos en ese año.
              {yearsWithData.length < 5 && (
                <> Los años {YEARS.filter(y => !yearsWithData.includes(y)).join(", ")} no tienen datos disponibles en la base.</>
              )}
            </div>
          </div>

          {/* ══ TABLA DE INDICADORES ══ */}
          <div className="panel">
            <div className="panel-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <span>Indicadores Financieros — {ciiu}</span>
                {issCalculado != null && (
                  <span style={{ fontFamily: "monospace", fontSize: "0.95rem", color: issColor(issCalculado), fontWeight: 700 }}>
                    ISS Calculado: {issCalculado.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "#080c10" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d" }}>
                      Indicador
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d" }}>
                      Peso
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--accent)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d" }}>
                      Puntaje<br/>Pond.
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d" }}>
                      Peso<br/>Ratio
                    </th>
                    {YEARS.map(y => (
                      <th key={y} style={{
                        padding: "10px 8px", textAlign: "right", color: yearsWithData.includes(y) ? "var(--text-dim)" : "#2d3f52",
                        fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500,
                        whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d",
                      }}>
                        {y}
                      </th>
                    ))}
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d", borderLeft: "1px solid #1e2d3d" }}>
                      Promedio
                    </th>
                    <th colSpan={5} style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d" }}>
                      Escala de evaluación →
                    </th>
                    <th style={{ padding: "10px 10px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d", borderLeft: "1px solid #1e2d3d" }}>
                      Calificación
                    </th>
                    <th style={{ padding: "10px 10px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid #1e2d3d" }}>
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {INDICADORES.map(grupo => {
                    /* Calcular puntaje ponderado del bloque */
                    const bScore = bloqueScores[grupo.key];
                    return (
                      <>
                        <GrupoHeader
                          key={`g-${grupo.key}`}
                          grupo={grupo.grupo}
                          pesoBloque={grupo.pesoBloque}
                          puntajeBloque={bScore}
                        />
                        {grupo.items.map(item => (
                          <IndicadorRow key={item.key} item={item} byYear={byYear} />
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ RESULTADO ISS ══ */}
          {issCalculado != null && (
            <div className="panel">
              <div className="panel-header">
                <span>Resultado ISS — Escala de Evaluación</span>
                <span style={{ fontFamily: "monospace", fontSize: "1rem", color: issColor(issCalculado), fontWeight: 700 }}>
                  ISS {issCalculado.toFixed(2)}
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#080c10" }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, borderBottom: "1px solid #1e2d3d" }}>Rango</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, borderBottom: "1px solid #1e2d3d" }}>Resultado</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, borderBottom: "1px solid #1e2d3d" }}>Acción Inmediata</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-dim)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, borderBottom: "1px solid #1e2d3d" }}>Acción Estratégica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ESCALA_ISS.map((e, i) => {
                      const min = i;
                      const max = i + 1;
                      const isActive = issCalculado >= min && issCalculado < max;
                      return (
                        <tr key={e.rango} style={{
                          background: isActive ? e.bg : "transparent",
                          borderBottom: "1px solid #0d1117",
                          outline: isActive ? `1px solid ${e.color}33` : "none",
                        }}>
                          <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: "0.8rem", color: e.color, fontWeight: isActive ? 700 : 400 }}>
                            {e.rango}
                            {isActive && <span style={{ marginLeft: 8, fontSize: "0.65rem", background: e.color, color: "#000", padding: "2px 6px", borderRadius: 3, fontWeight: 700 }}>← AQUÍ</span>}
                          </td>
                          <td style={{ padding: "10px 16px", fontWeight: isActive ? 700 : 400, color: isActive ? e.color : "var(--text-dim)" }}>
                            {e.resultado}
                          </td>
                          <td style={{ padding: "10px 16px", color: isActive ? "var(--text)" : "var(--text-dim)", fontSize: "0.75rem" }}>
                            {e.accion_inm}
                          </td>
                          <td style={{ padding: "10px 16px", color: isActive ? "var(--text)" : "var(--text-dim)", fontSize: "0.75rem" }}>
                            {e.accion_est}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ GRÁFICOS ══ */}
          <div className="grid-2" style={{ gridTemplateColumns: "1fr 340px" }}>
            {/* ISS Line Chart */}
            <div className="panel">
              <div className="panel-header">ISS Sectorial por Año</div>
              <div style={{ padding: "20px 16px 16px", height: 280 }}>
                {issChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={issChartData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
                      <XAxis dataKey="anio" tick={{ fill: "#637489", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "#637489", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line dataKey="ISS Sector" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">Sin datos de ISS para este CIIU en la vista sectorial.</div>
                )}
              </div>
            </div>

            {/* Radar de bloques */}
            <div className="panel">
              <div className="panel-header">Perfil por Bloques</div>
              <div style={{ height: 280, padding: "10px 0" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#1e2d3d" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#637489", fontSize: 10 }} />
                    <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: "#141b23", border: "1px solid #1e2d3d", borderRadius: 6, fontSize: "0.75rem" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bloques líneas por año */}
          <div className="panel">
            <div className="panel-header">Puntaje por Bloque a través del tiempo</div>
            <div style={{ padding: "16px 16px", height: 280 }}>
              {issChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={issData.map(d => ({
                      anio: String(d.anio),
                      Rentabilidad: d.bloque_rentabilidad,
                      Endeudamiento: d.bloque_endeudamiento,
                      Liquidez: d.bloque_liquidez,
                      Actividad: d.bloque_actividad,
                      Crecimiento: d.bloque_crecimiento,
                    }))}
                    margin={{ top: 4, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
                    <XAxis dataKey="anio" tick={{ fill: "#637489", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "#637489", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "0.72rem", color: "var(--text-dim)", paddingTop: 8 }} />
                    {[
                      ["Rentabilidad",  "#6366f1"],
                      ["Endeudamiento", "#f0b429"],
                      ["Liquidez",      "#58a6ff"],
                      ["Actividad",     "#3fb950"],
                      ["Crecimiento",   "#e05c2a"],
                    ].map(([key, color]) => (
                      <Line key={key} dataKey={key} stroke={color} strokeWidth={1.8} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Sin datos de bloques para este CIIU.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}