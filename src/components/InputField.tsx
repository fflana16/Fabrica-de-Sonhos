import React from 'react';

interface InputFieldProps {
  icon: React.ElementType;
  label: string;
  name: string;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  type?: string;
  error?: boolean;
  options?: { value: string; label: string }[];
}

export const InputField = ({ icon: Icon, label, name, value, onChange, required = false, readOnly = false, placeholder = '', type = 'text', error, options }: InputFieldProps) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1">
      {label} {required && <span className="text-gold">*</span>}
    </label>
    <div className="relative flex items-center">
      <div className="absolute left-3 text-gold-dark/60">
        <Icon size={16} />
      </div>
      {type === 'select' && options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`w-full bg-white/40 backdrop-blur-sm border ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-gold/30'} rounded-xl py-2 pl-9 pr-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all ${readOnly ? 'opacity-70 cursor-not-allowed bg-gray-50/50' : 'hover:bg-white/60'}`}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full bg-white/40 backdrop-blur-sm border ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-gold/30'} rounded-xl py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all ${readOnly ? 'opacity-70 cursor-not-allowed bg-gray-50/50' : 'hover:bg-white/60'}`}
        />
      )}
    </div>
    {error && <span className="text-[10px] text-red-500 ml-1">Campo obrigatório</span>}
  </div>
);
