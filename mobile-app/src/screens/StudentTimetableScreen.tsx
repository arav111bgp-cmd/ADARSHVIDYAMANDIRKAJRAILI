import React, { useState } from 'react';
import { mockStudentTimetable } from '../mock/mockData';
import { TimetableSlot } from '../types';
import { MapPin, User } from 'lucide-react';

export const StudentTimetableScreen: React.FC = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>('Mon');

  const activePeriods: TimetableSlot[] = mockStudentTimetable.filter((t: TimetableSlot) => t.day === selectedDay);

  return (
    <div style={{ padding: '16px 16px 80px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Class Timetable</h2>
        <p style={{ fontSize: 12, color: '#667085' }}>Class 5-A Weekly Academic Schedule</p>
      </div>

      {/* Day Selector Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        backgroundColor: '#FFFFFF',
        padding: 6,
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        marginBottom: 16,
        overflowX: 'auto'
      }}>
        {days.map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: isSelected ? '#1769E0' : 'transparent',
                color: isSelected ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Period List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activePeriods.length > 0 ? (
          activePeriods.map((period: TimetableSlot, idx: number) => (
            <div
              key={period.id}
              className="avm-card"
              style={{
                padding: 16,
                borderLeft: idx === 0 ? '4px solid #1769E0' : '4px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: idx === 0 ? '#EAF3FF' : '#F1F5F9',
                  color: idx === 0 ? '#1769E0' : '#475569',
                  fontWeight: 800,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  P{period.period}
                </div>

                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#172033', margin: 0 }}>
                    {period.subject}
                  </h4>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#667085', marginTop: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={13} /> {period.teacherName}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {period.room}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: idx === 0 ? '#1769E0' : '#64748B',
                  backgroundColor: idx === 0 ? '#EAF3FF' : '#F8FAFC',
                  padding: '4px 8px',
                  borderRadius: 6
                }}>
                  {period.startTime} - {period.endTime}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: '#667085' }}>
            No classes scheduled for {selectedDay}.
          </div>
        )}
      </div>
    </div>
  );
};
