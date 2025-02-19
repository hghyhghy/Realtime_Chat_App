'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import io from 'socket.io-client';
import Image from 'next/image';
import { TiAttachmentOutline } from "react-icons/ti";
import { BsSendFill } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { FiPlusCircle } from "react-icons/fi";
import { CiEdit } from "react-icons/ci";

const socket = io('http://localhost:3001');

const Chat = ({ username }: { username: string }) => {
  const [messages, setMessages] = useState<
    { id: number; content: string; sender: { username: string }; fileUrl?: string; fileName?: string; fileType?: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMessageById, setSelectedMessageById] = useState<number|null>(null)
  const [messageOptions, setMessageOptions] = useState<number|null>(null)

  const toggleOptions = (messageId:number) => {

    setMessageOptions(messageOptions === messageId? null : messageId)
  }

  useEffect(() => {
    setIsClient(true);
    socket.emit('getMessages');

    socket.on('getMessages', (data) => setMessages(data));
    socket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('updateMessage',(updatedMessage) => {
       
      setMessages((prev)=>  prev.map((msg) => msg.id === updatedMessage.id ? {...msg,content : updatedMessage.content} : msg))
      
    })

    socket.on('deleteMessage',(messageId) => {

      setMessages((prev) => prev.filter((msg) =>  msg.id != messageId))
    })

    return () => {
      socket.off('getMessages');
      socket.off('newMessage');
      socket.off('updateMessage')
      socket.off('deleteMessage')
    };
  }, [username]);


  const printpdf = (fileName:string) => {
    
    const url = `http://localhost:3001/uploads/${fileName}`
    const newwindow  =  window.open(url,'_blank')
    if(newwindow){
      newwindow.onload = () => {

        newwindow.print()
      }
    }


  }

  const sendMessage = async () => {
    if (newMessage.trim()) {
      if (isEditing && selectedMessageById !== null) {
        // Emit editMessage event to update the existing message
        socket.emit('editMessage', { id: selectedMessageById, content: newMessage });
  
        // Update the message locally after edit
        setMessages(prevMessages => prevMessages.map(msg =>
          msg.id === selectedMessageById ? { ...msg, content: newMessage } : msg
        ));
        
      } else {
        // Emit sendMessage event to send a new message
        socket.emit('sendMessage', { username, content: newMessage });
      }
      setNewMessage('');  // Clear the input field
      setIsEditing(false); // Reset editing state
      setSelectedMessageById(null); // Reset selected message ID
    } else if (selectedFile) {
      await uploadFile(selectedFile);
      setSelectedFile(null);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        socket.emit('sendMessage', {
          username,
          fileUrl: data.fileUrl, // Use the timestamped filename returned by the server
          fileName: data.fileName,
          fileType: data.fileType,
        });
      } else {
        console.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      uploadFile(e.target.files[0]);
    }
  };

  const handleImageClick = (id: number) => {
    if (selectedImageId === id) {
      setIsImageExpanded(!isImageExpanded);
    } else {
      setSelectedImageId(id);
      setIsImageExpanded(true);
    }
  };

  const handleEdit = (id:number,content:string) => {

    setIsEditing(true)
    setSelectedMessageById(id)
    setNewMessage(content)

  }

  const deleteMessage= (messageId:number) => {

    socket.emit('deleteMessage',{id:messageId})
  }

  const renderFilePreview = (fileType: string, fileName: string) => {

    const url = `http://localhost:3001/uploads/${fileName}`

    if (fileType.startsWith('image/')) {
      return (
        <div>

        <Image
          src={`http://localhost:3001/uploads/${fileName}`}
          alt="Image Preview"
          height={300} // Limit the height
          width={300}  // Limit the width
          className=" max-w-full rounded"
        />

        <a href={url} download={fileName} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded block text-center">
          Donwload
        </a>

        </div>

      );
    }
  
    if (fileType === 'application/pdf') {
      return (

        <div>

        <iframe
          src={`http://localhost:3001/uploads/${fileName}#toolbar=0`}
          width="276"
          height="128"
          title="PDF Preview"
          className="overflow-hidden"
        ></iframe>

        <button  
        className="mt-2 bg-blue-500 text-white  px-8  py-3 rounded block"
        onClick={() =>printpdf(fileName)}>
          Print
        </button>

      </div>


        
      );


    }

    
  
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <div className="flex justify-center items-center bg-gray-200 w-24 h-24 rounded">
          <span className="text-center">DOCX</span>
        </div>
      );
    }
  
    if (fileType === 'application/vnd.ms-powerpoint') {
      return (
        <div className="flex justify-center items-center bg-gray-200 w-24 h-24 rounded">
          <span className="text-center">PPT</span>
        </div>
      );
    }
  
  };

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const renderMessageContent  = (content:string | null | undefined) => {
    if (!content) return null;
    return content.split(urlRegex).map((part,index) => {

      if (part.match(urlRegex)){

        return (

          <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {part}
        </a>
        )
      }

      else{

        return(

          <span key={index}>{part}</span>
        )
      }
    })
  }
  
  return (
    <div className="w-[90rem] mx-auto bg-black p-4 rounded shadow-md h-[75rem] flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto border-b border-gray-300 mb-2 text-black p-2 flex flex-col gap-2 scrollbar-hide">
        {messages.length === 0 ? (
          <p className="text-gray-900 text-center">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.sender.username === username;
            const isImage = msg.fileType?.startsWith('image/');
          
            return (
              <div key={msg.id} className={`flex items-center ${isMyMessage ? 'justify-end' : 'justify-start'} gap-2`}>
                {/* Message Bubble */}
                <div
                  className={`p-2 max-w-[75%] rounded-lg text-sm ${
                    isMyMessage ? 'bg-white text-black rounded-br-none' : 'bg-gray-300 text-black rounded-bl-none'
                  }`}
                >
                  <p className="text-xs font-semibold">{msg.sender.username === username ? "You" : msg.sender.username}</p>
                  <p>{renderMessageContent(msg.content)}</p>
          
                  {/* File Preview (If any) */}
                  {msg.fileUrl && isClient && (
                    <div className="mt-2">
                      {renderFilePreview(msg.fileType || '', msg.fileName || '')}
                      {!msg.fileType?.startsWith('image/') && (
                        <a
                          href={`http://localhost:3001/uploads/${msg.fileName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black uppercase font-semibold font-sans block mt-2 h-10 w-60"
                        >
                          {msg.fileName || 'Download File'}
                        </a>
                      )}
                    </div>
                  )}
                </div>
          
                {/* + Button with Dropdown */}
                {isMyMessage && (
                  <div className="relative">
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => toggleOptions(msg.id)}
                    >
                      <FiPlusCircle size={18} />
                    </button>
          
                    {messageOptions === msg.id && (
                      <div className="absolute top-6 right-0 bg-white shadow-md rounded-lg p-2 flex flex-col gap-2 w-24">
                        {!msg.fileUrl && !msg.content?.match(urlRegex) && (
                          <button
                            className=" text-xs  flex items-center gap-1 text-black font-bold"
                            onClick={() => handleEdit(msg.id, msg.content)}
                          >
                            <CiEdit/> Edit
                          </button>
                        )}
                        <button
                          className="text-black font-bold text-xs flex items-center gap-1 "
                          onClick={() => deleteMessage(msg.id)}
                        >
                          <MdDelete /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }))}
          

          </div>

      {/* Input Field - Stays at the Bottom */}
      <div className="flex gap-2 p-4 bg-black shadow-md">
        <input
          className="border p-2 flex-1 text-black w-full"
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={sendMessage}>
        <BsSendFill />
        </button>

        <input
          type="file"
          className="hidden"
          id="fileInput"
          accept="image/*,application/pdf,.doc,.docx,.ppt"
          onChange={handleFileSelect}
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <TiAttachmentOutline />
        </button>
      </div>
    </div>
  );
};

export default Chat;
