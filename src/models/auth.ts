import mongoose, { models } from 'mongoose';

const AuthSchema = new mongoose.Schema({
	firstname: { type: String, required: true },
	lastname: { type: String, required: true },
	username: { type: String, required: true },
	password: { type: String, required: true },
	role: { type: String, enum: ['user', 'admin', 'creator'], default: 'user' },
});
const AuthModel = models.user || mongoose.model('user', AuthSchema);

export default AuthModel;
