import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Smile, Users, Crown, MessageSquare, Trash2, X, Check, Paperclip, Image, Reply
} from 'lucide-react';
import {
  getCommunityMessages,
  postCommunityMessage,
  getEventAttendees,
  deleteMessage,
  editMessage,
  addReaction,
  getMessageReactions
} from '../utils/api';
import ReactionPicker from './ReactionPicker';
import toast from 'react-hot-toast';
import './EventChat.css';

const EventChat = ({ eventId, eventTitle, currentUser, userRole = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
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

  const fetchMessages = useCallback(async (silent = false) => {
    if (!eventId) return;
    try {
      const data = await getCommunityMessages(eventId, 1, 100);
      setMessages(data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      // Only show toast error if not a silent refresh
      if (!silent) {
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

  useEffect(() => { 
    fetchMessages(); 
    fetchAttendees(); 
  }, [fetchMessages, fetchAttendees]);

  useEffect(() => {
    if (!eventId) return;
    const interval = setInterval(() => { fetchMessages(true); fetchAttendees(); }, 3000);
    return () => clearInterval(interval);
  }, [eventId, fetchMessages, fetchAttendees]);

  useEffect(() => {
    autoScrollRef.current = true;
  }, [eventId]);

  // Clear reply when event changes
  useEffect(() => {
    setReplyTo(null);
    setEditingId(null);
    setEditContent('');
  }, [eventId]);

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

  const handleReply = (message) => {
    setReplyTo(message);
    setActiveMenu(null);
    // Focus on input
    document.querySelector('textarea')?.focus();
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
      // Update local messages with new reaction
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const userString = String(currentUser?.id);
          const existingReaction = msg.reactions?.find(r => String(r.user) === userString && r.emoji === emoji);
          if (existingReaction) {
            // Remove reaction
            return {
              ...msg,
              reactions: msg.reactions.filter(r => !(String(r.user) === userString && r.emoji === emoji))
            };
          } else {
            // Add reaction
            return {
              ...msg,
              reactions: [...(msg.reactions || []), {
                emoji,
                user: userString,
                createdAt: new Date()
              }]
            };
          }
        }
        return msg;
      }));
      toast.success('Reaction updated');
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    } finally {
      setShowReactionPicker(null);
    }
  };

  const handleEdit = async (messageId) => {
    if (!editContent.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    try {
      const res = await editMessage(messageId, editContent.trim());
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, content: editContent.trim(), isEdited: true, editedAt: new Date() } : msg
      ));
      toast.success('Message edited');
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
    setActiveMenu(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await postCommunityMessage(eventId, newMessage.trim(), replyTo?._id || null);
      setNewMessage('');
      setReplyTo(null);
      // Try to refresh messages silently (no error toast)
      fetchMessages(true).catch(err => {
        console.error('Failed to refresh messages after send:', err);
      });
      toast.success('Message sent successfully');
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

  const isCurrentUserMessage = (msg) => msg.sender && String(msg.sender._id) === String(currentUser?.id);

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
       <div ref={messagesContainerRef} onScroll={handleScroll} className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3'>
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
               const showAvatar = index === 0 || String(messages[index-1]?.sender?._id) !== String(sender?._id);
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
                       <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                         {!isOwn && showAvatar && sender && (
                           <div className='w-8 h-8 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center flex-shrink-0'>
                             <span className='text-[#58a6ff] font-medium text-sm'>{sender.name?.charAt(0)?.toUpperCase()}</span>
                           </div>
                         )}
                         <div className={`flex-1 min-w-0 max-w-[70%]`}>
                           <div className={`relative px-4 py-2.5 shadow-sm group group-hover:shadow-md transition-all break-words ${isOwn ? 'bg-[#1f4068] text-[#cde3ff] rounded-xl rounded-br-sm' : 'bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-xl rounded-bl-sm'}`}
                             onContextMenu={(e) => { e.preventDefault(); toggleActionMenu(msg._id); }}
                             onDoubleClick={() => toggleActionMenu(msg._id)}
                             style={{ overflow: 'visible' }}
                           >
                          {msg.replyTo && (
                            <div className='mb-2 px-2 py-1 bg-[#0d1117] border-l-2 border-[#30363d] rounded text-xs text-[#8b949e]'>
                              Replying to {msg.replyTo.sender?.name}
                            </div>
                          )}
                            {!isOwn && sender && (
                              <div className='flex items-center gap-2 mb-1.5'>
                                {/* Show sender name only if NOT a host (hosts show only badge) */}
                                {sender.role !== 'host' && (
                                  <span className='text-xs font-semibold text-[#c9d1d9]'>{sender.name}</span>
                                )}
                                {sender.role === 'host' && (
                                  <span className='px-1.5 py-0.5 bg-[#2d2206] text-[#EF9F27] border border-[#854F0B] rounded text-[10px] font-bold uppercase flex items-center gap-1'>
                                    <Crown className='w-3 h-3 fill-current' />
                                    Host
                                  </span>
                                )}
                              </div>
                            )}
                          
                          {/* Edit mode / Display mode */}
                          {editingId === msg._id ? (
                            <div className='flex items-end gap-2'>
                              <input
                                type='text'
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(msg._id); if (e.key === 'Escape') setEditingId(null); }}
                                autoFocus
                                className='flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] outline-none focus:ring-2 focus:ring-[#58a6ff]'
                              />
                              <button onClick={() => handleEdit(msg._id)} className='p-2 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043]'>
                                <Check className='w-4 h-4' />
                              </button>
                              <button onClick={() => setEditingId(null)} className='p-2 bg-[#30363d] text-[#c9d1d9] rounded-lg hover:bg-[#484f58]'>
                                <X className='w-4 h-4' />
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{msg.content}</p>
                              
                              {/* Reply preview */}
                              {msg.replyTo && (
                                <div className='mt-2 pt-2 border-t border-[#30363d]/50'>
                                  <div className='text-xs text-[#8b949e] flex items-center gap-1'>
                                    <MessageSquare className='w-3 h-3' />
                                    Replying to {msg.replyTo.sender?.name || 'user'}
                                  </div>
                                  <div className='text-xs text-[#8b949e] truncate mt-0.5'>
                                    {msg.replyTo.content || 'Original message'}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* Actions Menu */}
                          {activeMenu === msg._id && (
                             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                               className='absolute top-full mt-2 right-0 flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-full px-2 py-1.5 shadow-xl z-50'
                             >
                              <button onClick={() => handleReply(msg)} className='p-1.5 hover:bg-[#21262d] rounded-full' title='Reply'>
                                <MessageSquare className='w-4 h-4 text-[#8b949e]' />
                              </button>
                              <button onClick={() => setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id)} className='p-1.5 hover:bg-[#21262d] rounded-full' title='React'>
                                <Smile className='w-4 h-4 text-[#8b949e]' />
                              </button>
                              {isOwn && (
                                <>
                                  <button onClick={() => { setEditingId(msg._id); setEditContent(msg.content); setActiveMenu(null); }} className='p-1.5 hover:bg-[#21262d] rounded-full' title='Edit'>
                                    <svg className='w-4 h-4 text-[#8b949e]' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' /></svg>
                                  </button>
                                  <button onClick={() => handleDelete(msg._id)} className='p-1.5 hover:bg-red-500/20 rounded-full' title='Delete'>
                                    <Trash2 className='w-4 h-4 text-red-400' />
                                  </button>
                                </>
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
                            <div className='flex items-center gap-1 mt-2 flex-wrap'>
                              {(() => {
                                // Group reactions by emoji
                                const counts = {};
                                msg.reactions.forEach(r => {
                                  counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                                });
                                return Object.entries(counts).map(([emoji, count]) => {
                                  const hasReacted = msg.reactions.some(
                                    r => r.emoji === emoji && r.user === currentUser?.id
                                  );
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(msg._id, emoji)}
                                      className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${hasReacted ? 'bg-[#1f4068] border border-[#58a6ff]' : 'bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]'}`}
                                      title={hasReacted ? 'Remove reaction' : 'Add reaction'}
                                    >
                                      {emoji} {count}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          )}

                          {/* Timestamp & Check */}
                          <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${isOwn ? 'text-[#cde3ff]/60' : 'text-[#484f58]'}`}>
                            <span className='text-xs font-medium'>{formatTime(msg.createdAt)}</span>
                            {isOwn && <><Check className='w-4 h-4 text-[#3fb950]' />{msg.isEdited && <span className='text-xs'>(edited)</span>}</>}
                          </div>

                          {/* Action Menu Trigger Button - appears on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(msg._id);
                            }}
                             className='absolute -top-2 -right-2 w-8 h-8 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30'
                            title='Message actions'
                          >
                            <svg className='w-4 h-4 text-[#8b949e]' fill='currentColor' viewBox='0 0 20 20'>
                              <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                            </svg>
                           </button>

                         </div> {/* Close bubble div */}
                       </div> {/* Close flex-1 wrapper */}
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
        <form onSubmit={handleSendMessage} className='flex items-start gap-3'>
          {/* Attachments */}
          <div className='flex gap-1 pt-2'>
            <button type='button' className='p-2 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg' title='Attach file'>
              <Paperclip className='w-5 h-5' />
            </button>
            <button type='button' className='p-2 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg' title='Add image'>
              <Image className='w-5 h-5' />
            </button>
          </div>

          {/* Input area */}
          <div className='flex-1 relative'>
            {/* Reply preview */}
            {replyTo && (
              <div className='mb-2 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <MessageSquare className='w-4 h-4 text-[#58a6ff]' />
                  <span className='text-xs text-[#8b949e]'>
                    Replying to <span className='font-medium text-[#c9d1d9]'>{replyTo.sender?.name}</span>
                  </span>
                </div>
                <button
                  type='button'
                  onClick={() => setReplyTo(null)}
                  className='p-0.5 hover:bg-[#21262d] rounded'
                >
                  <X className='w-4 h-4 text-[#484f58]' />
                </button>
              </div>
            )}

            <textarea
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              placeholder={replyTo ? 'Write a reply...' : 'Type your message...'}
              rows={1}
              className='w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-[#e6edf3] placeholder-[#484f58] outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent transition-all resize-none'
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* Send button */}
          <button
            type='submit'
            disabled={!newMessage.trim() || sending}
            className='px-5 py-2.5 bg-[#1f6feb] text-white rounded-xl font-medium text-sm hover:bg-[#388bfd] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 mt-8 sm:mt-0'
          >
            <Send className='w-4 h-4' />
            <span className='hidden sm:inline'>Send</span>
          </button>
        </form>
       </div>
     </div>
   );
 };

export default EventChat;
