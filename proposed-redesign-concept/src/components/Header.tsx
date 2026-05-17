import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Search, Bell, HelpCircle } from 'lucide-react';
import { mockDaysData } from '../data/mockOuraData';

interface HeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  restMode: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  setSelectedDate,
  restMode,
  timeOfDay,
}) => {
  const availableDates = Object.keys(mockDaysData);
  const currentIndex = availableDates.indexOf(selectedDate);

  const handlePrevDay = () => {
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  const handleNextDay = () => {
    if (currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  const handleSetToday = () => {
    setSelectedDate(availableDates[0]);
  };

  const currentDay = mockDaysData[selectedDate] || mockDaysData[availableDates[0]];

  return (
    <header className="glass-nav h-14 px-6 flex items-center justify-between select-none sticky top-0 z-20 flex-shrink-0">
      {/* Left: Window controls + Date Navigator */}
      <div className="flex items-center gap-5">
        {/* macOS style window dots */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#EF4444] opacity-80 hover:opacity-100 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#F59E0B] opacity-80 hover:opacity-100 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#10B981] opacity-80 hover:opacity-100 cursor-pointer" />
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1 glass-tab rounded-lg p-0.5">
          <button
            onClick={handlePrevDay}
            disabled={currentIndex >= availableDates.length - 1}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              currentIndex >= availableDates.length - 1 
                ? 'text-white/10 cursor-not-allowed' 
                : 'text-white/40 hover:bg-white/[0.08] hover:text-white'
            }`}
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-white/70">
            <Calendar className="w-3.5 h-3.5 text-enso-blue" />
            <span>{currentDay.displayDate}</span>
          </div>

          <button
            onClick={handleNextDay}
            disabled={currentIndex <= 0}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              currentIndex <= 0 
                ? 'text-white/10 cursor-not-allowed' 
                : 'text-white/40 hover:bg-white/[0.08] hover:text-white'
            }`}
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {currentIndex > 0 && (
            <button
              onClick={handleSetToday}
              className="px-2.5 py-1 ml-1 text-[11px] font-semibold glass-tab text-enso-blue hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Middle: Quick Search */}
      <div className="max-w-md w-full mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-white/25 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tags, insights, or metrics..."
            className="w-full glass-tab rounded-lg pl-9 pr-4 py-1.5 text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Right: Mode indicators & Quick Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {restMode && (
          <div className="flex items-center gap-2 bg-helsinki/20 border border-helsinki/30 text-enso-blue px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-enso-blue pulse-dot" />
            <span>Rest Mode Active</span>
          </div>
        )}

        <div className="flex items-center gap-2 border-l border-white/[0.06] pl-4">
          <button 
            className="p-2 hover:bg-white/[0.06] rounded-lg text-white/30 hover:text-white/70 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-enso-blue" />
          </button>
          <button 
            className="p-2 hover:bg-white/[0.06] rounded-lg text-white/30 hover:text-white/70 transition-colors cursor-pointer"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
