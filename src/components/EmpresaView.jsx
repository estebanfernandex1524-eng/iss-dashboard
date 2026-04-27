import { useEffect, useState, useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'
import { supabase } from '../supabaseClient'

const ESTADO_META = {
  'Salud Excelente': { cls: 'badge-excelente', color: '#3fb950' },
  'Salud Buena':     { cls: 'badge-buena',     color: '#58a6ff' },
  'Salud Regular':   { cls: 'badge-regular',   color: '#d29922' },
  'Salud Mala':      { cls: 'badge-mala',      color: '#e05c2a' },
  'Salud Critica':   { cls: 'badge-critica',   color: '#f85149' },
}

function issColor(iss) {
  if (iss >= 4) return '#3fb950'
  if (iss >= 3) return '#58a6ff'
  if (iss >= 2) return '#d29922'
  if (iss >= 1) return '#e05c2a'
  return '#f85149'
}

const BLOQUES = [
  { key: 'bloque_rentabilidad',  label: 'Rentabilidad' },
  { key: 'bloque_endeudamiento', label: 'Endeudamiento' },
  { key: 'bloque_liquidez',      label: 'Liquidez' },
  { key: 'bloque_actividad',     label: 'Actividad' },
  { key: 'bloque_crecimiento',   label: 'Crecimiento' },
]

const SCORES = [
  { key: 'score_roa',                  label: 'ROA' },
  { key: 'score_roe',                  label: 'ROE' },
  { key: 'score_margen_neto',          label: 'Margen Neto' },
  { key: 'score_margen_operacional',   label: 'Margen Operacional' },
  { key: 'score_endeudamiento',        label: 'Endeudamiento' },
  { key: 'score_leverage',             label: 'Leverage' },
  { key: 'score_cobertura',            label: 'Cobertura Intereses' },
  { key: 'score_razon_corriente',      label: 'Razón Corriente' },
  { key: 'score_prueba_acida',         label: 'Prueba Ácida' },
  { key: 'score_rotacion_cartera',     label: 'Rot. Cartera' },
  { key: 'score_rotacion_activos',     label: 'Rot. Activos' },
  { key: 'score_crecimiento_ingresos', label: 'Crecim. Ingresos' },
  { key: 'score_crecimiento_utilidad', label: 'Crecim. Utilidad' },
]

function ScoreBar({ label, value }) {
  const color = issColor(value ?? 0)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: '0.72rem', color: '#637489' }}>{label}</span>
        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color }}>
          {value != null ? value : '—'}
        </span>
      </div>
      <div style={{ height: 4, background: '#1e2d3d', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${((value ?? 0) / 5) * 100}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function EmpresaDetail({ empresa }) {
  const radarData = BLOQUES.map(b => ({
    subject: b.label,
    value: empresa[b.key] ?? 0,
    fullMark: 5,
  }))

  const meta = ESTADO_META[empresa.estado_cualitativo] || ESTADO_META['Salud Critica']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
      {/* Info + radar */}
      <div className="panel">
        <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              {empresa.razon_social}
            </span>
            <span className={`badge ${meta.cls}`} style={{ fontSize: '0.72rem' }}>
              {empresa.estado_cualitativo?.replace('Salud ', '')}
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#637489' }}>
            NIT {empresa.nit} · CIIU {empresa.ciiu} · {empresa.sector}
            {empresa.tamano && ` · ${empresa.tamano}`}
            {empresa.departamento && ` · ${empresa.departamento}`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: '1px solid #1e2d3d' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#637489', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ISS</div>
            <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 600, color: issColor(empresa.iss), lineHeight: 1 }}>
              {empresa.iss?.toFixed(2) ?? '—'}
            </div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {BLOQUES.map(b => (
              <div key={b.key}>
                <div style={{ fontSize: '0.6rem', color: '#637489' }}>{b.label}</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '0.9rem',
                  color: issColor(empresa[b.key] ?? 0), fontWeight: 600,
                }}>
                  {empresa[b.key]?.toFixed(2) ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar */}
        <div style={{ height: 220, padding: '10px 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e2d3d" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#637489', fontSize: 10, fontFamily: 'Syne' }}
              />
              <Radar
                dataKey="value"
                stroke={meta.color}
                fill={meta.color}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: '#141b23', border: '1px solid #1e2d3d',
                  borderRadius: 6, fontSize: '0.75rem',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scores individuales */}
      <div className="panel">
        <div className="panel-header">Scores por Ratio</div>
        <div style={{ padding: '16px 20px' }}>
          {SCORES.map(s => (
            <ScoreBar key={s.key} label={s.label} value={empresa[s.key]} />
          ))}
          {empresa.bloque_debil && (
            <div style={{
              marginTop: 14, padding: '8px 12px', background: 'rgba(248,81,73,0.08)',
              border: '1px solid rgba(248,81,73,0.2)', borderRadius: 6,
              fontSize: '0.75rem', color: '#f85149',
            }}>
              ⚠ Bloque más débil: <strong>{empresa.bloque_debil}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Filter pill ─── */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
        {label}
      </label>
      <select
        className="year-select"
        style={{ fontSize: '0.78rem', minWidth: 120 }}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Todos</option>
        {options.map(x => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  )
}

export default function EmpresaView({ anio }) {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [optsLoading, setOptsLoading] = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const [sortKey, setSortKey]     = useState('iss')
  const [sortAsc, setSortAsc]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 50

  // Filter state
  const [fSector, setFSector]           = useState('')
  const [fTamano, setFTamano]           = useState('')
  const [fDepartamento, setFDepartamento] = useState('')
  const [fZona, setFZona]               = useState('')
  const [fEstado, setFEstado]           = useState('')

  // Filter options
  const [opts, setOpts] = useState({ sectores: [], tamanos: [], departamentos: [], zonas: [] })

  // Load options once
  useEffect(() => {
    async function loadOpts() {
      setOptsLoading(true)
      const [{ data: s }, { data: t }, { data: d }, { data: z }] = await Promise.all([
        supabase.from('v_iss_final').select('sector').eq('anio', anio).not('sector', 'is', null),
        supabase.from('v_iss_final').select('tamano').eq('anio', anio).not('tamano', 'is', null),
        supabase.from('v_iss_final').select('departamento').eq('anio', anio).not('departamento', 'is', null),
        supabase.from('v_iss_final').select('zona').eq('anio', anio).not('zona', 'is', null),
      ])
      const uniq = (arr, key) => [...new Set((arr || []).map(r => r[key]).filter(Boolean))].sort()
      setOpts({ sectores: uniq(s, 'sector'), tamanos: uniq(t, 'tamano'), departamentos: uniq(d, 'departamento'), zonas: uniq(z, 'zona') })
      setOptsLoading(false)
    }
    loadOpts()
  }, [anio])

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    setPage(0)
    let q = supabase
      .from('v_iss_final')
      .select(`nit, razon_social, sector, ciiu, tamano, departamento, zona, anio, iss,
               estado_cualitativo, bloque_debil,
               bloque_rentabilidad, bloque_endeudamiento, bloque_liquidez,
               bloque_actividad, bloque_crecimiento,
               score_roa, score_roe, score_margen_neto, score_margen_operacional,
               score_endeudamiento, score_leverage, score_cobertura,
               score_razon_corriente, score_prueba_acida,
               score_rotacion_cartera, score_rotacion_activos,
               score_crecimiento_ingresos, score_crecimiento_utilidad`)
      .eq('anio', anio)
      .not('iss', 'is', null)
      .order('iss', { ascending: false, nullsFirst: false })
      .limit(3000)

    q.then(({ data: rows, error: err }) => {
      if (err) setError(err.message)
      else setData(rows || [])
      setLoading(false)
    })
  }, [anio])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data
      .filter(d => {
        if (fSector      && d.sector      !== fSector)      return false
        if (fTamano      && d.tamano      !== fTamano)      return false
        if (fDepartamento && d.departamento !== fDepartamento) return false
        if (fZona        && d.zona        !== fZona)        return false
        if (fEstado      && d.estado_cualitativo !== fEstado) return false
        if (q && !(
          d.razon_social?.toLowerCase().includes(q) ||
          d.nit?.toString().includes(q) ||
          d.sector?.toLowerCase().includes(q) ||
          d.ciiu?.toLowerCase().includes(q)
        )) return false
        return true
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? 0
        const bv = b[sortKey] ?? 0
        const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
        return sortAsc ? cmp : -cmp
      })
  }, [data, search, sortKey, sortAsc, fSector, fTamano, fDepartamento, fZona, fEstado])

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3 }}> ↕</span>
    return <span style={{ color: '#f0b429' }}>{sortAsc ? ' ↑' : ' ↓'}</span>
  }

  const hasActiveFilters = fSector || fTamano || fDepartamento || fZona || fEstado
  function resetFilters() {
    setFSector(''); setFTamano(''); setFDepartamento(''); setFZona(''); setFEstado('')
    setSearch(''); setPage(0)
  }

  // KPIs
  const kpis = useMemo(() => {
    if (!data.length) return null
    const withIss = data.filter(d => d.iss != null)
    const avgIss = withIss.length ? withIss.reduce((s, d) => s + d.iss, 0) / withIss.length : 0
    const sorted = [...withIss].sort((a, b) => b.iss - a.iss)
    return {
      total: data.length,
      filtered: filtered.length,
      avgIss,
      mejor: sorted[0],
      peor: sorted[sorted.length - 1],
    }
  }, [data, filtered])

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      <span>Cargando empresas {anio}…</span>
    </div>
  )

  if (error) return (
    <div className="loading-state" style={{ color: '#f85149' }}>Error: {error}</div>
  )

  return (
    <>
      {/* KPIs */}
      {kpis && (
        <div className="kpi-row" style={{ marginBottom: 20 }}>
          <div className="kpi-card">
            <div className="kpi-label">Empresas cargadas</div>
            <div className="kpi-value accent">{kpis.total.toLocaleString()}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Filtradas</div>
            <div className="kpi-value">{kpis.filtered.toLocaleString()}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">ISS Promedio</div>
            <div className="kpi-value" style={{ color: issColor(kpis.avgIss) }}>
              {kpis.avgIss.toFixed(2)}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Mejor empresa</div>
            <div className="kpi-value" style={{ fontSize: '0.8rem', color: '#3fb950', lineHeight: 1.3 }}>
              {kpis.mejor?.razon_social?.slice(0, 22) ?? '—'}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">ISS más bajo</div>
            <div className="kpi-value" style={{ fontSize: '0.8rem', color: '#f85149', lineHeight: 1.3 }}>
              {kpis.peor?.razon_social?.slice(0, 22) ?? '—'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span>Filtros · {anio}</span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: 'var(--accent)', padding: '4px 10px', borderRadius: 5, fontSize: '0.72rem', cursor: 'pointer' }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FilterSelect label="Sector"       value={fSector}       onChange={v => { setFSector(v); setPage(0) }}       options={opts.sectores} />
          <FilterSelect label="Tamaño"       value={fTamano}       onChange={v => { setFTamano(v); setPage(0) }}       options={opts.tamanos} />
          <FilterSelect label="Departamento" value={fDepartamento} onChange={v => { setFDepartamento(v); setPage(0) }} options={opts.departamentos} />
          <FilterSelect label="Zona"         value={fZona}         onChange={v => { setFZona(v); setPage(0) }}         options={opts.zonas} />
          <FilterSelect
            label="Estado"
            value={fEstado}
            onChange={v => { setFEstado(v); setPage(0) }}
            options={['Salud Excelente', 'Salud Buena', 'Salud Regular', 'Salud Mala', 'Salud Critica']}
          />
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-header">
          <span>{filtered.length.toLocaleString()} empresas</span>
          <input
            className="search-input"
            placeholder="Buscar empresa, NIT, sector o CIIU…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 440, overflowY: 'auto' }}>
          <table className="sector-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('razon_social')}>Empresa <SortIcon col="razon_social"/></th>
                <th onClick={() => handleSort('sector')}>Sector <SortIcon col="sector"/></th>
                <th style={{ whiteSpace: 'nowrap' }}>Tamaño · Depto</th>
                <th onClick={() => handleSort('iss')} style={{ textAlign: 'right' }}>ISS <SortIcon col="iss"/></th>
                <th>Estado</th>
                <th>Débil</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(row => {
                const meta = ESTADO_META[row.estado_cualitativo] || ESTADO_META['Salud Critica']
                const isSelected = selected?.nit === row.nit
                return (
                  <tr
                    key={row.nit}
                    onClick={() => setSelected(isSelected ? null : row)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(240,180,41,0.07)' : undefined,
                    }}
                  >
                    <td>
                      <div className="sector-name">{row.razon_social}</div>
                      <div className="sector-ciiu">NIT {row.nit} · CIIU {row.ciiu}</div>
                    </td>
                    <td style={{ color: '#637489', fontSize: '0.78rem' }}>
                      {row.sector?.slice(0, 28)}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: '#637489' }}>
                      <div>{row.tamano ?? '—'}</div>
                      <div>{row.departamento ?? ''}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="iss-val" style={{ color: issColor(row.iss) }}>
                        {row.iss != null ? row.iss.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${meta.cls}`}>
                        {row.estado_cualitativo?.replace('Salud ', '')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.72rem', color: '#637489' }}>
                      {row.bloque_debil ?? '—'}
                    </td>
                  </tr>
                )
              })}
              {!paged.length && (
                <tr><td colSpan={6} className="empty-state">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '10px 20px', borderTop: '1px solid #1e2d3d',
            display: 'flex', gap: 8, alignItems: 'center',
            fontSize: '0.75rem', color: '#637489',
          }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                background: '#141b23', border: '1px solid #1e2d3d',
                color: '#cdd9e5', padding: '4px 10px', borderRadius: 5,
                cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1,
              }}
            >← Ant</button>
            <span>Página {page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                background: '#141b23', border: '1px solid #1e2d3d',
                color: '#cdd9e5', padding: '4px 10px', borderRadius: 5,
                cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page === totalPages - 1 ? 0.4 : 1,
              }}
            >Sig →</button>
          </div>
        )}
      </div>

      {selected && <EmpresaDetail empresa={selected} />}
    </>
  )
}
