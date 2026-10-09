import { useEffect, useRef, useState } from 'react';

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

/**
 * Chat bubbles.
 * Pass `onEdit(id, text, resend)` to let the user edit their own messages (leave it out for read-only views
 * such as the dashboard). `canResend` enables "Save & send", which only works while a call is live.
 */
export default function TranscriptView({ entries, onEdit, canResend = false, emptyText = 'Your conversation will appear here.' }) {
  const endRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!editingId) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries, editingId]);

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setDraft(entry.text);
  };
  const cancel = () => setEditingId(null);
  const commit = (resend) => {
    if (onEdit(editingId, draft, resend) !== false) setEditingId(null);
  };

  if (!entries.length) return <div className="transcript empty">{emptyText}</div>;

  return (
    <div className="transcript">
      {entries.map((e) => {
        const editable = Boolean(onEdit) && e.role === 'user';
        const isEditing = editingId === e.id;

        return (
          <div key={e.id ?? `${e.ts}-${e.role}-${e.text}`} className={`bubble bubble-${e.role} ${isEditing ? 'editing' : ''}`}>
            <span className="bubble-role">
              {e.role === 'user' ? 'You' : 'AI'}
              {e.edited && <em className="edited-tag">edited</em>}
            </span>

            {isEditing ? (
              <div className="edit-box">
                <textarea
                  autoFocus
                  rows={2}
                  maxLength={1000}
                  value={draft}
                  onChange={(ev) => setDraft(ev.target.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' && !ev.shiftKey) {
                      ev.preventDefault();
                      commit(false);
                    } else if (ev.key === 'Escape') {
                      cancel();
                    }
                  }}
                />
                <div className="edit-actions">
                  <button type="button" className="edit-cancel" onClick={cancel}>
                    Cancel
                  </button>
                  <button type="button" className="edit-save" onClick={() => commit(false)}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="edit-send"
                    disabled={!canResend}
                    title={canResend ? 'Save and tell the AI' : 'Available while a call is live'}
                    onClick={() => commit(true)}
                  >
                    Save &amp; send
                  </button>
                </div>
              </div>
            ) : (
              e.text
            )}

            {editable && !isEditing && (
              <button
                type="button"
                className="edit-btn"
                aria-label="Edit message"
                title={e.final === false ? 'Still listening…' : 'Edit message'}
                disabled={e.final === false}
                onClick={() => startEdit(e)}
              >
                <PencilIcon />
              </button>
            )}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}