import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Smile, Users, Crown, MessageSquare, Trash2, UserX, Volume2,
  ThumbsUp, Heart, Laugh, Frown, Sparkles, MoreHorizontal, Phone, Video,
  FileText, Image, Paperclip, SmilePlus, BookOpen, Edit3, X
} from 'lucide-react';
import {
  getCommunityMessages,
  postCommunityMessage,
  getEventAttendees,
  deleteMessage
} from '../utils/api';
import ReactionPicker from './ReactionPicker';
import toast from 'react-hot-toast';

const EventChat = ({ eventId, eventTitle, currentUser, userRole = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);

  const chatEndRef = useRef(null);
  const pollingRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch community messages
  const fetchMessages = useCallback(async () => {
    if (!eventId) return;
    try {
      console.log('Fetching messages for event:', eventId);
      const data = await getCommunityMessages(eventId, 1, 100);
      console.log('Messages response:', data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      let errorMsg = 'Failed to load messages';
      if (error.response) {
        console.error('API error:', error.response.data);
        errorMsg = error.response.data?.message || error.response.statusText || 'Server error';
      } else if (error.request) {
        errorMsg = 'No response from server';
      } else {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchAttendees = useCallback(async () => {
    try {
      const data = await getEventAttendees(eventId);
      console.log('Attendees response:', data);
      const attendeeList = data.attendees || data.users || [];
      setAttendees(attendeeList);
      // Simulate online status (in real app, this would come from WebSocket)
      const online = {};
      attendeeList.forEach(att => {
        online[att._id] = Math.random() > 0.5; // Random for demo
      });
      setOnlineUsers(online);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      let errorMsg = 'Failed to load attendees';
      if (error.response) {
        console.error('API error:', error.response.data);
        errorMsg = error.response.data?.message || error.response.statusText || 'Server error';
      } else if (error.request) {
        errorMsg = 'No response from server';
      } else {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
      setAttendees([]);
    }
  }, [eventId]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
    fetchAttendees();
  }, [fetchMessages, fetchAttendees]);

  // Simulate typing indicators (poll or WebSocket)
  useEffect(() => {
    if (!eventId) return;

    // Randomly simulate other users typing for demo
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const otherUser = attendees.find(a => a._id !== currentUser?.id);
        if (otherUser) {
          setTypingUsers([otherUser]);
          setTimeout(() => setTypingUsers([]), 2000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId, attendees, currentUser?.id]);

  // Setup polling for real-time updates
  useEffect(() => {
    if (!eventId) return;

    pollingRef.current = setInterval(() => {
      fetchMessages();
      fetchAttendees();
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [eventId, fetchMessages, fetchAttendees]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await postCommunityMessage(eventId, newMessage.trim());
      console.log('Message sent successfully:', response);
      setNewMessage('');
      setReplyingTo(null);
      setEditingMessage(null);
      await fetchMessages();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send message. Please try again.';
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      await fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

   const handleReaction = async (messageId, emoji) => {
    try {
      // TODO: Implement reaction API
      console.log('Add reaction:', messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // TODO: Emit typing event to server
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // TODO: Emit stop typing event
    }, 1000);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isCurrentUserMessage = (msg) => {
    return msg.sender && msg.sender._id === currentUser?.id;
  };

  const isHost = () => {
    return userRole === 'host';
  };

  if (!eventId) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-center p-8'>
        <div className='w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-800/50 mx-auto mb-6 flex items-center justify-center'>
          <MessageSquare className='w-12 h-12 text-slate-700' />
        </div>
        <h3 className='text-2xl font-serif text-white mb-3'>Event Community Chat</h3>
        <p className='text-slate-400 mb-6 leading-relaxed'>
          Select an event from your bookings to join its community chat.
        </p>
      </div>
    );
  }

  return (
    <div className='flex h-full'>
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${showParticipants ? 'hidden md:flex' : ''} md:flex`}>
        {/* Chat Header */}
        <div className='p-4 border-b border-slate-800/50 bg-slate-900/30 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div>
              <h2 className='font-serif text-xl text-white'>{eventTitle}</h2>
              <p className='text-sm text-slate-400'>
                {attendees.length} participants • {messages.length} messages
              </p>
            </div>
            {isHost() && (
              <div className='px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg flex items-center gap-1'>
                <Crown className='w-4 h-4' />
                <span className='text-sm font-medium'>Host</span>
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className='flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full text-sm text-slate-400'
                >
                  <div className='flex gap-1'>
                    <span className='w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
                    <span className='w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
                    <span className='w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className='text-xs'>
                    {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Participants Toggle (Mobile) */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className='p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-800/50 md:hidden'
            >
              <Users className='w-5 h-5' />
            </button>

            {/* Participants Toggle (Desktop) */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                showParticipants
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-800/50'
              }`}
            >
              <Users className='w-4 h-4' />
              <span className='text-sm'>{attendees.length}</span>
            </button>
          </div>
         </div>

         {/* Messages Area */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar'>
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-slate-400'>Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center py-12'>
              <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-800/50 flex items-center justify-center mb-4 shadow-lg'>
                <MessageSquare className='w-10 h-10 text-slate-600' />
              </div>
              <p className='text-slate-400 font-medium text-lg mb-2'>
                No messages yet
              </p>
              <p className='text-slate-600 text-sm'>
                Be the first to start the conversation!
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const sender = msg.sender;
                const isOwn = isCurrentUserMessage(msg);
                const showAvatar = index === 0 || messages[index-1]?.sender?._id !== sender?._id;
                const showDate = index === 0 ||
                  new Date(messages[index-1]?.createdAt).toDateString() !==
                  new Date(msg.createdAt).toDateString();

                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className='group'
                  >
                    {/* Date Separator */}
                    {showDate && (
                      <div className='flex items-center justify-center my-4'>
                        <span className='px-3 py-1 bg-slate-800/50 text-slate-400 text-xs rounded-full'>
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`group relative max-w-lg xl:max-w-md ${isOwn ? '' : 'flex-row-reverse'}`}>
                        <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && showAvatar && sender && (
                            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center flex-shrink-0 shadow-lg'>
                              <span className='text-xs font-bold text-slate-300'>
                                {sender.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          {!isOwn && !showAvatar && <div className='w-10 flex-shrink-0' />}

                           <div
                             className={`relative px-4 py-2.5 shadow-lg group-hover:shadow-xl transition-all duration-300 cursor-pointer
                               ${isOwn
                                 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-2xl rounded-br-sm'
                                 : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-slate-700/50 rounded-2xl rounded-bl-sm'
                               }
                              `}
                           >
                            {/* Reply Reference */}
                            {msg.replyTo && (
                              <div className='mb-2 px-2 py-1 bg-black/10 border-l-2 border-slate-400 rounded text-xs text-slate-400'>
                                Replying to {msg.replyTo.sender?.name}
                              </div>
                            )}

                            {!isOwn && sender && (
                              <div className='flex items-center gap-2 mb-1'>
                                <p className='text-xs font-medium text-amber-400'>
                                  {sender.name}
                                </p>
                                {sender.role === 'host' && (
                                  <Crown className='w-3 h-3 text-amber-500' />
                                )}
                              </div>
                            )}

                            <p className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{msg.content}</p>

                            {/* Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className='flex items-center gap-1 mt-2'>
                                {Object.entries(
                                  msg.reactions.reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                  }, {})
                                ).map(([emoji, count]) => (
                                  <span
                                    key={emoji}
                                    className='px-2 py-0.5 bg-slate-700/50 rounded-full text-xs flex items-center gap-1'
                                  >
                                    {emoji} {count}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className={`flex items-center justify-end gap-2 mt-1 ${isOwn ? 'text-slate-900/60' : 'text-slate-400'}`}>
                              <span className='text-[10px] font-mono'>
                                {formatTime(msg.createdAt)}
                              </span>
                              {isOwn && (
                                <span className='text-[10px]'>
                                  {msg.isEdited && '(edited)'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message Actions */}
                          <div className='absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1'>
                            {isOwn && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                                  className='p-1 text-slate-400 hover:text-amber-500'
                                  title='Reply'
                                >
                                  <MessageSquare className='w-3 h-3' />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); }}
                                  className='p-1 text-slate-400 hover:text-blue-500'
                                  title='Edit'
                                >
                                  <Edit3 className='w-3 h-3' />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg._id); }}
                                  className='p-1 text-slate-400 hover:text-red-500'
                                  title='Delete'
                                >
                                  <Trash2 className='w-3 h-3' />
                                </button>
                              </>
                            )}
                            {isHost() && !isOwn && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); /* mute user */ }}
                                  className='p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-700/50 rounded'
                                  title='Mute'
                                >
                                  <UserX className='w-4 h-4' />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id);
                              }}
                              className='p-1 text-slate-400 hover:text-green-500'
                              title='React'
                            >
                              <SmilePlus className='w-3 h-3' />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reaction Picker */}
                    <AnimatePresence>
                      {showReactionPicker === msg._id && (
                        <ReactionPicker
                          onSelect={(emoji) => {
                            handleReaction(msg._id, emoji);
                            setShowReactionPicker(null);
                          }}
                          onClose={() => setShowReactionPicker(null)}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Reply/Edit Preview */}
        {(replyingTo || editingMessage) && (
          <div className='px-4 py-2 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {replyingTo ? (
                <>
                  <MessageSquare className='w-4 h-4 text-slate-400' />
                  <span className='text-sm text-slate-400'>
                    Replying to {replyingTo.sender?.name}: {replyingTo.content.substring(0, 30)}...
                  </span>
                </>
              ) : (
                <>
                  <Edit3 className='w-4 h-4 text-slate-400' />
                  <span className='text-sm text-slate-400'>
                    Editing: {editingMessage.content.substring(0, 30)}...
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => { setReplyingTo(null); setEditingMessage(null); }}
              className='text-slate-400 hover:text-white'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className='p-4 border-t border-slate-800/50 bg-slate-900/30'>
          <form onSubmit={handleSendMessage} className='flex items-end gap-3'>
            {/* Attachment Buttons */}
            <div className='flex gap-1'>
              <button
                type='button'
                className='p-2 text-slate-500 hover:text-amber-500 rounded-lg hover:bg-slate-800/50 transition-all'
                title='Attach file'
              >
                <Paperclip className='w-5 h-5' />
              </button>
              <button
                type='button'
                className='p-2 text-slate-500 hover:text-amber-500 rounded-lg hover:bg-slate-800/50 transition-all'
                title='Add image'
              >
                <Image className='w-5 h-5' />
              </button>
            </div>

            <div className='flex-1 relative'>
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder='Type your message...'
                rows={1}
                className='w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none'
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            <button
              type='submit'
              disabled={!newMessage.trim() || sending}
              className='px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center gap-2'
            >
              <Send className='w-4 h-4' />
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Participants Side Panel */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='w-80 border-l border-slate-800/50 bg-slate-900/30 hidden md:block'
          >
            <div className='p-4 border-b border-slate-800/50 flex items-center justify-between'>
              <h3 className='font-semibold text-white flex items-center gap-2'>
                <Users className='w-4 h-4 text-amber-500' />
                Participants
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className='text-slate-400 hover:text-white'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <div className='p-4 space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto'>
              {attendees.length > 0 ? (
                attendees.map((attendee) => (
                  <div
                    key={attendee._id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer
                      ${attendee._id === currentUser?.id ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-slate-800/50'}
                    `}
                  >
                    <div className='relative'>
                      <div className='w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center'>
                        <span className='text-sm font-bold text-slate-300'>
                          {attendee.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      {onlineUsers[attendee._id] && (
                        <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900'></div>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-sm text-slate-200 truncate'>
                        {attendee.name}
                        {attendee._id === currentUser?.id && (
                          <span className='text-xs text-slate-400 ml-1'>(You)</span>
                        )}
                      </p>
                      <p className='text-xs text-slate-400'>
                        {onlineUsers[attendee._id] ? 'Online' : 'Offline'}
                        {attendee.role === 'host' && ' • Host'}
                      </p>
                    </div>
                    {isHost() && attendee._id !== currentUser?.id && (
                      <div className='flex gap-1'>
                        <button
                          onClick={() => {/* mute user */}}
                          className='p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-700/50 rounded'
                          title='Mute'
                        >
                          <Volume2 className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => {/* remove user */}}
                          className='p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-700/50 rounded'
                          title='Remove'
                        >
                          <UserX className='w-4 h-4' />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className='text-center py-8 text-slate-400'>
                  <Users className='w-12 h-12 mx-auto mb-2 text-slate-600' />
                  <p className='text-sm'>No participants yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventChat;
