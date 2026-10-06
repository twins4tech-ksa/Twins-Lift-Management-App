import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, X, ZoomIn, Plus, Tag } from 'lucide-react';
import { AttachedPhoto } from '../types/inspection';

interface CameraPhotoCaptureProps {
  photos: AttachedPhoto[];
  onChange: (photos: AttachedPhoto[]) => void;
  maxPhotos?: number;
  label?: string;
  isAr?: boolean;
  category?: string;
  checkpointId?: string;
}

export const CameraPhotoCapture: React.FC<CameraPhotoCaptureProps> = ({
  photos = [],
  onChange,
  maxPhotos = 6,
  label,
  isAr = true,
  category,
  checkpointId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoForPreview, setSelectedPhotoForPreview] = useState<AttachedPhoto | null>(null);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Compress & encode image
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 0.78
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (photos.length >= maxPhotos) {
      alert(isAr ? `الحد الأقصى للصور هو ${maxPhotos}` : `Maximum photos limit is ${maxPhotos}`);
      return;
    }

    setIsProcessing(true);
    const newPhotos: AttachedPhoto[] = [];

    for (let i = 0; i < fileList.length; i++) {
      if (photos.length + newPhotos.length >= maxPhotos) break;
      const file = fileList[i];
      try {
        const dataUrl = await processImageFile(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl,
          caption: isAr ? 'صورة ميدانية للقطعة / العطل' : 'Field photo',
          timestamp: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          category,
          checkpointId,
        });
      } catch (err) {
        console.error('Failed to process image', err);
      }
    }

    setIsProcessing(false);
    onChange([...photos, ...newPhotos]);
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
    if (selectedPhotoForPreview?.id === id) {
      setSelectedPhotoForPreview(null);
    }
  };

  const handleSaveCaption = (id: string) => {
    onChange(
      photos.map((p) => {
        if (p.id === id) {
          return { ...p, caption: captionText.trim() || p.caption };
        }
        return p;
      })
    );
    setEditingCaptionId(null);
    setCaptionText('');
  };

  return (
    <div className="space-y-2">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Trigger Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          <span>{label || (isAr ? 'صور العطل والقطع التالفة:' : 'Defect / Parts Photos:')}</span>
          <span className="text-[10px] text-slate-400 font-mono">({photos.length}/{maxPhotos})</span>
        </span>

        {photos.length < maxPhotos && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
              title={isAr ? 'التقاط صورة بالكاميرا' : 'Take Photo with Camera'}
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'الكاميرا مباشرة' : 'Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={isAr ? 'اختيار من المعرض' : 'Choose from Gallery'}
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>{isAr ? 'المعرض' : 'Gallery'}</span>
            </button>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="text-xs text-blue-600 font-bold animate-pulse flex items-center gap-1.5 py-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          <span>{isAr ? 'جاري معالجة وضغط الصورة...' : 'Processing image...'}</span>
        </div>
      )}

      {/* Photos Grid Thumbnails */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs aspect-square flex flex-col justify-between"
            >
              <img
                src={photo.dataUrl}
                alt={photo.caption}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedPhotoForPreview(photo)}
              />

              {/* Timestamp Badge */}
              <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/70 text-white px-1 py-0.2 rounded backdrop-blur-2xs">
                {photo.timestamp}
              </span>

              {/* Action Buttons overlay */}
              <div className="absolute top-1 left-1 right-1 flex items-center justify-between opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCaptionId(photo.id);
                    setCaptionText(photo.caption);
                  }}
                  className="p-1 bg-black/60 hover:bg-black/90 text-white rounded-md text-[10px] cursor-pointer"
                  title={isAr ? 'تعديل الوصف' : 'Edit Caption'}
                >
                  <Tag className="w-2.5 h-2.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] cursor-pointer"
                  title={isAr ? 'حذف الصورة' : 'Delete'}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Caption Preview */}
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 pointer-events-none">
                  <p className="text-[9px] text-white truncate font-medium">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}

          {/* Quick Add Placeholder */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 aspect-square text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-bold">{isAr ? '+ صورة' : '+ Photo'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
          <p className="text-[11px] text-slate-400">
            {isAr ? 'لا توجد صور مرفقة حتى الآن. انقر على الكاميرا لالتقاط صورة للقطعة المعيبة.' : 'No photos attached yet. Tap camera to snap defect.'}
          </p>
        </div>
      )}

      {/* Caption Edit Dialog */}
      {editingCaptionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'إضافة توصيف توضيحي للصورة' : 'Add Photo Caption'}</span>
            </h4>
            <input
              type="text"
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder={isAr ? 'مثال: تآكل في تيل الفرامل، كسر في مجرى الباب...' : 'e.g. Worn brake pads, door sill crack...'}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCaptionId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveCaption(editingCaptionId)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                {isAr ? 'حفظ التوصيف' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhotoForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="p-3 bg-slate-950/80 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold truncate">{selectedPhotoForPreview.caption}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoForPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden bg-black">
              <img
                src={selectedPhotoForPreview.dataUrl}
                alt={selectedPhotoForPreview.caption}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>{isAr ? 'الوقت المسجل:' : 'Timestamp:'} {selectedPhotoForPreview.timestamp}</span>
              <button
                type="button"
                onClick={() => handleRemovePhoto(selectedPhotoForPreview.id)}
                className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'حذف هذه الصورة' : 'Delete Photo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
