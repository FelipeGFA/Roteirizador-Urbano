
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteData } from '../types';
import { getPontoInicial, CORES_STATUS } from '../utils/mapUtils';

// --- Componente React ---
interface MapViewProps {
  routeData: RouteData;
  resourceName: string;
}

const MapView: React.FC<MapViewProps> = ({ routeData, resourceName }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const rotaOrdenada = routeData.pontos || [];
      if (rotaOrdenada.length === 0) return;

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true, zoomSnap: 0.1 });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const pontoInicial = getPontoInicial(resourceName);
      const startIcon = L.divIcon({
        className: "custom-marker start-marker",
        html: '<i class="fas fa-home"></i>',
        iconSize: [35, 35],
        iconAnchor: [17, 17],
      });
      L.marker([pontoInicial.Latitude, pontoInicial.Longitude], { icon: startIcon })
        .addTo(map)
        .bindPopup("<strong>Ponto de Partida</strong>");

      rotaOrdenada.slice(1).forEach((ponto, index) => {
        const status = (ponto['Status da Atividade'] || '').toLowerCase().trim();
        const markerColor = CORES_STATUS[status as keyof typeof CORES_STATUS] || '#CCCCCC';
        
        const deliveryIcon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color:${markerColor}; color:#000; border-radius:50%; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-weight: bold;">${index + 1}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
        });

        const valorContrato = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ponto['Valor Total Contrato'] || 0);

        L.marker([ponto.Latitude, ponto.Longitude], { icon: deliveryIcon })
          .addTo(map)
          .bindPopup(`<strong>Parada ${index + 1}</strong><br>Status: ${ponto['Status da Atividade']}<br>Valor: ${valorContrato}`);
      });

      const todasCoordenadas: L.LatLngExpression[] = rotaOrdenada.map(p => [p.Latitude, p.Longitude]);
      if (todasCoordenadas.length > 0) {
        const bounds = L.latLngBounds(todasCoordenadas);
        map.fitBounds(bounds.pad(0.1));
      }

      // Invalidate size after a short delay to ensure correct rendering
      setTimeout(() => map.invalidateSize(), 200);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [routeData, resourceName]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapView;
