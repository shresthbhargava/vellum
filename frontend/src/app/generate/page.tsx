"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Play,
  RotateCcw,
  AlertCircle,
  Terminal,
  Trash2,
  Globe,
  BarChart3
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { translations, Language } from "../../utils/translations";

export default function GeneratePage() {
  const router = useRouter();
  const [startupName, setStartupName] = useState("");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"online" | "offline">("online");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language;
      if (savedLang && ['en', 'hi', 'es'].includes(savedLang)) {
        setLang(savedLang);
      }
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', newLang);
    }
  };

  // Check backend health on load
  

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile) return;

    // Validate type (PDF or Image)
    const isPDF = selectedFile.type === "application/pdf";
    const isImage = selectedFile.type.startsWith("image/");

    if (!isPDF && !isImage) {
      setError("Supported file formats are PDF and Images (PNG, JPG, WEBP) only.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Strip data prefix (e.g. data:image/png;base64,)
        const base64Data = reader.result.split(",")[1];
        setBase64File(base64Data);
      }
    };
    reader.onerror = () => {
      setError("Failed to process file binary contents.");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setBase64File(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Typing simulator for demo loader
    const loadDemo = async () => {
    setError(null);
    const localName = "EduStream AI";
    const localText = "An AI platform that conducts realistic coding interviews for software engineer applicants. It provides live voice interaction, a shared coding canvas with realtime syntax validation, and assesses candidates on code quality, problem solving, and communication. It generates a full evaluation scorecard and feeds metrics to a hiring team dashboard.";
    
    setStartupName("");
    setTextInput("");

    let nameIndex = 0;
    let textIndex = 0;

    const nameTimer = setInterval(() => {
      if (nameIndex < localName.length) {
        setStartupName((prev) => prev + localName[nameIndex]);
        nameIndex++;
      } else {
        clearInterval(nameTimer);
        const textTimer = setInterval(() => {
          if (textIndex < localText.length) {
            setTextInput((prev) => prev + localText[textIndex]);
            textIndex += 2;
          } else {
            setTextInput(localText);
            clearInterval(textTimer);
          }
        }, 10);
      }
    }, 25);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupName.trim()) {
      setError("Please provide a Startup or Product Name.");
      return;
    }
    if (!textInput.trim() && !file) {
      setError("Please input a business description or upload a document/image context.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    const inputType = file ? (file.type.includes("pdf") ? "pdf" : "image") : "text";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8500'}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startup_name: startupName,
          text_input: textInput,
          input_type: inputType,
          filename: file ? file.name : null,
          file_content: base64File,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.session_id) {
        router.push(`/results/${result.session_id}`);
      } else {
        throw new Error("Invalid response schema from backend.");
      }
    } catch (err: unknown) {
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : "Failed to establish endpoint connection to backend API.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent/30 selection:text-accent relative overflow-hidden">
      <AnimatedBackground />
      {/* Background decoration grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f5a62304_1px,transparent_1px),linear-gradient(to_bottom,#f5a62304_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40"></div>
      {/* Subtle organic light spots */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[#0c0802] blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-[#0c0802] blur-[120px] pointer-events-none"></div>
      
      {/* Top Header */}
      <header className="border-b border-darkBorder bg-card sticky top-0 z-50 shadow-[0_2px_15px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-accent flex items-center justify-center border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Sparkles className="w-4.5 h-4.5 text-accent-foreground font-extrabold" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-[#f5a623] bg-clip-text text-transparent">
                {translations[lang].title}
              </h1>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block -mt-1">
                {translations[lang].subtitle}
              </span>
            </div>
          </div>

                    <div className="flex items-center gap-4">
            <Link
              href="/validate"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#050505] border border-darkBorder hover:border-accent/40 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-wider">Validate Idea</span>
            </Link>

            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-none bg-[#050505] border border-darkBorder">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-[10px] font-mono text-neutral-300 uppercase tracking-wider focus:outline-none cursor-pointer pr-1"
              >
                <option value="en" className="bg-[#050505] text-white">English (EN)</option>
                <option value="hi" className="bg-[#050505] text-white">हिन्दी (HI)</option>
                <option value="es" className="bg-[#050505] text-white">Español (ES)</option>
              </select>
            </div>

            {/* Backend Connection Indicator */}
            <span className={`w-2 h-2 rounded-none ${
                backendStatus === "online" 
                  ? "bg-accent animate-pulse" 
                  : "bg-red-500"
              }`}></span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                {backendStatus === "online" 
                  ? translations[lang].apiOnline 
                  : translations[lang].apiOffline}
              </span>
            </div>
          
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center relative z-10">
        
        {/* Intro Hero */}
        <div className="text-center mb-10 select-none animate-float">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-[#0c0802] border border-accent/20 text-accent text-xs font-medium mb-4">
            <Terminal className="w-3.5 h-3.5" />
            <span>Google Gemini-Powered Explainable Architectures</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent mb-3">
            {translations[lang].heroTitle}
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            {translations[lang].heroDesc}
          </p>
        </div>

        {/* Input Panel Card */}
        <div className="bg-[#050505] border border-darkBorder rounded-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="p-6 border-b border-darkBorder bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {translations[lang].inputHeader}
              </h3>
              <p className="text-xs text-neutral-500">{translations[lang].inputSub}</p>
            </div>
            
            <button
              type="button"
              onClick={loadDemo}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none text-xs font-mono font-bold tracking-tight btn-3d-secondary uppercase cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-accent" />
              {translations[lang].loadDemo}
            </button>
          </div>

          <form onSubmit={handleGenerate} className="p-6 flex flex-col gap-5">
            {/* Startup/Product Name Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="startup-name" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                {translations[lang].fieldStartup}
              </label>
              <input
                id="startup-name"
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                disabled={isGenerating}
                placeholder={translations[lang].placeholderStartup}
                className="w-full bg-[#0a0a0a] border border-darkBorder rounded-none px-4 py-2.5 font-sans text-sm text-white focus:outline-none focus:border-accent transition-all duration-200 placeholder:text-neutral-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_0_10px_rgba(245,166,35,0.05)]"
              />
            </div>

            {/* Description Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="text-input" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                  {translations[lang].fieldDesc}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-neutral-500">
                    {textInput.length} characters
                  </span>
                </div>
              </div>


              <textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isGenerating}
                placeholder={translations[lang].placeholderDesc}
                className="w-full bg-[#0a0a0a] border border-darkBorder rounded-none px-4 py-3 font-sans text-sm text-white focus:outline-none focus:border-accent transition-all duration-200 placeholder:text-neutral-600 min-h-[140px] resize-none leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_0_10px_rgba(245,166,35,0.05)]"
              />
            </div>

            {/* File Upload Zone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                {translations[lang].fieldUpload}
              </label>

              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-none p-6 text-center cursor-pointer transition-all duration-200 bg-[#030303] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${
                    isDragOver 
                      ? "border-accent bg-[#181003]" 
                      : "border-darkBorder hover:border-accent/60 hover:bg-card"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-neutral-500 mx-auto mb-2.5" />
                  <p className="text-xs font-semibold text-neutral-200">
                    {translations[lang].dragDrop}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                    {translations[lang].dragDropSub}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-background border border-darkBorder rounded-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-none bg-card border border-darkBorder flex items-center justify-center text-accent">
                      {file.type === "application/pdf" ? (
                        <FileText className="w-5 h-5 text-accent" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-200 max-w-sm truncate">{file.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split("/")[1].toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isGenerating}
                    className="p-1.5 rounded-none border border-darkBorder bg-background text-neutral-400 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/50 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error Message Panel */}
            {error && (
              <div className="flex gap-2.5 items-start p-3 bg-red-950/20 border border-red-900/40 rounded-none text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-normal font-mono">{error}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full btn-3d py-3.5 px-4 rounded-none text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-b-0 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin"></div>
                  <span>{translations[lang].btnGenerating}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{translations[lang].btnGenerate}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-darkBorder bg-card py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
          {translations[lang].footer}
        </div>
      </footer>
    </div>
  );
}
