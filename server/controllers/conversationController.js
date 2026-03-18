const Conversation = require('../models/Conversation');
const Chat = require('../models/Chat');

exports.createConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;

    const conversation = new Conversation({
      userId,
      title: title || 'New Conversation'
    });

    await conversation.save();

    res.json({
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, skip = 0 } = req.query;

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const conversationsWithPreview = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Chat.findOne({ conversationId: conv._id })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          _id: conv._id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          preview: lastMessage ? lastMessage.message.substring(0, 50) : ''
        };
      })
    );

    const total = await Conversation.countDocuments({ userId });

    res.json({
      conversations: conversationsWithPreview,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Chat.find({ conversationId })
      .sort({ timestamp: 1 });

    res.json({
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      messages
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
};

exports.updateConversationTitle = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    const userId = req.userId;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      { title, updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await Chat.deleteMany({ conversationId });

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};
