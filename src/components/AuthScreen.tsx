import React, { useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  Lock
} from 'lucide-react';
import { PortalStore } from '../utils/portalStore';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onSuccess: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = identifier.trim();

    if (!cleanInput) {
      setError('Please enter your account email or client ID.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = PortalStore.login(cleanInput, password);
      setIsLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#04140D] flex flex-col items-center justify-center p-4 selection:bg-[#FF5C00] selection:text-white relative overflow-hidden font-sans">
      
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#0C2A1E]/80 rounded-full blur-3xl pointer-events-none" />

      {/* Main Client Authentication Card */}
      <div className="w-full max-w-md bg-[#0C2A1E]/95 border border-[#1A4B36] rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2.5 mb-7">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5C00] to-[#E04800] flex items-center justify-center shadow-[0_4px_20px_rgba(255,92,0,0.4)] border border-[#FF8442]/40">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              BRYT <span className="text-[#FF5C00]">BARCODE TEC</span>
            </h1>
            <p className="text-xs text-[#D5EFE3]/70 mt-1">
              Client Portal & AAMVA Barcode Workstation
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-red-200 text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Client Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
              Client ID or Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="client@company.com or Client ID"
                autoComplete="username"
                className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-3 pl-10 text-xs outline-none transition placeholder:text-[#D5EFE3]/30 font-sans"
                required
              />
              <Mail className="h-4 w-4 text-[#D5EFE3]/40 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-3 pl-10 text-xs outline-none transition placeholder:text-[#D5EFE3]/30 font-sans"
              />
              <KeyRound className="h-4 w-4 text-[#D5EFE3]/40 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#FF5C00] hover:bg-[#FF731E] active:scale-[0.98] text-white font-bold font-sans py-3.5 px-4 rounded-xl transition shadow-[0_4px_16px_rgba(255,92,0,0.35)] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-7 text-center text-[10px] text-[#D5EFE3]/40 font-mono flex items-center justify-center gap-1.5 border-t border-[#1A4B36]/60 pt-4">
          <Lock className="h-3 w-3" />
          <span>256-Bit Encrypted Client Session</span>
        </div>

      </div>
    </div>
  );
};
