/** Optional custom system prompt. Leave empty to use the selected persona's prompt. */
export default function PromptEditor({ value, onChange, disabled }) {
  return (
    <label className="field">
      <span>Custom system prompt (optional)</span>
      <textarea
        rows={3}
        maxLength={2000}
        value={value}
        disabled={disabled}
        placeholder="e.g. You are a pizza-ordering assistant for Luigi's. Be brief and cheerful."
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
