import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({
  task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, maxlength: 3000 }
}, { timestamps: true });
schema.index({ task: 1, createdAt: 1 });
export default mongoose.model('Comment', schema);
