import React, { useState } from 'react';
import { Sparkles, Dices, Wand2, Check } from 'lucide-react';
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

// Shared utility components for the Bryt Barcode theme & Client Portal

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
}

export function FormSection({ title, icon, children, action, subtitle }: SectionProps) {
  return (
    <div className="bg-[#FAF7EC] border border-[#0B2519]/15 rounded-xl p-5 shadow-sm select-none transition hover:border-[#0B2519]/25">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0B2519]/10 pb-2.5 mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-[11px] font-extrabold text-[#0B2519]/80 font-mono uppercase tracking-[0.15em]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-[#0B2519]/50 font-sans">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex items-center gap-1.5">
            {action}
          </div>
        )}
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
  onGenerate?: () => void;
  generateLabel?: string;
  generateTitle?: string;
  helperText?: React.ReactNode;
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
  onGenerate,
  generateLabel = "Generate",
  generateTitle = "Auto-generate realistic compliant value",
  helperText,
  placeholder,
  maxLength,
  className = ""
}: TextInputProps) {
  const [justGenerated, setJustGenerated] = useState(false);

  const handleGenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onGenerate) {
      onGenerate();
      setJustGenerated(true);
      setTimeout(() => setJustGenerated(false), 1200);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] uppercase font-bold tracking-wider text-[#0B2519]/80 font-sans flex items-center gap-1 truncate">
          <span>{label}</span>
          {required && <span className="text-[#FF5C00] font-black">*</span>}
          <span className="text-[#0B2519]/40 text-[9px] font-mono font-normal">[{tag}]</span>
        </label>
        
        {onGenerate && (
          <button
            type="button"
            onClick={handleGenerateClick}
            title={generateTitle}
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
              justGenerated
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#FF5C00]/10 hover:bg-[#FF5C00] text-[#FF5C00] hover:text-white border border-[#FF5C00]/30 hover:border-[#FF5C00]'
            }`}
          >
            {justGenerated ? (
              <>
                <Check className="h-2.5 w-2.5" />
                <span>Generated!</span>
              </>
            ) : (
              <>
                <Sparkles className="h-2.5 w-2.5" />
                <span>{generateLabel}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          className={`w-full bg-[#FFFFFF] border rounded px-2.5 py-1.8 text-xs text-[#061E13] uppercase outline-none transition font-mono font-bold placeholder-[#0B2519]/30 ${
            justGenerated
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
              : 'border-[#0B2519]/25 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00]'
          }`}
          maxLength={maxLength}
        />
        {onGenerate && (
          <button
            type="button"
            onClick={handleGenerateClick}
            title={generateTitle}
            tabIndex={-1}
            className="absolute right-1.5 p-1 text-[#0B2519]/40 hover:text-[#FF5C00] transition rounded hover:bg-[#FAF7EC] cursor-pointer"
          >
            <Wand2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {helperText && (
        <div className="text-[9px] text-[#0B2519]/60 font-mono leading-tight">
          {helperText}
        </div>
      )}
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
  onGenerate,
  generateLabel = "Randomize",
  generateTitle = "Randomize selection",
  helperText,
  children,
  className = ""
}: SelectProps) {
  const [justGenerated, setJustGenerated] = useState(false);

  const handleGenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onGenerate) {
      onGenerate();
      setJustGenerated(true);
      setTimeout(() => setJustGenerated(false), 1200);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] uppercase font-bold tracking-wider text-[#0B2519]/80 font-sans flex items-center gap-1 truncate">
          <span>{label}</span>
          {required && <span className="text-[#FF5C00] font-black">*</span>}
          <span className="text-[#0B2519]/40 text-[9px] font-mono font-normal">[{tag}]</span>
        </label>
        
        {onGenerate && (
          <button
            type="button"
            onClick={handleGenerateClick}
            title={generateTitle}
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
              justGenerated
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#FF5C00]/10 hover:bg-[#FF5C00] text-[#FF5C00] hover:text-white border border-[#FF5C00]/30 hover:border-[#FF5C00]'
            }`}
          >
            {justGenerated ? (
              <>
                <Check className="h-2.5 w-2.5" />
                <span>Selected!</span>
              </>
            ) : (
              <>
                <Dices className="h-2.5 w-2.5" />
                <span>{generateLabel}</span>
              </>
            )}
          </button>
        )}
      </div>

      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        className="w-full bg-[#FFFFFF] border border-[#0B2519]/25 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-2.5 py-1.8 text-xs text-[#061E13] uppercase outline-none transition cursor-pointer font-sans font-bold"
      >
        {children}
      </select>
      {helperText && (
        <div className="text-[9px] text-[#0B2519]/60 font-mono leading-tight">
          {helperText}
        </div>
      )}
    </div>
  );
}

