import { useSearchParams } from 'react-router-dom';
import VoiceAgentPanel from '../components/VoiceAgentPanel.jsx';

/** Chrome-less page shown inside the iframe created by /widget.js. */
export default function EmbedPage() {
  const [params] = useSearchParams();
  return (
    <div className="embed">
      <VoiceAgentPanel compact defaultPersona={params.get('persona') || 'assistant'} />
    </div>
  );
}
