import mongoose, { Schema, Document } from 'mongoose';

export interface IGameState extends Document {
  userId: string;
  currentHP: number;
  maxHP: number;
  gold: number;
  items: string[];
  level: number;
  attack: number;
  experience: number;
  storyFlags: Record<string, boolean | number | string>;
  lastAction?: string;
  lastActionTime?: Date;
  currentEvent?: {
    description: string;
    eventType: string;
    options: Array<{
      text: string;
      action: string;
      effects: any;
    }>;
  };
  gameCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameStateSchema = new Schema<IGameState>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentHP: {
      type: Number,
      required: true,
      default: 100,
    },
    maxHP: {
      type: Number,
      required: true,
      default: 100,
    },
    gold: {
      type: Number,
      required: true,
      default: 50,
    },
    items: {
      type: [String],
      default: [],
    },
    level: {
      type: Number,
      required: true,
      default: 1,
    },
    attack: {
      type: Number,
      required: true,
      default: 10,
    },
    experience: {
      type: Number,
      required: true,
      default: 0,
    },
    storyFlags: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastAction: {
      type: String,
    },
    lastActionTime: {
      type: Date,
    },
    currentEvent: {
      type: Schema.Types.Mixed,
    },
    gameCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const GameState =
  mongoose.models.GameState ||
  mongoose.model<IGameState>('GameState', GameStateSchema);

export default GameState;

