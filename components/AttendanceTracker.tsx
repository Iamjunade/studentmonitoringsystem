
import React, { useState } from 'react';
import { Check, X, Loader2, Smartphone, ShieldCheck, Clock, Wifi } from 'lucide-react';
import { Student, NotificationLog } from '../types';
import { geminiService } from '../services/geminiService';
import { smsService } from '../services/smsService';

interface AttendanceTrackerProps {
  students: Student[];
  onNotify: (log: NotificationLog) => void;
  attendanceState: Record<string, 'present' | 'absent' | 'late' | null>;
  setAttendanceState: React.Dispatch<React.SetStateAction<Record<string, 'present' | 'absent' | 'late' | null>>>;
}

type TransmissionStage = 'idle' | 'ai-generation' | 'connecting' | 'transmitting' | 'sent' | 'error';

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, onNotify, attendanceState, setAttendanceState }) => {
  const [loadingIds, setLoadingIds] = useState<Record<string, TransmissionStage>>({});
  const [date] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (attendanceState[studentId] === status) return;

    // Optimistic UI Update
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));

    // Persist to NeonDB Database
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, status }),
      });
    } catch (dbError) {
      console.error('Failed to save attendance record to DB', dbError);
    }

    if (status === 'absent') {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      setLoadingIds(prev => ({ ...prev, [studentId]: 'ai-generation' }));

      try {
        const [parentMsg, studentMsg] = await Promise.all([
          geminiService.generateAbsenceMessage(student, 'parent'),
          geminiService.generateAbsenceMessage(student, 'student')
        ]);

        setLoadingIds(prev => ({ ...prev, [studentId]: 'transmitting' }));

        await smsService.sendSMS({ phone: student.parentPhone, message: parentMsg, recipient: 'parent' });
        await smsService.sendSMS({ phone: student.studentPhone, message: studentMsg, recipient: 'student' });

        setLoadingIds(prev => ({ ...prev, [studentId]: 'sent' }));

        onNotify({
          id: `p-${Date.now()}`,
          studentId,
          recipient: 'parent',
          phone: student.parentPhone,
          message: parentMsg,
          timestamp: new Date(),
          status: 'sent'
        });

        onNotify({
          id: `s-${Date.now() + 1}`,
          studentId,
          recipient: 'student',
          phone: student.studentPhone,
          message: studentMsg,
          timestamp: new Date(),
          status: 'sent'
        });

        setTimeout(() => {
          setLoadingIds(prev => {
            const next = { ...prev };
            delete next[studentId];
            return next;
          });
        }, 3000);

      } catch (error) {
        setLoadingIds(prev => ({ ...prev, [studentId]: 'error' }));
      }
    }
  };

  const stats = {
    present: Object.values(attendanceState).filter(v => v === 'present').length,
    absent: Object.values(attendanceState).filter(v => v === 'absent').length,
  };

  const getStageLabel = (stage: TransmissionStage) => {
    switch (stage) {
      case 'ai-generation': return 'AI Writing SMS...';
      case 'transmitting': return 'Relaying...';
      case 'sent': return 'Delivered';
      case 'error': return 'Timeout';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Roll Call Console</h2>
          <p className="text-neutral-500 font-medium">{date}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge color="emerald" count={stats.present} label="Present" />
          <Badge color="rose" count={stats.absent} label="Absent" />
        </div>
      </div>

      <div className="bg-neutral-950 rounded-[2.5rem] border border-neutral-900 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-neutral-900 border-b border-neutral-800">
                <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Student</th>
                <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Registered Numbers</th>
                <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {students.map((student) => {
                const stage = loadingIds[student.id];
                const isProcessing = stage && !['sent', 'error'].includes(stage);

                return (
                  <tr key={student.id} className="hover:bg-neutral-900 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 font-bold group-hover:bg-white group-hover:text-black transition-all">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="text-[10px] text-neutral-600 font-mono">{student.rollNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-mono font-bold text-neutral-400">P: {student.parentPhone}</p>
                        <p className="text-xs font-mono font-bold text-neutral-400">S: {student.studentPhone}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-4">
                        <AttendanceButton
                          active={attendanceState[student.id] === 'present'}
                          color="emerald"
                          onClick={() => markAttendance(student.id, 'present')}
                          icon={<Check size={20} />}
                          disabled={isProcessing}
                        />
                        <AttendanceButton
                          active={attendanceState[student.id] === 'absent'}
                          color="rose"
                          onClick={() => markAttendance(student.id, 'absent')}
                          icon={isProcessing ? <Loader2 className="animate-spin" size={20} /> : <X size={20} />}
                          disabled={isProcessing}
                        />
                      </div>

                      {stage && (
                        <div className="mt-3 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${stage === 'sent' ? 'text-emerald-500' : 'text-neutral-400 animate-pulse'
                            }`}>
                            {getStageLabel(stage)}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-[3rem] p-8 text-white border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-black border border-neutral-800 rounded-2xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h4 className="font-black text-lg uppercase">System Verification</h4>
            <p className="text-sm text-neutral-500 max-w-lg">Alerts are processed via our secure monitoring relay to ensure accountability across all channels.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ color, count, label }: { color: string, count: number, label: string }) => {
  const styles: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return (
    <div className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest ${styles[color]}`}>
      {count} {label}
    </div>
  );
};

interface AttendanceButtonProps {
  active: boolean;
  color: 'emerald' | 'rose' | 'amber';
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const AttendanceButton: React.FC<AttendanceButtonProps> = ({ active, color, onClick, icon, disabled }) => {
  const colors = {
    emerald: active ? 'bg-emerald-600 text-white shadow-lg' : 'bg-neutral-900 text-neutral-600 border border-neutral-800 hover:text-white',
    rose: active ? 'bg-rose-600 text-white shadow-lg' : 'bg-neutral-900 text-neutral-600 border border-neutral-800 hover:text-white',
    amber: active ? 'bg-amber-500 text-white shadow-lg' : 'bg-neutral-900 text-neutral-600 border border-neutral-800 hover:text-white',
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`p-4 rounded-2xl transition-all ${colors[color]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-90'}`}
    >
      {icon}
    </button>
  );
};

export default AttendanceTracker;
