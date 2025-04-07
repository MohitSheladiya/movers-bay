const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const MonthlyFee = require('../models/MonthlyFee');
const moment = require('moment'); // Install with: npm install moment

// Add new job
router.post('/', async (req, res) => {
  try {
    const {
      totalPayment,
      salaries,
      bonus,
      fuel,
      truckRent,
      miscellaneous
    } = req.body;

    const salaryTotal = salaries.reduce((sum, s) => sum + s.amount, 0);
    const miscTotal = miscellaneous.reduce((sum, m) => sum + m.amount, 0);

    const profit = totalPayment - salaryTotal - bonus - fuel - truckRent - miscTotal;

    const job = new Job({
        date: req.body.date ? new Date(req.body.date) : new Date(),
        totalPayment,
        salaries,
        bonus,
        fuel,
        truckRent,
        miscellaneous,
        profit
      });      

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all jobs (e.g., for monthly report)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly Summary Route
router.post('/summary', async (req, res) => {
    try {
      const { franchiseFee } = req.body;
  
      const jobs = await Job.find();
  
      const totalProfit = jobs.reduce((sum, job) => sum + job.profit, 0);
      const netProfit = totalProfit - franchiseFee;
  
      const share55 = +(netProfit * 0.55).toFixed(2);
      const share15_1 = +(netProfit * 0.15).toFixed(2);
      const share15_2 = share15_1;
      const share15_3 = share15_1;
  
      res.json({
        totalProfit: totalProfit.toFixed(2),
        franchiseFee: franchiseFee.toFixed(2),
        netProfit: netProfit.toFixed(2),
        shares: {
          share55,
          share15_1,
          share15_2,
          share15_3
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// Get jobs grouped by month + fee
router.get('/monthly', async (req, res) => {
    try {
      const jobs = await Job.find();
      const fees = await MonthlyFee.find();
  
      const grouped = {};
  
      jobs.forEach(job => {
        const month = moment(job.date).format('YYYY-MM');
        if (!grouped[month]) grouped[month] = { jobs: [], totalProfit: 0 };
        grouped[month].jobs.push(job);
        grouped[month].totalProfit += job.profit;
      });
  
      const result = Object.keys(grouped).map(month => {
        const fee = fees.find(f => f.month === month)?.franchiseFee || 0;
        const netProfit = grouped[month].totalProfit - fee;
        return {
          month,
          jobs: grouped[month].jobs,
          totalProfit: grouped[month].totalProfit,
          franchiseFee: fee,
          netProfit,
          shares: {
            share55: +(netProfit * 0.55).toFixed(2),
            share15_1: +(netProfit * 0.15).toFixed(2),
            share15_2: +(netProfit * 0.15).toFixed(2),
            share15_3: +(netProfit * 0.15).toFixed(2)
          }
        };
      });
  
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Update or Add Franchise Fee for a month
  router.post('/monthly/franchise-fee', async (req, res) => {
    const { month, franchiseFee } = req.body;
  
    try {
      const existing = await MonthlyFee.findOne({ month });
      if (existing) {
        existing.franchiseFee = franchiseFee;
        await existing.save();
      } else {
        await MonthlyFee.create({ month, franchiseFee });
      }
  
      res.json({ message: `Franchise Fee updated for ${month}`, franchiseFee });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

  // DELETE
router.delete('/:id', async (req, res) => {
    try {
      await Job.findByIdAndDelete(req.params.id);
      res.json({ message: 'Job deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // PUT (Edit)
  router.put('/:id', async (req, res) => {
    try {
      const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  

module.exports = router;
