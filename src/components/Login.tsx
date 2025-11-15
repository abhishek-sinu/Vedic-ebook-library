'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, BookOpen } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Auto-fill demo credentials on component mount
  useEffect(() => {
    setUsername('Admin');
    setPassword('Hari@108');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('vedic_auth_token', data.token);
      storage.setItem('vedic_user', JSON.stringify(data.user));

      // Call the success callback
      onLoginSuccess(data.user, data.token);

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (userType: 'admin' | 'user') => {
    if (userType === 'admin') {
      setUsername('Admin');
      setPassword('Hari@108');
    } else {
      setUsername('Devotee');
      setPassword('Radhe@123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{background: 'linear-gradient(135deg, var(--deep-blue) 0%, var(--navy) 100%)'}}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4" style={{background: 'var(--saffron)'}}>
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" style={{color: 'var(--deep-blue)'}} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">वेदिक ग्रंथालय</h1>
          <h2 className="text-lg sm:text-xl text-orange-200 mb-2">Vedic E-Books Library</h2>
          <p className="text-orange-100 text-xs sm:text-sm">Sacred texts and spiritual literature</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8" style={{background: 'var(--cream)'}}>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold" style={{color: 'var(--deep-blue)'}}>
                प्रवेश / Login
              </h3>
              <p className="text-gray-600 text-sm mt-1">Enter your credentials to access the library</p>
            </div>

            {/* Quick Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="py-2 px-4 rounded-lg text-sm border border-orange-300 hover:bg-orange-50 transition-colors"
                style={{color: 'var(--deep-blue)'}}
              >
                👑 Admin Demo
              </button>
              <button
                type="button"
                onClick={() => quickLogin('user')}
                className="py-2 px-4 rounded-lg text-sm border border-orange-300 hover:bg-orange-50 transition-colors"
                style={{color: 'var(--deep-blue)'}}
              >
                🙏 Devotee Demo
              </button>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--deep-blue)'}}>
                उपयोगकर्ता नाम / Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--deep-blue)'}}>
                कूटशब्द / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 focus:ring-orange-400"
                style={{accentColor: 'var(--saffron)'}}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                याद रखें / Remember me
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={{background: 'var(--saffron)', color: 'var(--deep-blue)'}}
            >
              {isLoading ? 'प्रवेश हो रहा है... / Signing in...' : 'प्रवेश करें / Sign In'}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">📝 Demo Credentials</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Admin:</strong> Admin / Hari@108</p>
              <p><strong>Devotee:</strong> Devotee / Radhe@123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-orange-200 text-sm">
            🕉️ Dedicated to the service of Śrī Kṛṣṇa 🕉️
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;