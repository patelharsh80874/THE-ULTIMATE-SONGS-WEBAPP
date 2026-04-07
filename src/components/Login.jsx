import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import logo from "./../../public/logo3.jpg";
import Tooltip from "./Tooltip";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const [loginMode, setLoginMode] = useState("password"); // "password" | "otp-input"
  const [rememberMe, setRememberMe] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  
  const { login, sendLoginOtp, verifyLoginOtp, user, otpAttempts } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { success, requiresOtp, identifier: returnedIdentifier } = await login(identifier, password, rememberMe);
      if (success && requiresOtp) {
        setIdentifier(returnedIdentifier || identifier);
        setLoginMode("otp-input");
        setResendTimer(30);
      } else if (success) {
        navigate("/");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsSendingOtp(true);
    try {
      const { success } = await sendLoginOtp(identifier);
      if (success) {
        setResendTimer(30);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSendOtp = async () => {
    if (!identifier) {
      toast.error("Please enter your username or email first", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return;
    }
    setIsSendingOtp(true);
    try {
      const { success } = await sendLoginOtp(identifier);
      if (success) {
        setLoginMode("otp-input");
        setResendTimer(30);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const { success } = await verifyLoginOtp(identifier, otpString, rememberMe);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  return (
    <div className="lg:h-screen lg:overflow-hidden min-h-screen bg-slate-900 flex lg:flex-row flex-col relative font-sans">
      
      {/* 1. Left Section: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full border-r border-white/5 overflow-hidden bg-slate-950/20">
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0], x: [0, 50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1.3, 1, 1.3], x: [0, -70, 0], y: [0, 50, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-blue-500/15 blur-[100px] rounded-full"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center w-full px-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-3xl bg-white/[0.03] p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center max-w-sm relative group"
          >
            <div className="mb-6 relative inline-block">
              <div className="absolute -inset-8 bg-purple-500/20 blur-3xl rounded-full" />
              <img src={logo} alt="Logo" className="w-28 h-28 rounded-3xl shadow-2xl border border-white/10 relative z-10 transform -rotate-6 group-hover:rotate-0 transition-transform duration-700" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight mb-3">
              The Ultimate <br /> <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Songs</span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Your premium music universe</p>
          </motion.div>
        </div>
      </div>

      {/* 2. Right Section: Form */}
      <div className="flex-1 flex flex-col relative z-20 h-full overflow-hidden">
        <div className="p-3 lg:p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all group">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 transition-all font-bold"><i className="ri-arrow-left-line text-sm"></i></div>
            <span className="font-bold text-[8px] tracking-[0.2em] uppercase opacity-60">Return Home</span>
          </Link>
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg lg:hidden" />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-14 pb-2 pt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-2 text-left">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Welcome Back</h2>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em] opacity-50">Sync with the cloud</p>
            </div>

            <AnimatePresence mode="wait">
              {loginMode === "password" ? (
                <motion.form 
                  key="password-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handlePasswordLogin} 
                  className="space-y-3"
                >
                  <div className="space-y-1 group">
                    <label className="block text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-purple-400 transition-colors">Username or Email</label>
                    <Tooltip text="Enter your registered username or email address" position="top" className="w-full">
                      <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="ri-user-3-fill text-zinc-500 text-sm"></i></div>
                        <input
                          type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                          autoComplete="username"
                          className="w-full pl-11 pr-4 py-2.5 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/30 transition-all font-bold text-xs"
                          placeholder="Enter username or email"
                        />
                      </div>
                    </Tooltip>
                  </div>

                  <div className="space-y-1 group">
                    <label className="block text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-purple-400 transition-colors">Password</label>
                    <Tooltip text="Enter your secure password" position="top" className="w-full">
                      <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="ri-lock-2-fill text-zinc-500 text-sm"></i></div>
                        <input
                          type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          className="w-full pl-11 pr-12 py-2.5 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/30 transition-all font-bold text-xs"
                          placeholder="Enter your password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors">
                          <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line text-lg"} />
                        </button>
                      </div>
                    </Tooltip>
                    <div className="flex justify-end mt-1">
                      <Tooltip text="Recover your account" position="top">
                        <Link to="/forgot-password" size="sm" className="text-[9px] text-zinc-400 hover:text-purple-400 font-black uppercase tracking-widest transition-all hover:underline decoration-purple-500/50 underline-offset-4 pointer-events-auto">Forgot Password?</Link>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 py-1">
                    <Tooltip 
                      text="🔐 Remember Me Sessions: Checked keeps you logged in for 30 days. Unchecked ends the session after 1 day (best for public devices)." 
                      position="top"
                    >
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={rememberMe} 
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="w-4 h-4 border-2 border-white/10 rounded group-hover:border-purple-500/50 transition-all peer-checked:bg-purple-600 peer-checked:border-purple-600"></div>
                          <i className="ri-check-line absolute text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                        </div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">Remember Me</span>
                      </label>
                    </Tooltip>
                  </div>

                  <div className="pt-1 flex flex-col gap-2">
                    <button type="submit" disabled={isLoggingIn || isSendingOtp} className="w-full h-10 group/btn relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-25 group-hover/btn:opacity-40 transition-opacity" />
                      <div className={`relative h-full w-full ${isLoggingIn ? 'bg-zinc-800' : 'bg-gradient-to-r from-purple-600 to-blue-500'} rounded-xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all`}>
                        {isLoggingIn ? <>Verifying... <i className="ri-loader-4-line animate-spin"></i></> : <>Log In <i className="ri-arrow-right-line"></i></>}
                      </div>
                    </button>

                    <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-zinc-500 text-[8px] uppercase tracking-widest font-bold">OR</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <button type="button" onClick={handleSendOtp} disabled={isLoggingIn || isSendingOtp} className="w-full h-10 group/btn relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95">
                      <div className="relative h-full w-full flex items-center justify-center gap-2 text-zinc-300 font-black uppercase tracking-[0.2em] text-[10px]">
                        {isSendingOtp ? <>Dispatching... <i className="ri-loader-4-line animate-spin"></i></> : <>Log in with OTP <i className="ri-mail-send-line"></i></>}
                      </div>
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleOtpLogin} 
                  className="space-y-6"
                >
                   <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                      <i className="ri-mail-check-line text-3xl text-purple-400 mb-2 block"></i>
                      <p className="text-zinc-300 text-sm font-medium">We sent a secure code to your email.</p>
                      <p className="text-zinc-500 text-xs mt-1">Please check your inbox (and spam folder).</p>
                      
                      {otpAttempts.remaining !== null && (
                        <div className="mt-3 flex items-center justify-center gap-2">
                           <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                             otpAttempts.remaining <= 1 ? 'border-red-500/30 text-red-400 bg-red-500/5' : 
                             otpAttempts.remaining <= 2 ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 
                             'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                           }`}>
                             🛡️ {otpAttempts.remaining} / {otpAttempts.limit} Attempts Remaining
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="flex justify-center gap-3">
                      {otp.map((data, index) => {
                          return (
                              <input
                                  className="w-12 h-14 bg-white/[0.04] border border-white/10 rounded-xl text-white text-center text-xl font-black focus:outline-none focus:border-purple-500/50 transition-all placeholder-zinc-700"
                                  type="text"
                                  name="otp"
                                  maxLength="1"
                                  key={index}
                                  value={data}
                                  onChange={e => handleOtpChange(e.target, index)}
                                  onFocus={e => e.target.select()}
                                  placeholder="•"
                              />
                          );
                      })}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button type="submit" disabled={isLoggingIn} className="w-full h-10 group/btn relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-25 group-hover/btn:opacity-40 transition-opacity" />
                      <div className={`relative h-full w-full ${isLoggingIn ? 'bg-zinc-800' : 'bg-gradient-to-r from-purple-600 to-blue-500'} rounded-xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all`}>
                        {isLoggingIn ? <>Authenticating... <i className="ri-loader-4-line animate-spin"></i></> : <>Verify & Login <i className="ri-checkbox-circle-line"></i></>}
                      </div>
                    </button>

                    <div className="flex flex-col items-center gap-2">
                      <button 
                        type="button" 
                        onClick={handleResendOtp} 
                        disabled={resendTimer > 0 || isSendingOtp}
                        className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${resendTimer > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300'}`}
                      >
                        {resendTimer > 0 ? (
                          <>Wait to Resend ({resendTimer}s)</>
                        ) : isSendingOtp ? (
                          <>Dispatching... <i className="ri-loader-4-line animate-spin"></i></>
                        ) : (
                          <>Resend Code <i className="ri-refresh-line"></i></>
                        )}
                      </button>

                      <button type="button" onClick={() => setLoginMode("password")} className="w-full h-10 text-zinc-500 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                         <i className="ri-arrow-left-line"></i> Back to Password
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-3 pt-2 border-t border-white/5 flex flex-col items-center lg:items-start">
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1 opacity-50">New to the family?</p>
              <Link to="/register" className="group inline-flex items-center gap-2 text-white hover:text-purple-400 font-black tracking-[0.1em] transition-all uppercase text-[10px]">
                <span className="relative">Create Account <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-white/10 group-hover:bg-purple-500/50" /></span>
                <i className="ri-add-line text-sm bg-white/5 w-6 h-6 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-all shadow-lg"></i>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
