
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  CalendarCheck, 
  Bell, 
  Search, 
  LogOut, 
  ChevronRight,
  History,
  X,
  MessageSquare,
  CheckCircle,
  Phone,
  ArrowUpRight
} from 'lucide-react';
import { Student, ViewState, NotificationLog } from './types';
import { MOCK_STUDENTS } from './components/constants';
import Dashboard from './components/Dashboard';
import AttendanceTracker from './components/AttendanceTracker';
import StudentList from './components/StudentList';
import StudentProfile from './components/StudentProfile';
import SMSNotificationToast from './components/SMSNotificationToast';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [students] = useState<Student[]>(MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationLog | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late' | null>>(
    MOCK_STUDENTS.reduce((acc, s) => ({ ...acc, [s.id]: null }), {})
  );
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isNotifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter students based on search query (name or roll number)
  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.rollNumber.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Handle clicks outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeStudent = students.find(s => s.id === selectedStudentId);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setView('profile');
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredStudents.length === 1) {
      handleSelectStudent(filteredStudents[0].id);
    }
  };

  const addNotification = (log: NotificationLog) => {
    setNotifications(prev => [log, ...prev]);
    setActiveToast(log);
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative font-['Inter']">
      {activeToast && (
        <SMSNotificationToast 
          notification={activeToast} 
          onClose={() => setActiveToast(null)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-neutral-950 border-r border-neutral-900 flex flex-col transition-all duration-300 z-30`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg">
            SM
          </div>
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter leading-none">STUDENT MONITORING<br/><span className="text-neutral-500 text-[10px] tracking-[0.2em] font-bold">SYSTEM</span></span>}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<CalendarCheck size={20} />} 
            label="Attendance" 
            active={view === 'attendance'} 
            onClick={() => setView('attendance')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Students" 
            active={view === 'students'} 
            onClick={() => setView('students')}
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-neutral-900">
           <button 
             onClick={() => setSidebarOpen(!isSidebarOpen)}
             className="w-full flex items-center gap-3 p-3 hover:bg-neutral-900 rounded-lg text-neutral-500 transition-colors"
           >
             <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} size={20} />
             {isSidebarOpen && <span className="font-medium text-sm">Minimize</span>}
           </button>
           <button className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-500/10 rounded-lg mt-2 transition-colors">
             <LogOut size={20} />
             {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-black border-b border-neutral-900 px-8 flex items-center justify-between sticky top-0 z-10 shadow-xl">
          <h1 className="text-xl font-bold text-white capitalize tracking-tight">{view}</h1>
          <div className="flex items-center gap-6">
            <div className="relative group hidden sm:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search name or roll no..." 
                value={searchQuery}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onKeyDown={handleSearchKeyPress}
                className="pl-10 pr-10 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20 w-64 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}

              {/* Live Search Results Dropdown */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute top-full mt-2 left-0 w-[400px] bg-neutral-900 border border-neutral-800 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-3">Search Results ({filteredStudents.length})</span>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <button
                          key={student.id}
                          onClick={() => handleSelectStudent(student.id)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left border-b border-neutral-800/50 last:border-0 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-xs font-black text-neutral-500 group-hover:bg-white group-hover:text-black transition-all">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white group-hover:text-neutral-200">{student.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">{student.rollNumber}</p>
                          </div>
                          <ArrowUpRight size={14} className="text-neutral-700 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">No Matches Found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button 
                onClick={() => setNotifDrawerOpen(true)}
                className="p-2 text-neutral-400 hover:bg-neutral-900 rounded-full relative transition-colors"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-black animate-pulse"></span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-neutral-900">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none mb-0.5">Dr. K. Sampath</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Class Mentor</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 border border-neutral-800">
                <Users size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto p-8 bg-black">
          {view === 'dashboard' && <Dashboard students={filteredStudents} onSelectStudent={handleSelectStudent} notifications={notifications} isSearching={!!searchQuery} />}
          {view === 'attendance' && (
            <AttendanceTracker 
              students={filteredStudents} 
              onNotify={addNotification} 
              attendanceState={attendance} 
              setAttendanceState={setAttendance}
            />
          )}
          {view === 'students' && <StudentList students={filteredStudents} onSelectStudent={handleSelectStudent} />}
          {view === 'profile' && activeStudent && (
            <StudentProfile 
              student={activeStudent} 
              onBack={() => setView('students')} 
            />
          )}
          {filteredStudents.length === 0 && searchQuery && (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">No students matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Notification Drawer */}
        {isNotifDrawerOpen && (
          <>
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300" 
              onClick={() => setNotifDrawerOpen(false)}
            ></div>
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-neutral-950 shadow-2xl z-50 animate-in slide-in-from-right duration-500 border-l border-neutral-900 flex flex-col">
              <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-black">
                <div className="flex items-center gap-2">
                  <History size={20} className="text-white" />
                  <h2 className="font-black text-lg text-white uppercase tracking-tight">Transmission Logs</h2>
                </div>
                <button onClick={() => setNotifDrawerOpen(false)} className="p-2 hover:bg-neutral-900 rounded-full transition-colors text-neutral-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                    <MessageSquare size={48} className="mb-4 text-neutral-700" />
                    <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">No Messages Sent</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-5 rounded-[2rem] border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                            notif.recipient === 'parent' ? 'bg-white/10 text-white border-white/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {notif.recipient}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle size={10} /> SENT
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                         <span className="text-xs font-mono font-bold text-neutral-400">{notif.phone}</span>
                      </div>
                      <div className="bg-black p-4 rounded-2xl border border-neutral-800">
                        <p className="text-xs text-neutral-400 leading-relaxed italic">"{notif.message}"</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${
      active 
      ? 'bg-white text-black shadow-xl' 
      : 'text-neutral-500 hover:bg-neutral-900 hover:text-white'
    }`}
  >
    <div className={`${active ? 'text-black' : 'text-neutral-500'}`}>{icon}</div>
    {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
  </button>
);

export default App;
