
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Mail, Phone, MapPin, User, BookOpen, Clock, BarChart2, Sparkles, Loader2, GraduationCap, Pencil, Save, X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { geminiService } from '../services/geminiService';

interface StudentProfileProps {
  student: Student;
  onBack: () => void;
  onStudentUpdated?: (updatedStudent: Student) => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ student, onBack, onStudentUpdated }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(student.name);
  const [editStudentPhone, setEditStudentPhone] = useState(student.studentPhone);
  const [editParentPhone, setEditParentPhone] = useState(student.parentPhone);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Request Details State
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoadingInsight(true);
      const text = await geminiService.getPerformanceInsights(student);
      setInsight(text);
      setLoadingInsight(false);
    };
    fetchInsight();
  }, [student]);

  // Reset edit fields when student changes
  useEffect(() => {
    setEditName(student.name);
    setEditStudentPhone(student.studentPhone);
    setEditParentPhone(student.parentPhone);
    setIsEditing(false);
    setSaveMessage(null);
    setRequestMessage(null);
  }, [student]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/update-student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          name: editName,
          parentPhone: editParentPhone,
          studentPhone: editStudentPhone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        if (onStudentUpdated) {
          onStudentUpdated({ ...student, name: editName, parentPhone: editParentPhone, studentPhone: editStudentPhone });
        }
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update profile.' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(student.name);
    setEditStudentPhone(student.studentPhone);
    setEditParentPhone(student.parentPhone);
    setIsEditing(false);
    setSaveMessage(null);
  };

  const handleRequestDetails = async () => {
    setIsRequesting(true);
    setRequestMessage(null);
    try {
      const smsContent = await geminiService.generateAcademicDetailsRequest(student);
      const res = await fetch('/api/request-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, message: smsContent }),
      });
      if (res.ok) {
        setRequestMessage({ type: 'success', text: `SMS sent to ${student.studentPhone}!` });
      } else {
        setRequestMessage({ type: 'error', text: 'Failed to send SMS request.' });
      }
    } catch {
      setRequestMessage({ type: 'error', text: 'Network error sending SMS.' });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">
        <ChevronLeft size={16} /> Student Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <div className="bg-neutral-950 p-10 rounded-[2.5rem] border border-neutral-900 shadow-2xl text-center relative overflow-hidden">
            <div className="mb-6 mx-auto w-24 h-24 bg-neutral-900 rounded-3xl flex items-center justify-center text-white font-black text-3xl border border-neutral-800">
              {getInitials(isEditing ? editName : student.name)}
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-black border border-neutral-700 rounded-xl px-4 py-2 text-center text-xl font-black text-white w-full mb-1 focus:outline-none focus:border-white transition-colors"
              />
            ) : (
              <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{student.name}</h2>
            )}
            <p className="text-neutral-600 mb-8 font-mono font-medium tracking-widest uppercase text-xs">{student.rollNumber}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black p-4 rounded-2xl border border-neutral-900">
                <p className="text-[10px] text-neutral-500 font-black uppercase mb-1 tracking-widest">GPA</p>
                <p className="text-2xl font-black text-white">{student.gpa}</p>
              </div>
              <div className="bg-black p-4 rounded-2xl border border-neutral-900">
                <p className="text-[10px] text-neutral-500 font-black uppercase mb-1 tracking-widest">Attendance</p>
                <p className="text-2xl font-black text-white">{student.attendancePercentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 p-8 rounded-[2.5rem] border border-neutral-900 shadow-2xl space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-neutral-600 pb-2 border-b border-neutral-900">Information</h3>
            <DetailItem icon={<GraduationCap size={18} />} label="Academic Stream" value={`${student.grade} - ${student.section}`} />
            <DetailItem icon={<Mail size={18} />} label="Email" value={student.email} />
            {isEditing ? (
              <EditableDetailItem icon={<Phone size={18} />} label="Mobile" value={editStudentPhone} onChange={setEditStudentPhone} />
            ) : (
              <DetailItem icon={<Phone size={18} />} label="Mobile" value={student.studentPhone} />
            )}
          </div>

          <div className="bg-neutral-950 p-8 rounded-[2.5rem] border border-neutral-900 shadow-2xl space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-neutral-600 pb-2 border-b border-neutral-900">Guardian</h3>
            <DetailItem icon={<User size={18} />} label="Parent Name" value={student.parentName} />
            {isEditing ? (
              <EditableDetailItem icon={<Phone size={18} />} label="Parent Phone" value={editParentPhone} onChange={setEditParentPhone} />
            ) : (
              <DetailItem icon={<Phone size={18} />} label="Parent Phone" value={student.parentPhone} />
            )}
          </div>

          {/* Mentor Action Buttons */}
          <div className="space-y-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-neutral-800 hover:border-neutral-700"
              >
                <Pencil size={14} /> Edit Student Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-4 bg-neutral-900 text-neutral-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <button
              onClick={handleRequestDetails}
              disabled={isRequesting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {isRequesting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {isRequesting ? 'Sending SMS...' : 'Request Academic Details'}
            </button>

            {/* Status Messages */}
            {saveMessage && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${saveMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {saveMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {saveMessage.text}
              </div>
            )}
            {requestMessage && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${requestMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {requestMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {requestMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Insights Section */}
          <div className="bg-white rounded-[2.5rem] p-8 text-black relative overflow-hidden shadow-2xl shadow-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={120} />
            </div>
            <div className="flex items-center gap-2 mb-4 bg-black/5 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={14} /> AI Insight Generator
            </div>
            {loadingInsight ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="animate-spin" size={20} />
                <p className="italic font-bold">Generating performance profile...</p>
              </div>
            ) : (
              <p className="text-xl leading-relaxed font-bold">
                "{insight}"
              </p>
            )}
            <div className="mt-8 flex gap-4">
              <button className="px-6 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg">Generate Report</button>
            </div>
          </div>

          {/* Academic Results */}
          <div className="bg-neutral-950 p-8 rounded-[2.5rem] border border-neutral-900 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-lg text-white flex items-center gap-3 uppercase tracking-tight">
                Course Performance
              </h3>
              <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest bg-black px-3 py-1 rounded-full border border-neutral-900">Current Semester</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {student.academicDetails.map((subject, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">Subject</p>
                      <span className="text-sm font-bold text-white">{subject.subject}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-neutral-400">{subject.score}%</span>
                      <p className="text-[10px] font-bold text-neutral-600">GRADE: {subject.grade}</p>
                    </div>
                  </div>
                  <div className="w-full bg-black h-1.5 rounded-full border border-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${subject.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-start gap-4 group">
    <div className="p-3 bg-black border border-neutral-900 rounded-2xl text-neutral-600 group-hover:text-white transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-neutral-400">{value}</p>
    </div>
  </div>
);

const EditableDetailItem = ({ icon, label, value, onChange }: { icon: React.ReactNode, label: string, value: string, onChange: (val: string) => void }) => (
  <div className="flex items-start gap-4 group">
    <div className="p-3 bg-black border border-neutral-900 rounded-2xl text-white transition-colors">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-white transition-colors"
      />
    </div>
  </div>
);

export default StudentProfile;
