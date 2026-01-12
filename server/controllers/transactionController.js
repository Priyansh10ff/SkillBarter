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

    // Prevent self-booking
    if (listing.teacher._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot book your own listing' });
    }

    // Atomic credit check and deduction (Works on Standalone & Replica Sets)
    const student = await User.findOneAndUpdate(
      { _id: req.user.id, timeCredits: { $gte: 1 } },
      { $inc: { timeCredits: -1 } },
      { new: true }
    );

    if (!student) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    try {
      // Create transaction
      const transaction = await Transaction.create({
        sender: req.user.id,
        receiver: listing.teacher._id,
        listing: listingId,
        status: 'PENDING'
      });

      res.status(201).json(transaction);
    } catch (txError) {
      // ROLLBACK: Refund credit if transaction creation fails
      console.error("Transaction creation failed, refunding credit...", txError);
      await User.findByIdAndUpdate(req.user.id, { $inc: { timeCredits: 1 } });
      return res.status(500).json({ message: 'Transaction failed, credit refunded', error: txError.message });
    }

  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: 'Booking failed', error: error.message });
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

    if (transaction.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Transaction already completed' });
    }

    // Atomic Update for Transaction Status
    // Prevents double-completion race conditions
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, status: 'PENDING' },
      { status: 'COMPLETED' },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(400).json({ message: 'Transaction could not be completed (might be already completed)' });
    }

    // Atomic Update for Teacher (Credits + Stats)
    const teacher = await User.findByIdAndUpdate(
      transaction.receiver,
      { 
        $inc: { 
          timeCredits: 1,
          "stats.classesTaught": 1 
        } 
      },
      { new: true }
    );

    // Atomic Update for Student (Stats only)
    const student = await User.findByIdAndUpdate(
      transaction.sender,
      { $inc: { "stats.classesAttended": 1 } },
      { new: true }
    );

    // Badge Logic (Ideally should be a separate service or function, kept simple here)
    // We check if badge needs to be pushed to avoid duplicates
    if (teacher.stats.classesTaught === 5 && !teacher.badges.some(b => b.name === "Teacher Rookie")) {
      teacher.badges.push({ name: "Teacher Rookie", icon: "🎓" });
      await teacher.save();
    }
    if (student.stats.classesAttended === 5 && !student.badges.some(b => b.name === "Dedicated Student")) {
      student.badges.push({ name: "Dedicated Student", icon: "📚" });
      await student.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.to(teacher._id.toString()).emit("credit_update", teacher.timeCredits);
    }

    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error("Completion Error:", error);
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