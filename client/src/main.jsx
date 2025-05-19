
import { Buffer } from "buffer";
// Polyfill Buffer for browser compatibility
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { GlobalContextProvider } from './context';
import { Home, CreateBattle, JoinBattle, Battle, Battleground, TradeCard, PlayerHistory } from './page'

import { OnboardModal } from './components';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GlobalContextProvider>
      <OnboardModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-battle" element={<CreateBattle />} />
        <Route path="/join-battle" element={<JoinBattle />} />
        <Route path="/battleground" element={<Battleground />} />
        <Route path="/battle/:battleName" element={<Battle />} />
        <Route path="/TradeCard" element={<TradeCard />} />
        <Route path="/player-history" element={<PlayerHistory />} />
      </Routes> 
    </GlobalContextProvider>
  </BrowserRouter>,
);

