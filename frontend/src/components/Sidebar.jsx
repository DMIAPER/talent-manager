import { 
  User, 
  Columns, 
  TrendingUp, 
  Bot, 
  Settings, 
  RotateCcw, 
  Briefcase, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  History,
  FileCheck
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  onSelectTab, 
  onOpenSettings, 
  onResetAll,
  agentStatus = 'idle',
  userProfile = null,
  isCollapsed = false,
  onToggleCollapse
}) {
  const navItems = [
    { id: 'profile', label: 'Mi Perfil & CV', icon: User, color: '#38bdf8' },
    { id: 'documents', label: 'Documentos & PDF (A4)', icon: FileCheck, color: '#f59e0b' },
    { id: 'kanban', label: 'Pipeline Kanban', icon: Columns, color: '#818cf8' },
    { id: 'history', label: 'Historial & Métricas', icon: History, color: '#10b981' },
    { id: 'career', label: 'Plan de Carrera & Skills', icon: TrendingUp, color: '#34d399' },
    { id: 'agent', label: 'Agente de IA', icon: Bot, color: '#f43f5e' }
  ];

  const hasName = Boolean(userProfile?.personal_info?.full_name && userProfile.personal_info.full_name.trim());
  const fullName = hasName ? userProfile.personal_info.full_name.trim() : '[Nombre no registrado]';
  const headline = userProfile?.personal_info?.headline || (hasName ? 'Configura tu perfil' : 'Haz clic para registrar tu nombre');

  return (
    <aside 
      style={{
        width: isCollapsed ? '72px' : '260px',
        minWidth: isCollapsed ? '72px' : '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'linear-gradient(180deg, rgba(15, 20, 35, 0.98) 0%, rgba(10, 13, 24, 0.99) 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isCollapsed ? '1.25rem 0.5rem' : '1.25rem 1rem',
        transition: 'width 0.3s ease',
        zIndex: 100,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* 1. CABECERA / BRAND Y PERFIL */}
      <div>
        {/* Marca y Botón Colapsar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '1.75rem' }}>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div 
                style={{ 
                  width: 34, 
                  height: 34, 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
                }}
              >
                <Briefcase size={18} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  Talent<span style={{ color: '#38bdf8' }}>Manager</span>
                </h1>
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Pro Edition
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div 
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Briefcase size={20} color="#fff" />
            </div>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#94a3b8',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isCollapsed ? 'Expandir barra' : 'Colapsar barra'}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>

        {/* Tarjeta de Usuario Resumida */}
        {!isCollapsed ? (
          <div 
            onClick={() => onSelectTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: '12px',
              background: currentTab === 'profile' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: currentTab === 'profile' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <div 
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {fullName}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {headline}
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onSelectTab('profile')}
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              margin: '0 auto 1.5rem auto',
              cursor: 'pointer'
            }}
            title={fullName}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* 2. MENÚ DE NAVEGACIÓN PRINCIPAL */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isCollapsed ? '0.75rem 0' : '0.7rem 0.85rem',
                  borderRadius: '10px',
                  border: isActive ? `1px solid ${item.color}55` : '1px solid transparent',
                  background: isActive ? `${item.color}15` : 'transparent',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  width: '100%',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                title={item.label}
              >
                <Icon size={18} color={isActive ? item.color : '#64748b'} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. PARTE INFERIOR: ESTADO DEL AGENTE, AJUSTES Y RESET A 0 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
        {/* Indicador de estado del Agente */}
        {!isCollapsed ? (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 10px', 
              borderRadius: '8px', 
              background: 'rgba(255, 255, 255, 0.02)',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}
          >
            <div 
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: agentStatus === 'processing' ? '#38bdf8' : (agentStatus === 'error' ? '#ef4444' : '#10b981'),
                boxShadow: `0 0 6px ${agentStatus === 'processing' ? '#38bdf8' : '#10b981'}`
              }} 
              className={agentStatus === 'processing' ? 'animate-ping' : ''}
            />
            <span style={{ flex: 1 }}>
              {agentStatus === 'processing' ? 'Agente Buscando...' : 'Agente IA Listo'}
            </span>
          </div>
        ) : (
          <div 
            style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#10b981',
              margin: '0 auto',
              boxShadow: '0 0 6px #10b981'
            }} 
            title="Agente IA Listo"
          />
        )}

        {/* Botón de Ajustes de API Key */}
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.85rem',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.8rem',
            cursor: 'pointer',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%'
          }}
          title="Configuración de API Keys"
        >
          <Settings size={16} />
          {!isCollapsed && <span>Ajustes & API Keys</span>}
        </button>

        {/* Botón de Restablecer a Estado 0 */}
        <button
          onClick={onResetAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.85rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            fontSize: '0.78rem',
            cursor: 'pointer',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%'
          }}
          title="Restablecer toda la aplicación a 0"
        >
          <RotateCcw size={15} />
          {!isCollapsed && <span>Restablecer a 0</span>}
        </button>
      </div>
    </aside>
  );
}
