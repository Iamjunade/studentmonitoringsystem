
import React, { useState } from 'react';
import { MoreVertical, GraduationCap, Mail, Phone, Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
  onStudentAdded?: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onSelectStudent, onStudentAdded }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    parentName: '',
    parentPhone: '',
    studentPhone: '',
    grade: 'B.Tech II Year',
    section: 'CSM-A',
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '', rollNumber: '', email: '', parentName: '',
      parentPhone: '', studentPhone: '', grade: 'B.Tech II Year', section: 'CSM-A',
    });
    setFormMessage(null);
  };

  const handleAddStudent = async () => {
    // Basic front-end validation
    if (!formData.name || !formData.rollNumber || !formData.email || !formData.parentName || !formData.parentPhone || !formData.studentPhone) {
      setFormMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    setIsSaving(true);
    setFormMessage(null);

    try {
      const res = await fetch('/api/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setFormMessage({ type: 'success', text: `${formData.name} added successfully!` });
        if (onStudentAdded && data.student) {
          // Map DB response to frontend Student type
          const newStudent: Student = {
            ...data.student,
            attendanceHistory: [],
            academicDetails: data.student.academicDetails || [],
          };
          onStudentAdded(newStudent);
        }
        setTimeout(() => {
          setShowModal(false);
          resetForm();
        }, 1200);
      } else {
        setFormMessage({ type: 'error', text: data.error || 'Failed to add student.' });
      }
    } catch {
      setFormMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Student Directory</h2>
          <p className="text-neutral-500">{students.length} students enrolled in B.Tech II Year - CSM-A</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-sm font-black hover:bg-neutral-200 shadow-xl transition-all"
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(student => (
          <div
            key={student.id}
            onClick={() => onSelectStudent(student.id)}
            className="bg-neutral-950 rounded-3xl border border-neutral-900 p-6 shadow-2xl hover:border-neutral-700 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 font-black text-xl group-hover:bg-white group-hover:text-black transition-all">
                {getInitials(student.name)}
              </div>
              <button className="p-2 text-neutral-700 hover:text-neutral-500 rounded-full">
                <MoreVertical size={20} />
              </button>
            </div>

            <h3 className="font-bold text-lg text-white group-hover:text-neutral-300 transition-colors">{student.name}</h3>
            <p className="text-xs text-neutral-600 mb-6 font-mono">{student.rollNumber}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-black p-3 rounded-2xl border border-neutral-900">
                <p className="text-[10px] uppercase font-bold text-neutral-600 mb-1">Attendance</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-white h-full rounded-full" style={{ width: `${student.attendancePercentage}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">{student.attendancePercentage}%</span>
                </div>
              </div>
              <div className="bg-black p-3 rounded-2xl text-center border border-neutral-900">
                <p className="text-[10px] uppercase font-bold text-neutral-600 mb-1">Current GPA</p>
                <p className="text-sm font-bold text-white">{student.gpa}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <GraduationCap size={14} className="text-neutral-700" />
                <span>{student.grade} • Sec {student.section}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Mail size={14} className="text-neutral-700" />
                <span className="truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Phone size={14} className="text-neutral-700" />
                <span>{student.studentPhone}</span>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-black uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all">
              Academic Record
            </button>
          </div>
        ))}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-neutral-900">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Add New Student</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-neutral-500 hover:text-white transition-colors rounded-xl hover:bg-neutral-900">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <FormField label="Full Name" value={formData.name} onChange={(v) => handleInputChange('name', v)} placeholder="e.g. Rahul Sharma" />
                <FormField label="Roll Number" value={formData.rollNumber} onChange={(v) => handleInputChange('rollNumber', v)} placeholder="e.g. 24R01A6650" />
                <FormField label="Email" value={formData.email} onChange={(v) => handleInputChange('email', v)} placeholder="e.g. rahul@btech.edu" type="email" />
                <FormField label="Parent / Guardian Name" value={formData.parentName} onChange={(v) => handleInputChange('parentName', v)} placeholder="e.g. Mr. Sharma" />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Parent Phone" value={formData.parentPhone} onChange={(v) => handleInputChange('parentPhone', v)} placeholder="+91..." />
                  <FormField label="Student Phone" value={formData.studentPhone} onChange={(v) => handleInputChange('studentPhone', v)} placeholder="+91..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Grade / Year" value={formData.grade} onChange={(v) => handleInputChange('grade', v)} placeholder="B.Tech II Year" />
                  <FormField label="Section" value={formData.section} onChange={(v) => handleInputChange('section', v)} placeholder="CSM-A" />
                </div>

                {formMessage && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${formMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {formMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {formMessage.text}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-neutral-900 flex gap-3">
                <button
                  onClick={handleAddStudent}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {isSaving ? 'Adding...' : 'Add Student'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-neutral-900 text-neutral-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const FormField = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (val: string) => void; placeholder: string; type?: string }) => (
  <div>
    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-colors"
    />
  </div>
);

export default StudentList;
