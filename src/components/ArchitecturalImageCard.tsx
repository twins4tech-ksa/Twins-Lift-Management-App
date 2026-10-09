import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Building2,
  Eye,
  Check,
  Palette,
  Maximize2,
  FileCheck
} from 'lucide-react';
import { ElevatorSpecification } from '../types/elevator';
import { ArchitecturalVisualizerModal } from './ArchitecturalVisualizerModal';
import { ARCHITECTURAL_PRESETS, ArchitecturalPreset } from '../utils/architecturalPresets';

interface Props {
  spec: ElevatorSpecification;
  onUpdateSpec: (partial: Partial<ElevatorSpecification>) => void;
  language?: 'ar' | 'en';
}

export const ArchitecturalImageCard: React.FC<Props> = ({
  spec,
  onUpdateSpec,
  language = 'ar',
}) => {
  const isAr = language === 'ar';
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentImage = spec.architecturalRenderUrl || ARCHITECTURAL_PRESETS[0].svgDataUri;
  const isIncludedInPdf = spec.includeRenderInPdf !== false;

  const handleApplyPreset = (preset: ArchitecturalPreset) => {
    onUpdateSpec({
      architecturalRenderUrl: preset.svgDataUri,
      architecturalRenderType: preset.type,
      architecturalRenderPrompt: preset.defaultPrompt,
      includeRenderInPdf: true,
    });
  };

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-700/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-white">
                  {isAr ? 'التصور المعماري ثلاثي الأبعاد لكابينة وبئر المصعد' : '3D Architectural Visualization (Imagen AI)'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {isAr ? 'عرض السعر PDF' : 'PDF Quotation'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isAr
                  ? 'إضافة صورة معمارية احترافية للمصعد تعزز المظهر الهندسي وجماليات العرض الفني والمالي'
                  : 'Add architectural 3D rendering to significantly elevate the visual quality of PDF quotations'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAr ? 'فتح استوديو التوليد (Imagen Studio)' : 'Open Imagen Studio'}</span>
          </button>
        </div>

        {/* Content Body: Preview & Quick Selection */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
          
          {/* Left Preview Box (5 cols) */}
          <div className="md:col-span-5 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700 aspect-4/3 flex items-center justify-center group shadow-inner">
            <img
              src={currentImage}
              alt="Elevator Architectural Render"
              className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-102"
              referrerPolicy="no-referrer"
            />

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-2xs cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>{isAr ? 'تعديل أو توليد جديد' : 'Edit or Regenerate'}</span>
            </button>

            {/* Status Tag */}
            <div className="absolute top-2 start-2 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold border border-white/20">
              {spec.architecturalRenderType || 'CABIN_INTERIOR'}
            </div>
          </div>

          {/* Right Controls & Quick Presets (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                {isAr ? 'النماذج المعمارية السريعة (Instant 1-Click Renders):' : 'Instant Architectural Renders:'}
              </span>

              <div className="grid grid-cols-2 gap-2">
                {ARCHITECTURAL_PRESETS.slice(0, 4).map((preset) => {
                  const isCurrent = (spec.architecturalRenderUrl || ARCHITECTURAL_PRESETS[0].svgDataUri) === preset.svgDataUri;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2 rounded-xl border text-start transition-all flex items-center gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-2xs font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-8 h-6 rounded overflow-hidden bg-black shrink-0 border border-slate-600">
                        <img
                          src={preset.svgDataUri}
                          alt={preset.titleEn}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[11px] truncate flex-1 block">
                        {isAr ? preset.titleAr : preset.titleEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PDF Inclusion Status & Caption */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isIncludedInPdf}
                  onChange={(e) => onUpdateSpec({ includeRenderInPdf: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-600 bg-slate-800 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-200">
                  {isAr ? 'إدراج الصورة المعمارية في صفحة المخططات بعرض السعر PDF' : 'Include render in PDF quotation'}
                </span>
              </label>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] text-indigo-300 hover:text-white font-bold underline cursor-pointer"
              >
                {isAr ? 'تخصيص الوصف' : 'Customize'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Visualizer Modal */}
      <ArchitecturalVisualizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        spec={spec}
        onUpdateSpec={onUpdateSpec}
        language={language}
      />
    </>
  );
};
