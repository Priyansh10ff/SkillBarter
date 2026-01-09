const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Transaction = require('./models/Transaction');

dotenv.config();

const resetData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 MongoDB Connected...');

    // Delete Everything
    await User.deleteMany();
    await Listing.deleteMany();
    await Transaction.deleteMany();

    console.log('✅ Data Destroyed! Database is clean.');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

resetData();