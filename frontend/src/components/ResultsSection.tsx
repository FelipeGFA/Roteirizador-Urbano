import type { OptimizedRouteData, RouteData } from '../types';
import MapView from './MapView';
import { exportarRotaParaPDF, exportarRotaParaPlanilha } from '../services/export';

interface ResultsSectionProps {
  data: OptimizedRouteData;
  onBack: () => void;
}     

function formatDistance(meters: number) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ data, onBack }) => {

  const handleExportPDF = (recurso: string, dadosRota: RouteData) => {
    const mapId = `map-${recurso}`;
    exportarRotaParaPDF(recurso, dadosRota, mapId);
  };

  const handleExportSheet = (recurso: string, dadosRota: RouteData) => {
    exportarRotaParaPlanilha(recurso, dadosRota);
  };

  const validRoutes = Object.entries(data).filter(([, routeData]) => routeData.pontos && routeData.pontos.length > 1);

  return (
    <section className="results-section">
      <button className="btn" onClick={onBack}><i className="fas fa-arrow-left"></i> Voltar</button>
      <div className="results-header">
        <h2 className="results-title">Rotas Otimizadas</h2>
        <p className="results-subtitle">Suas rotas foram calculadas com sucesso</p>
      </div>

      {validRoutes.length > 0 && (
        <div className="summary-table-container">
            <h3 className="summary-table-title">Resumo das Rotas por Equipe</h3>
            <div className="table-responsive">
                <table className="summary-table">
                    <thead>
                        <tr>
                            <th>Equipe</th>
                            <th>Distância Total</th>
                            <th>Média por Ponto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {validRoutes.map(([recurso, dadosRota]) => (
                            <tr key={recurso}>
                                <td>{recurso}</td>
                                <td>{formatDistance(dadosRota.distancia_total)}</td>
                                <td>{formatDistance(dadosRota.distancia_media)} / ponto</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      <div className="results-grid">
        {validRoutes.map(([recurso, dadosRota], index) => {
            const paradas = dadosRota.pontos.length > 1 ? dadosRota.pontos.length - 1 : 0;
            return (
                <div className="route-card fade-in" style={{animationDelay: `${index * 0.1}s`}} key={recurso}>
                    <div className="route-header">
                        <h3 className="route-title">{recurso}</h3>
                        <div className="route-stats">
                            <div className="route-stat"><i className="fas fa-map-marker-alt"></i><span>{paradas} parada{paradas !== 1 ? 's' : ''}</span></div>
                            <div className="route-stat"><i className="fas fa-road"></i><span>{formatDistance(dadosRota.distancia_total)}</span></div>
                            <div className="route-stat"><i className="fas fa-ruler-horizontal"></i><span>{formatDistance(dadosRota.distancia_media)} / ponto</span></div>
                        </div>
                    </div>
                    <div className="route-map" id={`map-${recurso}`} style={{ height: '60vh' }}>
                        <MapView routeData={dadosRota} resourceName={recurso} />
                    </div>
                    <div className="route-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleExportPDF(recurso, dadosRota)}><i className="fas fa-file-pdf"></i> Exportar PDF</button>
                        <button className="btn btn-success btn-sm" onClick={() => handleExportSheet(recurso, dadosRota)}><i className="fas fa-file-excel"></i> Exportar Planilha</button>
                    </div>
                </div>
            )
        })}
      </div>
    </section>
  );
};

export default ResultsSection;
