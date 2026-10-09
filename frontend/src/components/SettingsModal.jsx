import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function SettingsModal({ onClose }) {
  const [keys, setKeys] = useState({});
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  
  const [geminiModels, setGeminiModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const data = await api.getApiKeys();
      setKeys(data);
      if (data.gemini?.model) {
        setSelectedModel(data.gemini.model);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadModels = async () => {
    setLoadingModels(true);
    setMsg(null);
    try {
      const data = await api.getGeminiModels();
      setGeminiModels(data.models || []);
    } catch (e) {
      setMsg({ type: 'error', text: 'Error al cargar modelos. Revisa tu API Key.' });
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSaveModel = async () => {
    if (!selectedModel) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.saveGeminiModel(selectedModel);
      setMsg({ type: 'success', text: res.message });
      fetchKeys();
    } catch (e) {
      setMsg({ type: 'error', text: 'Error al guardar el modelo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setMsg(null);
    try {
      const res = await api.testGeminiConnection();
      setMsg({ type: 'success', text: res.message });
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Error al probar la conexión con Gemini.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async (provider, value) => {
    if (!value) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.saveApiKey(provider, value);
      setMsg({ type: 'success', text: res.message });
      setGeminiKey('');
      fetchKeys();
    } catch (e) {
      setMsg({ type: 'error', text: 'Error al guardar la clave API.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content glass-panel" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={20} color="#38bdf8" />
            <h2>Configuración de IA</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {msg && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: msg.type === 'success' ? '#34d399' : '#f87171',
              border: `1px solid ${msg.type === 'success' ? '#34d399' : '#f87171'}`
            }}>
              {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span style={{ fontSize: '0.85rem' }}>{msg.text}</span>
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: '#fff', fontSize: '1rem' }}>Google AI Studio (Gemini)</strong>
                {keys.gemini?.configured && <span className="badge badge-emerald">Configurada</span>}
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Utilizada por el Agente Autónomo para el análisis de ATS y compatibilidad de CV en tiempo real.
            </p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="password" 
                className="form-input" 
                placeholder={keys.gemini?.configured ? `Actual: ${keys.gemini.masked} (escribe para cambiar)` : "Pega aquí tu API Key de Gemini..."}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-primary" 
                onClick={() => handleSave('gemini', geminiKey)}
                disabled={loading || !geminiKey}
              >
                <Save size={16} />
                Guardar Key
              </button>
            </div>

            {keys.gemini?.configured && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Modelo Seleccionado:</strong>
                  {geminiModels.length === 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={loadModels} disabled={loadingModels}>
                      {loadingModels ? 'Cargando...' : 'Cargar modelos'}
                    </button>
                  )}
                </div>
                
                {geminiModels.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      className="form-select" 
                      style={{ flex: 1 }} 
                      value={selectedModel} 
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      {geminiModels.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.display_name} ({m.name})
                        </option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSaveModel}
                      disabled={loading || !selectedModel}
                    >
                      <Save size={16} />
                      Guardar
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#38bdf8', fontSize: '0.8rem', margin: 0 }}>
                    Actualmente usas: <strong>{keys.gemini.model}</strong>. Carga los modelos para cambiarlo.
                  </p>
                )}

                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    style={{ border: '1px solid var(--border-subtle)' }}
                  >
                    {testingConnection ? 'Probando conexión...' : '⚡ Probar Conexión al Modelo'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', opacity: 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: '#fff', fontSize: '1rem' }}>OpenAI / ChatGPT</strong>
                <span className="badge badge-amber">Próximamente</span>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              Soporte para modelos gpt-4o y gpt-3.5-turbo en futuras actualizaciones del Agente.
            </p>
          </div>

        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
