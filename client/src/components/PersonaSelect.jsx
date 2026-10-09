export default function PersonaSelect({ personas, value, onChange, disabled }) {
  const current = personas.find((p) => p.id === value);
  return (
    <label className="field">
      <span>Persona</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {current && <small>{current.description}</small>}
    </label>
  );
}
