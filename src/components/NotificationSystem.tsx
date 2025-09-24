'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss after this many ms, 0 = never
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss if duration is specified
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
}

function NotificationDisplay() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-[10001] space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onClose: () => void;
  style?: React.CSSProperties;
}

function NotificationCard({ notification, onClose, style }: NotificationCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-info" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-success/50';
      case 'error':
        return 'border-destructive/50';
      case 'warning':
        return 'border-warning/50';
      case 'info':
        return 'border-info/50';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-success/10';
      case 'error':
        return 'bg-destructive/10';
      case 'warning':
        return 'bg-warning/10';
      case 'info':
        return 'bg-info/10';
    }
  };

  return (
    <div
      className={`
        bg-card border ${getBorderColor()} rounded-xl p-4 shadow-xl glass
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}
      style={style}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${getBgColor()} rounded-lg flex items-center justify-center flex-shrink-0`}>
          {getIcon()}
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="font-semibold text-foreground text-sm">{notification.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>

          {notification.action && (
            <div className="pt-2">
              <Button
                onClick={notification.action.onClick}
                variant="neon"
                className="h-7 text-xs px-3"
              >
                <span className="relative z-10">{notification.action.label}</span>
              </Button>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted/50 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Helper functions for common notification types
export const notificationHelpers = {
  success: (title: string, message: string, duration = 5000) => ({
    type: 'success' as const,
    title,
    message,
    duration
  }),

  error: (title: string, message: string, duration = 0) => ({
    type: 'error' as const,
    title,
    message,
    duration
  }),

  warning: (title: string, message: string, duration = 7000) => ({
    type: 'warning' as const,
    title,
    message,
    duration
  }),

  info: (title: string, message: string, duration = 5000) => ({
    type: 'info' as const,
    title,
    message,
    duration
  })
};