import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { cn } from '../utils/helpers';

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'sat', name: 'Santali', native: 'संथाली' },
  { code: 'ks', name: 'Kashmiri', native: 'کٲশُر' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'mni', name: 'Manipuri', native: 'মণিপুরী' }
];

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === selectedLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border border-transparent",
          isOpen 
            ? "bg-primary-50 border-primary-100 text-primary-700 shadow-sm" 
            : "text-gray-600 hover:bg-gray-50 hover:text-primary-600"
        )}
      >
        <div className="p-1 bg-white rounded-lg shadow-sm">
          <Languages className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium hidden sm:inline-block">
          {currentLang.native}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 max-h-[400px] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-2 scrollbar-thin scrollbar-thumb-gray-200"
          >
            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
              Select Language (UI Showcase)
            </div>
            <div className="grid grid-cols-1 gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl transition-all group",
                    selectedLang === lang.code
                      ? "bg-primary-50 text-primary-700"
                      : "hover:bg-primary-50/50 text-gray-600 hover:text-primary-600"
                  )}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold">{lang.native}</span>
                    <span className="text-[10px] opacity-60 font-medium">{lang.name}</span>
                  </div>
                  {selectedLang === lang.code && (
                    <Check className="w-3 h-3 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
