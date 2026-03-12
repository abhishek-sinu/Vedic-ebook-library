'use client';

import { BookOpen } from 'lucide-react';

interface FooterControlsProps {
  onAboutBook?: () => void;
}

const FooterControls: React.FC<FooterControlsProps> = ({ onAboutBook }) => {
  return (
    <div style={{ background: 'var(--card)', color: 'var(--text)', borderTop: '1px solid var(--border)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', left: 0, bottom: 0, width: '100%', zIndex: 101 }}>
      <button 
        onClick={onAboutBook}
        className="flex items-center space-x-2 transition-colors"
        style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '16px', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
      >
        <BookOpen className="w-5 h-5 mr-2" style={{ color: 'var(--text)' }} />
        <span className="text-sm">About the book</span>
      </button>
    </div>
  );
};

export default FooterControls;