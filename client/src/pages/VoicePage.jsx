import VoiceAgentPanel from '../components/VoiceAgentPanel.jsx';

export default function VoicePage() {
  return (
    <div className="narrow">
      <h1>Talk to the AI</h1>
      <p className="muted">Press the button, allow your microphone, and just start speaking. You can interrupt anytime.</p>
      <VoiceAgentPanel />
    </div>
  );
}
