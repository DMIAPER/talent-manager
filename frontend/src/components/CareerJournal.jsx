import React, { useState } from 'react';
import { BookOpen, Plus, Tag, Trash2, Calendar, Sparkles, Filter } from 'lucide-react';
import { api } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

const CATEGORIES = [
  { id: 'all', label: 'Todas las Notas' },
  { id: 'learning', label: '📚 Aprendizajes & Cursos' },
  { id: 'certification', label: '🏅 Certificaciones en Curso' },
  { id: 'wishlist', label: '✨ Deseos Formativos' },
  { id: 'experience', label: '💼 Experiencia Práctica & Labs' }
];

export default function CareerJournal({ planId, journal = [], onRefresh }) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('learning');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await api.addCareerJournalEntry(planId, {
        id: '',
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        title: title.trim(),
        content: content.trim(),
        category,
        tags
      });

      setTitle('');
      setContent('');
      setTagsInput('');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error guardando apunte en la bitácora');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (journalId) => {
    if (!window.confirm('¿Deseas eliminar este apunte de la bitácora?')) return;
    try {
      await api.deleteCareerJournalEntry(planId, journalId);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error eliminando apunte');
    }
  };

  const filteredEntries = filterCategory === 'all' 
    ? journal 
    : journal.filter(j => j.category === filterCategory);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Formulario de Nuevo Apunte en Bitácora */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BookOpen size={18} color="#818cf8" />
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
            Bitácora de Aprendizaje y Metas Formativas
          </h4>
        </div>

        <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '0.75rem' }}>
            <input
              type="text"
              required
              placeholder="Título del apunte (ej: Laboratorio de escaneo con Nmap / Dudas de Docker)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
                color: '#f8fafc',
                fontWeight: 500,
                fontSize: '0.825rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="learning" style={{ background: '#111a2e', color: '#f8fafc' }}>📚 Aprendizajes</option>
              <option value="certification" style={{ background: '#111a2e', color: '#f8fafc' }}>🏅 Certificación</option>
              <option value="wishlist" style={{ background: '#111a2e', color: '#f8fafc' }}>✨ Deseo Formativo</option>
              <option value="experience" style={{ background: '#111a2e', color: '#f8fafc' }}>💼 Experiencia / Lab</option>
            </select>
          </div>

          <textarea
            required
            rows={3}
            placeholder="Anota tus impresiones, temas estudiados, conclusiones prácticas o enlaces de interés..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Etiquetas separadas por comas (ej: nmap, ciberseguridad, lab1)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem' }}
            >
              <Plus size={15} />
              <span>{saving ? 'Guardando...' : 'Añadir a Bitácora'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Filtro de Categorías */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Filter size={12} /> Categoría:
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            style={{
              background: filterCategory === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${filterCategory === cat.id ? '#818cf8' : 'rgba(255, 255, 255, 0.08)'}`,
              color: filterCategory === cat.id ? '#fff' : '#94a3b8',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Listado de Entradas de la Bitácora */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredEntries.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            color: '#64748b',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px'
          }}>
            Sin apuntes registrados en esta categoría de la bitácora.
          </div>
        ) : (
          filteredEntries.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem', marginBottom: '0.25rem' }}>
                    {item.category === 'certification' ? '🏅 Certificación' : (item.category === 'wishlist' ? '✨ Deseo' : (item.category === 'experience' ? '💼 Lab/Práctica' : '📚 Aprendizaje'))}
                  </span>
                  <h5 style={{ margin: '0.2rem 0', fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
                    {item.title}
                  </h5>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                    {item.date}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteEntry(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Eliminar apunte"
                >
                  <Trash2 size={14} color="#f87171" />
                </button>
              </div>

              <div style={{ margin: '0.35rem 0', fontSize: '0.85rem' }}>
                <MarkdownRenderer content={item.content} />
              </div>

              {item.tags && item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {item.tags.map((tg, tgIdx) => (
                    <span key={tgIdx} className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                      #{tg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
