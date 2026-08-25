"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LocateFixed,
  MapPin,
  Navigation,
  PackageCheck,
  Truck,
} from "lucide-react";

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_CENTER = [10.8231, 106.6297];

const STATUS_PROGRESS = {
  ready_to_pick: 0,
  picking: 8,
  picked: 18,
  storing: 30,
  transporting: 45,
  sorting: 62,
  delivering: 76,
  delivered: 100,
};

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function normalizeAddress(value) {
  return String(value || "").replace(/\s+/g, " ").replace(/,+/g, ",").trim();
}

function formatDistance(meters) {
  if (!meters) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function loadLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("Không có trình duyệt."));
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.crossOrigin = "";
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Không tải được Leaflet.")));
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function geocode(query) {
  const text = normalizeAddress(query);
  if (!text) return null;

  const key = `dynova_geocode_${text.toLowerCase()}`;

  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {}

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "vn");
  url.searchParams.set("accept-language", "vi");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  const point = {
    lat: Number(row.lat),
    lng: Number(row.lon),
    displayName: row.display_name || text,
  };

  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;

  try {
    sessionStorage.setItem(key, JSON.stringify(point));
  } catch {}

  return point;
}

async function geocodeWithFallback(primary, fallbacks = []) {
  const queries = [primary, ...fallbacks].map(normalizeAddress).filter(Boolean);

  for (const query of [...new Set(queries)]) {
    try {
      const result = await geocode(query);
      if (result) return result;
    } catch {}
  }

  return null;
}

async function roadRoute(origin, destination) {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Không tải được tuyến đường.");

    const json = await response.json();
    const route = json?.routes?.[0];
    const coordinates = route?.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error("Không có tuyến đường phù hợp.");
    }

    return {
      coordinates: coordinates.map(([lng, lat]) => [lat, lng]),
      distance: Number(route.distance || 0),
      duration: Number(route.duration || 0),
    };
  } catch {
    return {
      coordinates: [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
      distance: 0,
      duration: 0,
    };
  }
}

function syntheticOrigin(destination) {
  return {
    lat: destination.lat - 0.085,
    lng: destination.lng - 0.105,
    displayName: "Dynova Sport",
  };
}

function pointAlongRoute(points, progress) {
  if (!points?.length) return DEFAULT_CENTER;
  if (points.length === 1) return points[0];

  const position = clamp(progress) / 100;
  const rawIndex = position * (points.length - 1);
  const index = Math.floor(rawIndex);
  const nextIndex = Math.min(points.length - 1, index + 1);
  const ratio = rawIndex - index;

  return [
    points[index][0] + (points[nextIndex][0] - points[index][0]) * ratio,
    points[index][1] + (points[nextIndex][1] - points[index][1]) * ratio,
  ];
}

function splitRoute(points, progress) {
  if (!points?.length) return { active: [], remaining: [] };

  const rawIndex = (clamp(progress) / 100) * (points.length - 1);
  const index = Math.max(0, Math.min(points.length - 1, Math.floor(rawIndex)));
  const current = pointAlongRoute(points, progress);

  return {
    active: [...points.slice(0, index + 1), current],
    remaining: [current, ...points.slice(index + 1)],
  };
}

function bearing(points, progress) {
  if (!points?.length || points.length < 2) return 0;
  const p = clamp(progress);
  const a = pointAlongRoute(points, Math.max(0, p - 0.15));
  const b = pointAlongRoute(points, Math.min(100, p + 0.15));
  const lat = ((a[0] + b[0]) / 2) * (Math.PI / 180);
  const x = (b[1] - a[1]) * Math.cos(lat);
  const y = b[0] - a[0];
  return (Math.atan2(x, y) * 180) / Math.PI;
}

function markerHtml(type) {
  if (type === "shop") {
    return '<div class="dynova-pin dynova-pin-shop"><span>D</span></div>';
  }

  if (type === "receiver") {
    return '<div class="dynova-pin dynova-pin-receiver"><span></span></div>';
  }

  return `
    <div class="dynova-truck-shell">
      <div class="dynova-truck" data-dynova-truck>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6.5H13.5V16H3V6.5Z" fill="currentColor"/>
          <path d="M13.5 10H17.7L21 13.2V16H13.5V10Z" fill="currentColor"/>
          <circle cx="7" cy="17.2" r="2.1" fill="white"/>
          <circle cx="17.2" cy="17.2" r="2.1" fill="white"/>
        </svg>
      </div>
    </div>`;
}

function destinationQuery(order, mapData) {
  return normalizeAddress(
    mapData?.destination?.address ||
      order?.shipping_address ||
      [order?.ward, order?.district, order?.province].filter(Boolean).join(", ") ||
      "Việt Nam"
  );
}

function originQuery(order, mapData) {
  return normalizeAddress(
    mapData?.origin?.address || order?.shop_address || order?.sender_address || order?.from_address || ""
  );
}

export default function OrderDeliveryMap({ order, tracking, compact = false }) {
  const mapData = useMemo(() => tracking?.delivery_map || {}, [tracking]);
  const simulation = mapData?.simulation || null;
  const status = String(
    simulation?.current_status || tracking?.status || mapData?.status || order?.ghn_status || "ready_to_pick"
  ).toLowerCase();
  const initialProgress = clamp(mapData?.progress ?? simulation?.progress ?? STATUS_PROGRESS[status] ?? 0);
  const destination = destinationQuery(order, mapData);
  const origin = originQuery(order, mapData);
  const mapElementRef = useRef(null);
  const leafletMapRef = useRef(null);
  const routeRef = useRef([]);
  const truckMarkerRef = useRef(null);
  const activeLineRef = useRef(null);
  const remainingLineRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [displayProgress, setDisplayProgress] = useState(initialProgress);
  const [routeVersion, setRouteVersion] = useState(0);
  const [mapState, setMapState] = useState({
    loading: true,
    error: "",
    distance: 0,
    duration: 0,
    destinationName: "",
  });

  const updateVehicle = (value) => {
    const points = routeRef.current;
    const marker = truckMarkerRef.current;
    const activeLine = activeLineRef.current;
    const remainingLine = remainingLineRef.current;

    if (!points?.length || !marker || !activeLine || !remainingLine) return;

    const progress = clamp(value);
    const point = pointAlongRoute(points, progress);
    const split = splitRoute(points, progress);

    marker.setLatLng(point);
    activeLine.setLatLngs(split.active);
    remainingLine.setLatLngs(split.remaining);

    const node = marker.getElement()?.querySelector?.("[data-dynova-truck]");
    if (node) node.style.transform = `rotate(${bearing(points, progress)}deg)`;
  };

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!order?.tracking_code && !tracking) return;

      setMapState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const L = await loadLeaflet();
        if (cancelled || !mapElementRef.current) return;

        const destinationPoint = await geocodeWithFallback(destination, [
          [order?.ward, order?.district, order?.province].filter(Boolean).join(", "),
          [order?.district, order?.province].filter(Boolean).join(", "),
          order?.province,
        ]);

        if (!destinationPoint) throw new Error("Không định vị được địa chỉ nhận hàng.");

        let originPoint = await geocodeWithFallback(origin, [mapData?.origin?.label]);
        if (!originPoint) originPoint = syntheticOrigin(destinationPoint);

        const route = await roadRoute(originPoint, destinationPoint);
        if (cancelled || !mapElementRef.current) return;

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const leafletMap = L.map(mapElementRef.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
        });

        L.tileLayer(OSM_TILE, {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(leafletMap);

        const shopIcon = L.divIcon({
          className: "dynova-map-marker",
          html: markerHtml("shop"),
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const receiverIcon = L.divIcon({
          className: "dynova-map-marker",
          html: markerHtml("receiver"),
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const truckIcon = L.divIcon({
          className: "dynova-map-marker",
          html: markerHtml("truck"),
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        L.marker([originPoint.lat, originPoint.lng], { icon: shopIcon })
          .bindPopup(`<strong>${mapData?.origin?.label || "Dynova Sport"}</strong><br>${originPoint.displayName || origin}`)
          .addTo(leafletMap);

        L.marker([destinationPoint.lat, destinationPoint.lng], { icon: receiverIcon })
          .bindPopup(`<strong>Địa chỉ nhận hàng</strong><br>${destinationPoint.displayName || destination}`)
          .addTo(leafletMap);

        remainingLineRef.current = L.polyline(route.coordinates, {
          color: "#94a3b8",
          weight: 7,
          opacity: 0.42,
          lineCap: "round",
        }).addTo(leafletMap);

        activeLineRef.current = L.polyline([], {
          color: "#2563eb",
          weight: 7,
          opacity: 0.96,
          lineCap: "round",
        }).addTo(leafletMap);

        truckMarkerRef.current = L.marker(pointAlongRoute(route.coordinates, initialProgress), {
          icon: truckIcon,
          zIndexOffset: 1000,
        })
          .bindPopup(`<strong>${simulation?.current_status_label || tracking?.status_label || "Đang vận chuyển"}</strong>`)
          .addTo(leafletMap);

        routeRef.current = route.coordinates;
        leafletMapRef.current = leafletMap;

        const bounds = L.latLngBounds([
          [originPoint.lat, originPoint.lng],
          [destinationPoint.lat, destinationPoint.lng],
          ...route.coordinates,
        ]);

        leafletMap.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
        window.setTimeout(() => leafletMap.invalidateSize(), 80);

        setMapState({
          loading: false,
          error: "",
          distance: route.distance,
          duration: route.duration,
          destinationName: destinationPoint.displayName || destination,
        });
        setRouteVersion((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          setMapState((current) => ({
            ...current,
            loading: false,
            error: error?.message || "Không tải được bản đồ.",
          }));
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [destination, origin, order?.tracking_code]);

  useEffect(() => {
    if (!routeVersion) return undefined;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const baseProgress = clamp(mapData?.progress ?? simulation?.progress ?? initialProgress);
    const durationSeconds = Math.max(60, Number(simulation?.duration_seconds || 240));
    const speed = Math.max(0.5, Number(simulation?.speed || 1));
    const running = Boolean(simulation?.running);
    const started = performance.now();
    let lastUi = 0;

    setDisplayProgress(baseProgress);
    updateVehicle(baseProgress);

    if (!running || baseProgress >= 100) return undefined;

    const frame = (now) => {
      const elapsedRealSeconds = (now - started) / 1000;
      const next = Math.min(100, baseProgress + (elapsedRealSeconds * speed * 100) / durationSeconds);
      updateVehicle(next);

      if (now - lastUi > 250 || next >= 100) {
        lastUi = now;
        setDisplayProgress(next);
      }

      if (next < 100) animationFrameRef.current = requestAnimationFrame(frame);
    };

    animationFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    routeVersion,
    mapData?.progress,
    simulation?.progress,
    simulation?.running,
    simulation?.speed,
    simulation?.duration_seconds,
    simulation?.server_time,
  ]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (leafletMapRef.current) leafletMapRef.current.remove();
      leafletMapRef.current = null;
    };
  }, []);

  if (!order?.tracking_code && !tracking) return null;

  const distanceText = formatDistance(mapState.distance);
  const durationText = formatDuration(mapState.duration);
  const statusLabel = simulation?.current_status_label || tracking?.status_label || mapData?.status_label || "Đang vận chuyển";
  const running = Boolean(simulation?.running);
  const completed = displayProgress >= 100 || Boolean(simulation?.completed);

  return (
    <section className={`${compact ? "mt-4" : "mt-6"} overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,.10)]`}>
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              <LocateFixed size={15} className="text-blue-600" />
              Theo dõi giao hàng
            </div>
            {running && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Cập nhật trực tiếp
              </span>
            )}
          </div>
          <h4 className="mt-1 truncate text-lg font-black text-slate-950">{statusLabel}</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">Mã vận đơn: {order?.tracking_code || tracking?.order_code || "—"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {distanceText && <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">{distanceText}</span>}
          {durationText && <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">~ {durationText}</span>}
          <span className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-white ${completed ? "bg-emerald-600" : "bg-blue-600"}`}>
            {completed ? <CheckCircle2 size={15} /> : <Navigation size={15} />}
            {Math.round(displayProgress)}%
          </span>
        </div>
      </div>

      <div className={`relative bg-slate-100 ${compact ? "h-[320px]" : "h-[440px] md:h-[500px]"}`}>
        <div ref={mapElementRef} className="absolute inset-0 z-0 h-full w-full" />

        {mapState.loading && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-slate-100">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-3 text-sm font-black text-slate-700">Đang tải bản đồ...</p>
            </div>
          </div>
        )}

        {!mapState.loading && mapState.error && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-slate-100 px-6">
            <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-5 text-center shadow-lg">
              <AlertTriangle className="mx-auto text-amber-500" size={28} />
              <p className="mt-2 text-sm font-black text-slate-900">Chưa tải được bản đồ</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{mapState.error}</p>
            </div>
          </div>
        )}

        {!mapState.loading && !mapState.error && (
          <>
            <div className="pointer-events-none absolute left-4 top-4 z-[500] max-w-[calc(100%-2rem)] rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${completed ? "bg-emerald-500" : "animate-pulse bg-blue-600"}`} />
                <p className="text-xs font-black text-slate-900">{statusLabel}</p>
              </div>
              <p className="mt-1 max-w-[340px] truncate text-[10px] font-semibold text-slate-500">{mapState.destinationName || destination}</p>
            </div>

            <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[500] grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-slate-900 p-1.5 text-white"><Truck size={13} /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Điểm lấy hàng</p>
                    <p className="truncate text-xs font-black text-slate-800">{mapData?.origin?.label || "Dynova Sport"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-rose-600 p-1.5 text-white"><MapPin size={13} /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Điểm nhận</p>
                    <p className="truncate text-xs font-black text-slate-800">{destination}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
        {completed ? <PackageCheck size={15} className="text-emerald-500" /> : <Navigation size={15} className="text-slate-400" />}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600 transition-[width] duration-300" style={{ width: `${displayProgress}%` }} />
        </div>
        <span className="text-[11px] font-black text-slate-500">{Math.round(displayProgress)}%</span>
      </div>

      <style jsx global>{`
        .dynova-map-marker { background: transparent !important; border: 0 !important; }
        .dynova-pin { width: 36px; height: 36px; border-radius: 50%; border: 3px solid #fff; display: grid; place-items: center; box-shadow: 0 8px 24px rgba(15,23,42,.28); }
        .dynova-pin-shop { background: #0f172a; color: #fff; font: 900 12px/1 Arial; }
        .dynova-pin-receiver { background: #dc2626; }
        .dynova-pin-receiver span { width: 9px; height: 9px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,.25); }
        .dynova-truck-shell { width: 48px; height: 48px; display: grid; place-items: center; }
        .dynova-truck { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: #2563eb; color: #fff; border: 3px solid #fff; box-shadow: 0 10px 28px rgba(37,99,235,.35); transition: transform .18s linear; transform-origin: 50% 50%; }
        .leaflet-container { font-family: inherit; background: #e5e7eb; }
        .leaflet-control-zoom { border: 0 !important; box-shadow: 0 8px 25px rgba(15,23,42,.14) !important; }
        .leaflet-control-zoom a { color: #0f172a !important; border-color: #e2e8f0 !important; }
        .leaflet-control-attribution { font-size: 9px !important; background: rgba(255,255,255,.84) !important; }
        .leaflet-popup-content-wrapper { border-radius: 14px !important; box-shadow: 0 12px 35px rgba(15,23,42,.16) !important; }
      `}</style>
    </section>
  );
}