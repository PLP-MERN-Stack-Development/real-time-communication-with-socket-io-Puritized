export default function MessageBubble({ message, selfUsername }) {
  const isSelf = message.sender === selfUsername;
  const classes = message.system
    ? 'bg-gray-200 text-gray-600 italic mx-auto px-3 py-1 rounded'
    : isSelf
    ? 'bg-blue-500 text-white ml-auto px-3 py-1 rounded'
    : 'bg-gray-100 text-gray-800 px-3 py-1 rounded';

  return (
    <div className={classes}>
      {!message.system && <div className="text-xs opacity-70">{message.sender}</div>}
      <div>{message.message}</div>
      <div className="text-[10px] mt-1 opacity-60">{new Date(message.timestamp).toLocaleTimeString()}</div>
    </div>
  );
}