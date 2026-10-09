import React from 'react';
import { Send, Users, Clock, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

export default function OverviewBanner({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="kpi-grid">
      <div className="glass-panel kpi-card">
        <div className="kpi-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
          <Send size={24} />
        </div>
        <div className="kpi-data">
          <h4>{metrics.total_applications || 0}</h4>
          <span>Candidaturas Totales</span>
        </div>
      </div>

      <div className="glass-panel kpi-card">
        <div className="kpi-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
          <Users size={24} />
        </div>
        <div className="kpi-data">
          <h4>{metrics.interviewing_count || 0}</h4>
          <span>En Proceso / Entrevistas</span>
        </div>
      </div>

      <div className="glass-panel kpi-card">
        <div className="kpi-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
          <Clock size={24} />
        </div>
        <div className="kpi-data">
          <h4>{metrics.follow_up_due_today || 0}</h4>
          <span>Follow-up Recomendado Hoy</span>
        </div>
      </div>

      <div className="glass-panel kpi-card">
        <div className="kpi-icon-box" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
          <AlertTriangle size={24} />
        </div>
        <div className="kpi-data">
          <h4>{metrics.follow_up_overdue || 0}</h4>
          <span>Plazo Follow-up Vencido</span>
        </div>
      </div>

      <div className="glass-panel kpi-card">
        <div className="kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
          <TrendingUp size={24} />
        </div>
        <div className="kpi-data">
          <h4>{metrics.ssi_score || 72}/100</h4>
          <span>Social Selling Index (LinkedIn)</span>
        </div>
      </div>
    </div>
  );
}
