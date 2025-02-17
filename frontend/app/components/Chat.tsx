'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import io from 'socket.io-client';
import Image from 'next/image';

const socket = io('http://localhost:3001');

const Chat = ({ username }: { username: string }) => {
  const [messages, setMessages] = useState<{ id: number; content: string; sender: { username: string }; imageUrl?: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
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

  const sendMessage = async () => {
    if (newMessage.trim()) {
      socket.emit('sendMessage', { username, content: newMessage });
      setNewMessage('');
    } else if (selectedImage) {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('username', username);

      try {
        const response = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          socket.emit('sendMessage', { username, imageUrl: data.imageUrl });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }

      setSelectedImage(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('username', username);

      try {
        const response = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          socket.emit('sendMessage', { username, imageUrl: data.imageUrl });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleImageClick = (id: number) => {
    setSelectedImageId((prevId) => (prevId === id ? null : id));
  };

  return (
    <div className="w-[90rem] mx-auto bg-gray-100 p-4 rounded shadow-md h-[75rem] flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto border-b border-gray-300 mb-2 text-black p-2 flex flex-col gap-2 scrollbar-hide">
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
                  {msg.imageUrl && isClient && (
                    <div
                      onClick={() => handleImageClick(msg.id)}
                      className={`cursor-pointer ${selectedImageId === msg.id ? 'scale-125' : 'scale-100'} transition-all duration-300`}
                    >
                      <Image
                        height={400}
                        width={500}
                        src={`${msg.imageUrl}`}
                        alt="Message Image"
                        className="max-w-full mt-2 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Field - Stays at the Bottom */}
      <div className="flex gap-2 p-4 bg-white shadow-md">
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
        <input type="file" className="hidden" id="fileInput" accept="image/*" onChange={handleImageUpload} />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          Send Image
        </button>
      </div>
    </div>
  );
};

export default Chat;
