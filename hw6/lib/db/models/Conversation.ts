import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  userId: string;
  messageId: string;
  timestamp: Date;
  messageType: 'text' | 'postback' | 'image' | 'other';
  content: string;
  response?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    messageType: {
      type: String,
      enum: ['text', 'postback', 'image', 'other'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    response: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ConversationSchema.index({ userId: 1, timestamp: -1 });
ConversationSchema.index({ timestamp: -1 });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;

