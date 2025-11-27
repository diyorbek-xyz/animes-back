import mongoose, { models } from 'mongoose';

const LoginSchema = new mongoose.Schema({
	firstname: { type: String, required: true },
	lastname: { type: String, required: true },
	username: { type: String, required: true },
	password: { type: String, required: true },
	role: { type: String, enum: ['user', 'admin', 'creator'], default: 'user' },
	premium: Boolean,
	avatar: String,
	banner: String,
});
const LoginModel = models.user || mongoose.model('user', LoginSchema);

export default LoginModel;
