const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalPayment: Number,
  salaries: [{ name: String, amount: Number }],
  bonus: Number,
  fuel: Number,
  truckRent: Number,
  miscellaneous: [{ note: String, amount: Number }],
  profit: Number
});

module.exports = mongoose.model('Job', JobSchema);
