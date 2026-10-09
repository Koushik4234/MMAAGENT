const LABELS = { active: 'Live', completed: 'Completed', error: 'Error' };

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>;
}
