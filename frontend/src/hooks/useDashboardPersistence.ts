import { useState, useEffect, useCallback } from 'react';
import type { Dashboard } from '../types';
import { api } from "@/lib/api";

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

export const useDashboardPersistence = () => {
    const [savedDashboards, setSavedDashboards] = useState<Dashboard[] | null>(null);
    const [savedActiveDashboardId, setSavedActiveDashboardId] = useState<string | null>(null);

    useEffect(() => {
        let attempt = 0;

        const load = () => {
            api.getLayout()
                .then(data => {
                    if (data.dashboards && Array.isArray(data.dashboards)) {
                        setSavedDashboards(data.dashboards);
                        setSavedActiveDashboardId(data.activeDashboardId || data.dashboards[0]?.id);
                    }
                })
                .catch(() => {
                    if (++attempt < MAX_RETRIES) {
                        setTimeout(load, RETRY_DELAY * attempt);
                    } else {
                        console.error("Failed to load dashboard config after retries.");
                    }
                });
        };

        load();
    }, []);

    const saveDashboards = useCallback((dashboards: Dashboard[], activeDashboardId: string) => {
        // Optimistic local update
        setSavedDashboards(dashboards);
        setSavedActiveDashboardId(activeDashboardId);

        api.saveLayout({ dashboards, activeDashboardId })
            .catch(err => console.error("Error saving dashboard config:", err));
    }, []);

    return { savedDashboards, savedActiveDashboardId, saveDashboards };
};

