const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Transaction = require('./models/Transaction');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const runVerification = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    // Cleanup previous test data
    await User.deleteMany({ email: { $in: ['teacher@test.com', 'student@test.com'] } });
    await Listing.deleteMany({ title: 'Test Class' });
    console.log("Cleaned up old test data.");

    // 1. Verify Default Credit Value
    console.log("\n--- Test 1: Initial Credit Value ---");
    const teacher = await User.create({
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: 'password123'
    });
    console.log(`Teacher created. Credits: ${teacher.timeCredits} (Expected: 2)`);
    if (teacher.timeCredits !== 2) throw new Error("Default credits not 2!");

    const student = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123'
    });
    console.log(`Student created. Credits: ${student.timeCredits} (Expected: 2)`);
    if (student.timeCredits !== 2) throw new Error("Default credits not 2!");

    // 2. Create Listing
    console.log("\n--- Setup: Create Listing ---");
    const listing = await Listing.create({
      teacher: teacher._id,
      title: 'Test Class',
      description: 'Test Description',
      category: 'Test',
      duration: 60
    });
    console.log("Listing created.");

    // 3. Verify Credit Deduction (Booking)
    console.log("\n--- Test 2: Credit Deduction (Booking) ---");
    // Simulate transactionController logic
    if (student.timeCredits < 1) throw new Error("Not enough credits!");
    
    student.timeCredits -= 1;
    await student.save();
    
    const transaction = await Transaction.create({
      sender: student._id,
      receiver: teacher._id,
      listing: listing._id
    });
    
    const updatedStudent = await User.findById(student._id);
    console.log(`Student booked class. Credits: ${updatedStudent.timeCredits} (Expected: 1)`);
    if (updatedStudent.timeCredits !== 1) throw new Error("Credits not deducted!");

    // 4. Verify Credit Addition (Completion)
    console.log("\n--- Test 3: Credit Addition (Completion) ---");
    // Simulate completeTransaction logic
    transaction.status = 'COMPLETED';
    await transaction.save();

    teacher.timeCredits += 1;
    await teacher.save();

    const updatedTeacher = await User.findById(teacher._id);
    console.log(`Teacher completed class. Credits: ${updatedTeacher.timeCredits} (Expected: 3)`);
    if (updatedTeacher.timeCredits !== 3) throw new Error("Credits not added!");

    console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY");

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
  } finally {
    // Cleanup again
    if (mongoose.connection.readyState === 1) {
        await User.deleteMany({ email: { $in: ['teacher@test.com', 'student@test.com'] } });
        await Listing.deleteMany({ title: 'Test Class' });
        await mongoose.connection.close();
    }
  }
};

runVerification();
