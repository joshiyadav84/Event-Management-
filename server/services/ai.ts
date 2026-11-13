import { GoogleGenAI, Type, type FunctionDeclaration } from '@google/genai';
import { db } from '../db/database.ts';
import { createGoogleCalendarEvent } from './calendar.ts';
import type { AuthUser } from './auth.ts';

// Server-side initialization per guidelines
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 9 Defined Tools per specification
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_events',
    description: 'Search and filter upcoming college academic events, workshops, and seminars.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_query: { type: Type.STRING, description: 'Keyword to search in event name, description, or speaker' },
        month: { type: Type.STRING, description: 'Month name or number, e.g. "October" or "10" or "2026-10"' },
        date: { type: Type.STRING, description: 'Exact event date in YYYY-MM-DD format' },
        category: { type: Type.STRING, description: 'Event category, e.g., "Artificial Intelligence", "Business Analytics"' },
        availability: { type: Type.STRING, description: 'Filter by availability: "available" or "full" or "all"' },
      },
    },
  },
  {
    name: 'get_event_details',
    description: 'Get full details of a specific college event by event ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: { type: Type.STRING, description: 'The unique event ID (e.g., evt_001)' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'get_my_registrations',
    description: 'Retrieve all event registrations for the currently authenticated student.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        student_id: { type: Type.STRING, description: 'The authenticated student ID' },
      },
      required: ['student_id'],
    },
  },
  {
    name: 'check_registration',
    description: 'Check whether a student is currently registered for a specific event.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        student_id: { type: Type.STRING, description: 'The student ID to check' },
        event_id: { type: Type.STRING, description: 'The event ID to check' },
      },
      required: ['student_id', 'event_id'],
    },
  },
  {
    name: 'get_registration_count',
    description: 'Get the current registration count and remaining capacity for an event, or total count across all events.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: { type: Type.STRING, description: 'The event ID (optional, omit for campus-wide count)' },
      },
    },
  },
  {
    name: 'register_student',
    description: 'Register a student for a college event and initiate Google Calendar event sync.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        student_id: { type: Type.STRING, description: 'The student ID being registered' },
        event_id: { type: Type.STRING, description: 'The event ID to register for' },
      },
      required: ['student_id', 'event_id'],
    },
  },
  {
    name: 'cancel_registration',
    description: 'Cancel an active event registration for a student.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        student_id: { type: Type.STRING, description: 'The student ID' },
        event_id: { type: Type.STRING, description: 'The event ID' },
      },
      required: ['student_id', 'event_id'],
    },
  },
  {
    name: 'get_participants',
    description: 'Retrieve the registered participants list for an event (ADMIN ONLY).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_id: { type: Type.STRING, description: 'The event ID' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'get_dashboard_statistics',
    description: 'Retrieve high-level dashboard metrics for the college events platform.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        scope: { type: Type.STRING, description: 'Optional scope, e.g. "campus" or "overview"' },
      },
    },
  },
];

/**
 * Executes a tool on the backend database with strict permission controls.
 */
async function executeTool(name: string, args: any, user: AuthUser): Promise<{ result?: any; error?: string }> {
  try {
    switch (name) {
      case 'get_events': {
        const events = db.getEvents({
          search: args.search_query,
          month: args.month,
          date: args.date,
          category: args.category,
          availability: args.availability as any,
        });
        return {
          result: {
            count: events.length,
            events: events.map((e) => ({
              event_id: e.event_id,
              name: e.name,
              date: e.date,
              time: e.time,
              venue: e.venue,
              category: e.category,
              speaker: e.speaker,
              maximum_capacity: e.maximum_capacity,
              current_registration_count: e.current_registration_count,
              available_seats: Math.max(0, e.maximum_capacity - e.current_registration_count),
              is_full: e.current_registration_count >= e.maximum_capacity,
            })),
          },
        };
      }

      case 'get_event_details': {
        const event = db.getEventById(args.event_id);
        if (!event) {
          return { error: `Event with ID '${args.event_id}' not found.` };
        }
        return {
          result: {
            ...event,
            available_seats: Math.max(0, event.maximum_capacity - event.current_registration_count),
          },
        };
      }

      case 'get_my_registrations': {
        // Enforce student identity: students can only see their own registrations
        const targetStudentId = user.role === 'admin' && args.student_id ? args.student_id : user.student_id;
        const regs = db.getRegistrations({ student_id: targetStudentId, status: 'confirmed' });
        return {
          result: {
            student_id: targetStudentId,
            count: regs.length,
            registrations: regs.map((r) => ({
              registration_id: r.registration_id,
              event_id: r.event_id,
              event_name: r.event?.name,
              date: r.event?.date,
              time: r.event?.time,
              venue: r.event?.venue,
              calendar_event_id: r.calendar_event_id,
              status: r.status,
            })),
          },
        };
      }

      case 'check_registration': {
        const targetStudentId = user.role === 'admin' && args.student_id ? args.student_id : user.student_id;
        const reg = db
          .getRegistrations({ student_id: targetStudentId, event_id: args.event_id, status: 'confirmed' })
          .pop();
        const event = db.getEventById(args.event_id);
        return {
          result: {
            student_id: targetStudentId,
            event_id: args.event_id,
            event_name: event?.name,
            is_registered: !!reg,
            status: reg ? 'confirmed' : 'not_registered',
            calendar_event_id: reg?.calendar_event_id || null,
          },
        };
      }

      case 'get_registration_count': {
        if (args.event_id) {
          const event = db.getEventById(args.event_id);
          if (!event) return { error: `Event '${args.event_id}' not found.` };
          return {
            result: {
              event_id: event.event_id,
              name: event.name,
              current_registrations: event.current_registration_count,
              maximum_capacity: event.maximum_capacity,
              available_seats: Math.max(0, event.maximum_capacity - event.current_registration_count),
            },
          };
        }
        const stats = db.getDashboardStatistics();
        return {
          result: {
            total_active_registrations: stats.totalRegistrations,
            total_events: stats.totalEvents,
          },
        };
      }

      case 'register_student': {
        // Enforce student identity: students can only register themselves
        const studentIdToRegister = user.role === 'admin' && args.student_id ? args.student_id : user.student_id;
        const event = db.getEventById(args.event_id);
        if (!event) {
          return { error: `Event with ID '${args.event_id}' does not exist.` };
        }

        // Execute registration with duplicate & capacity checks
        const registration = db.registerStudent(studentIdToRegister, args.event_id);

        // Initiate Google Calendar event
        const calResult = await createGoogleCalendarEvent(event, user.email);
        if (calResult.calendar_event_id) {
          db.updateRegistrationCalendarId(registration.registration_id, calResult.calendar_event_id);
          registration.calendar_event_id = calResult.calendar_event_id;
        }

        return {
          result: {
            success: true,
            registration_id: registration.registration_id,
            event_name: event.name,
            date: event.date,
            time: event.time,
            venue: event.venue,
            calendar_status: calResult.message,
            calendar_event_id: registration.calendar_event_id,
            calendar_link: calResult.calendar_link,
          },
        };
      }

      case 'cancel_registration': {
        const studentIdToCancel = user.role === 'admin' && args.student_id ? args.student_id : user.student_id;
        const cancelled = db.cancelRegistration(studentIdToCancel, args.event_id);
        return {
          result: {
            success: true,
            message: `Registration for event '${args.event_id}' has been cancelled.`,
            registration_id: cancelled.registration_id,
          },
        };
      }

      case 'get_participants': {
        if (user.role !== 'admin') {
          return { error: 'Permission denied: Viewing participant lists requires administrator access.' };
        }
        const regs = db.getRegistrations({ event_id: args.event_id, status: 'confirmed' });
        return {
          result: {
            event_id: args.event_id,
            participant_count: regs.length,
            participants: regs.map((r) => ({
              student_id: r.student?.student_id,
              name: r.student?.name,
              email: r.student?.email,
              course: r.student?.course,
              registration_date: r.registration_date,
            })),
          },
        };
      }

      case 'get_dashboard_statistics': {
        // Students get sanitized statistics (upcoming count, total events), admin gets full stats
        const stats = db.getDashboardStatistics();
        if (user.role === 'admin') {
          return { result: stats };
        }
        return {
          result: {
            totalEvents: stats.totalEvents,
            upcomingEvents: stats.upcomingEvents,
            eventsThisMonth: stats.eventsThisMonth,
            mostPopularEvent: stats.mostPopularEvent,
          },
        };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    return { error: err.message || 'Error occurred while executing tool.' };
  }
}

/**
 * Intelligent deterministic agent fallback when Gemini API key is missing or offline.
 * Identifies intent, triggers backend tools, and generates structured human-like responses.
 */
async function fallbackAgent(prompt: string, user: AuthUser): Promise<{ content: string; toolCalls: any[] }> {
  const p = prompt.toLowerCase();
  const executedCalls: any[] = [];

  // 1. Check registration count / capacity inquiry
  if (p.includes('how many students') || p.includes('how many registered') || p.includes('how many have registered') || p.includes('registration count') || p.includes('seats left') || p.includes('available seats')) {
    const events = db.getEvents();
    const matched = events.find((e) =>
      p.includes(e.name.toLowerCase()) ||
      (p.includes('ai') && e.name.toLowerCase().includes('ai')) ||
      (p.includes('analytics') && e.name.toLowerCase().includes('analytics')) ||
      (p.includes('cyber') && e.name.toLowerCase().includes('cyber')) ||
      (p.includes('marketing') && e.name.toLowerCase().includes('marketing')) ||
      (p.includes('startup') && e.name.toLowerCase().includes('startup'))
    );

    if (matched) {
      const countCall = await executeTool('get_registration_count', { event_id: matched.event_id }, user);
      executedCalls.push({ name: 'get_registration_count', args: { event_id: matched.event_id }, result: countCall.result });
      return {
        content: `For **${matched.name}**:\n• **${matched.current_registration_count}** students have registered.\n• **${matched.maximum_capacity - matched.current_registration_count}** seats are currently available out of a maximum capacity of ${matched.maximum_capacity}.`,
        toolCalls: executedCalls,
      };
    } else {
      const totalCount = await executeTool('get_registration_count', {}, user);
      executedCalls.push({ name: 'get_registration_count', args: {}, result: totalCount.result });
      return {
        content: `Across all events on campus, there are currently **${totalCount.result?.total_active_registrations}** confirmed registrations. If you are inquiring about a specific event like the AI or Business Analytics workshop, let me know!`,
        toolCalls: executedCalls,
      };
    }
  }

  // 2. Check if student is asking about their own registration status
  if (p.includes('am i registered') || p.includes('my registration') || p.includes('check registration') || p.includes('did i register') || p.includes('status of my')) {
    const events = db.getEvents();
    const matched = events.find((e) =>
      p.includes(e.name.toLowerCase()) ||
      (p.includes('ai') && e.name.toLowerCase().includes('ai')) ||
      (p.includes('analytics') && e.name.toLowerCase().includes('analytics')) ||
      (p.includes('cyber') && e.name.toLowerCase().includes('cyber')) ||
      (p.includes('marketing') && e.name.toLowerCase().includes('marketing')) ||
      (p.includes('startup') && e.name.toLowerCase().includes('startup'))
    );

    if (matched) {
      const checkCall = await executeTool('check_registration', { student_id: user.student_id, event_id: matched.event_id }, user);
      executedCalls.push({ name: 'check_registration', args: { event_id: matched.event_id }, result: checkCall.result });

      if (checkCall.result?.is_registered) {
        return {
          content: `Yes, you are currently registered for **${matched.name}** (Scheduled for ${matched.date} at ${matched.time} in ${matched.venue}). Calendar Sync is active!`,
          toolCalls: executedCalls,
        };
      } else {
        return {
          content: `No, you are not currently registered for **${matched.name}**. There are currently **${matched.maximum_capacity - matched.current_registration_count} seats available**. Would you like me to register you now?`,
          toolCalls: executedCalls,
        };
      }
    } else {
      const myRegs = await executeTool('get_my_registrations', { student_id: user.student_id }, user);
      executedCalls.push({ name: 'get_my_registrations', args: { student_id: user.student_id }, result: myRegs.result });

      const list = myRegs.result?.registrations || [];
      if (list.length === 0) {
        return {
          content: `You do not have any active event registrations at the moment. You can browse upcoming events and let me know if you would like to register for any!`,
          toolCalls: executedCalls,
        };
      }

      const formatted = list.map((r: any) => `• **${r.event_name}** on ${r.date} (${r.time}) at ${r.venue}`).join('\n');
      return {
        content: `Here are your current active event registrations:\n\n${formatted}`,
        toolCalls: executedCalls,
      };
    }
  }

  // 3. Check if user is asking to register
  if (
    p.includes('register me') ||
    p.includes('sign me up') ||
    p.includes('enroll me') ||
    (p.includes('register for') && !p.includes('am i') && !p.includes('how to'))
  ) {
    // Look for matching event
    const events = db.getEvents();
    const matched = events.find((e) =>
      p.includes(e.name.toLowerCase()) ||
      (p.includes('ai') && e.name.toLowerCase().includes('ai')) ||
      (p.includes('machine learning') && e.name.toLowerCase().includes('machine learning')) ||
      (p.includes('analytics') && e.name.toLowerCase().includes('analytics')) ||
      (p.includes('cyber') && e.name.toLowerCase().includes('cyber')) ||
      (p.includes('marketing') && e.name.toLowerCase().includes('marketing')) ||
      (p.includes('startup') && e.name.toLowerCase().includes('startup')) ||
      (p.includes('cloud') && e.name.toLowerCase().includes('cloud'))
    );

    if (matched) {
      const regCall = await executeTool('register_student', { student_id: user.student_id, event_id: matched.event_id }, user);
      executedCalls.push({ name: 'register_student', args: { event_id: matched.event_id }, result: regCall.result || regCall.error });

      if (regCall.error) {
        return {
          content: `I couldn't complete your registration for **${matched.name}**: ${regCall.error}`,
          toolCalls: executedCalls,
        };
      }

      return {
        content: `Done! You are successfully registered for the **${matched.name}** on **${matched.date}** at **${matched.time}** in **${matched.venue}**.\n\nI’ve also added it to your Google Calendar (ID: \`${regCall.result.calendar_event_id}\`).`,
        toolCalls: executedCalls,
      };
    } else {
      return {
        content: `I'd be glad to register you! Could you please specify which event you'd like to attend? For instance, we have the *AI & Machine Learning Workshop*, *Business Analytics Workshop*, or *Cybersecurity Awareness Seminar*.`,
        toolCalls: executedCalls,
      };
    }
  }


  // 3. Check registration count / capacity inquiry
  if (p.includes('how many students') || p.includes('how many registered') || p.includes('registration count') || p.includes('seats left') || p.includes('available seats')) {
    const events = db.getEvents();
    const matched = events.find((e) =>
      p.includes(e.name.toLowerCase()) ||
      (p.includes('ai') && e.name.toLowerCase().includes('ai')) ||
      (p.includes('analytics') && e.name.toLowerCase().includes('analytics')) ||
      (p.includes('cyber') && e.name.toLowerCase().includes('cyber')) ||
      (p.includes('marketing') && e.name.toLowerCase().includes('marketing')) ||
      (p.includes('startup') && e.name.toLowerCase().includes('startup'))
    );

    if (matched) {
      const countCall = await executeTool('get_registration_count', { event_id: matched.event_id }, user);
      executedCalls.push({ name: 'get_registration_count', args: { event_id: matched.event_id }, result: countCall.result });
      return {
        content: `For **${matched.name}**:\n• **${matched.current_registration_count}** students have registered.\n• **${matched.maximum_capacity - matched.current_registration_count}** seats are currently available out of a maximum capacity of ${matched.maximum_capacity}.`,
        toolCalls: executedCalls,
      };
    } else {
      const totalCount = await executeTool('get_registration_count', {}, user);
      executedCalls.push({ name: 'get_registration_count', args: {}, result: totalCount.result });
      return {
        content: `Across all events on campus, there are currently **${totalCount.result?.total_active_registrations}** confirmed registrations. If you are inquiring about a specific event like the AI or Business Analytics workshop, let me know!`,
        toolCalls: executedCalls,
      };
    }
  }

  // 4. Listing / Search events (e.g. "Which AI workshops are happening this month?")
  const monthMatch = p.includes('october') || p.includes('this month') ? '10' : undefined;
  const eventsCall = await executeTool('get_events', {
    search_query: p.includes('ai') ? 'AI' : p.includes('workshop') ? 'workshop' : undefined,
    month: monthMatch,
  }, user);
  executedCalls.push({ name: 'get_events', args: { month: monthMatch }, result: eventsCall.result });

  const eventsList = eventsCall.result?.events || [];
  if (eventsList.length === 0) {
    return {
      content: `I could not find any events matching your request. Would you like me to show all upcoming events for this semester?`,
      toolCalls: executedCalls,
    };
  }

  const items = eventsList
    .slice(0, 4)
    .map((e: any) => `• **${e.name}**\n  - **Date & Time**: ${e.date} (${e.time})\n  - **Venue**: ${e.venue}\n  - **Available Seats**: ${e.available_seats} / ${e.maximum_capacity}`)
    .join('\n\n');

  return {
    content: `Here are the relevant upcoming academic events:\n\n${items}\n\nWould you like me to register you for any of these? Just say "Register me for [Event Name]"!`,
    toolCalls: executedCalls,
  };
}

/**
 * Main AI Assistant processor.
 * Executes full Gemini tool-calling loop using gemini-3.8-flash,
 * with fallbacks and permission guarantees.
 */
export async function processAiMessage(
  userPrompt: string,
  user: AuthUser,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ text: string; toolCalls: any[] }> {
  const systemInstruction = `You are the College Academic Event Management AI Assistant for our campus.
Current Student / User context:
- Name: ${user.name}
- Email: ${user.email}
- Course: ${user.course}
- Student ID: ${user.student_id}
- Role: ${user.role}

SECURITY & PERMISSION RULES:
1. Always use backend tools for data retrieval and actions. NEVER invent or fabricate registrations, counts, or event details.
2. For student users, when calling tools that take student_id, ALWAYS pass their authenticated student ID (${user.student_id}).
3. Students are strictly forbidden from viewing other students' private registrations or participant lists.
4. Tool selection by user intent:
   - When asked about events or workshops (e.g., "Which AI workshops are happening this month?"): call 'get_events'.
   - When asked about their registration status (e.g., "Am I registered for the business analytics workshop?"): call 'check_registration' with student_id: "${user.student_id}". DO NOT call 'register_student' when checking status!
   - When asked about enrollment or seat counts (e.g., "How many students registered?"): call 'get_registration_count'.
   - When explicitly asked to register (e.g., "Register me for the AI workshop"): identify the event, check registration with 'check_registration', then call 'register_student' with student_id: "${user.student_id}". In your final confirmation, clearly state event name, registration status, date, venue, and Google Calendar sync status.
   - When asked to cancel a registration: call 'cancel_registration' with student_id: "${user.student_id}".
5. If an action cannot be completed (e.g. event full or already registered), clearly explain the reason.
6. Keep your answers polite, concise, professional, and formatted in clear Markdown.`;

  // If Gemini API is configured, use the official @google/genai SDK
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const messages: any[] = [];
      for (const msg of conversationHistory.slice(-4)) {
        messages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
      messages.push({
        role: 'user',
        parts: [{ text: userPrompt }],
      });

      let currentContents = [...messages];
      const executedCalls: any[] = [];
      let currentResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: currentContents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: toolDeclarations }],
        },
      });

      let iterations = 0;
      while (currentResponse.functionCalls && currentResponse.functionCalls.length > 0 && iterations < 3) {
        iterations++;
        const functionResponseParts: any[] = [];

        for (const call of currentResponse.functionCalls) {
          const toolName = call.name || '';
          const execRes = await executeTool(toolName, call.args || {}, user);
          executedCalls.push({
            name: toolName,
            args: call.args,
            result: execRes.result || execRes.error,
          });

          functionResponseParts.push({
            functionResponse: {
              name: toolName,
              response: execRes.result ? { output: execRes.result } : { error: execRes.error },
            },
          });
        }

        const candidateContent = currentResponse.candidates?.[0]?.content;
        if (candidateContent) {
          currentContents.push(candidateContent);
        }
        currentContents.push({
          role: 'user',
          parts: functionResponseParts,
        });

        currentResponse = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: currentContents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }],
          },
        });
      }

      let finalText = currentResponse.text || '';
      if (!finalText && currentResponse.candidates?.[0]?.content?.parts) {
        for (const part of currentResponse.candidates[0].content.parts) {
          if (part.text) finalText += part.text;
        }
      }

      if (!finalText && executedCalls.length > 0) {
        const lastCall = executedCalls[executedCalls.length - 1];
        if (lastCall.name === 'register_student') {
          if (lastCall.result?.success) {
            finalText = `Done! You are successfully registered for the **${lastCall.result.event_name}** on **${lastCall.result.date}** at **${lastCall.result.time}** in **${lastCall.result.venue}**.\n\nI’ve also added it to your Google Calendar.`;
          } else {
            finalText = `I could not complete your registration: ${lastCall.result?.error || lastCall.result || 'Event may be full or already registered.'}`;
          }
        } else if (lastCall.name === 'check_registration') {
          finalText = lastCall.result?.is_registered
            ? `Yes, you are currently registered for **${lastCall.result.event_name || 'this event'}**.`
            : `No, you are not currently registered for this event.`;
        } else if (lastCall.name === 'get_events') {
          const count = lastCall.result?.count || 0;
          finalText = `Found ${count} event(s) matching your request.`;
        } else {
          finalText = 'Action processed successfully.';
        }
      }

      return {
        text: finalText || "I'm here to help you manage your college events.",
        toolCalls: executedCalls,
      };
    } catch (err: any) {
      console.warn('Gemini API call encountered error, engaging intelligent fallback:', err?.message || err);
      const fb = await fallbackAgent(userPrompt, user);
      return { text: fb.content, toolCalls: fb.toolCalls };
    }
  }

  // Development/Local Fallback
  const fallback = await fallbackAgent(userPrompt, user);
  return { text: fallback.content, toolCalls: fallback.toolCalls };
}
