import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { useSports } from './SportsContext';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  gameId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (text: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { chatNotificationsEnabled } = useSports();
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.protocol === 'file:') return;

    const socket = io();
    socketRef.current = socket;

    socket.emit('join_game', 'global');

    socket.on('previous_messages', (msgs: Message[]) => {
      setMessages(msgs);
    });

    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      
      if (chatNotificationsEnabled && user && msg.userId !== user.id) {
        toast(`New message from ${msg.username}`, {
          description: msg.text,
          action: {
            label: 'View',
            onClick: () => navigate('/chat'),
          },
        });
      }
    });

    return () => {
      socket.emit('leave_game', 'global');
      socket.disconnect();
    };
  }, [chatNotificationsEnabled, user, navigate]);

  const sendMessage = (text: string) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('send_message', {
      gameId: 'global',
      userId: user.id,
      username: user.username,
      text: text.trim()
    });
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
