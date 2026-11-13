import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/client.ts';
import { CollegeEvent, Registration } from '../types/index.ts';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Wrench,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiAssistantPageProps {
  onEventRegistered?: () => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: {
    name: string;
    args: any;
    result?: any;
  }[];
}

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({
  onEventRegistered,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I am your **College Academic Event Assistant** powered by Gemini AI.\n\nI can directly interact with the college events database and schedule events into your **Google Calendar**. Ask me anything like:\n• *"Which AI workshops are happening this month?"*\n• *"Am I registered for the business analytics workshop?"*\n• *"How many students registered for the cybersecurity seminar?"*\n• *"Register me for the AI workshop."*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle passed initial prompt from dashboard
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg: MessageItem = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Build lightweight conversation history
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.ai.chat(prompt, history);

      const aiMsg: MessageItem = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: res.toolCalls,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If a registration occurred via AI, celebrate with confetti & trigger refresh!
      const didRegister = res.toolCalls?.some(
        (t) => t.name === 'register_student' && t.result && t.result.success
      );
      if (didRegister) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onEventRegistered) onEventRegistered();
      }
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an issue: ${err.message || 'Failed to process request.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: `Chat history cleared. How can I assist you with college events today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const suggestedQueries = [
    'Which AI workshops are happening this month?',
    'Am I registered for the business analytics workshop?',
    'How many students registered for the AI workshop?',
    'Register me for the AI workshop',
    'Cancel my registration for AI workshop',
    'What cybersecurity seminars are available?',
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-300">
      {/* Top Assistant Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Gemini Event Assistant</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full">
                Tool Calling Active
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Authenticated as <strong className="text-slate-200">{user?.name}</strong> ({user?.role})
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Reset conversation"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {/* Markdown formatted text */}
                  <div>{msg.content}</div>

                  {/* Tool Call Badges if invoked */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Backend Function Execution:</span>
                      </div>
                      {msg.toolCalls.map((tool, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-xs font-mono space-y-1"
                        >
                          <div className="flex items-center justify-between text-indigo-300 font-semibold">
                            <span>⚡ {tool.name}()</span>
                            <span className="text-[10px] text-emerald-400 font-sans">Executed</span>
                          </div>
                          {tool.args && Object.keys(tool.args).length > 0 && (
                            <div className="text-[11px] text-slate-400 truncate">
                              args: {JSON.stringify(tool.args)}
                            </div>
                          )}
                          {tool.result?.calendar_link && (
                            <div className="pt-1">
                              <a
                                href={tool.result.calendar_link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline font-sans"
                              >
                                <CalendarDays className="w-3 h-3" />
                                <span>Open Google Calendar Event</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`text-[10px] text-slate-500 px-1 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              </div>
              <span className="text-slate-400">Consulting database & calendar tools...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts strip */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">Suggested:</span>
        {suggestedQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0 text-xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about events, seat availability, or say 'Register me for AI workshop'..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all shadow-md shadow-indigo-600/30 disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
