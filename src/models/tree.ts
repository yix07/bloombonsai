import mongoose, { Schema, model, models } from 'mongoose';

const TreeSchema = new Schema({
  owner: {
    type: String,
    required: true, 
  },
  treeId: {
    type: String,
    required: true,
    unique: true, 
  },
  species: {
    type: String,
    required: true,
  },
  growthStage: {
    type: String,
    default: '1', 
  },
  row: {
    type: Number,
    default: 0,
  },
  col: {
    type: Number,
    default: 0,
  },
  assignedTask: {
    type: String,
    default: '',
  },
  metadataCID: {
    type: String, 
    required: true, 
  },
}, {
  timestamps: true, 
});

const Tree = models.Tree || model('Tree', TreeSchema);
export default Tree;
