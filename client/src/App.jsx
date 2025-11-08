import React, { useState, useEffect } from 'react';
import { useSocket } from './socket';
import axios from 'axios';

export default function App() {
  const {
    isConnected,
    messages,
    users,
    typingUsers,
    connect,
    sendMessage,
    setTyping,
  } = useSocket();

  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [joined, setJoined] = useState(false);
  const [loadedMessages, setLoadedMessages] = useState(false);

  // Fetch existing messages after joining
  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}/api/messages`
      );

      // Inject fetched messages into the socket state
      res.data.forEach((msg) => {
        sendMessage(msg.message); // or modify socket.js to accept initial messages
      });

      setLoadedMessages(true);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Handle user joining the chat
  const handleJoin = () => {
    if (username.trim()) {
      connect(username);
      setJoined(true);
      fetchMessages(); // load previous messages
    }
  };

  // Handle sending message
  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  // Typing indicator
  useEffect(() => {
    if (!joined) return;
    setTyping(message.length > 0);
  }, [message]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 text-center shadow-md">
        <h1 className="text-2xl font-bold">💬 Realtime Chat App</h1>
        <p className="text-sm opacity-80">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </p>
      </header>

      {/* If user has not joined yet */}
      {!joined ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="bg-white shadow-lg p-8 rounded-xl w-96 text-center">
            <h2 className="text-lg font-semibold mb-3">Enter your username</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full mb-4"
              placeholder="e.g. JohnDoe"
            />
            <button
              onClick={handleJoin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md w-full"
            >
              Join Chat
            </button>
          </div>
        </div>
      ) : (
        // Chat interface
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (Users) */}
          <aside className="w-64 bg-white shadow-lg border-r p-4 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-2">👥 Online Users</h3>
            <ul className="space-y-1">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="bg-gray-100 px-3 py-2 rounded-md text-sm"
                >
                  {user.username}
                </li>
              ))}
            </ul>
          </aside>

          {/* Chat section */}
          <main className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm ${
                    msg.sender === username
                      ? 'bg-blue-500 text-white ml-auto'
                      : msg.system
                      ? 'bg-gray-200 text-gray-600 mx-auto italic text-center'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {!msg.system && (
                    <div className="text-xs opacity-70 mb-1">{msg.sender}</div>
                  )}
                  <div>{msg.message}</div>
                  <div className="text-[10px] mt-1 opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 text-sm text-gray-600 italic">
                {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
              </div>
            )}

            {/* Message input */}
            <form
              onSubmit={handleSend}
              className="flex items-center p-3 border-t bg-white"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 mr-3"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Send
              </button>
            </form>
          </main>
        </div>
      )}
    </div>
  );
}