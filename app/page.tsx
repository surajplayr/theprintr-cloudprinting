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
import { supabase } from "../lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  
  const [fileType, setFileType] = useState<"image" | "pdf" | "other" | "mixed">("pdf");
  const [previewUrls, setPreviewUrls] = useState<{url: string, pages: number}[]>([]);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    return () => {
      previewUrls.forEach(p => {
        if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
      });
    };
  }, [previewUrls]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateTotal = () => pages * copies * rate;
  const totalCost = calculateTotal();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setFileName(files.map(f => f.name).join(", "));
    
    const isAllImages = files.every(f => f.type.startsWith("image/"));
    setFileType(isAllImages ? "image" : files.length > 1 ? "mixed" : files[0].type === "application/pdf" ? "pdf" : "other");

    setIsUploading(true);
    setUploadProgress(0);

    previewUrls.forEach(p => {
      if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
    });
    const newPreviewUrls: {url: string, pages: number}[] = [];
    let totalPagesCalculated = 0;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        newPreviewUrls.push({ url: URL.createObjectURL(file), pages: 1 });
        totalPagesCalculated += 1;
      } else if (file.type === "application/pdf") {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          totalPagesCalculated += pdf.numPages;

          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.0 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport: viewport, canvas: canvas } as any).promise;
            newPreviewUrls.push({ url: canvas.toDataURL("image/jpeg", 0.8), pages: pdf.numPages });
          }
        } catch (err) {
          console.error("Failed to parse PDF", err);
          totalPagesCalculated += 1;
          newPreviewUrls.push({ url: "", pages: 1 });
        }
      } else {
        totalPagesCalculated += 1;
        newPreviewUrls.push({ url: "", pages: 1 });
      }
    }

    setPages(totalPagesCalculated);
    setPreviewUrls(newPreviewUrls);

    const uploadedUrls: string[] = [];
    let completed = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "theprintr_uploads");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dkz2dbwv1"}/auto/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const fileProgress = (event.loaded / event.total);
            const overallProgress = Math.round(((completed + fileProgress) / files.length) * 100);
            setUploadProgress(overallProgress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            uploadedUrls.push(response.secure_url);
            completed++;
            resolve();
          } else {
            console.error("Upload failed for a file");
            reject();
          }
        };

        xhr.onerror = () => {
          console.error("Upload error for a file");
          reject();
        };

        xhr.send(formData);
      });
    }

    setFileUrl(uploadedUrls.join(","));
    setTimeout(() => {
      setIsUploading(false);
      setScreen("config");
    }, 500);
  };

  const handleColorMode = (mode: "bw" | "color", newRate: number) => {
    setColorMode(mode);
    setRate(newRate);
  };

  const handleIncCopies = () => {
    if (copies < 20) {
      setCopies(copies + 1);
    } else {
      window.alert("Maximum 20 copies allowed per order.");
    }
  };

  const handleDecCopies = () => {
    if (copies > 1) setCopies(copies - 1);
  };

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");

  const handlePayNow = async () => {
    setScreen("processing");

    try {
      const res = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalCost }),
      });
      
      if (!res.ok) throw new Error("Failed to initialize payment");
      const { orderId } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: totalCost * 100,
        currency: "INR",
        name: "The Printr",
        description: "Document Printing Service",
        order_id: orderId,
        handler: async function (response: any) {
          const { data, error } = await supabase.from('orders').insert([{
            file_url: fileUrl,
            file_name: fileName,
            pages: pages,
            copies: copies,
            color_mode: colorMode,
            print_style: colorMode,
            orientation: orientation,
            scaling: scaling,
            status: 'pending',
            total_amount: totalCost,
            payment_id: response.razorpay_payment_id
          }]).select().single();
          
          if (error) {
            console.error("Supabase insert error:", error);
            alert("Order creation failed but payment was captured. Error: " + error.message);
            setScreen("config");
            return;
          }
          
          const formattedSeq = String(data.order_seq).padStart(4, '0');
          setOrderToken(formattedSeq);
          setPaymentMethod("online");
          setScreen("success");
        },
        prefill: {
          name: "Kiosk User",
          email: "guest@theprintr.com",
          contact: "9999999999"
        },
        theme: {
          color: "#8B0000"
        },
        modal: {
          ondismiss: function() {
            setScreen("config");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + response.error.description);
        setScreen("config");
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment initialization failed:", err);
      alert("Could not load payment gateway.");
      setScreen("config");
    }
  };

  const handleCashPayment = async () => {
    setScreen("processing");

    const { data, error } = await supabase.from('orders').insert([{
      file_url: fileUrl,
      file_name: fileName,
      pages: pages,
      copies: copies,
      color_mode: colorMode,
      print_style: colorMode,
      orientation: orientation,
      scaling: scaling,
      status: 'pending',
      total_amount: totalCost,
      payment_id: 'CASH_AT_COUNTER'
    }]).select().single();
    
    if (error) {
      console.error("Supabase insert error:", error);
      alert("Order creation failed. Error: " + error.message);
      setScreen("config");
      return;
    }
    
    const formattedSeq = String(data.order_seq).padStart(4, '0');
    setOrderToken(formattedSeq);
    setPaymentMethod("cash");
    setScreen("success");
  };

  const handleReset = () => {
    previewUrls.forEach(p => {
      if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
    });
    setPreviewUrls([]);
    setFileUrl("");
    setPages(1);
    setFileName("document.pdf");
    setFileType("pdf");
    setColorMode("bw");
    setRate(5.0);
    setOrientation("auto");
    setScaling("fit");
    setCopies(1);
    setUploadProgress(0);
    setPaymentMethod("online");
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
                PDF, JPG, PNG
              </span>
              <input
                type="file"
                id="fileInput"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp"
                onChange={handleFileUpload}
                multiple
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
                  <span>{fileType === "image" ? "IMG" : fileType === "mixed" ? "MIX" : "PDF"}</span>
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
                  previewUrls.forEach(p => {
                    if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
                  });
                  setPreviewUrls([]);
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
                {previewUrls.length > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-start p-2 bg-white rounded-md gap-2 overflow-x-auto custom-scroll">
                    {previewUrls.map((p, i) => (
                      <div key={i} className="relative h-full shrink-0 flex items-center justify-center bg-noir/5 rounded-md border border-noir/10 p-1 aspect-[1/1.4]">
                        {p.url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.url}
                            alt={`Preview ${i+1}`}
                            className="max-w-full max-h-full object-contain pointer-events-none transition-all duration-300"
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-noir/20" />
                        )}
                        <span className="absolute bottom-1 right-1 bg-noir text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          {p.pages} pg
                        </span>
                      </div>
                    ))}
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
              <p className="text-xs text-noir/70 mt-0.5">
                {paymentMethod === "cash" 
                  ? "Order placed! Your document is printing. Please pay cash at the counter." 
                  : "Printer Epson L8050 has received your document"}
              </p>
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
                <span className="font-black text-sm text-noir">{paymentMethod === "cash" ? "Total Due" : "Total Paid"}</span>
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
        <footer className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-noir/10 px-4 py-3 z-20 flex items-center justify-between gap-3">
          <div className="shrink-0">
            <p className="text-[10px] text-noir/60 uppercase font-extrabold tracking-wider">Estimated Total</p>
            <p className="text-xl font-black text-cherry leading-tight">₹{totalCost.toFixed(2)}</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[200px]">
            <button
              onClick={handlePayNow}
              className="bg-cherry hover:bg-maroon active:scale-95 transition-all text-cotton font-extrabold text-[11px] py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-1.5 w-full"
            >
              <span>Pay Online (UPI/Cards)</span>
            </button>
            <button
              onClick={handleCashPayment}
              className="bg-transparent border border-cherry text-cherry hover:bg-cherry/5 active:scale-95 transition-all font-extrabold text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center w-full"
            >
              <span>Pay Cash at Counter</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
