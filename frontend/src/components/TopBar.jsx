import React, { useState, useEffect } from 'react';

const MOCK_MOON_DATA = {
  phase: 'Waxing Gibbous',
  icon: '🌔', 
  illumination: '85%'
};

const TopBar = () => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Format: "October 24, 2023"
    const date = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    setCurrentDate(new Intl.DateTimeFormat('en-US', options).format(date));
  }, []);

  return (
    <div className="fixed top-6 left-6 z-40 flex flex-col items-start gap-1 pointer-events-none select-none">
      
      {/* Date Display */}
      <h1 className="text-white font-serif text-xl tracking-wide drop-shadow-md">
        {currentDate}
      </h1>

      {/* Moon Phase Widget */}
      <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mt-1">
        <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          {MOCK_MOON_DATA.icon}
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">
            Current Moon
          </span>
          <span className="text-sm text-white font-serif leading-none">
            {MOCK_MOON_DATA.phase}
          </span>
        </div>
      </div>

    </div>
  );
};

export default TopBar;