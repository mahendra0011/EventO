import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Check, CheckCheck, Send, Smile, Star, Crown, MessageSquare, Megaphone, Sparkles } from "lucide-react";
import "./CommunityChat.css";

const mockEvents = [
  { id: "event1", title: "Web Dev Summit 2025", date: "2025-03-15", hostId: "host1", creatorId: "host1", participantCount: 245, category: "Tech" },
  { id: "event2", title: "Design Thinking Workshop", date: "2025-03-20", hostId: "host2", creatorId: "user3", participantCount: 89, category: "Design" },
  { id: "event3", title: "AI ML Bootcamp", date: "2025-04-05", hostId: "host1", creatorId: "host1", participantCount: 156, category: "Tech" },
  { id: "event4", title: "Startup Pitch Night", date: "2025-04-10", hostId: "host2", creatorId: "host2", participantCount: 67, category: "Business" },
];

const mockAllUsers = [
  { id: "user1", name: "Alex Chen", avatar: "https://i.pravatar.cc/40?u=alex", joinedEventIds: ["event1", "event2"], isPremium: true },
  { id: "user2", name: "Sarah Kim", avatar: "https://i.pravatar.cc/40?u=sarah", joinedEventIds: ["event1"], isPremium: false },
  { id: "user3", name: "Jordan Lee", avatar: "https://i.pravatar.cc/40?u=jordan", joinedEventIds: ["event1", "event2", "event4"], isPremium: true },
  { id: "user4", name: "Emma Wilson", avatar: "https://i.pravatar.cc/40?u=emma", joinedEventIds: ["event2", "event4"], isPremium: false },
];

const mockAllHosts = [
  { id: "host1", name: "Marcus Webb", avatar: "https://i.pravatar.cc/40?u=marcus", isOnline: true, rating: 4.9, eventsHosted: 45 },
  { id: "host2", name: "Elena Rossi", avatar: "https://i.pravatar.cc/40?u=elena", isOnline: false, rating: 4.7, eventsHosted: 32 },
];

const mockAllMessages = {
  "event1_user1": [
    { id: "m1", senderId: "user1", senderRole: "user", content: "Excited for Web Dev Summit!", timestamp: "09:15", seen: true },
    { id: "m2", senderId: "host1", senderRole: "host", content: "Welcome! Starts at 10 AM.", timestamp: "09:20", seen: true },
    { id: "m3", senderId: "host1", senderRole: "host", content: "Bring laptop for sessions", timestamp: "09:25", seen: false },
  ],
  "event2_user2": [
    { id: "m4", senderId: "user2", senderRole: "user", content: "Is this beginner-friendly?", timestamp: "14:30", seen: true },
    { id: "m5", senderId: "user3", senderRole: "user", content: "Yes, very beginner friendly!", timestamp: "14:35", seen: true },
  ],
  "event1_community": [
    { id: "c1", senderId: "user1", senderRole: "user", content: "Who else is attending? Let's connect!", timestamp: "08:00", seen: true, type: "community" },
    { id: "c2", senderId: "user2", senderRole: "user", content: "I'm in! First tech event for me 😊", timestamp: "08:15", seen: true, type: "community" },
    { id: "c3", senderId: "host1", senderRole: "host", content: "Welcome everyone! See you tomorrow!", timestamp: "19:00", seen: true, type: "community" },
  ],
};

const CommunityChat = () => {
  // Active role: user or host
  const [activeRole, setActiveRole] = useState("user");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("direct"); // direct or community
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const chatEndRef = useRef(null);

  const currentUser = activeRole === "host" 
    ? mockAllHosts[0] 
    : mockAllUsers[0];
  
  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Load messages when selection changes
  useEffect(() => {
    if (activeTab === "direct" && selectedEvent) {
      if (activeRole === "host") {
        if (selectedUser) {
          // Host messaging a specific attendee
          const key = `${selectedEvent}_${selectedUser.id}`;
          setMessages(mockAllMessages[key] || []);
        } else {
          // Host viewing general event messages (show community feed instead?)
          setMessages([]);
        }
      } else if (activeRole === "user") {
        const host = mockAllHosts.find(h => h.id === mockEvents.find(e => e.id === selectedEvent)?.hostId);
        if (host) {
          const key = `${selectedEvent}_${currentUser.id}`;
          setMessages(mockAllMessages[key] || []);
        }
      }
    } else if (activeTab === "community" && selectedEvent) {
      const key = `${selectedEvent}_community`;
      setMessages(mockAllMessages[key] || []);
    } else {
      setMessages([]);
    }
  }, [selectedEvent, selectedUser, activeRole, activeTab, currentUser.id]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderRole: activeRole,
      senderName: currentUser.name,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      seen: false,
    };
    if (activeTab === "community") {
      msg.type = "community";
      // Add to persistent mock data so it persists across tab switches
      const communityKey = `${selectedEvent}_community`;
      if (!mockAllMessages[communityKey]) {
        mockAllMessages[communityKey] = [];
      }
      mockAllMessages[communityKey].push(msg);
      // Community messages always align to the left (like a feed) regardless of sender
      msg._alignLeft = true;
    }
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
  };
  
  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderRole: activeRole,
      senderName: currentUser.name,
      content: `📢 Broadcast: ${broadcastMessage}`,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      seen: false,
      type: "community",
    };
    // Add to persistent mock data
    const communityKey = `${selectedEvent}_community`;
    if (!mockAllMessages[communityKey]) {
      mockAllMessages[communityKey] = [];
    }
    mockAllMessages[communityKey].push(msg);
    setMessages(prev => [...prev, msg]);
    setBroadcastMessage("");
  };
  
  const getUnreadCount = (eventId) => {
    const host = mockAllHosts.find(h => h.id === mockEvents.find(e => e.id === eventId)?.hostId);
    if (!host) return 0;
    const key = `${eventId}_${currentUser.id}`;
    return (mockAllMessages[key] || []).filter(m => !m.seen && m.senderRole === "host").length;
  };
  
  const getEventParticipants = (eventId) => {
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) return [];
    return mockAllUsers.filter(u => u.joinedEventIds.includes(eventId));
  };
  
  const hasJoinedEvent = (eventId) => {
    return currentUser.joinedEventIds?.includes(eventId);
  };
 
  const getEventCreator = (eventId) => {
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) return null;
    return mockAllHosts.find(h => h.id === event.creatorId) || mockAllUsers.find(u => u.id === event.creatorId);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
      {/* Ambient background effects */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_70%)]' />
      </div>
      
      <div className='relative z-10 max-w-8xl mx-auto px-4 py-6'>
        {/* Header with role toggle */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20'>
              <MessageSquare className='w-6 h-6 text-slate-900' />
            </div>
            <div>
              <h1 className='text-3xl font-serif text-white tracking-tight'>Community Hub</h1>
              <p className='text-slate-400 text-sm'>Connect, collaborate, and converse</p>
            </div>
          </div>
          
          <div className='flex bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700/50'>
            <button onClick={() => { setActiveRole("user"); setSelectedUser(null); setSelectedEvent(null); }}
              className={'px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ' + (activeRole === "user" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/20" : "text-slate-400")}>
              <User className='w-4 h-4' /> User View
            </button>
            <button onClick={() => { setActiveRole("host"); setSelectedUser(null); setSelectedEvent(null); }}
              className={'px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ' + (activeRole === "host" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/20" : "text-slate-400")}>
              <Crown className='w-4 h-4' /> Host View
            </button>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-12rem)]'>
          
          {/* Sidebar - Events List */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className='xl:col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl'>
            <div className='p-5 border-b border-slate-800/50 bg-slate-900/30'>
              <div className='flex items-center gap-2 mb-3'>
                <Users className='w-5 h-5 text-amber-500' />
                <span className='font-medium text-white text-sm uppercase tracking-wider'>{activeRole === "host" ? "Your Events" : "My Events"}</span>
              </div>
            </div>
            
            <div className='overflow-y-auto h-full custom-scrollbar'>
              {mockEvents.map((event, index) => {
                const unread = getUnreadCount(event.id);
                const isJoined = hasJoinedEvent(event.id);
                const host = mockAllHosts.find(h => h.id === event.hostId);
                return (
                  <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.1 }}
                    onClick={() => { setSelectedEvent(event.id); setSelectedUser(null); }}
                    className={'p-4 cursor-pointer border-b border-slate-800/30 transition-all duration-300 group relative ' + (selectedEvent === event.id ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30" : "hover:bg-slate-800/20 hover:border-slate-700/50")}>
                    <div className='flex items-start gap-3'>
                      <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                        <span className='text-xs font-bold text-amber-500'>{event.category}</span>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-medium text-slate-200 truncate text-sm'>{event.title}</h3>
                          {isJoined && <span className='flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500/60 border border-emerald-500/30' />}
                        </div>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='text-xs text-slate-500'>{host?.name}</span>
                          <span className='text-xs text-slate-600'>•</span>
                          <span className='text-xs text-slate-500'>{event.participantCount} attending</span>
                        </div>
                      </div>
                    </div>
                    {unread > 0 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className='absolute top-4 right-4 w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/30'>
                        {unread}
                      </motion.div>
                    )}
                    {selectedEvent === event.id && (
                      <motion.div layoutId='activeIndicator'
                        className='absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-600 rounded-r' />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Main Chat Area */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className='xl:col-span-3 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col'>
            {selectedEvent ? (
              <>
                {/* Chat Header */}
                <div className='p-5 border-b border-slate-800/50 bg-slate-900/30'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center'>
                        <User className='w-6 h-6 text-amber-500' />
                      </div>
                      <div>
                        <h2 className='font-serif text-xl text-white'>{mockEvents.find(e => e.id === selectedEvent)?.title}</h2>
                        <div className='flex items-center gap-3 mt-1'>
                          <span className='text-sm text-slate-400'>{mockEvents.find(e => e.id === selectedEvent)?.date}</span>
                          {activeRole === "host" && (
                            <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium'>
                              <Star className='w-3 h-3' /> Host Mode
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className='flex bg-slate-800/50 rounded-xl p-1'>
                      <button onClick={() => setActiveTab("direct")}
                        className={'px-4 py-2 rounded-lg text-sm font-medium transition-all ' + (activeTab === "direct" ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20" : "text-slate-400")}>
                        Direct
                      </button>
                      <button onClick={() => setActiveTab("community")}
                        className={'px-4 py-2 rounded-lg text-sm font-medium transition-all ' + (activeTab === "community" ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20" : "text-slate-400")}>
                        Community Feed
                      </button>
                    </div>
                  </div>
                  
                  {/* User Selector for Host Direct Messages */}
                  {activeRole === "host" && activeTab === "direct" && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='mt-4 flex items-center gap-3'>
                      <MessageSquare className='w-4 h-4 text-slate-500' />
                      <span className='text-sm text-slate-400'>Message attendee:</span>
                      <select value={selectedUser?.id || ""} onChange={(e) => setSelectedUser(mockAllUsers.find(u => u.id === e.target.value))}
                        className='bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none'>
                        <option value="">Select a user...</option>
                        {getEventParticipants(selectedEvent).map(user => (
                          <option key={user.id} value={user.id}>{user.name} {user.isPremium && "⭐"}</option>
                        ))}
                      </select>
                      <button onClick={() => { const creator = getEventCreator(selectedEvent); if(creator) setSelectedUser(creator); }}
                        className='px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm flex items-center gap-1 hover:bg-amber-500/30 transition-colors'>
                        <Sparkles className='w-4 h-4' /> Event Creator
                      </button>
                    </motion.div>
                  )}
                </div>

                 {/* Community Header for Hosts */}
                 {activeTab === "community" && (
                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                     className='p-4 border-b border-slate-800/50 bg-gradient-to-r from-amber-500/5 via-amber-500/5 to-transparent relative overflow-hidden'>
                     <div className='absolute inset-0 opacity-20' style={{ background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.3), transparent 70%)' }} />
                     <div className='relative flex items-center gap-3 mb-3'>
                       <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/30 border border-amber-500/30 flex items-center justify-center'>
                         <Megaphone className='w-5 h-5 text-amber-400' />
                       </div>
                       <div>
                         <span className='font-medium text-amber-500 text-sm uppercase tracking-wider'>Community Feed</span>
                         <p className='text-slate-400 text-xs'>Connect with fellow attendees</p>
                       </div>
                     </div>
                     <div className='flex items-center gap-2 mb-3'>
                       <div className='flex -space-x-2'>
                         {getEventParticipants(selectedEvent).slice(0, 3).map(user => (
                           <img key={user.id} src={user.avatar} alt={user.name}
                             className='w-7 h-7 rounded-full border-2 border-slate-900/50' />
                         ))}
                         {getEventParticipants(selectedEvent).length > 3 && (
                           <div className='w-7 h-7 rounded-full bg-slate-800/80 border-2 border-slate-900/50 flex items-center justify-center text-xs text-slate-500'>
                             +{getEventParticipants(selectedEvent).length - 3}
                           </div>
                         )}
                       </div>
                       <span className='text-xs text-slate-500'>{getEventParticipants(selectedEvent).length} attendees</span>
                     </div>
                   </motion.div>
                 )}

                 {/* Broadcast Panel for Hosts (inside community) */}
                 {activeRole === "host" && activeTab === "community" && (
                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                     className='p-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent'>
                     <div className='flex items-center gap-3 mb-3'>
                       <Crown className='w-5 h-5 text-amber-500' />
                       <span className='font-medium text-amber-500'>Host Broadcast</span>
                     </div>
                     <form onSubmit={handleBroadcast} className='flex gap-2'>
                        <input type='text' value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder='Send announcement to all event participants...' className='flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none' />
                       <button type='submit' disabled={!broadcastMessage.trim()} className='px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-lg font-medium text-sm disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-amber-500/20'>
                         <span className='flex items-center gap-1'>
                           <Megaphone className='w-4 h-4' />
                           Broadcast
                         </span>
                       </button>
                     </form>
                   </motion.div>
                 )}

                {/* Messages Area */}
                <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar'>
                  {messages.length === 0 ? (
                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                       className='flex flex-col items-center justify-center h-full text-center py-12'>
                       <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-800/50 flex items-center justify-center mb-4 shadow-lg'>
                         {activeTab === "community" ? (
                           <MessageSquare className='w-10 h-10 text-slate-600' />
                         ) : (
                           <Users className='w-10 h-10 text-slate-600' />
                         )}
                       </div>
                       <p className='text-slate-400 font-medium text-lg mb-2'>
                         {activeTab === "community" ? "No community messages yet" : (selectedUser ? `Start a conversation with ${selectedUser.name}` : "Select a user to start chatting")}
                       </p>
                       <p className='text-slate-600 text-sm'>
                         {activeTab === "community" ? (
                           <>
                             {activeRole === "host" ? "Post an announcement or start the conversation!" : "Be the first to post in the community feed!"}
                           </>
                         ) : (activeRole === "host" && !selectedUser ? "Select an attendee to message them directly" : "Send a message to break the ice 👋")}
                       </p>
                     </motion.div>
                  ) : (
                     <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className={'flex ' + (msg.senderRole === activeRole && !msg._alignLeft ? "justify-end" : "justify-start")}>
                             <div className={'group relative max-w-lg xl:max-w-md ' + (msg.senderRole === activeRole && !msg._alignLeft ? "" : "flex-row-reverse")}>
                               {msg.type === "community" && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                  className='absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-transparent rounded-full px-2 py-0.5'>
                                  <MessageSquare className='w-3 h-3 text-amber-400/60' />
                                  <span className='text-xs text-amber-400/60 font-medium'>Community</span>
                                </motion.div>
                              )}
                              <div className={`flex items-end gap-2 ${msg.senderRole === activeRole && !msg._alignLeft ? 'flex-row-reverse' : ''}`}>
                                {(msg.senderRole !== activeRole || activeTab === "community") && (
                                   <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                                     className={`w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg border ${
                                       msg.senderRole === "host" 
                                         ? "from-amber-500/20 to-amber-600/20 border-amber-500/30" 
                                         : "from-slate-700 to-slate-800 border-slate-600/50"
                                     }`}>
                                    <span className={'text-xs font-bold ' + (msg.senderRole === "host" ? "text-amber-400" : "text-slate-300")}>
                                      {(msg.senderName || msg.senderId?.charAt(0) || "?").toUpperCase()}
                                    </span>
                                  </motion.div>
                                )}
                            <div className={msg.senderRole === activeRole && !msg._alignLeft ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-2xl rounded-br-sm ml-8 px-4 py-2.5 shadow-lg shadow-amber-500/20 group-hover:shadow-xl transition-all duration-300 relative" : (msg.type === "community" ? "bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-slate-200 border border-amber-500/20 rounded-2xl rounded-bl-sm mr-8 px-4 py-2.5 shadow-lg group-hover:shadow-xl transition-all duration-300 relative backdrop-blur-sm" : "bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-slate-700/50 rounded-2xl rounded-bl-sm mr-8 px-4 py-2.5 shadow-lg group-hover:shadow-xl transition-all duration-300 relative")}>
                                      {msg.senderRole !== activeRole && mockAllUsers.find(u => u.id === msg.senderId)?.isPremium && (
                                        <Star className='w-3 h-3 text-amber-400 absolute -top-1 -right-1' />
                                      )}
                                      {msg.senderRole === "host" && activeTab === "community" && msg.senderRole !== activeRole && (
                                        <Crown className='w-3 h-3 text-amber-400 absolute -top-1 -right-1' />
                                      )}
                                      <p className='text-sm leading-relaxed break-words'>{msg.content}</p>
                                  <div className='flex items-center justify-between mt-1.5'>
                                    {msg.senderName && msg.senderRole !== activeRole && (
                                      <span className='text-[10px] font-medium text-amber-400/80 uppercase tracking-wide'>
                                        {msg.senderName}
                                      </span>
                                    )}
                                    {msg.senderRole === activeRole && (
                                      <span className='text-[10px] opacity-40 font-mono'>{msg.timestamp}</span>
                                    )}
                                    {msg.senderRole === activeRole && (
                                      <span className='flex items-center gap-0.5'>
                                        {msg.seen ? <CheckCheck className='w-3 h-3 text-slate-400' /> : <Check className='w-3 h-3 text-slate-400' />}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                     </AnimatePresence>
                  )}
                  <div ref={chatEndRef} />
                </div>

                 {/* Message Input */}
                 {activeTab === "direct" && (activeRole === "user" || selectedUser) && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='p-4 border-t border-slate-800/50 bg-slate-900/30'>
                     <form onSubmit={handleSendMessage} className='flex items-end gap-3'>
                       <button type='button' className='p-2.5 text-slate-500 hover:text-amber-500 rounded-xl hover:bg-slate-800/50 transition-all' title='Add emoji'>
                         <Smile className='w-5 h-5' />
                       </button>
                       <input type='text' value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                         placeholder={activeRole === "host" ? `Message ${selectedUser?.name || "attendee"}...` : `Message host...`}
                         className='flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all' />
                       <button type='submit' disabled={!newMessage.trim()} className='px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center gap-2'>
                         <Send className='w-4 h-4' />
                         Send
                       </button>
                     </form>
                   </motion.div>
                 )}

                 {/* Community Message Input */}
                 {activeTab === "community" && selectedEvent && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='p-4 border-t border-slate-800/50 bg-slate-900/30'>
                     <div className='flex items-center gap-2 mb-3'>
                       <div className='w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 border border-amber-500/30 flex items-center justify-center'>
                         <MessageSquare className='w-4 h-4 text-amber-400' />
                       </div>
                       <span className='text-sm text-slate-400'>Post to community feed</span>
                       {activeRole === "host" && (
                         <span className='ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium'>
                           <Crown className='w-3 h-3' />
                           Host
                         </span>
                       )}
                     </div>
                     <form onSubmit={handleSendMessage} className='flex gap-2'>
                       <input type='text' value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                         placeholder={activeRole === "host" ? "Share an announcement with all attendees..." : "Share your thoughts with the community..."}
                         className='flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all' />
                       <button type='submit' disabled={!newMessage.trim()} className='px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center gap-2'>
                         <Send className='w-4 h-4' />
                         Post
                       </button>
                     </form>
                   </motion.div>
                 )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex-1 flex items-center justify-center text-center p-8'>
                <div className='max-w-md'>
                  <div className='w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-800/50 mx-auto mb-6 flex items-center justify-center'>
                    <Users className='w-12 h-12 text-slate-700' />
                  </div>
                  <h3 className='text-2xl font-serif text-white mb-3'>Welcome, {activeRole === "host" ? "Host" : "Back"}</h3>
                  <p className='text-slate-400 mb-6 leading-relaxed'>{activeRole === "host" ? "Select an event to message attendees and manage community." : "Select an event to chat with hosts and attendees."}</p>
                  <div className='flex flex-wrap gap-2 justify-center'>
                    {mockEvents.slice(0, 3).map(e => (
                      <motion.button key={e.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedEvent(e.id)} className='px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-full text-sm text-slate-300 transition-all'>
                        {e.title}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Floating Action Button */}
        <AnimatePresence>
          {selectedEvent && activeTab === "community" && activeRole === "user" && (
            <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              className='fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/30 flex items-center justify-center hover:scale-110 transition-all'
              onClick={() => document.querySelector("form[onSubmit*='handleSendMessage']")?.scrollIntoView({ behavior: "smooth" })}>
              <Send className='w-5 h-5' />
            </motion.button>
          )}
         </AnimatePresence>
       </div>
     </div>
    );
  };

  export default CommunityChat;