import React from 'react';
import { cn } from '../utils/helpers';

const Slider = ({ 
  label, 
  value, 
  min = 0, 
  max = 100, 
  step = 1, 
  onChange, 
  suffix = '', 
  prefix = '',
  className 
}) => {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex justify-between items-center mb-3">
        {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
        <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
          {prefix}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 focus:outline-none"
      />
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-400">{prefix}{min}{suffix}</span>
        <span className="text-xs text-gray-400">{prefix}{max}{suffix}</span>
      </div>
    </div>
  );
};

export default Slider;
