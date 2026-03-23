import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { db, auth, onSnapshot, collection, query, where, updateDoc, doc } from '../firebase';

interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'follow';
  senderId: string;
  senderName: string;
  postId?: string;
  read: boolean;
  createdAt: any;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const markAsRead = async () => {
    for (const n of notifications.filter(n => !n.read)) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
  };

  return (
    <div className="relative">
      <button onClick={markAsRead} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
        <Bell size={20} className="text-slate-900 dark:text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
