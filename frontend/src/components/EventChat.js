import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Smile,
  Users,
  Crown,
  MessageSquare,
  Trash2,
  X,
  Check,
  Paperclip,
  Image,
  MoreVertical
} from 'lucide-react';
import {
  getCommunityMessages,
  postCommunityMessage,
  getEventAttendees,
  deleteMessage,
  editMessage,
  addReaction
} from '../utils/api';
import ReactionPicker from './ReactionPicker';
import './EventChat.css';

const getReactionUserId = (reaction) => String(reaction?.user?._id || reaction?.user || '');

const getMessagesSignature = (items = []) =>
  items
    .map((msg) => {
      const reactions = (msg.reactions || [])
        .map((reaction) => `${reaction.emoji}:${getReactionUserId(reaction)}`)
        .sort()
        .join(',');

      return [
        msg._id,
        msg.content,
        msg.updatedAt || msg.editedAt || msg.createdAt,
        msg.isEdited ? 'edited' : 'live',
        reactions
      ].join('|');
    })
    .join('||');

const getAttendeeUser = (attendee) => attendee?.user || attendee || {};
const getInitial = (name) => String(name || 'G').trim().charAt(0).toUpperCase();

const EventChat = ({ eventId, eventTitle, currentUser, userRole = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [typingUsers] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const autoScrollRef = useRef(true);
  const pendingScrollRef = useRef('auto');
  const messagesSignatureRef = useRef('');

  const fetchMessages = useCallback(async (silent = false) => {
    if (!eventId) return;

    try {
      const data = await getCommunityMessages(eventId, 1, 100);
      const nextMessages = data.messages || [];
      const nextSignature = getMessagesSignature(nextMessages);

      setMessages((previousMessages) => {
        if (messagesSignatureRef.current === nextSignature) {
          return previousMessages;
        }

        const previousLastId = previousMessages[previousMessages.length - 1]?._id;
        const nextLastId = nextMessages[nextMessages.length - 1]?._id;
        const firstLoad = previousMessages.length === 0;
        const receivedNewMessage = previousLastId !== nextLastId || previousMessages.length !== nextMessages.length;

        if (!silent || (receivedNewMessage && autoScrollRef.current)) {
          pendingScrollRef.current = firstLoad ? 'auto' : 'smooth';
        }

        messagesSignatureRef.current = nextSignature;
        return nextMessages;
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  }, [eventId]);

  const fetchAttendees = useCallback(async () => {
    if (!eventId) return;

    try {
      const data = await getEventAttendees(eventId);
      setAttendees(data.attendees || data.users || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setAttendees([]);
    }
  }, [eventId]);

  useEffect(() => {
    autoScrollRef.current = true;
    pendingScrollRef.current = 'auto';
    messagesSignatureRef.current = '';
    setMessages([]);
    setLoading(true);
    setReplyTo(null);
    setEditingId(null);
    setEditContent('');
    setActiveMenu(null);
    setShowReactionPicker(null);
  }, [eventId]);

  useEffect(() => {
    fetchMessages();
    fetchAttendees();
  }, [fetchMessages, fetchAttendees]);

  useEffect(() => {
    if (!eventId) return undefined;

    const interval = setInterval(() => {
      fetchMessages(true);
      fetchAttendees();
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId, fetchMessages, fetchAttendees]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    autoScrollRef.current = distanceFromBottom <= 120;
  }, []);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const behavior = pendingScrollRef.current;
    if (!container || !behavior) return;

    pendingScrollRef.current = null;
    container.scrollTo({
      top: container.scrollHeight,
      behavior
    });
  }, [messages]);

  const toggleActionMenu = useCallback((messageId) => {
    setActiveMenu((current) => (current === messageId ? null : messageId));
  }, []);

  const handleReply = (message) => {
    setReplyTo(message);
    setActiveMenu(null);
    messageInputRef.current?.focus();
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
      setMessages((prev) => prev.map((msg) => {
        if (msg._id !== messageId) return msg;

        const userString = String(currentUser?.id);
        const existingReaction = msg.reactions?.find(
          (reaction) => getReactionUserId(reaction) === userString && reaction.emoji === emoji
        );

        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions.filter(
              (reaction) => !(getReactionUserId(reaction) === userString && reaction.emoji === emoji)
            )
          };
        }

        return {
          ...msg,
          reactions: [...(msg.reactions || []), {
            emoji,
            user: userString,
            createdAt: new Date()
          }]
        };
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setShowReactionPicker(null);
    }
  };

  const handleEdit = async (messageId) => {
    if (!editContent.trim()) return;

    try {
      await editMessage(messageId, editContent.trim());
      setMessages((prev) => prev.map((msg) =>
        msg._id === messageId ? { ...msg, content: editContent.trim(), isEdited: true, editedAt: new Date() } : msg
      ));
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setActiveMenu(null);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    autoScrollRef.current = true;
    pendingScrollRef.current = 'smooth';

    try {
      await postCommunityMessage(eventId, newMessage.trim(), replyTo?._id || null);
      setNewMessage('');
      setReplyTo(null);
      fetchMessages(true).catch(() => {});
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {};

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const isCurrentUserMessage = (msg) => msg.sender && String(msg.sender._id) === String(currentUser?.id);

  if (!eventId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="mb-3 h-12 w-12 text-cocoa-300" />
        <h3 className="mb-2 text-lg font-bold text-cocoa-900">Event Community Chat</h3>
        <p className="text-sm text-cocoa-500">Select an event from your bookings to join its community chat.</p>
      </div>
    );
  }

  return (
    <div className="event-chat-container flex h-full min-h-0 flex-col bg-gradient-to-b from-white via-white to-[#fffaf6]">
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-cocoa-100 bg-white/95 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/20">
            <span className="text-base font-extrabold">{getInitial(eventTitle)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-extrabold text-cocoa-900 sm:text-base">Community Chat</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-cocoa-500">
              <span>{attendees.length} participants</span>
              <span className="text-cocoa-300">&bull;</span>
              <span>{messages.length} messages</span>
            </p>
          </div>
          {userRole === 'host' && (
            <span className="hidden items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-2 py-1 text-[10px] font-bold uppercase text-primary-700 sm:inline-flex">
              <Crown className="h-3 w-3 fill-current" />
              Host
            </span>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="hidden items-center gap-1.5 rounded-lg bg-[#fbf8f4] px-2 py-1 text-xs text-cocoa-500 sm:flex"
            >
              <span className="h-2 w-2 rounded-full bg-primary-400" />
              {typingUsers.map((user) => user.name).join(', ')} typing...
            </motion.div>
          )}
          <button
            type="button"
            onClick={() => setShowParticipants((current) => !current)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${showParticipants ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-cocoa-100 bg-white text-cocoa-500 hover:bg-[#fbf8f4] hover:text-cocoa-900'}`}
            aria-label="Toggle participants"
            title="Participants"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-shrink-0 overflow-hidden border-b border-cocoa-100 bg-[#fffaf6]"
          >
            <div className="participants-scroll flex gap-2 overflow-x-auto px-4 py-3">
              {attendees.length > 0 ? attendees.slice(0, 18).map((attendee, index) => {
                const participant = getAttendeeUser(attendee);
                const name = participant.name || participant.email || 'Guest';

                return (
                  <div key={participant._id || attendee._id || index} className="flex min-w-fit items-center gap-2 rounded-full border border-cocoa-100 bg-white px-3 py-2 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-extrabold text-primary-700">
                      {getInitial(name)}
                    </span>
                    <span className="max-w-32 truncate text-xs font-bold text-cocoa-700">{name}</span>
                  </div>
                );
              }) : (
                <span className="text-xs font-semibold text-cocoa-400">Participants will appear after bookings are confirmed.</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="chat-scroll-container event-chat-messages flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-5"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-cocoa-500">
            <span className="mr-2 h-4 w-4 rounded-full border-2 border-cocoa-100 border-t-primary-500 animate-spin" />
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-cocoa-500">
            <MessageSquare className="mb-2 h-12 w-12 text-cocoa-300" />
            <p className="text-sm font-bold text-cocoa-700">No messages yet</p>
            <p className="mt-1 text-xs text-cocoa-400">Start the conversation with attendees.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const sender = msg.sender;
            const isOwn = isCurrentUserMessage(msg);
            const previousSenderId = String(messages[index - 1]?.sender?._id || '');
            const currentSenderId = String(sender?._id || '');
            const showAvatar = index === 0 || previousSenderId !== currentSenderId;
            const showDate = index === 0 || new Date(messages[index - 1]?.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

            return (
              <React.Fragment key={msg._id}>
                {showDate && (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full border border-cocoa-100 bg-white px-3 py-1 text-xs font-bold text-cocoa-400 shadow-sm">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}

                <div className={`event-chat-message-row flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[86%] items-end gap-2 sm:max-w-[72%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      showAvatar && sender ? (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-cocoa-100 bg-white shadow-sm">
                          <span className="text-sm font-extrabold text-primary-600">{getInitial(sender.name)}</span>
                        </div>
                      ) : (
                        <div className="h-8 w-8 flex-shrink-0" />
                      )
                    )}

                    <div className="min-w-0 flex-1">
                      <div
                        className={`group relative break-words px-4 py-2.5 shadow-sm transition-colors ${isOwn ? 'rounded-lg rounded-br-sm bg-gradient-to-r from-primary-500 to-secondary-500 text-white' : 'rounded-lg rounded-bl-sm border border-cocoa-100 bg-white text-cocoa-700'}`}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          toggleActionMenu(msg._id);
                        }}
                        onDoubleClick={() => toggleActionMenu(msg._id)}
                      >
                        {msg.replyTo && (
                          <div className={`mb-2 rounded border-l-2 px-2 py-1 text-xs ${isOwn ? 'border-white/40 bg-white/15 text-white/80' : 'border-primary-200 bg-[#fbf8f4] text-cocoa-500'}`}>
                            Replying to {msg.replyTo.sender?.name || 'user'}
                          </div>
                        )}

                        {!isOwn && sender && (
                          <div className="mb-1.5 flex items-center gap-2">
                            {sender.role !== 'host' && (
                              <span className="text-xs font-extrabold text-cocoa-700">{sender.name}</span>
                            )}
                            {sender.role === 'host' && (
                              <span className="flex items-center gap-1 rounded border border-primary-100 bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-700">
                                <Crown className="h-3 w-3 fill-current" />
                                Host
                              </span>
                            )}
                          </div>
                        )}

                        {editingId === msg._id ? (
                          <div className="flex items-end gap-2">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(event) => setEditContent(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') handleEdit(msg._id);
                                if (event.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              className="min-w-0 flex-1 rounded-lg border border-cocoa-100 bg-white px-3 py-2 text-sm text-cocoa-900 outline-none focus:ring-2 focus:ring-primary-200"
                            />
                            <button type="button" onClick={() => handleEdit(msg._id)} className="rounded-lg bg-emerald-500 p-2 text-white hover:bg-emerald-600">
                              <Check className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg bg-cocoa-100 p-2 text-cocoa-700 hover:bg-cocoa-200">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                            {msg.replyTo && (
                              <div className={`mt-2 border-t pt-2 ${isOwn ? 'border-white/20' : 'border-cocoa-100'}`}>
                                <div className={`flex items-center gap-1 text-xs ${isOwn ? 'text-white/70' : 'text-cocoa-500'}`}>
                                  <MessageSquare className="h-3 w-3" />
                                  Replying to {msg.replyTo.sender?.name || 'user'}
                                </div>
                                <div className={`mt-0.5 truncate text-xs ${isOwn ? 'text-white/65' : 'text-cocoa-500'}`}>
                                  {msg.replyTo.content || 'Original message'}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {activeMenu === msg._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className={`absolute top-full z-50 mt-2 flex items-center gap-1 rounded-full border border-cocoa-100 bg-white px-2 py-1.5 shadow-xl ${isOwn ? 'right-0' : 'left-0'}`}
                          >
                            <button type="button" onClick={() => handleReply(msg)} className="rounded-full p-1.5 hover:bg-[#fbf8f4]" title="Reply">
                              <MessageSquare className="h-4 w-4 text-cocoa-500" />
                            </button>
                            <button type="button" onClick={() => setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id)} className="rounded-full p-1.5 hover:bg-[#fbf8f4]" title="React">
                              <Smile className="h-4 w-4 text-cocoa-500" />
                            </button>
                            {isOwn && (
                              <>
                                <button type="button" onClick={() => { setEditingId(msg._id); setEditContent(msg.content); setActiveMenu(null); }} className="rounded-full p-1.5 hover:bg-[#fbf8f4]" title="Edit">
                                  <MessageSquare className="h-4 w-4 text-cocoa-500" />
                                </button>
                                <button type="button" onClick={() => handleDelete(msg._id)} className="rounded-full p-1.5 hover:bg-red-50" title="Delete">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </>
                            )}
                            <button type="button" onClick={() => setActiveMenu(null)} className="rounded-full p-1 hover:bg-[#fbf8f4]" title="Close">
                              <X className="h-3 w-3 text-cocoa-300" />
                            </button>
                            {showReactionPicker === msg._id && (
                              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
                                <ReactionPicker onSelect={(emoji) => handleReaction(msg._id, emoji)} onClose={() => setShowReactionPicker(null)} />
                              </div>
                            )}
                          </motion.div>
                        )}

                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            {Object.entries(msg.reactions.reduce((counts, reaction) => {
                              counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
                              return counts;
                            }, {})).map(([emoji, count]) => {
                              const hasReacted = msg.reactions.some(
                                (reaction) => reaction.emoji === emoji && getReactionUserId(reaction) === String(currentUser?.id)
                              );

                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReaction(msg._id, emoji)}
                                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all ${hasReacted ? 'border-primary-300 bg-primary-50 text-cocoa-900' : 'border-cocoa-100 bg-white/80 text-cocoa-600 hover:border-primary-300'}`}
                                  title={hasReacted ? 'Remove reaction' : 'Add reaction'}
                                >
                                  {emoji} {count}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className={`mt-1.5 flex items-center justify-end gap-1.5 ${isOwn ? 'text-white/70' : 'text-cocoa-300'}`}>
                          <span className="text-xs font-medium">{formatTime(msg.createdAt)}</span>
                          {isOwn && (
                            <>
                              <Check className="h-4 w-4 text-emerald-200" />
                              {msg.isEdited && <span className="text-xs">(edited)</span>}
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleActionMenu(msg._id);
                          }}
                          className={`absolute -top-2 h-8 w-8 items-center justify-center rounded-full border border-cocoa-100 bg-white text-cocoa-500 opacity-0 shadow-sm transition-opacity hover:bg-[#fbf8f4] group-hover:flex group-hover:opacity-100 ${isOwn ? '-left-2' : '-right-2'}`}
                          title="Message actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="flex-shrink-0 border-t border-cocoa-100 bg-white/95 p-3 sm:p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-3">
          <div className="hidden gap-1 pb-1 sm:flex">
            <button type="button" className="rounded-lg p-2 text-cocoa-500 hover:bg-[#fbf8f4] hover:text-cocoa-900" title="Attach file">
              <Paperclip className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-lg p-2 text-cocoa-500 hover:bg-[#fbf8f4] hover:text-cocoa-900" title="Add image">
              <Image className="h-5 w-5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-cocoa-100 bg-[#fbf8f4] px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-primary-600" />
                  <span className="truncate text-xs text-cocoa-500">
                    Replying to <span className="font-bold text-cocoa-700">{replyTo.sender?.name || 'user'}</span>
                  </span>
                </div>
                <button type="button" onClick={() => setReplyTo(null)} className="rounded p-0.5 hover:bg-white">
                  <X className="h-4 w-4 text-cocoa-300" />
                </button>
              </div>
            )}

            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(event) => { setNewMessage(event.target.value); handleTyping(); }}
              placeholder={replyTo ? 'Write a reply...' : 'Type your message...'}
              rows={1}
              className="block h-12 w-full resize-none rounded-lg border border-cocoa-100 bg-[#fbf8f4] px-4 py-3 text-sm leading-6 text-cocoa-900 outline-none transition-all placeholder:text-cocoa-300 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
          >
            <Send className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">{sending ? 'Sending' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventChat;
