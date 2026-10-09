import React, { useState, useEffect } from 'react';
import { Copy, Check, Calendar, Mail } from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function FollowUpTemplateModal({ app, onClose }) {
  const [copied, setCopied] = useState(false);
  const [candidateName, setCandidateName] = useState('');

  useEffect(() => {
    api.getProfile().then(prof => {
      const name = prof?.personal_info?.full_name?.trim();
      setCandidateName(name || '[Nombre no registrado - Por favor, completa tu perfil]');
    }).catch(() => {
      setCandidateName('[Nombre no registrado - Por favor, completa tu perfil]');
    });
  }, []);

  const defaultSign = candidateName || '[Nombre no registrado - Por favor, completa tu perfil]';
  const template = app.follow_up_template || {
    subject: `Seguimiento de candidatura: ${app.role} en ${app.company}`,
    body: `Estimado/a ${app.contact_person || 'equipo de selección'},\n\nLe escribo para dar seguimiento a mi candidatura para la posición de ${app.role} presentada recientemente...\n\nAtentamente,\n${defaultSign}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Asunto: ${template.subject}\n\n${template.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenCalendar = async () => {
    try {
      const res = await api.generateCalendarLink({
        title: `Follow-up enviado: ${app.role} en ${app.company}`,
        company: app.company,
        role: app.role,
        url: app.url,
        notes: `Enviado seguimiento con plantilla.`,
        event_type: 'follow_up'
      });
      if (res.google_calendar_url) {
        window.open(res.google_calendar_url, '_blank');
      }
    } catch (e) {
      alert('Error abriendo Google Calendar');
    }
  };

  return (
    <ModalPortal isOpen={Boolean(app)}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Mail size={22} color="#818cf8" />
          <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
            Plantilla de Follow-up Adaptada
          </h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          Redacción optimizada para <strong>{app.company}</strong>.
        </p>

        <div className="form-group">
          <label>Asunto Recomendado</label>
          <input
            type="text"
            readOnly
            className="form-input"
            value={template.subject}
            style={{ fontWeight: 600, color: '#38bdf8' }}
          />
        </div>

        <div className="form-group">
          <label>Cuerpo del Mensaje</label>
          <textarea
            readOnly
            rows={10}
            className="form-textarea"
            value={template.body}
            style={{ lineHeight: 1.6, fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={handleOpenCalendar}>
            <Calendar size={15} color="#818cf8" />
            <span>Agendar en Google Calendar</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button className="btn btn-primary" onClick={handleCopy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
