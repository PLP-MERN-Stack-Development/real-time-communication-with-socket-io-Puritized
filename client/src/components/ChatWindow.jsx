import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, username, onSend, onTyping, typingUsers }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 900);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    onTyping(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((m) => (
          <MessageBubble key={m.id || m.timestamp} message={m} selfUsername={username} />
        ))}
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 text-sm text-gray-600 italic">
          {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      <div className="flex p-3 border-t bg-white">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          className="flex-1 border border-gray-300 px-3 py-2 rounded mr-2"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}