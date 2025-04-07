const mongoose = require('mongoose');

const MonthlyFeeSchema = new mongoose.Schema({
  month: { type: String, required: true }, // Format: "2025-04"
  franchiseFee: { type: Number, default: 0 }
});

module.exports = mongoose.model('MonthlyFee', MonthlyFeeSchema);
