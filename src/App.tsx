import React from 'react';
import AppSimulator from './components/AppSimulator';

export default function App() {
  return (
    <div className="min-h-screen bg-[#090b14] text-gray-100 flex flex-col font-sans">
      <AppSimulator onBudgetUsageChange={() => {}} />
    </div>
  );
}


