import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { SiteAttendanceRecord } from '../types/employee';
import { 
  Building2, 
  MapPin, 
  UserCheck, 
  AlertTriangle, 
  ExternalLink, 
  Maximize2, 
  Layers, 
  Compass, 
  X,
  ShieldCheck,
  Clock,
  Calendar,
  Navigation
} from 'lucide-react';

interface Props {
  record: SiteAttendanceRecord;
  onClose: () => void;
  language?: 'ar' | 'en';
}

// Fix Leaflet icon paths in Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Target Site DIV Icon (Blue Building Icon Pin)
const createTargetSiteIcon = () => L.divIcon({
  className: 'custom-leaflet-target-pin',
  html: `
    <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:#1d4ed8; border:3px solid #ffffff; border-radius:50%; box-shadow:0 4px 12px rgba(29,78,216,0.5); cursor:pointer;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
        <path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01"/><path d="M16 6h.01"/>
        <path d="M8 10h.01"/><path d="M16 10h.01"/>
        <path d="M8 14h.01"/><path d="M16 14h.01"/>
      </svg>
      <div style="position:absolute; bottom:-7px; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #1d4ed8;"></div>
    </div>
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48]
});

// Custom Recorded GPS Check-in DIV Icon (Emerald if valid, Rose if out of radius)
const createRecordedGpsIcon = (isWithinRadius: boolean) => {
  const bg = isWithinRadius ? '#059669' : '#e11d48';
  return L.divIcon({
    className: 'custom-leaflet-recorded-pin',
    html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:${bg}; border:3px solid #ffffff; border-radius:50%; box-shadow:0 4px 12px rgba(0,0,0,0.35); cursor:pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <div style="position:absolute; bottom:-7px; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid ${bg};"></div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48]
  });
};

// Map Auto-Fit Bounds & Controls Component
const MapViewManager: React.FC<{
  targetPos: [number, number];
  recordedPos: [number, number];
  viewFocus: 'both' | 'target' | 'recorded';
}> = ({ targetPos, recordedPos, viewFocus }) => {
  const map = useMap();

  useEffect(() => {
    try {
      if (viewFocus === 'target') {
        map.setView(targetPos, 17, { animate: true });
      } else if (viewFocus === 'recorded') {
        map.setView(recordedPos, 17, { animate: true });
      } else {
        const bounds = L.latLngBounds([targetPos, recordedPos]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
      }
    } catch (e) {
      console.warn('Map bounds fit error:', e);
    }
  }, [map, targetPos, recordedPos, viewFocus]);

  return null;
};

// Available Free Open Map Tile Providers (100% Free, No API Key Required)
type TileTheme = 'osm' | 'voyager' | 'satellite';

const TILE_PROVIDERS: Record<TileTheme, { nameAr: string; nameEn: string; url: string; attribution: string; maxZoom: number }> = {
  osm: {
    nameAr: 'خريطة الشارع المفتوحة (OpenStreetMap)',
    nameEn: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  voyager: {
    nameAr: 'خريطة كارتو الهادئة (CartoDB)',
    nameEn: 'CartoDB Modern',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  },
  satellite: {
    nameAr: 'صور الأقمار الصناعية (Satellite)',
    nameEn: 'World Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 18
  }
};

export const AttendanceMapPreview: React.FC<Props> = ({ record, onClose, language = 'ar' }) => {
  const isAr = language === 'ar';
  const [tileTheme, setTileTheme] = useState<TileTheme>('osm');
  const [viewFocus, setViewFocus] = useState<'both' | 'target' | 'recorded'>('both');

  const targetPos = useMemo<[number, number]>(() => [
    record.targetLatitude || 24.7136,
    record.targetLongitude || 46.6753
  ], [record.targetLatitude, record.targetLongitude]);

  const recordedPos = useMemo<[number, number]>(() => [
    record.recordedLatitude || record.targetLatitude || 24.7136,
    record.recordedLongitude || record.targetLongitude || 46.6753
  ], [record.recordedLatitude, record.recordedLongitude, record.targetLatitude, record.targetLongitude]);

  const targetIcon = useMemo(() => createTargetSiteIcon(), []);
  const recordedIcon = useMemo(() => createRecordedGpsIcon(record.isWithinRadius), [record.isWithinRadius]);

  const activeTile = TILE_PROVIDERS[tileTheme];

  const externalOsmUrl = `https://www.openstreetmap.org/?mlat=${recordedPos[0]}&mlon=${recordedPos[1]}#map=16/${recordedPos[0]}/${recordedPos[1]}`;
  const externalGoogleUrl = `https://www.google.com/maps/dir/?api=1&origin=${recordedPos[0]},${recordedPos[1]}&destination=${targetPos[0]},${targetPos[1]}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#172033] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  {isAr ? 'خريطة موقع الحضور والتحقق الجغرافي (OpenMap)' : 'Site Check-In Geofence Map (OpenMap)'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isAr ? 'مجاني ومفتوح 100%' : '100% Free & Open'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>{record.employeeName}</span>
                <span>&bull;</span>
                <span>{record.projectName}</span>
                {record.timeStr && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 inline" />
                      {record.timeStr} ({record.dateStr})
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Controls Toolbar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tile Layer Selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">{isAr ? 'نوع الخريطة:' : 'Map Style:'}</span>
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-300 shadow-sm">
              <button
                type="button"
                onClick={() => setTileTheme('osm')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  tileTheme === 'osm'
                    ? 'bg-[#172033] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'شوارع OpenMap' : 'OpenStreetMap'}
              </button>
              <button
                type="button"
                onClick={() => setTileTheme('voyager')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  tileTheme === 'voyager'
                    ? 'bg-[#172033] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'عصرية (Carto)' : 'Modern'}
              </button>
              <button
                type="button"
                onClick={() => setTileTheme('satellite')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  tileTheme === 'satellite'
                    ? 'bg-[#172033] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'قمر صناعي' : 'Satellite'}
              </button>
            </div>
          </div>

          {/* View Focus Controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">{isAr ? 'التركيز:' : 'Focus:'}</span>
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-300 shadow-sm">
              <button
                type="button"
                onClick={() => setViewFocus('both')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewFocus === 'both' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'عرض الموقعين معاً' : 'Fit Both'}
              </button>
              <button
                type="button"
                onClick={() => setViewFocus('target')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewFocus === 'target' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'الموقع المستهدف' : 'Target Site'}
              </button>
              <button
                type="button"
                onClick={() => setViewFocus('recorded')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewFocus === 'recorded' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'موقع الفني' : 'Technician GPS'}
              </button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 w-full relative min-h-[440px] sm:min-h-[480px] bg-slate-100">
          <MapContainer
            center={targetPos}
            zoom={16}
            style={{ width: '100%', height: '100%', minHeight: '440px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution={activeTile.attribution}
              url={activeTile.url}
              maxZoom={activeTile.maxZoom}
            />

            <MapViewManager
              targetPos={targetPos}
              recordedPos={recordedPos}
              viewFocus={viewFocus}
            />

            {/* Allowed Geofence Radius Circle */}
            <Circle
              center={targetPos}
              radius={record.allowedRadiusMeters || 100}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.16,
                weight: 2,
                dashArray: '6, 6'
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-blue-700">
                    {isAr ? 'نطاق الموقع المسموح به' : 'Allowed Geofence Radius'}
                  </div>
                  <div>{record.allowedRadiusMeters || 100} {isAr ? 'متر' : 'meters'}</div>
                </div>
              </Popup>
            </Circle>

            {/* Connecting Polyline between Target Site and Technician */}
            <Polyline
              positions={[targetPos, recordedPos]}
              pathOptions={{
                color: record.isWithinRadius ? '#059669' : '#e11d48',
                weight: 2.5,
                dashArray: '5, 5',
                opacity: 0.85
              }}
            />

            {/* Target Site Marker */}
            <Marker position={targetPos} icon={targetIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-blue-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 inline" />
                    <span>{record.projectName}</span>
                  </div>
                  <div className="text-slate-600 font-medium">{record.clientName}</div>
                  <div className="text-[11px] text-slate-500">{record.siteLocation}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {targetPos[0].toFixed(5)}, {targetPos[1].toFixed(5)}
                  </div>
                  <div className="pt-1 text-[11px] text-blue-600 font-semibold">
                    {isAr ? `نطاق الحضور: ${record.allowedRadiusMeters}م` : `Radius: ${record.allowedRadiusMeters}m`}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Recorded Employee GPS Marker */}
            <Marker position={recordedPos} icon={recordedIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 inline" />
                    <span>{record.employeeName}</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    {record.dateStr} - {record.timeStr}
                  </div>
                  <div className={`font-bold text-[11px] ${record.isWithinRadius ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {record.isWithinRadius
                      ? (isAr ? '✓ داخل نطاق الموقع المسموح به' : '✓ Verified Inside Geofence')
                      : (isAr ? '⚠ تم التسجيل خارج النطاق المسموح به' : '⚠ Outside Geofence Boundary')}
                  </div>
                  <div className="text-slate-600">
                    {isAr ? 'المسافة عن الهدف:' : 'Distance:'}{' '}
                    <span className="font-bold">{record.distanceMeters} {isAr ? 'متر' : 'm'}</span>
                  </div>
                  {record.deviceAccuracyMeters && (
                    <div className="text-[10px] text-slate-500">
                      {isAr ? 'دقة جهاز GPS:' : 'GPS Accuracy:'} &plusmn;{record.deviceAccuracyMeters}m
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Quick Floating Legend on top-right */}
          <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-slate-200 text-xs space-y-1.5 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-xs"></div>
              <span className="font-medium text-slate-700">{isAr ? 'موقع المشروع (الهدف)' : 'Target Project Site'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full border border-white shadow-xs ${record.isWithinRadius ? 'bg-emerald-600' : 'bg-rose-600'}`}></div>
              <span className="font-medium text-slate-700">
                {record.isWithinRadius 
                  ? (isAr ? 'موقع الفني (داخل النطاق)' : 'Technician GPS (In Range)') 
                  : (isAr ? 'موقع الفني (خارج النطاق)' : 'Technician GPS (Out of Range)')}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="inline-block w-3 border-t-2 border-dashed border-blue-500"></span>
              <span>{isAr ? `نصف القطر: ${record.allowedRadiusMeters}م` : `Geofence: ${record.allowedRadiusMeters}m`}</span>
            </div>
          </div>
        </div>

        {/* Detailed Verification Footer Panel */}
        <div className="bg-white border-t border-slate-200 p-4 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Target Site Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-600" />
                <span>{isAr ? 'الموقع المستهدف للمشروع' : 'Target Project Site'}</span>
              </div>
              <div className="font-bold text-sm text-slate-800 truncate">{record.projectName}</div>
              <div className="text-xs text-slate-600 truncate">{record.siteLocation}</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {targetPos[0].toFixed(5)}, {targetPos[1].toFixed(5)}
              </div>
            </div>

            {/* Check-In Status & Distance */}
            <div className={`border rounded-xl p-3 ${
              record.isWithinRadius 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {record.isWithinRadius ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>{isAr ? 'نتيجة التحقق الجغرافي' : 'Geofence Verification'}</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  record.isWithinRadius ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                }`}>
                  {record.isWithinRadius ? (isAr ? 'مطابق' : 'Verified') : (isAr ? 'خارج النطاق' : 'Out of range')}
                </span>
              </div>
              <div className="font-extrabold text-base flex items-baseline gap-1.5">
                <span>{record.distanceMeters}</span>
                <span className="text-xs font-medium text-slate-600">
                  {isAr ? `متر عن موقع المشروع (المسموح ${record.allowedRadiusMeters}م)` : `meters from site (limit ${record.allowedRadiusMeters}m)`}
                </span>
              </div>
              <div className="text-xs mt-1">
                {record.isWithinRadius ? (
                  <span className="text-emerald-700 font-medium">
                    {isAr ? '✓ تم تسجيل الحضور ضمن حدود الموقع المعتمد.' : '✓ Check-in recorded within approved site perimeter.'}
                  </span>
                ) : (
                  <span className="text-rose-700 font-medium">
                    {isAr ? `⚠ الفني على بعد ${record.distanceMeters}م وتجاوز الحد المسموح.` : `⚠ Check-in was ${record.distanceMeters}m away from site.`}
                  </span>
                )}
              </div>
            </div>

            {/* External Navigation Links */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-slate-600" />
                  <span>{isAr ? 'فتح في خرائط خارجية' : 'External Maps'}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {isAr ? 'عرض الاتجاهات المباشرة بين النقطتين' : 'Open directions and navigation'}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <a
                  href={externalOsmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 text-center flex items-center justify-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>OpenMap</span>
                </a>
                <a
                  href={externalGoogleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 text-center flex items-center justify-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Override Reason Warning if outside radius */}
          {!record.isWithinRadius && record.overrideReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-900">
                  {isAr ? 'مبرر تسجيل الحضور خارج النطاق الجغرافي:' : 'Out-of-Range Check-in Override Justification:'}
                </div>
                <p className="text-xs text-amber-800 mt-0.5">{record.overrideReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
