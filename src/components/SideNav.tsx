'use client';

import { Settings, User, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

interface SideNavProps {
  selectedLanguage: string;
  languageConfig: {
    [key: string]: {
      label: string;
      code: string;
      icon: string;
      count: number;
    };
  };
  isCategoryPanelVisible: boolean;
  onLanguageToggle: (language: string) => void;
  onCategoryPanelToggle: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ 
  selectedLanguage, 
  languageConfig, 
  isCategoryPanelVisible,
  onLanguageToggle,
  onCategoryPanelToggle
}) => {
  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4">
      {/* Panel Toggle Button */}
      <button 
        onClick={onCategoryPanelToggle}
        className="p-2 text-gray-400 hover:text-white transition-colors"
        title={isCategoryPanelVisible ? 'Hide Categories Panel' : 'Show Categories Panel'}
      >
        {isCategoryPanelVisible ? (
          <PanelLeftClose className="w-5 h-5" />
        ) : (
          <PanelLeftOpen className="w-5 h-5" />
        )}
      </button>

      {/* Separator */}
      <div className="w-8 border-t border-gray-700"></div>
      
      {Object.entries(languageConfig).map(([langKey, config]) => (
        <button
          key={langKey}
          onClick={() => onLanguageToggle(langKey)}
          className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors ${
            selectedLanguage === langKey
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={config.label}
        >
          {config.icon}
        </button>
      ))}
      
      {/* Navigation Icons */}
      <div className="flex flex-col space-y-4 pt-6 border-t border-gray-700">
        <button className="p-2 text-gray-400 hover:text-white">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-white">
          <User className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SideNav;