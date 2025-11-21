"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { user, token: contextToken, login } = useAuth();
  // Fallback to token from storage if context is empty (handles refresh edge cases)
  const token = contextToken ||
    (typeof window !== 'undefined' && (localStorage.getItem('vedic_auth_token') || sessionStorage.getItem('vedic_auth_token')));
  const [theme, setTheme] = useState(user?.profile?.preferences?.theme || 'dark');
  const [fontSize, setFontSize] = useState(user?.profile?.preferences?.fontSize || 'medium');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          'profile.preferences.theme': theme,
          'profile.preferences.fontSize': fontSize
        }),
      });
      const updated = await res.json();
      if (res.ok && updated && updated.data && updated.data.user) {
        login(updated.data.user, token || "");
        setSuccess('Preferences saved!');
      } else {
        setError(updated.message || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Failed to save preferences');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-xl p-8 w-full max-w-md border border-yellow-400 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-yellow-400 hover:text-yellow-200">✕</button>
        <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Settings</h2>
        <div className="mb-4">
        <label className="block font-semibold mb-1 text-gray-100">Theme</label>
        <select
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-full text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={theme}
          onChange={e => setTheme(e.target.value)}
        >
          <option value="light">Light (Default)</option>
          <option value="dark">Dark</option>
        </select>
      </div>
        <div className="mb-4">
        <label className="block font-semibold mb-1 text-gray-100">Font Size</label>
        <select
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-full text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={fontSize}
          onChange={e => setFontSize(e.target.value)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium (Default)</option>
          <option value="large">Large</option>
        </select>
      </div>
        {success && <div className="text-green-400 mb-2">{success}</div>}
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded w-full"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
