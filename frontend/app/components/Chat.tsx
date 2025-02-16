'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const Chat = ({ username }: { username: string }) => {
  const [messages, setMessages] = useState<{ id: number; content: string; sender: { username: string } }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    socket.emit('getMessages');

    socket.on('getMessages', (data) => setMessages(data));
    socket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('getMessages');
      socket.off('newMessage');
    };
  }, [username]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('sendMessage', { username, content: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div className="w-[60rem] mx-auto bg-gray-100 p-4 rounded shadow-md">
      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto border-b border-gray-300 mb-2 text-black p-2 flex flex-col gap-2 scrollbar-hide">
        {messages.length === 0 ? (
          <p className="text-gray-900 text-center">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.sender.username === username;

            return (
              <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`p-2 max-w-[75%] rounded-lg text-sm ${
                    isMyMessage ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-300 text-black rounded-bl-none'
                  }`}
                >
                  <p className="text-xs font-semibold">{msg.sender.username}</p>
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Field */}
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1 text-black w-full"
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
