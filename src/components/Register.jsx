import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config/api";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/"); // Redirect home if already logged in
    }
  }, [user, navigate]);

  // Live Username Check with Debounce
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      setIsChecking(false);
      return;
    }

    const check = async () => {
      setIsChecking(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/check-username/${username}`);

        setUsernameAvailable(data.available);
      } catch (error) {
        console.error("Username check failed", error);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(check, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(username, email, password);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-6 relative overflow-x-hidden">
      <div className="max-w-md w-full relative z-10">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-brand-primary transition-all mb-8 group w-fit"
        >
          <i className="ri-arrow-left-line group-hover:-translate-x-1 transition-transform"></i>
          <span className="font-bold text-sm tracking-widest uppercase">Explore Songs</span>
        </Link>

        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl bg-slate-700/50">
          <div className="relative z-10">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center border border-white/10 shadow-xl">
                <i className="ri-user-add-fill text-4xl text-brand-primary"></i>
              </div>
            </div>
            
            <h2 className="text-4xl font-black text-center text-white mb-2 tracking-tight uppercase">Join Us</h2>
            <p className="text-center text-zinc-400 mb-10 font-medium">Start your ultimate cloud collection</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-user-fill text-zinc-500 group-focus-within:text-brand-primary transition-colors"></i>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 bg-slate-800/50 border-2 rounded-2xl text-white placeholder-zinc-600 focus:outline-none transition-all font-semibold ${
                      usernameAvailable === true ? 'border-green-500/50' : 
                      usernameAvailable === false ? 'border-red-500/50' : 'border-white/5 focus:border-brand-primary/50'
                    }`}
                    placeholder="your_name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    {isChecking ? (
                      <i className="ri-loader-4-line animate-spin text-zinc-500"></i>
                    ) : usernameAvailable === true ? (
                      <i className="ri-checkbox-circle-fill text-green-500"></i>
                    ) : usernameAvailable === false ? (
                      <i className="ri-error-warning-fill text-red-500"></i>
                    ) : null}
                  </div>
                </div>
                {usernameAvailable === false && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">Username already taken</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-mail-fill text-zinc-500 group-focus-within:text-brand-primary transition-colors"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border-2 border-white/5 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-brand-primary/50 focus:bg-slate-800 transition-all font-semibold"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-lock-2-fill text-zinc-500 group-focus-within:text-brand-primary transition-colors"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border-2 border-white/5 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-brand-primary/50 focus:bg-slate-800 transition-all font-semibold"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    <i className={showPassword ? "ri-eye-off-fill" : "ri-eye-fill"}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary text-black font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg transition-all flex items-center justify-center gap-3 mt-4 uppercase tracking-wider hover:text-green-400"
              >
                Create Account <i className="ri-sparkling-fill"></i>
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-zinc-500 font-bold mb-2">Already have an account?</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-brand-primary hover:text-green-400 font-black tracking-wide transition-all uppercase text-sm">
                Login Instead <i className="ri-login-circle-fill"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
