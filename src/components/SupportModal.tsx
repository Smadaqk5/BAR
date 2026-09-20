import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Headphones, 
  Send, 
  MessageCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Clock, 
  PhoneCall
} from 'lucide-react';
import { SUPPORT_CONFIG } from '../constants';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-[#041A10] border border-[#1A4B36] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#03130C] border-b border-[#1A4B36] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center border border-[#FF5C00]/30 shadow-xs">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Official Customer Support
                </h3>
                <p className="text-xs text-[#D5EFE3]/70">
                  24/7 technical desk, deposit verification & account support
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-[#082216] hover:bg-[#103825] text-[#D5EFE3]/70 hover:text-white rounded-xl border border-[#1A4B36] transition cursor-pointer"
              title="Close Support"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-4">
            
            {/* Status Indicator */}
            <div className="bg-[#08281B] border border-[#1A4B36] rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white">Support Agents Online</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#D5EFE3]/70 font-mono">
                <Clock className="h-3 w-3 text-emerald-400" />
                <span>Response: &lt; 5 mins</span>
              </div>
            </div>

            {/* Telegram Card */}
            <div className="bg-[#082216] hover:bg-[#0A2E1D] border border-cyan-500/30 rounded-2xl p-4 transition shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Send className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Telegram Support</span>
                      <span className="text-[9px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded">Fastest</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">{SUPPORT_CONFIG.telegram.handle}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(SUPPORT_CONFIG.telegram.handle, 'tg')}
                  className="p-1.5 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-lg transition cursor-pointer text-xs flex items-center gap-1"
                  title="Copy Telegram username"
                >
                  {copiedItem === 'tg' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={SUPPORT_CONFIG.telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Open Telegram Chat ({SUPPORT_CONFIG.telegram.handle})</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-[#082216] hover:bg-[#0A2E1D] border border-emerald-500/30 rounded-2xl p-4 transition shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <MessageCircle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">WhatsApp Direct</span>
                      <span className="text-[9px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">Direct Call & Chat</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">{SUPPORT_CONFIG.whatsapp.number}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(SUPPORT_CONFIG.whatsapp.number, 'wa')}
                  className="p-1.5 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-lg transition cursor-pointer text-xs flex items-center gap-1"
                  title="Copy WhatsApp number"
                >
                  {copiedItem === 'wa' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={SUPPORT_CONFIG.whatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Message on WhatsApp ({SUPPORT_CONFIG.whatsapp.display})</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Official Security Verification Notice */}
            <div className="bg-[#03130C] border border-[#1A4B36] rounded-xl p-3 text-[11px] text-[#D5EFE3]/70 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#FF5C00] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">Verification & Anti-Scam Notice</span>
                Official Bryt representatives will never request private credentials or passwords. Only use the verified links above: <span className="text-cyan-300 font-mono">t.me/kingof_kyc</span> and <span className="text-emerald-300 font-mono">+1 (414) 401-5805</span>.
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
