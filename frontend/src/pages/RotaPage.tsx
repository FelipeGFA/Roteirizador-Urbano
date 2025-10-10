import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResultsSection from '../components/ResultsSection';
import { getRota } from '../services/api';
import type { OptimizedRouteData } from '../types';

const RotaPage = () => {
  const { rotaId } = useParams<{ rotaId: string }>();
  const navigate = useNavigate();
  const [optimizedData, setOptimizedData] = useState<OptimizedRouteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (rotaId) {
      const fetchRotaData = async () => {
        setIsLoading(true);
        try {
          const data = await getRota(rotaId);
          setOptimizedData(data);
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Falha ao carregar os dados da rota.');
          setOptimizedData(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRotaData();
    } else {
        setError("ID da rota não fornecido.");
        setIsLoading(false);
    }
  }, [rotaId]);

  const handleReset = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Carregando dados da rota...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-message">{error}</p>
        <button onClick={handleReset} className="btn">Voltar</button>
      </div>
    );
  }

  if (optimizedData) {
    return <ResultsSection data={optimizedData} onBack={handleReset} />;
  }

  return null; 
};

export default RotaPage;
