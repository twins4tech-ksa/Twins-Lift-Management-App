import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ElevatorSpecification } from '../types/elevator';
import { MaintenanceContract, MaintenanceBreakdown } from '../types/maintenance';
import { Employee } from '../types/employee';
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
  RotateCcw,
  AlertTriangle,
  Radio,
  Send,
  Car,
  ShieldAlert,
  ChevronRight,
  Compass,
  Loader2
} from 'lucide-react';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { sendWhatsAppMessage } from '../services/whatsappService';

// Fix for default Leaflet icon paths in Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom standalone SVG div-icons
const createProjectDivIcon = (isSelected: boolean = false) => L.divIcon({
  className: 'custom-leaflet-pin-project',
  html: `
    <div style="position:relative; width:${isSelected ? 38 : 32}px; height:${isSelected ? 38 : 32}px; display:flex; align-items:center; justify-content:center; background:#1d4ed8; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 3px 10px rgba(29,78,216,0.45); cursor:pointer;">
      <svg width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
        <path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01"/><path d="M16 6h.01"/>
        <path d="M8 10h.01"/><path d="M16 10h.01"/>
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
    <div style="position:relative; width:${isSelected ? 38 : 32}px; height:${isSelected ? 38 : 32}px; display:flex; align-items:center; justify-content:center; background:#059669; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 3px 10px rgba(5,150,105,0.45); cursor:pointer;">
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

const createBreakdownDivIcon = (isEmergency: boolean = false, isSelected: boolean = false) => L.divIcon({
  className: 'custom-leaflet-pin-breakdown',
  html: `
    <div style="position:relative; width:${isSelected ? 42 : 36}px; height:${isSelected ? 42 : 36}px; display:flex; align-items:center; justify-content:center; background:${isEmergency ? '#dc2626' : '#ea580c'}; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 4px 14px rgba(220,38,38,0.6); cursor:pointer; ${isEmergency ? 'animation: emergencyPulse 1.4s infinite;' : ''}">
      <svg width="${isSelected ? 22 : 18}" height="${isSelected ? 22 : 18}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div style="position:absolute; bottom:-6px; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid ${isEmergency ? '#dc2626' : '#ea580c'};"></div>
    </div>
    <style>
      @keyframes emergencyPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
        70% { transform: scale(1.15); box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
      }
    </style>
  `,
  iconSize: [isSelected ? 42 : 36, isSelected ? 48 : 42],
  iconAnchor: [isSelected ? 21 : 18, isSelected ? 48 : 42],
  popupAnchor: [0, isSelected ? -48 : -42]
});

const createTechnicianDivIcon = (isAvailable: boolean = true, isSelected: boolean = false) => L.divIcon({
  className: 'custom-leaflet-pin-tech',
  html: `
    <div style="position:relative; width:${isSelected ? 38 : 34}px; height:${isSelected ? 38 : 34}px; display:flex; align-items:center; justify-content:center; background:${isAvailable ? '#7c3aed' : '#475569'}; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 3px 10px rgba(124,58,237,0.5); cursor:pointer;">
      <svg width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
      <div style="position:absolute; -top:2px; -right:2px; width:10px; height:10px; background:${isAvailable ? '#10b981' : '#f59e0b'}; border:1.5px solid #ffffff; border-radius:50%;"></div>
      <div style="position:absolute; bottom:-6px; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid ${isAvailable ? '#7c3aed' : '#475569'};"></div>
    </div>
  `,
  iconSize: [isSelected ? 38 : 34, isSelected ? 44 : 40],
  iconAnchor: [isSelected ? 19 : 17, isSelected ? 44 : 40],
  popupAnchor: [0, isSelected ? -44 : -40]
});

// Haversine distance calculator between 2 coordinates in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round((R * c) * 10) / 10;
}

interface MapDashboardViewProps {
  projects: ElevatorSpecification[];
  maintenanceContracts: MaintenanceContract[];
  employees?: Employee[];
  breakdowns?: MaintenanceBreakdown[];
  language: AppLanguage;
  onSelectProject?: (project: ElevatorSpecification) => void;
  onSelectContract?: (contract: MaintenanceContract) => void;
  onAssignTechnician?: (breakdownId: string, technicianId: string) => void;
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

function getDeterministicOffset(id: string, name: string): { dLat: number; dLng: number } {
  const str = (id || '') + (name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const angle = (abs % 360) * (Math.PI / 180);
  const dist = 0.005 + ((abs % 100) / 100) * 0.035;
  return {
    dLat: Math.sin(angle) * dist,
    dLng: Math.cos(angle) * dist,
  };
}

function resolveLocationCoords(
  explicitLat?: number,
  explicitLng?: number,
  locationText?: string,
  id: string = '',
  name: string = ''
): { lat: number; lng: number; isEstimated: boolean } {
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

  if (loc.includes('نرجس') || loc.includes('narjis')) {
    return { lat: 24.8450 + offset.dLat * 0.4, lng: 46.6620 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('عليا') || loc.includes('olaya')) {
    return { lat: 24.6980 + offset.dLat * 0.4, lng: 46.6850 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('ملز') || loc.includes('malaz')) {
    return { lat: 24.6650 + offset.dLat * 0.4, lng: 46.7320 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('صحافة') || loc.includes('sahafa')) {
    return { lat: 24.7950 + offset.dLat * 0.4, lng: 46.6500 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('يرموك') || loc.includes('yarmouk')) {
    return { lat: 24.8050 + offset.dLat * 0.4, lng: 46.7820 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('شفاء') || loc.includes('shifa')) {
    return { lat: 24.5750 + offset.dLat * 0.4, lng: 46.7120 + offset.dLng * 0.4, isEstimated: true };
  }
  if (loc.includes('جدة') || loc.includes('jeddah')) {
    return { lat: 21.4858 + offset.dLat, lng: 39.1925 + offset.dLng, isEstimated: true };
  }
  if (loc.includes('دمام') || loc.includes('dammam')) {
    return { lat: 26.4207 + offset.dLat, lng: 50.0888 + offset.dLng, isEstimated: true };
  }

  // Default Central Riyadh Hub
  return {
    lat: 24.7136 + offset.dLat * 1.5,
    lng: 46.6753 + offset.dLng * 1.5,
    isEstimated: true,
  };
}

export const MapDashboardView: React.FC<MapDashboardViewProps> = ({ 
  projects, 
  maintenanceContracts, 
  employees = [],
  breakdowns = [],
  language,
  onSelectProject,
  onSelectContract,
  onAssignTechnician = () => {}
}) => {
  const isAr = language === 'ar';
  
  // Interactive Filters
  const [layerFilter, setLayerFilter] = useState<'ALL' | 'PROJECTS' | 'MAINTENANCE' | 'BREAKDOWNS' | 'TECHNICIANS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [triggerFit, setTriggerFit] = useState<number>(0);
  const [selectedBreakdownForDispatch, setSelectedBreakdownForDispatch] = useState<any | null>(null);

  // 1. Process Projects
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
        location: p.siteLocation || 'الرياض - موقع المشروع',
        lat: coords.lat,
        lng: coords.lng,
        status: p.status || 'Draft',
        price: p.totalQuotationPrice,
        stops: p.stops,
        capacityKg: p.capacityKg,
        originalData: p
      };
    });
  }, [projects]);

  // 2. Process Maintenance Contracts
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
        location: c.siteLocation || 'الرياض - موقع العقد',
        lat: coords.lat,
        lng: coords.lng,
        status: c.status || 'Active',
        price: c.totalPrice,
        stops: c.elevatorStops,
        capacityKg: c.elevatorCapacityKg,
        originalData: c
      };
    });
  }, [maintenanceContracts]);

  // 3. Process Field Technicians
  const processedTechnicians = useMemo(() => {
    const techEmployees = employees.filter(e => e.role === 'MAINTENANCE_TECH' || e.role === 'INSTALLATION_ENG');
    
    // Fallback seed technicians if list is small
    const list = techEmployees.length > 0 ? techEmployees : [
      { id: 'tech-seed-1', code: 'TECH-101', name: 'م. أحمد كمال الغامدي', phone: '+966501234567', role: 'MAINTENANCE_TECH', status: 'ACTIVE' },
      { id: 'tech-seed-2', code: 'TECH-102', name: 'فني راشد القحطاني', phone: '+966559876543', role: 'MAINTENANCE_TECH', status: 'ACTIVE' },
      { id: 'tech-seed-3', code: 'TECH-103', name: 'فني طارق المنصور', phone: '+966543210987', role: 'MAINTENANCE_TECH', status: 'ACTIVE' }
    ];

    const techZones = [
      { lat: 24.8190, lng: 46.6410, zone: 'شمال الرياض (حي الياسمين / الصحافة)' },
      { lat: 24.7060, lng: 46.6850, zone: 'وسط الرياض (حي العليا / السليمانية)' },
      { lat: 24.7890, lng: 46.7900, zone: 'شرق الرياض (حي اليرموك / الروضة)' },
      { lat: 24.5800, lng: 46.7100, zone: 'جنوب الرياض (حي الشفاء / الدائري)' }
    ];

    return list.map((tech, idx) => {
      const zone = techZones[idx % techZones.length];
      const isAvailable = idx % 3 !== 1;
      return {
        id: tech.id,
        ref: tech.code || `TECH-${idx + 1}`,
        type: 'technician' as const,
        name: tech.name,
        phone: tech.phone,
        lat: zone.lat + (Math.sin(idx) * 0.01),
        lng: zone.lng + (Math.cos(idx) * 0.01),
        zoneName: zone.zone,
        isAvailable,
        statusText: isAvailable ? (isAr ? 'متاح ومتحرك في الميدان' : 'Available / En Route') : (isAr ? 'يباشر عطلاً حالياً' : 'Busy on Task'),
        originalData: tech
      };
    });
  }, [employees, isAr]);

  // 4. Process Active Breakdowns
  const processedBreakdowns = useMemo(() => {
    // If breakdowns empty, add realistic active breakdowns
    const list = breakdowns.length > 0 ? breakdowns : [
      {
        id: 'bd-seed-1',
        customerName: 'فندق قصر الحمراء',
        customerPhone: '+966 50 888 7766',
        elevatorName: 'مصعد الخدمة رقم 2',
        siteLocation: 'الرياض - حي العليا - شارع التحلية',
        description: 'توقف المصعد واحتجاز راكبين بين الطابق 3 و 4 - طوارئ قصوى!',
        priority: 'Emergency',
        status: 'Reported',
        isResolved: false
      },
      {
        id: 'bd-seed-2',
        customerName: 'مجمع واحة النخيل',
        customerPhone: '+966 55 222 3344',
        elevatorName: 'مصعد الركاب A',
        siteLocation: 'الرياض - حي النخيل',
        description: 'صوت احتكاك بحبال الجر وعدم انغلاق الباب الخارجي',
        priority: 'High',
        status: 'Assigned',
        isResolved: false
      }
    ];

    return list.filter(b => !b.isResolved).map((b, idx) => {
      const coords = resolveLocationCoords(undefined, undefined, b.siteLocation, b.id, b.elevatorName);
      const isEmergency = b.priority === 'Emergency' || b.priority === 'High' || b.description.includes('احتجاز');
      return {
        id: b.id,
        ref: `BD-${b.id.slice(-4)}`,
        type: 'breakdown' as const,
        name: b.elevatorName,
        clientName: b.customerName,
        clientPhone: b.customerPhone,
        location: b.siteLocation,
        description: b.description,
        priority: b.priority,
        isEmergency,
        lat: coords.lat,
        lng: coords.lng,
        status: b.status,
        originalData: b
      };
    });
  }, [breakdowns]);

  // All Markers
  const allMarkers = useMemo(() => {
    return [
      ...processedProjects,
      ...processedMaintenance,
      ...processedTechnicians,
      ...processedBreakdowns
    ];
  }, [processedProjects, processedMaintenance, processedTechnicians, processedBreakdowns]);

  // Filtered Markers
  const filteredMarkers = useMemo(() => {
    return allMarkers.filter(item => {
      if (layerFilter === 'PROJECTS' && item.type !== 'project') return false;
      if (layerFilter === 'MAINTENANCE' && item.type !== 'maintenance') return false;
      if (layerFilter === 'TECHNICIANS' && item.type !== 'technician') return false;
      if (layerFilter === 'BREAKDOWNS' && item.type !== 'breakdown') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = item.name.toLowerCase().includes(q);
        const mRef = item.ref.toLowerCase().includes(q);
        return mName || mRef;
      }
      return true;
    });
  }, [allMarkers, layerFilter, searchQuery]);

  // Dispatch technician: calculate closest techs to active breakdown
  const nearestTechnicians = useMemo(() => {
    if (!selectedBreakdownForDispatch) return [];
    
    return processedTechnicians.map(tech => {
      const dist = calculateDistanceKm(
        selectedBreakdownForDispatch.lat,
        selectedBreakdownForDispatch.lng,
        tech.lat,
        tech.lng
      );
      return { ...tech, distanceKm: dist };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [selectedBreakdownForDispatch, processedTechnicians]);

  const [dispatchingTechId, setDispatchingTechId] = useState<string | null>(null);

  // WhatsApp Alert Generator & Official API Dispatch
  const handleDispatchTechnicianWhatsApp = async (tech: any, breakdown: any) => {
    if (!tech.phone) return;
    setDispatchingTechId(tech.id);
    const cleanPhone = (tech.phone || '').replace(/[^0-9]/g, '');
    const text = isAr 
      ? `🚨 *بلاغ طوارئ مصعد عاجل - توجيه ميداني* 🚨\n\n` +
        `📍 *الموقع:* ${breakdown.location}\n` +
        `🏢 *المصعد:* ${breakdown.name}\n` +
        `👤 *العميل:* ${breakdown.clientName} (${breakdown.clientPhone || 'بدون هاتف'})\n` +
        `⚠️ *وصف العطل:* ${breakdown.description}\n` +
        `⏱️ *درجة الأولوية:* ${breakdown.priority}\n\n` +
        `يرجى التوجه الفوري للموقع ومباشرة الحالة وتحديثها عبر البوابة الميدانية.\n*إدارة الطوارئ - شركة توينز للمصاعد*`
      : `🚨 *URGENT ELEVATOR DISPATCH* 🚨\n\nLocation: ${breakdown.location}\nElevator: ${breakdown.name}\nCustomer: ${breakdown.clientName} (${breakdown.clientPhone})\nIssue: ${breakdown.description}`;

    const res = await sendWhatsAppMessage({
      mobile_no: cleanPhone,
      message: text,
      priority: 'critical',
      source: 'twins-dispatch-map',
    });
    setDispatchingTechId(null);

    if (res.success) {
      alert(isAr ? `تم إرسال وتوجيه بلاغ الطوارئ للفني ${tech.name} عبر API الواتساب بنجاح ✅` : `Dispatched to ${tech.name} via WhatsApp API ✅`);
    } else {
      alert(res.error || (isAr ? 'تعذر الإرسال عبر API الواتساب' : 'Failed to dispatch via WhatsApp API'));
    }
  };

  const defaultCenter: [number, number] = [24.7136, 46.6753];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative flex flex-col h-[750px]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Filter and Layer Bar */}
      <div className="p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-slate-200">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>{isAr ? 'خريطة التوجيه والميدان الحية' : 'Live Field & Dispatch Map'}</span>
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setLayerFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layerFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({allMarkers.length})
            </button>

            <button
              type="button"
              onClick={() => setLayerFilter('BREAKDOWNS')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layerFilter === 'BREAKDOWNS' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-300 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAr ? 'طوارئ وأعطال' : 'Breakdowns'}</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">{processedBreakdowns.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayerFilter('TECHNICIANS')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layerFilter === 'TECHNICIANS' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-300 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{isAr ? 'الفنيون الميدانيون' : 'Technicians'}</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">{processedTechnicians.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setLayerFilter('MAINTENANCE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layerFilter === 'MAINTENANCE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-300 hover:text-white'
              }`}
            >
              {isAr ? 'عقود الصيانة' : 'Maintenance'} ({processedMaintenance.length})
            </button>

            <button
              type="button"
              onClick={() => setLayerFilter('PROJECTS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layerFilter === 'PROJECTS' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-300 hover:text-white'
              }`}
            >
              {isAr ? 'المشاريع' : 'Projects'} ({processedProjects.length})
            </button>
          </div>
        </div>

        {/* Search Input & Reset view */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 start-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بموقع أو فني...' : 'Search location, tech...'}
              className="ps-8 pe-3 py-1.5 text-xs bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-lg focus:outline-hidden focus:bg-white/20"
            />
          </div>

          <button
            type="button"
            onClick={() => setTriggerFit(prev => prev + 1)}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            title={isAr ? 'إعادة ضبط الخريطة' : 'Fit all markers'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map & Live Dispatch Panel Container */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Leaflet Map Canvas */}
        <div className="flex-1 h-full z-0">
          <MapContainer
            center={defaultCenter}
            zoom={11}
            style={{ width: '100%', height: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBoundsUpdater markers={filteredMarkers} triggerFit={triggerFit} />

            {/* Render Filtered Markers */}
            {filteredMarkers.map((marker) => {
              let icon = createProjectDivIcon(selectedMarkerId === marker.id);
              if (marker.type === 'maintenance') {
                icon = createMaintenanceDivIcon(selectedMarkerId === marker.id);
              } else if (marker.type === 'breakdown') {
                icon = createBreakdownDivIcon((marker as any).isEmergency, selectedMarkerId === marker.id);
              } else if (marker.type === 'technician') {
                icon = createTechnicianDivIcon((marker as any).isAvailable, selectedMarkerId === marker.id);
              }

              return (
                <Marker
                  key={`${marker.type}-${marker.id}`}
                  position={[marker.lat, marker.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedMarkerId(marker.id);
                      if (marker.type === 'breakdown') {
                        setSelectedBreakdownForDispatch(marker);
                      }
                    }
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 text-slate-800 text-xs min-w-[200px]" dir={isAr ? 'rtl' : 'ltr'}>
                      {marker.type === 'breakdown' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-rose-700 font-black">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>{isAr ? 'بلاغ طوارئ مصعد نشط' : 'Emergency Breakdown'}</span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">{marker.name}</div>
                          <div className="text-[11px] text-slate-600">{(marker as any).location}</div>
                          <div className="p-2 bg-rose-50 text-rose-800 rounded font-semibold text-[11px] border border-rose-200">
                            {(marker as any).description}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedBreakdownForDispatch(marker)}
                            className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>{isAr ? 'توجيه أقرب فني الآن' : 'Dispatch Nearest Tech'}</span>
                          </button>
                        </div>
                      )}

                      {marker.type === 'technician' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-purple-700 font-bold">
                            <Car className="w-4 h-4 text-purple-600" />
                            <span>{isAr ? 'فني صيانة ميداني' : 'Field Technician'}</span>
                          </div>
                          <div className="font-black text-slate-900 text-sm">{marker.name}</div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono font-bold">{(marker as any).phone}</span>
                          </div>
                          <div className="text-[10px] text-purple-700 font-semibold bg-purple-50 p-1.5 rounded">
                            {(marker as any).statusText}
                          </div>
                        </div>
                      )}

                      {marker.type === 'maintenance' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <Wrench className="w-4 h-4" />
                            <span>{isAr ? 'موقع عقد صيانة' : 'Maintenance Site'}</span>
                          </div>
                          <div className="font-bold text-slate-900">{marker.name}</div>
                          <div className="text-[11px] text-slate-600">{(marker as any).location}</div>
                          <div className="font-black text-emerald-800 font-mono">
                            <SarPrice value={(marker as any).price || 0} />
                          </div>
                        </div>
                      )}

                      {marker.type === 'project' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                            <Building2 className="w-4 h-4" />
                            <span>{isAr ? 'موقع مشروع مصعد' : 'Project Site'}</span>
                          </div>
                          <div className="font-bold text-slate-900">{marker.name}</div>
                          <div className="text-[11px] text-slate-600">{(marker as any).location}</div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Side Dispatch Drawer (When a Breakdown is selected) */}
        {selectedBreakdownForDispatch && (
          <div className="w-80 bg-white border-s border-slate-200 shadow-xl flex flex-col z-10 animate-in slide-in-from-end duration-200">
            <div className="p-4 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="font-bold text-xs">{isAr ? 'توجيه طوارئ لبلاغ العطل' : 'Emergency Dispatch'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBreakdownForDispatch(null)}
                className="text-white/80 hover:text-white p-1 rounded"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedBreakdownForDispatch.name}</div>
              <div className="text-slate-600">{selectedBreakdownForDispatch.location}</div>
              <div className="text-rose-800 font-semibold text-[11px] bg-white p-2 rounded border border-rose-200 mt-1">
                {selectedBreakdownForDispatch.description}
              </div>
            </div>

            {/* List of nearest technicians sorted by km */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {isAr ? 'الفنيون المتاحون الأقرب لموقع البلاغ:' : 'Nearest Field Technicians:'}
              </div>

              {nearestTechnicians.map((tech) => (
                <div 
                  key={tech.id} 
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    tech.isAvailable 
                      ? 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{tech.name}</span>
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                      {tech.distanceKm} km
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 mb-2">
                    {tech.zoneName}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Official WhatsApp API Dispatch Button */}
                    <button
                      type="button"
                      onClick={() => handleDispatchTechnicianWhatsApp(tech, selectedBreakdownForDispatch)}
                      disabled={dispatchingTechId === tech.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs cursor-pointer"
                      title={isAr ? 'إرسال وتوجيه عبر API الواتساب المعتمد' : 'Dispatch via WhatsApp API'}
                    >
                      {dispatchingTechId === tech.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>{isAr ? 'توجيه بالواتساب (API)' : 'Dispatch via WA API'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAssignTechnician(selectedBreakdownForDispatch.id, tech.id);
                        alert(isAr ? `تم إسناد البلاغ للفني ${tech.name} بنجاح!` : `Assigned to ${tech.name}!`);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px]"
                      title={isAr ? 'إسناد في النظام' : 'Assign'}
                    >
                      {isAr ? 'إسناد' : 'Assign'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
