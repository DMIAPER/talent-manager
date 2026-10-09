import React, { useState } from 'react';
import { MessageSquare, Calendar, Plus, User, Clock } from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function InteractionsModal({ app, onClose, onSuccess }) {
  const [newInt, setNewInt] = useState({
    date: new Date().toISOString().substring(0, 10),
    type: 'email',
    contact_person: app.contact_person || '',
    notes: ''
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newInt.notes) return;
    try {
      await api.addInteraction(app.id, newInt);
      setNewInt({
        date: new Date().toISOString().substring(0, 10),
        type: 'email',
        contact_person: app.contact_person || '',
        notes: ''
      });
      onSuccess();
    } catch (err) {
      alert('Error añadiendo interacción');
    }
  };

  const handleScheduleInterview = async () => {
    try {
      const res = await api.generateCalendarLink({
        title: `Entrevista: ${app.role} en ${app.company}`,
        company: app.company,
        role: app.role,
        url: app.url,
        notes: `Entrevista de selección con ${app.contact_person || app.company}.`,
        event_type: 'interview',
        duration_minutes: 45
      });
      if (res.google_calendar_url) {
        window.open(res.google_calendar_url, '_blank');
      }
    } catch (e) {
      alert('Error generando enlace de calendario');
    }
  };

  return (
    <ModalPortal isOpen={Boolean(app)}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-fade-in" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
              Bitácora de Interacciones (CRM)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {app.role} en <strong style={{ color: '#38bdf8' }}>{app.company}</strong>
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleScheduleInterview}>
            <Calendar size={13} color="#818cf8" />
            <span>Agendar Entrevista</span>
          </button>
        </div>

        {/* Timeline existente */}
        <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!app.interactions || app.interactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '1rem', fontSize: '0.85rem' }}>
              No hay interacciones registradas aún.
            </div>
          ) : (
            app.interactions.map((it, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
                    {it.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{it.date}</span>
                </div>
                {it.contact_person && (
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={11} /> {it.contact_person}
                  </div>
                )}
                <p style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>{it.notes}</p>
              </div>
            ))
          )}
        </div>

        {/* Formulario para nueva interacción */}
        <form onSubmit={handleAdd} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.85rem' }}>
            Registrar Nuevo Contacto
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                className="form-input"
                value={newInt.date}
                onChange={(e) => setNewInt({ ...newInt, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Canal / Tipo</label>
              <select
                className="form-select"
                value={newInt.type}
                onChange={(e) => setNewInt({ ...newInt, type: e.target.value })}
              >
                <option value="email">Email enviado / recibido</option>
                <option value="linkedin">Mensaje de LinkedIn</option>
                <option value="phone">Llamada telefónica</option>
                <option value="interview_hr">Entrevista RRHH</option>
                <option value="interview_tech">Entrevista Técnica</option>
                <option value="technical_test">Prueba Técnica entregada</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Persona Contactada</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nombre del reclutador o entrevistador"
              value={newInt.contact_person}
              onChange={(e) => setNewInt({ ...newInt, contact_person: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Notas / Conclusiones del Contacto</label>
            <textarea
              className="form-textarea"
              rows={2}
              required
              placeholder="Resumen de la llamada, feedback recibido o próximos pasos acordados..."
              value={newInt.notes}
              onChange={(e) => setNewInt({ ...newInt, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={14} />
              <span>Guardar Interacción</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
