const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Listing = require('../models/Listing');

// ... keep createTransaction and getMyTransactions ...
// (I will provide the FULL file below to ensure you have the new functions)

const createTransaction = async (req, res) => {
  const { listingId } = req.body;
  try {
    const listing = await Listing.findById(listingId).populate('teacher');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const student = await User.findById(req.user.id);
    if (student.timeCredits < 1) return res.status(400).json({ message: 'Not enough credits' });

    // Deduct credit
    student.timeCredits -= 1;
    await student.save();

    const transaction = await Transaction.create({
      sender: req.user.id,
      receiver: listing.teacher._id,
      listing: listingId,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('listing', 'title duration category')
      .sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.sender.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    transaction.status = 'COMPLETED';
    await transaction.save();

    const teacher = await User.findById(transaction.receiver);
    teacher.timeCredits += 1;
    
    // Update Stats
    teacher.stats = teacher.stats || {};
    teacher.stats.classesTaught = (teacher.stats.classesTaught || 0) + 1;

    const student = await User.findById(transaction.sender);
    student.stats = student.stats || {};
    student.stats.classesAttended = (student.stats.classesAttended || 0) + 1;

    // Badge Logic (Simple Example)
    if (teacher.stats.classesTaught === 5) {
      teacher.badges.push({ name: "Teacher Rookie", icon: "🎓" });
    }
    if (student.stats.classesAttended === 5) {
      student.badges.push({ name: "Dedicated Student", icon: "📚" });
    }

    await teacher.save();
    await student.save();

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Schedule Appointment
const updateSchedule = async (req, res) => {
  const { date, action } = req.body; // action: 'PROPOSE' or 'ACCEPT'
  try {
    const tx = await Transaction.findById(req.params.id);
    
    if (action === 'PROPOSE') {
      tx.proposedDate = date;
      tx.proposedBy = req.user.id;
      tx.appointmentStatus = 'PROPOSED';
    } else if (action === 'ACCEPT') {
      tx.scheduledDate = tx.proposedDate;
      tx.appointmentStatus = 'SCHEDULED';
    }

    await tx.save();
    res.status(200).json(tx);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getMyTransactions,
  completeTransaction,
  updateSchedule // Export this
};