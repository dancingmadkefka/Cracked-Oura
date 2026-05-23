import { useEffect, useMemo, useState } from 'react';
import { api, type AnomalyResult, type CorrelationResult, type MetricSpec, type SavedInvestigation } from '@/lib/api';
import { CorrelationPanel } from '@/components/analysis/CorrelationPanel';
import { AnomalyList } from '@/components/analysis/AnomalyList';
import { SavedInvestigationsPanel } from '@/components/analysis/SavedInvestigationsPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tab = 'correlate' | 'anomalies' | 'saved';

const DEFAULT_X = 'sleep_session.bedtime_start_minutes';
const DEFAULT_Y = 'readiness.score';
const RANGES = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '180d', days: 180 },
];

export function ExplorerView() {
  const [tab, setTab] = useState<Tab>('correlate');
  const [catalog, setCatalog] = useState<MetricSpec[]>([]);
  const [xMetric, setXMetric] = useState(DEFAULT_X);
  const [yMetric, setYMetric] = useState(DEFAULT_Y);
  const [lag, setLag] = useState(1);
  const [range, setRange] = useState(RANGES[1]);
  const [result, setResult] = useState<CorrelationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [anomalyLoading, setAnomalyLoading] = useState(false);

  const [investigations, setInvestigations] = useState<SavedInvestigation[]>([]);
  const [invLoading, setInvLoading] = useState(false);

  const endDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - range.days);
    return d.toISOString().split('T')[0];
  }, [range]);

  useEffect(() => { api.getAnalysisCatalog().then(setCatalog).catch(() => setCatalog([])); }, []);

  useEffect(() => {
    if (tab !== 'correlate') return;
    setLoading(true); setError(null);
    api.getCorrelation(xMetric, yMetric, lag, startDate, endDate)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, xMetric, yMetric, lag, startDate, endDate]);

  useEffect(() => {
    if (tab !== 'anomalies') return;
    setAnomalyLoading(true);
    api.getAnomalies(endDate, 14)
      .then(setAnomalies)
      .catch(() => setAnomalies([]))
      .finally(() => setAnomalyLoading(false));
  }, [tab, endDate]);

  const refreshInvestigations = () => {
    setInvLoading(true);
    api.listInvestigations()
      .then(setInvestigations).catch(() => setInvestigations([]))
      .finally(() => setInvLoading(false));
  };
  useEffect(() => { if (tab === 'saved') refreshInvestigations(); }, [tab]);

  const handleSaveCurrent = async () => {
    if (!result) return;
    const xLabel = catalog.find(c => c.path === xMetric)?.label ?? xMetric;
    const yLabel = catalog.find(c => c.path === yMetric)?.label ?? yMetric;
    await api.createInvestigation({
      name: `${xLabel} → ${yLabel} (lag ${lag}d)`,
      kind: 'correlation',
      payload: { x_metric: xMetric, y_metric: yMetric, lag_days: lag, method: 'pearson',
        start_date: startDate, end_date: endDate, coefficient: result.coefficient,
        sample_count: result.sample_count, interpretation: result.interpretation },
    });
    refreshInvestigations();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-fadeIn">
      <div>
        <h1 className="font-serif text-3xl text-white tracking-wide">Explorer</h1>
        <p className="text-sm text-white/40 mt-1">Correlate metrics, surface local anomalies, save investigations.</p>
      </div>

      <div className="flex gap-1">
        {(['correlate', 'anomalies', 'saved'] as Tab[]).map((t) => (
          <Button key={t} variant="ghost" size="sm" onClick={() => setTab(t)}
            className={cn('rounded-lg text-xs h-7 capitalize',
              tab === t ? 'glass-tab text-white' : 'text-white/40 hover:text-white/70')}>
            {t === 'correlate' ? 'Correlate' : t === 'anomalies' ? 'Anomalies' : 'Saved'}
          </Button>
        ))}
      </div>

      {tab === 'correlate' && (
        <CorrelationPanel
          catalog={catalog}
          xMetric={xMetric} yMetric={yMetric} lag={lag}
          range={range} ranges={RANGES}
          onXChange={setXMetric} onYChange={setYMetric}
          onLagChange={setLag} onRangeChange={setRange}
          result={result} loading={loading} error={error}
          onSave={handleSaveCurrent}
        />
      )}

      {tab === 'anomalies' && (
        <AnomalyList anomalies={anomalies} loading={anomalyLoading} day={endDate} />
      )}

      {tab === 'saved' && (
        <SavedInvestigationsPanel
          investigations={investigations} loading={invLoading}
          onDelete={async (id) => { await api.deleteInvestigation(id); refreshInvestigations(); }}
        />
      )}
    </div>
  );
}
