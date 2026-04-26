import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Smile, Users, Crown, MessageSquare, Trash2, X, Check, Paperclip, Image
} from 'lucide-react';
import {
  getCommunityMessages,
  postCommunityMessage,
  getEventAttendees,
  deleteMessage
} from '../utils/api';
import ReactionPicker from './ReactionPicker';
import toast from 'react-hot-toast';
import './EventChat.css';

const EventChat = ({ eventId, eventTitle, currentUser, userRole = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const autoScrollRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await getCommunityMessages(eventId, 1, 100);
      setMessages(data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      let errorMsg = 'Failed to load messages';
      if (error.response) {
        errorMsg = error.response.data?.message || error.response.statusText || errorMsg;
      } else if (error.request) {
        errorMsg = 'No response from server';
      } else {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    }
  }, [eventId]);

  const fetchAttendees = useCallback(async () => {
    try {
      const data = await getEventAttendees(eventId);
      const attendeeList = data.attendees || data.users || [];
      setAttendees(attendeeList);
      const online = {};
      attendeeList.forEach(att => { online[att._id] = Math.random() > 0.5; });
      setOnlineUsers(online);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setAttendees([]);
    }
  }, [eventId]);

  useEffect(() => { fetchMessages(); fetchAttendees(); }, [fetchMessages, fetchAttendees]);

  useEffect(() => {
    if (!eventId) return;
    const interval = setInterval(() => { fetchMessages(); fetchAttendees(); }, 3000);
    return () => clearInterval(interval);
  }, [eventId, fetchMessages, fetchAttendees]);

  useEffect(() => { autoScrollRef.current = true; }, [eventId]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom <= 150;
    if (nearBottom) { autoScrollRef.current = true; setActiveMenu(null); }
    else { autoScrollRef.current = false; }
  }, []);

  useEffect(() => {
    const prevLength = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    if (autoScrollRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleActionMenu = useCallback((messageId) => {
    setActiveMenu(activeMenu === messageId ? null : messageId);
  }, [activeMenu]);

  const handleReply = (message) => { /* TODO */ setActiveMenu(null); };
  const handleReaction = async (messageId, emoji) => { setActiveMenu(null); setShowReactionPicker(null); };

  const handleDelete = async (messageId) => {
    try { await deleteMessage(messageId); await fetchMessages(); toast.success('Message deleted'); }
    catch (error) { toast.error('Failed to delete message'); }
    setActiveMenu(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true); autoScrollRef.current = true;
    try {
      await postCommunityMessage(eventId, newMessage.trim());
      setNewMessage('');
      await fetchMessages();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMsg = 'Failed to send message';
      if (error.response) {
        errorMsg = error.response.data?.message || error.response.statusText || errorMsg;
      } else if (error.request) {
        errorMsg = 'No response from server';
      } else {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    } finally { setSending(false); }
  };

  const handleTyping = () => { /* TODO */ };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const isCurrentUserMessage = (msg) => msg.sender && msg.sender._id === currentUser?.id;

  if (!eventId) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-center p-8'>
        <MessageSquare className='w-12 h-12 text-[#484f58] mb-3' />
        <h3 className='text-lg font-serif text-white mb-2'>Event Community Chat</h3>
        <p className='text-sm text-[#8b949e]'>Select an event from your bookings to join its community chat.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Chat Header */}
      <div className='p-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center'>
            <span className='text-[#58a6ff] font-semibold text-sm'>{eventTitle?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className='font-semibold text-[#e6edf3] text-sm'>Community Chat</h2>
            <p className='text-xs text-[#8b949e]'>{attendees.length} participants • {messages.length} messages</p>
          </div>
          {userRole === 'host' && (
            <span className='px-1.5 py-0.5 bg-[#2d2206] text-[#EF9F27] border border-[#854F0B] rounded text-[10px] font-bold uppercase flex items-center gap-1'>
              <Crown className='w-3 h-3 fill-current' />
              Host
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className='p-1.5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg'
          >
            <Users className='w-4 h-4' />
          </button>
          {typingUsers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className='flex items-center gap-1.5 px-2 py-1 bg-[#21262d] rounded-lg text-xs text-[#8b949e]'
            >
              <span className='w-2 h-2 bg-amber-400 rounded-full animate-pulse' />
              {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </motion.div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className='flex-1 min-h-0 overflow-y-auto p-4 space-y-3'>
        {loading ? (
          <div className='flex items-center justify-center h-full text-[#8b949e]'>
            <span className='w-4 h-4 border-2 border-[#30363d] border-t-amber-500 rounded-full animate-spin mr-2' />
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-[#8b949e]'>
            <MessageSquare className='w-12 h-12 mb-2' />
            <p className='text-sm'>No messages yet</p>
            <p className='text-xs text-[#484f58]'>Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, index) => {
              const sender = msg.sender;
              const isOwn = isCurrentUserMessage(msg);
              const showAvatar = index === 0 || messages[index-1]?.sender?._id !== sender?._id;
              const showDate = index === 0 || new Date(messages[index-1]?.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
              return (
                <React.Fragment key={msg._id}>
                  {showDate && (
                    <div className='flex justify-center my-2'>
                      <span className='px-2 py-1 bg-[#21262d] text-[#8b949e] text-xs rounded-full'>
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && showAvatar && sender && (
                          <div className='w-8 h-8 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center flex-shrink-0'>
                            <span className='text-[#58a6ff] font-medium text-sm'>{sender.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                        )}
                        <div className={`relative px-4 py-2.5 shadow-sm group-hover:shadow-md transition-all ${isOwn ? 'bg-[#1f4068] text-[#cde3ff] rounded-xl rounded-br-sm' : 'bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-xl rounded-bl-sm'}`}
                          onContextMenu={(e) => { e.preventDefault(); toggleActionMenu(msg._id); }}
                          onDoubleClick={() => toggleActionMenu(msg._id)}
                        >
                          {msg.replyTo && (
                            <div className='mb-2 px-2 py-1 bg-[#0d1117] border-l-2 border-[#30363d] rounded text-xs text-[#8b949e]'>
                              Replying to {msg.replyTo.sender?.name}
                            </div>
                          )}
                          {!isOwn && sender && (
                            <div className='flex items-center gap-2 mb-1.5'>
                              <span className='text-xs font-semibold text-[#c9d1d9]'>{sender.name}</span>
                              {sender.role === 'host' && (
                                <span className='px-1.5 py-0.5 bg-[#2d2206] text-[#EF9F27] border border-[#854F0B] rounded text-[10px] font-bold uppercase flex items-center gap-1'>
                                  <Crown className='w-3 h-3 fill-current' />
                                  Host
                                </span>
                              )}
                            </div>
                          )}
                          <p className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{msg.content}</p>

                          {/* Actions Menu */}
                          {activeMenu === msg._id && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                              className='absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-full px-2 py-1.5 shadow-xl z-20'
                            >
                              <button onClick={() => handleReply(msg)} className='p-1.5 hover:bg-[#21262d] rounded-full' title='Reply'>
                                <MessageSquare className='w-4 h-4 text-[#8b949e]' />
                              </button>
                              <button onClick={() => setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id)} className='p-1.5 hover:bg-[#21262d] rounded-full' title='React'>
                                <Smile className='w-4 h-4 text-[#8b949e]' />
                              </button>
                              {isOwn && (
                                <button onClick={() => handleDelete(msg._id)} className='p-1.5 hover:bg-red-500/20 rounded-full' title='Delete'>
                                  <Trash2 className='w-4 h-4 text-red-400' />
                                </button>
                              )}
                              <button onClick={() => setActiveMenu(null)} className='p-1 hover:bg-[#21262d] rounded-full' title='Close'>
                                <X className='w-3 h-3 text-[#484f58]' />
                              </button>
                              {showReactionPicker === msg._id && (
                                <div className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2'>
                                  <ReactionPicker onSelect={(emoji) => handleReaction(msg._id, emoji)} onClose={() => setShowReactionPicker(null)} />
                                </div>
                              )}
                            </motion.div>
                          )}

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className='flex items-center gap-1 mt-2'>
                              {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {}))
                                .map(([emoji, count]) => (
                                  <span key={emoji} className='px-2 py-0.5 bg-[#0d1117] border border-[#30363d] rounded-full text-xs flex items-center gap-1'>
                                    {emoji} {count}
                                  </span>
                                ))
                              }
                            </div>
                          )}

                          {/* Timestamp & Check */}
                          <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${isOwn ? 'text-[#cde3ff]/60' : 'text-[#484f58]'}`}>
                            <span className='text-xs font-medium'>{formatTime(msg.createdAt)}</span>
                            {isOwn && <><Check className='w-4 h-4 text-[#3fb950]' />{msg.isEdited && <span className='text-xs'>(edited)</span>}</>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <div className='p-4 border-t border-[#30363d] bg-[#161b22]'>
        <form onSubmit={handleSendMessage} className='flex items-end gap-3'>
          <div className='flex gap-1'>
            <button type='button' className='p-2 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg' title='Attach file'>
              <Paperclip className='w-5 h-5' />
            </button>
            <button type='button' className='p-2 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg' title='Add image'>
              <Image className='w-5 h-5' />
            </button>
          </div>
          <div className='flex-1 relative'>
            <textarea
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              placeholder='Type your message...'
              rows={1}
              className='w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-[#e6edf3] placeholder-[#484f58] outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent transition-all resize-none'
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            type='submit'
            disabled={!newMessage.trim() || sending}
            className='px-5 py-2.5 bg-[#1f6feb] text-white rounded-xl font-medium text-sm hover:bg-[#388bfd] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2'
          >
            <Send className='w-4 h-4' />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventChat;
