import mongoose from 'mongoose';

const LoginSchema = new mongoose.Schema({
	first_name: { type: String, required: true },
	last_name: { type: String, required: true },
	username: { type: String, required: true },
	password: { type: String, required: true },
	role: { type: String, enum: ['user', 'admin', 'creator'], default: 'user' },
	premium: Boolean,
	avatar: String,
	banner: String,
});
const LoginModel = mongoose.model('user', LoginSchema);

export default LoginModel;
