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
  HelpCircle
} from 'lucide-react';
import { AAMVAData, FieldHelp } from './types';
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

type BarcodeBackgroundMode = 'transparent' | 'white';

export default function App() {
  // Form State
  const [formData, setFormData] = useState<AAMVAData>(DEFAULT_ALASKA_DEMO);
  
  // Height Selector Support
  // 600 default (6'0")
  const [heightFeet, setHeightFeet] = useState<number>(6);
  const [heightInches, setHeightInches] = useState<number>(0);

  // Active help guide state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Output State
  const [generatedString, setGeneratedString] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isImageCopied, setIsImageCopied] = useState<boolean>(false);
  const [showOutputModal, setShowOutputModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [backgroundMode, setBackgroundMode] = useState<BarcodeBackgroundMode>('white');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const createFixedSizeBarcodeCanvas = (sourceCanvas: HTMLCanvasElement, mode: BarcodeBackgroundMode): HTMLCanvasElement => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 2470;
    finalCanvas.height = 490;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) {
      return finalCanvas;
    }

    if (mode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    } else {
      ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
    }

    const innerWidth = finalCanvas.width - 4;
    const innerHeight = finalCanvas.height - 4;
    const scale = Math.min(innerWidth / sourceCanvas.width, innerHeight / sourceCanvas.height, 1);
    const drawWidth = Math.round(sourceCanvas.width * scale);
    const drawHeight = Math.round(sourceCanvas.height * scale);
    const offsetX = Math.round((finalCanvas.width - drawWidth) / 2);
    const offsetY = Math.round((finalCanvas.height - drawHeight) / 2);

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
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

  // Generate compliance barcode
  const generateBarcode = () => {
    setValidationError('');

    try {
      const aamvaString = compileAAMVAString(formData);
      setGeneratedString(aamvaString);

      if (canvasRef.current) {
        renderBarcode(aamvaString, true);
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

  return (
    <div className="min-h-screen bg-[#061C12] text-[#D5EFE3] font-sans flex flex-col antialiased">
      {/* HIDDEN WORKING CANVAS FOR BWIP-JS GENERATION */}
      <canvas id="barcodeCanvas" ref={canvasRef} style={{ display: 'none' }} />

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 bg-[#03130C] border-b border-[#0B2D1C] shadow-xl">
        <div className="w-full max-w-7xl mx-auto px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF5C00] rounded flex items-center justify-center text-white font-extrabold shadow-[0_0_14px_rgba(255,92,0,0.45)]">
              <span className="text-[12px] font-mono tracking-tight font-black">BBT</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase font-sans">
                Bryt Barcode <span className="text-[#FF5C00]">Tec</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] bg-[#041A10] border border-[#FF5C00]/30 px-1.5 py-0.5 rounded text-[#FF5C00] font-mono font-bold">v10.4-STABLE</span>
                <span className="text-[9px] text-emerald-500 font-mono uppercase hidden sm:inline">Encryption Engine: Client-side BWIP-JS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={loadDemoData}
              id="btn-load-demo"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0C2A1E] hover:bg-[#123E2C] hover:text-white text-[#D5EFE3] text-xs font-semibold rounded border border-[#1A4B36] transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#FF5C00]" />
              <span>Rodgers Demo</span>
            </button>
            <button
              onClick={clearForm}
              id="btn-clear"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FF5C00] hover:bg-[#FF731E] hover:shadow-[0_0_12px_rgba(255,115,30,0.3)] text-white text-xs font-bold rounded transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEXTUAL HELP BANNER (Ticker style) */}
      <div className="bg-[#FAF7EC] border-b border-[#0B2519]/15 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C00] animate-pulse shadow-[0_0_8px_rgba(255,92,0,0.6)] shrink-0"></div>
          <p className="text-xs font-mono text-[#0B2519]/80 flex-1 leading-snug">
            <span className="opacity-60 text-[#FF5C00] font-bold uppercase mr-1.5 font-sans">
              HELP {currentHint.fieldName !== 'general' ? `[Tag: ${currentHint.fieldName.toUpperCase()}]` : '[GUIDE]'}:
            </span> 
            <span className="font-extrabold text-[#061E13]">{currentHint.title}</span> — <span className="font-medium text-[#0A2A1A]">{currentHint.hint}</span>
          </p>
        </div>
      </div>

      {/* SPLIT DASHBOARD SECTION */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT PANEL - Form sections */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-1">
          
          <div className="bg-[#FAF7EC]/5 border border-[#FF5C00]/20 rounded-xl p-4 flex items-start gap-3 select-none">
            <div className="w-5 h-5 bg-[#FF5C00]/10 border border-[#FF5C00]/35 rounded flex items-center justify-center text-[#FF5C00] shrink-0 text-xs font-mono font-black">
              i
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wider text-white uppercase font-sans">
                Non-Compulsory Compiler Active
              </h3>
              <p className="text-[11px] text-[#D5EFE3]/70 font-sans mt-1 leading-relaxed">
                We have disabled mandatory field requirements as requested! Fill whichever fields you need, and they will compile precisely into the AAMVA standard string string-by-string. Blank fields are bypassed gracefully with no errors.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <FormSection title="1. DOCUMENT HEADER (HDR)" icon={<Sliders className="h-4 w-4 text-[#FF5C00]" />}>
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
          <FormSection title="2. PERSONAL INFORMATION" icon={<User className="h-4 w-4 text-[#FF5C00]" />}>
            <TextInput
              label="Last Name"
              tag="DCS"
              required
              placeholder="LAST NAME ONLY"
              value={formData.dcs}
              onChange={val => handleInputChange('dcs', val)}
              onFocus={() => handleFocus('dcs')}
            />

            <TextInput
              label="First Name"
              tag="DAC"
              required
              placeholder="FIRST NAME ONLY"
              value={formData.dac}
              onChange={val => handleInputChange('dac', val)}
              onFocus={() => handleFocus('dac')}
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
          <FormSection title="3. PHYSICAL DESCRIPTION" icon={<Compass className="h-4 w-4 text-[#FF5C00]" />}>
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
          <FormSection title="4. PHYSICAL ADDRESS" icon={<MapPin className="h-4 w-4 text-[#FF5C00]" />}>
            <TextInput
              label="Street Address"
              tag="DAG"
              required
              placeholder="e.g. 1600 A ST"
              value={formData.dag}
              onChange={val => handleInputChange('dag', val)}
              onFocus={() => handleFocus('dag')}
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
          <FormSection title="5. DOCUMENT DETAILS" icon={<FileCode className="h-4 w-4 text-[#FF5C00]" />}>
            <TextInput
              label="Cust ID / License No"
              tag="DAQ"
              required
              placeholder="e.g. 7379812"
              value={formData.daq}
              onChange={val => handleInputChange('daq', val)}
              onFocus={() => handleFocus('daq')}
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
            />

            <TextInput
              label="Inventory Control No"
              tag="DCK"
              placeholder="State Inventory Control No"
              value={formData.dck || ''}
              onChange={val => handleInputChange('dck', val)}
              onFocus={() => handleFocus('dck')}
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
          <FormSection title="6. PRIVILEGES & TRUNCATION" icon={<FileText className="h-4 w-4 text-[#FF5C00]" />}>
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

            <div className="aspect-[3/1] bg-white rounded-lg p-4 flex items-center justify-center border-4 border-[#0B2519]/40 select-all shadow-inner relative group min-h-[140px] max-h-[180px] overflow-hidden">
              {previewImageUrl ? (
                <img 
                  src={previewImageUrl} 
                  alt="AAMVA PDF417 Barcode Output" 
                  className="max-h-[140px] max-w-full object-contain cursor-crosshair select-all"
                  id="barcode-image-output"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center text-[#0B2519]/50 font-mono text-xs py-5">
                  Fill required fields and click Compile below
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

          {/* Raw Compilation Logger Card */}
          <div className="bg-[#FAF7EC] border border-[#0B2519]/15 rounded-xl p-5 flex flex-col gap-3.5 shadow-lg flex-1 min-h-[220px]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#0B2519]/70 uppercase tracking-widest font-mono">
                Raw AAMVA Parser
              </h3>
              {generatedString && (
                <button 
                  onClick={copyRawStringToClipboard}
                  id="btn-copy-string"
                  className="text-[10px] font-black font-mono bg-[#FFE6D5] text-[#FF5C00] hover:bg-[#FFDCC2] px-2.5 py-1 rounded border border-[#FF5C00]/40 transition cursor-pointer flex items-center gap-1"
                  title="Copy standard payload structure"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>COPY STRING</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 bg-white rounded border border-[#0B2519]/15 p-3.5 font-mono text-[10px] text-[#0F3A20] overflow-y-auto leading-relaxed select-all max-h-[260px] shadow-inner font-bold">
              {generatedString ? (
                getReadableAAMVAString(generatedString)
                  .split('\n')
                  .map((line, idx) => (
                    <div key={idx} className={line.startsWith('DCS') ? 'text-[#FF5C00] bg-[#FFF0E2] px-1 rounded border border-[#FF5C00]/10 font-black' : ''}>
                      {line}
                    </div>
                  ))
              ) : (
                <span className="text-[#0B2519]/40 font-mono">No parsed segments compilable yet.</span>
              )}
            </div>

            {generatedString ? (
              <div className="flex justify-between items-center text-[10px] text-[#0B2519]/60 font-mono font-bold">
                <span>Size: {generatedString.length} Bytes</span>
                <span>Subfiles count: 01</span>
              </div>
            ) : null}
          </div>

          {/* Compile ACTION Button */}
          <button
            onClick={generateBarcode}
            id="btn-generate"
            className="w-full py-4 bg-[#FF5C00] hover:bg-[#FF731E] text-white font-black uppercase text-xs tracking-[0.2em] rounded shadow-[0_4px_24px_rgba(255,92,0,0.35)] transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
            <span>Compile Standard Barcode</span>
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
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-6 max-h-[calc(85vh-80px)] overflow-y-auto">
                {/* Barcode Output Panel */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full bg-white p-6 rounded-xl flex items-center justify-center border-4 border-[#0B2519]/40 shadow-inner overflow-hidden min-h-[140px] relative group">
                    <img
                      src={previewImageUrl}
                      alt="Compiled PDF417 Barcode"
                      className="max-h-[140px] max-w-full object-contain cursor-zoom-in"
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

    </div>
  );
}

// Minimal Clean Inline Custom SVG Icon representation of Close/X to avoid bundling errors
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
