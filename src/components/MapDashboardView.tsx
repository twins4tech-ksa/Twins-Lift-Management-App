import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ElevatorSpecification } from '../types/elevator';
import { MaintenanceContract } from '../types/maintenance';
import { AppLanguage } from '../utils/translations';
import { 
  Building2, 
  Wrench, 
  MapPin, 
  Search, 
  Filter, 
  Maximize2, 
  Navigation, 
  User, 
  Phone, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FileText,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import { SearchableSelect } from './SearchableSelect';

// Fix for default Leaflet icon paths in Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom standalone SVG div-icons for sharp, reliable rendering
const createProjectDivIcon = (isSelected: boolean = false) => L.divIcon({
  className: 'custom-leaflet-pin-project',
  html: `
    <div style="position:relative; width:${isSelected ? 38 : 32}px; height:${isSelected ? 38 : 32}px; display:flex; align-items:center; justify-content:center; background:#1d4ed8; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 3px 10px rgba(29,78,216,0.45); cursor:pointer; transition:transform 0.2s;">
      <svg width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
        <path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01"/><path d="M16 6h.01"/>
        <path d="M8 10h.01"/><path d="M16 10h.01"/>
        <path d="M8 14h.01"/><path d="M16 14h.01"/>
      </svg>
      <div style="position:absolute; bottom:-6px; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid #1d4ed8;"></div>
    </div>
  `,
  iconSize: [isSelected ? 38 : 32, isSelected ? 44 : 38],
  iconAnchor: [isSelected ? 19 : 16, isSelected ? 44 : 38],
  popupAnchor: [0, isSelected ? -44 : -38]
});

const createMaintenanceDivIcon = (isSelected: boolean = false) => L.divIcon({
  className: 'custom-leaflet-pin-maintenance',
  html: `
    <div style="position:relative; width:${isSelected ? 38 : 32}px; height:${isSelected ? 38 : 32}px; display:flex; align-items:center; justify-content:center; background:#059669; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 3px 10px rgba(5,150,105,0.45); cursor:pointer; transition:transform 0.2s;">
      <svg width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
      <div style="position:absolute; bottom:-6px; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid #059669;"></div>
    </div>
  `,
  iconSize: [isSelected ? 38 : 32, isSelected ? 44 : 38],
  iconAnchor: [isSelected ? 19 : 16, isSelected ? 44 : 38],
  popupAnchor: [0, isSelected ? -44 : -38]
});

interface MapDashboardViewProps {
  projects: ElevatorSpecification[];
  maintenanceContracts: MaintenanceContract[];
  language: AppLanguage;
  onSelectProject?: (project: ElevatorSpecification) => void;
}

// Map bounds updater component
const MapBoundsUpdater: React.FC<{ markers: { lat: number; lng: number }[]; triggerFit: number }> = ({ markers, triggerFit }) => {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      try {
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 14 });
      } catch (err) {
        console.warn('Could not fit map bounds:', err);
      }
    }
  }, [map, markers, triggerFit]);
  
  return null;
};

/**
 * Procedural hash for deterministic, distributed fallback coordinates
 * Ensures no project or contract ever disappears from the map.
 */
function getDeterministicOffset(id: string, name: string): { dLat: number; dLng: number } {
  const str = (id || '') + (name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const angle = (abs % 360) * (Math.PI / 180);
  const dist = 0.005 + ((abs % 100) / 100) * 0.035; // ~0.5km to 4km
  return {
    dLat: Math.sin(angle) * dist,
    dLng: Math.cos(angle) * dist,
  };
}

/**
 * Comprehensive geocoding & coordinate dictionary covering all Saudi cities,
 * districts, GCC neighbors, and international project regions.
 */
function resolveLocationCoords(
  explicitLat?: number,
  explicitLng?: number,
  locationText?: string,
  id: string = '',
  name: string = ''
): { lat: number; lng: number; isEstimated: boolean } {
  // 1. If explicit valid GPS coordinates are provided
  if (
    typeof explicitLat === 'number' &&
    typeof explicitLng === 'number' &&
    !isNaN(explicitLat) &&
    !isNaN(explicitLng) &&
    explicitLat >= -90 && explicitLat <= 90 &&
    explicitLng >= -180 && explicitLng <= 180 &&
    !(explicitLat === 0 && explicitLng === 0)
  ) {
    return { lat: explicitLat, lng: explicitLng, isEstimated: false };
  }

  const loc = (locationText || '').toLowerCase().trim();
  const offset = getDeterministicOffset(id, name);

  // 2. City & District Knowledge Base
  // Central Region (Riyadh & surrounding)
  if (loc.includes('نرجس') || loc.includes('narjis')) {
    return { lat: 24.8450 + offset.dLat * 0.4, lng: 46.6620 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('عليا') || loc.includes('olaya')) {
    return { lat: 24.6980 + offset.dLat * 0.4, lng: 46.6850 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('نخيل') || loc.includes('nakheel')) {
    return { lat: 24.7520 + offset.dLat * 0.4, lng: 46.6340 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('ياسمين') || loc.includes('yasmin')) {
    return { lat: 24.8190 + offset.dLat * 0.4, lng: 46.6410 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('ملز') || loc.includes('malaz')) {
    return { lat: 24.6650 + offset.dLat * 0.4, lng: 46.7320 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('صحافة') || loc.includes('sahafa')) {
    return { lat: 24.7950 + offset.dLat * 0.4, lng: 46.6500 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('سليمانية') || loc.includes('sulaimaniyah')) {
    return { lat: 24.7060 + offset.dLat * 0.4, lng: 46.7020 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('درعية') || loc.includes('diriyah')) {
    return { lat: 24.7340 + offset.dLat * 0.4, lng: 46.5750 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('حطين') || loc.includes('hittin')) {
    return { lat: 24.7610 + offset.dLat * 0.4, lng: 46.6020 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('رياض') || loc.includes('riyadh')) {
    return { lat: 24.7136 + offset.dLat, lng: 46.6753 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('خرج') || loc.includes('kharj')) {
    return { lat: 24.1555 + offset.dLat, lng: 47.3120 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('دوادمي') || loc.includes('dawadmi')) {
    return { lat: 24.5074 + offset.dLat, lng: 44.3922 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('مجمعة') || loc.includes('majmaah')) {
    return { lat: 25.9056 + offset.dLat, lng: 45.3438 + offset.dLng, isEstimated: true };
  }

  // Western Region (Jeddah, Makkah, Madinah, Taif, Yanbu)
  if (loc.includes('حمراء') || loc.includes('hamra') || loc.includes('كورنيش جدة')) {
    return { lat: 21.5292 + offset.dLat * 0.4, lng: 39.1560 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('جدة') || loc.includes('jeddah')) {
    return { lat: 21.4858 + offset.dLat, lng: 39.1925 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('مكة') || loc.includes('makkah') || loc.includes('mecca')) {
    return { lat: 21.3891 + offset.dLat, lng: 39.8579 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('مدينة') || loc.includes('madinah') || loc.includes('medina')) {
    return { lat: 24.5247 + offset.dLat, lng: 39.5692 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('طائف') || loc.includes('taif')) {
    return { lat: 21.2854 + offset.dLat, lng: 40.4244 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('ينبع') || loc.includes('yanbu')) {
    return { lat: 24.0924 + offset.dLat, lng: 38.0637 + offset.dLng, isEstimated: true };
  }

  // Eastern Region (Dammam, Khobar, Dhahran, Jubail, Ahsa, Qatif)
  if (loc.includes('دمام') || loc.includes('dammam')) {
    return { lat: 26.4207 + offset.dLat, lng: 50.0888 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('خبر') || loc.includes('khobar')) {
    return { lat: 26.2172 + offset.dLat, lng: 50.1971 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('ظهران') || loc.includes('dhahran')) {
    return { lat: 26.2361 + offset.dLat, lng: 50.0393 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('جبيل') || loc.includes('jubail')) {
    return { lat: 27.0037 + offset.dLat, lng: 49.6583 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('أحساء') || loc.includes('احساء') || loc.includes('الهفوف') || loc.includes('ahsa') || loc.includes('hofuf')) {
    return { lat: 25.3800 + offset.dLat, lng: 49.5855 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('قطيف') || loc.includes('qatif')) {
    return { lat: 26.5569 + offset.dLat, lng: 50.0076 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('حفر الباطن') || loc.includes('hafar')) {
    return { lat: 28.4328 + offset.dLat, lng: 45.9708 + offset.dLng, isEstimated: true };
  }

  // Southern Region
  if (loc.includes('أبها') || loc.includes('ابها') || loc.includes('abha')) {
    return { lat: 18.2164 + offset.dLat, lng: 42.5053 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('خميس مشيط') || loc.includes('khamis')) {
    return { lat: 18.3009 + offset.dLat, lng: 42.7330 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('جازان') || loc.includes('جيزان') || loc.includes('jazan')) {
    return { lat: 16.8892 + offset.dLat, lng: 42.5511 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('نجران') || loc.includes('najran')) {
    return { lat: 17.4924 + offset.dLat, lng: 44.1277 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('باحة') || loc.includes('baha')) {
    return { lat: 20.0129 + offset.dLat, lng: 41.4677 + offset.dLng, isEstimated: true };
  }

  // Qassim & Northern Region
  if (loc.includes('قصيم') || loc.includes('qassim') || loc.includes('بريدة') || loc.includes('buraidah') || loc.includes('عنيزة')) {
    return { lat: 26.3260 + offset.dLat, lng: 43.9750 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('تبوك') || loc.includes('tabuk')) {
    return { lat: 28.3835 + offset.dLat, lng: 36.5662 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('حائل') || loc.includes('hail')) {
    return { lat: 27.5114 + offset.dLat, lng: 41.7208 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('جوف') || loc.includes('jouf') || loc.includes('سكاكا')) {
    return { lat: 29.9697 + offset.dLat, lng: 40.2064 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('عرعر') || loc.includes('arar')) {
    return { lat: 30.9753 + offset.dLat, lng: 41.0381 + offset.dLng, isEstimated: true };
  }

  // International / GCC Project Locations
  if (loc.includes('دبي') || loc.includes('dubai') || loc.includes('palm jumeirah') || loc.includes('uae') || loc.includes('إمارات')) {
    return { lat: 25.1124 + offset.dLat * 0.3, lng: 55.1390 + offset.dLng * 0.3, isEstimated: true };
  }
  if (loc.includes('أبوظبي') || loc.includes('abudhabi')) {
    return { lat: 24.4539 + offset.dLat, lng: 54.3773 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('كويت') || loc.includes('kuwait')) {
    return { lat: 29.3759 + offset.dLat, lng: 47.9774 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('بحرين') || loc.includes('bahrain') || loc.includes('manama')) {
    return { lat: 26.2285 + offset.dLat, lng: 50.5860 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('قطر') || loc.includes('qatar') || loc.includes('doha')) {
    return { lat: 25.2854 + offset.dLat, lng: 51.5310 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('عمان') || loc.includes('oman') || loc.includes('مسقط')) {
    return { lat: 23.5880 + offset.dLat, lng: 58.3829 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('مصر') || loc.includes('cairo') || loc.includes('قاهرة')) {
    return { lat: 30.0444 + offset.dLat, lng: 31.2357 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('london') || loc.includes('لندن') || loc.includes('uk') || loc.includes('knightsbridge')) {
    return { lat: 51.5014 + offset.dLat * 0.2, lng: -0.1607 + offset.dLng * 0.2, isEstimated: true };
  }
  if (loc.includes('chicago') || loc.includes('شيكاغو') || loc.includes('usa') || loc.includes('michigan')) {
    return { lat: 41.8953 + offset.dLat * 0.2, lng: -87.6243 + offset.dLng * 0.2, isEstimated: true };
  }
  if (loc.includes('singapore') || loc.includes('سنغافورة') || loc.includes('marina')) {
    return { lat: 1.2796 + offset.dLat * 0.2, lng: 103.8548 + offset.dLng * 0.2, isEstimated: true };
  }

  // 3. Fallback: Distributed radial placement around central Riyadh business hub
  // This guarantees that ANY project or contract with no recognized keyword will still be plotted!
  const baseLat = 24.7136;
  const baseLng = 46.6753;
  return {
    lat: baseLat + offset.dLat * 1.5,
    lng: baseLng + offset.dLng * 1.5,
    isEstimated: true,
  };
}

export const MapDashboardView: React.FC<MapDashboardViewProps> = ({ 
  projects, 
  maintenanceContracts, 
  language,
  onSelectProject
}) => {
  const isAr = language === 'ar';
  
  // Interactive Filters State
  const [siteTypeFilter, setSiteTypeFilter] = useState<'ALL' | 'PROJECTS' | 'MAINTENANCE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE_APPROVED' | 'DRAFT_SENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [triggerFit, setTriggerFit] = useState<number>(0);

  // Process ALL projects with resolved coordinates
  const processedProjects = useMemo(() => {
    return projects.map(p => {
      const coords = resolveLocationCoords(p.latitude, p.longitude, p.siteLocation, p.id, p.projectName);
      return {
        id: p.id,
        ref: p.quoteRef || p.id,
        type: 'project' as const,
        name: p.projectName,
        clientName: p.clientName,
        clientPhone: p.clientPhone,
        location: p.siteLocation || (isAr ? 'الرياض - الموقع الرئيسي' : 'Riyadh - Main Site'),
        lat: coords.lat,
        lng: coords.lng,
        isEstimated: coords.isEstimated,
        status: p.status || 'Draft',
        price: p.totalQuotationPrice,
        stops: p.stops,
        capacityKg: p.capacityKg,
        speed: p.ratedSpeed,
        elevatorType: p.elevatorType,
        assignedPerson: p.assignedSalesRepName,
      };
    });
  }, [projects, isAr]);

  // Process ALL maintenance contracts with resolved coordinates
  const processedMaintenance = useMemo(() => {
    return maintenanceContracts.map(c => {
      const coords = resolveLocationCoords(c.latitude, c.longitude, c.siteLocation, c.id, c.customerName);
      return {
        id: c.id,
        ref: c.contractRef || c.id,
        type: 'maintenance' as const,
        name: c.title || c.customerName,
        clientName: c.customerName,
        clientPhone: c.customerPhone,
        location: c.siteLocation || (isAr ? 'الرياض - موقع العقد' : 'Riyadh - Contract Site'),
        lat: coords.lat,
        lng: coords.lng,
        isEstimated: coords.isEstimated,
        status: c.status || 'Active',
        price: c.totalPrice,
        stops: c.elevatorStops,
        capacityKg: c.elevatorCapacityKg,
        elevatorBrand: c.elevatorBrand || c.elevatorName,
        assignedPerson: c.assignedTechnicianName,
        contractType: c.contractType,
        endDate: c.endDate,
      };
    });
  }, [maintenanceContracts, isAr]);

  // Combined site markers
  const allRawSites = useMemo(() => {
    return [...processedProjects, ...processedMaintenance];
  }, [processedProjects, processedMaintenance]);

  // Filter markers based on user selection
  const filteredMarkers = useMemo(() => {
    return allRawSites.filter(item => {
      // 1. Type filter
      if (siteTypeFilter === 'PROJECTS' && item.type !== 'project') return false;
      if (siteTypeFilter === 'MAINTENANCE' && item.type !== 'maintenance') return false;

      // 2. Status filter
      if (statusFilter === 'ACTIVE_APPROVED') {
        const s = item.status.toLowerCase();
        const isActive = s === 'approved' || s === 'won' || s === 'installed' || s === 'active';
        if (!isActive) return false;
      } else if (statusFilter === 'DRAFT_SENT') {
        const s = item.status.toLowerCase();
        const isDraft = s === 'draft' || s === 'sent';
        if (!isDraft) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesClient = item.clientName.toLowerCase().includes(q);
        const matchesRef = item.ref.toLowerCase().includes(q);
        const matchesLoc = item.location.toLowerCase().includes(q);
        if (!matchesName && !matchesClient && !matchesRef && !matchesLoc) return false;
      }

      return true;
    });
  }, [allRawSites, siteTypeFilter, statusFilter, searchQuery]);

  // Counts for UI display
  const projectCount = filteredMarkers.filter(m => m.type === 'project').length;
  const maintenanceCount = filteredMarkers.filter(m => m.type === 'maintenance').length;

  // Default initial center (Riyadh / Saudi Hub)
  const defaultCenter: [number, number] = [24.7136, 46.6753];

  const handleFitBounds = () => {
    setTriggerFit(prev => prev + 1);
  };

  // Helper for status styling & translation
  const getStatusBadge = (status: string, isProject: boolean) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'active' || s === 'won' || s === 'installed') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: isAr ? (s === 'active' ? 'عقد ساري' : s === 'installed' ? 'تم التركيب' : 'معتمد') : status,
      };
    }
    if (s === 'sent') {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        text: isAr ? 'تم الإرسال للعميل' : 'Sent',
      };
    }
    if (s === 'draft') {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        text: isAr ? 'مسودة قيد الإعداد' : 'Draft',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      text: status,
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative flex flex-col h-[700px]">
      {/* Top Header & Control Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-3 z-10">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {isAr ? 'الخريطة التفاعلية لمواقع العمل والمشاريع' : 'Interactive Sites & Maintenance Map'}
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {isAr ? `${filteredMarkers.length} موقع نشط` : `${filteredMarkers.length} Sites`}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            {isAr 
              ? 'تغطية شاملة لجميع مشاريع توريد وتركيب المصاعد وعقود ومواقع الصيانة الدورية'
              : 'Full geographic coverage of all elevator installation projects and maintenance sites'}
          </p>
        </div>

        {/* Quick Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Site Type Segmented Control */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setSiteTypeFilter('ALL')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                siteTypeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? `الكل (${allRawSites.length})` : `All (${allRawSites.length})`}
            </button>
            <button
              type="button"
              onClick={() => setSiteTypeFilter('PROJECTS')}
              className={`px-3 py-1 font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                siteTypeFilter === 'PROJECTS'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isAr ? `المشاريع (${processedProjects.length})` : `Projects (${processedProjects.length})`}</span>
            </button>
            <button
              type="button"
              onClick={() => setSiteTypeFilter('MAINTENANCE')}
              className={`px-3 py-1 font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                siteTypeFilter === 'MAINTENANCE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isAr ? `الصيانة (${processedMaintenance.length})` : `Maintenance (${processedMaintenance.length})`}</span>
            </button>
          </div>

          {/* Status Dropdown */}
          <div className="min-w-[170px]">
            <SearchableSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="ALL">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="ACTIVE_APPROVED">{isAr ? 'السارية والمعتمدة فقط' : 'Active & Approved only'}</option>
              <option value="DRAFT_SENT">{isAr ? 'المسودات والعروض المرسلة' : 'Drafts & Sent'}</option>
            </SearchableSelect>
          </div>

          {/* Fit Bounds Button */}
          <button
            type="button"
            onClick={handleFitBounds}
            title={isAr ? 'إعادة ضبط نطاق الخريطة لعرض جميع المواقع' : 'Fit all markers in view'}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{isAr ? 'ضبط النطاق' : 'Fit View'}</span>
          </button>
        </div>
      </div>

      {/* Search Input Strip */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-3 z-10 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'البحث باسم المشروع، اسم العميل، رقم المرجع، أو المدينة والحي...' : 'Search project, client, ref, or district...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-blue-900">{isAr ? `مشاريع (${projectCount})` : `Projects (${projectCount})`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span className="text-emerald-900">{isAr ? `صيانة (${maintenanceCount})` : `Maintenance (${maintenanceCount})`}</span>
          </div>
        </div>
      </div>
      
      {/* Map Container Viewport */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer 
          center={defaultCenter} 
          zoom={6} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBoundsUpdater markers={filteredMarkers} triggerFit={triggerFit} />
          
          {filteredMarkers.map((marker) => {
            const isProject = marker.type === 'project';
            const badge = getStatusBadge(marker.status, isProject);
            const isSelected = selectedMarkerId === marker.id;

            return (
              <Marker 
                key={`${marker.type}-${marker.id}`} 
                position={[marker.lat, marker.lng]}
                icon={isProject ? createProjectDivIcon(isSelected) : createMaintenanceDivIcon(isSelected)}
                eventHandlers={{
                  click: () => setSelectedMarkerId(marker.id),
                }}
              >
                <Popup className="custom-site-popup" maxWidth={320}>
                  <div className="text-right p-1" dir={isAr ? "rtl" : "ltr"}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        {isProject ? (
                          <div className="p-1 rounded-md bg-blue-50 text-blue-700">
                            <Building2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                            <Wrench className="w-4 h-4" />
                          </div>
                        )}
                        <span className="line-clamp-1">{marker.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Metadata Card */}
                    <div className="text-xs space-y-1.5 text-slate-700">
                      <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded">
                        <span className="text-slate-500">{isAr ? 'رقم المرجع:' : 'Reference:'}</span>
                        <span className="font-mono font-bold text-slate-800">{marker.ref}</span>
                      </div>

                      <div className="flex items-start gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-snug">{marker.location}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500">{isAr ? 'العميل:' : 'Client:'}</span>
                        <span className="font-bold text-slate-900">{marker.clientName}</span>
                      </div>

                      {marker.assignedPerson && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">
                            {isProject ? (isAr ? 'مندوب المبيعات:' : 'Sales Rep:') : (isAr ? 'الفني المسند:' : 'Technician:')}
                          </span>
                          <span className="font-medium text-slate-800">{marker.assignedPerson}</span>
                        </div>
                      )}

                      {marker.stops && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">{isAr ? 'المواصفات:' : 'Specs:'}</span>
                          <span className="font-mono text-slate-800">
                            {marker.stops} {isAr ? 'وقفات' : 'stops'} {marker.capacityKg ? `• ${marker.capacityKg}kg` : ''}
                          </span>
                        </div>
                      )}

                      {marker.price && marker.price > 0 && (
                        <div className="flex items-center justify-between text-[11px] bg-emerald-50/70 border border-emerald-100 p-1.5 rounded-md mt-1">
                          <span className="text-emerald-800 font-medium">
                            {isProject ? (isAr ? 'قيمة العرض:' : 'Quotation:') : (isAr ? 'قيمة العقد السنوي:' : 'Contract:')}
                          </span>
                          <span className="font-extrabold text-emerald-900 flex items-center gap-1 font-mono">
                            {marker.price.toLocaleString()} <SaudiRiyalSymbol className="w-3 h-3 inline text-emerald-700" />
                          </span>
                        </div>
                      )}

                      {/* GPS Coordinates & Google Maps Link */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono">
                          {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                          {marker.isEstimated && <span className="text-amber-600 font-sans ms-1">({isAr ? 'مقدر' : 'est'})</span>}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{isAr ? 'فتح في خرائط Google' : 'Google Maps'}</span>
                        </a>
                      </div>

                      {isProject && onSelectProject && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              const proj = projects.find(p => p.id === marker.id);
                              if (proj) onSelectProject(proj);
                            }}
                            className="w-full py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{isAr ? 'فتح تفاصيل وعقد المشروع' : 'Open Project Details'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Sites Counter Badge */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-2 rounded-xl shadow-lg flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>
              {isAr 
                ? `المعروض: ${filteredMarkers.length} موقع (من أصل ${allRawSites.length})` 
                : `Showing: ${filteredMarkers.length} sites (of ${allRawSites.length})`}
            </span>
          </div>
          {filteredMarkers.length < allRawSites.length && (
            <button
              type="button"
              onClick={() => {
                setSiteTypeFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-800 text-[11px] font-bold underline"
            >
              {isAr ? 'عرض الكل' : 'Clear filters'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
