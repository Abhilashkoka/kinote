import { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  ShieldAlert, 
  Ambulance, 
  CheckCircle2, 
  Activity, 
  UserCheck,
  AlertTriangle,
  Users,
  ArrowRight
} from 'lucide-react';
import { speakText, playEmergencyChime } from '../utils/speech';
import { AIVoiceCallLog, PatientLocation } from '../types';

interface AIVoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  triggerReason: string;
  currentVitalsSummary: string;
  patientLocation: PatientLocation;
  onCallResolved: (log: AIVoiceCallLog) => void;
}

export default function AIVoiceCallModal({
  isOpen,
  onClose,
  patientName,
  triggerReason,
  currentVitalsSummary,
  patientLocation,
  onCallResolved,
}: AIVoiceCallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Q1 sequence stages:
  // Stage 1 (Option A): Patient First Voice Check
  // Stage 2 (Option C): Caregiver Discreet Escalation
  // Stage 3 (Option B): Simultaneous 3-Way Conference Bridge & EMS
  const [triageStage, setTriageStage] = useState<'stage1_patient' | 'stage2_caregiver' | 'stage3_conference'>('stage1_patient');
  
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'dispatched' | 'ended'>('connecting');
  const [transcript, setTranscript] = useState<{ speaker: 'ai' | 'patient' | 'caregiver' | 'system'; text: string; time: string }[]>([]);
  const [patientStatus, setPatientStatus] = useState<'pending' | 'ok' | 'distressed' | 'unresponsive'>('pending');
  const [aiSpeechState, setAiSpeechState] = useState<'speaking' | 'listening' | 'idle'>('idle');
  const [waveHeights, setWaveHeights] = useState<number[]>([40, 65, 30, 85, 55, 95, 45, 70, 35, 60]);

  const speechCancelRef = useRef<(() => void) | null>(null);

  // Audio wave animation
  useEffect(() => {
    if (callStatus !== 'active') return;
    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map(() => (aiSpeechState === 'speaking' ? Math.floor(Math.random() * 70) + 25 : Math.floor(Math.random() * 20) + 10))
      );
    }, 120);
    return () => clearInterval(interval);
  }, [callStatus, aiSpeechState]);

  // Call timer
  useEffect(() => {
    if (callStatus !== 'active') return;
    const timer = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  // Initiate call flow on open
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      setCallStatus('connecting');
      setTranscript([]);
      setPatientStatus('pending');
      setTriageStage('stage1_patient');
      if (speechCancelRef.current) speechCancelRef.current();
      return;
    }

    playEmergencyChime();

    const isMedicationAlert = triggerReason.toLowerCase().includes('missed') || 
                              triggerReason.toLowerCase().includes('medication') || 
                              triggerReason.toLowerCase().includes('dose');

    const connectTimeout = setTimeout(() => {
      setCallStatus('active');
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const greeting = isMedicationAlert
        ? `Hello ${patientName}. This is KINOTE AI Health Assistant calling on behalf of your son David. We noticed your scheduled medication has not been marked as taken yet. Are you doing alright, and can you take your medication now with water?`
        : `Hello ${patientName}. This is KINOTE Emergency Voice Dispatch. We detected: ${triggerReason}. Are you safe and conscious? Please speak or press a button to tell me how you are feeling.`;

      setTranscript([
        {
          speaker: 'system',
          text: isMedicationAlert
            ? `[AI Medication Adherence Check-in] Outbound call connected to ${patientName} • Trigger: ${triggerReason}`
            : `[Stage 1 / Option A] Outbound AI Emergency Call connected to ${patientName} • Trigger: ${triggerReason}`,
          time: now,
        },
        {
          speaker: 'ai',
          text: greeting,
          time: now,
        },
      ]);

      setAiSpeechState('speaking');
      speechCancelRef.current = speakText(greeting, () => {
        setAiSpeechState('listening');
      });
    }, 1200);

    return () => {
      clearTimeout(connectTimeout);
      if (speechCancelRef.current) speechCancelRef.current();
    };
  }, [isOpen, patientName, triggerReason]);

  // Stage 1: Senior Patient Response
  const handlePatientResponse = (responseType: 'ok' | 'dizzy' | 'fall' | 'chest_pain' | 'taking_now' | 'nauseous') => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let patientText = '';
    let aiResponse = '';

    if (responseType === 'taking_now') {
      patientText = "Oh dear, I was distracted and forgot! I have my water glass and I am taking the pill right now.";
      aiResponse = `Wonderful, ${patientName}! I have recorded your dose as confirmed taken now, and I am sending a confirmation to David Miller so he knows you are doing well. Please rest comfortably.`;
      setPatientStatus('ok');
    } else if (responseType === 'nauseous') {
      patientText = "I was feeling a little queasy and nauseous earlier, so I decided to delay the dose.";
      aiResponse = `Thank you for letting me know, ${patientName}. I have documented this clinical context for Dr. Thorne and sent a note to David Miller to follow up with you gently.`;
      setPatientStatus('ok');
    } else if (responseType === 'ok') {
      patientText = "I am okay, it was just sudden movement or a false alarm. I'm feeling fine.";
      aiResponse = `Understood, ${patientName}. I have marked this as safe. I am notifying your primary caregiver David Miller that you are conscious and doing well. Stay hydrated.`;
      setPatientStatus('ok');
    } else if (responseType === 'dizzy') {
      patientText = "I am feeling very dizzy and lightheaded. My chest feels tight.";
      aiResponse = `Please sit or lie down immediately in a safe position. Escalating to Stage 2: Notifying your son David Miller and patching him into this call.`;
      setPatientStatus('distressed');
      // Escalate to Stage 2 (Option C)
      setTimeout(() => escalateToCaregiver(), 2000);
    } else if (responseType === 'fall') {
      patientText = "I had a fall on the floor and I am unable to get back up. Please send help!";
      aiResponse = `Do not attempt to strain yourself. Escalating immediately to Stage 2 and alerting David Miller, while preparing EMS relay for ${patientLocation.label}.`;
      setPatientStatus('distressed');
      setTimeout(() => escalateToCaregiver(), 2000);
    } else {
      patientText = "I have acute chest pain and shortness of breath.";
      aiResponse = `Emergency Protocol Priority 1 activated. Bridging to Stage 3: Immediate 3-Way Conference with ${patientLocation.nearestPSAP} and David Miller.`;
      setPatientStatus('distressed');
      setTimeout(() => escalateToConference(), 2000);
    }

    setTranscript((prev) => [
      ...prev,
      { speaker: 'patient', text: patientText, time: timeNow },
      { speaker: 'ai', text: aiResponse, time: timeNow },
    ]);

    setAiSpeechState('speaking');
    if (speechCancelRef.current) speechCancelRef.current();
    speechCancelRef.current = speakText(aiResponse, () => {
      setAiSpeechState('listening');
    });
  };

  // Stage 2 (Option C): Escalate to Caregiver
  const escalateToCaregiver = () => {
    setTriageStage('stage2_caregiver');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const msg = `[Stage 2 / Option C Activated] Direct Outbound Priority Bridge to David Miller (+1 555-234-8901). Senior expressed distress.`;
    const aiSpeech = `David, KINOTE has bridged you to Eleanor. Her pulse is elevated and she reported distress. Location: ${patientLocation.address}.`;

    setTranscript((prev) => [
      ...prev,
      { speaker: 'system', text: msg, time: timeNow },
      { speaker: 'ai', text: aiSpeech, time: timeNow },
    ]);

    speakText(aiSpeech);
  };

  // Stage 3 (Option B): 3-Way Conference Bridge & EMS Dispatch
  const escalateToConference = () => {
    setTriageStage('stage3_conference');
    setCallStatus('dispatched');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dispatchMsg = `[Stage 3 / Option B Activated] 3-Way Conference Bridge Established: Senior + Caregiver + ${patientLocation.nearestPSAP} (${patientLocation.dispatchPreference.toUpperCase()}). Paramedic unit dispatched to ${patientLocation.address}.`;

    setTranscript((prev) => [
      ...prev,
      { speaker: 'system', text: dispatchMsg, time: timeNow },
      { speaker: 'ai', text: `EMS dispatch confirmed. Paramedics en route to ${patientLocation.address}. Estimated arrival: 5 minutes. Telemetry link live.`, time: timeNow },
    ]);

    speakText(`EMS dispatch confirmed. Paramedics en route to ${patientLocation.address}. Keep your phone near you.`);
  };

  const handleEndCall = () => {
    if (speechCancelRef.current) speechCancelRef.current();
    
    const finalLog: AIVoiceCallLog = {
      id: `call_${Date.now()}`,
      timestamp: 'Just now',
      recipientName: patientName,
      recipientPhone: '+1 (555) 321-7788',
      triggerReason: triggerReason,
      durationSeconds: Math.max(callDuration, 15),
      callStatus: callStatus === 'dispatched' ? 'escalated_to_911' : 'completed',
      patientResponded: patientStatus !== 'unresponsive',
      patientSentiment: patientStatus === 'ok' ? 'calm' : 'distressed',
      transcription: transcript.map((t) => `${t.speaker.toUpperCase()} (${t.time}): ${t.text}`).join('\n'),
      dispatchDispatched: callStatus === 'dispatched',
      stageReached: triageStage === 'stage3_conference' ? 'ems_bridge' : triageStage === 'stage2_caregiver' ? 'caregiver_escalated' : 'patient_voice_check',
    };

    onCallResolved(finalLog);
    onClose();
  };

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header Bar */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">KINOTE Emergency Voice Dispatch</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {callStatus === 'connecting' ? 'CONNECTING...' : formatSeconds(callDuration)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calling: <span className="text-slate-200 font-medium">{patientName}</span> ({currentVitalsSummary})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                isSpeakerOn ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-800/40 text-slate-500'
              }`}
              title="Speakerphone"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                isMuted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Microphone Muted' : 'Microphone Active'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3-Stage Cascading Triage Stepper (Q1: Option A -> Option C -> Option B) */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-sans">Triage Sequence:</span>
            <span className={`px-2 py-0.5 rounded ${triageStage === 'stage1_patient' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-500'}`}>
              1. Senior Check (Opt A)
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={`px-2 py-0.5 rounded ${triageStage === 'stage2_caregiver' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-500'}`}>
              2. Caregiver (Opt C)
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={`px-2 py-0.5 rounded ${triageStage === 'stage3_conference' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-500'}`}>
              3. 3-Way EMS Bridge (Opt B)
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Location: {patientLocation.label.split(' ')[0]}
          </span>
        </div>

        {/* Audio Wave Visualizer & Status */}
        <div className="bg-slate-950/60 px-6 py-5 border-b border-slate-800 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 h-14 w-full max-w-xs mb-2">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`w-2.5 rounded-full transition-all duration-100 ${
                  aiSpeechState === 'speaking'
                    ? 'bg-gradient-to-t from-teal-500 to-cyan-300 shadow-xs shadow-cyan-500/20'
                    : aiSpeechState === 'listening'
                    ? 'bg-gradient-to-t from-amber-500 to-rose-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            {aiSpeechState === 'speaking' && (
              <span className="text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                KINOTE AI Voice Agent is speaking with {patientName}...
              </span>
            )}
            {aiSpeechState === 'listening' && (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Listening for senior voice response or keypad input...
              </span>
            )}
            {aiSpeechState === 'idle' && (
              <span className="text-slate-400">Call connected • Live Audio Session</span>
            )}
          </div>
        </div>

        {/* Interactive Speech & Keypad Response Options */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Simulate Senior Response (Voice / Keypad 1-Tap)
            </p>
            {triageStage !== 'stage1_patient' && (
              <span className="text-[10px] text-amber-400 font-mono">
                {triageStage === 'stage2_caregiver' ? 'Stage 2 Caregiver Escalated' : 'Stage 3 3-Way Bridge Active'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {triggerReason.toLowerCase().includes('missed') || 
             triggerReason.toLowerCase().includes('medication') || 
             triggerReason.toLowerCase().includes('dose') ? (
              <>
                <button
                  onClick={() => handlePatientResponse('taking_now')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 text-emerald-200 text-xs font-medium transition-all text-left"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>"Taking pill now, I forgot"</span>
                </button>
                <button
                  onClick={() => handlePatientResponse('nauseous')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/50 border border-teal-700/50 text-teal-200 text-xs font-medium transition-all text-left"
                >
                  <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>"Delayed: mild upset stomach"</span>
                </button>
                <button
                  onClick={() => handlePatientResponse('dizzy')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/50 text-amber-200 text-xs font-medium transition-all text-left"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>"Dizzy &amp; cannot reach meds"</span>
                </button>
                <button
                  onClick={() => handlePatientResponse('fall')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/50 text-rose-200 text-xs font-medium transition-all text-left"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>"I fell down, need help"</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handlePatientResponse('ok')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 text-emerald-200 text-xs font-medium transition-all text-left"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>"I am fine, false alarm"</span>
                </button>
                <button
                  onClick={() => handlePatientResponse('dizzy')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/50 text-amber-200 text-xs font-medium transition-all text-left"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>"Feeling dizzy &amp; weak"</span>
                </button>
                <button
                  onClick={() => handlePatientResponse('fall')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/50 text-rose-200 text-xs font-medium transition-all text-left"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>"I fell down, need help"</span>
                </button>
                <button
                  onClick={() => handlePatientResponse('chest_pain')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-600/60 text-red-200 text-xs font-medium transition-all text-left"
                >
                  <Activity className="w-4 h-4 text-red-400 shrink-0" />
                  <span>"Chest tightness / pain"</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Transcription Stream */}
        <div className="p-4 max-h-52 overflow-y-auto space-y-2.5 font-sans text-xs bg-slate-950/40">
          {transcript.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Connecting KINOTE AI Emergency voice link...</p>
          ) : (
            transcript.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  item.speaker === 'system'
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 font-mono text-[11px]'
                    : item.speaker === 'ai'
                    ? 'bg-cyan-950/30 border-cyan-800/40 text-cyan-100'
                    : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider">
                    {item.speaker === 'system' ? 'System Telemetry' : item.speaker === 'ai' ? 'KINOTE AI Agent' : `${patientName} (Senior)`}
                  </span>
                  <span>{item.time}</span>
                </div>
                <p className="leading-relaxed">{item.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Action Controls & Dispatch */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Escalation Status:</span>
            {patientStatus === 'ok' ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Patient Verified Safe
              </span>
            ) : patientStatus === 'distressed' ? (
              <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Caregiver Escalation Active
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Stage 1 Checking Senior</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={escalateToConference}
              disabled={callStatus === 'dispatched'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-950 disabled:text-red-400/60 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Ambulance className="w-4 h-4" />
              <span>{callStatus === 'dispatched' ? 'EMS Dispatched' : `Bridge 3-Way EMS (${patientLocation.nearestPSAP.slice(0, 16)}...)`}</span>
            </button>

            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <PhoneOff className="w-4 h-4 text-rose-400" />
              <span>End Call &amp; Save Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

