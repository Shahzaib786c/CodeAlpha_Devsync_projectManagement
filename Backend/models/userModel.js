import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  avatar: { type: new Schema({ url: String, publicId: String }, { _id: false }), default: null },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', schema);
