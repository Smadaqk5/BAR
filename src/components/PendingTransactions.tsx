import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  AlertTriangle,
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Coins, 
  QrCode, 
  Trash2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
  X,
  Headphones,
  Send,
  MessageCircle
} from 'lucide-react';
import { Order, PaymentMethod, User } from '../types';
import { PortalStore } from '../utils/portalStore';
import { isValidTxHash } from '../utils/cryptoVerifier';
import { SUPPORT_CONFIG } from '../constants';

interface PendingTransactionsProps {
  user: User;
  onOpenDepositModal: () => void;
  onBalanceUpdated?: (updatedUser: User) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const PendingTransactions: React.FC<PendingTransactionsProps> = ({
  user,
  onOpenDepositModal,
  onBalanceUpdated,
  isModal = false,
  onClose
}) => {
  const [orders, setOrders] = useState<Order[]>(() => PortalStore.getUserOrders(user.id));
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [qrModalOrder, setQrModalOrder] = useState<Order | null>(null);
  
  // Inline TxID submission state
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [isVerifyingOrder, setIsVerifyingOrder] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<{ [orderId: string]: string }>({});
  
  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [autoCheckCountdown, setAutoCheckCountdown] = useState<number>(10);

  // Sync orders with PortalStore & live events
  const refreshUserOrders = () => {
    const userOrders = PortalStore.getUserOrders(user.id);
    setOrders(userOrders);
  };

  useEffect(() => {
    refreshUserOrders();

    const handleOrdersChange = () => {
      refreshUserOrders();
    };

    window.addEventListener('bryt_portal_orders_changed', handleOrdersChange);
    window.addEventListener('storage', handleOrdersChange);

    return () => {
      window.removeEventListener('bryt_portal_orders_changed', handleOrdersChange);
      window.removeEventListener('storage', handleOrdersChange);
    };
  }, [user.id]);

  // Filter pending vs completed
  const pendingOrders = orders.filter(o => o.status === 'verifying' || o.status === 'pending_payment');
  const completedOrders = orders.filter(o => o.status === 'approved' || o.status === 'rejected');

  // Automated background polling for orders in 'verifying' status
  useEffect(() => {
    const verifyingOrders = orders.filter(o => o.status === 'verifying' && o.tx_hash);
    if (verifyingOrders.length === 0) return;

    const interval = setInterval(async () => {
      setAutoCheckCountdown(prev => {
        if (prev <= 1) {
          // Trigger automated verification check
          verifyingOrders.forEach(async order => {
            if (order.tx_hash) {
              const res = await PortalStore.submitAndVerifyTxHash(order.id, order.tx_hash);
              if (res.success && res.order) {
                const refreshed = PortalStore.getCurrentUser();
                if (refreshed && onBalanceUpdated) {
                  onBalanceUpdated(refreshed);
                }
              }
            }
          });
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, onBalanceUpdated]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getExplorerUrl = (tx: string, method?: PaymentMethod) => {
    if (method === 'btc') return `https://mempool.space/tx/${tx}`;
    if (method === 'ltc') return `https://litecoinspace.org/tx/${tx}`;
    return `https://tronscan.org/#/transaction/${tx}`;
  };

  const getExplorerName = (method?: PaymentMethod) => {
    if (method === 'btc') return 'Mempool.space';
    if (method === 'ltc') return 'Litecoinspace';
    return 'Tronscan';
  };

  // Manual on-demand verification re-check
  const handleManualRecheck = async (order: Order) => {
    if (!order.tx_hash) return;
    setIsVerifyingOrder(order.id);
    setInlineError(prev => ({ ...prev, [order.id]: '' }));

    try {
      const res = await PortalStore.submitAndVerifyTxHash(order.id, order.tx_hash);
      if (res.success && res.order) {
        refreshUserOrders();
        const refreshed = PortalStore.getCurrentUser();
        if (refreshed && onBalanceUpdated) {
          onBalanceUpdated(refreshed);
        }
      } else if (res.error) {
        setInlineError(prev => ({ ...prev, [order.id]: res.error || 'Verification pending blockchain confirmation.' }));
      }
    } catch (err: any) {
      setInlineError(prev => ({ ...prev, [order.id]: err.message || 'Verification check failed.' }));
    } finally {
      setIsVerifyingOrder(null);
    }
  };

  // Submit TxID for a pending_payment order
  const handleSubmitTxHash = async (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    const cleanHash = txHashInput.trim();

    if (!isValidTxHash(cleanHash)) {
      setInlineError(prev => ({ ...prev, [orderId]: 'Invalid hash format. TxID must be 64 hexadecimal characters.' }));
      return;
    }

    setIsVerifyingOrder(orderId);
    setInlineError(prev => ({ ...prev, [orderId]: '' }));

    try {
      const res = await PortalStore.submitAndVerifyTxHash(orderId, cleanHash);
      if (res.success && res.order) {
        setTxHashInput('');
        setSubmittingOrderId(null);
        refreshUserOrders();
        const refreshed = PortalStore.getCurrentUser();
        if (refreshed && onBalanceUpdated) {
          onBalanceUpdated(refreshed);
        }
      } else {
        // Updated to verifying or rejected
        refreshUserOrders();
        if (res.error) {
          setInlineError(prev => ({ ...prev, [orderId]: res.error }));
        }
      }
    } catch (err: any) {
      setInlineError(prev => ({ ...prev, [orderId]: err.message || 'Failed to submit TxID.' }));
    } finally {
      setIsVerifyingOrder(null);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Cancel this pending deposit request?')) {
      PortalStore.cancelOrder(orderId);
      refreshUserOrders();
    }
  };

  // If no orders exist and not in modal, hide from on-page view
  if (orders.length === 0) {
    if (!isModal) return null;
    return (
      <div className="w-full p-6 text-center flex flex-col items-center justify-center min-h-[360px] bg-[#041A10] rounded-2xl border border-[#1A4B36]">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <Coins className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-black text-white font-sans">
          No Deposits Yet
        </h3>
        <p className="text-xs text-[#D5EFE3]/70 font-sans max-w-md mt-1.5 leading-relaxed">
          You currently have no pending or recent barcode token deposits. Purchase a barcode credit package via USDT (TRC-20), Bitcoin, or Litecoin to start generating verified barcodes immediately.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDepositModal}
            className="px-5 py-2.5 bg-[#FF5C00] hover:bg-[#FF731E] text-white text-xs font-bold font-sans rounded-xl transition flex items-center gap-2 shadow-[0_4px_14px_rgba(255,92,0,0.3)] cursor-pointer active:scale-95"
          >
            <Zap className="h-4 w-4" />
            <span>⚡ Buy Barcodes Now</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#082216] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] text-xs font-bold font-sans rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const containerClass = isModal ? "w-full p-2" : "w-full max-w-7xl mx-auto px-6 pt-4 pb-2";

  return (
    <div className={containerClass}>
      <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 shadow-xl transition">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A4B36] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              pendingOrders.length > 0 
                ? 'bg-[#FF5C00]/20 text-[#FF5C00] border-[#FF5C00]/30 shadow-[0_0_12px_rgba(255,92,0,0.3)]' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {pendingOrders.some(o => o.status === 'verifying') ? (
                <Radio className="h-5 w-5 animate-pulse text-[#FF5C00]" />
              ) : (
                <Coins className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">
                  Deposits
                </h3>
                {pendingOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF5C00] text-white animate-pulse">
                    {pendingOrders.length} In Progress
                  </span>
                )}
              </div>
              <p className="text-xs text-[#D5EFE3]/70 font-sans mt-0.5">
                Real-time tracking and automated on-chain verification across USDT (TRC-20), Bitcoin, and Litecoin.
              </p>
            </div>
          </div>

          {/* Tab Switcher & Quick Deposit */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#041A10] p-1 rounded-xl border border-[#1A4B36] text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-[#FF5C00] text-white shadow-xs'
                    : 'text-[#D5EFE3]/70 hover:text-white'
                }`}
              >
                <span>Pending</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                  {pendingOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-[#FF5C00] text-white shadow-xs'
                    : 'text-[#D5EFE3]/70 hover:text-white'
                }`}
              >
                <span>Receipts</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                  {completedOrders.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenDepositModal}
              className="px-4 py-1.5 bg-[#FF5C00] hover:bg-[#FF731E] text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 shadow-[0_2px_10px_rgba(255,92,0,0.35)] cursor-pointer active:scale-95"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Buy Barcodes</span>
            </button>
          </div>
        </div>

        {/* Quick Buy Barcodes Banner */}
        <div className="mt-4 bg-[#041A10] border border-[#FF5C00]/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_2px_10px_rgba(255,92,0,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF5C00] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Coins className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white font-sans">Buy Barcodes (Quick Deposit)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">TRC-20 • BTC • LTC</span>
              </div>
              <p className="text-xs text-[#D5EFE3]/70 font-sans mt-0.5">
                Select your package, transfer USDT or crypto, and get barcodes auto-credited instantly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenDepositModal}
            className="w-full sm:w-auto px-4 py-2 bg-[#FF5C00] hover:bg-[#FF731E] text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(255,92,0,0.35)] cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Select Package & Buy</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'pending' ? (
            pendingOrders.length === 0 ? (
              <div className="py-8 text-center bg-[#041A10] rounded-xl border border-[#1A4B36]/60 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <span className="text-xs font-mono text-[#D5EFE3]/80 font-bold">No Pending Deposits</span>
                <p className="text-[11px] text-[#D5EFE3]/60 max-w-sm">
                  All previous crypto deposits have been confirmed and credited. Need more barcodes?
                </p>
                <button
                  type="button"
                  onClick={onOpenDepositModal}
                  className="mt-2 px-4 py-2 bg-[#FF5C00] hover:bg-[#FF731E] text-white rounded-xl text-xs font-bold font-sans transition shadow-xs cursor-pointer"
                >
                  Buy Barcodes with Crypto
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingOrders.map(order => {
                  const method = order.payment_method || 'usdt_trc20';
                  const isVerifying = order.status === 'verifying';
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className={`bg-[#041A10] border rounded-2xl p-4 transition shadow-sm ${
                        isVerifying 
                          ? 'border-[#FF5C00]/60 ring-1 ring-[#FF5C00]/20' 
                          : 'border-[#1A4B36]'
                      }`}
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start md:items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs font-mono border ${
                              method === 'btc'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : method === 'ltc'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {method === 'btc' ? 'BTC' : method === 'ltc' ? 'LTC' : 'USDT'}
                            </div>
                            {isVerifying && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C00] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5C00]"></span>
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white font-sans">
                                +{order.tokens_to_credit} Barcodes
                              </span>
                              <span className="text-xs font-mono text-emerald-400 font-bold">
                                {order.crypto_amount ? `${order.crypto_amount} ${order.crypto_currency || 'USDT'}` : `${order.amount_usdt} USDT`}
                              </span>
                              <span className="text-[10px] text-[#D5EFE3]/50 font-mono">
                                (${order.amount_usdt} USD)
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#D5EFE3]/60">
                              <span>Order: {order.id}</span>
                              <span>•</span>
                              <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
                          {isVerifying ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/40">
                                <Clock className="h-3.5 w-3.5 animate-spin" />
                                <span>Verifying On-Chain...</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleManualRecheck(order)}
                                disabled={isVerifyingOrder === order.id}
                                className="p-1.5 bg-[#082216] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-lg text-xs font-mono transition cursor-pointer disabled:opacity-50"
                                title="Re-check blockchain transaction now"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${isVerifyingOrder === order.id ? 'animate-spin text-[#FF5C00]' : ''}`} />
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Awaiting Payment</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="p-1.5 bg-[#082216] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] rounded-lg transition cursor-pointer"
                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* REAL-TIME VERIFICATION PROGRESS PIPELINE (Visible when verifying) */}
                      {isVerifying && (
                        <div className="mt-4 pt-4 border-t border-[#1A4B36] bg-[#082216]/50 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-[#FF5C00]" />
                              <span>Automated Verification Pipeline</span>
                            </span>
                            <span className="text-[10px] text-[#D5EFE3]/60 flex items-center gap-1">
                              <span>Auto-refreshing in {autoCheckCountdown}s</span>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </span>
                          </div>

                          {/* 4-Step Visual Progress Bar */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-left font-mono">
                            {/* Step 1: Broadcast */}
                            <div className="bg-[#041A10] border border-emerald-500/40 rounded-lg p-2.5 flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-emerald-400 font-bold">1. Broadcast</span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              </div>
                              <span className="text-[10px] text-[#D5EFE3]/70 font-sans leading-tight">
                                TxID submitted to network
                              </span>
                            </div>

                            {/* Step 2: On-Chain Query */}
                            <div className="bg-[#041A10] border border-[#FF5C00]/50 rounded-lg p-2.5 flex flex-col gap-1 relative overflow-hidden">
                              <div className="absolute inset-0 bg-[#FF5C00]/5 animate-pulse" />
                              <div className="flex items-center justify-between text-[10px] relative z-10">
                                <span className="text-[#FF5C00] font-bold">2. Mempool Query</span>
                                <Clock className="h-3.5 w-3.5 text-[#FF5C00] animate-spin" />
                              </div>
                              <span className="text-[10px] text-[#D5EFE3]/70 font-sans leading-tight relative z-10">
                                Scanning {getExplorerName(order.payment_method)}
                              </span>
                            </div>

                            {/* Step 3: Match */}
                            <div className="bg-[#041A10] border border-[#1A4B36] rounded-lg p-2.5 flex flex-col gap-1 opacity-70">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[#D5EFE3]/80 font-bold">3. Amount Match</span>
                                <ShieldCheck className="h-3.5 w-3.5 text-[#D5EFE3]/40" />
                              </div>
                              <span className="text-[10px] text-[#D5EFE3]/60 font-sans leading-tight">
                                Validate recipient & amount
                              </span>
                            </div>

                            {/* Step 4: Instant Credit */}
                            <div className="bg-[#041A10] border border-[#1A4B36] rounded-lg p-2.5 flex flex-col gap-1 opacity-70">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[#D5EFE3]/80 font-bold">4. Auto Credit</span>
                                <Coins className="h-3.5 w-3.5 text-[#D5EFE3]/40" />
                              </div>
                              <span className="text-[10px] text-[#D5EFE3]/60 font-sans leading-tight">
                                +{order.tokens_to_credit} Barcodes to account
                              </span>
                            </div>
                          </div>

                          {/* TxID & Explorer Link */}
                          {order.tx_hash && (
                            <div className="flex items-center justify-between gap-2 text-xs font-mono bg-[#041A10] p-2.5 rounded-lg border border-[#1A4B36] mt-1 flex-wrap">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[#D5EFE3]/60 text-[11px] shrink-0">TxID:</span>
                                <span className="text-white truncate font-bold text-[11px]">
                                  {order.tx_hash}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(order.tx_hash!, `tx-${order.id}`)}
                                  className="p-1 hover:bg-[#103825] rounded text-[#D5EFE3] hover:text-white transition cursor-pointer"
                                  title="Copy TxID"
                                >
                                  {copiedKey === `tx-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                                <a
                                  href={getExplorerUrl(order.tx_hash, order.payment_method)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF5C00] hover:underline text-[11px] font-bold flex items-center gap-0.5"
                                >
                                  <span>View on {getExplorerName(order.payment_method)}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          )}

                          {order.verification_note && (
                            <p className="text-[11px] text-amber-300/90 font-mono bg-amber-950/30 border border-amber-500/30 rounded-lg p-2">
                              {order.verification_note}
                            </p>
                          )}
                        </div>
                      )}

                      {/* EXPANDABLE SECTION (Payment details & TxID input) */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#1A4B36] flex flex-col gap-4 text-xs font-mono">
                          
                          {/* Receiving Wallet Address */}
                          {order.deposit_address && (
                            <div className="bg-[#082216] border border-[#1A4B36] rounded-xl p-3 flex flex-col gap-2">
                              <span className="text-[10px] text-[#D5EFE3]/60 uppercase tracking-wider font-bold">
                                Designated Receiving Address ({method === 'btc' ? 'Bitcoin' : method === 'ltc' ? 'Litecoin' : 'TRON USDT'})
                              </span>
                              <div className="flex items-center justify-between gap-2 bg-[#041A10] p-2.5 rounded-lg border border-[#1A4B36]">
                                <span className="font-bold text-white break-all select-all text-[11px]">
                                  {order.deposit_address}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(order.deposit_address!, `addr-${order.id}`)}
                                    className="p-1.5 bg-[#082216] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded text-xs transition cursor-pointer"
                                    title="Copy receiving address"
                                  >
                                    {copiedKey === `addr-${order.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQrModalOrder(order)}
                                    className="p-1.5 bg-[#082216] hover:bg-[#103825] border border-[#1A4B36] text-[#FF5C00] hover:text-white rounded text-xs transition cursor-pointer"
                                    title="Show QR Code"
                                  >
                                    <QrCode className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              {method === 'btc' && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-200">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold text-amber-300 block">Binance Deposit Notice:</span>
                                    Binance supports deposits from all BTC addresses (starting with "1", "3", "bc1p" and "bc1q").
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Submit TxID form if in pending_payment */}
                          {order.status === 'pending_payment' && (
                            <form onSubmit={e => handleSubmitTxHash(e, order.id)} className="bg-[#082216] border border-[#1A4B36] rounded-xl p-3.5 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-[#FF5C00]" />
                                  <span>Have you sent the crypto payment?</span>
                                </span>
                                <span className="text-[10px] text-[#D5EFE3]/60">Enter TxID for automated credit</span>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={submittingOrderId === order.id ? txHashInput : ''}
                                  onChange={e => {
                                    setSubmittingOrderId(order.id);
                                    setTxHashInput(e.target.value);
                                  }}
                                  onFocus={() => setSubmittingOrderId(order.id)}
                                  placeholder="Paste 64-character Transaction Hash (TxID)..."
                                  className="flex-1 bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3 py-2 text-xs font-mono outline-none"
                                  required
                                />
                                <button
                                  type="submit"
                                  disabled={isVerifyingOrder === order.id}
                                  className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF731E] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  {isVerifyingOrder === order.id ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      <span>Verifying...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="h-3.5 w-3.5" />
                                      <span>Verify & Credit</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {inlineError[order.id] && (
                                <div className="text-[11px] text-red-400 font-mono bg-red-950/30 border border-red-500/30 rounded-lg p-2 flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span>{inlineError[order.id]}</span>
                                </div>
                              )}
                            </form>
                          )}

                          {/* Cancel Order Action */}
                          {order.status === 'pending_payment' && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-[11px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 transition cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Cancel this deposit request</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* HISTORY / RECEIPTS TAB */
            completedOrders.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-[#D5EFE3]/50">
                No completed deposit receipts yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#1A4B36]">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#041A10] text-[#D5EFE3]/70 font-mono uppercase tracking-wider text-[10px] border-b border-[#1A4B36]">
                    <tr>
                      <th className="py-2.5 px-3">Order ID & Date</th>
                      <th className="py-2.5 px-3">Network</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Barcodes Credited</th>
                      <th className="py-2.5 px-3">TxID</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A4B36]/60 bg-[#082216]">
                    {completedOrders.map(order => {
                      const method = order.payment_method || 'usdt_trc20';
                      const isApproved = order.status === 'approved';

                      return (
                        <tr key={order.id} className="hover:bg-[#0C2A1E]/50 transition">
                          <td className="py-2.5 px-3 font-mono">
                            <div className="font-bold text-white">{order.id}</div>
                            <div className="text-[10px] text-[#D5EFE3]/50">
                              {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              method === 'btc' 
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                : method === 'ltc'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {method === 'btc' ? 'BTC' : method === 'ltc' ? 'LTC' : 'USDT (TRC20)'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                            {order.crypto_amount ? `${order.crypto_amount} ${order.crypto_currency || 'USDT'}` : `${order.amount_usdt}.00 USDT`}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[#FF5C00] font-black">
                            +{order.tokens_to_credit}
                          </td>

                          <td className="py-2.5 px-3 font-mono">
                            {order.tx_hash ? (
                              <a
                                href={getExplorerUrl(order.tx_hash, order.payment_method)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#FF5C00] hover:underline flex items-center gap-1 font-bold text-[11px]"
                              >
                                <span>{order.tx_hash.substring(0, 8)}...</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-[#D5EFE3]/40 italic text-[11px]">N/A</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isApproved 
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-red-950 text-red-300 border border-red-500/40'
                            }`}>
                              {isApproved ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                              <span className="uppercase">{order.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Support Footer Note */}
        <div className="mt-5 pt-4 border-t border-[#1A4B36]/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#D5EFE3]/70 font-sans">
            <Headphones className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Need deposit verification or have questions? Reach Official 24/7 Support:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={SUPPORT_CONFIG.telegram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-[#041A10] hover:bg-[#103825] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="h-3 w-3" />
              <span>Telegram: @kingof_kyc</span>
            </a>
            <a
              href={SUPPORT_CONFIG.whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-[#041A10] hover:bg-[#103825] border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageCircle className="h-3 w-3" />
              <span>WhatsApp: +1 (414) 401-5805</span>
            </a>
          </div>
        </div>

      </div>

      {/* QR CODE POPUP MODAL */}
      {qrModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#082216] border border-[#1A4B36] rounded-3xl w-full max-w-sm p-6 flex flex-col items-center gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between w-full border-b border-[#1A4B36] pb-3">
              <span className="text-sm font-bold text-white font-sans">
                Scan Receiving QR Code
              </span>
              <button
                type="button"
                onClick={() => setQrModalOrder(null)}
                className="text-[#D5EFE3]/60 hover:text-white p-1 rounded-lg hover:bg-[#103825] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl shadow-inner">
              <QRCode
                value={qrModalOrder.deposit_address || ''}
                size={180}
                level="M"
              />
            </div>

            <span className="text-xs font-mono text-center text-white break-all select-all bg-[#041A10] p-2.5 rounded-xl border border-[#1A4B36] w-full">
              {qrModalOrder.deposit_address}
            </span>

            {qrModalOrder.payment_method === 'btc' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-200 flex items-start gap-2 text-left w-full">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block">Binance Deposit Notice:</span>
                  Binance supports deposits from all BTC addresses (starting with "1", "3", "bc1p" and "bc1q").
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (qrModalOrder.deposit_address) {
                  navigator.clipboard.writeText(qrModalOrder.deposit_address);
                  setCopiedKey('qr-modal');
                  setTimeout(() => setCopiedKey(null), 2000);
                }
              }}
              className="w-full py-2.5 bg-[#FF5C00] hover:bg-[#FF731E] text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedKey === 'qr-modal' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Address Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
