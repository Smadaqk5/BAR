import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  DollarSign, 
  RefreshCw,
  Check,
  CheckCircle2,
  PackagePlus,
  Boxes,
  Tag,
  Star,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Percent,
  TrendingUp,
  Calculator,
  SlidersHorizontal,
  Coins
} from 'lucide-react';
import { PortalStore } from '../utils/portalStore';
import { TokenPackage } from '../types';

interface AdminPackagePricingManagerProps {
  packages: TokenPackage[];
  setPackages: React.Dispatch<React.SetStateAction<TokenPackage[]>>;
  showToast: (msg: string) => void;
  onOpenEditModal: (pkg: TokenPackage) => void;
  onOpenCreateModal: () => void;
}

export const AdminPackagePricingManager: React.FC<AdminPackagePricingManagerProps> = ({
  packages,
  setPackages,
  showToast,
  onOpenEditModal,
  onOpenCreateModal
}) => {
  // Global Token Purchase Rate Configurator State
  const [baseTokenRate, setBaseTokenRate] = useState<number>(1.0); // Rate: USDT per 1 barcode token
  const [isApplyingRate, setIsApplyingRate] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // New Package Tier Form State (Inline in AdminOrders Panel)
  const [newTierLabel, setNewTierLabel] = useState<string>('');
  const [newTierTokens, setNewTierTokens] = useState<number | ''>(50);
  const [newTierUsdt, setNewTierUsdt] = useState<number | ''>(45);
  const [newTierBonus, setNewTierBonus] = useState<string>('+5 Bonus Barcodes');
  const [newTierPopular, setNewTierPopular] = useState<boolean>(false);
  const [newTierDescription, setNewTierDescription] = useState<string>('');
  const [newTierEnabled, setNewTierEnabled] = useState<boolean>(true);
  const [isSubmittingNewTier, setIsSubmittingNewTier] = useState<boolean>(false);

  // Inline Package Rates State: pkgId -> { tokens, usdt, bonus }
  const [inlineRates, setInlineRates] = useState<{ [id: string]: { tokens: number; usdt: number } }>({});
  const [savingRateId, setSavingRateId] = useState<string | null>(null);

  // Calculate live effective rate for new tier
  const calculatedNewTierRate = (newTierTokens && newTierUsdt && Number(newTierTokens) > 0)
    ? (Number(newTierUsdt) / Number(newTierTokens)).toFixed(2)
    : '1.00';

  // Apply Base Token Purchase Rate across all package tiers
  const handleApplyBaseRateToAll = async () => {
    const rate = Number(baseTokenRate);
    if (isNaN(rate) || rate <= 0) {
      showToast('⚠️ Please enter a valid base token purchase rate (> $0.00).');
      return;
    }

    if (!confirm(`Recalculate pricing for all ${packages.length} packages based on $${rate.toFixed(2)} per barcode token?`)) {
      return;
    }

    setIsApplyingRate(true);
    try {
      const currentList = PortalStore.getPackages();
      const updatedList = currentList.map(p => {
        const newUsdt = Math.max(1, Math.round(p.tokens * rate));
        return {
          ...p,
          usdt: newUsdt,
          bonus: rate < 1 ? `Special Rate ($${rate.toFixed(2)}/ea)` : p.bonus
        };
      });

      PortalStore.savePackages(updatedList);
      await PortalStore.syncPackagesToSupabase();
      setPackages(PortalStore.getPackages());
      showToast(`✅ Base rate updated to $${rate.toFixed(2)}/barcode & synced to checkout modal!`);
    } catch (err) {
      console.warn('Error applying rate to all:', err);
      showToast(`✅ Updated rates to $${rate.toFixed(2)}/barcode and synced locally!`);
    } finally {
      setIsApplyingRate(false);
    }
  };

  // Add a brand new barcode package tier directly from the panel
  const handleCreateNewTier = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = newTierLabel.trim();
    if (!cleanLabel) {
      showToast('⚠️ Please enter a title for the new package tier.');
      return;
    }

    const tokensVal = Math.max(1, Number(newTierTokens) || 1);
    const usdtVal = Math.max(1, Number(newTierUsdt) || 1);

    setIsSubmittingNewTier(true);
    try {
      PortalStore.addPackage({
        label: cleanLabel,
        tokens: tokensVal,
        usdt: usdtVal,
        bonus: newTierBonus.trim() || undefined,
        popular: newTierPopular,
        description: newTierDescription.trim() || undefined,
        enabled: newTierEnabled
      });

      const syncResult = await PortalStore.syncPackagesToSupabase();
      setPackages(PortalStore.getPackages());

      // Reset form
      setNewTierLabel('');
      setNewTierTokens(100);
      setNewTierUsdt(90);
      setNewTierBonus('');
      setNewTierPopular(false);
      setNewTierDescription('');
      setNewTierEnabled(true);

      if (syncResult.success) {
        showToast(`✅ Created tier "${cleanLabel}" & saved to Supabase DB for all customers!`);
      } else {
        showToast(`⚠️ Created tier "${cleanLabel}" locally. ${syncResult.message}`);
      }
    } catch (err) {
      console.error('Failed to create package tier:', err);
      showToast(`⚠️ Error creating tier: ${err}`);
    } finally {
      setIsSubmittingNewTier(false);
    }
  };

  // Inline update for an individual package's token purchase rate / price
  const handleSaveInlineRate = async (pkgId: string, currentTokens: number, currentUsdt: number) => {
    const updated = inlineRates[pkgId];
    const finalTokens = updated ? Math.max(1, Number(updated.tokens) || currentTokens) : currentTokens;
    const finalUsdt = updated ? Math.max(1, Number(updated.usdt) || currentUsdt) : currentUsdt;

    setSavingRateId(pkgId);
    try {
      PortalStore.updatePackage(pkgId, {
        tokens: finalTokens,
        usdt: finalUsdt
      });
      const syncResult = await PortalStore.syncPackagesToSupabase();
      setPackages(PortalStore.getPackages());
      if (syncResult.success) {
        showToast(`✅ Updated rate: ${finalTokens} barcodes for $${finalUsdt} USDT & saved to DB!`);
      } else {
        showToast(`⚠️ Rate saved locally. ${syncResult.message}`);
      }
    } catch (err) {
      console.error('Failed to update inline rate:', err);
      showToast('⚠️ Failed to save rate to database.');
    } finally {
      setSavingRateId(null);
    }
  };

  // Toggle enabled/disabled in checkout
  const handleTogglePackageEnabled = async (pkg: TokenPackage) => {
    const nextState = pkg.enabled === false ? true : false;
    PortalStore.updatePackage(pkg.id, { enabled: nextState });
    setPackages(PortalStore.getPackages());
    const syncResult = await PortalStore.syncPackagesToSupabase();
    showToast(`${nextState ? 'Enabled' : 'Disabled'} "${pkg.label}". ${syncResult.success ? 'Synced to DB.' : syncResult.message}`);
  };

  // Toggle popular tag
  const handleTogglePopular = async (pkg: TokenPackage) => {
    const nextPopular = !pkg.popular;
    PortalStore.updatePackage(pkg.id, { popular: nextPopular });
    setPackages(PortalStore.getPackages());
    const syncResult = await PortalStore.syncPackagesToSupabase();
    showToast(`${nextPopular ? 'Marked as POPULAR' : 'Removed popular badge'}. ${syncResult.success ? 'Synced to DB.' : syncResult.message}`);
  };

  // Delete package tier
  const handleDeletePackage = async (pkgId: string, label: string) => {
    if (packages.length <= 1) {
      alert('You must maintain at least one active barcode package.');
      return;
    }
    if (confirm(`Are you sure you want to delete the package tier "${label}"?`)) {
      PortalStore.deletePackage(pkgId);
      setPackages(PortalStore.getPackages());
      const syncResult = await PortalStore.syncPackagesToSupabase();
      showToast(`Deleted "${label}". ${syncResult.success ? 'Removed from DB.' : syncResult.message}`);
    }
  };

  // Sync all packages manually
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const syncResult = await PortalStore.syncPackagesToSupabase();
      setPackages(PortalStore.getPackages());
      if (syncResult.success) {
        showToast('✅ All packages & rates saved to Supabase DB and live for all customers!');
      } else {
        showToast(`⚠️ Sync notice: ${syncResult.message}`);
      }
    } catch (err) {
      console.warn(err);
      showToast('⚠️ Error syncing packages to database.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset to default packages
  const handleResetDefaults = async () => {
    if (confirm('Reset all packages to the official default catalog?')) {
      const reset = PortalStore.resetDefaultPackages();
      setPackages(reset);
      const syncResult = await PortalStore.syncPackagesToSupabase();
      showToast(`Reset to default barcode packages. ${syncResult.success ? 'Synced to DB.' : syncResult.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
            <Boxes className="h-5 w-5 text-[#FF5C00]" />
            <span>Barcode Packages & Token Purchase Rates</span>
          </h3>
          <p className="text-xs text-[#D5EFE3]/70 font-sans mt-0.5">
            Configure barcode purchase rates, add custom package tiers, and manage pricing. All changes automatically sync to the client checkout modal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Reset to default packages"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 border border-emerald-400/30"
            title="Sync all packages to customer devices"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Checkout Modal'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-[#FF5C00] hover:bg-[#FF731E] text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            title="Open advanced creation dialog"
          >
            <Plus className="h-4 w-4" />
            <span>Advanced Modal</span>
          </button>
        </div>
      </div>

      {/* 2. DUAL CONSOLE: (A) TOKEN PURCHASE RATE CONTROLLER + (B) ADD NEW PACKAGE TIER FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION A: TOKEN PURCHASE RATE CONTROLLER (5 Cols) */}
        <div className="lg:col-span-5 bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#1A4B36] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">Token Purchase Rate Engine</h4>
                  <span className="text-[10px] text-[#D5EFE3]/60 font-mono">Global Rate per Barcode Token</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30">
                Active Sync
              </span>
            </div>

            <p className="text-xs text-[#D5EFE3]/70 font-sans mb-4">
              Set the base purchasing rate per barcode token. You can quickly calculate and update pricing across all active tiers.
            </p>

            {/* Input Field for Token Purchase Rate */}
            <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-4 flex flex-col gap-3">
              <label 
                htmlFor="admin-token-rate-input"
                className="block text-xs font-mono font-bold uppercase text-[#D5EFE3]/80"
              >
                Base Token Purchase Rate ($ USD / USDT per Barcode):
              </label>

              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#FF5C00] font-mono font-bold text-sm">$</span>
                <input
                  id="admin-token-rate-input"
                  type="number"
                  step="0.05"
                  min="0.01"
                  max="50"
                  value={baseTokenRate}
                  onChange={e => setBaseTokenRate(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-full bg-[#082216] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl pl-8 pr-20 py-2.5 text-sm font-mono font-bold outline-none"
                  placeholder="1.00"
                />
                <span className="absolute right-3 text-xs text-[#D5EFE3]/60 font-mono">
                  USD / Token
                </span>
              </div>

              {/* Dynamic Rate Readout */}
              <div className="flex items-center justify-between text-[11px] font-mono bg-[#082216] px-3 py-2 rounded-lg border border-[#1A4B36]/60">
                <span className="text-[#D5EFE3]/70">Rate Calculation:</span>
                <span className="text-emerald-400 font-bold">
                  1 Barcode = ${baseTokenRate.toFixed(2)} USDT
                </span>
              </div>

              <div className="text-[10px] text-[#D5EFE3]/50 font-mono flex justify-between">
                <span>10 Barcodes = ${(10 * baseTokenRate).toFixed(2)}</span>
                <span>50 Barcodes = ${(50 * baseTokenRate).toFixed(2)}</span>
                <span>100 Barcodes = ${(100 * baseTokenRate).toFixed(2)}</span>
              </div>
            </div>

            {/* Quick Rate Preset Chips */}
            <div className="mt-4">
              <span className="block text-[10px] font-mono font-bold uppercase text-[#D5EFE3]/60 mb-2">
                Quick Rate Presets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '$0.50 / ea', rate: 0.50, desc: '50% Bulk' },
                  { label: '$0.75 / ea', rate: 0.75, desc: 'Discount' },
                  { label: '$0.90 / ea', rate: 0.90, desc: 'Promo' },
                  { label: '$1.00 / ea', rate: 1.00, desc: 'Standard' },
                  { label: '$1.25 / ea', rate: 1.25, desc: 'Plus' },
                  { label: '$1.50 / ea', rate: 1.50, desc: 'Premium' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBaseTokenRate(preset.rate)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer flex flex-col items-center justify-center ${
                      baseTokenRate === preset.rate
                        ? 'bg-[#FF5C00]/20 border-[#FF5C00] text-[#FF5C00] font-bold shadow-xs'
                        : 'bg-[#041A10] border-[#1A4B36] text-[#D5EFE3]/80 hover:border-emerald-500/50 hover:text-white'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="text-[9px] text-[#D5EFE3]/50">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button: Apply Rate to All Tiers */}
          <button
            type="button"
            onClick={handleApplyBaseRateToAll}
            disabled={isApplyingRate}
            className="w-full py-3 bg-[#FF5C00] hover:bg-[#FF731E] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,92,0,0.35)] cursor-pointer"
          >
            {isApplyingRate ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Applying & Syncing to Checkout...</span>
              </>
            ) : (
              <>
                <Percent className="h-4 w-4" />
                <span>Apply Rate (${baseTokenRate.toFixed(2)}/ea) to All Package Tiers</span>
              </>
            )}
          </button>
        </div>

        {/* SECTION B: ADD NEW BARCODE PACKAGE TIER FORM (7 Cols) */}
        <div className="lg:col-span-7 bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-5">
          <form onSubmit={handleCreateNewTier} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#1A4B36] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center border border-[#FF5C00]/30">
                  <PackagePlus className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">Add New Barcode Package Tier</h4>
                  <span className="text-[10px] text-[#D5EFE3]/60 font-mono">Instant Sync to Client Checkout Modal</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                + New Tier
              </span>
            </div>

            {/* Inputs: Tier Title & Tokens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label 
                  htmlFor="admin-new-tier-label"
                  className="block text-xs font-mono font-bold text-[#D5EFE3]/80 mb-1"
                >
                  Package Tier Title:
                </label>
                <input
                  id="admin-new-tier-label"
                  type="text"
                  value={newTierLabel}
                  onChange={e => setNewTierLabel(e.target.value)}
                  placeholder="e.g. Agency Pro Pack, Weekend Pass"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3.5 py-2 text-xs font-sans outline-none"
                  required
                />
              </div>

              <div>
                <label 
                  htmlFor="admin-new-tier-tokens"
                  className="block text-xs font-mono font-bold text-[#D5EFE3]/80 mb-1"
                >
                  Barcode Count (Tokens Credited):
                </label>
                <input
                  id="admin-new-tier-tokens"
                  type="number"
                  min="1"
                  max="10000"
                  value={newTierTokens}
                  onChange={e => setNewTierTokens(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="100"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none"
                  required
                />
              </div>
            </div>

            {/* Inputs: USDT Price & Rate Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label 
                  htmlFor="admin-new-tier-usdt"
                  className="block text-xs font-mono font-bold text-[#D5EFE3]/80 mb-1"
                >
                  Purchase Price ($ USDT / USD):
                </label>
                <input
                  id="admin-new-tier-usdt"
                  type="number"
                  min="1"
                  max="10000"
                  value={newTierUsdt}
                  onChange={e => setNewTierUsdt(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="90"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none"
                  required
                />
              </div>

              {/* Dynamic Live Rate Badge */}
              <div className="flex flex-col justify-end">
                <span className="block text-[11px] font-mono text-[#D5EFE3]/60 mb-1">
                  Effective Purchase Rate:
                </span>
                <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D5EFE3]/70">Rate per barcode:</span>
                  <span className="text-emerald-400 font-bold">
                    ${calculatedNewTierRate} / Barcode
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs: Bonus Tag & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label 
                  htmlFor="admin-new-tier-bonus"
                  className="block text-xs font-mono font-bold text-[#D5EFE3]/80 mb-1"
                >
                  Promo / Bonus Badge (Optional):
                </label>
                <input
                  id="admin-new-tier-bonus"
                  type="text"
                  value={newTierBonus}
                  onChange={e => setNewTierBonus(e.target.value)}
                  placeholder="e.g. +10 Bonus Barcodes, 20% Off"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3.5 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label 
                  htmlFor="admin-new-tier-desc"
                  className="block text-xs font-mono font-bold text-[#D5EFE3]/80 mb-1"
                >
                  Short Description (Optional):
                </label>
                <input
                  id="admin-new-tier-desc"
                  type="text"
                  value={newTierDescription}
                  onChange={e => setNewTierDescription(e.target.value)}
                  placeholder="e.g. Best for small businesses & regular search"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3.5 py-2 text-xs font-sans outline-none"
                />
              </div>
            </div>

            {/* Toggles: Popular Badge & Active in Checkout */}
            <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input
                  type="checkbox"
                  checked={newTierPopular}
                  onChange={e => setNewTierPopular(e.target.checked)}
                  className="accent-[#FF5C00] w-4 h-4 rounded cursor-pointer"
                />
                <span className="font-bold flex items-center gap-1">
                  <Star className="h-3 w-3 text-[#FF5C00] fill-current" />
                  <span>Highlight as "POPULAR"</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input
                  type="checkbox"
                  checked={newTierEnabled}
                  onChange={e => setNewTierEnabled(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live Active in Checkout</span>
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmittingNewTier}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-2 shadow-md cursor-pointer border border-emerald-400/30"
            >
              {isSubmittingNewTier ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Creating & Syncing to Checkout...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>+ Add New Package Tier & Sync to Checkout Modal</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* 3. PACKAGES SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
          <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Total Tiers</span>
          <span className="text-xl font-black text-white font-mono mt-1">{packages.length}</span>
        </div>
        <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
          <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Active in Checkout</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1">
            {packages.filter(p => p.enabled !== false).length}
          </span>
        </div>
        <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
          <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Featured / Popular</span>
          <span className="text-xs font-bold text-[#FF5C00] truncate mt-1.5">
            {packages.find(p => p.popular)?.label || 'None set'}
          </span>
        </div>
        <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
          <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Minimum USDT Tier</span>
          <span className="text-xl font-black text-[#D5EFE3] font-mono mt-1">
            ${packages.length > 0 ? Math.min(...packages.map(p => p.usdt)) : 0} USDT
          </span>
        </div>
      </div>

      {/* 4. ACTIVE PACKAGE TIERS GRID WITH INLINE RATE EDITORS */}
      <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A4B36] pb-3">
          <div>
            <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#FF5C00]" />
              <span>Active Package Catalog & Quick Rate Editor</span>
            </h4>
            <p className="text-xs text-[#D5EFE3]/70 font-sans mt-0.5">
              Adjust tokens or USDT prices directly in the fields below. Click "Save Rate" to immediately push live updates to customer checkouts.
            </p>
          </div>

          <span className="text-xs font-mono text-[#D5EFE3]/60">
            {packages.length} Packages Configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map(pkg => {
            const isEnabled = pkg.enabled !== false;
            const currentInline = inlineRates[pkg.id] || { tokens: pkg.tokens, usdt: pkg.usdt };
            const effectivePerBarcode = (currentInline.usdt / currentInline.tokens).toFixed(2);
            const isSavingThis = savingRateId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`bg-[#041A10] border rounded-2xl p-4 flex flex-col justify-between relative transition shadow-sm ${
                  pkg.popular 
                    ? 'border-[#FF5C00] shadow-[0_0_15px_rgba(255,92,0,0.15)]' 
                    : isEnabled ? 'border-[#1A4B36] hover:border-emerald-500/40' : 'border-zinc-800 opacity-65'
                }`}
              >
                <div>
                  {/* Card Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      {pkg.popular && (
                        <span className="bg-[#FF5C00] text-white text-[9px] font-black px-1.5 py-0.5 rounded font-mono flex items-center gap-1 shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          POPULAR
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                          isEnabled 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {isEnabled ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePopular(pkg)}
                      className={`p-1 rounded hover:bg-[#103825] transition cursor-pointer ${
                        pkg.popular ? 'text-[#FF5C00]' : 'text-[#D5EFE3]/40 hover:text-white'
                      }`}
                      title={pkg.popular ? 'Remove Popular badge' : 'Set as Popular badge'}
                    >
                      <Star className={`h-4 w-4 ${pkg.popular ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-white font-sans truncate" title={pkg.label}>
                    {pkg.label}
                  </h4>

                  {/* INLINE RATE EDITORS */}
                  <div className="bg-[#082216] border border-[#1A4B36] rounded-xl p-3 my-3 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <label 
                        htmlFor={`admin-pkg-tokens-${pkg.id}`}
                        className="text-[10px] font-mono font-bold text-[#D5EFE3]/70 uppercase"
                      >
                        Barcodes:
                      </label>
                      <input
                        id={`admin-pkg-tokens-${pkg.id}`}
                        type="number"
                        min="1"
                        value={currentInline.tokens}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setInlineRates(prev => ({
                            ...prev,
                            [pkg.id]: {
                              tokens: val,
                              usdt: prev[pkg.id]?.usdt ?? pkg.usdt
                            }
                          }));
                        }}
                        className="w-24 bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-lg px-2 py-1 text-right font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label 
                        htmlFor={`admin-pkg-usdt-${pkg.id}`}
                        className="text-[10px] font-mono font-bold text-[#D5EFE3]/70 uppercase"
                      >
                        USDT Price ($):
                      </label>
                      <input
                        id={`admin-pkg-usdt-${pkg.id}`}
                        type="number"
                        min="1"
                        value={currentInline.usdt}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setInlineRates(prev => ({
                            ...prev,
                            [pkg.id]: {
                              tokens: prev[pkg.id]?.tokens ?? pkg.tokens,
                              usdt: val
                            }
                          }));
                        }}
                        className="w-24 bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-lg px-2 py-1 text-right font-mono text-xs font-bold outline-none text-emerald-400"
                      />
                    </div>

                    {/* Calculated Live Rate */}
                    <div className="pt-1.5 border-t border-[#1A4B36]/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#D5EFE3]/60">Purchase Rate:</span>
                      <span className="text-emerald-300 font-bold">${effectivePerBarcode} / ea</span>
                    </div>

                    {/* Save Quick Rate Action */}
                    <button
                      type="button"
                      onClick={() => handleSaveInlineRate(pkg.id, pkg.tokens, pkg.usdt)}
                      disabled={isSavingThis}
                      className="w-full py-1.5 bg-[#FF5C00]/20 hover:bg-[#FF5C00] text-[#FF5C00] hover:text-white border border-[#FF5C00]/40 rounded-lg text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingThis ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      <span>Save Rate & Sync</span>
                    </button>
                  </div>

                  {/* Bonus Tag if any */}
                  {pkg.bonus && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                      <span className="truncate">{pkg.bonus}</span>
                    </div>
                  )}

                  {pkg.description && (
                    <p className="text-[11px] text-[#D5EFE3]/60 font-sans line-clamp-2">
                      {pkg.description}
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-3 pt-3 border-t border-[#1A4B36] flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(pkg)}
                    className="px-2.5 py-1.5 bg-[#082216] hover:bg-[#103825] border border-[#1A4B36] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer flex-1 justify-center"
                    title="Edit full package details in dialog"
                  >
                    <Edit3 className="h-3 w-3 text-[#FF5C00]" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePackageEnabled(pkg)}
                    className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      isEnabled 
                        ? 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300' 
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                    title={isEnabled ? 'Disable in checkout' : 'Enable in checkout'}
                  >
                    {isEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id, pkg.label)}
                    className="p-1.5 bg-red-950/60 hover:bg-red-800 border border-red-500/30 text-red-300 rounded-lg text-xs transition cursor-pointer"
                    title="Delete package tier"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Client Synchronization Guarantee */}
        <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-3.5 flex items-center gap-3 text-xs text-[#D5EFE3]/80 mt-2">
          <div className="p-2 bg-[#FF5C00]/20 text-[#FF5C00] rounded-xl shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <span className="font-bold text-white block">Real-Time Client-Side Checkout Sync Active</span>
            <span>Any rates updated or package tiers created above are broadcast immediately across browser channels (`bryt_portal_packages_changed`) to all open customer deposit checkout modals without requiring a manual browser refresh.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
