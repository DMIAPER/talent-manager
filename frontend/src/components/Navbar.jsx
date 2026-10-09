import React from 'react';
import { Briefcase, Compass, Share2, Calendar, Plus, Stethoscope, Cpu, Layers, Bot, Settings } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenNewApp, onOpenSettings }) {
  return (
    <header className="navbar">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Briefcase size={22} color="#ffffff" />
        </div>
        <div className="brand-text">
          <h1>Talent Manager Pro</h1>
          <span>Gestión Integral de Carrera & Oportunidades</span>
        </div>
      </div>

      {/* Pestañas Principales */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <Layers size={16} />
          <span>Candidaturas & Follow-up</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
          onClick={() => setActiveTab('agent')}
        >
          <Bot size={16} color="#38bdf8" />
          <span>Agente IA (Navegador)</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'career' ? 'active' : ''}`}
          onClick={() => setActiveTab('career')}
        >
          <Compass size={16} />
          <span>Plan de Carrera & Skills</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'linkedin' ? 'active' : ''}`}
          onClick={() => setActiveTab('linkedin')}
        >
          <Share2 size={16} />
          <span>LinkedIn & Visibilidad</span>
        </button>
      </nav>

      {/* Botones de Acción */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="icon-btn" onClick={onOpenSettings} title="Configuración IA" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
          <Settings size={18} color="#94a3b8" />
        </button>
        <button className="btn btn-primary" onClick={onOpenNewApp}>
          <Plus size={16} />
          <span>Nueva Candidatura</span>
        </button>
      </div>
    </header>
  );
}
