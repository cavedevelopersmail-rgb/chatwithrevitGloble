const Chat = require("../models/Chat");
const OpenAI = require("openai");

// 1. Import OpenAI Agents SDK
const {
  fileSearchTool,
  webSearchTool,
  Agent,
  Runner,
} = require("@openai/agents");

// 2. Setup Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- AGENT CONFIGURATION START ---

// Define the File Search Tool
// Note: Ensure this Vector Store ID (vs_...) exists in your OpenAI Dashboard
const fileSearch = fileSearchTool(["vs_69358b9c6b0c8191a5d6b1cd5f5cc568"]);

// Define the Web Search Tool
const webSearchPreview = webSearchTool({
  userLocation: {
    type: "approximate",
    country: "GB",
    region: undefined,
    city: undefined,
    timezone: undefined,
  },
  searchContextSize: "medium",
  filters: {
    allowed_domains: ["www.cqc.org.uk", "www.england.nhs.uk"],
  },
});

const complianceHouse = new Agent({
  name: "COMPLIANCE HOUSE",
  instructions: `You are 'Compliance House', a warm, human-like Support Agent dedicated to UK Healthcare (NHS) professionals. Your goal is to make compliance (DBS checks, Right to Work, training) and professional communication easy and stress-free.

### **CORE BEHAVIOR & PERSONA**
- **Act Human, Not Robotic:** Do not say "I am an AI" or "According to the search results." Speak like a helpful support colleague.
- **Friendly & Professional:** Use a warm, WhatsApp-style tone (short sentences, occasional friendly emojis like 😊 or ✅).
- **NO LINKS ALLOWED:** Never just dump a URL. You must read the search result yourself and explain the *exact steps* or the *answer* to the user. The user wants a solution, not a reading list.
- **NHS/UK Context Only:** Every answer must be framed within UK Healthcare and NHS regulations.

### **OPERATIONAL RULES**

**1. MANDATORY SEARCH (Web & Files)**
- For every query, YOU MUST perform a Web Search and/or File Search.
- **Search Query Formatting:** Always append terms like "UK NHS", "UK Healthcare Compliance", or "UK DBS check" to your search queries to ensure relevance.
- **Verification:** Only use facts found in the files or current web results. Do not guess.

**2. HANDLING COMPLIANCE (DBS, Police Checks, Documents)**
- specific details. E.g., Instead of sending a link to Gov.uk, say: "To fix your DBS, you need to log in to the update service and select option X. Here is what you need..."
- If a user is confused, guide them step-by-step.

**3. PROFESSIONAL COMMUNICATION ASSISTANT**
- If a user asks how to reply to a boss, agency, or colleague, do not just give advice—**write the draft for them.**
- Create professional, polite, and industry-appropriate email or chat drafts that the user can copy and paste.
- Teach them *why* a certain tone is used (e.g., "In the NHS, it's best to be formal with safeguarding concerns. Here is a draft you can use...").

**4. OUTPUT FORMAT (WhatsApp Style)**
- Keep it concise.
- Use bullet points for steps.
- If the information is not found in files or web, say: "I checked everywhere, but I can't find specific info on that right now. Could you clarify exactly what you need? 😊"

### **STEPS FOR ANSWERING**
1. **Analyze:** Is this about Compliance, Healthcare rules, or Professional Writing?
2. **Search:** Search specifically for *UK NHS* rules regarding the topic.
3. **Synthesize:** Extract the solution (not the link).
4. **Draft:** Write a friendly response. If they asked for an email draft, write it out clearly.
5. **Review:** Did I include a link? If yes, remove it and replace it with the explanation.

**Reminder:** You are a Support Agent. You fix problems, you don't just point to them.`,
  // Ensure you use a valid model available in your environment
  model: "gpt-4o",
  tools: [fileSearch, webSearchPreview],
  modelSettings: {
    temperature: 0.7, // Slightly lower to keep compliance info accurate but still friendly
    topP: 1,
    maxTokens: 2048,
    store: true,
  },
});

// Helper function to run the workflow
async function runWorkflow(inputText) {
  const conversationHistory = [
    { role: "user", content: [{ type: "input_text", text: inputText }] },
  ];

  const runner = new Runner({
    traceMetadata: {
      _trace_source_: "agent-builder",
      workflow_id: "wf_69358a2640a08190a0de15e619296bd201932ce0c2c0dd94",
    },
  });

  const complianceHouseResultTemp = await runner.run(complianceHouse, [
    ...conversationHistory,
  ]);

  if (!complianceHouseResultTemp.finalOutput) {
    throw new Error("Agent result is undefined");
  }

  return {
    output_text: complianceHouseResultTemp.finalOutput ?? "",
  };
}

// --- AGENT CONFIGURATION END ---

// 3. Updated sendMessage Controller
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Check if API key is present
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API Key not configured" });
    }

    let responseMessage;
    let modelName = "compliance-house-agent";

    try {
      // EXECUTE THE AGENT WORKFLOW HERE
      console.log("Running Compliance House Agent...");
      const agentResult = await runWorkflow(message);
      responseMessage = agentResult.output_text;
    } catch (apiError) {
      console.error("Agent Workflow Error:", apiError);
      return res.status(500).json({
        error: "Failed to get response from AI Agent",
        details: apiError.message,
      });
    }

    // Save to Database
    const chat = new Chat({
      userId,
      message,
      response: responseMessage,
      metadata: {
        model: modelName,
        tokens: 0, // Agents API token counting is complex, defaulting to 0 or leave empty
      },
    });

    await chat.save();

    res.json({
      message: responseMessage,
      chatId: chat._id,
      tokens: 0,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
};

// 4. Existing History Functions (Unchanged)
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, skip = 0 } = req.query;

    const chats = await Chat.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Chat.countDocuments({ userId });

    res.json({
      chats,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ error: "Failed to retrieve chat history" });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
};

exports.clearChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    await Chat.deleteMany({ userId });
    res.json({ message: "Chat history cleared successfully" });
  } catch (error) {
    console.error("Clear chat history error:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
};
