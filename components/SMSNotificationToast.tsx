
import React, { useEffect, useState } from 'react';
import { Smartphone, X, MessageCircle } from 'lucide-react';
import { NotificationLog } from '../types';

interface SMSNotificationToastProps {
  notification: NotificationLog;
  onClose: () => void;
}

const SMSNotificationToast: React.FC<SMSNotificationToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for exit animation
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[100] transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
      <div className="bg-black/90 backdrop-blur-md text-white w-80 rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 p-1 rounded-lg">
                <MessageCircle size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">SMS Gateway Message</span>
            </div>
            <button onClick={() => setIsVisible(false)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-white/50 font-bold uppercase mb-1">To: {notification.phone}</p>
              <p className="text-xs leading-relaxed text-white/90">
                <span className="font-bold text-white italic">"</span>
                {notification.message}
                <span className="font-bold text-white italic">"</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        <div className="h-1 bg-emerald-500/20 w-full overflow-hidden">
          <div className="h-full bg-emerald-500 animate-[progress_6s_linear]" style={{ width: '100%' }}></div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SMSNotificationToast;
