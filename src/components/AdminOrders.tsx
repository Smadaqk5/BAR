import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Coins, 
  DollarSign, 
  ArrowLeft, 
  RefreshCw,
  Search,
  Check,
  Copy,
  Database,
  PackagePlus,
  Package,
  Boxes,
  Layers,
  Tag,
  Star,
  Sparkles,
  X,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  AlertCircle,
  Wallet,
  Zap,
  QrCode,
  Sliders,
  Globe,
  CreditCard,
  History,
  ArrowUpRight,
  SlidersHorizontal
} from 'lucide-react';
import { PortalStore, PortalSettings } from '../utils/portalStore';
import { 
  isSupabaseConfigured, 
  getSupabaseConfig, 
  saveCustomSupabaseConfig, 
  SUPABASE_SQL_SCHEMA, 
  SupabaseService 
} from '../utils/supabase';
import { User, Order, OrderStatus, TokenPackage, PaymentMethod } from '../types';
import { AdminPackagePricingManager } from './AdminPackagePricingManager';

interface AdminOrdersProps {
  onBackToPortal: () => void;
  currentUser: User;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ onBackToPortal, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>(PortalStore.getAllOrders());
  const [users, setUsers] = useState<User[]>(PortalStore.getAllUsers());
  const [packages, setPackages] = useState<TokenPackage[]>(PortalStore.getPackages());
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'packages' | 'gateway' | 'billing'>('orders');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Account & Billing Management State
  const [billingSection, setBillingSection] = useState<'all' | 'override' | 'history' | 'packages'>('all');
  const [overrideUserId, setOverrideUserId] = useState<string>('');
  const [overrideMode, setOverrideMode] = useState<'set' | 'add' | 'subtract'>('set');
  const [overrideAmount, setOverrideAmount] = useState<number>(50);
  const [overrideReason, setOverrideReason] = useState<string>('Account Adjustment / Balance Override');
  const [isApplyingOverride, setIsApplyingOverride] = useState<boolean>(false);
  const [billingUserSearch, setBillingUserSearch] = useState<string>('');

  // Deposit History Filters in Billing Tab
  const [billingDepositSearch, setBillingDepositSearch] = useState<string>('');
  const [billingDepositMethod, setBillingDepositMethod] = useState<string>('all');
  const [billingDepositStatus, setBillingDepositStatus] = useState<string>('all');

  // Gateway Settings State
  const initialSettings = PortalStore.getSettings();
  const [gatewayTronAddress, setGatewayTronAddress] = useState(initialSettings.depositAddress);
  const [gatewayBtcAddress, setGatewayBtcAddress] = useState(initialSettings.btcDepositAddress);
  const [gatewayLtcAddress, setGatewayLtcAddress] = useState(initialSettings.ltcDepositAddress);
  const [gatewayAutoApproval, setGatewayAutoApproval] = useState(initialSettings.autoApproval !== false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);

  // Filter state
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingPackages, setIsSyncingPackages] = useState(false);

  // Package modal & form state
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isSavingPackageModal, setIsSavingPackageModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgLabel, setPkgLabel] = useState('');
  const [pkgUsdt, setPkgUsdt] = useState<number>(25);
  const [pkgTokens, setPkgTokens] = useState<number>(30);
  const [pkgBonus, setPkgBonus] = useState('');
  const [pkgPopular, setPkgPopular] = useState(false);
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgEnabled, setPkgEnabled] = useState(true);

  // Supabase Database Connection & Migration Modal State
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState(() => getSupabaseConfig().url);
  const [dbKeyInput, setDbKeyInput] = useState(() => getSupabaseConfig().anonKey);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [copiedSql, setCopiedSql] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Automatically sync with cloud database on load
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsSyncing(true);
      PortalStore.syncFromSupabase().then(res => {
        setOrders(res.orders);
        setUsers(res.users);
        if (res.packages && res.packages.length > 0) {
          setPackages(res.packages);
        }
      }).finally(() => {
        setIsSyncing(false);
      });
    }
  }, []);

  const refreshData = async () => {
    setIsSyncing(true);
    const res = await PortalStore.syncFromSupabase();
    setOrders(res.orders);
    setUsers(res.users);
    if (res.packages && res.packages.length > 0) {
      setPackages(res.packages);
    }
    setIsSyncing(false);
    showToast(isSupabaseConfigured() ? 'Cloud database refreshed!' : 'Local data refreshed');
  };

  const handleSaveDbConfig = async () => {
    saveCustomSupabaseConfig(dbUrlInput, dbKeyInput);
    setIsTestingDb(true);
    setDbTestResult({ status: 'idle', message: '' });
    try {
      if (dbUrlInput.trim() && dbKeyInput.trim()) {
        const syncResult = await PortalStore.syncPackagesToSupabase();
        if (syncResult.success) {
          setDbTestResult({
            status: 'success',
            message: 'Successfully connected to Supabase! Packages table verified & active.'
          });
          showToast('✅ Supabase connected & packages synced to database!');
        } else {
          setDbTestResult({
            status: 'error',
            message: syncResult.message
          });
          showToast('⚠️ Connected, but table write failed. Check RLS policies in SQL script.');
        }
      } else {
        setDbTestResult({
          status: 'idle',
          message: 'Saved in Local Storage mode (no remote database configured).'
        });
        showToast('Running in local storage mode.');
      }
      await refreshData();
    } catch (err: any) {
      setDbTestResult({
        status: 'error',
        message: err?.message || 'Failed to connect to database.'
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleCopyMigrationSql = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    }
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    showToast('📋 Copied full SQL Migration Script to clipboard!');
  };

  const handleForceApprove = (orderId: string) => {
    const updated = PortalStore.adminForceApproveOrder(orderId);
    if (updated) {
      setOrders(PortalStore.getAllOrders());
      setUsers(PortalStore.getAllUsers());
      showToast(`Order ${orderId} force-approved and credited!`);
    }
  };

  const handleRejectOrder = (orderId: string) => {
    const updated = PortalStore.adminRejectOrder(orderId);
    if (updated) {
      setOrders(PortalStore.getAllOrders());
      showToast(`Order ${orderId} rejected.`);
    }
  };

  const handleAddTokens = (userId: string, count: number) => {
    const updated = PortalStore.updateUserTokens(userId, count, true);
    if (updated) {
      setUsers(PortalStore.getAllUsers());
      showToast(`Added +${count} barcodes to ${updated.email}`);
    }
  };

  const handleSetTokens = (userId: string, current: number) => {
    const input = prompt('Enter new barcode balance for user:', current.toString());
    if (input !== null) {
      const parsed = parseInt(input, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        const updated = PortalStore.updateUserTokens(userId, parsed, false);
        if (updated) {
          setUsers(PortalStore.getAllUsers());
          showToast(`Set ${updated.email} balance to ${parsed} barcodes`);
        }
      }
    }
  };

  const handleDeleteUser = (userId: string, email: string) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own active admin account.');
      return;
    }
    if (confirm(`Are you sure you want to delete user ${email}?`)) {
      PortalStore.deleteUser(userId);
      setUsers(PortalStore.getAllUsers());
      showToast(`Deleted user ${email}`);
    }
  };

  // Package Management Handlers
  const handleOpenCreatePackage = () => {
    setEditingPackageId(null);
    setPkgLabel('');
    setPkgUsdt(25);
    setPkgTokens(30);
    setPkgBonus('+5 Bonus Barcodes');
    setPkgPopular(false);
    setPkgDescription('');
    setPkgEnabled(true);
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: TokenPackage) => {
    setEditingPackageId(pkg.id);
    setPkgLabel(pkg.label);
    setPkgUsdt(pkg.usdt);
    setPkgTokens(pkg.tokens);
    setPkgBonus(pkg.bonus || '');
    setPkgPopular(Boolean(pkg.popular));
    setPkgDescription(pkg.description || '');
    setPkgEnabled(pkg.enabled !== false);
    setIsPackageModalOpen(true);
  };

  const handleSaveAndSyncAllPackages = async () => {
    setIsSyncingPackages(true);
    try {
      const res = await PortalStore.syncPackagesToSupabase();
      setPackages(PortalStore.getPackages());
      if (res.success) {
        showToast('✅ All packages saved to Supabase DB & synced for all customers!');
      } else {
        showToast(`⚠️ Saved locally: ${res.message}`);
      }
    } catch (err) {
      console.warn('Sync packages warning:', err);
      showToast('⚠️ Sync error occurred. Check browser console.');
    } finally {
      setIsSyncingPackages(false);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = pkgLabel.trim();
    if (!cleanLabel) {
      showToast('Please enter a package title.');
      return;
    }

    const usdtVal = Math.max(1, Number(pkgUsdt) || 1);
    const tokensVal = Math.max(1, Number(pkgTokens) || 1);

    setIsSavingPackageModal(true);
    try {
      if (editingPackageId) {
        PortalStore.updatePackage(editingPackageId, {
          label: cleanLabel,
          usdt: usdtVal,
          tokens: tokensVal,
          bonus: pkgBonus.trim() || undefined,
          popular: pkgPopular,
          description: pkgDescription.trim() || undefined,
          enabled: pkgEnabled
        });
      } else {
        PortalStore.addPackage({
          label: cleanLabel,
          usdt: usdtVal,
          tokens: tokensVal,
          bonus: pkgBonus.trim() || undefined,
          popular: pkgPopular,
          description: pkgDescription.trim() || undefined,
          enabled: pkgEnabled
        });
      }

      const syncResult = await PortalStore.syncPackagesToSupabase();
      setPackages(PortalStore.getPackages());
      setIsPackageModalOpen(false);
      if (syncResult.success) {
        showToast(`✅ Saved "${cleanLabel}" & written to Supabase DB for all customers!`);
      } else {
        showToast(`⚠️ Saved "${cleanLabel}" locally. ${syncResult.message}`);
      }
    } catch (err) {
      console.warn('Save package sync warning:', err);
      setPackages(PortalStore.getPackages());
      setIsPackageModalOpen(false);
      showToast(`⚠️ Error saving package: ${err}`);
    } finally {
      setIsSavingPackageModal(false);
    }
  };

  const handleDeletePackage = async (pkgId: string, label: string) => {
    if (packages.length <= 1) {
      alert('You must have at least one active package.');
      return;
    }
    if (confirm(`Are you sure you want to delete the package "${label}"?`)) {
      PortalStore.deletePackage(pkgId);
      setPackages(PortalStore.getPackages());
      const res = await PortalStore.syncPackagesToSupabase();
      showToast(`Deleted "${label}". ${res.success ? 'Removed from DB.' : res.message}`);
    }
  };

  const handleTogglePackageEnabled = async (pkg: TokenPackage) => {
    const nextState = pkg.enabled === false ? true : false;
    PortalStore.updatePackage(pkg.id, { enabled: nextState });
    setPackages(PortalStore.getPackages());
    const res = await PortalStore.syncPackagesToSupabase();
    showToast(`${nextState ? 'Enabled' : 'Disabled'} "${pkg.label}". ${res.success ? 'Synced to DB.' : res.message}`);
  };

  const handleTogglePopular = async (pkg: TokenPackage) => {
    const nextPopular = !pkg.popular;
    PortalStore.updatePackage(pkg.id, { popular: nextPopular });
    setPackages(PortalStore.getPackages());
    const res = await PortalStore.syncPackagesToSupabase();
    showToast(`${nextPopular ? 'Marked as POPULAR' : 'Removed popular badge'}. ${res.success ? 'Synced to DB.' : res.message}`);
  };

  const handleResetPackages = async () => {
    if (confirm('Reset all barcode packages to official system defaults?')) {
      const reset = PortalStore.resetDefaultPackages();
      setPackages(reset);
      const res = await PortalStore.syncPackagesToSupabase();
      showToast(`Reset packages to default. ${res.success ? 'Synced to DB.' : res.message}`);
    }
  };

  const handleRunRetentionCleanup = () => {
    const res = PortalStore.cleanupInactiveUsers(30);
    setUsers(PortalStore.getAllUsers());
    if (res.deletedCount > 0) {
      showToast(`30-Day Retention Cleanup: Removed ${res.deletedCount} inactive non-depositing user accounts.`);
    } else {
      showToast('All accounts are active or within the 30-day deposit retention window.');
    }
  };

  // Metrics
  const totalUsdt = orders
    .filter(o => o.status === 'approved')
    .reduce((sum, o) => sum + (o.verified_amount || o.amount_usdt), 0);
  const totalApprovedOrders = orders.filter(o => o.status === 'approved').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending_payment' || o.status === 'verifying').length;

  const handleSaveGatewaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    try {
      const updated = PortalStore.saveSettings({
        depositAddress: gatewayTronAddress.trim(),
        btcDepositAddress: gatewayBtcAddress.trim(),
        ltcDepositAddress: gatewayLtcAddress.trim(),
        autoApproval: gatewayAutoApproval
      });
      showToast('✅ Crypto Gateway Wallets & Auto-Approval Settings Saved!');
    } catch (err: any) {
      showToast('Failed to save gateway settings: ' + (err?.message || 'Error'));
    } finally {
      setIsSavingGateway(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.tx_hash && o.tx_hash.toLowerCase().includes(orderSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || (o.payment_method || 'usdt_trc20') === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getAdminExplorerUrl = (hash: string, method?: PaymentMethod) => {
    if (method === 'btc') return `https://mempool.space/tx/${hash}`;
    if (method === 'ltc') return `https://litecoinspace.org/tx/${hash}`;
    return `https://tronscan.org/#/transaction/${hash}`;
  };

  const getAdminExplorerName = (method?: PaymentMethod) => {
    if (method === 'btc') return 'Mempool';
    if (method === 'ltc') return 'Litecoinspace';
    return 'Tronscan';
  };

  // Account & Billing Helpers
  const totalCirculatingBarcodes = users.reduce((sum, u) => sum + (u.token_balance || 0), 0);
  const activePackagesCount = packages.filter(p => p.enabled !== false).length;

  const filteredBillingOrders = orders.filter(order => {
    const method = order.payment_method || 'usdt_trc20';
    const matchesMethod = billingDepositMethod === 'all' || method === billingDepositMethod;
    const matchesStatus = billingDepositStatus === 'all' || order.status === billingDepositStatus;
    const q = billingDepositSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      order.id.toLowerCase().includes(q) ||
      order.user_email.toLowerCase().includes(q) ||
      (order.tx_hash && order.tx_hash.toLowerCase().includes(q)) ||
      (order.to_address && order.to_address.toLowerCase().includes(q));
    return matchesMethod && matchesStatus && matchesSearch;
  });

  const filteredBillingUsers = users.filter(u => {
    const q = billingUserSearch.toLowerCase().trim();
    return !q || 
      u.id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
  });

  const handleApplyManualOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideUserId) {
      showToast('⚠️ Please select a user account to override.');
      return;
    }

    const targetUser = users.find(u => u.id === overrideUserId);
    if (!targetUser) {
      showToast('⚠️ Target user account not found.');
      return;
    }

    const inputVal = Math.max(0, Number(overrideAmount) || 0);
    let finalBalance = targetUser.token_balance;

    if (overrideMode === 'set') {
      finalBalance = inputVal;
    } else if (overrideMode === 'add') {
      finalBalance = targetUser.token_balance + inputVal;
    } else if (overrideMode === 'subtract') {
      finalBalance = Math.max(0, targetUser.token_balance - inputVal);
    }

    setIsApplyingOverride(true);
    try {
      const updated = PortalStore.updateUserTokens(targetUser.id, finalBalance, false);
      if (updated) {
        setUsers(PortalStore.getAllUsers());
        showToast(`✅ Overrode ${targetUser.email || targetUser.id} balance to ${finalBalance} barcodes (${overrideReason.trim() || 'Manual Override'})`);
      }
    } catch (err) {
      console.error('Manual override failed:', err);
      showToast('❌ Failed to update user balance.');
    } finally {
      setIsApplyingOverride(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04140D] text-[#D5EFE3] flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FF5C00] text-white font-mono font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-in">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="bg-[#082216] border-b border-[#1A4B36] sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPortal}
              className="p-2 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] rounded-xl text-white transition cursor-pointer flex items-center gap-1 text-xs font-bold font-sans"
              title="Return to Client Portal"
            >
              <ArrowLeft className="h-4 w-4 text-[#FF5C00]" />
              <span>Client Portal</span>
            </button>

            <div className="h-6 w-px bg-[#1A4B36]" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF5C00] flex items-center justify-center text-white shadow-[0_0_12px_rgba(255,92,0,0.4)]">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <span>Administrator Center</span>
                  <span className="text-[10px] bg-[#FF5C00]/20 text-[#FF5C00] px-2 py-0.5 rounded font-mono font-bold border border-[#FF5C00]/30">
                    MASTER
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-[#FF5C00] text-white shadow-md'
                  : 'bg-[#041A10] text-[#D5EFE3] hover:bg-[#103825] border border-[#1A4B36]'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Crypto Orders ({orders.length})</span>
              {pendingOrdersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-[#FF5C00] text-white shadow-md'
                  : 'bg-[#041A10] text-[#D5EFE3] hover:bg-[#103825] border border-[#1A4B36]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Users & Barcodes ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('packages')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'packages'
                  ? 'bg-[#FF5C00] text-white shadow-md'
                  : 'bg-[#041A10] text-[#D5EFE3] hover:bg-[#103825] border border-[#1A4B36]'
              }`}
            >
              <PackagePlus className="h-3.5 w-3.5" />
              <span>Barcode Packages ({packages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gateway')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'gateway'
                  ? 'bg-[#FF5C00] text-white shadow-md'
                  : 'bg-[#041A10] text-[#D5EFE3] hover:bg-[#103825] border border-[#1A4B36]'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Gateways (BTC/LTC/TRC20)</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'billing'
                  ? 'bg-[#FF5C00] text-white shadow-md'
                  : 'bg-[#041A10] text-[#D5EFE3] hover:bg-[#103825] border border-[#1A4B36]'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Account & Billing</span>
            </button>

            {/* Cloud Sync Status Indicator & Trigger */}
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setIsDbModalOpen(true)}
                className="px-2.5 py-1.5 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] hover:border-emerald-500/50 rounded-xl flex items-center gap-1.5 text-[11px] font-mono text-[#D5EFE3] transition cursor-pointer"
                title="Click to view or configure Supabase database connection & SQL migrations"
              >
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[#D5EFE3]/80">{isSupabaseConfigured() ? 'Cloud DB' : 'Local'}</span>
                <span className="text-[10px] text-emerald-400/70 ml-0.5">⚙️</span>
              </button>

              <button
                onClick={refreshData}
                disabled={isSyncing}
                className="p-2 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] rounded-xl text-[#D5EFE3] hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-mono disabled:opacity-50"
                title="Refresh and sync data"
              >
                <RefreshCw className={`h-4 w-4 text-[#FF5C00] ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Total Revenue</span>
              <div className="text-xl font-black text-white font-mono mt-0.5">{totalUsdt.toFixed(2)} USDT</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Approved Orders</span>
              <div className="text-xl font-black text-[#FF5C00] font-mono mt-0.5">{totalApprovedOrders} / {orders.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Registered Users</span>
              <div className="text-xl font-black text-white font-mono mt-0.5">{users.length} Users</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="bg-[#082216] hover:bg-[#0c2e1f] border border-[#1A4B36] hover:border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between shadow-sm transition text-left cursor-pointer group"
            title="Click to configure Supabase URL, Anon Key, and SQL migrations"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Database Status</span>
                <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition">⚙️ Configure</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isSupabaseConfigured() ? 'Supabase Cloud (Active)' : 'Local Storage Only'}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <Database className="h-5 w-5" />
            </div>
          </button>
        </div>

        {/* TAB 1: TRC-20 ORDERS & DEPOSITS */}
        {activeTab === 'orders' && (
          <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID, Email, TxHash..."
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl pl-9 pr-3 py-2 text-xs outline-none font-sans"
                />
                <Search className="h-4 w-4 text-[#D5EFE3]/40 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <select
                  value={methodFilter}
                  onChange={e => setMethodFilter(e.target.value)}
                  className="bg-[#041A10] border border-[#1A4B36] text-[#D5EFE3] text-xs font-bold font-mono rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="all">All Methods</option>
                  <option value="usdt_trc20">USDT (TRC-20)</option>
                  <option value="btc">Bitcoin (BTC)</option>
                  <option value="ltc">Litecoin (LTC)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#041A10] border border-[#1A4B36] text-[#D5EFE3] text-xs font-bold font-mono rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="verifying">Verifying</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-xl border border-[#1A4B36]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#041A10] text-[#D5EFE3]/70 font-mono uppercase tracking-wider text-[10px] border-b border-[#1A4B36]">
                  <tr>
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Crypto Amount</th>
                    <th className="py-3 px-4">Barcodes</th>
                    <th className="py-3 px-4">TxID (Explorer)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A4B36]/60 bg-[#082216]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#D5EFE3]/50 font-mono">
                        No orders matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const method = order.payment_method || 'usdt_trc20';
                      return (
                        <tr key={order.id} className="hover:bg-[#0C2A1E]/50 transition">
                          <td className="py-3 px-4 font-mono">
                            <div className="font-bold text-white">{order.id}</div>
                            <div className="text-[10px] text-[#D5EFE3]/50">
                              {new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-medium text-white">
                            {order.user_email}
                          </td>

                          <td className="py-3 px-4">
                            {method === 'btc' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                BTC
                              </span>
                            ) : method === 'ltc' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                LTC
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                USDT (TRC20)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono">
                            <div className="font-bold text-emerald-400">
                              {order.crypto_amount 
                                ? `${order.crypto_amount} ${order.crypto_currency || (method === 'btc' ? 'BTC' : method === 'ltc' ? 'LTC' : 'USDT')}`
                                : `${order.amount_usdt}.00 USDT`}
                            </div>
                            {method !== 'usdt_trc20' && (
                              <div className="text-[10px] text-[#D5EFE3]/50">(${order.amount_usdt} USD)</div>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-[#FF5C00]">
                            +{order.tokens_to_credit}
                          </td>

                          <td className="py-3 px-4 font-mono">
                            {order.tx_hash ? (
                              <div className="flex flex-col gap-0.5">
                                <a
                                  href={getAdminExplorerUrl(order.tx_hash, order.payment_method)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF5C00] hover:underline flex items-center gap-1 font-bold"
                                  title={`${getAdminExplorerName(order.payment_method)}: ${order.tx_hash}`}
                                >
                                  <span>{order.tx_hash.substring(0, 8)}...{order.tx_hash.substring(order.tx_hash.length - 6)}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                                <span className="text-[9px] text-[#D5EFE3]/40">
                                  {getAdminExplorerName(order.payment_method)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#D5EFE3]/40 italic">Awaiting TxID</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                                  order.status === 'approved'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : order.status === 'verifying'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : order.status === 'rejected'
                                    ? 'bg-red-950 text-red-300 border border-red-500/40'
                                    : 'bg-[#041A10] text-[#D5EFE3]/70 border border-[#1A4B36]'
                                }`}
                              >
                                {order.status === 'approved' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                                {order.status === 'verifying' && <Clock className="h-3 w-3 text-amber-400 animate-spin" />}
                                {order.status === 'rejected' && <XCircle className="h-3 w-3 text-red-400" />}
                                <span className="uppercase">{order.status.replace('_', ' ')}</span>
                              </span>
                              {order.verification_note && order.verification_note.toLowerCase().includes('auto') && (
                                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5">
                                  <Zap className="h-2.5 w-2.5" /> Auto-Approved
                                </span>
                              )}
                            </div>
                          </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.status !== 'approved' && (
                              <button
                                onClick={() => handleForceApprove(order.id)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold font-sans transition cursor-pointer"
                                title="Force Approve & Credit Barcodes"
                              >
                                Force Approve
                              </button>
                            )}

                            {order.status !== 'rejected' && (
                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                className="px-2.5 py-1 bg-red-950 hover:bg-red-800 text-red-200 border border-red-500/40 rounded-lg text-[11px] font-bold font-sans transition cursor-pointer"
                                title="Reject Order"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: USERS & TOKEN BALANCES */}
        {activeTab === 'users' && (
          <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#FF5C00]" />
                  <span>User & Unique ID Management</span>
                </h3>
                <p className="text-xs text-[#D5EFE3]/70 font-sans">
                  View unique client IDs, barcode credits, and automated 30-day retention policies
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunRetentionCleanup}
                  className="px-3 py-1.5 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Manually purge accounts older than 30 days without deposits"
                >
                  <Clock className="h-3.5 w-3.5 text-[#FF5C00]" />
                  <span>Run 30-Day Cleanup</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#1A4B36]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#041A10] text-[#D5EFE3]/70 font-mono uppercase tracking-wider text-[10px] border-b border-[#1A4B36]">
                  <tr>
                    <th className="py-3 px-4">Unique Client ID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Barcode Balance</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">30-Day Retention</th>
                    <th className="py-3 px-4 text-right">Credit Barcodes / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A4B36]/60 bg-[#082216]">
                  {users.map(u => {
                    const isAdm = u.role === 'admin' || u.id === 'user-admin-1';
                    const userOrders = orders.filter(o => o.user_id === u.id || o.user_email === u.email);
                    const hasApprovedDeposit = userOrders.some(o => o.status === 'approved');
                    const hasTokens = (u.token_balance || 0) > 0;
                    const isProtected = isAdm || hasApprovedDeposit || hasTokens;

                    const createdMs = new Date(u.created_at || 0).getTime();
                    const ageDays = Math.floor((Date.now() - createdMs) / (24 * 60 * 60 * 1000));
                    const daysRemaining = Math.max(0, 30 - ageDays);

                    return (
                      <tr key={u.id} className="hover:bg-[#0C2A1E]/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white font-mono">{u.id}</div>
                          {u.email !== u.id && (
                            <div className="text-[10px] text-[#D5EFE3]/50 font-sans">{u.email}</div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/40'
                                : 'bg-[#041A10] text-[#D5EFE3] border border-[#1A4B36]'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <div className="text-base font-black text-[#FF5C00]">
                            {u.token_balance} <span className="text-xs font-normal text-[#D5EFE3]/70">Barcodes</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[#D5EFE3]/60 font-mono text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px]">
                          {isAdm ? (
                            <span className="text-emerald-400 font-bold">Admin (Permanent)</span>
                          ) : isProtected ? (
                            <span className="text-emerald-300 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              Active (Deposited)
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              daysRemaining <= 5 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {daysRemaining}d grace left
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAddTokens(u.id, 5)}
                              className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-white rounded-lg text-[11px] font-mono font-bold transition cursor-pointer"
                              title="Add +5 barcodes"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleAddTokens(u.id, 25)}
                              className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-white rounded-lg text-[11px] font-mono font-bold transition cursor-pointer"
                              title="Add +25 barcodes"
                            >
                              +25
                            </button>
                            <button
                              onClick={() => handleSetTokens(u.id, u.token_balance)}
                              className="p-1.5 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#FF5C00] rounded-lg text-[11px] transition cursor-pointer"
                              title="Set custom barcode balance"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 bg-red-950/60 hover:bg-red-800 text-red-300 border border-red-500/30 rounded-lg text-[11px] transition cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOKEN PACKAGES & RATE MANAGEMENT */}
        {activeTab === 'packages' && (
          <AdminPackagePricingManager
            packages={packages}
            setPackages={setPackages}
            showToast={showToast}
            onOpenEditModal={handleOpenEditPackage}
            onOpenCreateModal={handleOpenCreatePackage}
          />
        )}

        {/* TAB 4: CRYPTO DEPOSIT GATEWAYS & WALLET CONFIGURATION */}
        {activeTab === 'gateway' && (
          <form onSubmit={handleSaveGatewaySettings} className="flex flex-col gap-6">
            <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#FF5C00]" />
                  <span>Crypto Deposit Gateways & Automated Approval</span>
                </h3>
                <p className="text-xs text-[#D5EFE3]/70 font-sans mt-1">
                  Configure receiving wallet addresses for USDT (TRC-20), Bitcoin (BTC), and Litecoin (LTC). Transactions are automatically verified on-chain and approved.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingGateway}
                className="px-5 py-2.5 bg-[#FF5C00] hover:bg-[#FF731E] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 shadow-[0_4px_14px_rgba(255,92,0,0.35)] cursor-pointer shrink-0"
              >
                {isSavingGateway ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Gateway Settings</span>
                  </>
                )}
              </button>
            </div>

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* 1. TRON USDT GATEWAY */}
              <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                        TRC
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">TRON USDT (TRC-20)</h4>
                        <span className="text-[10px] text-emerald-400 font-mono">Tether TRON Network</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live
                    </span>
                  </div>

                  <label className="block text-xs font-mono font-bold text-[#D5EFE3]/70 mb-1.5">
                    Deposit Receiving Address:
                  </label>
                  <input
                    type="text"
                    value={gatewayTronAddress}
                    onChange={e => setGatewayTronAddress(e.target.value)}
                    placeholder="e.g. TYDzsYUE29eAQfMnA7WPZcaK5f46zMPwnT"
                    className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3 py-2.5 text-xs font-mono outline-none"
                    required
                  />

                  <div className="mt-3 text-[11px] text-[#D5EFE3]/60 space-y-1">
                    <div className="flex justify-between">
                      <span>Explorer:</span>
                      <span className="text-white font-mono">Tronscan API</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification Method:</span>
                      <span className="text-emerald-400 font-mono font-bold">Automated On-Chain</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1A4B36] flex items-center justify-between">
                  <a
                    href={`https://tronscan.org/#/address/${gatewayTronAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#FF5C00] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View on Tronscan</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* 2. BITCOIN (BTC) GATEWAY */}
              <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                        BTC
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">Bitcoin (BTC)</h4>
                        <span className="text-[10px] text-amber-400 font-mono">Native Bitcoin Network</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Live
                    </span>
                  </div>

                  <label className="block text-xs font-mono font-bold text-[#D5EFE3]/70 mb-1.5">
                    Deposit Receiving Address:
                  </label>
                  <input
                    type="text"
                    value={gatewayBtcAddress}
                    onChange={e => setGatewayBtcAddress(e.target.value)}
                    placeholder="e.g. bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el"
                    className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3 py-2.5 text-xs font-mono outline-none"
                    required
                  />

                  <div className="mt-3 text-[11px] text-[#D5EFE3]/60 space-y-1">
                    <div className="flex justify-between">
                      <span>Explorers:</span>
                      <span className="text-white font-mono">Mempool & Blockstream</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification Method:</span>
                      <span className="text-amber-400 font-mono font-bold">Automated On-Chain</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1A4B36] flex items-center justify-between">
                  <a
                    href={`https://mempool.space/address/${gatewayBtcAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#FF5C00] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View on Mempool.space</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* 3. LITECOIN (LTC) GATEWAY */}
              <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                        LTC
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">Litecoin (LTC)</h4>
                        <span className="text-[10px] text-blue-400 font-mono">Litecoin Network</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Live
                    </span>
                  </div>

                  <label className="block text-xs font-mono font-bold text-[#D5EFE3]/70 mb-1.5">
                    Deposit Receiving Address:
                  </label>
                  <input
                    type="text"
                    value={gatewayLtcAddress}
                    onChange={e => setGatewayLtcAddress(e.target.value)}
                    placeholder="e.g. ltc1qrgp00e57s2y3q43f5h3r8gq3g25k7e68d9w4h5"
                    className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3 py-2.5 text-xs font-mono outline-none"
                    required
                  />

                  <div className="mt-3 text-[11px] text-[#D5EFE3]/60 space-y-1">
                    <div className="flex justify-between">
                      <span>Explorers:</span>
                      <span className="text-white font-mono">Litecoinspace & Blockcypher</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification Method:</span>
                      <span className="text-blue-400 font-mono font-bold">Automated On-Chain</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1A4B36] flex items-center justify-between">
                  <a
                    href={`https://litecoinspace.org/address/${gatewayLtcAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#FF5C00] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View on Litecoinspace</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

            </div>

            {/* Automated Approval Engine Settings */}
            <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-sans">
                      Automated Approval & Real-Time Barcode Crediting
                    </h4>
                    <p className="text-xs text-[#D5EFE3]/70 font-sans">
                      Instant barcode crediting upon public on-chain verification of user transaction hash
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGatewayAutoApproval(!gatewayAutoApproval)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                    gatewayAutoApproval
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {gatewayAutoApproval ? (
                    <>
                      <ToggleRight className="h-5 w-5 text-emerald-400" />
                      <span>AUTO-APPROVAL ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-5 w-5 text-zinc-500" />
                      <span>MANUAL APPROVAL ONLY</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-4 text-xs text-[#D5EFE3]/80 space-y-2">
                <p>
                  <strong>How It Works:</strong> When clients choose USDT (TRC-20), Bitcoin (BTC), or Litecoin (LTC) and submit their transaction hash:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-[#D5EFE3]/70 font-mono">
                  <li>The system queries decentralized blockchain indexers in real-time.</li>
                  <li>It checks that the transaction recipient matches your configured receiving wallet address.</li>
                  <li>It checks that the received amount corresponds to the package pricing.</li>
                  <li>Upon positive on-chain confirmation, the order is immediately granted <strong>Automatic Approval</strong> and the client's barcode balance is credited in real time.</li>
                </ul>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingGateway}
                className="px-6 py-3 bg-[#FF5C00] hover:bg-[#FF731E] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 shadow-[0_4px_16px_rgba(255,92,0,0.4)] cursor-pointer"
              >
                {isSavingGateway ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Gateways...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save & Deploy Gateway Wallets</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 5: ACCOUNT & BILLING MANAGEMENT */}
        {activeTab === 'billing' && (
          <div className="flex flex-col gap-8">
            
            {/* Top Overview & Metric Banner */}
            <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#FF5C00]" />
                    <span>Account & Billing Management</span>
                  </h2>
                  <p className="text-xs text-[#D5EFE3]/70 font-sans mt-1">
                    Centralized hub for manual client balance overrides, incoming crypto deposit tracking, and real-time active package configuration.
                  </p>
                </div>

                {/* Sub-Section Jump Selector */}
                <div className="flex items-center gap-1.5 bg-[#041A10] p-1.5 rounded-xl border border-[#1A4B36] text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setBillingSection('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      billingSection === 'all'
                        ? 'bg-[#FF5C00] text-white'
                        : 'text-[#D5EFE3]/70 hover:text-white'
                    }`}
                  >
                    All Sections
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingSection('override')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      billingSection === 'override'
                        ? 'bg-[#FF5C00] text-white'
                        : 'text-[#D5EFE3]/70 hover:text-white'
                    }`}
                  >
                    Balance Overrides
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingSection('history')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      billingSection === 'history'
                        ? 'bg-[#FF5C00] text-white'
                        : 'text-[#D5EFE3]/70 hover:text-white'
                    }`}
                  >
                    Deposit History
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingSection('packages')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      billingSection === 'packages'
                        ? 'bg-[#FF5C00] text-white'
                        : 'text-[#D5EFE3]/70 hover:text-white'
                    }`}
                  >
                    Active Packages
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase tracking-wider">Total Crypto Volume</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
                    ${totalUsdt.toLocaleString()}.00 <span className="text-xs text-[#D5EFE3]/60">USD</span>
                  </div>
                  <span className="text-[10px] text-[#D5EFE3]/40 mt-1 font-mono">{totalApprovedOrders} approved deposits</span>
                </div>

                <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase tracking-wider">Circulating Barcodes</span>
                  <div className="text-xl font-bold font-mono text-[#FF5C00] mt-2">
                    {totalCirculatingBarcodes.toLocaleString()} <span className="text-xs text-[#D5EFE3]/60">Units</span>
                  </div>
                  <span className="text-[10px] text-[#D5EFE3]/40 mt-1 font-mono">Held across {users.length} accounts</span>
                </div>

                <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase tracking-wider">Active Client Accounts</span>
                  <div className="text-xl font-bold font-mono text-white mt-2">
                    {users.length} <span className="text-xs text-[#D5EFE3]/60">Users</span>
                  </div>
                  <span className="text-[10px] text-[#D5EFE3]/40 mt-1 font-mono">Real-time sync enabled</span>
                </div>

                <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase tracking-wider">Active Packages</span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-2">
                    {activePackagesCount} <span className="text-xs text-[#D5EFE3]/60">Live Tiers</span>
                  </div>
                  <span className="text-[10px] text-[#D5EFE3]/40 mt-1 font-mono">{packages.length} total tiers configured</span>
                </div>
              </div>
            </div>

            {/* SECTION 1: MANUAL USER BALANCE OVERRIDE */}
            {(billingSection === 'all' || billingSection === 'override') && (
              <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A4B36] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center border border-[#FF5C00]/30">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">
                        Manual User Balance Override & Account Adjustment
                      </h3>
                      <p className="text-xs text-[#D5EFE3]/70 font-sans">
                        Force-set, credit, or debit any client's barcode balance with real-time propagation across active portal sessions.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-center">
                    Instant Live Push
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Override Form & Controls */}
                  <form onSubmit={handleApplyManualOverride} className="lg:col-span-5 bg-[#041A10] border border-[#1A4B36] rounded-xl p-5 flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF5C00] font-mono flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Balance Override Console</span>
                    </h4>

                    {/* Target User Selector */}
                    <div>
                      <label className="block text-xs font-bold text-[#D5EFE3]/80 font-mono mb-1.5">
                        Select Target Client Account *
                      </label>
                      <select
                        value={overrideUserId}
                        onChange={e => setOverrideUserId(e.target.value)}
                        className="w-full bg-[#082216] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3 py-2.5 text-xs font-mono outline-none cursor-pointer"
                        required
                      >
                        <option value="">-- Choose Client Account --</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.id} {u.email !== u.id ? `(${u.email})` : ''} — Current: {u.token_balance} Barcodes
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected User Quick Preview */}
                    {(() => {
                      const sel = users.find(u => u.id === overrideUserId);
                      if (!sel) return null;
                      const selAmt = Math.max(0, Number(overrideAmount) || 0);
                      const projected = overrideMode === 'set' 
                        ? selAmt 
                        : overrideMode === 'add' 
                        ? sel.token_balance + selAmt 
                        : Math.max(0, sel.token_balance - selAmt);

                      return (
                        <div className="bg-[#082216] border border-[#1A4B36] rounded-xl p-3 text-xs font-mono space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#D5EFE3]/60">Current Balance:</span>
                            <span className="font-bold text-white">{sel.token_balance} Barcodes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#D5EFE3]/60">Override Mode:</span>
                            <span className="text-[#FF5C00] font-bold uppercase">{overrideMode}</span>
                          </div>
                          <div className="flex justify-between border-t border-[#1A4B36] pt-1 mt-1">
                            <span className="text-emerald-400 font-bold">Projected New Balance:</span>
                            <span className="text-emerald-400 font-black text-sm">{projected} Barcodes</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Mode Selector */}
                    <div>
                      <label className="block text-xs font-bold text-[#D5EFE3]/80 font-mono mb-1.5">
                        Adjustment Action *
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setOverrideMode('set')}
                          className={`py-2 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                            overrideMode === 'set'
                              ? 'bg-[#FF5C00] text-white border-[#FF5C00]'
                              : 'bg-[#082216] text-[#D5EFE3]/70 border-[#1A4B36] hover:bg-[#103825]'
                          }`}
                        >
                          Set Exact
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverrideMode('add')}
                          className={`py-2 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                            overrideMode === 'add'
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-[#082216] text-[#D5EFE3]/70 border-[#1A4B36] hover:bg-[#103825]'
                          }`}
                        >
                          + Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverrideMode('subtract')}
                          className={`py-2 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                            overrideMode === 'subtract'
                              ? 'bg-red-700 text-white border-red-600'
                              : 'bg-[#082216] text-[#D5EFE3]/70 border-[#1A4B36] hover:bg-[#103825]'
                          }`}
                        >
                          - Deduct
                        </button>
                      </div>
                    </div>

                    {/* Barcode Amount & Presets */}
                    <div>
                      <label className="block text-xs font-bold text-[#D5EFE3]/80 font-mono mb-1.5">
                        Barcode Units *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={overrideAmount}
                        onChange={e => setOverrideAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-[#082216] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none"
                        required
                      />

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] font-mono">
                        <span className="text-[#D5EFE3]/50">Presets:</span>
                        {[10, 25, 50, 100, 250, 500].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setOverrideAmount(val)}
                            className="px-2 py-0.5 rounded bg-[#082216] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white transition cursor-pointer"
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reason / Audit Note */}
                    <div>
                      <label className="block text-xs font-bold text-[#D5EFE3]/80 font-mono mb-1.5">
                        Audit Note / Reason for Override
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="e.g. VIP deposit credit, customer support adjustment..."
                        className="w-full bg-[#082216] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-3 py-2 text-xs font-mono outline-none"
                      />
                    </div>

                    {/* Apply Button */}
                    <button
                      type="submit"
                      disabled={isApplyingOverride || !overrideUserId}
                      className="w-full py-3 bg-[#FF5C00] hover:bg-[#FF731E] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,92,0,0.35)] cursor-pointer mt-1"
                    >
                      {isApplyingOverride ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Applying Override...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Apply Balance Override</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Right Column: User Accounts Table & Direct Inline Actions */}
                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={billingUserSearch}
                          onChange={e => setBillingUserSearch(e.target.value)}
                          placeholder="Filter accounts by Unique ID, email, or role..."
                          className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-[#D5EFE3] text-xs rounded-xl pl-9 pr-4 py-2 font-mono outline-none"
                        />
                        <Search className="h-4 w-4 text-[#D5EFE3]/40 absolute left-3 top-2.5" />
                      </div>
                      <span className="text-[11px] font-mono text-[#D5EFE3]/60 shrink-0">
                        {filteredBillingUsers.length} accounts
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#1A4B36] max-h-[380px] overflow-y-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-[#041A10] text-[#D5EFE3]/70 font-mono uppercase tracking-wider text-[10px] border-b border-[#1A4B36] sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3">Unique Client ID</th>
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">Current Balance</th>
                            <th className="py-2.5 px-3 text-right">Quick Override</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1A4B36]/60 bg-[#082216]">
                          {filteredBillingUsers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-[#D5EFE3]/50 font-mono">
                                No accounts found matching search.
                              </td>
                            </tr>
                          ) : (
                            filteredBillingUsers.map(u => {
                              const isSelected = u.id === overrideUserId;
                              return (
                                <tr 
                                  key={u.id} 
                                  className={`hover:bg-[#0C2A1E]/50 transition cursor-pointer ${
                                    isSelected ? 'bg-[#FF5C00]/10 border-l-2 border-[#FF5C00]' : ''
                                  }`}
                                  onClick={() => setOverrideUserId(u.id)}
                                >
                                  <td className="py-2.5 px-3 font-mono">
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{u.id}</span>
                                      {isSelected && (
                                        <span className="px-1.5 py-0.2 bg-[#FF5C00] text-white text-[9px] rounded font-mono font-bold">
                                          SELECTED
                                        </span>
                                      )}
                                    </div>
                                    {u.email !== u.id && (
                                      <div className="text-[10px] text-[#D5EFE3]/50">{u.email}</div>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                        u.role === 'admin'
                                          ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/40'
                                          : 'bg-[#041A10] text-[#D5EFE3] border border-[#1A4B36]'
                                      }`}
                                    >
                                      {u.role}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 font-mono">
                                    <span className="text-sm font-black text-[#FF5C00]">
                                      {u.token_balance}
                                    </span>
                                    <span className="text-[10px] text-[#D5EFE3]/60 ml-1">barcodes</span>
                                  </td>

                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTokens(u.id, 5)}
                                        className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-white rounded text-[10px] font-mono font-bold transition cursor-pointer"
                                        title="Quick credit +5 barcodes"
                                      >
                                        +5
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTokens(u.id, 25)}
                                        className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-white rounded text-[10px] font-mono font-bold transition cursor-pointer"
                                        title="Quick credit +25 barcodes"
                                      >
                                        +25
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetTokens(u.id, u.token_balance)}
                                        className="p-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#FF5C00] rounded text-[10px] transition cursor-pointer"
                                        title="Set exact custom balance"
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SECTION 2: INCOMING CRYPTO DEPOSIT HISTORY */}
            {(billingSection === 'all' || billingSection === 'history') && (
              <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-6 shadow-xl flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A4B36] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">
                        Incoming Crypto Deposit History
                      </h3>
                      <p className="text-xs text-[#D5EFE3]/70 font-sans">
                        Full auditable ledger of all customer deposits across USDT (TRC-20), Bitcoin (BTC), and Litecoin (LTC) networks.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#D5EFE3]/60">
                      Showing {filteredBillingOrders.length} of {orders.length} deposits
                    </span>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:flex-1">
                    <input
                      type="text"
                      value={billingDepositSearch}
                      onChange={e => setBillingDepositSearch(e.target.value)}
                      placeholder="Search by Order ID, TxID, or User ID / Email..."
                      className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-[#D5EFE3] text-xs rounded-xl pl-9 pr-4 py-2 font-mono outline-none"
                    />
                    <Search className="h-4 w-4 text-[#D5EFE3]/40 absolute left-3 top-2.5" />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <select
                      value={billingDepositMethod}
                      onChange={e => setBillingDepositMethod(e.target.value)}
                      className="bg-[#041A10] border border-[#1A4B36] text-[#D5EFE3] text-xs font-bold font-mono rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      <option value="all">All Networks (USDT/BTC/LTC)</option>
                      <option value="usdt_trc20">USDT (TRC-20)</option>
                      <option value="btc">Bitcoin (BTC)</option>
                      <option value="ltc">Litecoin (LTC)</option>
                    </select>

                    <select
                      value={billingDepositStatus}
                      onChange={e => setBillingDepositStatus(e.target.value)}
                      className="bg-[#041A10] border border-[#1A4B36] text-[#D5EFE3] text-xs font-bold font-mono rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="approved">Approved</option>
                      <option value="verifying">Verifying On-Chain</option>
                      <option value="pending_payment">Pending Payment</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Deposit Ledger Table */}
                <div className="overflow-x-auto rounded-xl border border-[#1A4B36]">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#041A10] text-[#D5EFE3]/70 font-mono uppercase tracking-wider text-[10px] border-b border-[#1A4B36]">
                      <tr>
                        <th className="py-3 px-4">Order ID & Date</th>
                        <th className="py-3 px-4">User Account</th>
                        <th className="py-3 px-4">Network</th>
                        <th className="py-3 px-4">Crypto Amount</th>
                        <th className="py-3 px-4">Barcodes</th>
                        <th className="py-3 px-4">Transaction Hash (TxID)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A4B36]/60 bg-[#082216]">
                      {filteredBillingOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#D5EFE3]/50 font-mono">
                            No deposit transactions matching filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBillingOrders.map(order => {
                          const method = order.payment_method || 'usdt_trc20';
                          return (
                            <tr key={order.id} className="hover:bg-[#0C2A1E]/50 transition">
                              <td className="py-3 px-4 font-mono">
                                <div className="font-bold text-white">{order.id}</div>
                                <div className="text-[10px] text-[#D5EFE3]/50">
                                  {new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              </td>

                              <td className="py-3 px-4 font-medium text-white font-mono">
                                <div>{order.user_email}</div>
                                {order.user_id && order.user_id !== order.user_email && (
                                  <div className="text-[10px] text-[#D5EFE3]/40">{order.user_id}</div>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {method === 'btc' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    BTC
                                  </span>
                                ) : method === 'ltc' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    LTC
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    USDT (TRC20)
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 font-mono">
                                <div className="font-bold text-emerald-400">
                                  {order.crypto_amount 
                                    ? `${order.crypto_amount} ${order.crypto_currency || (method === 'btc' ? 'BTC' : method === 'ltc' ? 'LTC' : 'USDT')}`
                                    : `${order.amount_usdt}.00 USDT`}
                                </div>
                                {method !== 'usdt_trc20' && (
                                  <div className="text-[10px] text-[#D5EFE3]/50">(${order.amount_usdt} USD)</div>
                                )}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-[#FF5C00]">
                                +{order.tokens_to_credit}
                              </td>

                              <td className="py-3 px-4 font-mono">
                                {order.tx_hash ? (
                                  <div className="flex flex-col gap-0.5">
                                    <a
                                      href={getAdminExplorerUrl(order.tx_hash, order.payment_method)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#FF5C00] hover:underline flex items-center gap-1 font-bold"
                                      title={`${getAdminExplorerName(order.payment_method)}: ${order.tx_hash}`}
                                    >
                                      <span>{order.tx_hash.substring(0, 8)}...{order.tx_hash.substring(order.tx_hash.length - 6)}</span>
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                    <span className="text-[9px] text-[#D5EFE3]/40">
                                      {getAdminExplorerName(order.payment_method)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[#D5EFE3]/40 italic">Awaiting TxID</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex flex-col gap-1 items-start">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                                      order.status === 'approved'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                        : order.status === 'verifying'
                                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                        : order.status === 'rejected'
                                        ? 'bg-red-950 text-red-300 border border-red-500/40'
                                        : 'bg-[#041A10] text-[#D5EFE3]/70 border border-[#1A4B36]'
                                    }`}
                                  >
                                    {order.status === 'approved' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                                    {order.status === 'verifying' && <Clock className="h-3 w-3 text-amber-400 animate-spin" />}
                                    {order.status === 'rejected' && <XCircle className="h-3 w-3 text-red-400" />}
                                    <span className="uppercase">{order.status.replace('_', ' ')}</span>
                                  </span>
                                  {order.verification_note && order.verification_note.toLowerCase().includes('auto') && (
                                    <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5">
                                      <Zap className="h-2.5 w-2.5" /> Auto-Approved
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {order.status !== 'approved' && (
                                    <button
                                      onClick={() => handleForceApprove(order.id)}
                                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold font-sans transition cursor-pointer flex items-center gap-1"
                                      title="Manually force-approve and credit barcodes"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      <span>Approve</span>
                                    </button>
                                  )}
                                  {order.status !== 'rejected' && (
                                    <button
                                      onClick={() => handleRejectOrder(order.id)}
                                      className="p-1.5 bg-[#041A10] hover:bg-red-950/60 border border-[#1A4B36] hover:border-red-500/40 text-[#D5EFE3]/60 hover:text-red-300 rounded-lg text-xs transition cursor-pointer"
                                      title="Reject order"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 3: ACTIVE PACKAGE DETAILS & PRICING EDITOR */}
            {(billingSection === 'all' || billingSection === 'packages') && (
              <AdminPackagePricingManager
                packages={packages}
                setPackages={setPackages}
                showToast={showToast}
                onOpenEditModal={handleOpenEditPackage}
                onOpenCreateModal={handleOpenCreatePackage}
              />
            )}

          </div>
        )}

      </main>

      {/* PACKAGE ADD / EDIT MODAL */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#082216] border border-[#1A4B36] rounded-3xl w-full max-w-xl p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1A4B36] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center border border-[#FF5C00]/30">
                  <PackagePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    {editingPackageId ? 'Edit Token Package' : 'Create New Token Package'}
                  </h3>
                  <p className="text-xs text-[#D5EFE3]/70 font-sans">
                    Define token allocation and USDT deposit pricing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="text-[#D5EFE3]/60 hover:text-white p-1 rounded-lg hover:bg-[#103825] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePackage} className="flex flex-col gap-4">
              
              {/* Package Title / Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
                  Package Name / Title *
                </label>
                <input
                  type="text"
                  value={pkgLabel}
                  onChange={e => setPkgLabel(e.target.value)}
                  placeholder="e.g. Starter Pack, Pro Tier, VIP Gold"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-2.5 text-xs font-mono outline-none"
                  required
                />
              </div>

              {/* Pricing & Barcodes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
                    Price (USDT TRC-20) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={pkgUsdt}
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setPkgUsdt(val);
                      }}
                      className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-2.5 text-xs font-mono outline-none pl-8"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-mono text-[#D5EFE3]/60">$</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
                    Barcodes Credited *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pkgTokens}
                    onChange={e => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setPkgTokens(val);
                    }}
                    className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-2.5 text-xs font-mono outline-none"
                    required
                  />
                </div>
              </div>

              {/* Quick Multipliers & Presets */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-[#D5EFE3]/60 mr-1">Templates:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPkgLabel('Weekly Package');
                      setPkgUsdt(200);
                      setPkgTokens(200);
                      setPkgBonus('Weekly Pass (+20 Bonus)');
                      setPkgDescription('Best for weekly volume production');
                      setPkgPopular(true);
                    }}
                    className="px-2 py-1 bg-[#103825] hover:bg-[#1A4B36] border border-[#FF5C00]/40 text-white rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    📅 Weekly Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPkgLabel('Monthly Package');
                      setPkgUsdt(150);
                      setPkgTokens(260);
                      setPkgBonus('Monthly VIP (+110 Bonus)');
                      setPkgDescription('Maximum savings for high-volume monthly issuance');
                    }}
                    className="px-2 py-1 bg-[#103825] hover:bg-[#1A4B36] border border-[#FF5C00]/40 text-white rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    👑 Monthly Preset
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-[#D5EFE3]/60 mr-1">Quick Rates:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPkgTokens(pkgUsdt);
                      setPkgBonus('1 USDT = 1 Barcode');
                    }}
                    className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-lg text-[10px] font-mono transition cursor-pointer"
                  >
                    1:1 (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = Math.round(pkgUsdt * 1.2);
                      setPkgTokens(t);
                      setPkgBonus(`+${t - pkgUsdt} Bonus Barcodes`);
                    }}
                    className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-lg text-[10px] font-mono transition cursor-pointer"
                  >
                    +20% Bonus
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = Math.round(pkgUsdt * 1.5);
                      setPkgTokens(t);
                      setPkgBonus(`+${t - pkgUsdt} Bonus Barcodes`);
                    }}
                    className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-lg text-[10px] font-mono transition cursor-pointer"
                  >
                    +50% Bonus
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = pkgUsdt * 2;
                      setPkgTokens(t);
                      setPkgBonus('2x Barcode Multiplier');
                    }}
                    className="px-2 py-1 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-lg text-[10px] font-mono transition cursor-pointer"
                  >
                    2x Barcodes
                  </button>
                </div>
              </div>

              {/* Bonus / Subtitle Tag */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
                  Bonus Tag / Promo Badge (Optional)
                </label>
                <input
                  type="text"
                  value={pkgBonus}
                  onChange={e => setPkgBonus(e.target.value)}
                  placeholder="e.g. +5 Bonus Barcodes, Best Value, 20% Off"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-2.5 text-xs font-mono outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D5EFE3]/80 font-mono mb-1.5">
                  Short Description (Optional)
                </label>
                <input
                  type="text"
                  value={pkgDescription}
                  onChange={e => setPkgDescription(e.target.value)}
                  placeholder="e.g. Perfect for regular identity search & verification workflows"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-[#FF5C00] text-white rounded-xl px-4 py-2.5 text-xs font-sans outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="bg-[#041A10] border border-[#1A4B36] rounded-xl p-3.5 flex flex-col sm:flex-row gap-4 justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={pkgPopular}
                    onChange={e => setPkgPopular(e.target.checked)}
                    className="accent-[#FF5C00] w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 text-[#FF5C00] fill-current" />
                      Highlight as "POPULAR"
                    </span>
                    <span className="text-[10px] text-[#D5EFE3]/50">Show orange top ribbon in checkout</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={pkgEnabled}
                    onChange={e => setPkgEnabled(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold">Active in Checkout</span>
                    <span className="text-[10px] text-[#D5EFE3]/50">Make visible to purchasing clients</span>
                  </div>
                </label>
              </div>

              {/* Live Preview Box */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#D5EFE3]/60 font-mono mb-1.5">
                  Live Client Card Preview:
                </span>
                <div className="bg-[#041A10] border border-[#FF5C00] shadow-[0_0_12px_rgba(255,92,0,0.25)] rounded-xl p-3 max-w-xs relative">
                  {pkgPopular && (
                    <span className="absolute -top-2 right-2 bg-[#FF5C00] text-white text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                      POPULAR
                    </span>
                  )}
                  <div className="text-xs font-bold text-white">{pkgLabel || 'Package Title'}</div>
                  <div className="text-lg font-black text-[#FF5C00] mt-0.5 font-mono">
                    {pkgTokens || 0} <span className="text-xs font-normal text-[#D5EFE3]/70">Tokens</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#1A4B36]/40 flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{pkgUsdt || 0} USDT</span>
                    <span className="text-[10px] text-emerald-400 font-sans">{pkgBonus || 'Bonus'}</span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="border-t border-[#1A4B36] pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2.5 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] rounded-xl text-xs font-bold font-sans transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPackageModal}
                  className="px-5 py-2.5 bg-[#FF5C00] hover:bg-[#FF731E] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className={`h-4 w-4 ${isSavingPackageModal ? 'animate-spin' : ''}`} />
                  <span>
                    {isSavingPackageModal 
                      ? 'Saving & Syncing...' 
                      : (editingPackageId ? 'Save & Sync to Customer Portal' : 'Create & Sync to Customer Portal')}
                  </span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* SUPABASE DATABASE & REAL-TIME SYNC MODAL */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#082216] border border-[#1A4B36] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1A4B36] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                    <span>Supabase Database & Realtime Sync</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isSupabaseConfigured() 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isSupabaseConfigured() ? 'Cloud DB Active' : 'Local Storage Only'}
                    </span>
                  </h3>
                  <p className="text-xs text-[#D5EFE3]/70 font-sans">
                    Synchronize package tiers, deposit addresses, and customer balances across all clients
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDbModalOpen(false)}
                className="text-[#D5EFE3]/60 hover:text-white p-1 rounded-lg hover:bg-[#103825] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Why Supabase Sync Note */}
            <div className="bg-[#041A10] border border-[#1A4B36] rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF5C00]">
                <Sparkles className="h-4 w-4" />
                <span>How Customer Package Sync Works</span>
              </div>
              <p className="text-xs text-[#D5EFE3]/80 leading-relaxed font-sans">
                When Supabase is connected, any package you create, edit, or delete is automatically written to the <code className="text-emerald-400 font-mono bg-black/40 px-1 py-0.5 rounded">portal_packages</code> table and the <code className="text-emerald-400 font-mono bg-black/40 px-1 py-0.5 rounded">portal_settings</code> table. Real-time listeners broadcast new pricing to all active customer devices immediately without requiring a page refresh.
              </p>
            </div>

            {/* Credentials Form */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#D5EFE3]/70 uppercase mb-1">
                  Supabase Project URL (e.g. https://yourproject.supabase.co)
                </label>
                <input
                  type="text"
                  value={dbUrlInput}
                  onChange={e => setDbUrlInput(e.target.value)}
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#D5EFE3]/70 uppercase mb-1">
                  Supabase Anon / Public Key (anonKey)
                </label>
                <input
                  type="password"
                  value={dbKeyInput}
                  onChange={e => setDbKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-[#041A10] border border-[#1A4B36] focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-xs font-mono outline-none"
                />
              </div>
            </div>

            {/* Test Status Banner */}
            {dbTestResult.message && (
              <div className={`p-3.5 rounded-xl border text-xs font-sans flex items-start gap-2.5 ${
                dbTestResult.status === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : dbTestResult.status === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-zinc-800/40 border-zinc-700 text-zinc-300'
              }`}>
                {dbTestResult.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-bold">{dbTestResult.status === 'success' ? 'Connected Successfully' : 'Sync Issue Detected'}</div>
                  <div className="mt-0.5 leading-relaxed">{dbTestResult.message}</div>
                </div>
              </div>
            )}

            {/* SQL Migration Script Copy Section */}
            <div className="bg-[#041A10] border border-[#1A4B36] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                    <span>Database Migration Script (With RLS Disabled)</span>
                  </h4>
                  <p className="text-[11px] text-[#D5EFE3]/60 font-sans mt-0.5">
                    If Supabase blocks package writes, run this script in your Supabase SQL Editor to grant table permissions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMigrationSql}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="bg-black/60 border border-[#1A4B36]/50 rounded-xl p-3 max-h-32 overflow-y-auto font-mono text-[11px] text-[#D5EFE3]/70 select-all">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-[#1A4B36] pt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveAndSyncAllPackages}
                disabled={isSyncingPackages}
                className="px-3.5 py-2 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#FF5C00] ${isSyncingPackages ? 'animate-spin' : ''}`} />
                <span>{isSyncingPackages ? 'Syncing...' : 'Force Sync All Packages to DB'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(false)}
                  className="px-4 py-2 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] rounded-xl text-xs font-bold font-sans transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveDbConfig}
                  disabled={isTestingDb}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className={`h-4 w-4 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Connecting & Verifying...' : 'Save & Verify Database'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
