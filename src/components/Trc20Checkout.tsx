import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import { 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Coins, 
  Loader2, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { PortalStore } from '../utils/portalStore';
import { User, Order, TokenPackage } from '../types';
import { isValidTxHash } from '../utils/tronVerifier';

interface Trc20CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onBalanceUpdated: (updatedUser: User) => void;
  initialPackage?: number;
}

export const Trc20Checkout: React.FC<Trc20CheckoutProps> = ({
  isOpen,
  onClose,
  user,
  onBalanceUpdated,
  initialPackage = 25
}) => {
  const [packages, setPackages] = useState<TokenPackage[]>(() => {
    const list = PortalStore.getPackages().filter(p => p.enabled !== false);
    return list.length > 0 ? list : PortalStore.getPackages();
  });

  const [selectedPkg, setSelectedPkg] = useState<TokenPackage>(() => {
    const list = PortalStore.getPackages().filter(p => p.enabled !== false);
    const validList = list.length > 0 ? list : PortalStore.getPackages();
    return validList.find(p => p.usdt === initialPackage) || validList.find(p => p.popular) || validList[0];
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [txHash, setTxHash] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<Order | null>(null);

  const settings = PortalStore.getSettings();
  const depositAddress = settings.depositAddress;

  // Refresh package list on open
  React.useEffect(() => {
    if (isOpen) {
      const list = PortalStore.getPackages().filter(p => p.enabled !== false);
      const validList = list.length > 0 ? list : PortalStore.getPackages();
      setPackages(validList);
      
      const matched = validList.find(p => p.id === selectedPkg?.id) ||
                      validList.find(p => p.usdt === initialPackage) ||
                      validList.find(p => p.popular) ||
                      validList[0];
      setSelectedPkg(matched);

      if (matched) {
        const order = PortalStore.createOrder(user.id, user.email, matched.usdt, matched.tokens);
        setActiveOrder(order);
      }
    }
  }, [isOpen]);

  // Initialize or get order
  const handleSelectPackage = (pkg: TokenPackage) => {
    setSelectedPkg(pkg);
    setVerificationError(null);
    setVerificationSuccess(null);
    setTxHash('');

    // Create a new pending order
    const newOrder = PortalStore.createOrder(user.id, user.email, pkg.usdt, pkg.tokens);
    setActiveOrder(newOrder);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const cleanHash = txHash.trim();

    if (!cleanHash) {
      setVerificationError('Please paste your 64-character TRON transaction hash (TxID).');
      return;
    }

    if (!isValidTxHash(cleanHash)) {
      setVerificationError('Invalid TxID format. TRON transaction hashes must be exactly 64 hexadecimal characters.');
      return;
    }

    if (!activeOrder) {
      setVerificationError('Session order not initialized.');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await PortalStore.submitAndVerifyTxHash(activeOrder.id, cleanHash);

      if (result.success && result.order) {
        setVerificationSuccess(result.order);
        // Refresh updated user balance
        const updated = PortalStore.getCurrentUser();
        if (updated) {
          onBalanceUpdated(updated);
        }
      } else {
        setVerificationError(result.error || 'Verification failed on TRON blockchain.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'An unexpected error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-[#082216] border border-[#1A4B36] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Header */}
          <div className="bg-[#041A10] border-b border-[#1A4B36] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans">
                  TRC-20 USDT Barcode Deposit
                </h3>
                <p className="text-xs text-[#D5EFE3]/70 font-sans">
                  Instant automated barcode credit via Tronscan verification
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-[#D5EFE3]/50 hover:text-white p-2 rounded-lg hover:bg-[#1A4B36]/50 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6 max-h-[calc(85vh-80px)] overflow-y-auto">
            
            {/* SUCCESS STATE */}
            {verificationSuccess ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-6 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white font-sans">
                    Payment Verified Successfully!
                  </h4>
                  <p className="text-sm text-emerald-300 font-sans mt-1">
                    Successfully credited <span className="font-bold text-white">+{verificationSuccess.tokens_to_credit} Barcodes</span> to your account balance.
                  </p>
                </div>

                <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-4 w-full text-left font-mono text-xs text-[#D5EFE3]/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="text-white font-bold">{verificationSuccess.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Received:</span>
                    <span className="text-emerald-400 font-bold">{verificationSuccess.verified_amount || verificationSuccess.amount_usdt} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated Barcode Balance:</span>
                    <span className="text-[#FF5C00] font-black">{user.token_balance + verificationSuccess.tokens_to_credit} Barcodes</span>
                  </div>
                  <div className="pt-2 border-t border-[#1A4B36] flex items-center justify-between">
                    <span>TxID:</span>
                    <a
                      href={`https://tronscan.org/#/transaction/${verificationSuccess.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF5C00] hover:underline flex items-center gap-1 font-bold truncate max-w-[200px]"
                    >
                      <span>{verificationSuccess.tx_hash?.substring(0, 16)}...</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-[#FF5C00] hover:bg-[#FF731E] text-white font-bold py-3 px-4 rounded-xl transition cursor-pointer"
                >
                  Start Generating Barcodes
                </button>
              </div>
            ) : (
              <>
                {/* Package Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-2.5">
                    1. Select Barcode Package
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {packages.map(pkg => (
                      <button
                        key={pkg.id || `${pkg.usdt}-${pkg.tokens}`}
                        type="button"
                        onClick={() => handleSelectPackage(pkg)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative cursor-pointer ${
                          selectedPkg.id === pkg.id || (!selectedPkg.id && selectedPkg.usdt === pkg.usdt)
                            ? 'bg-[#041A10] border-[#FF5C00] shadow-[0_0_12px_rgba(255,92,0,0.25)]'
                            : 'bg-[#041A10]/60 border-[#1A4B36] hover:border-[#1A4B36]/80'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2 right-2 bg-[#FF5C00] text-white text-[9px] font-black px-1.5 py-0.5 rounded font-mono shadow-sm">
                            POPULAR
                          </span>
                        )}
                        <div>
                          <div className="text-xs font-bold text-white truncate" title={pkg.label}>{pkg.label}</div>
                          <div className="text-lg font-black text-[#FF5C00] mt-0.5 font-mono">
                            {pkg.tokens} <span className="text-xs font-normal text-[#D5EFE3]/70">Barcodes</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#1A4B36]/40 flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white font-mono shrink-0">{pkg.usdt} USDT</span>
                          {pkg.bonus && (
                            <span className="text-[10px] text-emerald-400 font-sans truncate text-right">{pkg.bonus}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deposit Address Box with QR Code */}
                <div className="bg-[#041A10] border border-[#1A4B36] rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono">
                      2. Send {selectedPkg.usdt} USDT (TRC-20)
                    </span>
                    <span className="text-[11px] font-mono text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-0.5 rounded border border-[#FF5C00]/30 font-bold">
                      TRON Network
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* QR Code Container */}
                    <div className="bg-white p-3 rounded-xl shrink-0 shadow-md">
                      <QRCode
                        value={depositAddress}
                        size={120}
                        style={{ height: "auto", maxWidth: "100%", width: "120px" }}
                        viewBox={`0 0 120 120`}
                      />
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      <div>
                        <div className="text-[11px] text-[#D5EFE3]/60 font-sans mb-1">
                          Deposit Address (TRC-20):
                        </div>
                        <div className="flex items-center gap-2 bg-[#082216] border border-[#1A4B36] rounded-xl p-2.5">
                          <span className="font-mono text-xs text-white font-bold break-all flex-1 select-all">
                            {depositAddress}
                          </span>
                          <button
                            onClick={copyAddress}
                            className="bg-[#FF5C00] hover:bg-[#FF731E] text-white p-2 rounded-lg transition cursor-pointer shrink-0"
                            title="Copy deposit address"
                          >
                            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#D5EFE3]/80 font-mono bg-[#082216]/60 p-2.5 rounded-lg border border-[#1A4B36]/60">
                        <span>Required Exact Transfer:</span>
                        <span className="font-bold text-white">{selectedPkg.usdt}.00 USDT</span>
                      </div>
                    </div>
                  </div>

                  {/* Mandated Warning Banner */}
                  <div className="bg-[#FF5C00]/10 border border-[#FF5C00]/40 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-[#FF5C00] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#FF9E66] font-medium leading-relaxed">
                      Send only USDT via the TRON (TRC-20) network. Double-check network fees to ensure the exact amount is received.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {verificationError && (
                  <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3.5 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-red-300">Verification Notice</div>
                      <div className="mt-0.5 text-red-200/90">{verificationError}</div>
                    </div>
                  </div>
                )}

                {/* Verification Form (TxID Input) */}
                <form onSubmit={handleVerify} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
                      3. Paste 64-Character Transaction Hash (TxID)
                    </label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={e => {
                        setTxHash(e.target.value);
                        setVerificationError(null);
                      }}
                      placeholder="e.g. 7f89d98a032a1b92019482710492810482019482019482019482019482019482"
                      className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-3 text-xs font-mono outline-none transition placeholder:text-[#D5EFE3]/30"
                      disabled={isVerifying}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || !txHash.trim()}
                    className="w-full bg-[#FF5C00] hover:bg-[#FF731E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold font-sans py-3.5 px-4 rounded-xl transition shadow-[0_4px_16px_rgba(255,92,0,0.35)] flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying on TRON Blockchain...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify & Credit {selectedPkg.tokens} Barcodes</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
