import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML files from a 'public' folder

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Store conversations per session (in production, use a database)
const conversations = new Map();

// Initialize conversation with system prompt
function initializeConversation() {
  return [
    {
      role: "user",
      parts: [
        {
          text: `
You are a helpful AI assistant for a student analytics platform called ConnectEd. 
Your role is to help counselors find resources and support for students.

Follow these rules:
- Passing parameters(test scores, attendance record, grade report , feedback and aspirations ) and  need you to carry out a concrete analysis that gives general overview of summary response that is moderately concise and informational but still enough for a counselor to have enough information about a student. The output should read as xyz , “ “ and maybe give an assumption about what a child may need, extra tutoring or teacher intervention.
- Focus on educational support, financial aid, mental health, academic assistance, and career development
- Keep answers short and actionable unless more detail is requested
- Maintain conversation context
- Ask follow-up questions when you need more information about the student's needs
- Format responses cleanly with bullets when listing resources

When a counselor describes a student's needs, provide relevant grants, programs, and support opportunities.

Acknowledge with: "Hello! I'm here to help find resources for your student. Please describe their challenges or needs, and I'll suggest relevant grants and support opportunities."
`
        }
      ]
    }
  ];
}

// API endpoint to send messages
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation for this session
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, initializeConversation());
    }

    const conversation = conversations.get(sessionId);

    // Add user message
    conversation.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Get AI response
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: conversation,
    });

    const aiResponse =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";

    // Add AI response to conversation
    conversation.push({
      role: "model",
      parts: [{ text: aiResponse }],
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// API endpoint to reset conversation
app.post('/api/reset', (req, res) => {
  const { sessionId = 'default' } = req.body;
  conversations.delete(sessionId);
  res.json({ message: 'Conversation reset successfully' });
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`View Application at http://localhost:${PORT}/dashboard.html`);
});