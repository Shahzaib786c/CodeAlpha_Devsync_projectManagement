import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({
  name: { type: String, required: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ members: 1, deletedAt: 1 });
export default mongoose.model('Project', schema);
