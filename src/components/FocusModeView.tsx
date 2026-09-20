import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  BookOpen,
  CheckCircle2,
  Flame,
  Award,
  Plus,
} from 'lucide-react';
import {
  logFocusSession,
  fetchUserFocusSessions,
  fetchUserClasses,
} from '../services/workplaceService';
import { FocusSession, AcademicClass } from '../types';

export const FocusModeView: React.FC<{ onNavigate: (route: string) => void }> = ({
  onNavigate,
}) => {
  const { userProfile } = useAuth();

  // Timer configuration (in seconds)
  const presets = [
    { label: 'Pomodoro', duration: 25 * 60 },
    { label: 'Deep Focus', duration: 50 * 60 },
    { label: 'Short Break', duration: 5 * 60 },
    { label: 'Long Break', duration: 15 * 60 },
  ];

  const [activePreset, setActivePreset] = useState<string>('Pomodoro');
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [taskName, setTaskName] = useState<string>('Academic Research & Reading');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [userClasses, setUserClasses] = useState<AcademicClass[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [sessionSavedMsg, setSessionSavedMsg] = useState<string | null>(null);

  // Web Audio ambient sound synthesizer state
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'brown' | 'tick'>('none');
  const [volume, setVolume] = useState<number>(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<{ stop: () => void } | null>(null);

  // Load classes and past focus sessions
  useEffect(() => {
    if (!userProfile?.uid) return;
    const loadData = async () => {
      try {
        const [cls, sess] = await Promise.all([
          fetchUserClasses(userProfile.uid),
          fetchUserFocusSessions(userProfile.uid),
        ]);
        setUserClasses(cls);
        if (cls.length > 0) {
          setSelectedCourse(cls[0].code);
        }
        setSessions(sess);
      } catch (e) {
        console.error('Error loading focus data:', e);
      } finally {
        setLoadingSessions(false);
      }
    };
    loadData();
  }, [userProfile]);

  // Countdown interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      handleCompleteSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const selectPreset = (label: string, duration: number) => {
    setIsRunning(false);
    setActivePreset(label);
    setTotalSeconds(duration);
    setSecondsLeft(duration);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const handleCompleteSession = async () => {
    if (!userProfile?.uid) return;
    const minutesCompleted = Math.round((totalSeconds - secondsLeft) / 60) || 1;
    try {
      await logFocusSession(userProfile.uid, {
        task: taskName || 'Deep Work Session',
        durationMinutes: minutesCompleted,
        completedAt: new Date().toISOString(),
        course: selectedCourse,
      });
      setSessionSavedMsg(`Recorded ${minutesCompleted}m study session to your academic record!`);
      setTimeout(() => setSessionSavedMsg(null), 4000);
      const updated = await fetchUserFocusSessions(userProfile.uid);
      setSessions(updated);
    } catch (err) {
      console.error('Failed to log study session:', err);
    }
  };

  const handleManualLog = async () => {
    if (!userProfile?.uid) return;
    const minutes = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
    try {
      await logFocusSession(userProfile.uid, {
        task: taskName || 'Focus Study',
        durationMinutes: minutes,
        completedAt: new Date().toISOString(),
        course: selectedCourse,
      });
      setSessionSavedMsg(`Successfully logged ${minutes} minutes of deep focus.`);
      setTimeout(() => setSessionSavedMsg(null), 4000);
      const updated = await fetchUserFocusSessions(userProfile.uid);
      setSessions(updated);
      handleReset();
    } catch (err) {
      console.error('Failed to log session:', err);
    }
  };

  // Web Audio Synth for Ambient Soundscapes
  const startAmbientSynth = (type: 'rain' | 'brown' | 'tick') => {
    stopAmbientSynth();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(ctx.destination);

      if (type === 'rain') {
        // Filtered white noise modulated to sound like soothing rain
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        whiteNoise.start();

        ambientNodeRef.current = {
          stop: () => {
            try {
              whiteNoise.stop();
              ctx.close();
            } catch (e) {
              // ignore
            }
          },
        };
      } else if (type === 'brown') {
        // Deep brown noise for intense focus
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const brownNoise = ctx.createBufferSource();
        brownNoise.buffer = noiseBuffer;
        brownNoise.loop = true;
        brownNoise.connect(gainNode);
        brownNoise.start();

        ambientNodeRef.current = {
          stop: () => {
            try {
              brownNoise.stop();
              ctx.close();
            } catch (e) {
              // ignore
            }
          },
        };
      } else if (type === 'tick') {
        // Soft analog clock pulse
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);

        const tickGain = ctx.createGain();
        tickGain.gain.setValueAtTime(0, ctx.currentTime);

        osc.connect(tickGain);
        tickGain.connect(gainNode);
        osc.start();

        const tickInterval = setInterval(() => {
          if (ctx.state === 'running') {
            tickGain.gain.setValueAtTime(0.08, ctx.currentTime);
            tickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
          }
        }, 1000);

        ambientNodeRef.current = {
          stop: () => {
            clearInterval(tickInterval);
            try {
              osc.stop();
              ctx.close();
            } catch (e) {
              // ignore
            }
          },
        };
      }
    } catch (e) {
      console.warn('Web Audio Ambient initialization deferred:', e);
    }
  };

  const stopAmbientSynth = () => {
    if (ambientNodeRef.current) {
      ambientNodeRef.current.stop();
      ambientNodeRef.current = null;
    }
  };

  const toggleSound = (sound: 'none' | 'rain' | 'brown' | 'tick') => {
    if (ambientSound === sound || sound === 'none') {
      stopAmbientSynth();
      setAmbientSound('none');
    } else {
      setAmbientSound(sound);
      startAmbientSynth(sound);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSynth();
    };
  }, []);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const totalMinutesStudied = sessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>Academic Deep Work Sanctuary</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Focus & Study Mode
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Immerse in undisturbed academic flow with built-in library ambient acoustics, session timers, and real study time synchronization.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="glass-card px-4 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Total Logged</span>
            <span className="text-lg font-bold text-cyan-300 font-mono">{totalMinutesStudied} mins</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Sessions</span>
            <span className="text-lg font-bold text-sky-300 font-mono">{sessions.length}</span>
          </div>
        </div>
      </div>

      {sessionSavedMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs text-center flex items-center justify-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{sessionSavedMsg}</span>
        </div>
      )}

      {/* Main Study Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timer & Controls */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col items-center justify-center text-center">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => selectPreset(p.label, p.duration)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePreset === p.label
                    ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {p.label} ({Math.round(p.duration / 60)}m)
              </button>
            ))}
          </div>

          {/* Circular Countdown Display */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-8">
            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                className="stroke-slate-900/80 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                className="stroke-cyan-400 fill-none transition-all duration-1000"
                strokeWidth="10"
                strokeDasharray="283"
                strokeDashoffset={`${283 - (283 * progressPercent) / 100}`}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Clock Face */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-wider">
                {formatTime(secondsLeft)}
              </span>
              <span className="text-xs text-cyan-400 font-medium tracking-wide mt-2">
                {isRunning ? 'Flow State Active' : 'Ready to Focus'}
              </span>
              <span className="text-[11px] text-slate-400 truncate max-w-[180px] mt-1">
                {taskName || 'Reading & Study'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer shadow-xl ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 text-slate-950 shadow-cyan-500/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Focus Session</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3.5 rounded-2xl glass-card hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Log Progress Button */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={handleManualLog}
              className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-medium cursor-pointer"
            >
              + Log Current Session to Records
            </button>
          </div>
        </div>

        {/* Right 1 Col: Session Context & Ambient Acoustics */}
        <div className="space-y-6">
          {/* Study Context Form */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white font-heading flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Session Subject & Goal</span>
            </h3>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Target Task / Topic</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Chapter 4 Distributed Systems"
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Associated Class</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900"
              >
                <option value="">General Academic Study</option>
                {userClasses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Library Ambient Soundscape Synthesizer */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-heading flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>Library Ambient Sound</span>
              </h3>
              {ambientSound !== 'none' && (
                <span className="text-[10px] text-cyan-400 animate-pulse font-mono font-semibold">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Procedurally synthesized audio waves generated via your browser. No external downloads required.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => toggleSound('rain')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  ambientSound === 'rain'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                🌧️ Library Rain
              </button>

              <button
                type="button"
                onClick={() => toggleSound('brown')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  ambientSound === 'brown'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                ☕ Brown Noise
              </button>

              <button
                type="button"
                onClick={() => toggleSound('tick')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  ambientSound === 'tick'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                ⏱️ Analog Tick
              </button>

              <button
                type="button"
                onClick={() => toggleSound('none')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  ambientSound === 'none'
                    ? 'bg-slate-800 border-white/20 text-white'
                    : 'bg-slate-900/60 border-white/10 text-slate-500'
                }`}
              >
                🔇 Silence
              </button>
            </div>
          </div>

          {/* Recent Focus Records */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white font-heading flex items-center justify-between">
              <span>Recent Study Logs</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </h3>

            {loadingSessions ? (
              <p className="text-xs text-slate-500 py-2">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No focus sessions logged yet. Complete your first timer to record study time!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sessions.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white truncate max-w-[140px]">{s.task}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(s.completedAt).toLocaleDateString()} {s.course ? `• ${s.course}` : ''}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono font-bold text-[11px]">
                      {s.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
