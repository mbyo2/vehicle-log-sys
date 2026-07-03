import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MapPin, Radio } from 'lucide-react';
import { useGPSTracking } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

function formatRelative(from: Date | null, now: number): string {
  if (!from) return 'never';
  const sec = Math.max(0, Math.floor((now - from.getTime()) / 1000));
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}


interface VehicleLocation {
  vehicleId: string;
  plateNumber: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  driver: string;
}

declare global {
  interface Window {
    google?: any;
    __lovableInitGoogleMaps?: () => void;
  }
}

const MAPS_SCRIPT_ID = 'lovable-google-maps-script';

function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    const onReady = () => resolve();

    if (existing) {
      if (window.google?.maps) return resolve();
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => reject(new Error('Maps script failed')), { once: true });
      return;
    }

    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return reject(new Error('Google Maps key missing'));

    window.__lovableInitGoogleMaps = () => resolve();

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__lovableInitGoogleMaps${channel ? `&channel=${channel}` : ''}`;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export const VehicleLocationMap = ({ vehicleId }: { vehicleId?: string }) => {
  const [locations, setLocations] = useState<VehicleLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { toast } = useToast();
  const { location, startTracking, stopTracking, isTracking } = useGPSTracking();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [liveMode, setLiveMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<Date | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [requestState, setRequestState] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const pollIntervalMs = liveMode ? 5000 : 30000;
  const logTag = `[LiveTracking${vehicleId ? `:${vehicleId.slice(0, 8)}` : ':all'}]`;

  // Debug: mode / interval changes
  useEffect(() => {
    console.debug(`${logTag} mode=${liveMode ? 'live' : 'standard'} interval=${pollIntervalMs}ms`);
  }, [liveMode, pollIntervalMs, logTag]);

  // Fetch recent vehicle locations
  useEffect(() => {
    const fetchLocations = async () => {
      const startedAt = performance.now();
      const reqId = Math.random().toString(36).slice(2, 8);
      try {
        if (!lastUpdated) setIsLoading(true);
        setRequestState('fetching');
        console.debug(`${logTag} fetch:start id=${reqId}`);
        let query = supabase
          .from('vehicle_logs')
          .select(`
            id,
            vehicle_id,
            start_location,
            end_location,
            start_time,
            vehicles ( plate_number ),
            drivers ( profiles ( full_name ) )
          `)
          .order('start_time', { ascending: false })
          .limit(50);

        if (vehicleId) query = query.eq('vehicle_id', vehicleId);

        const { data, error } = await query;
        if (error) throw error;

        if (data) {
          // Keep the most recent point per vehicle
          const seen = new Set<string>();
          const formatted: VehicleLocation[] = [];
          for (const log of data as any[]) {
            const point = log.end_location ?? log.start_location;
            if (!point?.latitude || !point?.longitude) continue;
            if (seen.has(log.vehicle_id)) continue;
            seen.add(log.vehicle_id);
            formatted.push({
              vehicleId: log.vehicle_id,
              plateNumber: log.vehicles?.plate_number || 'Unknown',
              latitude: Number(point.latitude),
              longitude: Number(point.longitude),
              timestamp: log.start_time,
              driver: log.drivers?.profiles?.full_name || 'Unknown',
            });
          }
          setLocations(formatted);
          const now = new Date();
          setLastUpdated(now);
          setLastSuccessAt(now);
          setNowTs(now.getTime());
          setRequestState('success');
          setLastError(null);
          const ms = Math.round(performance.now() - startedAt);
          console.debug(
            `${logTag} fetch:success id=${reqId} rows=${data.length} vehicles=${formatted.length} took=${ms}ms`,
          );
        }
      } catch (error: any) {
        const ms = Math.round(performance.now() - startedAt);
        const msg = error?.message || 'Unknown error';
        setRequestState('error');
        setLastError(msg);
        console.error(`${logTag} fetch:error id=${reqId} took=${ms}ms`, error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load vehicle locations',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, pollIntervalMs);
    return () => clearInterval(interval);
  }, [toast, vehicleId, liveMode, pollIntervalMs, logTag]);


  // Tick the relative timestamps every second
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);


  // Load the Google Maps script + init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapContainerRef.current || mapRef.current) return;
        const g = window.google;
        mapRef.current = new g.maps.Map(mapContainerRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        infoWindowRef.current = new g.maps.InfoWindow();
        setMapReady(true);
      })
      .catch((err) => {
        console.error(err);
        setMapError(err.message || 'Failed to load map');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render markers when map + data ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google) return;
    const g = window.google;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (locations.length === 0) return;

    const bounds = new g.maps.LatLngBounds();
    locations.forEach((loc) => {
      const marker = new g.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapRef.current,
        title: loc.plateNumber,
      });
      marker.addListener('click', () => {
        infoWindowRef.current.setContent(
          `<div style="font-family:system-ui;font-size:13px;line-height:1.4">
            <strong>${loc.plateNumber}</strong><br/>
            Driver: ${loc.driver}<br/>
            ${new Date(loc.timestamp).toLocaleString()}
          </div>`,
        );
        infoWindowRef.current.open(mapRef.current, marker);
      });
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (locations.length === 1) {
      mapRef.current.setCenter({ lat: locations[0].latitude, lng: locations[0].longitude });
      mapRef.current.setZoom(14);
    } else {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [mapReady, locations]);

  const sendLocationUpdate = async () => {
    if (!location || !vehicleId) return;

    try {
      const result = await supabase.functions.invoke('handle-integration', {
        body: {
          type: 'gps',
          action: 'update_location',
          payload: {
            vehicleId,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (result.error) throw new Error(result.error.message);

      toast({
        title: 'Location updated',
        description: 'Vehicle location has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update location',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap justify-between items-center gap-3">
          <span>Vehicle Location Tracking</span>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Radio
                className={`h-4 w-4 ${liveMode ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`}
                aria-hidden
              />
              <Label htmlFor="live-mode" className="text-sm font-normal cursor-pointer">
                Live
              </Label>
              <Switch id="live-mode" checked={liveMode} onCheckedChange={setLiveMode} />
            </div>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Updated {formatRelative(lastUpdated, nowTs)}
            </span>
            {vehicleId && (
              <div className="flex items-center gap-2">
                {isTracking ? (
                  <Button variant="outline" size="sm" onClick={stopTracking}>
                    Stop Tracking
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={startTracking}>
                    Start Tracking
                  </Button>
                )}
                {location && (
                  <Button size="sm" onClick={sendLocationUpdate}>
                    Send Location
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="rounded-md border bg-muted/40 p-3 font-mono text-xs grid grid-cols-2 md:grid-cols-4 gap-2"
          aria-label="Live tracking debug panel"
        >
          <div>
            <div className="text-muted-foreground uppercase tracking-wide text-[10px]">Mode</div>
            <div className="font-semibold">{liveMode ? 'live' : 'standard'}</div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase tracking-wide text-[10px]">Poll interval</div>
            <div className="font-semibold">{(pollIntervalMs / 1000).toFixed(0)}s</div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase tracking-wide text-[10px]">Request</div>
            <div
              className={
                requestState === 'error'
                  ? 'font-semibold text-destructive'
                  : requestState === 'fetching'
                  ? 'font-semibold text-primary'
                  : requestState === 'success'
                  ? 'font-semibold text-green-600'
                  : 'font-semibold'
              }
            >
              {requestState}
              {lastError && requestState === 'error' ? ` · ${lastError}` : ''}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase tracking-wide text-[10px]">Last success</div>
            <div className="font-semibold">
              {lastSuccessAt ? `${lastSuccessAt.toLocaleTimeString()} (${formatRelative(lastSuccessAt, nowTs)})` : '—'}
            </div>
          </div>
        </div>


        {location && vehicleId && (
          <div className="bg-primary/10 p-3 rounded-md">
            <p className="font-medium">Current Location</p>
            <p className="text-sm">
              Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {mapError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border rounded-md">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p>Map unavailable: {mapError}</p>
          </div>
        ) : (
          <div
            ref={mapContainerRef}
            className="w-full h-[400px] rounded-md border bg-muted"
            aria-label="Vehicle locations map"
          />
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading location data...</p>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>No location data available yet. Start tracking to record vehicle locations.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {locations.map((loc) => (
              <div key={loc.vehicleId} className="flex items-start border-b pb-2">
                <MapPin className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium">{loc.plateNumber}</p>
                  <p className="text-sm text-muted-foreground">Driver: {loc.driver}</p>
                  <p className="text-xs text-muted-foreground">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)} ·{' '}
                    {new Date(loc.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
