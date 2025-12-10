const OpenAI = require('openai');
const Chat = require('../models/Chat');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 2048,
      temperature: 0.7
    });

    const responseMessage = completion.choices[0].message.content;

    const chat = new Chat({
      userId,
      message,
      response: responseMessage,
      metadata: {
        model: completion.model,
        tokens: completion.usage.total_tokens
      }
    });

    await chat.save();

    res.json({
      message: responseMessage,
      chatId: chat._id,
      tokens: completion.usage.total_tokens
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};

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
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

exports.clearChatHistory = async (req, res) => {
  try {
    const userId = req.userId;

    await Chat.deleteMany({ userId });

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
};
