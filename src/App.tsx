import React, { useState, useRef, useEffect } from 'react';
import bwipjs from 'bwip-js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  Sliders, 
  User, 
  FileText, 
  MapPin, 
  Compass, 
  Tag, 
  FileCode, 
  Info,
  HelpCircle,
  Database,
  Dices,
  Terminal,
  Code2,
  X,
  Wand2,
  ShieldCheck,
  Building2,
  Bookmark,
  Layers,
  CalendarDays,
  Hash,
  Fingerprint,
  RotateCcw,
  SlidersHorizontal,
  FolderDown,
  ArrowRight
} from 'lucide-react';
import { AAMVAData, FieldHelp, User as UserType, SavedClientProfile } from './types';
import { 
  US_STATES, 
  CAN_PROVINCES, 
  EYE_COLORS, 
  HAIR_COLORS, 
  COMPLIANCE_OPTIONS, 
  TRUNCATION_OPTIONS, 
  GENDER_OPTIONS, 
  RACE_OPTIONS, 
  DEFAULT_ALASKA_DEMO, 
  EMPTY_FORM, 
  HELP_HINTS,
  IIN_MAPPING
} from './constants';
import { compileAAMVAString, getReadableAAMVAString } from './utils/aamvaCompiler';
import { FormSection, TextInput, SelectInput } from './components/FormFields';
import { MockDataSuite } from './components/MockDataSuite';
import { AuthScreen } from './components/AuthScreen';
import { Trc20Checkout } from './components/Trc20Checkout';
import { AdminOrders } from './components/AdminOrders';
import { PortalStore } from './utils/portalStore';
import { Coins, LogOut, ShieldAlert, PlusCircle } from 'lucide-react';
import { 
  generateSyntheticRecord, 
  generateSingleDLN,
  generateSingleDOB,
  generateSingleIssueDate,
  generateSingleExpiryDate,
  generateSingleICN,
  generateSingleDCF,
  generateSingleAddress,
  generateSingleName,
  JURISDICTION_RULES 
} from './utils/mockGenerator';

type BarcodeBackgroundMode = 'transparent' | 'white';

export default function App() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => PortalStore.getCurrentUser());
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<AAMVAData>(DEFAULT_ALASKA_DEMO);
  
  // Height Selector Support
  // 600 default (6'0")
  const [heightFeet, setHeightFeet] = useState<number>(6);
  const [heightInches, setHeightInches] = useState<number>(0);

  // Active help guide state (optional tracking)
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Output State
  const [generatedString, setGeneratedString] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isImageCopied, setIsImageCopied] = useState<boolean>(false);
  const [showOutputModal, setShowOutputModal] = useState<boolean>(false);
  const [showSavedProfilesDrawer, setShowSavedProfilesDrawer] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [backgroundMode, setBackgroundMode] = useState<BarcodeBackgroundMode>('white');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User-scoped Saved Profiles & Generated Barcodes (Strictly private per account)
  const [savedProfiles, setSavedProfiles] = useState<SavedClientProfile[]>(() => 
    PortalStore.getSavedProfiles(currentUser?.id)
  );

  // Synchronize saved profiles whenever active user switches (e.g. login/logout/account switch)
  useEffect(() => {
    if (currentUser?.id) {
      setSavedProfiles(PortalStore.getSavedProfiles(currentUser.id));
    } else {
      setSavedProfiles([]);
    }
  }, [currentUser?.id]);

  // Automatically persist saved profiles for the active user account
  useEffect(() => {
    if (currentUser?.id) {
      PortalStore.saveSavedProfiles(savedProfiles, currentUser.id);
    }
  }, [savedProfiles, currentUser?.id]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const createFixedSizeBarcodeCanvas = (sourceCanvas: HTMLCanvasElement, mode: BarcodeBackgroundMode): HTMLCanvasElement => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = sourceCanvas.width;
    finalCanvas.height = sourceCanvas.height;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) {
      return sourceCanvas;
    }

    if (mode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    } else {
      ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, 0, 0);
    return finalCanvas;
  };

  const getBarcodeImageDataUrl = (canvas: HTMLCanvasElement, mode: BarcodeBackgroundMode): string => {
    const finalCanvas = createFixedSizeBarcodeCanvas(canvas, mode);
    return finalCanvas.toDataURL('image/png');
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to Blob'));
        }
      }, type);
    });
  };

  const renderBarcode = (barcodeText: string, shouldOpenModal = false) => {
    if (!canvasRef.current) return;

    const barcodeOptions: any = {
      bcid: 'pdf417',
      text: barcodeText,
      scale: 4,
      height: 18,
      includetext: false,
      eclevel: 5,
      padding: 0,
      paddingwidth: 0,
      paddingheight: 0,
      paddingtop: 0,
      paddingleft: 0,
      paddingright: 0,
      paddingbottom: 0,
    };
    if (backgroundMode === 'white') {
      barcodeOptions.backgroundcolor = '#FFFFFF';
    }
    bwipjs.toCanvas(canvasRef.current, barcodeOptions);

    const imgUrl = getBarcodeImageDataUrl(canvasRef.current, backgroundMode);
    setPreviewImageUrl(imgUrl);
    if (shouldOpenModal) {
      setShowOutputModal(true);
    }
  };

  // Monitor height selections to automatically format and patch DAU
  useEffect(() => {
    const formattedInches = String(heightInches).padStart(2, '0');
    const dauValue = `${heightFeet}${formattedInches}`;
    setFormData(prev => ({ ...prev, dau: dauValue }));
  }, [heightFeet, heightInches]);

  // Generate initial barcode on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const aamvaString = compileAAMVAString(DEFAULT_ALASKA_DEMO);
        setGeneratedString(aamvaString);
        renderBarcode(aamvaString);
      } catch (err) {
        console.error("Mount-time barcode compile failed:", err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!generatedString || !canvasRef.current) return;
    renderBarcode(generatedString);
  }, [backgroundMode, generatedString]);

  // Handle changing numerical/raw DAU to backward sync slider values if needed
  const handleDauChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 3);
    setFormData(prev => ({ ...prev, dau: clean }));
    
    if (clean.length === 3) {
      const ft = parseInt(clean[0], 10);
      const inch = parseInt(clean.slice(1), 10);
      if (ft >= 3 && ft <= 8 && inch >= 0 && inch <= 11) {
        setHeightFeet(ft);
        setHeightInches(inch);
      }
    }
  };

  // Generic Field Change Handler
  const handleInputChange = (field: keyof AAMVAData, val: string) => {
    let cleanVal = val;

    // auto capitalization for name, address and license number fields
    const uppercaseFields: Array<keyof AAMVAData> = [
      'dcs', 'dac', 'dad', 'dag', 'dai', 'daq', 'dck', 'dca', 'dcb', 'dcd'
    ];
    if (uppercaseFields.includes(field)) {
      cleanVal = val.toUpperCase();
    }

    // auto format zip code (digits/alphanumeric only, remove dashes or spaces)
    if (field === 'dak') {
      cleanVal = val.replace(/[\s-]/g, '').toUpperCase();
    }

    // limit fields to specific lengths of digits if needed
    if (field === 'iin') {
      cleanVal = val.replace(/\D/g, '').slice(0, 6);
    }
    if (field === 'jvn') {
      cleanVal = val.replace(/\D/g, '').slice(0, 2);
    }
    if (field === 'daw') {
      cleanVal = val.replace(/\D/g, '').slice(0, 3);
    }

    // Auto-update Issuer ID (IIN) when selecting State/Province (daj)
    if (field === 'daj') {
      const stateCode = cleanVal.toUpperCase();
      const mappedIin = IIN_MAPPING[stateCode];
      if (mappedIin) {
        setFormData(prev => ({
          ...prev,
          daj: cleanVal,
          iin: mappedIin
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: cleanVal
    }));
  };

  // Helper focus handlers for hint banner update
  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  // Load Preset Demo Data
  const loadDemoData = () => {
    setFormData(DEFAULT_ALASKA_DEMO);
    setHeightFeet(6);
    setHeightInches(0);
    setFocusedField(null);
    setValidationError('');
    // Clear generation preview if loading a new demo
    setPreviewImageUrl('');
    setShowOutputModal(false);
    setToastMessage('Loaded Rodgers Alaska Demo');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load synthetic record directly into form and auto-render
  const handleLoadSyntheticRecord = (record: AAMVAData, notifyText?: string) => {
    setFormData(record);
    // Parse DAU height (e.g. 509 -> 5'9", 601 -> 6'1")
    if (record.dau && record.dau.length >= 3) {
      const feet = parseInt(record.dau.slice(0, 1), 10) || 5;
      const inches = parseInt(record.dau.slice(1), 10) || 0;
      setHeightFeet(feet);
      setHeightInches(inches);
    }
    setFocusedField(null);
    setValidationError('');

    // Re-compile AAMVA string & live barcode
    try {
      const compiled = compileAAMVAString(record);
      setGeneratedString(compiled);
      if (canvasRef.current) {
        renderBarcode(compiled, false);
      }
    } catch (e) {
      console.warn('Auto compile warning on mock load:', e);
    }

    const stateName = JURISDICTION_RULES[record.daj]?.name || record.daj;
    const msg = notifyText || `🎲 Loaded Synthetic ${stateName} (${record.daj}) Record — DLN: ${record.daq}`;
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleRollSyntheticProfile = (stateCode?: string) => {
    const synthetic = generateSyntheticRecord(stateCode, 'MMDDYYYY');
    handleLoadSyntheticRecord(synthetic);
  };

  // --------------------------------------------------------------------------
  // DIRECT 1-CLICK FIELD GENERATORS (Client Portal Automation)
  // --------------------------------------------------------------------------

  const handleGenerateDLN = () => {
    const state = formData.daj || 'CA';
    const dln = generateSingleDLN(state);
    setFormData(prev => ({ ...prev, daq: dln }));
    setToastMessage(`⚡ Generated valid ${state} License Number (DAQ): ${dln}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateIssueDate = () => {
    const issueDate = generateSingleIssueDate(formData.dbb, formData.daj);
    setFormData(prev => ({ ...prev, dbd: issueDate }));
    setToastMessage(`⚡ Generated chronological Issue Date (DBD): ${issueDate}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateExpiryDate = () => {
    const expDate = generateSingleExpiryDate(formData.dbb, formData.dbd, formData.daj);
    setFormData(prev => ({ ...prev, dba: expDate }));
    setToastMessage(`⚡ Generated Expiry Date (DBA) aligned to ${formData.daj || 'State'} renewal cycle: ${expDate}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateDOB = () => {
    const dob = generateSingleDOB();
    setFormData(prev => ({ ...prev, dbb: dob }));
    setToastMessage(`⚡ Generated adult Date of Birth (DBB): ${dob}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateICN = () => {
    const state = formData.daj || 'CA';
    const icn = generateSingleICN(state);
    const dck = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setFormData(prev => ({ ...prev, dcg: icn, dck: dck }));
    setToastMessage(`⚡ Generated ICN & Inventory Control (DCG/DCK): ${icn}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateDCF = () => {
    const state = formData.daj || 'CA';
    const dcf = generateSingleDCF(state);
    setFormData(prev => ({ ...prev, dcf: dcf }));
    setToastMessage(`⚡ Generated Document Discriminator (DCF) for ${state}: ${dcf}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateAddress = () => {
    const state = formData.daj || 'CA';
    const addr = generateSingleAddress(state);
    setFormData(prev => ({
      ...prev,
      dag: addr.dag,
      dai: addr.dai,
      dak: addr.dak,
      daj: addr.daj,
      iin: IIN_MAPPING[addr.daj] || prev.iin
    }));
    setToastMessage(`⚡ Generated address for ${addr.daj}: ${addr.dag}, ${addr.dai} ${addr.dak}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateName = () => {
    const nameData = generateSingleName(formData.dbc);
    setFormData(prev => ({
      ...prev,
      dcs: nameData.dcs,
      dac: nameData.dac,
      dad: nameData.dad,
      dbc: nameData.dbc
    }));
    setToastMessage(`⚡ Generated name: ${nameData.dac} ${nameData.dad ? nameData.dad + ' ' : ''}${nameData.dcs}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateAllDocDetails = () => {
    const state = formData.daj || 'CA';
    const dln = generateSingleDLN(state);
    const dob = formData.dbb || generateSingleDOB();
    const issueDate = generateSingleIssueDate(dob, state);
    const expDate = generateSingleExpiryDate(dob, issueDate, state);
    const dcf = generateSingleDCF(state);
    const icn = generateSingleICN(state);
    const dck = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    setFormData(prev => ({
      ...prev,
      daj: state,
      daq: dln,
      dbb: dob,
      dbd: issueDate,
      dba: expDate,
      dcf: dcf,
      dcg: icn,
      dck: dck,
      iin: IIN_MAPPING[state] || prev.iin
    }));
    setToastMessage(`⚡ Auto-generated all Document Numbers (DLN, Issue, Expiry, DCF, ICN) for ${state}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Client Portal Profile Management
  const handleSaveCurrentProfile = () => {
    const state = formData.daj || 'US';
    const name = `${formData.dac || 'CARDHOLDER'} ${formData.dcs || 'RECORD'}`;
    const newProfile: SavedClientProfile = {
      id: `profile-${Date.now()}`,
      userId: currentUser?.id,
      title: `${name} — ${state} (${formData.daq || 'No DLN'})`,
      jurisdiction: state,
      dln: formData.daq || 'N/A',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      data: { ...formData }
    };
    setSavedProfiles(prev => [newProfile, ...prev]);
    setToastMessage(`💾 Saved "${newProfile.title}" to Client Portal Records`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Clear Form Data
  const clearForm = () => {
    setFormData(EMPTY_FORM);
    setHeightFeet(5);
    setHeightInches(6);
    setFocusedField(null);
    setValidationError('');
    setPreviewImageUrl('');
    setShowOutputModal(false);
  };

  // Format date helper value as typed (MMDDYYYY)
  const formatAsDateString = (field: keyof AAMVAData, val: string) => {
    const rawDigits = val.replace(/\D/g, '').slice(0, 8);
    setFormData(prev => ({
      ...prev,
      [field]: rawDigits
    }));
  };

  // Generate compliance barcode & auto-save to Profiles (Monetized & Token-Gated)
  const generateBarcode = () => {
    setValidationError('');

    // Check token balance
    if (!currentUser || currentUser.token_balance <= 0) {
      setValidationError('⚡ Insufficient Tokens: You need at least 1 token to generate a PDF417 barcode. Please top up your balance with a TRC-20 USDT deposit.');
      setShowCheckoutModal(true);
      return;
    }

    try {
      const aamvaString = compileAAMVAString(formData);
      setGeneratedString(aamvaString);

      if (canvasRef.current) {
        renderBarcode(aamvaString, true);

        // Deduct 1 token from user balance
        const updatedUser = PortalStore.updateUserTokens(currentUser.id, -1, true);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }

        // Auto-save generated barcode to Profiles list
        const state = formData.daj || 'US';
        const cardholderName = `${formData.dac || 'CARDHOLDER'} ${formData.dcs || ''}`.trim();
        const generatedImg = getBarcodeImageDataUrl(canvasRef.current, backgroundMode);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newProfile: SavedClientProfile = {
          id: `gen-${Date.now()}`,
          userId: currentUser.id,
          title: `${cardholderName || 'CARDHOLDER'} — ${state} (${formData.daq || 'No DLN'})`,
          jurisdiction: state,
          dln: formData.daq || 'N/A',
          createdAt: `Generated ${timeStr}`,
          data: { ...formData },
          barcodeString: aamvaString,
          imageUrl: generatedImg
        };

        setSavedProfiles(prev => [newProfile, ...prev]);
        setToastMessage(`⚡ Barcode generated & saved! 1 Token deducted. (Remaining: ${updatedUser ? updatedUser.token_balance : currentUser.token_balance - 1} Tokens)`);
        setTimeout(() => setToastMessage(null), 4500);
      } else {
        setValidationError('Canvas node was not mounted yet. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setValidationError(`Engine execution failed: ${err.message || err}`);
    }
  };

  // Basic validation rules check
  const findRequiredFieldsError = (): string | null => {
    const datePattern = /^\d{8}$/;

    if (!formData.iin || formData.iin.length !== 6) {
      return 'HDR Issuer ID Number is required and must be exactly 6 digits.';
    }
    if (!formData.dcs.trim()) {
      return 'Last Name (DCS) is a mandatory field.';
    }
    if (!formData.dac.trim()) {
      return 'First Name (DAC) is a mandatory field.';
    }
    if (!formData.dbb || !datePattern.test(formData.dbb)) {
      return 'Date of Birth (DBB) is mandatory and must be exactly 8 digits in MMDDYYYY format.';
    }
    if (!formData.dau || formData.dau.length !== 3) {
      return 'Height (DAU) is mandatory and must be a 3-digit number.';
    }
    if (!formData.dag.trim()) {
      return 'Street Address (DAG) is a mandatory field.';
    }
    if (!formData.dai.trim()) {
      return 'City (DAI) is a mandatory field.';
    }
    if (!formData.daj) {
      return 'State Code (DAJ) is a mandatory field.';
    }
    if (!formData.dak.trim()) {
      return 'Postal Code (DAK) is a mandatory field.';
    }
    if (!formData.daq.trim()) {
      return 'Document Number (DAQ) is a mandatory field.';
    }
    if (!formData.dbd || !datePattern.test(formData.dbd)) {
      return 'Document Issue Date (DBD) is mandatory and must be exactly 8 digits in MMDDYYYY format.';
    }
    if (!formData.dba || !datePattern.test(formData.dba)) {
      return 'Document Expiry Date (DBA) is mandatory and must be exactly 8 digits in MMDDYYYY format.';
    }
    if (!formData.dcf.trim()) {
      return 'Document Discriminator (DCF) is a mandatory field.';
    }
    return null;
  };

  const getBarcodeBlob = async (mode: BarcodeBackgroundMode): Promise<Blob> => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available');
    }
    const fixedCanvas = createFixedSizeBarcodeCanvas(canvasRef.current, mode);
    return canvasToBlob(fixedCanvas, 'image/png');
  };

  // Copy raw output string to clipboard handler
  const copyRawStringToClipboard = () => {
    if (!generatedString) return;
    navigator.clipboard.writeText(generatedString)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        alert('Could not copy string automatically: ' + err);
      });
  };

  const copyBarcodeImageToClipboard = async () => {
    if (!canvasRef.current) {
      alert('Barcode image is not ready to copy. Please generate it first.');
      return;
    }

    try {
      const blob = await getBarcodeBlob(backgroundMode);
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
      setIsImageCopied(true);
      setTimeout(() => setIsImageCopied(false), 2000);
    } catch (err: any) {
      console.error('Clipboard image copy failed:', err);
      alert('Could not copy barcode image automatically. Please download it instead.');
    }
  };

  // Download barcode image as file
  const downloadBarcode = () => {
    if (!previewImageUrl) return;
    const link = document.createElement('a');
    link.href = previewImageUrl;
    link.download = `aamva_pdf417_${formData.dcs || 'barcode'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get current active help hint details
  const currentHint = focusedField && HELP_HINTS[focusedField] 
    ? HELP_HINTS[focusedField] 
    : {
        fieldName: 'general',
        title: 'AAMVA PDF417 Parser Guide',
        hint: '💡 Tap on any form input to see standard specification layout requirements, parsing tags, and auto-formatting offsets in this sticky help banner.'
      };

  // Handle Logout
  const handleLogout = () => {
    PortalStore.logout();
    setCurrentUser(null);
    setViewMode('client');
  };

  // If user is not logged in, show Auth screen
  if (!currentUser) {
    return (
      <AuthScreen
        onSuccess={user => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setViewMode('admin');
          } else {
            setViewMode('client');
          }
        }}
      />
    );
  }

  // If user navigated to Admin Panel, render Admin Center
  if (viewMode === 'admin') {
    return (
      <AdminOrders
        currentUser={currentUser}
        onBackToPortal={() => setViewMode('client')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#061C12] text-[#D5EFE3] font-sans flex flex-col antialiased">
      {/* HIDDEN WORKING CANVAS FOR BWIP-JS GENERATION */}
      <canvas id="barcodeCanvas" ref={canvasRef} style={{ display: 'none' }} />

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 bg-[#03130C] border-b border-[#0B2D1C] shadow-xl">
        <div className="w-full max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF5C00] rounded flex items-center justify-center text-white font-extrabold shadow-[0_0_14px_rgba(255,92,0,0.45)]">
              <span className="text-[12px] font-mono tracking-tight font-black">BBT</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white uppercase font-sans">
                  Bryt Barcode <span className="text-[#FF5C00]">Tec</span>
                </h1>
                <span className="text-[9px] bg-[#041A10] border border-[#FF5C00]/40 px-2 py-0.5 rounded text-[#FF5C00] font-mono font-bold uppercase tracking-wider">
                  Client Portal
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] bg-[#041A10] border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-400 font-mono font-bold">CDS v10.4</span>
                <span className="text-[9px] text-[#D5EFE3]/60 font-mono">
                  Account: <strong className="text-white font-sans">{currentUser.email}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Token Balance Indicator */}
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#08281B] hover:bg-[#0E3827] border border-[#1A4B36] rounded-xl text-white transition cursor-pointer shadow-xs group"
              title="Click to buy tokens with USDT"
            >
              <div className="w-5 h-5 rounded-full bg-[#FF5C00]/20 flex items-center justify-center text-[#FF5C00] group-hover:scale-110 transition">
                <Coins className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-mono font-black text-[#FF5C00]">
                {currentUser.token_balance} <span className="text-[10px] font-sans font-medium text-[#D5EFE3]/80">Tokens</span>
              </span>
              <span className="text-[10px] bg-[#FF5C00] text-white px-1.5 py-0.5 rounded font-bold uppercase">
                + Deposit
              </span>
            </button>

            {/* Admin Switcher */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setViewMode('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C2A1E] hover:bg-[#123E2C] text-[#D5EFE3] hover:text-white text-xs font-bold font-sans rounded-xl border border-[#1A4B36] transition cursor-pointer"
                title="Open Administrator Management Center"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-[#FF5C00]" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* Profiles Drawer Trigger */}
            <button
              onClick={() => setShowSavedProfilesDrawer(true)}
              id="btn-client-profiles"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF5C00] hover:bg-[#FF731E] text-white text-xs font-bold font-sans rounded-xl shadow-[0_2px_12px_rgba(255,92,0,0.35)] transition cursor-pointer active:scale-95"
              title="Open generated barcodes and saved client profiles"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Profiles ({savedProfiles.length})</span>
            </button>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="p-1.5 bg-[#041A10] hover:bg-[#1B1410] text-[#D5EFE3]/60 hover:text-red-400 border border-[#1A4B36] rounded-xl transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION FOR MOCK DATA / DEMO */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#FF5C00] text-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-between shadow-lg z-30 sticky top-[69px]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>{toastMessage}</span>
              </span>
              <button 
                onClick={() => setToastMessage(null)}
                className="hover:bg-white/20 p-1 rounded cursor-pointer transition ml-4"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SPLIT DASHBOARD SECTION */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT PANEL - Form sections */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto pr-1">
          
          {/* Section 1 */}
          <FormSection 
            title="1. DOCUMENT HEADER (HDR)" 
            icon={<Sliders className="h-4 w-4 text-[#FF5C00]" />}
            subtitle="Standard envelope, compliance version, and jurisdiction IIN"
            action={
              <button
                type="button"
                onClick={() => {
                  const code = formData.daj?.toUpperCase() || 'AK';
                  const mapped = IIN_MAPPING[code] || '636000';
                  handleInputChange('iin', mapped);
                  setToastMessage(`⚡ Mapped standard IIN for ${code}: ${mapped}`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-2 py-0.5 bg-[#041A10] hover:bg-[#103825] text-[#D5EFE3] hover:text-white text-[10px] font-mono font-bold rounded border border-[#1A4B36] transition cursor-pointer"
                title={`Map standard IIN for ${formData.daj || 'jurisdiction'}`}
              >
                <span>⚡ Auto-Map IIN</span>
              </button>
            }
          >
            <SelectInput
              label="Document Standard"
              tag="FileType"
              required
              value={formData.fileType}
              onChange={val => handleInputChange('fileType', val)}
              onFocus={() => handleFocus('fileType')}
            >
              <option value="DL">DL - Driver License</option>
              <option value="ID">ID - Identification Card</option>
            </SelectInput>

            <SelectInput
              label="AAMVA Version"
              tag="VER"
              required
              value={formData.ver}
              onChange={val => handleInputChange('ver', val)}
              onFocus={() => handleFocus('ver')}
            >
              <option value="10">v10 (AAMVA Standard)</option>
              <option value="09">v09 (Rodgers Standard)</option>
              <option value="08">v08 (Classic Standard)</option>
              <option value="05">v05 (Older Standard)</option>
            </SelectInput>

            <div className="flex flex-col gap-1">
              <TextInput
                label="Issuer ID (IIN)"
                tag="IIN"
                placeholder="e.g. 636059 for AK"
                value={formData.iin}
                onChange={val => handleInputChange('iin', val)}
                onFocus={() => handleFocus('iin')}
                onGenerate={() => {
                  const code = formData.daj?.toUpperCase() || 'AK';
                  const mapped = IIN_MAPPING[code] || '636000';
                  handleInputChange('iin', mapped);
                  setToastMessage(`⚡ Mapped standard IIN for ${code}: ${mapped}`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                generateLabel="Map IIN"
                generateTitle={`Map IIN for ${formData.daj || 'state'}`}
                maxLength={6}
              />
              {formData.daj && (
                <div className="text-[10px] leading-tight font-mono px-0.5 select-none">
                  {IIN_MAPPING[formData.daj.toUpperCase()] === formData.iin ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <span>✓</span> Auto-mapped for {formData.daj}: {formData.iin}
                    </span>
                  ) : formData.iin ? (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <span>⚠</span> Manual Override (Default: {IIN_MAPPING[formData.daj.toUpperCase()] || 'None'})
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <span>ℹ</span> Empty (Standard: {IIN_MAPPING[formData.daj.toUpperCase()] || 'N/A'})
                    </span>
                  )}
                </div>
              )}
            </div>

            <TextInput
              label="Jurisdiction Ver"
              tag="JVN"
              required
              placeholder="e.g. 00"
              value={formData.jvn}
              onChange={val => handleInputChange('jvn', val)}
              onFocus={() => handleFocus('jvn')}
              maxLength={2}
            />
          </FormSection>

          {/* Section 2 */}
          <FormSection 
            title="2. PERSONAL INFORMATION" 
            icon={<User className="h-4 w-4 text-[#FF5C00]" />}
            subtitle="Cardholder legal identity, birth date and demographics"
            action={
              <button
                type="button"
                onClick={() => {
                  handleGenerateName();
                  handleGenerateDOB();
                }}
                className="px-2.5 py-1 bg-[#041A10] hover:bg-[#103825] text-[#D5EFE3] hover:text-white text-[10px] font-mono font-bold rounded border border-[#1A4B36] transition cursor-pointer"
                title="Randomize legal name and date of birth"
              >
                <span>⚡ Roll Name & DOB</span>
              </button>
            }
          >
            <TextInput
              label="Last Name"
              tag="DCS"
              required
              placeholder="LAST NAME ONLY"
              value={formData.dcs}
              onChange={val => handleInputChange('dcs', val)}
              onFocus={() => handleFocus('dcs')}
              onGenerate={handleGenerateName}
              generateLabel="Gen Name"
              generateTitle="Generate random realistic first, middle, and last name"
            />

            <TextInput
              label="First Name"
              tag="DAC"
              required
              placeholder="FIRST NAME ONLY"
              value={formData.dac}
              onChange={val => handleInputChange('dac', val)}
              onFocus={() => handleFocus('dac')}
              onGenerate={handleGenerateName}
              generateLabel="Gen Name"
              generateTitle="Generate random realistic name"
            />

            <TextInput
              label="Middle Name"
              tag="DAD"
              placeholder="MIDDLE NAME OR INITIALS"
              value={formData.dad || ''}
              onChange={val => handleInputChange('dad', val)}
              onFocus={() => handleFocus('dad')}
            />

            <TextInput
              label="Date of Birth"
              tag="DBB"
              required
              placeholder="MMDDYYYY"
              value={formData.dbb}
              onChange={val => formatAsDateString('dbb', val)}
              onFocus={() => handleFocus('dbb')}
              onGenerate={handleGenerateDOB}
              generateLabel="Gen DOB"
              generateTitle="Generate realistic adult birth date (18-75 yrs)"
              maxLength={8}
            />

            <SelectInput
              label="Sex / Gender"
              tag="DBC"
              required
              value={formData.dbc}
              onChange={val => handleInputChange('dbc', val)}
              onFocus={() => handleFocus('dbc')}
            >
              {GENDER_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>
          </FormSection>

          {/* Section 3 */}
          <FormSection title="3. PHYSICAL DESCRIPTION" icon={<Compass className="h-4 w-4 text-[#FF5C00]" />} subtitle="Biometric physical characteristics">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#0B2519]/80 font-sans flex items-center justify-between">
                <span>Height (Feet / Inches) <span className="text-[#FF5C00] font-black">*</span></span>
                <span className="text-[#0B2519]/50 text-[9px] font-mono">[DAU]</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={heightFeet}
                  onChange={e => setHeightFeet(parseInt(e.target.value, 10))}
                  onFocus={() => handleFocus('dau')}
                  className="flex-1 bg-[#FFFFFF] border border-[#0B2519]/25 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-2.5 py-1.8 text-xs text-[#061E13] outline-none cursor-pointer font-bold animate-transition"
                >
                  {[3, 4, 5, 6, 7, 8].map(ft => (
                    <option key={ft} value={ft}>{ft} FT</option>
                  ))}
                </select>
                <select
                  value={heightInches}
                  onChange={e => setHeightInches(parseInt(e.target.value, 10))}
                  onFocus={() => handleFocus('dau')}
                  className="flex-1 bg-[#FFFFFF] border border-[#0B2519]/25 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-2.5 py-1.8 text-xs text-[#061E13] outline-none cursor-pointer font-bold animate-transition"
                >
                  {Array.from({ length: 12 }).map((_, inIdx) => (
                    <option key={inIdx} value={inIdx}>{inIdx} IN</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="600"
                  value={formData.dau}
                  onChange={e => handleDauChange(e.target.value)}
                  onFocus={() => handleFocus('dau')}
                  className="w-16 bg-[#FFFFFF] text-center border border-[#0B2519]/25 rounded px-2 text-xs text-[#FF5C00] font-mono font-bold outline-none focus:border-[#FF5C00] transition"
                  maxLength={3}
                />
              </div>
            </div>

            <SelectInput
              label="Eye Color"
              tag="DAY"
              required
              value={formData.day}
              onChange={val => handleInputChange('day', val)}
              onFocus={() => handleFocus('day')}
            >
              {EYE_COLORS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>

            <SelectInput
              label="Hair Color"
              tag="DAZ"
              value={formData.daz || ''}
              onChange={val => handleInputChange('daz', val)}
              onFocus={() => handleFocus('daz')}
            >
              <option value="">-- Unspecified --</option>
              {HAIR_COLORS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>

            <TextInput
              label="Weight lbs"
              tag="DAW"
              placeholder="Weight (lbs)"
              value={formData.daw || ''}
              onChange={val => handleInputChange('daw', val)}
              onFocus={() => handleFocus('daw')}
              maxLength={3}
            />
          </FormSection>

          {/* Section 4 */}
          <FormSection 
            title="4. PHYSICAL ADDRESS" 
            icon={<MapPin className="h-4 w-4 text-[#FF5C00]" />}
            subtitle="Jurisdiction-anchored street, city, state and postal code"
            action={
              <button
                type="button"
                onClick={handleGenerateAddress}
                className="px-2.5 py-1 bg-[#041A10] hover:bg-[#103825] text-[#D5EFE3] hover:text-white text-[10px] font-mono font-bold rounded border border-[#1A4B36] transition cursor-pointer"
                title={`Generate synthetic address for ${formData.daj || 'jurisdiction'}`}
              >
                <span>⚡ Auto-Gen {formData.daj || 'State'} Address</span>
              </button>
            }
          >
            <TextInput
              label="Street Address"
              tag="DAG"
              required
              placeholder="e.g. 1600 A ST"
              value={formData.dag}
              onChange={val => handleInputChange('dag', val)}
              onFocus={() => handleFocus('dag')}
              onGenerate={handleGenerateAddress}
              generateLabel={`Gen ${formData.daj || 'Addr'}`}
              generateTitle={`Generate realistic street, city and zip for ${formData.daj || 'state'}`}
              className="md:col-span-2"
            />

            <TextInput
              label="City"
              tag="DAI"
              required
              placeholder="CITY NAME"
              value={formData.dai}
              onChange={val => handleInputChange('dai', val)}
              onFocus={() => handleFocus('dai')}
            />

            <SelectInput
              label="State / Province"
              tag="DAJ"
              required
              value={formData.daj}
              onChange={val => handleInputChange('daj', val)}
              onFocus={() => handleFocus('daj')}
            >
              <option value="">-- State/Prov --</option>
              <optgroup label="United States" className="bg-white text-slate-700 font-semibold">
                {US_STATES.map(st => (
                  <option key={st.code} value={st.code}>{st.code} - {st.name}</option>
                ))}
              </optgroup>
              <optgroup label="Canada" className="bg-white text-slate-700 font-semibold">
                {CAN_PROVINCES.map(prov => (
                  <option key={prov.code} value={prov.code}>{prov.code} - {prov.name}</option>
                ))}
              </optgroup>
            </SelectInput>

            <TextInput
              label="Postal / ZIP Code"
              tag="DAK"
              required
              placeholder="ZIP (NO DASHES)"
              value={formData.dak}
              onChange={val => handleInputChange('dak', val)}
              onFocus={() => handleFocus('dak')}
            />
          </FormSection>

          {/* Section 5 */}
          <FormSection 
            title="5. DOCUMENT DETAILS" 
            icon={<FileCode className="h-4 w-4 text-[#FF5C00]" />}
            subtitle="Jurisdictional numbers, dates, real ID and discriminator codes"
            action={
              <button
                type="button"
                onClick={handleGenerateAllDocDetails}
                className="px-2.5 py-1 bg-[#FF5C00] hover:bg-[#FF731E] text-white text-[10px] font-mono font-bold rounded flex items-center gap-1 shadow-xs transition cursor-pointer active:scale-95"
                title="Auto-generate all document numbers (DLN, Issue, Exp, DCF, ICN) based on jurisdiction"
              >
                <Wand2 className="h-3 w-3" />
                <span>Auto-Gen All Doc Numbers</span>
              </button>
            }
          >
            <TextInput
              label="Cust ID / License No"
              tag="DAQ"
              required
              placeholder="e.g. 7379812"
              value={formData.daq}
              onChange={val => handleInputChange('daq', val)}
              onFocus={() => handleFocus('daq')}
              onGenerate={handleGenerateDLN}
              generateLabel={`Gen ${formData.daj || 'DLN'}`}
              generateTitle={`Auto-generate valid license number matching ${formData.daj || 'jurisdiction'} regex pattern`}
              className="md:col-span-2"
            />

            <SelectInput
              label="Country"
              tag="DCG"
              required
              value={formData.dcg}
              onChange={val => handleInputChange('dcg', val)}
              onFocus={() => handleFocus('dcg')}
            >
              <option value="USA">USA</option>
              <option value="CAN">CAN</option>
            </SelectInput>

            <SelectInput
              label="REAL ID Compliance"
              tag="DDA"
              required
              value={formData.dda}
              onChange={val => handleInputChange('dda', val as any)}
              onFocus={() => handleFocus('dda')}
            >
              {COMPLIANCE_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>

            <TextInput
              label="Issue Date"
              tag="DBD"
              required
              placeholder="MMDDYYYY"
              value={formData.dbd}
              onChange={val => formatAsDateString('dbd', val)}
              onFocus={() => handleFocus('dbd')}
              onGenerate={handleGenerateIssueDate}
              generateLabel="Auto Date"
              generateTitle="Generate chronological issue date after 18th birthday"
              maxLength={8}
            />

            <TextInput
              label="Expiry Date"
              tag="DBA"
              required
              placeholder="MMDDYYYY"
              value={formData.dba}
              onChange={val => formatAsDateString('dba', val)}
              onFocus={() => handleFocus('dba')}
              onGenerate={handleGenerateExpiryDate}
              generateLabel="Auto Exp"
              generateTitle={`Generate future expiry date aligned to ${formData.daj || 'State'} renewal cycle`}
              maxLength={8}
            />

            <TextInput
              label="Revision Date"
              tag="DDB"
              placeholder="MMDDYYYY"
              value={formData.ddb || ''}
              onChange={val => formatAsDateString('ddb', val)}
              onFocus={() => handleFocus('ddb')}
              maxLength={8}
            />

            <TextInput
              label="Discriminator (DCF)"
              tag="DCF"
              required
              placeholder="e.g. 6923468092"
              value={formData.dcf}
              onChange={val => handleInputChange('dcf', val)}
              onFocus={() => handleFocus('dcf')}
              onGenerate={handleGenerateDCF}
              generateLabel="Gen DCF"
              generateTitle="Generate compliant audit/document discriminator code"
            />

            <TextInput
              label="Inventory Control No"
              tag="DCK"
              placeholder="State Inventory Control No"
              value={formData.dck || ''}
              onChange={val => handleInputChange('dck', val)}
              onFocus={() => handleFocus('dck')}
              onGenerate={handleGenerateICN}
              generateLabel="Gen ICN"
              generateTitle="Generate state stock serial / ICN number"
            />

            <SelectInput
              label="Race / Ethnicity"
              tag="DCL"
              value={formData.dcl || ''}
              onChange={val => handleInputChange('dcl', val)}
              onFocus={() => handleFocus('dcl')}
            >
              <option value="">-- Choose Option --</option>
              {RACE_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>
          </FormSection>

          {/* Section 6 */}
          <FormSection title="6. PRIVILEGES & TRUNCATION" icon={<FileText className="h-4 w-4 text-[#FF5C00]" />} subtitle="Driving privileges, endorsements, and standard field truncation flags">
            <TextInput
              label="Vehicle Class"
              tag="DCA"
              placeholder="e.g. C, D"
              value={formData.dca || ''}
              onChange={val => handleInputChange('dca', val)}
              onFocus={() => handleFocus('dca')}
            />

            <TextInput
              label="Restrictions"
              tag="DCB"
              placeholder="e.g. NONE, B"
              value={formData.dcb || ''}
              onChange={val => handleInputChange('dcb', val)}
              onFocus={() => handleFocus('dcb')}
            />

            <TextInput
              label="Endorsements"
              tag="DCD"
              placeholder="e.g. NONE, M"
              value={formData.dcd || ''}
              onChange={val => handleInputChange('dcd', val)}
              onFocus={() => handleFocus('dcd')}
            />

            <SelectInput
              label="Surname Truncated?"
              tag="DDE"
              required
              value={formData.dde}
              onChange={val => handleInputChange('dde', val as any)}
              onFocus={() => handleFocus('dde')}
            >
              {TRUNCATION_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>

            <SelectInput
              label="Given Truncated?"
              tag="DDF"
              required
              value={formData.ddf}
              onChange={val => handleInputChange('ddf', val as any)}
              onFocus={() => handleFocus('ddf')}
            >
              {TRUNCATION_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>

            <SelectInput
              label="Middle Truncated?"
              tag="DDG"
              required
              value={formData.ddg}
              onChange={val => handleInputChange('ddg', val as any)}
              onFocus={() => handleFocus('ddg')}
            >
              {TRUNCATION_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </SelectInput>
          </FormSection>
        </div>

        {/* RIGHT PANEL - Live Output dashboard */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pl-1">
          
          {/* Verification banner if errors exist */}
          {validationError && (
            <div className="bg-[#FFF0F1] border border-rose-300 text-rose-800 rounded-xl p-3.5 text-xs font-bold font-mono flex gap-2 items-start shadow-md animate-pulse">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5 animate-bounce" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Live Barcode Result Card */}
          <div className="bg-[#FAF7EC] border border-[#0B2519]/15 rounded-xl p-5 flex flex-col gap-4 shadow-lg text-[#0A2A1A]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#0B2519]/70 uppercase tracking-widest font-mono">
                PDF417 Standard Output
              </h3>
              {previewImageUrl && (
                <span className="text-[9px] bg-[#FFE6D5] text-[#FF5C00] font-bold px-2 py-0.5 rounded-full border border-[#FF5C00]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] animate-pulse"></span>
                  LIVE RENDER
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#0B2519]/80 font-sans">
                  Export Background
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBackgroundMode('transparent')}
                    className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wide transition ${backgroundMode === 'transparent' ? 'bg-[#FF5C00] text-white border-[#FF5C00]' : 'bg-white text-[#0B2519]/70 border-[#0B2519]/20 hover:border-[#FF5C00]/40'}`}
                  >
                    Transparent
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundMode('white')}
                    className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wide transition ${backgroundMode === 'white' ? 'bg-[#FF5C00] text-white border-[#FF5C00]' : 'bg-white text-[#0B2519]/70 border-[#0B2519]/20 hover:border-[#FF5C00]/40'}`}
                  >
                    White BG
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full bg-white rounded-lg p-1 flex items-center justify-center border border-[#0B2519]/25 select-all shadow-xs relative group overflow-hidden">
              {previewImageUrl ? (
                <img 
                  src={previewImageUrl} 
                  alt="AAMVA PDF417 Barcode Output" 
                  className="w-full max-h-[220px] object-contain cursor-crosshair select-all block"
                  id="barcode-image-output"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center text-[#0B2519]/50 font-mono text-xs py-8">
                  Fill fields and click Generate below
                </div>
              )}
              
              {previewImageUrl && (
                <div className="absolute inset-0 bg-[#03130C]/95 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200 rounded p-2 text-center select-none gap-1 border border-[#FF5C00]/20">
                  <span className="text-[#FF5C00] font-black text-[10px] uppercase tracking-[0.1em] font-mono">
                    Long Press (Mobile)
                  </span>
                  <span className="text-white/80 text-[10px] font-sans">
                    or Right-Click (Desktop) to Save Image
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-[#0B2519]/60 font-mono font-bold">
              <span>Encoding: Class A</span>
              <span>AAMVA Compliant</span>
            </div>
          </div>

          {/* Generate PDF 17 Barcode ACTION Button */}
          <button
            onClick={generateBarcode}
            id="btn-generate"
            className="w-full py-4 bg-[#FF5C00] hover:bg-[#FF731E] text-white font-black uppercase text-xs tracking-[0.2em] rounded shadow-[0_4px_24px_rgba(255,92,0,0.35)] transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
            <span>Generate PDF 17 Barcode</span>
          </button>

        </div>

      </div>

      {/* METADATA BAR FOOTER */}
      <footer className="py-4 bg-[#03130C] border-t border-[#0B2D1C] text-center select-none shrink-0 mt-auto">
        <div className="px-6 flex flex-col md:flex-row items-center justify-between gap-2 max-w-7xl mx-auto text-emerald-500/60 font-mono text-[9px] tracking-wide uppercase font-semibold">
          <span>Bryt Barcode Tec • AAMVA Standard 2026</span>
          <span>Secure Client-Side Engine • Compliant Standard PDF417</span>
        </div>
      </footer>

      {/* COMPILATION OUTPUT MODAL */}
      <AnimatePresence>
        {showOutputModal && (
          <div className="fixed inset-0 z-50 bg-[#03130C]/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#FAF7EC] border border-[#0B2519]/25 rounded-2xl max-w-2xl w-full shadow-[0_12px_40px_rgba(3,19,12,0.4)] overflow-hidden flex flex-col relative text-[#061E13]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#0B2519]/15 flex items-center justify-between bg-[#EFECE0]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C00] animate-pulse"></span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#061E13] font-sans">
                    AAMVA Compliant Barcode Compiled
                  </h3>
                </div>
                <button
                  onClick={() => setShowOutputModal(false)}
                   className="text-[#0B2519]/60 hover:text-[#061E13] p-1 rounded-lg hover:bg-[#E2DEC2] transition cursor-pointer"
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-6 max-h-[calc(85vh-80px)] overflow-y-auto">
                {/* Barcode Output Panel */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full bg-white p-2 rounded-xl flex items-center justify-center border border-[#0B2519]/25 shadow-xs overflow-hidden relative group">
                    <img
                      src={previewImageUrl}
                      alt="Compiled PDF417 Barcode"
                      className="w-full max-h-[180px] object-contain cursor-zoom-in block"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[10px] text-[#0B2519]/60 font-mono text-center font-bold">
                    💡 This standard high-resolution PDF417 contains all structured demographic fields configured under the AAMVA v09/v10 Specification.
                  </p>
                </div>

                {/* Encoded Demographic Metadata Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-[#0B2519]/15 p-4 rounded-xl shadow-sm">
                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-black text-[#FF5C00] uppercase tracking-widest font-mono">
                      Decoded Identity Fields
                    </h4>
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#0B2519]/10">
                        <span className="text-[#0B2519]/60 font-medium font-sans">Full Name</span>
                        <span className="text-[#061E13] font-extrabold uppercase font-mono">
                          {formData.dcs}, {formData.dac} {formData.dad ? formData.dad.slice(0, 1) + '.' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#0B2519]/10">
                        <span className="text-[#0B2519]/60 font-medium font-sans">Date of Birth</span>
                        <span className="text-[#061E13] font-extrabold font-mono">
                          {formData.dbb ? `${formData.dbb.slice(0, 2)}/${formData.dbb.slice(2, 4)}/${formData.dbb.slice(4)}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#0B2519]/10">
                        <span className="text-[#0B2519]/60 font-medium font-sans">License / ID No</span>
                        <span className="text-[#061E13] font-extrabold font-mono uppercase">{formData.daq}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-black text-[#FF5C00] uppercase tracking-widest font-mono">
                      Document Metadata
                    </h4>
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#0B2519]/10">
                        <span className="text-[#0B2519]/60 font-medium font-sans">Issuer State</span>
                        <span className="text-[#061E13] font-extrabold font-mono uppercase">{formData.daj}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#0B2519]/10">
                        <span className="text-[#0B2519]/60 font-medium font-sans">Expiration</span>
                        <span className="text-[#061E13] font-extrabold font-mono">
                          {formData.dba ? `${formData.dba.slice(0, 2)}/${formData.dba.slice(2, 4)}/${formData.dba.slice(4)}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#0B2519]/10">
                        <span className="text-[#0B2519]/60 font-medium font-sans">REAL ID Code</span>
                        <span className="text-[#061E13] font-extrabold font-mono">{formData.dda === 'F' ? 'REAL ID (F)' : 'Non-Compliant (N)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <button
                    onClick={downloadBarcode}
                    className="flex-1 py-3 bg-[#FF5C00] hover:bg-[#FF731E] text-white font-extrabold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Download PNG Barcode</span>
                  </button>
                  <button
                    onClick={copyBarcodeImageToClipboard}
                    className="flex-1 py-3 bg-white hover:bg-slate-50 border border-[#0B2519]/25 hover:text-[#061E13] text-[#061E13] font-extrabold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>{isImageCopied ? 'Copied PNG!' : 'Copy PNG Image'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT PORTAL SAVED PROFILES DRAWER */}
      <AnimatePresence>
        {showSavedProfilesDrawer && (
          <div className="fixed inset-0 z-50 bg-[#03130C]/85 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#FAF7EC] w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#0B2519]/20 text-[#061E13]"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-[#0B2519]/15 flex items-center justify-between bg-[#EFECE0]">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-[#FF5C00]" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#061E13] font-sans">
                      Client Portal Profiles
                    </h3>
                    <p className="text-[10px] text-[#0B2519]/60 font-sans">
                      Saved client cases and preloaded jurisdictional templates
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSavedProfilesDrawer(false)}
                  className="text-[#0B2519]/60 hover:text-[#061E13] p-1.5 rounded-lg hover:bg-[#E2DEC2] transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Quick Action Bar */}
              <div className="p-4 bg-white border-b border-[#0B2519]/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    handleSaveCurrentProfile();
                  }}
                  className="flex-1 py-2 px-3 bg-[#FF5C00] hover:bg-[#FF731E] text-white text-xs font-bold font-sans rounded flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <FolderDown className="h-3.5 w-3.5" />
                  <span>Save Current Form to Profiles</span>
                </button>
                {savedProfiles.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all your saved profiles?')) {
                        setSavedProfiles([]);
                        if (currentUser?.id) {
                          PortalStore.clearSavedProfiles(currentUser.id);
                        }
                        setToastMessage('Cleared your saved profiles');
                        setTimeout(() => setToastMessage(null), 2500);
                      }
                    }}
                    className="py-2 px-3 bg-[#1B1410] hover:bg-[#2B1B15] text-[#FF9E66] text-xs font-bold rounded border border-[#FF5C00]/30 transition cursor-pointer"
                    title="Clear all profiles"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Profile Records List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#0B2519]/60 tracking-wider font-mono px-1">
                  <span>Generated Barcodes & Saved Profiles ({savedProfiles.length})</span>
                </div>

                {savedProfiles.length === 0 ? (
                  <div className="bg-white border border-[#0B2519]/10 rounded-xl p-8 text-center text-[#0B2519]/60 text-xs flex flex-col items-center gap-2">
                    <Bookmark className="h-8 w-8 text-[#FF5C00]/40" />
                    <p className="font-bold text-[#061E13]">No barcodes generated yet</p>
                    <p className="text-[11px] text-[#0B2519]/50">Fill the client portal form and click &quot;Compile Standard Barcode&quot; to generate and save here automatically.</p>
                  </div>
                ) : (
                  savedProfiles.map(prof => (
                    <div
                      key={prof.id}
                      className="bg-white border border-[#0B2519]/15 hover:border-[#FF5C00]/50 rounded-xl p-3.5 shadow-xs transition flex flex-col gap-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-[#041A10] text-[#FF5C00] font-mono font-bold text-xs flex items-center justify-center border border-[#1A4B36]">
                            {prof.jurisdiction}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-[#061E13] leading-snug">
                              {prof.title}
                            </h4>
                            <span className="text-[10px] text-[#0B2519]/50 font-mono">
                              {prof.createdAt}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSavedProfiles(prev => prev.filter(p => p.id !== prof.id));
                            setToastMessage(`Deleted profile: ${prof.title}`);
                            setTimeout(() => setToastMessage(null), 2500);
                          }}
                          className="opacity-60 hover:opacity-100 text-[#0B2519]/40 hover:text-red-600 p-1 transition cursor-pointer"
                          title="Delete profile"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Barcode Image Preview Thumbnail if generated */}
                      {prof.imageUrl && (
                        <div className="bg-white p-2 rounded border border-[#0B2519]/10 flex items-center justify-center">
                          <img
                            src={prof.imageUrl}
                            alt="Generated Barcode Thumbnail"
                            className="max-h-16 object-contain rounded"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-[#FAF7EC] p-2 rounded border border-[#0B2519]/10">
                        <div>
                          <span className="text-[#0B2519]/50 block">Cardholder:</span>
                          <span className="font-bold text-[#061E13]">
                            {prof.data.dac} {prof.data.dcs}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#0B2519]/50 block">DLN / License:</span>
                          <span className="font-bold text-[#061E13]">
                            {prof.data.daq || 'None'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            handleLoadSyntheticRecord(prof.data, `📋 Loaded Profile: ${prof.title}`);
                            setShowSavedProfilesDrawer(false);
                          }}
                          className="flex-1 py-1.5 bg-[#FAF7EC] hover:bg-[#FFE6D5] text-[#061E13] hover:text-[#FF5C00] font-bold text-[11px] rounded border border-[#0B2519]/15 hover:border-[#FF5C00]/40 transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                        >
                          <span>Load into Form</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>

                        {prof.barcodeString && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(prof.barcodeString || '');
                              setToastMessage('📋 Copied AAMVA payload to clipboard!');
                              setTimeout(() => setToastMessage(null), 2500);
                            }}
                            className="p-1.5 bg-[#FAF7EC] hover:bg-[#FFE6D5] text-[#061E13] hover:text-[#FF5C00] font-bold text-[11px] rounded border border-[#0B2519]/15 hover:border-[#FF5C00]/40 transition cursor-pointer"
                            title="Copy AAMVA raw payload string"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRC-20 USDT CHECKOUT & TOKEN DEPOSIT MODAL */}
      <Trc20Checkout
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        user={currentUser}
        onBalanceUpdated={updated => setCurrentUser(updated)}
      />

    </div>
  );
}
