import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MonthlyActivityChart({ stats: initialStats }) {
  const [stats, setStats] = useState(initialStats || null);
  const [loading, setLoading] = useState(!initialStats);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  useEffect(() => {
    if (!initialStats) {
      loadStats();
    } else {
      setStats(initialStats);
    }
  }, [initialStats]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getMonthlyStats();
      setStats(data);
    } catch (e) {
      console.error('Error cargando estadísticas mensuales:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        Cargando métricas de actividad mensual...
      </div>
    );
  }

  const kpis = stats?.kpis || {
    total_applications: 0,
    total_pending_action: 0,
    total_sent: 0,
    total_in_progress: 0,
    total_discarded: 0,
    conversion_rate_percent: 0,
    avg_response_time_days: null
  };

  const monthlyBreakdown = stats?.monthly_breakdown || [];
  const discardReasons = stats?.discard_reasons || {};

  // Formato meses para gráfico
  const monthsData = monthlyBreakdown.length > 0 ? monthlyBreakdown : [
    { month: '2026-08', pending_action: 0, sent: 0, in_progress: 0, discarded: 0, total: 0 },
    { month: '2026-09', pending_action: 0, sent: 0, in_progress: 0, discarded: 0, total: 0 },
    { month: '2026-10', pending_action: kpis.total_pending_action, sent: kpis.total_sent, in_progress: kpis.total_in_progress, discarded: kpis.total_discarded, total: kpis.total_applications }
  ];

  const maxVal = Math.max(1, ...monthsData.map(m => Math.max(m.pending_action, m.sent, m.in_progress, m.discarded, m.total)));

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Cabecera & KPIs Resumen */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} color="#818cf8" />
            <span>Índice de Actividad Mensual del Candidato</span>
          </h3>
          <p style={{ margin: 0, fontSize: '0.785rem', color: '#94a3b8' }}>
            Evolución de ofertas descubiertas, postulaciones enviadas, entrevistas activas y descartes
          </p>
        </div>

        {/* Badges de KPIs */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '0.4rem 0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600 }}>ENCONTRADAS</div>
            <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>{kpis.total_pending_action}</div>
          </div>

          <div style={{ background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.25)', borderRadius: '10px', padding: '0.4rem 0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 600 }}>ENVIADAS</div>
            <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>{kpis.total_sent}</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '0.4rem 0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 600 }}>EN PROCESO</div>
            <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>{kpis.total_in_progress}</div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '10px', padding: '0.4rem 0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#fb7185', fontWeight: 600 }}>TASA RESPUESTA</div>
            <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>{kpis.conversion_rate_percent}%</div>
          </div>
        </div>
      </div>

      {/* Gráfico SVG Interactivo de Barras Agrupadas */}
      <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '170px', gap: '1rem', paddingTop: '1rem' }}>
          {monthsData.map((m, idx) => {
            const hPending = (m.pending_action / maxVal) * 120;
            const hSent = (m.sent / maxVal) * 120;
            const hInProg = (m.in_progress / maxVal) * 120;
            const hDisc = (m.discarded / maxVal) * 120;

            const isHovered = hoveredMonth === m.month;

            return (
              <div
                key={m.month || idx}
                onMouseEnter={() => setHoveredMonth(m.month)}
                onMouseLeave={() => setHoveredMonth(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {/* Tooltip flotante si está en hover */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: '135px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.725rem',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Mes: {m.month}</div>
                    <div style={{ color: '#38bdf8' }}>Encontradas: {m.pending_action}</div>
                    <div style={{ color: '#818cf8' }}>Enviadas: {m.sent}</div>
                    <div style={{ color: '#10b981' }}>En Proceso: {m.in_progress}</div>
                    <div style={{ color: '#94a3b8' }}>Descartadas: {m.discarded}</div>
                  </div>
                )}

                {/* Barras agrupadas */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%', justifyContent: 'center' }}>
                  {/* Barra Encontradas */}
                  <div
                    style={{
                      width: '8px',
                      height: `${Math.max(4, hPending)}px`,
                      background: '#38bdf8',
                      borderRadius: '3px 3px 0 0',
                      opacity: isHovered ? 1 : 0.85
                    }}
                    title={`Encontradas: ${m.pending_action}`}
                  />
                  {/* Barra Enviadas */}
                  <div
                    style={{
                      width: '8px',
                      height: `${Math.max(4, hSent)}px`,
                      background: '#818cf8',
                      borderRadius: '3px 3px 0 0',
                      opacity: isHovered ? 1 : 0.85
                    }}
                    title={`Enviadas: ${m.sent}`}
                  />
                  {/* Barra En Proceso */}
                  <div
                    style={{
                      width: '8px',
                      height: `${Math.max(4, hInProg)}px`,
                      background: '#10b981',
                      borderRadius: '3px 3px 0 0',
                      opacity: isHovered ? 1 : 0.85
                    }}
                    title={`En Proceso: ${m.in_progress}`}
                  />
                  {/* Barra Descartadas */}
                  <div
                    style={{
                      width: '8px',
                      height: `${Math.max(4, hDisc)}px`,
                      background: '#64748b',
                      borderRadius: '3px 3px 0 0',
                      opacity: isHovered ? 1 : 0.65
                    }}
                    title={`Descartadas: ${m.discarded}`}
                  />
                </div>

                {/* Etiqueta del Mes */}
                <span style={{ fontSize: '0.725rem', color: isHovered ? '#fff' : '#94a3b8', fontWeight: isHovered ? 700 : 500 }}>
                  {m.month.slice(5)}/{m.month.slice(2, 4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda y Motivos de Descarte */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#38bdf8' }} /> Encontradas
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#818cf8' }} /> Enviadas (CV enviado)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} /> En Proceso (Entrevistas)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#64748b' }} /> Descartadas
          </span>
        </div>

        {Object.keys(discardReasons).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#cbd5e1' }}>Motivos de descarte frecuentes:</span>
            {discardReasons['timeout_15_days'] ? (
              <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                {discardReasons['timeout_15_days']} por inactividad (15d)
              </span>
            ) : null}
            {discardReasons['descarte_manual'] ? (
              <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                {discardReasons['descarte_manual']} manuales
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
