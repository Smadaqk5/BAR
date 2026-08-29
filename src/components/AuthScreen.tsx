import React, { useState } from 'react';
import { 
  Shield, 
  Key, 
  ArrowRight, 
  Lock, 
  Copy, 
  Check, 
  UserPlus, 
  Sparkles, 
  AlertTriangle, 
  Clock
} from 'lucide-react';
import { PortalStore } from '../utils/portalStore';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onSuccess: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [uniqueIdInput, setUniqueIdInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New generated account state
  const [generatedAccount, setGeneratedAccount] = useState<{ user: UserType; uniqueId: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [hasConfirmedSaved, setHasConfirmedSaved] = useState(false);

  // Handle Login with Unique ID
  const handleLoginWithId = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = uniqueIdInput.trim();
    if (!cleanInput) {
      setError('Please enter your Unique Client ID to sign in.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = PortalStore.loginWithUniqueId(cleanInput);
      setIsLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'Unique ID not found. Please click "Sign Up" below to generate a new ID.');
      }
    }, 200);
  };

  // Handle New Member Sign Up (Generate Unique ID)
  const handleSignUp = () => {
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const result = PortalStore.registerNewClient();
      setIsLoading(false);
      setGeneratedAccount(result);
      setIsCopied(false);
      setHasConfirmedSaved(false);
    }, 250);
  };

  // Handle Copy Generated ID
  const handleCopyId = () => {
    if (!generatedAccount) return;
    navigator.clipboard.writeText(generatedAccount.uniqueId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Handle Proceed into portal after saving ID
  const handleProceedToPortal = () => {
    if (!generatedAccount) return;
    onSuccess(generatedAccount.user);
  };

  const handlePasteId = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUniqueIdInput(text.trim());
        setError('');
      }
    } catch {
      // Ignore clipboard read errors
    }
  };

  return (
    <div className="min-h-screen bg-[#04140D] flex flex-col items-center justify-center p-4 selection:bg-[#FF5C00] selection:text-white relative overflow-hidden font-sans">
      
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#0C2A1E]/80 rounded-full blur-3xl pointer-events-none" />

      {/* MODAL: NEW GENERATED UNIQUE ID NOTICE */}
      {generatedAccount && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0C2A1E] border-2 border-[#FF5C00] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(255,92,0,0.3)] flex flex-col gap-5 text-center relative">
            
            {/* Header Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5C00] to-[#E04800] flex items-center justify-center shadow-[0_4px_20px_rgba(255,92,0,0.5)] border border-[#FF8442]/50">
              <Key className="h-8 w-8 text-white" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5C00]/20 border border-[#FF5C00]/40 text-[#FF5C00] text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                <Sparkles className="h-3 w-3" />
                Account Created Successfully
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Your Unique Client ID
              </h2>
              <p className="text-xs text-[#D5EFE3]/80 mt-1 max-w-sm mx-auto">
                This Unique ID is your <strong className="text-white">only login credential</strong>. There are no passwords.
              </p>
            </div>

            {/* High-visibility ID Display & Copy */}
            <div className="bg-[#041A10] border-2 border-[#1A4B36] rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 shadow-inner">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D5EFE3]/60">
                Official Access Key
              </span>
              
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-[#FF5C00] select-all bg-[#082216] px-4 py-2.5 rounded-xl border border-[#1A4B36] w-full text-center">
                {generatedAccount.uniqueId}
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                className={`w-full py-3 px-4 rounded-xl font-bold font-mono text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FF5C00] hover:bg-[#FF731E] text-white'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>COPIED TO CLIPBOARD!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>COPY UNIQUE ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Critical Warning Box */}
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-left flex items-start gap-3 text-amber-200 text-xs">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-amber-300">CRITICAL: Save your ID before continuing!</span>
                <span className="text-amber-200/90 text-[11px] leading-relaxed">
                  Please copy and paste this Unique ID into a safe place (notes, password manager, or document). You will need it every time you log in.
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 font-mono mt-1 pt-1 border-t border-amber-500/20">
                  <Clock className="h-3 w-3" />
                  <span>Accounts without deposits are auto-purged after 30 days.</span>
                </div>
              </div>
            </div>

            {/* Checkbox Confirmation */}
            <label className="flex items-center justify-center gap-2 text-xs text-[#D5EFE3]/90 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConfirmedSaved}
                onChange={e => setHasConfirmedSaved(e.target.checked)}
                className="w-4 h-4 rounded border-[#1A4B36] accent-[#FF5C00] cursor-pointer"
              />
              <span>I have copied and safely saved my Unique ID</span>
            </label>

            {/* Enter Portal Button */}
            <button
              onClick={handleProceedToPortal}
              className="w-full bg-[#103825] hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg active:scale-98"
            >
              <span>Enter Barcode Workstation</span>
              <ArrowRight className="h-4 w-4" />
            </button>

          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#0C2A1E]/95 border border-[#1A4B36] rounded-2xl p-7 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5C00] to-[#E04800] flex items-center justify-center shadow-[0_4px_20px_rgba(255,92,0,0.4)] border border-[#FF8442]/40">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              BRYT <span className="text-[#FF5C00]">BARCODE TEC</span>
            </h1>
            <p className="text-xs text-[#D5EFE3]/70 mt-0.5">
              Client Portal & AAMVA Barcode Workstation
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-red-200 text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Unique ID Sign In Form */}
        <form onSubmit={handleLoginWithId} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/90 font-mono">
                Fill In Your Unique ID
              </label>
              <button
                type="button"
                onClick={handlePasteId}
                className="text-[10px] text-[#FF5C00] hover:text-[#FF8442] font-mono font-bold flex items-center gap-1 cursor-pointer"
                title="Paste from clipboard"
              >
                <Copy className="h-3 w-3" />
                <span>Paste ID</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={uniqueIdInput}
                onChange={e => {
                  setUniqueIdInput(e.target.value);
                  setError('');
                }}
                placeholder="e.g. BRYT-8829-4102"
                autoComplete="off"
                className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white font-mono uppercase tracking-wider rounded-xl px-4 py-3 pl-10 text-xs outline-none transition placeholder:text-[#D5EFE3]/30 placeholder:normal-case"
                required
              />
              <Key className="h-4 w-4 text-[#FF5C00] absolute left-3.5 top-3.5" />
            </div>
            <p className="text-[10px] text-[#D5EFE3]/50 font-sans mt-1">
              Enter your unique ID to resume your session & saved profiles.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 bg-[#FF5C00] hover:bg-[#FF731E] active:scale-[0.98] text-white font-bold font-sans py-3.5 px-4 rounded-xl transition shadow-[0_4px_16px_rgba(255,92,0,0.35)] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying ID...' : 'Sign In with Unique ID'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Divider / Sign Up Trigger */}
        <div className="mt-6 pt-5 border-t border-[#1A4B36]/80 flex flex-col gap-3">
          <div className="text-center">
            <span className="text-[11px] text-[#D5EFE3]/70 font-sans block mb-2">
              New member or don't have an ID yet?
            </span>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full bg-[#041A10] hover:bg-[#103825] border-2 border-[#1A4B36] hover:border-[#FF5C00] text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider cursor-pointer shadow-xs group"
            >
              <UserPlus className="h-4 w-4 text-[#FF5C00] group-hover:scale-110 transition" />
              <span>Sign Up — Generate Unique ID</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[10px] text-[#D5EFE3]/40 font-mono flex items-center justify-center gap-1.5 pt-2">
          <Lock className="h-3 w-3" />
          <span>256-Bit Passwordless Authentication</span>
        </div>

      </div>
    </div>
  );
};
