import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Building2,
  Layers,
  Eye,
  Check,
  X,
  RefreshCw,
  Sliders,
  Download,
  Info,
  ChevronRight,
  Maximize2,
  FileCheck,
  Palette,
  Camera
} from 'lucide-react';
import { ElevatorSpecification } from '../types/elevator';
import {
  ArchitecturalRenderType,
  ARCHITECTURAL_PRESETS,
  generateElevatorArchitecturalPrompt,
  ArchitecturalPreset
} from '../utils/architecturalPresets';
import { generateArchitecturalImage } from '../services/imageGenerationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  spec: ElevatorSpecification;
  onUpdateSpec: (partial: Partial<ElevatorSpecification>) => void;
  language?: 'ar' | 'en';
}

export const ArchitecturalVisualizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  spec,
  onUpdateSpec,
  language = 'ar',
}) => {
  const isAr = language === 'ar';

  // Render type state
  const [renderType, setRenderType] = useState<ArchitecturalRenderType>(
    spec.architecturalRenderType || 'CABIN_INTERIOR'
  );

  // Prompt state
  const [prompt, setPrompt] = useState<string>(() => {
    return (
      spec.architecturalRenderPrompt ||
      generateElevatorArchitecturalPrompt(spec, spec.architecturalRenderType || 'CABIN_INTERIOR')
    );
  });

  // Current preview image
  const [currentImage, setCurrentImage] = useState<string>(() => {
    return (
      spec.architecturalRenderUrl ||
      ARCHITECTURAL_PRESETS[0].svgDataUri
    );
  });

  // Caption for PDF
  const [caption, setCaption] = useState<string>(() => {
    return (
      spec.architecturalRenderCaption ||
      (isAr
        ? 'تصور معماري ثلاثي الأبعاد مقترح لكابينة وتشطيبات المصعد المعتمدة'
        : 'Conceptual 3D architectural rendering of approved elevator cabin finishes')
    );
  });

  // Include in PDF toggle
  const [includeInPdf, setIncludeInPdf] = useState<boolean>(() => {
    return spec.includeRenderInPdf !== false;
  });

  // Loading & error state
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync prompt when renderType changes
  const handleTypeChange = (newType: ArchitecturalRenderType) => {
    setRenderType(newType);
    const newPrompt = generateElevatorArchitecturalPrompt(spec, newType);
    setPrompt(newPrompt);

    // Auto-switch to matching preset preview if available
    const matched = ARCHITECTURAL_PRESETS.find((p) => p.type === newType);
    if (matched) {
      setCurrentImage(matched.svgDataUri);
    }
  };

  // Re-generate prompt from current specs
  const handleResetPromptToSpec = () => {
    const freshPrompt = generateElevatorArchitecturalPrompt(spec, renderType);
    setPrompt(freshPrompt);
    setStatusMessage(isAr ? 'تم تحديث الوصف المعماري وفق مواصفات المصعد الحالية' : 'Prompt refreshed from current specs');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Trigger Live Imagen API Generation
  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setStatusMessage(isAr ? 'جاري الاتصال بمحرك Imagen لتوليد التصور المعماري...' : 'Generating architectural render via Imagen API...');

    try {
      const result = await generateArchitecturalImage({
        prompt,
        renderType,
        spec,
      });

      if (result.success && result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setStatusMessage(
          isAr
            ? 'تم توليد التصور المعماري بنجاح! جاهز للتضمين في عرض السعر PDF.'
            : 'Architectural render generated successfully! Ready for PDF quotation.'
        );
      } else {
        setStatusMessage(isAr ? 'تعذر التوليد المباشر، تم توفير النموذج المعماري البديل.' : 'Fallback architectural render applied.');
      }
    } catch (err: any) {
      console.error('Error generating image:', err);
      setStatusMessage(isAr ? 'حدث خطأ أثناء الاتصال بمحرك التوليد.' : 'Error generating image.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Select Preset Directly
  const handleSelectPreset = (preset: ArchitecturalPreset) => {
    setCurrentImage(preset.svgDataUri);
    setRenderType(preset.type);
    setPrompt(preset.defaultPrompt);
    setStatusMessage(
      isAr
        ? `تم تطبيق نموذج: ${preset.titleAr}`
        : `Applied preset: ${preset.titleEn}`
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Save changes to elevator specification
  const handleSaveAndApply = () => {
    onUpdateSpec({
      architecturalRenderUrl: currentImage,
      architecturalRenderPrompt: prompt,
      architecturalRenderType: renderType,
      architecturalRenderCaption: caption,
      includeRenderInPdf: includeInPdf,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isAr ? 'استوديو التصور المعماري ثلاثي الأبعاد (Imagen Studio)' : 'Architectural 3D Visualizer (Imagen Studio)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  AI Imagen &bull; PDF Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? 'توليد صور وتصورات معمارية احترافية للكابينة والبئر لتحسين المظهر الهندسي في عروض الأسعار PDF'
                  : 'Generate professional 3D architectural renders of cabin & shaft for turnkey PDF quotations'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY (SCROLLABLE GRID)                                              */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">

          {/* Status Alert Banner */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                {statusMessage}
              </span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-indigo-400 hover:text-indigo-700"
              >
                &times;
              </button>
            </div>
          )}

          {/* Render Target Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? '1. حدد زاوية ونوع التصور المعماري المطلوب:' : '1. Select Architectural Render Target:'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('CABIN_INTERIOR')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  renderType === 'CABIN_INTERIOR'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-2xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Palette className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">{isAr ? 'كابينة الركاب الداخلية' : 'Cabin Interior'}</span>
                <span className="text-[10px] text-slate-500 font-normal">{isAr ? 'تشطيب الجدران والأرضية' : 'Walls, floor & ceiling'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('PANORAMIC_GLASS')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  renderType === 'PANORAMIC_GLASS'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-2xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Eye className="w-5 h-5 text-sky-600" />
                <span className="text-xs">{isAr ? 'مصعد زجاجي بانوراما' : 'Panoramic Glass'}</span>
                <span className="text-[10px] text-slate-500 font-normal">{isAr ? 'إطلالة بهو المبنى 360' : 'Atrium view 360'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('SHAFT_SECTION')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  renderType === 'SHAFT_SECTION'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-2xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-xs">{isAr ? 'مقطع البئر الرأسي 3D' : 'Shaft Cutaway'}</span>
                <span className="text-[10px] text-slate-500 font-normal">{isAr ? 'السكك والثقل والحفرة' : 'Rails, CWT & pit'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('ENTRANCE_DOOR')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  renderType === 'ENTRANCE_DOOR'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-2xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Camera className="w-5 h-5 text-amber-600" />
                <span className="text-xs">{isAr ? 'مدخل وباب الطابق' : 'Landing Entrance'}</span>
                <span className="text-[10px] text-slate-500 font-normal">{isAr ? 'إطار الباب وشاشة النداء' : 'Architrave & doors'}</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Prompt Builder (Left) & Live Render Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left 6 cols: Prompt Engineering & Presets */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAr ? 'وصف التوليد المعماري (Imagen Prompt):' : 'Architectural Prompt (Imagen API):'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetPromptToSpec}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    title={isAr ? 'توليد تلقائي للوصف من مواصفات المصعد الحالية' : 'Regenerate from elevator specs'}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isAr ? 'تحديث من المواصفات' : 'Sync Specs'}</span>
                  </button>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  placeholder={isAr ? 'أدخل تفاصيل التوليد المعماري...' : 'Enter architectural rendering prompt...'}
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{isAr ? 'الأبعاد المعتمدة: 4:3 (مناسبة لعرض السعر PDF)' : 'Aspect Ratio: 4:3 (Optimized for PDF A4)'}</span>
                  <span className="font-mono text-indigo-700 font-bold">Model: Imagen / Gemini</span>
                </div>

                {/* Primary Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.99] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>
                    {isGenerating
                      ? (isAr ? 'جاري توليد الصورة المعمارية...' : 'Generating via Imagen API...')
                      : (isAr ? 'توليد بالذكاء الاصطناعي (Generate via Imagen)' : 'Generate via Imagen API')}
                  </span>
                </button>
              </div>

              {/* Instant Architectural Presets Library */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'أو اختر نموذجاً جاهزاً بضغطة زر (Instant Presets):' : 'Or Pick Instant Architectural Preset:'}</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {ARCHITECTURAL_PRESETS.map((preset) => {
                    const isSelected = currentImage === preset.svgDataUri;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-12 h-9 rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-300">
                          <img
                            src={preset.svgDataUri}
                            alt={preset.titleEn}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-slate-900 block truncate">
                            {isAr ? preset.titleAr : preset.titleEn}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {preset.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 6 cols: Live Preview & PDF Options */}
            <div className="lg:col-span-6 space-y-3">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-lg flex flex-col">
                <div className="flex items-center justify-between px-3 py-1.5 text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300 font-bold">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAr ? 'معاينة التصور المعماري الفعلي' : 'Architectural Render Preview'}</span>
                  </span>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    4:3 HD
                  </span>
                </div>

                {/* Render Viewport */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt="Elevator Architectural Render"
                      className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-102"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-slate-500 p-6">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">{isAr ? 'لا توجد صورة معمارية محددة حالياً' : 'No architectural image selected'}</p>
                    </div>
                  )}

                  {/* Stamp Badge */}
                  <div className="absolute top-3 end-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/20">
                    {spec.projectName || 'Twins Elevator'}
                  </div>
                </div>
              </div>

              {/* PDF Quotation Controls */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-3 shadow-2xs">
                {/* Include in PDF Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-include-pdf"
                      checked={includeInPdf}
                      onChange={(e) => setIncludeInPdf(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="toggle-include-pdf" className="text-xs font-bold text-slate-900 cursor-pointer">
                      {isAr ? 'تضمين الصورة المعمارية في طباعة عرض السعر (PDF Quotation)' : 'Include Render in PDF Quotation Printout'}
                    </label>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                    includeInPdf ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {includeInPdf ? (isAr ? 'مفعل بالتقرير' : 'Active') : (isAr ? 'معطل' : 'Off')}
                  </span>
                </div>

                {/* Caption Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'التعليق المكتوب أسفل الصورة في عرض السعر PDF:' : 'Caption text under image in PDF Quotation:'}
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder={isAr ? 'مثال: تصور ثلاثي الأبعاد مقترح لكابينة المصعد...' : 'e.g. 3D Architectural render of elevator cabin...'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isAr ? 'اعتماد وحفظ التصور المعماري للمشروع' : 'Apply & Save Render to Project'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
