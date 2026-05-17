import React, { useState } from 'react';
import { Tags, Plus, TrendingUp, TrendingDown, BookOpen, Check } from 'lucide-react';
import { mockTagsList, DayData } from '../data/mockOuraData';

interface TagsJournalViewProps {
  dayData: DayData;
  onAddTag: (tag: string) => void;
  onUpdateNotes: (notes: string) => void;
}

export const TagsJournalView: React.FC<TagsJournalViewProps> = ({ dayData, onAddTag, onUpdateNotes }) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [noteInput, setNoteInput] = useState(dayData.notes);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      onAddTag(newTagInput.trim());
      setNewTagInput('');
    }
  };

  const handleSaveNotes = () => {
    onUpdateNotes(noteInput);
    setSaveStatus('Journal entry saved successfully');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-score-green text-xs font-semibold uppercase tracking-wider">
            <Tags className="w-4 h-4" />
            <span>Habit & Correlation Tracker</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">Tags & Daily Journal</h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Tagging daily habits allows the correlation engine to reveal what behaviors support or strain your sleep and readiness.
          </p>
        </div>
        <div className="glass-tab rounded-xl p-4 space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-wider">Active Tags Today</div>
          <div className="flex flex-wrap gap-1.5">
            {dayData.tags.map((t) => (
              <span key={t} className="bg-white/[0.08] text-white/70 px-2.5 py-1 rounded-md text-xs font-medium border border-white/[0.1]">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4 lg:col-span-1">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-serif text-lg text-white">Add Tag for Today</h3>
            <form onSubmit={handleAddTagSubmit} className="space-y-3">
              <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="e.g. Magnesium, Sauna, Blue Light..."
                className="w-full glass-tab rounded-xl px-4 py-2.5 text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors" />
              <button type="submit"
                className="w-full glass-tab hover:bg-white/[0.08] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4 text-enso-blue" /> Add Tag
              </button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-enso-blue" /> Daily Journal
            </div>
            <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Write your personal notes, reflections, or symptoms..."
              className="w-full h-36 glass-tab rounded-xl p-4 text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors resize-none leading-relaxed" />
            <button onClick={handleSaveNotes}
              className="w-full bg-gradient-to-r from-helsinki to-enso-blue hover:opacity-90 text-white py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg">
              <Check className="w-4 h-4" /> Save Journal Note
            </button>
            {saveStatus && <div className="text-center text-[11px] text-score-green font-medium animate-fadeIn">{saveStatus}</div>}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="font-serif text-lg text-white">Tag Correlation Analysis</h3>
              <p className="text-xs text-white/30">Average impact on your Readiness Score over the past 90 days</p>
            </div>
          </div>

          <div className="space-y-3">
            {mockTagsList.map((item) => {
              const isPositive = item.avgReadinessChange.startsWith('+');
              return (
                <div key={item.tag} className="glass-tab rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 truncate pr-2">
                    <div className={`p-2 rounded-lg text-xs font-semibold tracking-wider shrink-0 ${
                      item.category === 'Recovery' ? 'bg-score-green/15 text-score-green border border-score-green/20' :
                      item.category === 'Strain' ? 'bg-living-coral/15 text-living-coral border border-living-coral/20' :
                      'bg-enso-blue/15 text-enso-blue border border-enso-blue/20'
                    }`}>{item.category}</div>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-white truncate">{item.tag}</div>
                      <div className="text-xs text-white/30">{item.count} logged instances</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isPositive ? 'bg-score-green/10 text-score-green border-score-green/20' : 'bg-living-coral/10 text-living-coral border-living-coral/20'
                  }`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{item.avgReadinessChange} Score</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-tab rounded-xl p-4 flex items-start gap-3">
            <Tags className="w-4 h-4 text-score-green shrink-0 mt-0.5" />
            <div className="text-xs text-white/45 space-y-1">
              <span className="font-semibold text-white/70 block">Automated Tag Insights</span>
              <p><strong className="text-score-green">Sauna</strong> and <strong className="text-score-green">Magnesium</strong> have the highest positive impact on recovery. <strong className="text-living-coral">Late Caffeine</strong> delays sleep latency by 18 minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
