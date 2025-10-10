import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadSection from '../components/UploadSection';
import type { OptimizationResult } from '../types';

const HomePage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleOptimized = (data: OptimizationResult) => {
    if (data.rota_id) {
      navigate(`/rotas/${data.rota_id}`);
    } else {
      // Fallback or error handling if rota_id is not present
      setError("Otimização concluída, mas o ID da rota não foi retornado.");
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <>
      <UploadSection
        onOptimized={handleOptimized}
        onError={handleError}
        setIsLoading={setIsLoading}
        setLoadingMessage={setLoadingMessage}
      />
      {error && <div className="error-message">{error}</div>}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p id="loadingText">{loadingMessage}</p>
        </div>
      )}
    </>
  );
};

export default HomePage;
