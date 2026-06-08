import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { CanvasBoard } from './components/space/CanvasBoard';
import { useTodoStore } from './store/useTodoStore';

function BoardGuard() {
  const { accessCode } = useTodoStore();
  if (!accessCode) {
    return <Navigate to="/" replace />;
  }
  return <CanvasBoard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/board" element={<BoardGuard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
