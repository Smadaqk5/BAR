import { User, Order, OrderStatus, SavedClientProfile, TokenPackage } from '../types';
import { DEFAULT_TRON_DEPOSIT_ADDRESS, verifyTronTransaction } from './tronVerifier';
import { SupabaseService, isSupabaseConfigured } from './supabase';

const USERS_KEY = 'bryt_portal_users';
const CURRENT_USER_KEY = 'bryt_portal_current_user';
const ORDERS_KEY = 'bryt_portal_orders';
const SETTINGS_KEY = 'bryt_portal_settings';
const PROFILES_KEY = 'bryt_portal_saved_profiles';
const PACKAGES_KEY = 'bryt_portal_packages';

export interface PortalSettings {
  depositAddress: string;
  usdtContract: string;
  tokensPerUsdt: number;
}

export const DEFAULT_PACKAGES: TokenPackage[] = [
  { id: 'pkg-1', usdt: 20, tokens: 10, label: 'Starter Pack', bonus: '10 Barcodes ($1/ea)', enabled: true },
  { id: 'pkg-2', usdt: 50, tokens: 30, label: 'Pro Pack', bonus: '+5 Bonus Barcodes', enabled: true },
  { id: 'pkg-weekly', usdt: 200, tokens: 200, label: 'Weekly Package', popular: true, bonus: 'Weekly Pass (+20 Bonus)', description: 'Best for weekly volume production', enabled: true },
  { id: 'pkg-3', usdt: 100, tokens: 70, label: 'Agency Pack', bonus: '+20 Bonus Barcodes', enabled: true },
  { id: 'pkg-monthly', usdt: 150, tokens: 260, label: 'Monthly Package', bonus: 'Monthly VIP (+110 Bonus)', description: 'Maximum savings for high-volume monthly issuance', enabled: false },
  { id: 'pkg-4', usdt: 100, tokens: 150, label: 'Enterprise Pack', bonus: '+50 Bonus Barcodes', enabled: false }
];

const DEFAULT_SETTINGS: PortalSettings = {
  depositAddress: DEFAULT_TRON_DEPOSIT_ADDRESS,
  usdtContract: 'TR7NHqjekKQxGTCi8q8ZY4pL8otSzgjLj6',
  tokensPerUsdt: 1
};

const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'smada.io',
    role: 'admin',
    token_balance: 9999,
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'BRYT-8829-4102',
    email: 'BRYT-8829-4102',
    role: 'client',
    token_balance: 0,
    created_at: new Date().toISOString()
  }
];

export function generateUniqueId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `BRYT-${part1}-${part2}`;
}

export const PortalStore = {
  getSettings(): PortalSettings {
    const envDepositAddress = (import.meta as any).env?.VITE_TRON_DEPOSIT_ADDRESS?.trim();
    const envUsdtContract = (import.meta as any).env?.VITE_TRON_USDT_CONTRACT?.trim();

    return {
      depositAddress: envDepositAddress || DEFAULT_TRON_DEPOSIT_ADDRESS,
      usdtContract: envUsdtContract || 'TR7NHqjekKQxGTCi8q8ZY4pL8otSzgjLj6',
      tokensPerUsdt: 1
    };
  },

  saveSettings(settings: Partial<PortalSettings>): PortalSettings {
    return this.getSettings();
  },

  getPackages(): TokenPackage[] {
    try {
      const raw = localStorage.getItem(PACKAGES_KEY);
      if (!raw) {
        localStorage.setItem(PACKAGES_KEY, JSON.stringify(DEFAULT_PACKAGES));
        return DEFAULT_PACKAGES;
      }
      let parsed: TokenPackage[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(PACKAGES_KEY, JSON.stringify(DEFAULT_PACKAGES));
        return DEFAULT_PACKAGES;
      }
      return parsed;
    } catch {
      return DEFAULT_PACKAGES;
    }
  },

  savePackages(packages: TokenPackage[]): void {
    try {
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
      // Broadcast real-time change event to all active views and components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bryt_portal_packages_changed', { detail: packages }));
      }
      // Persist to Supabase if configured
      if (isSupabaseConfigured()) {
        SupabaseService.upsertPackages(packages).catch(err => {
          console.warn('Supabase packages sync warning:', err);
        });
      }
    } catch (e) {
      console.warn('Failed to save packages:', e);
    }
  },

  addPackage(pkg: Omit<TokenPackage, 'id'>): TokenPackage {
    const packages = this.getPackages();
    const newPkg: TokenPackage = {
      ...pkg,
      id: `pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enabled: pkg.enabled !== undefined ? pkg.enabled : true
    };
    if (newPkg.popular) {
      packages.forEach(p => p.popular = false);
    }
    packages.push(newPkg);
    this.savePackages(packages);
    return newPkg;
  },

  updatePackage(id: string, updates: Partial<TokenPackage>): TokenPackage | null {
    const packages = this.getPackages();
    const index = packages.findIndex(p => p.id === id);
    if (index === -1) return null;

    if (updates.popular) {
      packages.forEach(p => {
        if (p.id !== id) p.popular = false;
      });
    }

    packages[index] = { ...packages[index], ...updates };
    this.savePackages(packages);
    return packages[index];
  },

  deletePackage(id: string): boolean {
    let packages = this.getPackages();
    const beforeLen = packages.length;
    packages = packages.filter(p => p.id !== id);
    if (packages.length === 0) {
      packages = [...DEFAULT_PACKAGES];
    }
    this.savePackages(packages);
    if (isSupabaseConfigured()) {
      SupabaseService.deleteRemotePackage(id).catch(console.warn);
    }
    return packages.length < beforeLen;
  },

  resetDefaultPackages(): TokenPackage[] {
    this.savePackages(DEFAULT_PACKAGES);
    return DEFAULT_PACKAGES;
  },

  cleanupInactiveUsers(daysThreshold: number = 30): { deletedCount: number; deletedUserIds: string[] } {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) return { deletedCount: 0, deletedUserIds: [] };

      const users: User[] = JSON.parse(raw);
      const orders: Order[] = this.getAllOrders();
      const now = Date.now();
      const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

      const remainingUsers: User[] = [];
      const deletedUserIds: string[] = [];

      for (const user of users) {
        // Never delete administrator accounts
        if (user.role === 'admin' || user.id === 'user-admin-1' || user.email === 'smada.io') {
          remainingUsers.push(user);
          continue;
        }

        const createdTime = new Date(user.created_at || 0).getTime();
        const accountAgeMs = now - createdTime;

        // Check if user has active tokens or verified approved deposits
        const hasTokenBalance = (user.token_balance || 0) > 0;
        const userOrders = orders.filter(o => o.user_id === user.id || o.user_email === user.email);
        const hasApprovedDeposit = userOrders.some(o => o.status === 'approved' && (o.amount_usdt > 0 || (o.verified_amount || 0) > 0));
        const hasDepositHistory = hasTokenBalance || hasApprovedDeposit;

        // Delete if registered for >= 30 days without any deposit history
        if (accountAgeMs >= thresholdMs && !hasDepositHistory) {
          deletedUserIds.push(user.id);
          this.clearSavedProfiles(user.id);
          if (isSupabaseConfigured()) {
            SupabaseService.deleteUser(user.id).catch(console.error);
          }
        } else {
          remainingUsers.push(user);
        }
      }

      if (deletedUserIds.length > 0) {
        this.saveUsers(remainingUsers);
      }

      return { deletedCount: deletedUserIds.length, deletedUserIds };
    } catch (err) {
      console.error('Failed to execute inactive users cleanup:', err);
      return { deletedCount: 0, deletedUserIds: [] };
    }
  },

  getAllUsers(): User[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      const users: User[] = JSON.parse(raw);
      // Migrate admin account identifier to smada.io if needed
      const adminUser = users.find(u => u.role === 'admin' || u.id === 'user-admin-1');
      if (adminUser && adminUser.email !== 'smada.io') {
        adminUser.email = 'smada.io';
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
      return users;
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (!raw) return null;
      const user: User = JSON.parse(raw);
      // Refresh token balance from users list
      const users = this.getAllUsers();
      const matched = users.find(u => u.id === user.id);
      return matched || user;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  registerNewClient(): { user: User; uniqueId: string } {
    // Purge any 30-day non-depositing users
    this.cleanupInactiveUsers(30);

    const users = this.getAllUsers();
    let uniqueId = generateUniqueId();
    // Collision safeguard
    while (users.some(u => u.id === uniqueId || u.email === uniqueId)) {
      uniqueId = generateUniqueId();
    }

    const newUser: User = {
      id: uniqueId,
      email: uniqueId,
      role: 'client',
      token_balance: 0,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    if (isSupabaseConfigured()) {
      SupabaseService.upsertUser(newUser).catch(console.error);
    }

    this.setCurrentUser(newUser);
    return { user: newUser, uniqueId };
  },

  loginWithUniqueId(uniqueId: string): { success: boolean; user?: User; error?: string } {
    // Execute 30-day retention cleanup
    this.cleanupInactiveUsers(30);

    const clean = uniqueId.trim();
    if (!clean) {
      return { success: false, error: 'Please enter your Unique ID to sign in.' };
    }

    const ADMIN_PASSWORD = 'Mainaadam66@';
    const cleanLower = clean.toLowerCase();

    // If entering the admin password or administrator identifier as Unique ID, log in as admin
    if (
      clean === ADMIN_PASSWORD ||
      cleanLower === ADMIN_PASSWORD.toLowerCase() ||
      cleanLower === 'smada.io' ||
      cleanLower === 'smada' ||
      cleanLower === 'admin' ||
      cleanLower === 'user-admin-1'
    ) {
      return this.loginAdmin(ADMIN_PASSWORD);
    }

    const cleanUpper = clean.toUpperCase();
    const users = this.getAllUsers();
    const matchedUser = users.find(u => 
      u.id.toUpperCase() === cleanUpper || 
      u.email.toUpperCase() === cleanUpper ||
      u.id.toLowerCase() === cleanLower ||
      u.email.toLowerCase() === cleanLower
    );

    if (!matchedUser) {
      return { 
        success: false, 
        error: 'Unique ID not found. If you are a new member, please click "Sign Up" to generate your ID.' 
      };
    }

    this.setCurrentUser(matchedUser);
    return { success: true, user: matchedUser };
  },

  loginAdmin(password: string): { success: boolean; user?: User; error?: string } {
    const ADMIN_PASSWORD = 'Mainaadam66@';
    if (password !== ADMIN_PASSWORD) {
      return { success: false, error: 'Invalid administrator password.' };
    }

    const users = this.getAllUsers();
    let adminUser = users.find(u => u.role === 'admin' || u.email === 'smada.io' || u.id === 'user-admin-1');
    if (!adminUser) {
      adminUser = {
        id: 'user-admin-1',
        email: 'smada.io',
        role: 'admin',
        token_balance: 9999,
        created_at: new Date().toISOString()
      };
      users.unshift(adminUser);
    } else {
      adminUser.email = 'smada.io';
      adminUser.role = 'admin';
    }
    this.saveUsers(users);

    if (isSupabaseConfigured()) {
      SupabaseService.upsertUser(adminUser).catch(console.error);
    }

    this.setCurrentUser(adminUser);
    return { success: true, user: adminUser };
  },

  login(emailOrUsername: string, password?: string): { success: boolean; user?: User; error?: string } {
    const clean = emailOrUsername.trim();
    const cleanLower = clean.toLowerCase();
    const cleanPass = password?.trim() || '';

    // If admin password is supplied or admin identifier used
    if (cleanLower === 'smada.io' || cleanLower === 'smada' || cleanLower === 'admin' || cleanPass === 'Mainaadam66@') {
      return this.loginAdmin(cleanPass);
    }

    // Otherwise treat as Unique ID
    return this.loginWithUniqueId(clean);
  },

  logout(): void {
    this.setCurrentUser(null);
  },

  updateUserTokens(userId: string, amount: number, isDelta: boolean = false): User | null {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    if (isDelta) {
      users[idx].token_balance = Math.max(0, users[idx].token_balance + amount);
    } else {
      users[idx].token_balance = Math.max(0, amount);
    }

    this.saveUsers(users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.setCurrentUser(users[idx]);
    }

    if (isSupabaseConfigured()) {
      SupabaseService.upsertUser(users[idx]).catch(console.error);
    }

    return users[idx];
  },

  deleteUser(userId: string): boolean {
    let users = this.getAllUsers();
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
    this.clearSavedProfiles(userId);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.logout();
    }

    if (isSupabaseConfigured()) {
      SupabaseService.deleteUser(userId).catch(console.error);
    }
    return true;
  },

  getAllOrders(): Order[] {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveOrders(orders: Order[]): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  },

  createOrder(userId: string, userEmail: string, amountUsdt: number, tokensToCredit: number): Order {
    const orders = this.getAllOrders();
    const newOrder: Order = {
      id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      user_email: userEmail,
      amount_usdt: amountUsdt,
      tokens_to_credit: tokensToCredit,
      status: 'pending_payment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);

    if (isSupabaseConfigured()) {
      SupabaseService.upsertOrder(newOrder).catch(console.error);
    }

    return newOrder;
  },

  isTxHashUsed(txHash: string, excludeOrderId?: string): boolean {
    const clean = txHash.trim().toLowerCase();
    const orders = this.getAllOrders();
    return orders.some(
      o => o.tx_hash?.toLowerCase() === clean && o.id !== excludeOrderId && (o.status === 'approved' || o.status === 'verifying')
    );
  },

  async submitAndVerifyTxHash(orderId: string, txHash: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    const cleanHash = txHash.trim();
    const orders = this.getAllOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return { success: false, error: 'Order not found.' };
    }

    const order = orders[orderIndex];

    // Anti-replay check
    if (this.isTxHashUsed(cleanHash, orderId)) {
      return {
        success: false,
        error: 'This transaction hash (TxID) has already been processed or is currently under verification. Replay detected.'
      };
    }

    const settings = this.getSettings();

    // Verify against Tronscan
    const verifyResult = await verifyTronTransaction(
      cleanHash,
      order.amount_usdt,
      settings.depositAddress,
      settings.usdtContract
    );

    if (verifyResult.valid) {
      // Atomic approval & Token crediting
      order.tx_hash = cleanHash;
      order.status = 'approved';
      order.verified_amount = verifyResult.amountReceived;
      order.verification_note = `Verified on TRON. Received ${verifyResult.amountReceived} USDT.`;
      order.updated_at = new Date().toISOString();

      orders[orderIndex] = order;
      this.saveOrders(orders);

      // Credit tokens to user
      this.updateUserTokens(order.user_id, order.tokens_to_credit, true);

      if (isSupabaseConfigured()) {
        SupabaseService.upsertOrder(order).catch(console.error);
      }

      return { success: true, order };
    } else {
      // If failed or unconfirmed, record TxID and keep state updated
      order.tx_hash = cleanHash;
      order.status = verifyResult.confirmed === false ? 'verifying' : 'rejected';
      order.verification_note = verifyResult.error || 'Verification rejected';
      order.updated_at = new Date().toISOString();

      orders[orderIndex] = order;
      this.saveOrders(orders);

      if (isSupabaseConfigured()) {
        SupabaseService.upsertOrder(order).catch(console.error);
      }

      return {
        success: false,
        order,
        error: verifyResult.error || 'Unable to verify transaction on TRON blockchain.'
      };
    }
  },

  adminForceApproveOrder(orderId: string): Order | null {
    const orders = this.getAllOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const order = orders[idx];
    if (order.status === 'approved') return order;

    order.status = 'approved';
    order.verification_note = 'Manually approved & credited by Administrator.';
    order.updated_at = new Date().toISOString();

    orders[idx] = order;
    this.saveOrders(orders);

    // Credit tokens
    this.updateUserTokens(order.user_id, order.tokens_to_credit, true);

    if (isSupabaseConfigured()) {
      SupabaseService.upsertOrder(order).catch(console.error);
    }

    return order;
  },

  adminRejectOrder(orderId: string, reason: string = 'Rejected by Administrator.'): Order | null {
    const orders = this.getAllOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const order = orders[idx];
    order.status = 'rejected';
    order.verification_note = reason;
    order.updated_at = new Date().toISOString();

    orders[idx] = order;
    this.saveOrders(orders);

    if (isSupabaseConfigured()) {
      SupabaseService.upsertOrder(order).catch(console.error);
    }

    return order;
  },

  getSavedProfiles(userId?: string): SavedClientProfile[] {
    try {
      const targetUserId = userId || this.getCurrentUser()?.id;
      if (!targetUserId) return [];
      const raw = localStorage.getItem(`${PROFILES_KEY}_${targetUserId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveSavedProfiles(profiles: SavedClientProfile[], userId?: string): void {
    try {
      const targetUserId = userId || this.getCurrentUser()?.id;
      if (!targetUserId) return;
      localStorage.setItem(`${PROFILES_KEY}_${targetUserId}`, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Failed to save profiles to localStorage:', e);
    }
  },

  clearSavedProfiles(userId?: string): void {
    try {
      const targetUserId = userId || this.getCurrentUser()?.id;
      if (!targetUserId) return;
      localStorage.removeItem(`${PROFILES_KEY}_${targetUserId}`);
    } catch (e) {
      console.warn('Failed to clear profiles from localStorage:', e);
    }
  },

  async syncFromSupabase(): Promise<{ users: User[]; orders: Order[]; packages: TokenPackage[] }> {
    if (!isSupabaseConfigured()) {
      return { users: this.getAllUsers(), orders: this.getAllOrders(), packages: this.getPackages() };
    }

    try {
      const [remoteUsers, remoteOrders, remotePackages] = await Promise.all([
        SupabaseService.fetchUsers(),
        SupabaseService.fetchOrders(),
        SupabaseService.fetchPackages()
      ]);

      if (remoteUsers && remoteUsers.length > 0) {
        this.saveUsers(remoteUsers);
      }

      if (remoteOrders && remoteOrders.length > 0) {
        this.saveOrders(remoteOrders);
      }

      if (remotePackages && remotePackages.length > 0) {
        localStorage.setItem(PACKAGES_KEY, JSON.stringify(remotePackages));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bryt_portal_packages_changed', { detail: remotePackages }));
        }
      }

      return {
        users: this.getAllUsers(),
        orders: this.getAllOrders(),
        packages: this.getPackages()
      };
    } catch (err) {
      console.warn('Supabase auto-sync failed, using local storage fallback:', err);
      return { users: this.getAllUsers(), orders: this.getAllOrders(), packages: this.getPackages() };
    }
  }
};

