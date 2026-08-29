import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  Terminal, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ShieldCheck, 
  ArrowRight,
  Database,
  Code2,
  BookOpen
} from 'lucide-react';
import { AAMVAData } from '../types';
import { 
  JURISDICTION_RULES, 
  generateSyntheticDataset, 
  generateSyntheticRecord,
  exportDatasetAsJSON, 
  exportDatasetAsCSV, 
  exportDatasetAsRawAAMVA 
} from '../utils/mockGenerator';

interface MockDataSuiteProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadRecord: (record: AAMVAData) => void;
}

export function MockDataSuite({ isOpen, onClose, onLoadRecord }: MockDataSuiteProps) {
  const [activeTab, setActiveTab] = useState<'dataset' | 'python' | 'patterns'>('dataset');

  // Generator Configuration State
  const [selectedStates, setSelectedStates] = useState<string[]>(['CA', 'NY', 'TX', 'FL', 'IL', 'AK']);
  const [recordsPerState, setRecordsPerState] = useState<number>(5);
  const [dateMode, setDateMode] = useState<'MMDDYYYY' | 'YYYYMMDD'>('MMDDYYYY');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generated Dataset State
  const [dataset, setDataset] = useState<AAMVAData[]>(() => {
    return generateSyntheticDataset({
      states: ['CA', 'NY', 'TX', 'FL', 'IL', 'AK'],
      recordsPerState: 3,
      dateMode: 'MMDDYYYY'
    });
  });

  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [loadedRecordDln, setLoadedRecordDln] = useState<string | null>(null);

  const allStateCodes = useMemo(() => Object.keys(JURISDICTION_RULES).sort(), []);

  // Filtered dataset for preview
  const filteredDataset = useMemo(() => {
    if (!searchQuery.trim()) return dataset;
    const q = searchQuery.toLowerCase();
    return dataset.filter(r => 
      r.daj.toLowerCase().includes(q) ||
      r.daq.toLowerCase().includes(q) ||
      r.dcs.toLowerCase().includes(q) ||
      r.dac.toLowerCase().includes(q) ||
      r.dai.toLowerCase().includes(q) ||
      r.iin.includes(q)
    );
  }, [dataset, searchQuery]);

  const handleGenerate = () => {
    const statesToUse = selectedStates.length > 0 ? selectedStates : allStateCodes;
    const newDataset = generateSyntheticDataset({
      states: statesToUse,
      recordsPerState,
      dateMode
    });
    setDataset(newDataset);
  };

  const handleSelectAllStates = () => {
    if (selectedStates.length === allStateCodes.length) {
      setSelectedStates([]);
    } else {
      setSelectedStates([...allStateCodes]);
    }
  };

  const toggleState = (code: string) => {
    setSelectedStates(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleDownloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  const handleLoadAndClose = (record: AAMVAData) => {
    onLoadRecord(record);
    setLoadedRecordDln(record.daq);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const PYTHON_SCRIPT_CODE = `#!/usr/bin/env python3
"""
AAMVA Synthetic Driver's License & ID Card Record Generator
============================================================
A robust, standalone Python engine to generate high-fidelity synthetic driver's
license records adhering to the AAMVA DL/ID Card Design Standard.
Supports all 50 US states + DC with exact DLN pattern masks, IINs, and date logic.
"""

import argparse
import csv
import datetime
import json
import random
import sys
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple

# Full standalone engine available in /mock_aamva_generator.py
# Run with: python3 mock_aamva_generator.py --records-per-state 15 --format json --output dataset.json
`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#03130C]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-[#FAF7EC] border border-[#0B2519]/25 rounded-2xl w-full max-w-6xl h-[90vh] shadow-[0_16px_50px_rgba(3,19,12,0.5)] flex flex-col overflow-hidden text-[#061E13]">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-[#0B2519]/15 flex items-center justify-between bg-[#EFECE0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF5C00] flex items-center justify-center text-white font-mono font-black shadow-[0_0_10px_rgba(255,92,0,0.4)]">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider text-[#061E13] font-sans">
                  AAMVA Mock Data & Benchmark Suite
                </h2>
                <span className="text-[10px] bg-[#FF5C00]/15 text-[#FF5C00] font-mono font-bold px-2 py-0.5 rounded border border-[#FF5C00]/30">
                  50 States + DC
                </span>
              </div>
              <p className="text-xs text-[#0B2519]/60 font-sans">
                Generate high-fidelity synthetic DL/ID records with strict chronological validation for parser benchmarking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="bg-white/80 p-1 rounded-lg border border-[#0B2519]/15 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('dataset')}
                className={`px-3 py-1.5 rounded text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dataset' 
                    ? 'bg-[#FF5C00] text-white shadow-sm' 
                    : 'text-[#0B2519]/70 hover:text-[#061E13]'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Synthetic Generator</span>
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'python' 
                    ? 'bg-[#FF5C00] text-white shadow-sm' 
                    : 'text-[#0B2519]/70 hover:text-[#061E13]'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Python Script</span>
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`px-3 py-1.5 rounded text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'patterns' 
                    ? 'bg-[#FF5C00] text-white shadow-sm' 
                    : 'text-[#0B2519]/70 hover:text-[#061E13]'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>50-State DLN Masks</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-[#0B2519]/60 hover:text-[#061E13] p-1.5 rounded-lg hover:bg-[#E2DEC2] transition cursor-pointer ml-2"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-[#FAF7EC]">
          
          {/* TAB 1: DATASET GENERATOR */}
          {activeTab === 'dataset' && (
            <div className="flex flex-col gap-5 flex-1 min-h-0">
              
              {/* Controls Bar */}
              <div className="bg-white border border-[#0B2519]/15 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  
                  {/* States Multi-Select Summary & Quick Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B2519]/80 font-sans">
                      Target Jurisdictions:
                    </span>
                    <button
                      onClick={handleSelectAllStates}
                      className="text-[11px] font-mono font-bold bg-[#EFECE0] hover:bg-[#E2DEC2] text-[#061E13] px-2.5 py-1 rounded border border-[#0B2519]/20 transition cursor-pointer"
                    >
                      {selectedStates.length === allStateCodes.length ? 'Deselect All' : `All 51 Jurisdictions (${selectedStates.length})`}
                    </button>
                  </div>

                  {/* Settings: Records Count & Date Mode */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-[#0B2519]/80 font-sans">
                        Records / State:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={recordsPerState}
                        onChange={e => setRecordsPerState(Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1)))}
                        className="w-16 bg-[#FAF7EC] border border-[#0B2519]/25 rounded px-2 py-1 text-xs font-mono font-bold text-center outline-none focus:border-[#FF5C00]"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-[#0B2519]/60 mr-1">Presets:</span>
                      {[
                        { label: '50', rps: 1 },
                        { label: '500', rps: 10 },
                        { label: '1,000', rps: 20 },
                        { label: '5,000', rps: 100 },
                        { label: '10,000', rps: 200 }
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setSelectedStates([...allStateCodes]);
                            setRecordsPerState(preset.rps);
                          }}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#EFECE0] hover:bg-[#E2DEC2] text-[#061E13] rounded border border-[#0B2519]/20 transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-[#0B2519]/80 font-sans">
                        Date Format:
                      </label>
                      <select
                        value={dateMode}
                        onChange={e => setDateMode(e.target.value as any)}
                        className="bg-[#FAF7EC] border border-[#0B2519]/25 rounded px-2.5 py-1 text-xs font-mono font-bold outline-none cursor-pointer"
                      >
                        <option value="MMDDYYYY">MMDDYYYY (Form Mode)</option>
                        <option value="YYYYMMDD">YYYYMMDD (AAMVA Spec)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF731E] text-white text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>Generate ({selectedStates.length * recordsPerState} Non-Repeating Records)</span>
                    </button>
                  </div>
                </div>

                {/* State Tag Selector Chips */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-2 border-t border-[#0B2519]/10">
                  {allStateCodes.map(code => {
                    const isSelected = selectedStates.includes(code);
                    return (
                      <button
                        key={code}
                        onClick={() => toggleState(code)}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF5C00] text-white'
                            : 'bg-[#FAF7EC] text-[#0B2519]/60 hover:bg-[#EFECE0] border border-[#0B2519]/15'
                        }`}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Toolbar: Search + Export Options */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="h-4 w-4 text-[#0B2519]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by state, DLN, surname, city, IIN..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#0B2519]/20 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#061E13] outline-none focus:border-[#FF5C00] transition"
                  />
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleDownloadFile(exportDatasetAsJSON(dataset), `aamva_synthetic_dataset_${dataset.length}.json`, 'application/json')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EFECE0] text-[#061E13] text-xs font-bold font-mono rounded border border-[#0B2519]/20 transition cursor-pointer"
                    title="Download JSON dataset"
                  >
                    <FileJson className="h-3.5 w-3.5 text-[#FF5C00]" />
                    <span>Download JSON</span>
                  </button>

                  <button
                    onClick={() => handleDownloadFile(exportDatasetAsCSV(dataset), `aamva_synthetic_dataset_${dataset.length}.csv`, 'text/csv')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EFECE0] text-[#061E13] text-xs font-bold font-mono rounded border border-[#0B2519]/20 transition cursor-pointer"
                    title="Download CSV dataset"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={() => handleDownloadFile(exportDatasetAsRawAAMVA(dataset), `aamva_raw_payloads_${dataset.length}.txt`, 'text/plain')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EFECE0] text-[#061E13] text-xs font-bold font-mono rounded border border-[#0B2519]/20 transition cursor-pointer"
                    title="Download raw AAMVA text payloads"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-700" />
                    <span>Raw Payloads (.txt)</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(exportDatasetAsJSON(dataset), 'json')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 text-[#FF5C00] text-xs font-bold font-mono rounded border border-[#FF5C00]/30 transition cursor-pointer"
                  >
                    {copiedType === 'json' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedType === 'json' ? 'Copied JSON!' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 bg-white border border-[#0B2519]/15 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
                <div className="overflow-x-auto flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead className="bg-[#EFECE0] sticky top-0 z-10 border-b border-[#0B2519]/15 text-[#061E13]">
                      <tr>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">State</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">IIN</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">DLN (DAQ)</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">Full Name</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">DOB (DBB)</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">Issue (DBD)</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">Exp (DBA)</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">Address & City</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px]">REAL ID</th>
                        <th className="py-2.5 px-3 font-extrabold uppercase text-[10px] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0B2519]/10">
                      {filteredDataset.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-[#0B2519]/50 font-sans text-xs">
                            No synthetic records matched your search query.
                          </td>
                        </tr>
                      ) : (
                        filteredDataset.map((rec, idx) => {
                          const isLoaded = loadedRecordDln === rec.daq;
                          return (
                            <tr key={idx} className="hover:bg-[#FAF7EC] transition">
                              <td className="py-2 px-3 font-bold text-[#FF5C00]">{rec.daj}</td>
                              <td className="py-2 px-3 text-[#0B2519]/70">{rec.iin}</td>
                              <td className="py-2 px-3 font-extrabold text-[#061E13]">{rec.daq}</td>
                              <td className="py-2 px-3 font-medium font-sans text-[#061E13]">
                                {rec.dcs}, {rec.dac} {rec.dad ? `${rec.dad[0]}.` : ''}
                              </td>
                              <td className="py-2 px-3 text-[#0B2519]/80">{rec.dbb}</td>
                              <td className="py-2 px-3 text-[#0B2519]/80">{rec.dbd}</td>
                              <td className="py-2 px-3 font-bold text-emerald-800">{rec.dba}</td>
                              <td className="py-2 px-3 font-sans text-[#0B2519]/70 truncate max-w-[180px]">
                                {rec.dag}, {rec.dai} {rec.dak}
                              </td>
                              <td className="py-2 px-3">
                                {rec.dda === 'F' ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                                    REAL ID
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300">
                                    Standard
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => handleLoadAndClose(rec)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold font-sans transition inline-flex items-center gap-1 cursor-pointer ${
                                    isLoaded
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#FF5C00] hover:bg-[#FF731E] text-white shadow-xs'
                                  }`}
                                  title="Load record into editor & generate live barcode"
                                >
                                  {isLoaded ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      <span>Loaded!</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Load</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Stats */}
                <div className="p-3 bg-[#EFECE0] border-t border-[#0B2519]/15 flex items-center justify-between text-[11px] font-mono text-[#0B2519]/70">
                  <span>Showing {filteredDataset.length} of {dataset.length} synthetic records</span>
                  <span>Strict Chronological Ordering Enforced: DOB &lt; Issue &lt; Today &lt; Expiry</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PYTHON SCRIPT & CLI */}
          {activeTab === 'python' && (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="bg-white border border-[#0B2519]/15 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#061E13] font-sans flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[#FF5C00]" />
                    <span>Standalone Python Mock Data Specialist Engine</span>
                  </h3>
                  <p className="text-xs text-[#0B2519]/60 font-sans mt-0.5">
                    Execute the CLI script directly on terminal environments for mock testing, regex validation, or batch barcode benchmarks.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetch('/mock_aamva_generator.py')
                        .then(r => r.text())
                        .then(code => handleDownloadFile(code, 'mock_aamva_generator.py', 'text/x-python'))
                        .catch(() => handleDownloadFile(PYTHON_SCRIPT_CODE, 'mock_aamva_generator.py', 'text/x-python'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5C00] hover:bg-[#FF731E] text-white text-xs font-bold font-mono rounded shadow-sm transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download mock_aamva_generator.py</span>
                  </button>

                  <button
                    onClick={() => {
                      fetch('/mock_aamva_generator.py')
                        .then(r => r.text())
                        .then(code => handleCopyText(code, 'python'))
                        .catch(() => handleCopyText(PYTHON_SCRIPT_CODE, 'python'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EFECE0] text-[#061E13] text-xs font-bold font-mono rounded border border-[#0B2519]/20 transition cursor-pointer"
                  >
                    {copiedType === 'python' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[#FF5C00]" />}
                    <span>{copiedType === 'python' ? 'Copied Python!' : 'Copy Script'}</span>
                  </button>
                </div>
              </div>

              {/* CLI Command Cheatsheet */}
              <div className="bg-[#03130C] border border-[#0B2D1C] text-[#D5EFE3] rounded-xl p-4 font-mono text-xs shadow-inner flex flex-col gap-2">
                <span className="text-[10px] text-[#FF5C00] font-bold uppercase tracking-wider">
                  Quick Terminal Commands:
                </span>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="bg-[#082216] p-2 rounded border border-[#14422B] flex items-center justify-between">
                    <code>python3 mock_aamva_generator.py --records-per-state 15 --format json -o dataset.json</code>
                    <button
                      onClick={() => handleCopyText('python3 mock_aamva_generator.py --records-per-state 15 --format json -o dataset.json', 'cmd1')}
                      className="text-[10px] text-[#FF5C00] hover:underline cursor-pointer"
                    >
                      {copiedType === 'cmd1' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-[#082216] p-2 rounded border border-[#14422B] flex items-center justify-between">
                    <code>python3 mock_aamva_generator.py --states CA NY TX FL AK -n 25 -f csv -o states.csv</code>
                    <button
                      onClick={() => handleCopyText('python3 mock_aamva_generator.py --states CA NY TX FL AK -n 25 -f csv -o states.csv', 'cmd2')}
                      className="text-[10px] text-[#FF5C00] hover:underline cursor-pointer"
                    >
                      {copiedType === 'cmd2' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Python Code Viewer */}
              <div className="flex-1 bg-[#061C12] border border-[#0B2D1C] rounded-xl p-4 font-mono text-[11px] text-[#D5EFE3] overflow-y-auto shadow-inner leading-relaxed select-all">
                <pre className="text-emerald-400 font-mono">
                  {`# Example snippet from /mock_aamva_generator.py
from mock_aamva_generator import generate_mock_dataset, generate_single_record

# Generate 15 high-fidelity records for every state (51 jurisdictions total = 765 records)
dataset = generate_mock_dataset(
    records_per_state=15,
    states=None,               # None = All 50 US States + DC
    date_format='YYYYMMDD',    # Strict AAMVA CDS standard format
    output_format='json',
    output_file='mock_aamva_records.json'
)

# Access realistic AAMVA subfile properties:
sample = dataset[0]
print(f"State: {sample.daj_state} | IIN: {sample.iin}")
print(f"DLN: {sample.daq_dln} (matches state regex mask)")
print(f"DOB (DBB): {sample.dbb_date_of_birth}")
print(f"Issue Date (DBD): {sample.dbd_issue_date}")
print(f"Expiry Date (DBA): {sample.dba_expiration_date}")
print(f"Discriminator (DCF): {sample.dcf_discriminator}")
print(f"Inventory Control (DCG): {sample.dcg_country_icn}")
print(f"Compiled Barcode Payload:\\n{sample.raw_aamva_payload}")`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: 50-STATE PATTERNS REFERENCE */}
          {activeTab === 'patterns' && (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="bg-white border border-[#0B2519]/15 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#061E13] font-sans">
                  AAMVA Standard 50-State DLN Patterns & Jurisdiction Rules
                </h3>
                <p className="text-xs text-[#0B2519]/60 font-sans mt-0.5">
                  Complete reference matrix of official Issuer ID Numbers (IIN), Customer Identifier (DAQ) formats, and renewal cycles across all 50 states + DC.
                </p>
              </div>

              <div className="flex-1 bg-white border border-[#0B2519]/15 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
                <div className="overflow-x-auto flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead className="bg-[#EFECE0] sticky top-0 z-10 border-b border-[#0B2519]/15 text-[#061E13]">
                      <tr>
                        <th className="py-2.5 px-4 font-extrabold uppercase text-[10px]">Code</th>
                        <th className="py-2.5 px-4 font-extrabold uppercase text-[10px]">Jurisdiction</th>
                        <th className="py-2.5 px-4 font-extrabold uppercase text-[10px]">IIN</th>
                        <th className="py-2.5 px-4 font-extrabold uppercase text-[10px]">Renewal Cycle</th>
                        <th className="py-2.5 px-4 font-extrabold uppercase text-[10px]">DLN (DAQ) Pattern Mask</th>
                        <th className="py-2.5 px-4 font-extrabold uppercase text-[10px]">Sample Cities & ZIPs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0B2519]/10">
                      {allStateCodes.map(code => {
                        const rule = JURISDICTION_RULES[code];
                        return (
                          <tr key={code} className="hover:bg-[#FAF7EC] transition">
                            <td className="py-2.5 px-4 font-bold text-[#FF5C00]">{rule.code}</td>
                            <td className="py-2.5 px-4 font-sans font-bold text-[#061E13]">{rule.name}</td>
                            <td className="py-2.5 px-4 text-[#0B2519]/80 font-bold">{rule.iin}</td>
                            <td className="py-2.5 px-4 text-[#0B2519]/80">{rule.renewalYears} Years (Expires on B-Day)</td>
                            <td className="py-2.5 px-4 font-bold text-[#061E13]">{rule.dlnFormatDesc}</td>
                            <td className="py-2.5 px-4 font-sans text-[11px] text-[#0B2519]/70">
                              {rule.citiesZips.map(cz => `${cz.city} (${cz.zip})`).join(', ')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
