export interface Point {
  Latitude: number;
  Longitude: number;
  "Status da Atividade": string;
  "Valor Total Contrato": number;
  [key: string]: any;
}

export interface RouteData {
  distancia_total: number;
  distancia_media: number;
  pontos: Point[];
}

export interface OptimizedRouteData {
  [recurso: string]: RouteData;
}

export interface OptimizationResult {
  dados_otimizados: OptimizedRouteData;
  rota_id: string;
}
