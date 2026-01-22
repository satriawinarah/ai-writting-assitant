import { useNotifications } from '../contexts/NotificationContext';
import './NotificationContainer.css';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {notification.type === 'error' && '❌'}
            {notification.type === 'success' && '✅'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className="notification-content">
            <div className="notification-message">{notification.message}</div>
            {notification.details && (
              <div className="notification-details">{notification.details}</div>
            )}
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
