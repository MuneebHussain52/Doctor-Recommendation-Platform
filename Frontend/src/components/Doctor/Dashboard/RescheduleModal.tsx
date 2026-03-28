import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  id: string;
  patient: {
    id: number;
    name: string;
    avatar?: string;
  };
  doctor?: {
    id: number;
  };
  date: string;
  time: string;
  type: string;
  location: string;
  mode?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  reason?: string;
}

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSubmit: (date: string, time: string, mode: string, reason?: string, locationId?: string, rescheduleReason?: string) => void;
  isFollowUp?: boolean;
  doctorId?: number | string;
}

interface AppointmentSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  mode: string;
  is_active: boolean;
  location?: string;
  location_info?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
  };
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ open, onClose, appointment, onSubmit, isFollowUp = false, doctorId }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<'online' | 'in-person'>('online');
  const [useCustomReason, setUseCustomReason] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const calendarRef = useRef<HTMLDivElement>(null);


  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Fetch appointment slots when modal opens
  useEffect(() => {
    if (open && doctorId) {
      setLoadingSlots(true);
      fetch(`http://localhost:8000/api/doctors/${doctorId}/appointment_slots/`)
        .then(res => res.json())
        .then(data => {
          setAppointmentSlots(data);
        })
        .catch(error => {
          console.error('Failed to fetch appointment slots:', error);
          setAppointmentSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [open, doctorId]);

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment) {
      setDate('');
      setTime('');
      setMode((appointment.mode?.toLowerCase() as 'online' | 'in-person') || 'online');
      setUseCustomReason(false);
      setCustomReason('');
      setRescheduleReason('');
      setAvailableTimes([]);
      setCurrentMonth(new Date());
    }
  }, [appointment]);

  // Fetch available times when date or mode changes
  useEffect(() => {
    if (!date || !doctorId || appointmentSlots.length === 0) {
      setAvailableTimes([]);
      setSelectedLocationId(undefined);
      return;
    }

    // Parse date in UTC to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Filter slots for the selected day and mode (exact match like recommendations)
    const relevantSlots = appointmentSlots.filter(
      slot => slot.day_of_week === dayOfWeek && slot.mode === mode && slot.is_active
    );

    if (relevantSlots.length === 0) {
      setAvailableTimes([]);
      setSelectedLocationId(undefined);
      return;
    }

    // Set location from the first relevant slot (for in-person mode)
    if (mode === 'in-person' && relevantSlots[0]?.location_info?.id) {
      setSelectedLocationId(relevantSlots[0].location_info.id);
    } else {
      setSelectedLocationId(undefined);
    }

    // Generate time slots and check availability
    setLoadingTimes(true);
    const times: string[] = [];

    relevantSlots.forEach(slot => {
      const [startHour, startMinute] = slot.start_time.split(':').map(Number);
      const [endHour, endMinute] = slot.end_time.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute < endMinute)
      ) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        times.push(timeStr);

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour += 1;
        }
      }
    });

    // Fetch booked appointments for this date to filter out unavailable times
    fetch(`http://localhost:8000/api/doctors/${doctorId}/appointments/`)
      .then(res => res.json())
      .then(appointments => {
        console.log('[RescheduleModal] All appointments:', appointments);
        console.log('[RescheduleModal] Current appointment being rescheduled:', appointment?.id);
        console.log('[RescheduleModal] Selected date:', date);
        console.log('[RescheduleModal] Selected mode:', mode);

        const bookedTimes = appointments
          .filter((apt: any) => {
            // Block all upcoming appointments on the same date/mode
            // Including the current appointment being rescheduled, since we're creating a NEW appointment
            const matches = apt.appointment_date === date &&
                          apt.appointment_mode === mode &&
                          apt.status === 'upcoming';

            if (apt.appointment_date === date && apt.appointment_mode === mode) {
              console.log('[RescheduleModal] Appointment on same date/mode:', {
                id: apt.id,
                time: apt.appointment_time,
                status: apt.status,
                isCurrentAppointment: apt.id === appointment?.id,
                willBlock: matches
              });
            }

            return matches;
          })
          .map((apt: any) => {
            // Normalize time format to HH:MM (remove seconds if present)
            const timeStr = apt.appointment_time;
            return timeStr.substring(0, 5); // '10:30:00' -> '10:30'
          });

        console.log('[RescheduleModal] Booked times:', bookedTimes);
        console.log('[RescheduleModal] All generated times:', times);

        const available = times.filter(t => !bookedTimes.includes(t));
        console.log('[RescheduleModal] Available times:', available);
        setAvailableTimes(available);
      })
      .catch(error => {
        console.error('Failed to fetch appointments:', error);
        setAvailableTimes(times);
      })
      .finally(() => setLoadingTimes(false));

  }, [date, mode, appointmentSlots, doctorId, appointment]);

  // Calendar helper functions
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateAvailable = (dateStr: string) => {
    if (!dateStr || appointmentSlots.length === 0) {
      return false;
    }
    // Parse date in UTC to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if there are slots for the selected mode ONLY
    const availableForMode = appointmentSlots.filter(
      slot => slot.day_of_week === dayOfWeek && slot.mode === mode && slot.is_active
    );

    console.log('[Date Check]', dateStr, '→', dayOfWeek, '| Mode:', mode, '| Available:', availableForMode.length > 0);

    return availableForMode.length > 0;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (dateStr: string) => {
    setDate(dateStr);
    setTime('');
  };

  const getDayOfWeek = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' });
  };

  if (!open || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isFollowUp ? 'Schedule Follow-up Appointment' : 'Reschedule Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Step 1: Appointment Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 1: Select Appointment Mode
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('online');
                  setDate('');
                  setTime('');
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  mode === 'online'
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Online</span>
                  <span className="text-xs mt-1">Video Consultation</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('in-person');
                  setDate('');
                  setTime('');
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  mode === 'in-person'
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">In-Person</span>
                  <span className="text-xs mt-1">Clinic Visit</span>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 2: Select Date
            </label>
            {loadingSlots && (
              <p className="text-sm text-gray-500 mb-2">Loading available dates...</p>
            )}
            {!loadingSlots && appointmentSlots.length === 0 && (
              <p className="text-sm text-red-600 mb-2">No appointment slots configured. Please configure your availability first.</p>
            )}
            <div className="relative" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-left flex items-center justify-between bg-white"
              >
                <span className={date ? 'text-gray-900' : 'text-gray-400'}>
                  {date || 'Select a date'}
                </span>
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </button>

              {showCalendar && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="font-semibold">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays().map((calDate, index) => {
                      if (!calDate) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }

                      const dateString = formatDateForInput(calDate);
                      const available = isDateAvailable(dateString);
                      const past = isPastDate(calDate);
                      const selected = date === dateString;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (!past && available) {
                              handleDateChange(dateString);
                              setShowCalendar(false);
                            }
                          }}
                          disabled={past || !available}
                          className={`
                            aspect-square p-1 text-sm rounded-md transition-colors
                            ${selected ? 'bg-cyan-600 text-white font-semibold' : ''}
                            ${!selected && available && !past ? 'hover:bg-cyan-50 text-gray-900' : ''}
                            ${!available || past ? 'text-gray-300 cursor-not-allowed opacity-50' : ''}
                          `}
                        >
                          {calDate.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-cyan-600"></div>
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-200 opacity-50"></div>
                      <span>Unavailable</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {loadingTimes && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading available times...
              </p>
            )}
            {date && !loadingTimes && availableTimes.length === 0 && appointmentSlots.length > 0 && (() => {
              const dayOfWeek = getDayOfWeek(date);
              const hasSlotsForDay = appointmentSlots.some(
                slot => slot.day_of_week === dayOfWeek && slot.is_active
              );
              if (!hasSlotsForDay) {
                return (
                  <p className="text-sm text-red-600 mt-1">
                    Doctor is not available on {dayOfWeek}s.
                  </p>
                );
              }
              const hasSlotsForMode = appointmentSlots.some(
                slot => slot.day_of_week === dayOfWeek && slot.is_active && slot.mode === mode
              );
              if (!hasSlotsForMode) {
                return (
                  <p className="text-sm text-red-600 mt-1">
                    Doctor is not available on {dayOfWeek}s for {mode} appointments.
                  </p>
                );
              }
              return (
                <p className="text-sm text-amber-600 mt-1">
                  All time slots are currently booked for this date.
                </p>
              );
            })()}
            {date && !loadingTimes && appointmentSlots.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Doctor hasn't configured appointment slots yet.
              </p>
            )}
          </div>

          {/* Step 3: Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 3: Select Time
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={availableTimes.length === 0}
            >
              <option value="">
                {availableTimes.length === 0 ? 'Select a date first' : 'Select time...'}
              </option>
              {availableTimes.map((timeSlot) => (
                <option key={timeSlot} value={timeSlot}>
                  {timeSlot}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Selection (for follow-up only) */}
          {isFollowUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Follow-up
              </label>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="reasonOption"
                      checked={!useCustomReason}
                      onChange={() => setUseCustomReason(false)}
                      className="mt-1 mr-3 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 mb-1">Use previous reason</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border break-words whitespace-pre-wrap">
                        {appointment?.reason || 'No reason provided'}
                      </div>
                    </div>
                  </label>
                </div>
                <div className="border rounded-md p-3">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="reasonOption"
                      checked={useCustomReason}
                      onChange={() => setUseCustomReason(true)}
                      className="mt-1 mr-3 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700">Add new reason</div>
                    </div>
                  </label>
                </div>
                {useCustomReason && (
                  <textarea
                    className="w-full border rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter reason for follow-up..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    rows={3}
                    required
                  />
                )}
              </div>
            </div>
          )}

          {/* Reschedule Reason (for non-follow-up reschedules from upcoming or cancelled) */}
          {!isFollowUp && (appointment?.status === 'upcoming' || appointment?.status === 'cancelled') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rescheduling <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Please provide a reason for rescheduling this appointment..."
                value={rescheduleReason}
                onChange={e => setRescheduleReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const reason = isFollowUp && useCustomReason ? customReason : (isFollowUp && !useCustomReason ? appointment.reason : undefined);
              onSubmit(date, time, mode, reason, selectedLocationId, rescheduleReason);
            }}
            disabled={!date || !time || (!isFollowUp && (appointment?.status === 'upcoming' || appointment?.status === 'cancelled') && !rescheduleReason.trim())}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isFollowUp ? 'Schedule Follow-up' : 'Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
