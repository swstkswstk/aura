import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, ArrowRight, Lock, ChevronLeft, ShieldCheck,
  Loader2, AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { sendOtp, verifyOtpAndLogin } from '../services/authService';

interface AuthProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

type AuthStep = 'input' | 'verify';

export const Auth: React.FC<AuthProps> = ({ onLogin, onCancel }) => {
  const [step, setStep] = useState<AuthStep>('input');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetError = () => setError('');
  const normalizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10);

  const isValidPhone = (value: string) => {
    const digits = normalizePhoneInput(value);
    return digits.length === 10;
  };

  const handleSendOtp = async () => {
    resetError();

    if (!phone || !isValidPhone(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendOtp(phone);

      if (response.success) {
        // Store demo code if available (development mode)
        if (response.demoCode) {
          setDemoCode(response.demoCode);
        }
        setStep('verify');
      } else {
        setError(response.message || 'Failed to send verification code.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    resetError();
    setIsLoading(true);

    try {
      const response = await verifyOtpAndLogin(phone, otp);

      if (response.success && response.user) {
        onLogin(response.user);
      } else {
        setError(response.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setDemoCode(null);
    await handleSendOtp();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative bg-brand-50/50">
      <button
        onClick={onCancel}
        className="absolute top-4 left-4 text-brand-500 hover:text-brand-800 flex items-center gap-1 text-sm font-medium transition-colors"
      >
        <ChevronLeft size={16} /> Back to Boutique
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-brand-100"
      >
        {/* Header */}
        <div className="bg-brand-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20"
            >
              <Lock className="w-6 h-6 text-brand-100" />
            </motion.div>
            <h2 className="font-serif text-2xl mb-2 tracking-wide">Welcome to Aura</h2>
            <p className="text-brand-200 text-sm font-light">Your personal olfactory sanctuary</p>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: PHONE INPUT */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(normalizePhoneInput(e.target.value));
                        resetError();
                      }}
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="9876543210"
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg pl-11 pr-4 py-3 text-brand-900 placeholder:text-brand-300 focus:ring-1 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      autoFocus
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 group-focus-within:text-brand-600 transition-colors">
                      <Phone size={18} />
                    </div>
                  </div>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                      <AlertCircle size={12} /> {error}
                    </motion.div>
                  )}
                </div>

                {/* <div className="text-xs text-brand-400 leading-relaxed bg-brand-50 p-3 rounded-lg border border-brand-100">
                  <span className="font-bold">Tip:</span> Use <code className="bg-white px-1 py-0.5 rounded border border-brand-200 text-brand-600">7786852209</code> to access the CRM Dashboard.
                </div> */}

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full bg-brand-900 text-white py-3.5 rounded-lg font-medium hover:bg-brand-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>Send Verification Code <ArrowRight size={18} /></>
                  )}
                </button>

                <p className="text-xs text-center text-brand-400">
                  Enter your 10-digit phone number to generate an OTP
                </p>
              </motion.div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <p className="text-brand-600 mb-1 text-sm">
                    Enter the code sent to
                  </p>
                  <p className="font-bold text-brand-800">{phone}</p>
                </div>

                {/* DEMO MODE CODE DISPLAY */}
                {demoCode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-xs text-center"
                  >
                    <span className="font-bold">OTP:</span> Your verification code is{' '}
                    <span className="font-mono text-lg font-bold mx-1">{demoCode}</span>
                  </motion.div>
                )}

                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      resetError();
                    }}
                    placeholder="0 0 0 0 0 0"
                    className="w-full bg-brand-50 border border-brand-200 rounded-lg py-4 text-center text-3xl tracking-[0.5em] font-serif text-brand-900 focus:ring-1 focus:ring-brand-400 outline-none transition-all placeholder:text-brand-200"
                    autoFocus
                  />
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-3 text-center flex items-center justify-center gap-1">
                      <AlertCircle size={12} /> {error}
                    </motion.p>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-brand-900 text-white py-3.5 rounded-lg font-medium hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify & Sign In'}
                </button>

                <div className="text-center space-y-2">
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-xs text-brand-400 hover:text-brand-600 font-medium disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                  <div>
                    <button
                      onClick={() => {
                        setStep('input');
                        setOtp('');
                        setDemoCode(null);
                        resetError();
                      }}
                      className="text-xs text-brand-300 hover:text-brand-500"
                    >
                      Use a different phone number
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
