// import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// this manifest is used temporarily for development purposes
const manifestUrl = 'https://raw.githubusercontent.com/ChickenFarmLand/chickenFarm/gh-pages/tonconnect-manifest.json';

console.log('Environment Variables:'); 
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL); 
console.log('VITE_SUPABASE_API_KEY:', import.meta.env.VITE_SUPABASE_API_KEY);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <App />
  </TonConnectUIProvider>,
)