'use client';

import { BookOpen } from 'lucide-react';

interface FooterControlsProps {
  onAboutBook?: () => void;
}

const FooterControls: React.FC<FooterControlsProps> = ({ onAboutBook }) => {
  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4 flex-shrink-0">
      <div className="flex items-center justify-center">
        <button 
          onClick={onAboutBook}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-sm">About the book</span>
        </button>
      </div>
    </div>
  );
};

export default FooterControls;