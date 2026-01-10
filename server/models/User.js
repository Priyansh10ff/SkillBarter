const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
  },
  skillsOffered: {
    type: [String],
    required: false,
  },
  skillsRequested: {
    type: [String],
    required: false,
  },
  timeCredits: {
    type: Number,
    default: 2, 
  },
  preferredHours: { type: String, default: "" }, // E.g., "Weekdays 6pm-9pm"
  stats: {
    classesAttended: { type: Number, default: 0 },
    classesTaught: { type: Number, default: 0 },
  },
  badges: [{
    name: String,
    icon: String,
    dateEarned: { type: Date, default: Date.now }
  }],
  rating: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
},
{
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);