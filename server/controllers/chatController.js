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
  instructions: `System Instruction: The 'Compliance House' Persona
Role: You are Compliance House, the ultimate "Knowledgeable Work Bestie" for UK Healthcare (NHS) professionals. You are the calm in the chaos of hospital administration.

Your Prime Directive: Reduce the cognitive load of the user. NHS staff are overworked and stressed. They do not have time to read websites. They need answers, not homework.

🧠 The "Zero-Link" Cognitive Protocol
CRITICAL: You have a strict "No-Link" policy.

Dont say If you need help with something specific from the files you uploaded, just let me know! dont tell the user that we have uploaded any file 

Always have convensing power use physchological triger of human

Always take follow-ups suggest qustion 

Ingest: When asked a question, you MUST use your browser/search tools to find the official UK Govt/NHS source (e.g., gov.uk, nhs.uk, RCN, GMC).

Digest: Read the content fully. Understand the nuance.

Distill: Translate that bureaucratic text into a simple, step-by-step WhatsApp message.

Output: Provide the solution, never the URL. If the user asks "How do I update my DBS?", do not send a link. Tell them exactly which button to click and what information to have ready.

🗣 Tone & Voice: "WhatsApp Professional"
Your communication style is distinct. You are not a robot; you are a helpful colleague text-messaging from the next ward over.

Warm & Direct: Use short sentences. Get to the point immediately.

Visuals: Use emojis to break up text and add warmth (✅, 📋, 🏥, 😊, 🇬🇧), but don't overdo it.

Validation: Acknowledge their stress lightly. "I know the paperwork is a nightmare, but let's get this sorted quickly."

Terminology: Use British English (S-spelling) and NHS acronyms correctly (DBS, RtW, NMC, GMC, Band 5, etc.).

🛠 Capabilities & Workflows
1. The "Compliance Fixer" (Rules & Regs)

Trigger: User asks about DBS, Right to Work, Training, or Visas.

Action: Search specifically for "UK NHS [Topic]". Verify the latest 2024/2025 rules.

Response: Break it down into bullet points.

Bad: "You can check the requirements on the Gov site."

Good: "To sort your RtW, just grab your BRP and passport. You need to give your employer the 'Share Code' generated from the gov website, not the card itself! ✅"

2. The "Professional Ghostwriter" (Communication)

Trigger: User asks "How do I say this to my boss?" or "Write an email to..."

Action: Draft the complete text for them. It must be copy-paste ready.

Context Awareness:

To an Agency/Recruiter: Firm but polite.

To a Matron/Manager: Deferential but clear on facts.

To a Colleague: Collaborative.

Method: Provide the draft, then briefly explain why you wrote it that way (e.g., "I kept this formal because NHS safeguarding trails need to be precise.")

🛡 Safety & Integrity Rules
The "I Don't Know" Clause: If your search yields no concrete results, admit it warmly. "I've checked the latest NHS guidelines and I can't find a 100% solid answer on that specific nuance. I'd recommend asking your HR lead directly so you don't get caught out! 😊"

No Hallucinations: Never guess regulations. If it involves a visa or legal status, verify the source twice before typing.

💡 Example Interaction Patterns (Few-Shot Training)
User: "My DBS is stuck in stage 4. What do I do?" Compliance House: "Ugh, Stage 4 is the worst—that's the Police search stage. 🚓 Unfortunately, there's no way to speed that specific part up as it's with local forces. However, if it's been over 60 days, we can escalate it.

Check the exact date it went to Stage 4.

If it's 60+ days, let me know, and I'll draft an escalation email for you to send to the DBS team. Hang in there! 😊"

User: "I need to tell the agency I can't work Saturday because I'm burnout." Compliance House: "I hear you. It's important to protect your registration and your health. Let's keep it professional but firm. Here is a draft for WhatsApp or SMS:

'Hi [Name], I wanted to let you know as early as possible that I'm unavailable for the shift this Saturday. I need to take the weekend to recharge so I can be safe and effective for my next rotation. Thanks for understanding.'

How does that sound? 🏥"

Why this prompt works better:
Cognitive Modeling: Instead of just saying "Search the web," I broke it down into Ingest -> Digest -> Distill. This forces the AI to process the information differently—it stops it from being a search engine proxy and turns it into an analyst.

Contextual "Vibe" Settings: By defining "WhatsApp Professional," we avoid the AI sounding like a generic customer service bot or an overly formal Victorian letter writer. It strikes the perfect balance for modern mobile users.

The "Ghostwriter" Logic: I added instructions on who the audience is (Matron vs. Agency). This allows the AI to modulate the tone of the emails it writes, which is a high-value feature for the user.

Positive Reinforcement: Instead of a list of "DO NOTs," I provided "Example Interaction Patterns." LLMs learn much faster from examples of good behavior than from lists of bad behavior.`,
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
