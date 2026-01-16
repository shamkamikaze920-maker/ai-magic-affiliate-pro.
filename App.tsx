
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Layout, 
  Layers, 
  Maximize, 
  CheckCircle2,
  ChevronRight,
  Loader2,
  ArrowRight,
  Download,
  X,
  User,
  Undo2,
  Redo2,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { AppState, GenerationResult } from './types';
import { CATEGORIES, MODEL_SOURCES, MODEL_TYPES, SCENES, VIBES, CAMERA_ANGLES, RATIOS } from './constants';
import { LuxurySelector } from './components/LuxurySelector';
import { generateMagicImage } from './services/geminiService';

const App: React.FC = () => {
  const initialState: AppState = {
    productImages: [],
    category: 'Fashion',
    modelSource: 'Tanpa Model',
    scene: SCENES[0],
    vibe: VIBES[0],
    cameraAngle: CAMERA_ANGLES[0],
    additionalPrompt: '',
    aspectRatio: '1:1',
  };

  const [state, setState] = useState<AppState>(initialState);
  const [history, setHistory] = useState<AppState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const studioRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Helper to update state and push to history
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const newState = updater(prev);
      
      // If the state actually changed, push to history
      if (JSON.stringify(newState) !== JSON.stringify(prev)) {
        const nextHistory = history.slice(0, historyIndex + 1);
        const updatedHistory = [...nextHistory, newState].slice(-50); // Keep last 50 steps
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);
      }
      
      return newState;
    });
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setState(history[prevIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setState(history[nextIndex]);
    }
  };

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files = Array.from(fileList) as File[];
    
    if (replaceIndexRef.current !== null) {
      const file = files[0];
      const reader = new FileReader();
      const indexToReplace = replaceIndexRef.current;
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          updateState(prev => {
            const newImages = [...prev.productImages];
            newImages[indexToReplace] = result;
            return { ...prev, productImages: newImages };
          });
        }
        replaceIndexRef.current = null;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }

    if (files.length + state.productImages.length > 5) {
      alert("Maksimum 5 gambar produk sahaja.");
      return;
    }

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          updateState(prev => ({
            ...prev,
            productImages: [...prev.productImages, result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCustomModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        updateState(prev => ({
          ...prev,
          customModelImage: result
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerReplace = (index: number) => {
    replaceIndexRef.current = index;
    productInputRef.current?.click();
  };

  const removeProductImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    updateState(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  const removeCustomModelImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateState(prev => ({
      ...prev,
      customModelImage: undefined
    }));
  };

  const handleGenerate = async () => {
    if (state.productImages.length === 0) {
      alert("Sila upload sekurang-kurangnya satu gambar produk.");
      return;
    }
    if (state.modelSource === 'Upload Sendiri' && !state.customModelImage) {
      alert("Sila upload gambar model anda.");
      return;
    }

    setIsGenerating(true);
    try {
      const urls = await generateMagicImage(state);
      const newResults = urls.map((url, i) => ({
        url,
        id: `${Date.now()}-${i}`
      }));
      setResults(newResults);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Gagal menjana gambar. Sila cuba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-[#bf953f] selection:text-black">
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
          
          <div 
            className="relative max-w-5xl w-full max-h-full flex flex-col gap-6 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls */}
            <div className="flex justify-between items-center text-white">
              <div className="flex flex-col">
                <span className="gold-text font-bold serif text-xl">Studio Preview</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Master Render Detail</span>
              </div>
              <div className="flex gap-4">
                <a 
                  href={previewImage} 
                  download="AI-Magic-Affiliate-Pro.png"
                  className="p-3 bg-white/10 hover:bg-[#bf953f] hover:text-black rounded-full transition-all group"
                  title="Download Image"
                >
                  <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="p-3 bg-white/10 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Large Image Container */}
            <div className="relative flex-1 bg-black/40 border border-white/10 overflow-hidden shadow-2xl rounded-sm">
              <img 
                src={previewImage} 
                alt="Large Preview" 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center">
              <p className="text-zinc-500 text-xs font-light tracking-widest uppercase italic">
                Rendered with High Precision AI • 8K Textures Enhanced
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Undo/Redo Floating Controls */}
      <div className="fixed bottom-8 right-8 z-[100] flex gap-2">
        <div className="glass-card flex items-center p-1 rounded-full shadow-2xl border-white/10">
          <button 
            onClick={undo}
            disabled={historyIndex === 0}
            title="Undo (Ctrl+Z)"
            className={`p-3 rounded-full transition-all ${historyIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'text-[#fcf6ba] hover:bg-white/10 active:scale-90'}`}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <button 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
            className={`p-3 rounded-full transition-all ${historyIndex >= history.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-[#fcf6ba] hover:bg-white/10 active:scale-90'}`}
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <header className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#050505] to-[#050505] z-10" />
        <div 
          className="absolute inset-0 opacity-30 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')` }}
        />
        
        <div className="relative z-20 max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-[1px] w-12 bg-[#bf953f]" />
            <span className="uppercase tracking-[0.3em] text-[#bf953f] text-sm font-medium">Elevate Your Brand</span>
            <div className="h-[1px] w-12 bg-[#bf953f]" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold serif gold-text leading-tight mb-8">
            AI Magic <br /> Affiliate Pro
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto mb-12">
            Professional photoshoots, instantly. Transform your product into high-converting marketing assets with AI precision.
          </p>
          <button 
            onClick={scrollToStudio}
            className="px-10 py-4 bg-[#bf953f] text-black font-semibold tracking-widest uppercase text-sm hover:bg-[#fcf6ba] hover:scale-105 active:scale-95 transition-all duration-300 inline-flex items-center gap-3 group shadow-[0_0_20px_rgba(191,149,63,0.3)]"
          >
            Start Your Magic
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-[#bf953f] rounded-full" />
          </div>
        </div>
      </header>

      <main 
        id="studio" 
        ref={studioRef}
        className="max-w-6xl mx-auto px-6 space-y-32 pt-20"
      >
        
        {/* Step 1: Upload */}
        <section className="space-y-12">
          <div className="flex items-end gap-6 border-b border-white/10 pb-6">
            <span className="text-5xl font-bold text-white/10 serif leading-none">01</span>
            <h2 className="text-3xl font-semibold serif tracking-tight">Product Upload</h2>
          </div>
          <div className="glass-card p-10 group">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-zinc-400 leading-relaxed">
                  Upload up to 5 images. <span className="text-[#bf953f]">Tip:</span> Click an image to replace it with a new one.
                </p>
                <div className="flex flex-wrap gap-4">
                  {state.productImages.map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => triggerReplace(i)}
                      className="relative w-24 h-24 border border-white/20 group/img overflow-hidden cursor-pointer"
                    >
                      <img src={img} alt="Product" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <RefreshCw className="w-4 h-4 text-[#fcf6ba]" />
                        <span className="text-[8px] uppercase tracking-widest text-[#fcf6ba] font-bold">Ubah</span>
                      </div>

                      <button 
                        onClick={(e) => removeProductImage(e, i)}
                        className="absolute top-1 right-1 bg-black/80 text-white p-1 rounded-sm opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-900/80 z-20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {state.productImages.length < 5 && (
                    <label className="w-24 h-24 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#bf953f] hover:bg-white/5 transition-all group">
                      <Upload className="w-6 h-6 text-zinc-600 group-hover:text-[#bf953f] transition-colors" />
                      <span className="text-[8px] uppercase tracking-widest text-zinc-600 mt-2 group-hover:text-[#bf953f]">Muat Naik</span>
                      <input 
                        type="file" 
                        ref={productInputRef}
                        multiple={replaceIndexRef.current === null} 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="relative aspect-video bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden group/main">
                {state.productImages.length > 0 ? (
                  <>
                    <img src={state.productImages[0]} className="w-full h-full object-contain opacity-60 transition-transform group-hover/main:scale-105" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/main:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                      <span className="px-4 py-2 border border-[#bf953f] text-[#bf953f] text-[10px] uppercase tracking-[0.2em] font-bold backdrop-blur-sm">Primary Reference</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-zinc-600">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-light italic">Studio Preview Stage</p>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Category & Scene Setup */}
        <section className="space-y-12">
          <div className="flex items-end gap-6 border-b border-white/10 pb-6">
            <span className="text-5xl font-bold text-white/10 serif leading-none">02</span>
            <h2 className="text-3xl font-semibold serif tracking-tight">Scene Architecture</h2>
          </div>
          
          <div className="space-y-16">
            <LuxurySelector 
              title="Product Category"
              options={CATEGORIES}
              selected={state.category}
              onChange={(val) => updateState(prev => ({ ...prev, category: val as any }))}
            />

            <div className="grid md:grid-cols-2 gap-12">
              <LuxurySelector 
                title="Model Source"
                options={MODEL_SOURCES}
                selected={state.modelSource}
                onChange={(val) => updateState(prev => ({ ...prev, modelSource: val as any }))}
                gridCols="grid-cols-2"
              />
              
              <div className="animate-in fade-in duration-500">
                {state.modelSource === 'Model AI' && (
                  <LuxurySelector 
                    title="AI Persona"
                    options={MODEL_TYPES}
                    selected={state.modelType}
                    onChange={(val) => updateState(prev => ({ ...prev, modelType: val as any }))}
                    gridCols="grid-cols-2"
                  />
                )}

                {state.modelSource === 'Upload Sendiri' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold serif gold-text">Custom Model Reference</h3>
                    <div className="flex items-center gap-6">
                      {state.customModelImage ? (
                        <div 
                          onClick={() => modelInputRef.current?.click()}
                          className="relative w-32 h-40 border border-[#bf953f] overflow-hidden group/model cursor-pointer"
                        >
                          <img src={state.customModelImage} className="w-full h-full object-cover transition-transform group-hover/model:scale-105" />
                          
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/model:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 text-[#fcf6ba]" />
                            <span className="text-[10px] uppercase tracking-widest text-[#fcf6ba] font-bold">Ubah Model</span>
                          </div>

                          <button 
                            onClick={removeCustomModelImage}
                            className="absolute top-2 right-2 p-1 bg-black/80 text-white rounded-sm opacity-0 group-hover/model:opacity-100 transition-opacity hover:bg-red-900/80 z-20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-32 h-40 border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-[#bf953f] transition-all group">
                          <User className="w-8 h-8 text-zinc-500 group-hover:text-[#bf953f] mb-2" />
                          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Upload Model</span>
                        </label>
                      )}
                      <input 
                        type="file" 
                        ref={modelInputRef}
                        accept="image/*" 
                        onChange={handleCustomModelUpload} 
                        className="hidden" 
                      />
                      <div className="flex-1 text-sm text-zinc-500 font-light italic leading-relaxed">
                        "Muat naik foto model pilihan anda. AI akan menyesuaikan wajah dan pose model tersebut ke dalam hasil penggambaran produk."
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Styling */}
        <section className="space-y-12">
          <div className="flex items-end gap-6 border-b border-white/10 pb-6">
            <span className="text-5xl font-bold text-white/10 serif leading-none">03</span>
            <h2 className="text-3xl font-semibold serif tracking-tight">Artistic Direction</h2>
          </div>

          <div className="space-y-16">
            <LuxurySelector 
              title="Global Environment"
              options={SCENES}
              selected={state.scene}
              onChange={(val) => updateState(prev => ({ ...prev, scene: val }))}
              gridCols="grid-cols-2 md:grid-cols-3"
            />

            <LuxurySelector 
              title="Visual Vibe"
              options={VIBES}
              selected={state.vibe}
              onChange={(val) => updateState(prev => ({ ...prev, vibe: val }))}
              gridCols="grid-cols-3 md:grid-cols-5"
            />

            <LuxurySelector 
              title="Camera Perspective"
              options={CAMERA_ANGLES}
              selected={state.cameraAngle}
              onChange={(val) => updateState(prev => ({ ...prev, cameraAngle: val }))}
              gridCols="grid-cols-3 md:grid-cols-6"
            />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold serif gold-text">Tailored Prompt (Optional)</h3>
              <textarea 
                value={state.additionalPrompt}
                onChange={(e) => updateState(prev => ({ ...prev, additionalPrompt: e.target.value }))}
                placeholder="Tambah perincian khusus... cth: 'cahaya pagi menyinari kaca kristal', 'lampu bandar kabur di kejauhan'"
                className="w-full h-32 bg-white/5 border border-white/10 p-6 text-zinc-300 focus:outline-none focus:border-[#bf953f] transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        {/* Step 4: Aspect Ratio */}
        <section className="space-y-12">
          <div className="flex items-end gap-6 border-b border-white/10 pb-6">
            <span className="text-5xl font-bold text-white/10 serif leading-none">04</span>
            <h2 className="text-3xl font-semibold serif tracking-tight">Output Dimensions</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => updateState(prev => ({ ...prev, aspectRatio: r.value as any }))}
                className={`p-6 border transition-all duration-300 flex flex-col items-center gap-4 ${
                  state.aspectRatio === r.value 
                  ? "border-[#bf953f] bg-[#bf953f]/10 text-white" 
                  : "border-white/10 bg-white/5 text-zinc-500 hover:bg-white/10"
                }`}
              >
                <div className={`border-2 border-current opacity-40 ${
                  r.value === '9:16' ? 'w-4 h-8' :
                  r.value === '1:1' ? 'w-6 h-6' :
                  r.value === '3:4' ? 'w-6 h-8' : 'w-8 h-6'
                }`} />
                <span className="text-xs uppercase tracking-widest">{r.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Action: Generate */}
        <section className="flex flex-col items-center py-20 border-t border-white/10">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`relative group overflow-hidden px-16 py-6 bg-transparent border-2 border-[#bf953f] font-bold text-[#bf953f] uppercase tracking-[0.4em] transition-all duration-500 hover:text-black ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="relative z-10 flex items-center gap-4">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Manifesting Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Magic
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-[#bf953f] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          </button>
          <p className="mt-8 text-zinc-500 text-sm font-light">Dikuasakan oleh Gemini Visual Engine</p>
        </section>

        {/* Step 5: Results */}
        <section ref={resultsRef} className={`space-y-12 transition-all duration-1000 ${results.length > 0 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <div className="flex items-end gap-6 border-b border-white/10 pb-6">
            <span className="text-5xl font-bold text-white/10 serif leading-none">05</span>
            <h2 className="text-3xl font-semibold serif tracking-tight">Studio Output</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {results.map((res, i) => (
              <div key={res.id} className="group space-y-4">
                <div 
                  className="relative overflow-hidden glass-card aspect-[3/4] flex items-center justify-center shadow-2xl cursor-zoom-in"
                  onClick={() => setPreviewImage(res.url)}
                >
                  <img src={res.url} alt={`Generated result ${i+1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(res.url);
                      }}
                      className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-[#bf953f] hover:text-black transition-colors"
                      title="View Large"
                    >
                      <Maximize2 className="w-6 h-6" />
                    </button>
                    <a 
                      href={res.url} 
                      download={`AI-Magic-Result-${i+1}.png`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-[#bf953f] hover:text-black transition-colors"
                      title="Download"
                    >
                      <Download className="w-6 h-6" />
                    </a>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs uppercase tracking-widest text-zinc-500">
                  <span>Variasi {i + 1}</span>
                  <span className="text-[#bf953f]">High Precision Render</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-20">
             <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-zinc-500 hover:text-[#bf953f] transition-colors flex items-center gap-2 mx-auto"
              >
               <ArrowRight className="w-4 h-4 -rotate-90" />
               Restart Studio
             </button>
          </div>
        </section>
      </main>

      <footer className="mt-40 py-20 border-t border-white/5 bg-black/40 text-center px-6">
        <h3 className="serif text-3xl gold-text mb-4 font-bold">AI Magic Affiliate Pro</h3>
        <p className="text-zinc-600 font-light max-w-lg mx-auto mb-8 text-sm">
          Digital studio terbaik untuk perniagaan moden. Cipta naratif visual produk eksklusif dengan kuasa kecerdasan buatan.
        </p>
        <div className="flex justify-center gap-8 text-zinc-700 uppercase tracking-widest text-[10px] font-semibold mb-12">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Studio Support</span>
        </div>
        <div className="pt-8 border-t border-white/5 text-zinc-500 text-[10px] font-medium tracking-[0.3em] uppercase">
          made with <span className="text-red-500 animate-pulse mx-1">♥️</span> by <span className="gold-text font-bold">Runnow</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
