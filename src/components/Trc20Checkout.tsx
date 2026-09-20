import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Zap,
  Headphones,
  Send,
  MessageCircle
} from 'lucide-react';
import { PortalStore, PortalSettings } from '../utils/portalStore';
import { User, Order, TokenPackage, PaymentMethod } from '../types';
import { isValidTxHash } from '../utils/cryptoVerifier';
import { getCryptoRates, calculateCryptoAmount, formatCryptoAmount, CryptoRates } from '../utils/cryptoPrices';

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
  initialPackage
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('usdt_trc20');
  const [cryptoRates, setCryptoRates] = useState<CryptoRates>({
    BTC: 82500,
    LTC: 62.5,
    USDT: 1.0,
    lastUpdated: Date.now()
  });

  const [packages, setPackages] = useState<TokenPackage[]>(() => {
    const list = PortalStore.getPackages().filter(p => p.enabled !== false);
    return list.length > 0 ? list : PortalStore.getPackages();
  });

  const [selectedPkg, setSelectedPkg] = useState<TokenPackage>(() => {
    const list = PortalStore.getPackages().filter(p => p.enabled !== false);
    const validList = list.length > 0 ? list : PortalStore.getPackages();
    return (initialPackage ? validList.find(p => p.usdt === initialPackage) : null) || 
           validList.find(p => p.popular) || 
           validList[0];
  });

  const [portalSettings, setPortalSettings] = useState<PortalSettings>(() => PortalStore.getSettings());
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [txHash, setTxHash] = useState('');
  const [isCopiedAddress, setIsCopiedAddress] = useState(false);
  const [isCopiedAmount, setIsCopiedAmount] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<Order | null>(null);

  // Fetch real-time crypto prices
  useEffect(() => {
    let mounted = true;
    getCryptoRates().then(rates => {
      if (mounted) setCryptoRates(rates);
    });
    return () => { mounted = false; };
  }, [isOpen]);

  // Keep settings synced
  useEffect(() => {
    const handleSettingsChanged = (e: any) => {
      if (e?.detail) setPortalSettings(e.detail);
      else setPortalSettings(PortalStore.getSettings());
    };
    window.addEventListener('bryt_portal_settings_changed', handleSettingsChanged);
    return () => window.removeEventListener('bryt_portal_settings_changed', handleSettingsChanged);
  }, []);

  // Sync package catalog from store
  useEffect(() => {
    const refreshPackages = () => {
      const list = PortalStore.getPackages().filter(p => p.enabled !== false);
      const validList = list.length > 0 ? list : PortalStore.getPackages();
      setPackages(validList);
      
      setSelectedPkg(prev => {
        const found = validList.find(p => p.id === prev?.id) ||
                      validList.find(p => p.usdt === prev?.usdt) ||
                      (initialPackage ? validList.find(p => p.usdt === initialPackage) : null) ||
                      validList.find(p => p.popular) ||
                      validList[0];
        return found;
      });
    };

    refreshPackages();

    const handlePackageUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        const validList = e.detail.filter((p: TokenPackage) => p.enabled !== false);
        setPackages(validList.length > 0 ? validList : e.detail);
        setSelectedPkg(prev => {
          const found = validList.find(p => p.id === prev?.id) ||
                        validList.find(p => p.usdt === prev?.usdt) ||
                        validList.find(p => p.popular) ||
                        validList[0];
          return found;
        });
      } else {
        refreshPackages();
      }
    };

    window.addEventListener('bryt_portal_packages_changed', handlePackageUpdate);
    window.addEventListener('storage', refreshPackages);

    return () => {
      window.removeEventListener('bryt_portal_packages_changed', handlePackageUpdate);
      window.removeEventListener('storage', refreshPackages);
    };
  }, [initialPackage]);

  // Currency calculations
  const currency: 'USDT' | 'BTC' | 'LTC' = paymentMethod === 'btc' ? 'BTC' : paymentMethod === 'ltc' ? 'LTC' : 'USDT';
  const cryptoAmount = calculateCryptoAmount(selectedPkg?.usdt || 20, currency, cryptoRates);

  const depositAddress = paymentMethod === 'btc'
    ? portalSettings.btcDepositAddress
    : paymentMethod === 'ltc'
    ? portalSettings.ltcDepositAddress
    : portalSettings.depositAddress;

  const qrValue = paymentMethod === 'btc'
    ? `bitcoin:${depositAddress}?amount=${cryptoAmount}`
    : paymentMethod === 'ltc'
    ? `litecoin:${depositAddress}?amount=${cryptoAmount}`
    : depositAddress;

  // Sync active order when modal opens or package/method changes
  useEffect(() => {
    if (isOpen && selectedPkg) {
      const order = PortalStore.createOrder(
        user.id,
        user.email,
        selectedPkg.usdt,
        selectedPkg.tokens,
        paymentMethod,
        cryptoAmount,
        currency,
        depositAddress
      );
      setActiveOrder(order);
    }
  }, [isOpen, selectedPkg?.id, paymentMethod, cryptoAmount]);

  const handleSelectPackage = (pkg: TokenPackage) => {
    setSelectedPkg(pkg);
    setVerificationError(null);
    setVerificationSuccess(null);
    setTxHash('');

    const calculated = calculateCryptoAmount(pkg.usdt, currency, cryptoRates);
    const newOrder = PortalStore.createOrder(
      user.id,
      user.email,
      pkg.usdt,
      pkg.tokens,
      paymentMethod,
      calculated,
      currency,
      depositAddress
    );
    setActiveOrder(newOrder);
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setVerificationError(null);
    setVerificationSuccess(null);
    setTxHash('');

    const newCurr = method === 'btc' ? 'BTC' : method === 'ltc' ? 'LTC' : 'USDT';
    const newAddr = method === 'btc'
      ? portalSettings.btcDepositAddress
      : method === 'ltc'
      ? portalSettings.ltcDepositAddress
      : portalSettings.depositAddress;
    const newAmount = calculateCryptoAmount(selectedPkg?.usdt || 20, newCurr, cryptoRates);

    const newOrder = PortalStore.createOrder(
      user.id,
      user.email,
      selectedPkg.usdt,
      selectedPkg.tokens,
      method,
      newAmount,
      newCurr,
      newAddr
    );
    setActiveOrder(newOrder);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setIsCopiedAddress(true);
    setTimeout(() => setIsCopiedAddress(false), 2000);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(cryptoAmount.toString());
    setIsCopiedAmount(true);
    setTimeout(() => setIsCopiedAmount(false), 2000);
  };

  const getExplorerUrl = (tx: string, method?: PaymentMethod) => {
    const m = method || paymentMethod;
    if (m === 'btc') return `https://mempool.space/tx/${tx}`;
    if (m === 'ltc') return `https://litecoinspace.org/tx/${tx}`;
    return `https://tronscan.org/#/transaction/${tx}`;
  };

  const getExplorerName = (method?: PaymentMethod) => {
    const m = method || paymentMethod;
    if (m === 'btc') return 'Mempool.space';
    if (m === 'ltc') return 'Litecoinspace';
    return 'Tronscan';
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const cleanHash = txHash.trim();

    if (!cleanHash) {
      setVerificationError(`Please paste your 64-character ${currency} transaction hash (TxID).`);
      return;
    }

    if (!isValidTxHash(cleanHash)) {
      setVerificationError(`Invalid TxID format. Blockchain transaction hashes must be exactly 64 hexadecimal characters.`);
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
        setVerificationError(result.error || `Verification failed on ${currency} blockchain.`);
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
          {/* Modal Header */}
          <div className="bg-[#041A10] border-b border-[#1A4B36] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <span>Crypto Barcode Deposit</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-bold">
                    <Zap className="h-2.5 w-2.5" />
                    Auto Approval
                  </span>
                </h3>
                <p className="text-xs text-[#D5EFE3]/70 font-sans">
                  Instant automated barcode credit via on-chain blockchain verification
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
                    Payment Verified & Automatically Approved!
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
                    <span>Deposit Method:</span>
                    <span className="text-white font-bold uppercase">
                      {verificationSuccess.payment_method === 'btc' ? 'Bitcoin (BTC)' : verificationSuccess.payment_method === 'ltc' ? 'Litecoin (LTC)' : 'USDT (TRC-20)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Received:</span>
                    <span className="text-emerald-400 font-bold">
                      {verificationSuccess.verified_amount} {verificationSuccess.crypto_currency || 'USDT'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated Barcode Balance:</span>
                    <span className="text-[#FF5C00] font-black">{user.token_balance + verificationSuccess.tokens_to_credit} Barcodes</span>
                  </div>
                  <div className="pt-2 border-t border-[#1A4B36] flex items-center justify-between">
                    <span>Explorer Verification:</span>
                    <a
                      href={getExplorerUrl(verificationSuccess.tx_hash || '', verificationSuccess.payment_method)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF5C00] hover:underline flex items-center gap-1 font-bold truncate max-w-[200px]"
                    >
                      <span>{verificationSuccess.tx_hash?.substring(0, 14)}...</span>
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
                {/* STEP 1: PAYMENT METHOD SELECTOR */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-2">
                    1. Choose Deposit Currency
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* TRC-20 USDT */}
                    <button
                      type="button"
                      onClick={() => handleSelectMethod('usdt_trc20')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        paymentMethod === 'usdt_trc20'
                          ? 'bg-[#041A10] border-[#FF5C00] shadow-[0_0_12px_rgba(255,92,0,0.25)]'
                          : 'bg-[#041A10]/60 border-[#1A4B36] hover:border-[#1A4B36]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white">USDT</span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          TRC-20
                        </span>
                      </div>
                      <div className="text-[11px] text-[#D5EFE3]/60 mt-1">TRON Network</div>
                    </button>

                    {/* BITCOIN (BTC) */}
                    <button
                      type="button"
                      onClick={() => handleSelectMethod('btc')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        paymentMethod === 'btc'
                          ? 'bg-[#041A10] border-[#FF5C00] shadow-[0_0_12px_rgba(255,92,0,0.25)]'
                          : 'bg-[#041A10]/60 border-[#1A4B36] hover:border-[#1A4B36]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white">Bitcoin</span>
                        <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                          BTC
                        </span>
                      </div>
                      <div className="text-[11px] text-[#D5EFE3]/60 mt-1">Native Bitcoin</div>
                    </button>

                    {/* LITECOIN (LTC) */}
                    <button
                      type="button"
                      onClick={() => handleSelectMethod('ltc')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        paymentMethod === 'ltc'
                          ? 'bg-[#041A10] border-[#FF5C00] shadow-[0_0_12px_rgba(255,92,0,0.25)]'
                          : 'bg-[#041A10]/60 border-[#1A4B36] hover:border-[#1A4B36]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white">Litecoin</span>
                        <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          LTC
                        </span>
                      </div>
                      <div className="text-[11px] text-[#D5EFE3]/60 mt-1">Low Network Fee</div>
                    </button>
                  </div>
                </div>

                {/* STEP 2: PACKAGE SELECTION */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono">
                      2. Select Barcode Package
                    </label>
                    {paymentMethod !== 'usdt_trc20' && (
                      <span className="text-[11px] font-mono text-[#D5EFE3]/60">
                        1 {currency} ≈ ${cryptoRates[currency].toLocaleString()} USD
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {packages.filter(p => p.enabled !== false).map(pkg => {
                      const pkgCrypto = calculateCryptoAmount(pkg.usdt, currency, cryptoRates);
                      const isSelected = selectedPkg?.id === pkg.id || (!selectedPkg?.id && selectedPkg?.usdt === pkg.usdt);

                      return (
                        <button
                          key={pkg.id || `${pkg.usdt}-${pkg.tokens}`}
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative cursor-pointer ${
                            isSelected
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
                          <div className="mt-2 pt-2 border-t border-[#1A4B36]/40 flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-white font-mono">
                              {currency === 'USDT' ? `${pkg.usdt} USDT` : `${pkgCrypto} ${currency}`}
                            </span>
                            {currency !== 'USDT' && (
                              <span className="text-[10px] text-[#D5EFE3]/50 font-mono">(${pkg.usdt} USD)</span>
                            )}
                            {pkg.bonus && (
                              <span className="text-[10px] text-emerald-400 font-sans truncate">{pkg.bonus}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: DEPOSIT ADDRESS BOX WITH DYNAMIC QR CODE */}
                <div className="bg-[#041A10] border border-[#1A4B36] rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono">
                      3. Send {formatCryptoAmount(cryptoAmount, currency)}
                    </span>
                    <span className="text-[11px] font-mono text-[#FF5C00] bg-[#FF5C00]/10 px-2.5 py-0.5 rounded border border-[#FF5C00]/30 font-bold">
                      {paymentMethod === 'btc' ? 'Bitcoin Network' : paymentMethod === 'ltc' ? 'Litecoin Network' : 'TRON Network (TRC-20)'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* QR Code Container */}
                    <div className="bg-white p-3 rounded-xl shrink-0 shadow-md">
                      <QRCode
                        value={qrValue}
                        size={125}
                        style={{ height: "auto", maxWidth: "100%", width: "125px" }}
                        viewBox={`0 0 125 125`}
                      />
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      <div>
                        <div className="text-[11px] text-[#D5EFE3]/60 font-sans mb-1 flex items-center justify-between">
                          <span>Deposit Address ({currency}):</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Verified Address</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#082216] border border-[#1A4B36] rounded-xl p-2.5">
                          <span className="font-mono text-xs text-white font-bold break-all flex-1 select-all">
                            {depositAddress}
                          </span>
                          <button
                            type="button"
                            onClick={copyAddress}
                            className="bg-[#FF5C00] hover:bg-[#FF731E] text-white p-2 rounded-lg transition cursor-pointer shrink-0"
                            title="Copy deposit address"
                          >
                            {isCopiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#D5EFE3]/80 font-mono bg-[#082216]/60 p-2.5 rounded-lg border border-[#1A4B36]/60">
                        <div>
                          <span className="text-[#D5EFE3]/60 block text-[10px]">Required Exact Transfer:</span>
                          <span className="font-bold text-white text-sm">
                            {formatCryptoAmount(cryptoAmount, currency)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={copyAmount}
                          className="px-2.5 py-1 bg-[#1A4B36]/60 hover:bg-[#1A4B36] text-white text-[11px] font-mono rounded flex items-center gap-1 transition cursor-pointer"
                        >
                          {isCopiedAmount ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{isCopiedAmount ? 'Copied' : 'Copy Amount'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Network Warning Banner */}
                  <div className="flex flex-col gap-2.5">
                    <div className="bg-[#FF5C00]/10 border border-[#FF5C00]/40 rounded-xl p-3 flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-[#FF5C00] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#FF9E66] font-medium leading-relaxed">
                        {paymentMethod === 'btc' ? (
                          <>Send exact <strong>{cryptoAmount} BTC</strong> via native Bitcoin network. Barcodes are credited automatically upon on-chain detection.</>
                        ) : paymentMethod === 'ltc' ? (
                          <>Send exact <strong>{cryptoAmount} LTC</strong> via Litecoin network. Automatic approval & instant crediting with near-zero network fees.</>
                        ) : (
                          <>Send only <strong>USDT via the TRON (TRC-20)</strong> network. Double-check network fees to ensure the exact amount is received.</>
                        )}
                      </p>
                    </div>

                    {paymentMethod === 'btc' && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-300 block mb-0.5">Binance Deposit Notice:</span>
                          Binance supports deposits from all BTC addresses (starting with "1", "3", "bc1p" and "bc1q").
                        </div>
                      </div>
                    )}
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

                {/* STEP 4: VERIFICATION FORM (TxID Input) */}
                <form onSubmit={handleVerify} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
                      4. Paste 64-Character {currency} Transaction Hash (TxID)
                    </label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={e => {
                        setTxHash(e.target.value);
                        setVerificationError(null);
                      }}
                      placeholder={
                        paymentMethod === 'btc'
                          ? 'e.g. 236e74ec1255a79e4691e9478ea84061752054a4592062b7945477c12582b3bd'
                          : paymentMethod === 'ltc'
                          ? 'e.g. 10a91779ad6dab0d9c47457f6edc58ab90317473b1c2b9032bd9b3dafa7aff64'
                          : 'e.g. 7f89d98a032a1b92019482710492810482019482019482019482019482019482'
                      }
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
                        <span>Verifying on {getExplorerName()} & Auto-Approving...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify & Auto-Approve {selectedPkg.tokens} Barcodes</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 24/7 OFFICIAL SUPPORT BAR */}
                <div className="mt-5 p-3.5 bg-[#03130C] border border-[#1A4B36] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Headphones className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Need Payment Assistance?</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">24/7 Live</span>
                      </div>
                      <p className="text-[11px] text-[#D5EFE3]/70">
                        Reach official support for manual verification or deposit questions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href="https://t.me/kingof_kyc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-[#082216] hover:bg-[#103825] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>Telegram @kingof_kyc</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>

                    <a
                      href="https://wa.me/14144015805"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-[#082216] hover:bg-[#103825] border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>WhatsApp</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
