import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/"); // Redirect home if already logged in
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
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
          <span className="font-bold text-sm tracking-widest uppercase">Back to Songs</span>
        </Link>

        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl bg-slate-700/50">
          <div className="relative z-10">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center border border-white/10 shadow-xl">
                <i className="ri-music-2-fill text-4xl text-brand-primary"></i>
              </div>
            </div>
            
            <h2 className="text-4xl font-black text-center text-white mb-2 tracking-tight uppercase">Login</h2>
            <p className="text-center text-zinc-400 mb-10 font-medium">Sync your collection to the cloud</p>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full bg-brand-primary text-black font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg transition-all flex items-center justify-center gap-3 mt-4 hover:text-green-400"
              >
                Let's Go <i className="ri-arrow-right-line text-xl"></i>
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-zinc-500 font-bold mb-2">New to Ultimate Songs?</p>
              <Link to="/register" className="inline-flex items-center gap-1 text-brand-primary hover:text-green-400 font-black tracking-wide transition-all uppercase text-sm">
                Create Cloud Account <i className="ri-add-circle-fill"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
