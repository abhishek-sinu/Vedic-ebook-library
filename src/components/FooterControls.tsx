'use client';

import { BookOpen } from 'lucide-react';

interface FooterControlsProps {
  onAboutBook?: () => void;
}

const FooterControls: React.FC<FooterControlsProps> = ({ onAboutBook }) => {
  return (
    <div style={{ background: 'var(--card)', color: 'var(--text)', borderTop: '1px solid var(--border)' }} className="p-4 flex-shrink-0">
      <div className="flex items-center justify-center">
        <button 
          onClick={onAboutBook}
          className="flex items-center space-x-2 transition-colors"
          style={{ color: 'var(--text)' }}
        >
          <BookOpen className="w-4 h-4" style={{ color: 'var(--text)' }} />
          <span className="text-sm">About the book</span>
        </button>
      </div>
    </div>
  );
};

export default FooterControls;