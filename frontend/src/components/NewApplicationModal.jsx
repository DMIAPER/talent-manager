import React, { useState } from 'react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function NewApplicationModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    sector: 'tech',
    url: '',
    salary_range: '',
    location_type: 'remote',
    location_city: '',
    status: 'applied',
    follow_up_days: 7,
    contact_person: '',
    contact_email: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createApplication(formData);
      onSuccess();
      onClose();
    } catch (e) {
      alert('Error creando candidatura');
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1.25rem' }}>
          Registrar Nueva Candidatura
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Empresa / Institución *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. CAS Training / Hospital Quirón"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Puesto / Rol *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. Python Senior / Coordinador Clínico"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Modalidad de Trabajo</label>
              <select
                className="form-select"
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
              >
                <option value="remote">100% Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
                <option value="shifts">Turnos / Guardias</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ciudad / Ubicación</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Badajoz, Remoto España, Madrid..."
                value={formData.location_city}
                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Enlace de la Oferta (URL)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Rango Salarial</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. 32.000€ - 38.000€"
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Plazo Follow-up (Días)</label>
              <input
                type="number"
                className="form-input"
                value={formData.follow_up_days}
                onChange={(e) => setFormData({ ...formData, follow_up_days: parseInt(e.target.value) || 7 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Persona de Contacto</label>
              <input
                type="text"
                className="form-input"
                placeholder="Reclutador / Director"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email de Contacto</label>
              <input
                type="email"
                className="form-input"
                placeholder="contacto@empresa.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notas de la Candidatura</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Detalles de la oferta, compatibilidad o requisitos clave..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Candidatura
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
