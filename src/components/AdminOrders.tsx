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
  AlertCircle
} from 'lucide-react';
import { PortalStore } from '../utils/portalStore';
import { isSupabaseConfigured } from '../utils/supabase';
import { User, Order, OrderStatus, TokenPackage } from '../types';

interface AdminOrdersProps {
  onBackToPortal: () => void;
  currentUser: User;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ onBackToPortal, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>(PortalStore.getAllOrders());
  const [users, setUsers] = useState<User[]>(PortalStore.getAllUsers());
  const [packages, setPackages] = useState<TokenPackage[]>(PortalStore.getPackages());
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'packages'>('orders');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter state
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Package modal & form state
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgLabel, setPkgLabel] = useState('');
  const [pkgUsdt, setPkgUsdt] = useState<number>(25);
  const [pkgTokens, setPkgTokens] = useState<number>(30);
  const [pkgBonus, setPkgBonus] = useState('');
  const [pkgPopular, setPkgPopular] = useState(false);
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgEnabled, setPkgEnabled] = useState(true);

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
    setIsSyncing(false);
    showToast(isSupabaseConfigured() ? 'Cloud database refreshed!' : 'Local data refreshed');
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

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = pkgLabel.trim();
    if (!cleanLabel) {
      showToast('Please enter a package title.');
      return;
    }

    const usdtVal = Math.max(1, Number(pkgUsdt) || 1);
    const tokensVal = Math.max(1, Number(pkgTokens) || 1);

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
      showToast(`Updated package "${cleanLabel}"`);
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
      showToast(`Created new package "${cleanLabel}"`);
    }

    setPackages(PortalStore.getPackages());
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (pkgId: string, label: string) => {
    if (packages.length <= 1) {
      alert('You must have at least one active package.');
      return;
    }
    if (confirm(`Are you sure you want to delete the package "${label}"?`)) {
      PortalStore.deletePackage(pkgId);
      setPackages(PortalStore.getPackages());
      showToast(`Deleted package "${label}"`);
    }
  };

  const handleTogglePackageEnabled = (pkg: TokenPackage) => {
    const nextState = pkg.enabled === false ? true : false;
    PortalStore.updatePackage(pkg.id, { enabled: nextState });
    setPackages(PortalStore.getPackages());
    showToast(`${nextState ? 'Enabled' : 'Disabled'} package "${pkg.label}"`);
  };

  const handleTogglePopular = (pkg: TokenPackage) => {
    const nextPopular = !pkg.popular;
    PortalStore.updatePackage(pkg.id, { popular: nextPopular });
    setPackages(PortalStore.getPackages());
    showToast(nextPopular ? `Marked "${pkg.label}" as POPULAR` : `Removed popular badge from "${pkg.label}"`);
  };

  const handleResetPackages = () => {
    if (confirm('Reset all barcode packages to official system defaults?')) {
      const reset = PortalStore.resetDefaultPackages();
      setPackages(reset);
      showToast('Reset to default barcode packages.');
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

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.tx_hash && o.tx_hash.toLowerCase().includes(orderSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              <span>TRC-20 Orders ({orders.length})</span>
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

            {/* Cloud Sync Status Indicator & Trigger */}
            <div className="flex items-center gap-2">
              <div 
                className="px-2.5 py-1.5 bg-[#041A10] border border-[#1A4B36] rounded-xl flex items-center gap-1.5 text-[11px] font-mono text-[#D5EFE3]"
                title={isSupabaseConfigured() ? 'Supabase environment variables detected & active' : 'Running on local browser storage'}
              >
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="text-[#D5EFE3]/80">{isSupabaseConfigured() ? 'Cloud DB' : 'Local'}</span>
              </div>

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

          <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Database Status</span>
              <div className="text-xs font-bold text-white font-mono mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{isSupabaseConfigured() ? 'Supabase Cloud' : 'Local Storage'}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
          </div>
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

              <div className="flex items-center gap-2 w-full sm:w-auto">
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
                    <th className="py-3 px-4">USDT Amount</th>
                    <th className="py-3 px-4">Barcodes</th>
                    <th className="py-3 px-4">TxID (Tronscan)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A4B36]/60 bg-[#082216]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#D5EFE3]/50 font-mono">
                        No orders matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
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

                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {order.amount_usdt}.00 USDT
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-[#FF5C00]">
                          +{order.tokens_to_credit}
                        </td>

                        <td className="py-3 px-4 font-mono">
                          {order.tx_hash ? (
                            <a
                              href={`https://tronscan.org/#/transaction/${order.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF5C00] hover:underline flex items-center gap-1 font-bold"
                              title={order.tx_hash}
                            >
                              <span>{order.tx_hash.substring(0, 10)}...{order.tx_hash.substring(order.tx_hash.length - 6)}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[#D5EFE3]/40 italic">Awaiting TxID</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
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
                    ))
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

        {/* TAB 3: TOKEN PACKAGES MANAGEMENT */}
        {activeTab === 'packages' && (
          <div className="flex flex-col gap-6">
            
            {/* Header and Quick Actions */}
            <div className="bg-[#082216] border border-[#1A4B36] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-[#FF5C00]" />
                  <span>Barcode Packages & Pricing Gateway</span>
                </h3>
                <p className="text-xs text-[#D5EFE3]/70 font-sans mt-0.5">
                  Configure barcode bundles, USDT rates, bonus tiers, and featured packages available for clients during checkout.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetPackages}
                  className="px-3 py-2 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-[#D5EFE3] hover:text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Reset to default packages"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  onClick={handleOpenCreatePackage}
                  className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF731E] text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add New Package</span>
                </button>
              </div>
            </div>

            {/* Packages Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
                <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Total Bundles</span>
                <span className="text-xl font-black text-white font-mono mt-1">{packages.length}</span>
              </div>
              <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
                <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Live in Checkout</span>
                <span className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {packages.filter(p => p.enabled !== false).length}
                </span>
              </div>
              <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
                <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Featured Package</span>
                <span className="text-xs font-bold text-[#FF5C00] truncate mt-1.5">
                  {packages.find(p => p.popular)?.label || 'None set'}
                </span>
              </div>
              <div className="bg-[#082216]/90 border border-[#1A4B36] rounded-xl p-3.5 flex flex-col">
                <span className="text-[10px] font-mono text-[#D5EFE3]/60 uppercase font-bold">Entry USDT Level</span>
                <span className="text-xl font-black text-[#D5EFE3] font-mono mt-1">
                  {Math.min(...packages.map(p => p.usdt))} USDT
                </span>
              </div>
            </div>

            {/* Packages Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map(pkg => {
                const ratio = (pkg.tokens / pkg.usdt).toFixed(2);
                const isEnabled = pkg.enabled !== false;

                return (
                  <div
                    key={pkg.id}
                    className={`bg-[#082216] border rounded-2xl p-5 flex flex-col justify-between relative transition shadow-md ${
                      pkg.popular 
                        ? 'border-[#FF5C00] shadow-[0_0_15px_rgba(255,92,0,0.2)]' 
                        : isEnabled ? 'border-[#1A4B36]' : 'border-[#1A4B36]/40 opacity-70'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        {pkg.popular && (
                          <span className="bg-[#FF5C00] text-white text-[9px] font-black px-2 py-0.5 rounded font-mono flex items-center gap-1 shadow-sm">
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
                          {isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleTogglePopular(pkg)}
                        className={`p-1 rounded hover:bg-[#103825] transition cursor-pointer ${
                          pkg.popular ? 'text-[#FF5C00]' : 'text-[#D5EFE3]/40 hover:text-white'
                        }`}
                        title={pkg.popular ? 'Remove Popular badge' : 'Set as Popular badge'}
                      >
                        <Star className={`h-4 w-4 ${pkg.popular ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Main Package Details */}
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">{pkg.label}</h4>
                      
                      <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                        <span className="text-3xl font-black text-[#FF5C00]">{pkg.tokens}</span>
                        <span className="text-xs text-[#D5EFE3]/70 font-sans font-bold">Barcodes</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#1A4B36]/60 flex items-center justify-between text-xs font-mono">
                        <span className="text-white font-bold">{pkg.usdt} USDT</span>
                        <span className="text-[11px] text-emerald-400 font-sans font-bold">{pkg.bonus || `1 USDT = ${ratio} Barcodes`}</span>
                      </div>

                      {pkg.description && (
                        <p className="text-[11px] text-[#D5EFE3]/60 font-sans mt-2 line-clamp-2">
                          {pkg.description}
                        </p>
                      )}

                      <div className="mt-2 text-[10px] font-mono text-[#D5EFE3]/50 bg-[#041A10] p-1.5 rounded border border-[#1A4B36]/40">
                        Effective: {ratio} barcodes per 1 USDT
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-[#1A4B36] flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleOpenEditPackage(pkg)}
                        className="px-2.5 py-1.5 bg-[#041A10] hover:bg-[#103825] border border-[#1A4B36] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer flex-1 justify-center"
                      >
                        <Edit3 className="h-3 w-3 text-[#FF5C00]" />
                        <span>Edit</span>
                      </button>

                      <button
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
                        onClick={() => handleDeletePackage(pkg.id, pkg.label)}
                        className="p-1.5 bg-red-950/60 hover:bg-red-800 border border-red-500/30 text-red-300 rounded-lg text-xs transition cursor-pointer"
                        title="Delete package"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Client Preview Note */}
            <div className="bg-[#041A10] border border-[#1A4B36] rounded-2xl p-4 flex items-center gap-3 text-xs text-[#D5EFE3]/80">
              <div className="p-2 bg-[#FF5C00]/20 text-[#FF5C00] rounded-xl shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-white block">Instant Live Synchronization</span>
                <span>Any additions, price adjustments, or bonus updates will automatically appear in real-time on the client's TRC-20 deposit modal.</span>
              </div>
            </div>

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
                      setPkgUsdt(45);
                      setPkgTokens(65);
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
                  className="px-5 py-2.5 bg-[#FF5C00] hover:bg-[#FF731E] text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingPackageId ? 'Update Package' : 'Create Package'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
