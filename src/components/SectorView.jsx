import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from 'recharts'
import { supabase } from '../supabaseClient'

/* ── Helpers ── */
const ESTADO_META = {
  'Salud Excelente': { cls: 'badge-excelente', dot: '#3fb950', bar: '#3fb950', label: 'Excelente' },
  'Salud Buena':     { cls: 'badge-buena',     dot: '#58a6ff', bar: '#58a6ff', label: 'Buena' },
  'Salud Regular':   { cls: 'badge-regular',   dot: '#d29922', bar: '#d29922', label: 'Regular' },
  'Salud Mala':      { cls: 'badge-mala',      dot: '#e05c2a', bar: '#e05c2a', label: 'Mala' },
  'Salud Critica':   { cls: 'badge-critica',   dot: '#f85149', bar: '#f85149', label: 'Crítica' },
}

function issColor(iss) {
  if (iss >= 4) return '#3fb950'
  if (iss >= 3) return '#58a6ff'
  if (iss >= 2) return '#d29922'
  if (iss >= 1) return '#e05c2a'
  return '#f85149'
}

function bloqueColor(val) {
  if (val >= 4) return '#3fb950'
  if (val >= 3) return '#58a6ff'
  if (val >= 2) return '#d29922'
  return '#f85149'
}

const BLOQUES = [
  { key: 'bloque_rentabilidad',  short: 'REN', label: 'Rentabilidad' },
  { key: 'bloque_endeudamiento', short: 'END', label: 'Endeudamiento' },
  { key: 'bloque_liquidez',      short: 'LIQ', label: 'Liquidez' },
  { key: 'bloque_actividad',     short: 'ACT', label: 'Actividad' },
  { key: 'bloque_crecimiento',   short: 'CRE', label: 'Crecimiento' },
]

/* ── Custom tooltip para el gráfico ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#141b23', border: '1px solid #1e2d3d',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem'
    }}>
      <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Distribución por estado ── */
function DistribucionPanel({ data }) {
  const total = data.length
  const counts = useMemo(() => {
    const c = {}
    data.forEach(d => {
      c[d.estado_sector] = (c[d.estado_sector] || 0) + 1
    })
    return c
  }, [data])

  const orden = ['Salud Excelente', 'Salud Buena', 'Salud Regular', 'Salud Mala', 'Salud Critica']

  return (
    <div className="panel">
      <div className="panel-header">Distribución por Estado</div>
      <div className="dist-list">
        {orden.map(est => {
          const meta = ESTADO_META[est]
          const count = counts[est] || 0
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={est}>
              <div className="dist-item">
                <div className="dist-label">
                  <span className="dist-dot" style={{ background: meta.dot }} />
                  {meta.label}
                </div>
                <div className="dist-count">{count}</div>
                <div className="dist-pct">{pct}%</div>
              </div>
              <div className="dist-bar-bg" style={{ marginTop: 5 }}>
                <div
                  className="dist-bar-fill"
                  style={{ width: `${pct}%`, background: meta.bar }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Gráfico de barras de bloques para sector seleccionado ── */
function BloquesChart({ sector }) {
  if (!sector) return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">Detalle de Bloques</div>
      <div className="empty-state">Haz clic en un sector de la tabla para ver su detalle</div>
    </div>
  )

  const chartData = BLOQUES.map(b => ({
    name: b.label,
    valor: sector[b.key] ?? 0,
  }))

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Bloques — {sector.sector}</span>
        <span style={{ fontFamily: 'monospace', color: issColor(sector.iss_sector), fontSize: '1rem' }}>
          ISS {sector.iss_sector}
        </span>
      </div>
      <div className="chart-container" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#637489', fontSize: 11, fontFamily: 'Syne' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: '#637489', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={52}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={bloqueColor(entry.valor)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
        {BLOQUES.map(b => {
          const val = sector[b.key]
          return (
            <div key={b.key} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 2, marginBottom: 4,
                background: bloqueColor(val ?? 0)
              }} />
              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#fff' }}>
                {val?.toFixed(1) ?? '—'}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#637489', marginTop: 2 }}>{b.short}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── MAIN VIEW ── */
export default function SectorView({ anio }) {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const [sortKey, setSortKey]     = useState('iss_sector')
  const [sortAsc, setSortAsc]     = useState(false)
  const [selected, setSelected]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    supabase
      .from('v_iss_sector')
      .select('*')
      .eq('anio', anio)
      .not('iss_sector', 'is', null)
      .order('iss_sector', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (err) setError(err.message)
        else setData(rows || [])
        setLoading(false)
      })
  }, [anio])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data
      .filter(d =>
        !q ||
        d.sector?.toLowerCase().includes(q) ||
        d.ciiu?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = a[sortKey] ?? 0
        const bv = b[sortKey] ?? 0
        const cmp = typeof av === 'string'
          ? av.localeCompare(bv)
          : av - bv
        return sortAsc ? cmp : -cmp
      })
  }, [data, search, sortKey, sortAsc])

  const kpis = useMemo(() => {
    if (!data.length) return null
    const total = data.reduce((s, d) => s + (d.total_empresas || 0), 0)
    const avgIss = data.reduce((s, d) => s + (d.iss_sector || 0), 0) / data.length
    const mejor = data[0]
    const peor  = [...data].sort((a, b) => a.iss_sector - b.iss_sector)[0]
    return { total, avgIss, mejor, peor, sectores: data.length }
  }, [data])

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3 }}> ↕</span>
    return <span style={{ color: '#f0b429' }}>{sortAsc ? ' ↑' : ' ↓'}</span>
  }

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      <span>Cargando datos {anio}…</span>
    </div>
  )

  if (error) return (
    <div className="loading-state" style={{ color: '#f85149' }}>
      <span>Error: {error}</span>
    </div>
  )

  return (
    <>
      {/* ── KPIs ── */}
      {kpis && (
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-label">Sectores analizados</div>
            <div className="kpi-value accent">{kpis.sectores}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Empresas totales</div>
            <div className="kpi-value">{kpis.total.toLocaleString()}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">ISS Promedio</div>
            <div className="kpi-value" style={{ color: issColor(kpis.avgIss) }}>
              {kpis.avgIss.toFixed(2)}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Mejor sector</div>
            <div className="kpi-value" title={kpis.mejor?.ciiu} style={{ fontSize: '0.8rem', color: '#3fb950', lineHeight: 1.3, textTransform: 'uppercase' }}>
              {kpis.mejor?.ciiu?.replace(/^[A-Z]\d+\s-\s/, '')?.slice(0, 40) ?? '—'}{kpis.mejor?.ciiu?.length > 40 ? '...' : ''}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Sector más débil</div>
            <div className="kpi-value" title={kpis.peor?.ciiu} style={{ fontSize: '0.8rem', color: '#f85149', lineHeight: 1.3, textTransform: 'uppercase' }}>
              {kpis.peor?.ciiu?.replace(/^[A-Z]\d+\s-\s/, '')?.slice(0, 40) ?? '—'}{kpis.peor?.ciiu?.length > 40 ? '...' : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── Table + side panels ── */}
      <p className="section-title">Ranking sectorial · {anio}</p>

      <div className="grid-2">
        {/* Table */}
        <div className="panel">
          <div className="panel-header">
            <span>{filtered.length} sectores</span>
            <input
              className="search-input"
              placeholder="Buscar sector o CIIU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 540, overflowY: 'auto' }}>
            <table className="sector-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('sector')}>Sector <SortIcon col="sector"/></th>
                  <th onClick={() => handleSort('iss_sector')} style={{ textAlign: 'right' }}>ISS <SortIcon col="iss_sector"/></th>
                  <th>Estado</th>
                  <th>Bloques</th>
                  <th onClick={() => handleSort('total_empresas')} style={{ textAlign: 'right' }}>Empresas <SortIcon col="total_empresas"/></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const meta = ESTADO_META[row.estado_sector] || ESTADO_META['Salud Critica']
                  const isSelected = selected?.ciiu === row.ciiu
                  return (
                    <tr
                      key={row.ciiu}
                      onClick={() => setSelected(isSelected ? null : row)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(240,180,41,0.07)' : undefined,
                      }}
                    >
                      <td>
                        <div className="sector-name">{row.sector}</div>
                        <div className="sector-ciiu">CIIU {row.ciiu}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="iss-val" style={{ color: issColor(row.iss_sector) }}>
                          {row.iss_sector?.toFixed(2)}
                        </div>
                        <div className="iss-bar-wrap" style={{ marginLeft: 'auto' }}>
                          <div
                            className="iss-bar-fill"
                            style={{
                              width: `${(row.iss_sector / 5) * 100}%`,
                              background: issColor(row.iss_sector),
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td>
                        <div className="bloques-row">
                          {BLOQUES.map(b => (
                            <div
                              key={b.key}
                              className="bloque-mini"
                              title={`${b.label}: ${row[b.key]?.toFixed(2) ?? '—'}`}
                              style={{
                                background: bloqueColor(row[b.key] ?? 0),
                                opacity: 0.75,
                              }}
                            >
                              {b.short[0]}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#cdd9e5' }}>
                        {row.total_empresas?.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
                {!filtered.length && (
                  <tr><td colSpan={5} className="empty-state">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BloquesChart sector={selected} />
          <DistribucionPanel data={data} />
        </div>
      </div>
    </>
  )
}
