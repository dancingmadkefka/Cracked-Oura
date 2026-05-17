export interface DayData {
  date: string; // YYYY-MM-DD
  displayDate: string;
  greeting: string;
  readinessScore: number;
  sleepScore: number;
  activityScore: number;
  resilienceLevel: 'Exceptional' | 'Strong' | 'Solid' | 'Adequate';
  stressSummary: string;
  readinessContributors: {
    restingHeartRate: { value: number; status: 'Optimal' | 'Good' | 'Pay Attention'; text: string };
    hrvBalance: { value: number; status: 'Optimal' | 'Good' | 'Pay Attention'; text: string };
    bodyTemperature: { value: string; status: 'Optimal' | 'Good' | 'Pay Attention'; text: string };
    recoveryIndex: { value: number; status: 'Optimal' | 'Good' | 'Pay Attention'; text: string };
    sleepBalance: { value: number; status: 'Optimal' | 'Good' | 'Pay Attention'; text: string };
  };
  sleepDetails: {
    totalSleep: string;
    timeInBed: string;
    efficiency: number; // percentage
    restingHeartRate: number; // lowest
    averageHrv: number;
    latency: string;
    stages: {
      deep: string; // hours:mins
      deepPercent: number;
      rem: string;
      remPercent: number;
      light: string;
      lightPercent: number;
      awake: string;
      awakePercent: number;
    };
    stageTimeline: { stage: 'awake' | 'rem' | 'light' | 'deep'; durationMinutes: number }[];
  };
  activityDetails: {
    activeCalories: number;
    totalBurn: number;
    stepCount: number;
    dailyMovement: string; // e.g. "5.2 mi"
    inactiveTime: string; // e.g. "5h 12m"
    goalProgress: number; // percentage
    trainingFrequencyStatus: 'Optimal' | 'Good' | 'Fair';
    recoveryTimeStatus: 'Optimal' | 'Good' | 'Fair';
  };
  stressTimeline: { hour: string; level: 'restorative' | 'relaxed' | 'engaged' | 'stressed' }[];
  tags: string[];
  notes: string;
}

export const mockDaysData: Record<string, DayData> = {
  '2026-05-20': {
    date: '2026-05-20',
    displayDate: 'Today, Wednesday May 20',
    greeting: 'Your body is primed for peak performance today. Your HRV is elevated and resting heart rate settled early last night.',
    readinessScore: 88,
    sleepScore: 85,
    activityScore: 92,
    resilienceLevel: 'Exceptional',
    stressSummary: 'Mostly relaxed with 2h 15m of restorative time today.',
    readinessContributors: {
      restingHeartRate: { value: 51, status: 'Optimal', text: '51 bpm lowest' },
      hrvBalance: { value: 82, status: 'Optimal', text: '82 ms average' },
      bodyTemperature: { value: '+0.1°C', status: 'Optimal', text: 'Normal range' },
      recoveryIndex: { value: 94, status: 'Optimal', text: 'Heart rate stabilized early' },
      sleepBalance: { value: 85, status: 'Good', text: 'Optimal past 2 weeks' }
    },
    sleepDetails: {
      totalSleep: '7h 42m',
      timeInBed: '8h 24m',
      efficiency: 92,
      restingHeartRate: 51,
      averageHrv: 82,
      latency: '14m',
      stages: {
        deep: '1h 52m', deepPercent: 24,
        rem: '2h 05m', remPercent: 27,
        light: '3h 45m', lightPercent: 49,
        awake: '42m', awakePercent: 8
      },
      stageTimeline: [
        { stage: 'awake', durationMinutes: 14 },
        { stage: 'light', durationMinutes: 45 },
        { stage: 'deep', durationMinutes: 65 },
        { stage: 'light', durationMinutes: 30 },
        { stage: 'rem', durationMinutes: 40 },
        { stage: 'light', durationMinutes: 50 },
        { stage: 'deep', durationMinutes: 47 },
        { stage: 'rem', durationMinutes: 55 },
        { stage: 'light', durationMinutes: 100 },
        { stage: 'rem', durationMinutes: 30 },
        { stage: 'awake', durationMinutes: 28 }
      ]
    },
    activityDetails: {
      activeCalories: 640,
      totalBurn: 2650,
      stepCount: 11420,
      dailyMovement: '5.4 mi',
      inactiveTime: '4h 30m',
      goalProgress: 115,
      trainingFrequencyStatus: 'Optimal',
      recoveryTimeStatus: 'Optimal'
    },
    stressTimeline: [
      { hour: '8 AM', level: 'relaxed' },
      { hour: '9 AM', level: 'engaged' },
      { hour: '10 AM', level: 'stressed' },
      { hour: '11 AM', level: 'engaged' },
      { hour: '12 PM', level: 'restorative' },
      { hour: '1 PM', level: 'relaxed' },
      { hour: '2 PM', level: 'engaged' },
      { hour: '3 PM', level: 'stressed' },
      { hour: '4 PM', level: 'engaged' },
      { hour: '5 PM', level: 'relaxed' },
      { hour: '6 PM', level: 'restorative' },
      { hour: '7 PM', level: 'relaxed' }
    ],
    tags: ['Magnesium', 'Sauna', 'Stretching'],
    notes: 'Felt great waking up. 20 min sauna session after morning workout definitely helped keep HRV high.'
  },
  '2026-05-19': {
    date: '2026-05-19',
    displayDate: 'Yesterday, Tuesday May 19',
    greeting: 'You took it easy yesterday, which gave your nervous system the perfect window to bounce back.',
    readinessScore: 79,
    sleepScore: 74,
    activityScore: 84,
    resilienceLevel: 'Strong',
    stressSummary: 'Moderate stress during work hours, excellent evening wind-down.',
    readinessContributors: {
      restingHeartRate: { value: 55, status: 'Good', text: '55 bpm lowest' },
      hrvBalance: { value: 71, status: 'Good', text: '71 ms average' },
      bodyTemperature: { value: '+0.3°C', status: 'Good', text: 'Slightly elevated' },
      recoveryIndex: { value: 78, status: 'Good', text: 'Heart rate stabilized mid-sleep' },
      sleepBalance: { value: 74, status: 'Pay Attention', text: 'Slight sleep debt' }
    },
    sleepDetails: {
      totalSleep: '6h 35m',
      timeInBed: '7h 15m',
      efficiency: 88,
      restingHeartRate: 55,
      averageHrv: 71,
      latency: '22m',
      stages: {
        deep: '1h 15m', deepPercent: 19,
        rem: '1h 30m', remPercent: 23,
        light: '3h 50m', lightPercent: 58,
        awake: '40m', awakePercent: 10
      },
      stageTimeline: [
        { stage: 'awake', durationMinutes: 22 },
        { stage: 'light', durationMinutes: 60 },
        { stage: 'deep', durationMinutes: 45 },
        { stage: 'light', durationMinutes: 70 },
        { stage: 'rem', durationMinutes: 30 },
        { stage: 'light', durationMinutes: 90 },
        { stage: 'deep', durationMinutes: 30 },
        { stage: 'rem', durationMinutes: 60 },
        { stage: 'awake', durationMinutes: 18 }
      ]
    },
    activityDetails: {
      activeCalories: 420,
      totalBurn: 2350,
      stepCount: 7850,
      dailyMovement: '3.6 mi',
      inactiveTime: '6h 15m',
      goalProgress: 85,
      trainingFrequencyStatus: 'Optimal',
      recoveryTimeStatus: 'Optimal'
    },
    stressTimeline: [
      { hour: '8 AM', level: 'relaxed' },
      { hour: '9 AM', level: 'engaged' },
      { hour: '10 AM', level: 'stressed' },
      { hour: '11 AM', level: 'stressed' },
      { hour: '12 PM', level: 'engaged' },
      { hour: '1 PM', level: 'engaged' },
      { hour: '2 PM', level: 'stressed' },
      { hour: '3 PM', level: 'stressed' },
      { hour: '4 PM', level: 'engaged' },
      { hour: '5 PM', level: 'relaxed' },
      { hour: '6 PM', level: 'restorative' },
      { hour: '7 PM', level: 'restorative' }
    ],
    tags: ['Late Caffeine', 'Busy Day'],
    notes: 'Had a 3 PM espresso that kept me tossing and turning for the first 20 minutes in bed.'
  },
  '2026-05-18': {
    date: '2026-05-18',
    displayDate: 'Monday, May 18',
    greeting: 'Excellent recovery over the weekend. Your resting heart rate reached its lowest point beautifully.',
    readinessScore: 91,
    sleepScore: 90,
    activityScore: 88,
    resilienceLevel: 'Exceptional',
    stressSummary: 'Very calm day with 3h 40m of restorative time.',
    readinessContributors: {
      restingHeartRate: { value: 49, status: 'Optimal', text: '49 bpm lowest' },
      hrvBalance: { value: 86, status: 'Optimal', text: '86 ms average' },
      bodyTemperature: { value: '-0.1°C', status: 'Optimal', text: 'Normal range' },
      recoveryIndex: { value: 98, status: 'Optimal', text: 'Heart rate stabilized immediately' },
      sleepBalance: { value: 90, status: 'Optimal', text: 'Well rested' }
    },
    sleepDetails: {
      totalSleep: '8h 15m',
      timeInBed: '8h 50m',
      efficiency: 94,
      restingHeartRate: 49,
      averageHrv: 86,
      latency: '11m',
      stages: {
        deep: '2h 10m', deepPercent: 26,
        rem: '2h 20m', remPercent: 28,
        light: '3h 45m', lightPercent: 46,
        awake: '35m', awakePercent: 7
      },
      stageTimeline: [
        { stage: 'awake', durationMinutes: 11 },
        { stage: 'light', durationMinutes: 30 },
        { stage: 'deep', durationMinutes: 80 },
        { stage: 'light', durationMinutes: 40 },
        { stage: 'rem', durationMinutes: 50 },
        { stage: 'light', durationMinutes: 60 },
        { stage: 'deep', durationMinutes: 50 },
        { stage: 'rem', durationMinutes: 90 },
        { stage: 'awake', durationMinutes: 24 }
      ]
    },
    activityDetails: {
      activeCalories: 550,
      totalBurn: 2520,
      stepCount: 9600,
      dailyMovement: '4.5 mi',
      inactiveTime: '5h 10m',
      goalProgress: 100,
      trainingFrequencyStatus: 'Optimal',
      recoveryTimeStatus: 'Optimal'
    },
    stressTimeline: [
      { hour: '8 AM', level: 'restorative' },
      { hour: '9 AM', level: 'relaxed' },
      { hour: '10 AM', level: 'engaged' },
      { hour: '11 AM', level: 'relaxed' },
      { hour: '12 PM', level: 'restorative' },
      { hour: '1 PM', level: 'relaxed' },
      { hour: '2 PM', level: 'engaged' },
      { hour: '3 PM', level: 'relaxed' },
      { hour: '4 PM', level: 'restorative' },
      { hour: '5 PM', level: 'relaxed' },
      { hour: '6 PM', level: 'relaxed' },
      { hour: '7 PM', level: 'restorative' }
    ],
    tags: ['Magnesium', 'Reading', 'No Screens'],
    notes: 'Perfect Sunday wind-down routine. Read a physical book for an hour before sleep.'
  }
};

export const mockTrendsData = [
  { date: 'May 14', readiness: 84, sleep: 82, activity: 88, hrv: 74, rhr: 53 },
  { date: 'May 15', readiness: 89, sleep: 87, activity: 95, hrv: 80, rhr: 51 },
  { date: 'May 16', readiness: 92, sleep: 91, activity: 80, hrv: 85, rhr: 49 },
  { date: 'May 17', readiness: 86, sleep: 84, activity: 85, hrv: 79, rhr: 52 },
  { date: 'May 18', readiness: 91, sleep: 90, activity: 88, hrv: 86, rhr: 49 },
  { date: 'May 19', readiness: 79, sleep: 74, activity: 84, hrv: 71, rhr: 55 },
  { date: 'May 20', readiness: 88, sleep: 85, activity: 92, hrv: 82, rhr: 51 },
];

export const mockCirclesData = [
  { id: '1', name: 'Sarah Jenkins', relation: 'Partner', readiness: 92, sleep: 89, ringColor: '#10B981', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Marcus Vance', relation: 'Brother', readiness: 74, sleep: 68, ringColor: '#F59E0B', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Dr. Elena Rostova', relation: 'Coach', readiness: 86, sleep: 84, ringColor: '#10B981', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
];

export const mockTagsList = [
  { tag: 'Sauna', count: 18, avgReadinessChange: '+5', category: 'Recovery' },
  { tag: 'Magnesium', count: 24, avgReadinessChange: '+3', category: 'Supplement' },
  { tag: 'Late Caffeine', count: 8, avgReadinessChange: '-8', category: 'Strain' },
  { tag: 'Alcohol', count: 5, avgReadinessChange: '-14', category: 'Strain' },
  { tag: 'Stretching', count: 15, avgReadinessChange: '+4', category: 'Recovery' },
  { tag: 'Blue Light Filter', count: 20, avgReadinessChange: '+2', category: 'Environment' },
  { tag: 'Intense Workout', count: 14, avgReadinessChange: '-2', category: 'Activity' },
];

export const mockAdvisorMessages = [
  { id: 1, sender: 'oura', text: 'Hello Alexander. I noticed your HRV has been trending upwards over the past 4 days. Pairing your morning workouts with your evening magnesium routine seems to be yielding excellent recovery results.', time: '9:15 AM' },
  { id: 2, sender: 'user', text: 'That is great to hear! Should I push hard in my workout today or do active recovery?', time: '9:16 AM' },
  { id: 3, sender: 'oura', text: 'With a Readiness Score of 88 and an optimal body temperature, your system is fully prepared for high strain today. You have a great window for a challenging resistance or HIIT session. Just ensure you hydrate well to maintain your current temperature baseline.', time: '9:17 AM' },
];

export const userProfile = {
  name: 'Alexander Wright',
  email: 'alexander@wright.io',
  memberSince: 'October 2023',
  ringModel: 'Gen3 Horizon',
  ringFinish: 'Stealth',
  batteryLevel: 88,
  isCharging: false,
  firmwareVersion: '2.10.4 (Up to date)',
  lastSync: 'Just now'
};
