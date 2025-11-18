'use client';

import { BookOpen, Upload, User } from 'lucide-react';

interface HeaderProps {
  user?: { role: string; username: string; name?: string } | null;
  authUser?: { role: string; username: string; name?: string } | null;
  onLogout?: () => void;
  onViewChange?: (view: 'reading' | 'upload' | 'debug') => void;
}

const Header: React.FC<HeaderProps> = ({ user, authUser, onLogout, onViewChange }) => {
  return (
    <div className="bg-gray-900 text-gray-100 px-4 py-3 flex-shrink-0">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold text-yellow-400">GAURAMRITA</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => onViewChange?.('upload')}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
                title="Upload Books"
              >
                <Upload className="w-5 h-5" />
              </button>
            </>
          )}
          <span className="text-sm">{(user || authUser)?.name || (user || authUser)?.username || 'Guest User'}</span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Logout"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;