"use client";
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ISKCONLogo from './ISKCONLogo';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { user, token: contextToken, login } = useAuth();
  const token =
    contextToken ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem('vedic_auth_token') ||
        sessionStorage.getItem('vedic_auth_token')));

  const [theme, setTheme]     = useState(user?.profile?.preferences?.theme || 'light');
  const [fontSize, setFontSize] = useState(user?.profile?.preferences?.fontSize || 'medium');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { BACKEND_API_URL } = await import('../lib/config');
      const res = await fetch(`${BACKEND_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          'profile.preferences.theme': theme,
          'profile.preferences.fontSize': fontSize,
        }),
      });
      const updated = await res.json();
      if (res.ok && updated?.data?.user) {
        login(updated.data.user, token || '');
        if (typeof window !== 'undefined') {
          document.body.setAttribute('data-theme', theme);
          document.body.style.fontSize =
            fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
        }
        setSuccess('Preferences saved successfully!');
      } else {
        setError(updated.message || 'Failed to save preferences');
      }
    } catch {
      setError('Failed to save preferences');
    }
    setLoading(false);
  };

  /* ── Shared select style ────────────────────────────────── */
  const selectStyle: React.CSSProperties = {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--input-text)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.875rem',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--modal-overlay)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="vb-modal w-full relative"
        style={{ maxWidth: 420, padding: '2rem' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-lg font-bold"
          style={{ color: 'var(--text-muted)', lineHeight: 1 }}
          title="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <ISKCONLogo size={40} />
          <h2
            className="text-xl font-bold text-center"
            style={{ color: 'var(--modal-text)', fontFamily: '"Noto Serif Devanagari", Georgia, serif' }}
          >
            Preferences
          </h2>
          <div className="lotus-divider" style={{ width: '100%' }}>
            <span>✦</span>
          </div>
        </div>

        {/* Theme */}
        <div className="mb-5">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: 'var(--modal-label)' }}
          >
            Theme
          </label>
          <select
            style={selectStyle}
            value={theme}
            onChange={e => setTheme(e.target.value)}
            onFocus={e => {
              (e.target as HTMLSelectElement).style.borderColor = 'var(--input-focus)';
              (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(251,191,36,0.2)';
            }}
            onBlur={e => {
              (e.target as HTMLSelectElement).style.borderColor = 'var(--input-border)';
              (e.target as HTMLSelectElement).style.boxShadow = 'none';
            }}
          >
            <option value="light">🌅 Light — Parchment</option>
            <option value="dark">🌙 Dark — Sandalwood Night</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="mb-6">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: 'var(--modal-label)' }}
          >
            Text Size
          </label>
          <select
            style={selectStyle}
            value={fontSize}
            onChange={e => setFontSize(e.target.value)}
            onFocus={e => {
              (e.target as HTMLSelectElement).style.borderColor = 'var(--input-focus)';
              (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(251,191,36,0.2)';
            }}
            onBlur={e => {
              (e.target as HTMLSelectElement).style.borderColor = 'var(--input-border)';
              (e.target as HTMLSelectElement).style.boxShadow = 'none';
            }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium (Recommended)</option>
            <option value="large">Large</option>
          </select>
        </div>

        {/* Feedback */}
        {success && (
          <div
            className="mb-4 p-3 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(21,128,61,0.12)', color: 'var(--modal-success)', border: '1px solid rgba(21,128,61,0.3)' }}
          >
            ✓ {success}
          </div>
        )}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--modal-error)', border: '1px solid rgba(220,38,38,0.3)' }}
          >
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          className="vb-btn-primary w-full"
          style={{ padding: '0.75rem', fontSize: '0.95rem' }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="vb-spinner w-4 h-4 inline-block" />
              Saving…
            </span>
          ) : (
            'Save Preferences'
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          🙏 Hare Krishna
        </p>
      </div>
    </div>
  );
};

export default Settings;
