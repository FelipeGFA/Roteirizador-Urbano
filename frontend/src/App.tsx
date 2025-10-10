import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeSwitcher from './components/ThemeSwitcher';
import HomePage from './pages/HomePage';
import RotaPage from './pages/RotaPage';

function App() {
  return (
    <>
      <ThemeSwitcher />
      <main className="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rotas/:rotaId" element={<RotaPage />} />
          </Routes>
        </div>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
