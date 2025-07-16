import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FlnView from './fln/flnView.jsx';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path='/' element={<FlnView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
