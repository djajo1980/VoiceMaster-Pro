
import React, { useState } from 'react';
import { loginUser } from '../services/storageService';
import { User } from '../types';
import { MicIcon } from './Icons';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    const user = loginUser(username, email);
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-black p-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-gold/10 rounded-full filter blur-[100px]"></div>
         <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-ice/10 rounded-full filter blur-[80px]"></div>
      </div>

      <div className="z-10 bg-secondary-gray/80 backdrop-blur-lg p-8 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-gradient-to-tr from-primary-gold to-yellow-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-gold/20">
             <MicIcon className="w-10 h-10 text-black" />
           </div>
           <h1 className="text-3xl font-bold tracking-wide text-white">Voice<span className="text-primary-gold">Master</span> Pro</h1>
           <p className="text-gray-400 mt-2">منصتك الاحترافية للتدريب الصوتي</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">اسم المستخدم</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-gold focus:ring-1 focus:ring-primary-gold outline-none transition-all"
              placeholder="أدخل اسمك"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-gold focus:ring-1 focus:ring-primary-gold outline-none transition-all"
              placeholder="example@email.com"
            />
          </div>
          
          {error && <p className="text-secondary-red text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-primary-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary-gold/30 transform hover:-translate-y-1"
          >
            تسجيل الدخول / إنشاء حساب
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          بالاستمرار، أنت توافق على شروط الخدمة وسياسة الخصوصية.
        </p>
      </div>
    </div>
  );
};

export default Auth;
