import { useEffect, useState } from 'react';
import { api } from '../api/endpoints.js';
import { useVoiceAgent } from '../hooks/useVoiceAgent.js';
import { formatClock } from '../utils/format.js';
import PersonaSelect from './PersonaSelect.jsx';
import PromptEditor from './PromptEditor.jsx';
import TranscriptView from './TranscriptView.jsx';
import VoiceOrb from './VoiceOrb.jsx';

/**
 * The complete voice experience. Used full-size on the home page and `compact` inside the embeddable widget.
 */
export default function VoiceAgentPanel({ compact = false, defaultPersona = 'assistant' }) {
  const agent = useVoiceAgent();
  const [personas, setPersonas] = useState([]);
  const [personaId, setPersonaId] = useState(defaultPersona);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    api.personas().then(setPersonas).catch(() => {});
  }, []);

  const inCall = agent.status === 'connecting' || agent.status === 'live';

  return (
    <div className={`panel voice-panel ${compact ? 'compact' : ''}`}>
      {agent.mock && agent.status === 'live' && (
        <div className="notice">Mock mode: replies are canned. Add a Gemini API key for the real AI.</div>
      )}

      <VoiceOrb status={agent.status} level={agent.level} aiSpeaking={agent.aiSpeaking} />

      <div className="call-controls">
        {inCall ? (
          <button className="btn btn-danger" onClick={agent.stop}>
            End call {agent.status === 'live' && `· ${formatClock(agent.elapsed)}`}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => agent.start({ personaId, systemPrompt: customPrompt })}
          >
            {agent.status === 'ended' ? 'Start new call' : 'Start talking'}
          </button>
        )}
      </div>

      {agent.error && <div className="error">{agent.error}</div>}

      {!compact && personas.length > 0 && (
        <div className="config">
          <PersonaSelect personas={personas} value={personaId} onChange={setPersonaId} disabled={inCall} />
          <PromptEditor value={customPrompt} onChange={setCustomPrompt} disabled={inCall} />
        </div>
      )}

      <TranscriptView entries={agent.transcript} onEdit={agent.editEntry} canResend={agent.status === 'live'} />
    </div>
  );
}