import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  id: number;
  gameId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

interface ChatRoomProps {
  gameId: string;
}

export const ChatRoom = ({ gameId }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('chat_username') || `User${Math.floor(Math.random() * 10000)}`);
  const [userId] = useState(() => {
    let id = localStorage.getItem('chat_userid');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_userid', id);
    }
    return id;
  });
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('chat_username', username);
  }, [username]);

  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io();
    socketRef.current = socket;

    socket.emit('join_game', gameId);

    socket.on('previous_messages', (msgs: Message[]) => {
      setMessages(msgs);
      scrollToBottom();
    });

    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      socket.emit('leave_game', gameId);
      socket.disconnect();
    };
  }, [gameId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      gameId,
      userId,
      username,
      text: inputText.trim()
    });

    setInputText('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[600px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          Live Game Chat
        </h3>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-emerald-500 outline-none px-1 w-24 text-slate-700 dark:text-slate-300"
            placeholder="Username"
            maxLength={20}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === userId;
            return (
              <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                <span className="text-xs text-slate-500 mb-1 px-1">{msg.username}</span>
                <div className={cn(
                  "px-4 py-2 rounded-2xl",
                  isMe 
                    ? "bg-emerald-500 text-white rounded-tr-sm" 
                    : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-600 rounded-tl-sm shadow-sm"
                )}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors shrink-0"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
