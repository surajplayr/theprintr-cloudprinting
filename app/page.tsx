"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Printer, 
  FileUp, 
  Loader2, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  CreditCard, 
  Check, 
  RotateCcw, 
  ArrowRight 
} from "lucide-react";
import Image from "next/image";

type ScreenState = "upload" | "config" | "processing" | "success";

export default function Home() {
  const [screen, setScreen] = useState<ScreenState>("upload");
  
  // App State
  const [pages, setPages] = useState(2);
  const [fileName, setFileName] = useState("document.pdf");
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [rate, setRate] = useState(5.0);
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [scaling, setScaling] = useState<"fit" | "actual" | "fill">("fit");
  const [copies, setCopies] = useState(1);
  const [orderToken, setOrderToken] = useState("");
  
  const [fileType, setFileType] = useState<"image" | "pdf" | "other">("pdf");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateTotal = () => pages * copies * rate;
  const totalCost = calculateTotal();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    if (file.type.startsWith("image/")) {
      setFileType("image");
      setPages(1);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFileType(file.type === "application/pdf" ? "pdf" : "other");
      setPages(1);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    const timer = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsUploading(false);
          setScreen("config");
        }, 300);
      }
    }, 80);
  };

  const handleColorMode = (mode: "bw" | "color", newRate: number) => {
    setColorMode(mode);
    setRate(newRate);
  };

  const handleIncCopies = () => {
    if (copies < 20) setCopies(copies + 1);
  };

  const handleDecCopies = () => {
    if (copies > 1) setCopies(copies - 1);
  };

  const handlePayNow = () => {
    setScreen("processing");
    setTimeout(() => {
      setOrderToken("#PR-" + Math.floor(1000 + Math.random() * 9000));
      setScreen("success");
    }, 1800);
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPages(1);
    setFileName("document.pdf");
    setFileType("pdf");
    setColorMode("bw");
    setRate(5.0);
    setOrientation("auto");
    setScaling("fit");
    setCopies(1);
    setUploadProgress(0);
    setScreen("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const scalingLabels = {
    fit: "Fit to Page",
    actual: "Actual Size (100%)",
    fill: "Fill Entire Page",
  };

  return (
    <div className="w-full max-w-md bg-cotton min-h-screen sm:min-h-[860px] sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
      {/* Top Glassmorphic Navbar */}
      <header className="bg-white/75 backdrop-blur-md border-b border-white/50 px-5 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center">
          <Image
            src="https://res.cloudinary.com/dkz2dbwv1/image/upload/fl_preserve_transparency/v1789804442/izp4ikxtpgtl76zf4n7e.jpg?_s=public-apps"
            alt="The Printr"
            width={100}
            height={36}
            className="h-9 w-auto object-contain"
            unoptimized
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-noir border border-noir/10 shadow-sm">
          <Printer className="w-3.5 h-3.5 text-cherry" />
          <span>Epson L8050</span>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 p-5 overflow-y-auto pb-32 custom-scroll">
        {/* ================= SCREEN 1: UPLOAD SCREEN ================= */}
        {screen === "upload" && (
          <section className="space-y-6">
            <div className="text-center pt-2 space-y-1">
              <span className="inline-block px-3 py-0.5 bg-cherry/10 text-cherry text-[10px] font-black rounded-full uppercase tracking-widest border border-cherry/20">
                Smart Cloud Print
              </span>
              <h2 className="text-2xl font-black text-noir tracking-tight">Print in seconds</h2>
              <p className="text-xs text-noir/70 font-medium">Upload any document directly from your device</p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <label
              htmlFor="fileInput"
              className="border-2 border-dashed border-maroon/40 hover:border-cherry bg-white/60 hover:bg-white transition-all rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer group shadow-sm text-center"
            >
              <div className="w-16 h-16 rounded-full bg-cherry/10 group-hover:scale-105 transition-transform flex items-center justify-center text-cherry mb-4">
                <FileUp className="w-8 h-8" />
              </div>
              <span className="font-bold text-noir text-base">Drop your file here</span>
              <span className="text-xs text-noir/60 mt-1">or tap to browse your phone</span>
              <span className="inline-block mt-3 px-3 py-1 bg-noir/5 text-noir/70 text-[11px] font-semibold rounded-md border border-noir/10">
                PDF, DOCX, PPTX, JPG, PNG
              </span>
              <input
                type="file"
                id="fileInput"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                onChange={handleFileUpload}
              />
            </label>

            {/* Simulated Upload Progress Bar */}
            {isUploading && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-noir/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-noir">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cherry" />
                    Uploading document...
                  </span>
                  <span className="text-cherry font-extrabold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-cotton rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cherry transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-noir/60">Please stay on this page while we process your file.</p>
              </div>
            )}

            {/* Trust & Security Banner */}
            <div className="flex items-start gap-3 bg-white/70 rounded-xl p-3.5 border border-noir/10 text-xs text-noir/80">
              <ShieldCheck className="w-5 h-5 text-cherry shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-noir">Encrypted & Secure</span>
                Your file is deleted immediately after printing is complete.
              </div>
            </div>
          </section>
        )}

        {/* ================= SCREEN 2: CONFIGURATION SCREEN ================= */}
        {screen === "config" && (
          <section className="space-y-4">
            {/* File Preview Header Card */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-noir/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-10 h-12 bg-cotton border border-noir/15 rounded-lg flex flex-col items-center justify-center text-cherry font-black text-[11px] shrink-0">
                  <FileText className="w-4 h-4 mb-0.5" />
                  <span>{fileType === "image" ? "IMG" : "PDF"}</span>
                </div>
                <div className="truncate">
                  <p className="text-xs font-extrabold text-noir truncate">{fileName}</p>
                  <p className="text-[10px] text-noir/60 font-semibold mt-0.5">
                    <span>{pages}</span> {pages === 1 ? "page" : "page(s)"} ready to print
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setScreen("upload");
                }}
                className="text-xs font-bold text-cherry hover:text-maroon underline px-2 py-1"
              >
                Change
              </button>
            </div>

            {/* Document Live Print Preview Canvas */}
            <div className="bg-noir/5 border border-noir/10 rounded-2xl p-3 flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center justify-between w-full px-1 text-[11px] font-bold text-noir/70">
                <span>Print Viewport</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-noir/10 font-semibold text-noir">
                  Page 1 of {pages}
                </span>
              </div>

              <div
                className={`bg-white rounded-md shadow-md border border-noir/20 p-3 flex flex-col justify-between transition-all duration-300 overflow-hidden relative ${
                  orientation === "landscape" ? "w-56 h-40" : "w-44 h-56"
                } ${colorMode === "bw" ? "grayscale" : "grayscale-0"}`}
                style={{
                  transform: scaling === "fit" ? "scale(0.96)" : scaling === "actual" ? "scale(0.88)" : "scale(1.02)",
                }}
              >
                {previewUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center p-2 bg-white rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain pointer-events-none transition-all duration-300"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 w-full">
                    <div className="h-2 w-3/4 bg-noir/20 rounded"></div>
                    <div className="h-1.5 w-full bg-noir/10 rounded"></div>
                    <div className="h-1.5 w-5/6 bg-noir/10 rounded"></div>
                    <div className="h-1.5 w-4/6 bg-noir/10 rounded"></div>
                    <div className="h-12 w-full bg-noir/5 rounded border border-dashed border-noir/15 mt-2 flex items-center justify-center text-[9px] font-bold text-noir/40">
                      [Content Preview]
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-[8px] text-noir/40 pt-1 border-t border-noir/10 absolute bottom-1 left-2 right-2 bg-white/90 rounded-b-md">
                  <span>{scalingLabels[scaling]}</span>
                  <span>A4</span>
                </div>
              </div>
            </div>

            {/* Setting: Color Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold tracking-wide uppercase text-noir/70">Color Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleColorMode("bw", 5.0)}
                  className={`py-2 px-3 rounded-xl border border-noir/15 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all ${
                    colorMode === "bw" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  <span>Black & White</span>
                  <span className="text-[10px] opacity-80">₹5.00 / page</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleColorMode("color", 10.0)}
                  className={`py-2 px-3 rounded-xl border border-noir/15 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all ${
                    colorMode === "color" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  <span>Full Color</span>
                  <span className="text-[10px] opacity-80">₹10.00 / page</span>
                </button>
              </div>
            </div>

            {/* Setting: Print Sides */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold tracking-wide uppercase text-noir/70">Print Sides</label>
              <div className="w-full">
                <button
                  type="button"
                  className="w-full pill-active py-2.5 px-3 rounded-xl border border-noir/15 font-bold text-xs flex items-center justify-center gap-2 cursor-default"
                >
                  <CheckCircle2 className="w-4 h-4 text-cotton" />
                  <span>Single Sided</span>
                </button>
              </div>
            </div>

            {/* Setting: Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold tracking-wide uppercase text-noir/70">Orientation</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation("auto")}
                  className={`py-2 px-2 rounded-xl border border-noir/15 font-bold text-xs text-center transition-all ${
                    orientation === "auto" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("portrait")}
                  className={`py-2 px-2 rounded-xl border border-noir/15 font-bold text-xs text-center transition-all ${
                    orientation === "portrait" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("landscape")}
                  className={`py-2 px-2 rounded-xl border border-noir/15 font-bold text-xs text-center transition-all ${
                    orientation === "landscape" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Setting: Scaling */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold tracking-wide uppercase text-noir/70">Page Scaling</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScaling("fit")}
                  className={`py-2 px-1 rounded-xl border border-noir/15 font-bold text-xs text-center transition-all ${
                    scaling === "fit" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  Fit to page
                </button>
                <button
                  type="button"
                  onClick={() => setScaling("actual")}
                  className={`py-2 px-1 rounded-xl border border-noir/15 font-bold text-xs text-center transition-all ${
                    scaling === "actual" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  Actual size
                </button>
                <button
                  type="button"
                  onClick={() => setScaling("fill")}
                  className={`py-2 px-1 rounded-xl border border-noir/15 font-bold text-xs text-center transition-all ${
                    scaling === "fill" ? "pill-active" : "bg-white text-noir hover:bg-cotton"
                  }`}
                >
                  Fill page
                </button>
              </div>
            </div>

            {/* Setting: Number of Copies Stepper (Max 20 limit) */}
            <div className="bg-white rounded-2xl p-3 border border-noir/10 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-noir block">Number of Copies</span>
                <span className="text-[10px] text-noir/50 font-medium">Max 20 copies per order</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDecCopies}
                  className="w-8 h-8 rounded-lg bg-cotton border border-noir/20 flex items-center justify-center font-black text-noir hover:bg-noir/10 active:scale-95 transition-all"
                >
                  -
                </button>
                <span className="text-sm font-black text-noir min-w-[20px] text-center">{copies}</span>
                <button
                  onClick={handleIncCopies}
                  className="w-8 h-8 rounded-lg bg-cotton border border-noir/20 flex items-center justify-center font-black text-noir hover:bg-noir/10 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================= SCREEN 3: PAYMENT / PROCESSING ================= */}
        {screen === "processing" && (
          <section className="text-center py-16 space-y-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-cherry/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cherry border-t-transparent rounded-full animate-spin"></div>
              <CreditCard className="w-10 h-10 text-maroon" />
            </div>
            <div>
              <h3 className="text-xl font-black text-noir">Processing Payment</h3>
              <p className="text-xs text-noir/70 mt-1">Connecting to Epson L8050 Queue...</p>
            </div>
            <div className="p-3 bg-white/70 rounded-xl border border-noir/10 text-xs text-noir/80 max-w-xs mx-auto">
              Please do not refresh or tap back.
            </div>
          </section>
        )}

        {/* ================= SCREEN 4: SUCCESS / RECEIPT ================= */}
        {screen === "success" && (
          <section className="space-y-5">
            <div className="text-center pt-2">
              <div className="w-16 h-16 bg-cherry text-cotton rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-black text-noir">Order Queued!</h2>
              <p className="text-xs text-noir/70 mt-0.5">Printer Epson L8050 has received your document</p>
            </div>

            {/* Receipt Card */}
            <div className="bg-white rounded-2xl p-5 border border-noir/10 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-noir/10">
                <span className="text-xs text-noir/60 font-medium">Order Token</span>
                <span className="font-extrabold text-sm text-cherry">{orderToken}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-noir/80">
                  <span>Printer</span>
                  <span className="font-bold text-noir">Epson L8050</span>
                </div>
                <div className="flex justify-between text-noir/80">
                  <span>Color Mode</span>
                  <span className="font-bold text-noir">{colorMode === "bw" ? "Black & White" : "Full Color"}</span>
                </div>
                <div className="flex justify-between text-noir/80">
                  <span>Print Style</span>
                  <span className="font-bold text-noir">Single Sided</span>
                </div>
                <div className="flex justify-between text-noir/80">
                  <span>Scaling</span>
                  <span className="font-bold text-noir uppercase">{scaling}</span>
                </div>
                <div className="flex justify-between text-noir/80">
                  <span>Total Pages</span>
                  <span className="font-bold text-noir">{pages} Pages</span>
                </div>
                <div className="flex justify-between text-noir/80">
                  <span>Copies</span>
                  <span className="font-bold text-noir">{copies}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-noir/10 flex items-center justify-between">
                <span className="font-black text-sm text-noir">Total Paid</span>
                <span className="font-black text-lg text-cherry">₹{totalCost.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 bg-noir hover:bg-noir/90 text-cotton rounded-xl font-extrabold text-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Print Another Document
            </button>
          </section>
        )}
      </main>

      {/* Sticky Bottom Calculation & Checkout Bar */}
      {screen === "config" && (
        <footer className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-noir/10 px-5 py-3.5 z-20 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-noir/60 uppercase font-extrabold tracking-wider">Estimated Total</p>
            <p className="text-2xl font-black text-cherry leading-tight">₹{totalCost.toFixed(2)}</p>
          </div>
          <button
            onClick={handlePayNow}
            className="bg-cherry hover:bg-maroon active:scale-95 transition-all text-cotton font-extrabold text-xs py-3 px-6 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <span>Confirm & Pay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </footer>
      )}
    </div>
  );
}
