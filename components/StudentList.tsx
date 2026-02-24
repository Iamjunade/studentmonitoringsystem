
import React from 'react';
import { MoreVertical, GraduationCap, Mail, Phone } from 'lucide-react';
import { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onSelectStudent }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Student Directory</h2>
          <p className="text-neutral-500">{students.length} students enrolled in B.Tech II Year - CSM-A</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-sm font-black hover:bg-neutral-200 shadow-xl transition-all">
            Add Record
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
                     <div className="bg-white h-full rounded-full" style={{width: `${student.attendancePercentage}%`}}></div>
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
    </div>
  );
};

export default StudentList;
