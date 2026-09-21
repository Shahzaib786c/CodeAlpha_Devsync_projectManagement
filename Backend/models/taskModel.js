import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({
  title: { type: String, required: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 5000 },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending','in-progress','completed'], default: 'pending' },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  dueDate: { type: Date, default: null },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ project: 1, deletedAt: 1, status: 1 });
schema.index({ assignee: 1, deletedAt: 1 });
export default mongoose.model('Task', schema);
