/// <reference types="vite/client" />
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { TeamPage } from './pages/TeamPage';

// import.meta.env.BASE_URL en Vite coincide con la opción "base" (e.g. "/predicciones/")
// Esto permite que BrowserRouter haga match correcto en GitHub Pages o subcarpetas.
export const App: React.FC = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="team/:teamId" element={<TeamPage />} />
  <Route path="*" element={<HomePage />} />
    </Routes>
  </BrowserRouter>
);
