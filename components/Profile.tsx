
import React, { useRef, useState } from 'react';
import { User } from '../types';
import { logoutUser, exportUserData, importUserData } from '../services/storageService';
import { ChartIcon, DownloadIcon, UploadIcon, SaveIcon } from './Icons';
import { achievements } from '../data/gamificationData';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
    });
  };

  const handleBackup = () => {
      const data = exportUserData();
      if (!data) return;
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voicemaster_backup_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleRestoreClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const result = event.target?.result as string;
          if (importUserData(result)) {
              setImportStatus('SUCCESS');
              setTimeout(() => {
                  window.location.reload(); // Reload to apply new user data
              }, 1500);
          } else {
              setImportStatus('ERROR');
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary-gray p-6 rounded-3xl border border-gray-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border-2 border-primary-gold relative">
            <span className="text-3xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-gold rounded-full flex items-center justify-center border-2 border-black text-xs font-bold text-black">
                {user.level}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user.username}</h2>
            <p className="text-gray-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-primary-green/20 text-primary-green px-2 py-0.5 rounded-full">🔥 {user.loginStreak} أيام متتالية</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500/10 text-red-500 border border-red-500/50 px-6 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
        >
          تسجيل الخروج
        </button>
      </div>

      {/* Data Management Section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-secondary-gray p-6 rounded-2xl border border-blue-800/30">
          <h3 className="text-lg font-bold text-blue-200 mb-4 flex items-center gap-2">
              <SaveIcon className="w-5 h-5"/> إدارة البيانات (النسخ الاحتياطي)
          </h3>
          <p className="text-sm text-gray-400 mb-4">
              نظراً لأن التطبيق يعمل محلياً، يرجى حفظ نسخة احتياطية من تقدمك إذا كنت تريد نقل حسابك لجهاز آخر أو متصفح جديد.
          </p>
          
          <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleBackup}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-lg border border-gray-600 transition-colors"
              >
                  <DownloadIcon className="w-4 h-4 text-primary-gold" />
                  تحميل نسخة احتياطية
              </button>

              <div className="relative">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button 
                    onClick={handleRestoreClick}
                    className="flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-lg border border-gray-600 transition-colors"
                  >
                      <UploadIcon className="w-4 h-4 text-primary-green" />
                      استعادة البيانات
                  </button>
              </div>
          </div>
          
          {importStatus === 'SUCCESS' && (
              <p className="text-green-500 text-sm mt-2 font-bold animate-pulse">تم استعادة البيانات بنجاح! جاري تحديث التطبيق...</p>
          )}
          {importStatus === 'ERROR' && (
              <p className="text-red-500 text-sm mt-2">خطأ في الملف. يرجى التأكد من اختيار ملف JSON صحيح.</p>
          )}
      </div>

      {/* Badges Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🏆</span> لوحة الشرف والأوسمة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {achievements.map((badge) => {
                const isUnlocked = user.achievements?.includes(badge.id);
                return (
                    <div 
                        key={badge.id}
                        className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                            isUnlocked 
                            ? 'bg-gradient-to-b from-primary-gold/20 to-secondary-gray border-primary-gold shadow-lg shadow-primary-gold/10' 
                            : 'bg-black/30 border-gray-800 opacity-50 grayscale'
                        }`}
                    >
                        <span className="text-4xl mb-2 filter drop-shadow-lg">{badge.icon}</span>
                        <h4 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-primary-gold' : 'text-gray-500'}`}>{badge.title}</h4>
                        <p className="text-[10px] text-gray-400">{badge.description}</p>
                    </div>
                )
            })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/40 p-5 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">إجمالي النقاط (XP)</p>
          <p className="text-2xl font-bold text-primary-gold">{user.currentXp}</p>
        </div>
        <div className="bg-black/40 p-5 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">الجلسات المسجلة</p>
          <p className="text-2xl font-bold text-primary-ice">{user.history.length}</p>
        </div>
        <div className="bg-black/40 p-5 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">تاريخ الانضمام</p>
          <p className="text-lg font-bold text-white">{new Date(user.joinDate).toLocaleDateString('ar-EG')}</p>
        </div>
         <div className="bg-black/40 p-5 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">المستوى التالي</p>
          <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
            <div 
              className="bg-primary-green h-2 rounded-full" 
              style={{ width: `${(user.currentXp / user.nextLevelXp) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ChartIcon className="w-6 h-6" />
          سجل النشاطات
        </h3>
        
        {user.history.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-secondary-gray rounded-2xl border border-gray-800">
            لا توجد جلسات مسجلة بعد. ابدأ التدريب الآن!
          </div>
        ) : (
          <div className="bg-secondary-gray rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-black/30 text-gray-400 text-sm">
                <tr>
                  <th className="p-4">النمط</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">النتيجة</th>
                  <th className="p-4">المدة</th>
                  <th className="p-4">XP</th>
                </tr>
              </thead>
              <tbody className="text-white divide-y divide-gray-800">
                {user.history.map((session) => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-primary-gold">{session.styleName}</td>
                    <td className="p-4 text-sm text-gray-400">{formatDate(session.date)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        session.analysis.technicalScore >= 80 ? 'bg-primary-green/20 text-primary-green' : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {session.analysis.technicalScore}%
                      </span>
                    </td>
                    <td className="p-4 text-sm">{Math.floor(session.durationSeconds)} ثانية</td>
                    <td className="p-4 text-primary-ice">+{session.xpEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
