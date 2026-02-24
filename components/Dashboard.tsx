
import React from 'react';
import { Users, Smartphone, History, BarChart3 } from 'lucide-react';
import { Student, NotificationLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
  notifications: NotificationLog[];
  isSearching: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ students, notifications, isSearching }) => {
  const studentCount = students.length;
  const recentNotifs = notifications.slice(0, 4);

  // Prepare data for GPA distribution chart
  const gpaData = students
    .sort((a, b) => b.gpa - a.gpa)
    .slice(0, 8)
    .map(s => ({
      name: s.name.split(' ')[0],
      gpa: s.gpa,
      fullName: s.name
    }));

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-700 max-w-6xl mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Count Card */}
        <div className="bg-neutral-900 rounded-[2.5rem] border border-neutral-800 p-10 shadow-2xl group transition-all flex flex-col items-center gap-6 text-center justify-center">
          <div className="p-8 bg-black rounded-full text-white border border-neutral-800 group-hover:bg-white group-hover:text-black transition-all transform group-hover:rotate-6 duration-500">
            <Users size={48} />
          </div>
          <div>
            <p className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2">
              {isSearching ? 'Search Results' : 'Monitoring Directory'}
            </p>
            <h3 className="text-6xl font-black text-white tracking-tighter">{studentCount}</h3>
          </div>
          <div className="px-5 py-2 bg-black rounded-full text-[10px] font-black text-neutral-400 uppercase tracking-widest border border-neutral-800">
            B.Tech II Year - CSM-A
          </div>
        </div>

        {/* Performance Chart Card */}
        <div className="lg:col-span-2 bg-neutral-900 rounded-[2.5rem] border border-neutral-800 p-8 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-white" />
              <h3 className="font-black text-neutral-300 uppercase tracking-wider text-sm">Top Performers (GPA)</h3>
            </div>
            <span className="text-[10px] font-bold text-neutral-600 bg-black px-2 py-1 rounded-md uppercase tracking-widest border border-neutral-800">Academic Snapshot</span>
          </div>
          
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gpaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#525252', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#525252', fontSize: 10, fontWeight: 700 }}
                  domain={[0, 10]}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="gpa" radius={[6, 6, 0, 0]} barSize={30}>
                  {gpaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ffffff' : '#404040'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SMS Transmission Summary */}
        <div className="bg-neutral-900 rounded-[2.5rem] border border-neutral-800 p-8 shadow-2xl flex flex-col">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <History size={20} className="text-white" />
               <h3 className="font-black text-neutral-300 uppercase tracking-wider text-sm">Transmission History</h3>
             </div>
             <span className="text-[10px] font-bold text-neutral-600 bg-black px-2 py-1 rounded-md uppercase tracking-widest border border-neutral-800">Real-time</span>
           </div>

           <div className="flex-1 space-y-3">
             {recentNotifs.length === 0 ? (
               <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                 <Smartphone size={40} className="mb-2 text-neutral-700" />
                 <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">No Alerts Sent Today</p>
               </div>
             ) : (
               recentNotifs.map((n, idx) => (
                 <div key={idx} className="flex items-center gap-4 p-4 bg-black rounded-2xl border border-neutral-800">
                    <div className={`p-2 rounded-xl bg-neutral-900 text-white`}>
                      <Smartphone size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">Alert to {n.recipient === 'parent' ? 'Parent' : 'Student'}</p>
                      <p className="text-[10px] font-mono font-medium text-neutral-500">{n.phone}</p>
                    </div>
                    <div className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                      SENT
                    </div>
                 </div>
               ))
             )}
           </div>

           {notifications.length > 0 && (
             <button className="mt-6 w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors">
               Full History ({notifications.length})
             </button>
           )}
        </div>

        {/* Quick Stats / Info Card */}
        <div className="bg-neutral-900 rounded-[2.5rem] border border-neutral-800 p-8 shadow-2xl flex flex-col justify-between">
           <div>
             <h3 className="font-black text-neutral-300 uppercase tracking-wider text-sm mb-6">System Status</h3>
             <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                 <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">AI Engine</span>
                 <span className="text-xs font-black text-emerald-400">OPERATIONAL</span>
               </div>
               <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                 <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">SMS Gateway</span>
                 <span className="text-xs font-black text-emerald-400">CONNECTED</span>
               </div>
               <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                 <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Database Sync</span>
                 <span className="text-xs font-black text-neutral-500">LAST SYNC: 2 MIN AGO</span>
               </div>
             </div>
           </div>
           
           <div className="mt-8 p-6 bg-black rounded-[2rem] border border-neutral-800">
             <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Pro Tip</p>
             <p className="text-xs text-neutral-400 leading-relaxed italic">"Marking a student as absent automatically triggers a personalized AI-generated SMS to both parent and student."</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
