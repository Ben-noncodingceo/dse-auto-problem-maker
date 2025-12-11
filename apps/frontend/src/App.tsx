import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import GeneratePage from './pages/GeneratePage';
import QuestionPage from './pages/QuestionPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/generate" replace />} />
          <Route path="generate" element={<GeneratePage />} />
          <Route path="question/:id" element={<QuestionPage />} />
          <Route path="admin/*" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
