import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  RiShieldCheckLine, RiUserAddLine, RiLoginCircleLine, 
  RiStarFill, RiQuestionLine, RiDoubleQuotesL 
} from 'react-icons/ri';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-900 text-white selection:bg-brand-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(124,58,237,0.15)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-surface-900 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
            <RiShieldCheckLine className="text-sm" />
            AI-POWERED MODERATION ENGINE
          </div>

          <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-[1.1] animate-slide-up">
            Next-Gen Content <br />
            <span className="gradient-text">Trust & Safety</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-400 text-lg lg:text-xl font-medium mb-12 animate-slide-up delay-100 italic">
            "Automate toxicity detection, prevent duplicates, and manage your community reviews with explainable AI insights."
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Link 
              to="/login" 
              className="px-10 py-4 rounded-2xl bg-brand-600 text-white font-black text-sm uppercase tracking-widest hover:bg-brand-500 transition-all shadow-2xl shadow-brand-500/20 flex items-center justify-center gap-3 group"
            >
              Let's Get Started
              <RiLoginCircleLine size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card p-8 bg-surface-800/50 border border-surface-700 rounded-3xl group hover:border-brand-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6 text-brand-400 group-hover:scale-110 transition-transform">
              <RiStarFill size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Explainable AI</h3>
            <p className="text-slate-500 leading-relaxed text-sm italic">
              Don't just flag content. Understand why. Get detailed toxicity scores and keyword highlights.
            </p>
          </div>

          <div className="card p-8 bg-surface-800/50 border border-surface-700 rounded-3xl group hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
              <RiShieldCheckLine size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Lifecycle Tracking</h3>
            <p className="text-slate-500 leading-relaxed text-sm italic">
              Follow every review from submission to decision with a transparent history timeline.
            </p>
          </div>

          <div className="card p-8 bg-surface-800/50 border border-surface-700 rounded-3xl group hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform">
              <RiQuestionLine size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Duplicate Guard</h3>
            <p className="text-slate-500 leading-relaxed text-sm italic">
              Advanced TF-IDF analysis identifies similar patterns across thousands of submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <RiDoubleQuotesL size={48} className="mx-auto mb-8 text-brand-500/20" />
        <h2 className="text-2xl font-medium text-slate-300 leading-relaxed">
          The platform ensures that user trust is maintained through a transparent, high-speed moderation workflow that prioritizes human-in-the-loop decision making.
        </h2>
      </div>

      {/* Footer */}
      <div className="py-20 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-px bg-gradient-to-r from-transparent via-surface-700 to-transparent" />
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; 2026 ReviewGuard AI. All Intelligence Reserved.
        </p>
      </div>
    </div>
  );
}
