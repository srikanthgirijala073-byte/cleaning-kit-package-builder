function SettingsCard({ icon, title, description, action, actionLabel }) {
  return (
    <div className="settings-card card glass">
      <div className="settings-info">
        <div className="settings-icon">{icon}</div>
        <div>
          <h4>{title}</h4>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action && (
        <button className="settings-action" onClick={action}>
          {actionLabel || 'Configure'}
        </button>
      )}
    </div>
  );
}

export default SettingsCard;
