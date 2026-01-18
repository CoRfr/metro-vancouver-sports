export type Sport = 'skating' | 'swimming';

export interface Session {
  facility: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24-hour)
  endTime: string;
  type: string;
  activityName: string;
  activityUrl?: string;
  scheduleUrl?: string;
  facilityUrl?: string;
  ageRange?: string;
  description?: string;
  eventItemId?: number;
}

export interface Facility {
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  sessions: Session[];
  distance?: number;
}

export interface ScheduleIndex {
  sport: string;
  lastUpdated: string;
  totalSessions: number;
  dateRange: {
    start: string;
    end: string;
  };
  dates: string[];
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface ActivityType {
  id: string;
  value: string;
  label: string;
  checked: boolean;
  isAll?: boolean;
}

export interface SportConfig {
  name: string;
  dataFile: string;
  activityTypes: ActivityType[];
}

export type ViewMode = 'day' | 'week' | 'month';

export interface FilterState {
  selectedCities: string[];
  selectedFacilities: string[];
  selectedActivityTypes: string[];
  distance: number;
  postalCode: string;
}

export interface CalendarState {
  currentDate: Date;
  viewMode: ViewMode;
}

// City color mapping for map markers
export const CITY_COLORS: Record<string, string> = {
  'Vancouver': '#1976d2',
  'Burnaby': '#7b1fa2',
  'Richmond': '#f57c00',
  'Port Coquitlam': '#5d4037',
  'Coquitlam': '#6d4c41',
  'North Vancouver': '#388e3c',
  'West Vancouver': '#00796b',
  'New Westminster': '#c2185b',
  'Langley': '#455a64',
};

// City abbreviations
export const CITY_ABBRS: Record<string, string> = {
  'Vancouver': 'VAN',
  'Burnaby': 'BBY',
  'Richmond': 'RMD',
  'Port Coquitlam': 'PCQ',
  'Coquitlam': 'COQ',
  'North Vancouver': 'NV',
  'West Vancouver': 'WV',
  'New Westminster': 'NW',
  'Langley': 'LGL',
};

// Sports configuration
export const SPORTS_CONFIG: Record<Sport, SportConfig> = {
  skating: {
    name: 'Ice Skating',
    dataFile: 'ice-skating.json',
    activityTypes: [
      { id: 'activityAll', value: '__all__', label: 'All', checked: false, isAll: true },
      { id: 'activityPublic', value: 'Public Skating', label: 'Public Skating', checked: true },
      { id: 'activityDiscount', value: '__discount__', label: 'Discount/Free Only', checked: true },
      { id: 'activityFamily', value: 'Family Skate', label: 'Family Skating', checked: true },
      { id: 'activityFigure', value: 'Figure Skating', label: 'Figure Skating', checked: false },
      { id: 'activityLessons', value: 'Skating Lessons', label: 'Lessons', checked: false },
      { id: 'activityPractice', value: 'Practice', label: 'Practice', checked: false },
      { id: 'activityHockey', value: 'Hockey', label: 'Hockey', checked: false },
      { id: 'activityFamilyHockey', value: 'Family Hockey', label: 'Family Hockey', checked: false },
      { id: 'activityDropinHockey', value: 'Drop-in Hockey', label: 'Drop-in Hockey', checked: false },
      { id: 'activityOther', value: 'Skating', label: 'Other', checked: false },
    ],
  },
  swimming: {
    name: 'Swimming',
    dataFile: 'swimming.json',
    activityTypes: [
      { id: 'activityAll', value: '__all__', label: 'All', checked: false, isAll: true },
      { id: 'activityPublicSwim', value: 'Public Swim', label: 'Public Swim', checked: true },
      { id: 'activityLap', value: 'Lap Swim', label: 'Lap Swim', checked: true },
      { id: 'activityFamilySwim', value: 'Family Swim', label: 'Family Swim', checked: true },
      { id: 'activityAdultSwim', value: 'Adult Swim', label: 'Adult Swim', checked: true },
      { id: 'activityAquafit', value: 'Aquafit', label: 'Aquafit', checked: true },
      { id: 'activitySwimLessons', value: 'Lessons', label: 'Lessons', checked: false },
    ],
  },
};

// All cities list
export const ALL_CITIES = [
  'Vancouver',
  'Burnaby',
  'Richmond',
  'North Vancouver',
  'West Vancouver',
  'New Westminster',
  'Port Coquitlam',
  'Coquitlam',
  'Langley',
];
