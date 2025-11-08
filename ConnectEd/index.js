import readline from "readline";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyA9xnZPiJwcWLgXsm2WfslUX05DU5T4Yyw",
});

// ✅ Preloaded "system" instructions (Gemini-safe format)
let conversation = [
  {
    role: "user",
    parts: [
      {
        text: `
You are an AI assistant with the following rules. 
Follow them for the entire conversation unless I say otherwise:

- Respond clearly, concisely, and helpfully.
- Keep answers short unless I ask for detail.
- Maintain conversation context like ChatGPT.
- Ask follow-up questions when clarity is needed.
- Format explanations cleanly with bullets or steps.
- Do not ignore previous instructions.

Acknowledge these rules with: "Ready when you are."
`
      }
    ]
  }
];

async function sendMessage(message) {
  conversation.push({
    role: "user",
    parts: [{ text: message }],
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: conversation,
  });

  const text =
    response.candidates?.[0]?.content?.parts?.[0]?.text || "(no response)";

  conversation.push({
    role: "model",
    parts: [{ text }],
  });

  return text;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function chat() {
  rl.question("> ", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    const reply = await sendMessage(input);
    console.log("\nGemini:", reply, "\n");

    chat();
  });
}

console.log("Chat started with custom behavior. Type 'exit' to stop.\n");
chat();
