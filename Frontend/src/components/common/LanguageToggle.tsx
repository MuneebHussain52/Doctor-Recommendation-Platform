import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md w-full transition-colors group"
    >
      <div className="flex items-center">
        <div className="mr-3 h-5 w-5 text-gray-400 flex items-center justify-center">
          {language === 'english' ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </div>
        <span>
          {language === 'english' ? t('language.urdu') : t('language.english')}
        </span>
      </div>
      <div className="flex items-center">
        {language === 'english' ? (
          <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
        )}
      </div>
    </button>
  );
};

export default LanguageToggle;