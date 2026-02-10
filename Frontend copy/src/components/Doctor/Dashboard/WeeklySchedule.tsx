import React from 'react';
import type { WorkingHour } from '../../../context/ProfileContext';
import { useDateTimeFormat } from '../../../context/DateTimeFormatContext';

interface AppointmentSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  mode: 'online' | 'in-person';
  is_active: boolean;
  location_info?: {
    id: string;
    name: string;
    address: string;
  };
}

interface WeeklyScheduleProps {
  schedule?: WorkingHour[];
  appointmentSlots?: AppointmentSlot[];
  hideTitle?: boolean;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ schedule, appointmentSlots, hideTitle }) => {
  const { formatTime } = useDateTimeFormat();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // If appointment slots are provided (even if empty array), use them; otherwise fall back to old schedule
  // This ensures that when appointmentSlots is explicitly passed (even as []), we use the slots view
  const useSlots = appointmentSlots !== undefined;

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl shadow-lg p-4 sm:p-6">
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Weekly Schedule</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="grid grid-cols-7 gap-2 border-b border-cyan-200 pb-2">
            {days.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center rounded-t-lg bg-cyan-100/60 text-gray-800 font-semibold text-sm"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              if (useSlots) {
                // Display appointment slots (only active ones)
                const daySlots = appointmentSlots!.filter(slot => slot.day_of_week === day && slot.is_active === true);

                return (
                  <div key={day} className="flex flex-col py-3 min-h-[120px]">
                    {daySlots.length > 0 ? (
                      <div className="w-full space-y-1">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`px-2 py-1 rounded-lg text-xs shadow-sm ${
                              slot.mode === 'online'
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-green-50 border border-green-200'
                            }`}
                          >
                            <div className="font-medium text-gray-900 text-[10px]">
                              {formatTime(slot.start_time.substring(0, 5))} - {formatTime(slot.end_time.substring(0, 5))}
                            </div>
                            <div className={`text-[9px] mt-0.5 ${
                              slot.mode === 'online' ? 'text-blue-700' : 'text-green-700'
                            }`}>
                              {slot.mode === 'online' ? '🌐 Online' : '🏥 In-Person'}
                            </div>
                            {slot.mode === 'in-person' && slot.location_info && (
                              <div className="text-[8px] text-gray-600 mt-0.5 truncate">
                                📍 {slot.location_info.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-4 text-xs text-gray-400 text-center">
                        Not Available
                      </div>
                    )}
                  </div>
                );
              } else {
                // Fall back to old working hours display
                const daySchedule = schedule?.find(s => s.day === day);
                return (
                  <div key={day} className="flex flex-col items-center py-3 min-h-[90px]">
                    {daySchedule?.enabled ? (
                      <div className="w-full bg-cyan-50 border border-cyan-200 rounded-lg px-2 py-1 text-xs text-gray-900 shadow-sm">
                        <div className="font-medium text-gray-900 mb-1">{formatTime(daySchedule.start)} - {formatTime(daySchedule.end)}</div>
                        {daySchedule.breaks && daySchedule.breaks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-cyan-200">
                            <span className="font-semibold text-gray-700 text-[10px]">Breaks:</span>
                            <div className="mt-1 space-y-1">
                              {daySchedule.breaks.map((b, i) => (
                                <div key={i} className="text-[10px] text-gray-600 bg-orange-50 border border-orange-200 rounded px-1 py-0.5">
                                  {formatTime(b.start)} - {formatTime(b.end)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-4 text-xs text-gray-400 text-center">Not Available</div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;