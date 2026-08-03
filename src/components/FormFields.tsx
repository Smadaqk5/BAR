import React from 'react';
import { AAMVAData } from '../types';
import { 
  EYE_COLORS, 
  HAIR_COLORS, 
  COMPLIANCE_OPTIONS, 
  TRUNCATION_OPTIONS, 
  GENDER_OPTIONS, 
  RACE_OPTIONS, 
  US_STATES, 
  CAN_PROVINCES 
} from '../constants';

// Shared utility components for the Bryt Barcode theme

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function FormSection({ title, icon, children }: SectionProps) {
  return (
    <div className="bg-[#FAF7EC] border border-[#0B2519]/15 rounded-xl p-5 shadow-lg select-none">
      <div className="flex items-center gap-2 border-b border-[#0B2519]/10 pb-2 mb-4">
        {icon}
        <h2 className="text-[11px] font-bold text-[#0B2519]/70 font-mono uppercase tracking-[0.15em]">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

interface CommonFieldProps {
  label: string;
  tag: string;
  required?: boolean;
  onFocus: () => void;
}

interface TextInputProps extends CommonFieldProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  className?: string;
}

export function TextInput({
  label,
  tag,
  required,
  value,
  onChange,
  onFocus,
  placeholder,
  maxLength,
  className = ""
}: TextInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] uppercase font-bold tracking-wider text-[#0B2519]/80 font-sans flex items-center justify-between">
        <span>{label} {required && <span className="text-[#FF5C00] font-black">*</span>}</span>
        <span className="text-[#0B2519]/50 text-[9px] font-mono">[{tag}]</span>
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        className="w-full bg-[#FFFFFF] border border-[#0B2519]/25 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-2.5 py-1.8 text-xs text-[#061E13] uppercase outline-none transition font-mono font-bold placeholder-[#0B2519]/30"
        maxLength={maxLength}
      />
    </div>
  );
}

interface SelectProps extends CommonFieldProps {
  value: string;
  onChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SelectInput({
  label,
  tag,
  required,
  value,
  onChange,
  onFocus,
  children,
  className = ""
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] uppercase font-bold tracking-wider text-[#0B2519]/80 font-sans flex items-center justify-between">
        <span>{label} {required && <span className="text-[#FF5C00] font-black">*</span>}</span>
        <span className="text-[#0B2519]/50 text-[9px] font-mono">[{tag}]</span>
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        className="w-full bg-[#FFFFFF] border border-[#0B2519]/25 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-2.5 py-1.8 text-xs text-[#061E13] uppercase outline-none transition cursor-pointer font-sans font-bold"
      >
        {children}
      </select>
    </div>
  );
}
