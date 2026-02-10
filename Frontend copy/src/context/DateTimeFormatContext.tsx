import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TimeFormat = '24h' | '12h';
export type DateFormat = 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD';
export type MonthFormat = 'number' | 'name';

interface DateTimeFormatContextType {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  monthFormat: MonthFormat;
  setMonthFormat: (format: MonthFormat) => void;
  formatTime: (time: string) => string;
  formatDate: (date: string) => string;
  formatDateTime: (date: string, time: string) => string;
}

const DateTimeFormatContext = createContext<DateTimeFormatContextType>({
  timeFormat: '24h',
  setTimeFormat: () => {},
  dateFormat: 'DD-MM-YYYY',
  setDateFormat: () => {},
  monthFormat: 'number',
  setMonthFormat: () => {},
  formatTime: (time: string) => time,
  formatDate: (date: string) => date,
  formatDateTime: (date: string, time: string) => `${date} ${time}`,
});

export const useDateTimeFormat = () => useContext(DateTimeFormatContext);

export const DateTimeFormatProvider = ({ children }: { children: ReactNode }) => {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');
  const [dateFormat, setDateFormat] = useState<DateFormat>('DD-MM-YYYY');
  const [monthFormat, setMonthFormat] = useState<MonthFormat>('number');

  // Helper function to parse date in multiple formats
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Handle 'Today', 'Tomorrow' strings
    if (dateStr.toLowerCase() === 'today') {
      return new Date();
    }
    if (dateStr.toLowerCase() === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    let year: number, month: number, day: number;

    // Try different date formats
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // YYYY-MM-DD format
      [year, month, day] = dateStr.split('-').map(Number);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      // DD-MM-YYYY format
      [day, month, year] = dateStr.split('-').map(Number);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      // MM/DD/YYYY format
      [month, day, year] = dateStr.split('/').map(Number);
    } else {
      // Fallback to native Date parsing
      const fallbackDate = new Date(dateStr);
      return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    }

    return new Date(year, month - 1, day);
  };

  // Format time according to selected format
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';

    const [hours, minutes] = timeStr.split(':').map(Number);

    if (timeFormat === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  };

  // Get month names
  const getMonthName = (monthIndex: number, short: boolean = false): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return short ? shortMonthNames[monthIndex] : monthNames[monthIndex];
  };

  // Format date according to selected format
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';

    const dateObj = parseDate(dateStr);
    if (!dateObj) return dateStr;

    const day = dateObj.getDate().toString().padStart(2, '0');
    const monthNumber = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const monthName = getMonthName(dateObj.getMonth(), false);
    const monthNameShort = getMonthName(dateObj.getMonth(), true);
    const year = dateObj.getFullYear();

    // Determine which month representation to use
    const month = monthFormat === 'name' ? monthNameShort : monthNumber;

    switch (dateFormat) {
      case 'DD-MM-YYYY':
        return monthFormat === 'name' ? `${day} ${month} ${year}` : `${day}-${month}-${year}`;
      case 'MM-DD-YYYY':
        return monthFormat === 'name' ? `${month} ${day}, ${year}` : `${month}-${day}-${year}`;
      case 'YYYY-MM-DD':
        return monthFormat === 'name' ? `${year} ${month} ${day}` : `${year}-${month}-${day}`;
      default:
        return monthFormat === 'name' ? `${day} ${month} ${year}` : `${day}-${month}-${year}`;
    }
  };

  // Format date and time together
  const formatDateTime = (dateStr: string, timeStr: string): string => {
    const formattedDate = formatDate(dateStr);
    const formattedTime = formatTime(timeStr);
    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <DateTimeFormatContext.Provider
      value={{
        timeFormat,
        setTimeFormat,
        dateFormat,
        setDateFormat,
        monthFormat,
        setMonthFormat,
        formatTime,
        formatDate,
        formatDateTime,
      }}
    >
      {children}
    </DateTimeFormatContext.Provider>
  );
};