/** Animated orb: scales with your mic level, ripples while listening, turns teal while the AI talks. */
export default function VoiceOrb({ status, level, aiSpeaking }) {
  const live = status === 'live';
  const scale = live ? 1 + Math.min(level * 1.2, 0.35) : 1;
  const state = status === 'connecting' ? 'connecting' : aiSpeaking ? 'ai' : live ? 'listening' : 'idle';

  return (
    <div className="orb-wrap">
      <div className={`orb-stage ${state}`}>
        <span className="ring" />
        <span className="ring" />
        <div className={`orb orb-${state}`} style={{ transform: `scale(${scale})` }} />
      </div>
      <p className="orb-label">
        {state === 'idle' && 'Ready when you are'}
        {state === 'connecting' && 'Connecting…'}
        {state === 'listening' && 'Listening…'}
        {state === 'ai' && 'Speaking…'}
      </p>
    </div>
  );
}