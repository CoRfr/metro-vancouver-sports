import { format, addDays, startOfWeek, startOfMonth, getDaysInMonth, subDays } from 'date-fns';

export function formatDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

export function getRelativeTime(dateStr: string, timeStr: string): string | null {
  const now = new Date();
  const todayStr = formatDateStr(now);

  if (dateStr !== todayStr) return null;

  const [hours, minutes] = timeStr.split(':').map(Number);
  const sessionTime = new Date(now);
  sessionTime.setHours(hours, minutes, 0, 0);

  const diffMs = sessionTime.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < -60) {
    const hoursAgo = Math.round(-diffMins / 60);
    return `${hoursAgo}h ago`;
  } else if (diffMins < 0) {
    return `${-diffMins}min ago`;
  } else if (diffMins === 0) {
    return 'now';
  } else if (diffMins < 60) {
    return `in ${diffMins}min`;
  } else {
    const hoursFromNow = Math.round(diffMins / 60);
    return `in ${hoursFromNow}h`;
  }
}

export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function getDatesForDayView(currentDate: Date): string[] {
  return [formatDateStr(currentDate)];
}

export function getDatesForWeekView(currentDate: Date): string[] {
  const dates: string[] = [];
  const start = startOfWeek(currentDate);
  for (let i = 0; i < 7; i++) {
    dates.push(formatDateStr(addDays(start, i)));
  }
  return dates;
}

export function getDatesForMonthView(currentDate: Date): string[] {
  const dates: string[] = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = startOfMonth(currentDate);
  const firstDay = firstDayOfMonth.getDay();
  const daysInMonth = getDaysInMonth(currentDate);
  const daysInPrevMonth = getDaysInMonth(subDays(firstDayOfMonth, 1));

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    dates.push(formatDateStr(d));
  }
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(formatDateStr(new Date(year, month, day)));
  }
  // Next month days
  const remaining = 42 - dates.length;
  for (let day = 1; day <= remaining; day++) {
    dates.push(formatDateStr(new Date(year, month + 1, day)));
  }
  return dates;
}

export function getDayPickerDates(currentDate: Date): Date[] {
  const dates: Date[] = [];
  for (let offset = -1; offset <= 6; offset++) {
    dates.push(addDays(currentDate, offset));
  }
  return dates;
}

export function isToday(date: Date): boolean {
  return formatDateStr(date) === formatDateStr(new Date());
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getDefaultDate(): Date {
  const now = new Date();
  // Default to tomorrow if it's past 9pm
  if (now.getHours() >= 21) {
    return addDays(now, 1);
  }
  return now;
}
