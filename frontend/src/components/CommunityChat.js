import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Clock, Check, CheckCheck, Pin, Send, Smile } from "lucide-react";
import "./CommunityChat.css";

const mockEvents = [
  { id: "event1", title: "Web Dev Summit 2025", date: "2025-03-15", hostId: "host1", participantCount: 245 },
  { id: "event2", title: "Design Thinking Workshop", date: "2025-03-20", hostId: "host2", participantCount: 89 },
];

const mockUsers = [
  { id: "user1", name: "Alex Chen", avatar: "https://i.pravatar.cc/40?u=alex", joinedEventIds: ["event1", "event2"] },
  { id: "user2", name: "Sarah Kim", avatar: "https://i.pravatar.cc/40?u=sarah", joinedEventIds: ["event1"] },
];

const mockHosts = [
  { id: "host1", name: "Marcus Webb", avatar: "https://i.pravatar.cc/40?u=marcus", isOnline: true },
  { id: "host2", name: "Elena Rossi", avatar: "https://i.pravatar.cc/40?u=elena", isOnline: false },
];

const mockMessages = {
  "event1_user1": [
    { id: "m1", senderId: "user1", senderRole: "user", content: "Excited for this event!", timestamp: "09:15", seen: true },
    { id: "m2", senderId: "host1", senderRole: "host", content: "Welcome Alex!", timestamp: "09:20", seen: true },
    { id: "m3", senderId: "host1", senderRole: "host", content: "System: Check your email.", timestamp: "09:25", seen: false, pinned: true },
  ],
};

const UserCommunityDashboard = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const currentUser = mockUsers[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedEvent) {
      const key = selectedEvent + "_" + currentUser.id;
      setMessages(mockMessages[key] || []);
    }
  }, [selectedEvent, currentUser.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderRole: "user",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      seen: false,
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
  };

  const getUnreadCount = (eventId) => {
    const key = eventId + "_" + currentUser.id;
    return (mockMessages[key] || []).filter(m => !m.seen && m.senderRole === "host").length;
  };

  const pinnedMsg = messages.find(m => m.pinned);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2">Community</h1>
            <p className="text-slate-400">Connect with event hosts and attendees</p>
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button className="px-6 py-2 rounded-md bg-amber-500 text-slate-900 font-medium text-sm">User View</button>
            <button className="px-6 py-2 rounded-md text-slate-400 hover:text-white transition-colors text-sm">Host View</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-96">
          <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-white">My Events</span>
              </div>
            </div>
            <div className="overflow-y-auto h-full max-h-full">
              {mockEvents.map(event => {
                const unread = getUnreadCount(event.id);
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className={"p-4 cursor-pointer border-b border-slate-800 transition-colors " + (selectedEvent === event.id ? "bg-slate-800/50" : "hover:bg-slate-800/30")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{event.title}</h3>
                        <p className="text-xs text-slate-500">{event.participantCount} participants</p>
                      </div>
                      {unread > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {selectedEvent ? (
              <>
                <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-900" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-serif text-xl text-white">Web Dev Summit 2025</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Host: Marcus Webb</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-400">Online</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {pinnedMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border-b border-amber-500/20 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Pin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-amber-400 font-medium mb-1">Pinned Announcement</p>
                        <p className="text-sm text-slate-200">{pinnedMsg.content}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Users className="w-16 h-16 text-slate-700 mb-4" />
                      <p className="text-slate-400 font-medium">No messages yet</p>
                      <p className="text-sm text-slate-500">Start the conversation with the host</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={"flex " + (msg.senderRole === "user" ? "justify-end" : "justify-start")}
                      >
                        <div className={"max-w-xs lg:max-w-md px-4 py-2 rounded-lg " + (msg.senderRole === "user" ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-200")}>
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-60">{msg.timestamp}</span>
                            {msg.senderRole === "user" && (
                              <span className="ml-2">
                                {msg.seen ? <CheckCheck className="w-3 h-3 inline text-slate-400" /> : <Check className="w-3 h-3 inline text-slate-400" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50">
                  <div className="flex items-end gap-2">
                    <button type="button" className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-amber-500 text-slate-900 p-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                  <p className="font-medium">Select an event to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCommunityDashboard;