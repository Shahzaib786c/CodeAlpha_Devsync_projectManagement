import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  task: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
  kind: { type: String, required: true },
  message: { type: String, required: true },
  readAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ recipient: 1, readAt: 1, createdAt: -1 });
export default mongoose.model('Notification', schema);
