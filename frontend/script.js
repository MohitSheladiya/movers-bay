const BASE_API_URL = "https://movers-bay.onrender.com";

// const BASE_API_URL = window.location.hostname === "localhost"
//   ? "http://localhost:5000"
//   : "https://movers-bay.onrender.com";

const salariesDiv = document.getElementById("salaries");
const miscDiv = document.getElementById("misc");
const jobListDiv = document.getElementById("jobList");

let editJobId = null;

function checkPassword() {
  const input = document.getElementById("appPassword").value;
  const errorText = document.getElementById("loginError");

  if (input === "takemeinbaby") {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  } else {
    errorText.textContent = "Incorrect password. Try again.";
  }
}

function addSalary() {
  const row = document.createElement("div");
  row.className = "salary-row";
  row.innerHTML = `
    <input type="text" placeholder="Name" class="salaryName" required>
    <input type="number" placeholder="Amount" class="salaryAmount" required>
    <button type="button" onclick="this.parentElement.remove()">Remove</button>
  `;
  salariesDiv.appendChild(row);
}

function addMisc() {
  const row = document.createElement("div");
  row.className = "misc-row";
  row.innerHTML = `
    <input type="text" placeholder="Note" class="miscNote" required>
    <input type="number" placeholder="Amount" class="miscAmount" required>
    <button type="button" onclick="this.parentElement.remove()">Remove</button>
  `;
  miscDiv.appendChild(row);
}

document.getElementById("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const salaries = [...document.querySelectorAll(".salaryName")].map(
    (el, i) => ({
      name: el.value,
      amount: parseFloat(document.querySelectorAll(".salaryAmount")[i].value),
    })
  );

  const miscellaneous = [...document.querySelectorAll(".miscNote")].map(
    (el, i) => ({
      note: el.value,
      amount: parseFloat(document.querySelectorAll(".miscAmount")[i].value),
    })
  );

  const data = {
    date: document.getElementById("jobDate").value,
    totalPayment: parseFloat(document.getElementById("totalPayment").value),
    salaries,
    bonus: parseFloat(document.getElementById("bonus").value),
    fuel: parseFloat(document.getElementById("fuel").value),
    truckRent: parseFloat(document.getElementById("truckRent").value),
    miscellaneous,
  };

  const url = editJobId
    ? `${BASE_API_URL}/api/jobs/${editJobId}`
    : `${BASE_API_URL}/api/jobs`;

  const method = editJobId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  alert(
    editJobId
      ? "Job updated!"
      : "Job saved with profit: $" + result.profit.toFixed(2)
  );

  // Reset everything
  document.getElementById("jobForm").reset();
  document
    .querySelectorAll(".salary-row, .misc-row")
    .forEach((row) => row.remove());
  document.getElementById("jobDate").value = new Date()
    .toISOString()
    .split("T")[0];
  editJobId = null;

  loadJobs();
  loadMonthlyData();
});

function renderJob(job) {
  const div = document.createElement("div");
  div.className = "job-box";
  div.innerHTML = `
    <p><strong>Date:</strong> ${new Date(job.date).toLocaleDateString()}</p>
    <p><strong>Total Payment:</strong> $${job.totalPayment}</p>
    <p><strong>Bonus:</strong> $${job.bonus}</p>
    <p><strong>Fuel:</strong> $${job.fuel}</p>
    <p><strong>Truck Rent:</strong> $${job.truckRent}</p>
    <p><strong>Profit:</strong> $${job.profit}</p>
    <p><strong>Salaries:</strong></p>
    <ul>${job.salaries
      .map((s) => `<li>${s.name}: $${s.amount}</li>`)
      .join("")}</ul>
    <p><strong>Miscellaneous:</strong></p>
    <ul>${job.miscellaneous
      .map((m) => `<li>${m.note}: $${m.amount}</li>`)
      .join("")}</ul>
    <button onclick="editJob('${job._id}')">Edit</button>
    <button onclick="deleteJob('${job._id}')">Delete</button>
  `;
  jobListDiv.appendChild(div);
}

async function loadJobs() {
  const res = await fetch(`${BASE_API_URL}/api/jobs`);
  const jobs = await res.json();

  jobListDiv.innerHTML = "";
  [...jobs].reverse().forEach(renderJob);
}

async function deleteJob(id) {
  if (!confirm("Are you sure you want to delete this job?")) return;

  const res = await fetch(`${BASE_API_URL}/api/jobs/${id}`, {
    method: "DELETE",
  });

  if (res.ok) {
    alert("Job deleted.");
    loadJobs();
    loadMonthlyData();
  } else {
    alert("Delete failed.");
  }
}

function editJob(id) {
  alert(
    "Edit functionality coming soon! You can delete and re-add with updated details for now."
  );
}

async function loadMonthlyData(filterFrom = null, filterTo = null) {
  const res = await fetch(`${BASE_API_URL}/api/jobs/monthly`);
  const months = await res.json();
  const container = document.getElementById("monthlyContainer");
  const ytdText = document.getElementById("ytdProfit");

  container.innerHTML = "";
  ytdText.innerHTML = "";

  let filtered = months;
  if (filterFrom && filterTo) {
    filtered = months.filter(
      (m) => m.month >= filterFrom && m.month <= filterTo
    );
  }

  // Group net profits by year
  const profitsByYear = {};
  months.forEach((m) => {
    const year = m.month.split("-")[0];
    profitsByYear[year] = (profitsByYear[year] || 0) + m.netProfit;
  });

  // Display all YTD profits
  for (const year in profitsByYear) {
    const amount = profitsByYear[year].toFixed(2);
    const p = document.createElement("p");
    p.textContent = `Year-to-Date Net Profit (${year}): $${amount}`;
    ytdText.appendChild(p);
  }

  filtered.forEach((month) => {
    const box = document.createElement("div");
    box.className = "job-box";

    const jobList = month.jobs
      .map(
        (job) => `
        <li>
          <strong>Date:</strong> ${new Date(job.date).toLocaleDateString()},
          <strong>Total:</strong> $${job.totalPayment},
          <strong>Profit:</strong> $${job.profit}
        </li>
      `
      )
      .join("");

    box.innerHTML = `
        <h3>${month.month}</h3>
        <p><strong>Total Profit:</strong> $${month.totalProfit.toFixed(2)}</p>
        <p>
          <strong>Franchise Fee:</strong> 
          <input type="number" value="${month.franchiseFee}" id="fee-${
      month.month
    }" />
          &nbsp;&nbsp;&nbsp;<button onclick="updateFranchiseFee('${
            month.month
          }')">Update</button>
        </p>
        <p><strong>Net Profit:</strong> $${month.netProfit.toFixed(2)}</p>
        <ul>
          <li>55%: $${month.shares.share55}</li>
          <li>15%: $${month.shares.share15_1}</li>
          <li>15%: $${month.shares.share15_2}</li>
          <li>15%: $${month.shares.share15_3}</li>
        </ul>
        <h4>Jobs:</h4>
        <ul>${jobList}</ul>
      `;

    container.appendChild(box);
  });
}

async function updateFranchiseFee(month) {
  const input = document.getElementById(`fee-${month}`);
  const value = parseFloat(input.value);

  if (isNaN(value)) {
    alert("Please enter a valid number");
    return;
  }

  await fetch(`${BASE_API_URL}/api/jobs/monthly/franchise-fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, franchiseFee: value }),
  });

  alert(`Franchise fee updated for ${month}`);
  loadMonthlyData();
}

function filterMonthlyReport() {
  const from = document.getElementById("monthlyFrom").value;
  const to = document.getElementById("monthlyTo").value;

  if (!from || !to) {
    alert("Please select both from and to month.");
    return;
  }

  loadMonthlyData(from, to);
}

function clearMonthlyFilter() {
  document.getElementById("monthlyFrom").value = "";
  document.getElementById("monthlyTo").value = "";
  loadMonthlyData();
}

async function filterJobsByDate() {
  const from = document.getElementById("filterFromDate").value;
  const to = document.getElementById("filterToDate").value;

  if (!from || !to) {
    alert("Please select both From and To dates.");
    return;
  }

  const res = await fetch(`${BASE_API_URL}/api/jobs`);
  const jobs = await res.json();

  const filtered = jobs.filter((job) => {
    const jobDate = new Date(job.date).toISOString().split("T")[0];
    return jobDate >= from && jobDate <= to;
  });

  jobListDiv.innerHTML = "";
  [...filtered].reverse().forEach(renderJob);
}

function clearFilter() {
  document.getElementById("filterFromDate").value = "";
  document.getElementById("filterToDate").value = "";
  loadJobs();
}

async function getSummary() {
  const franchiseFee = parseFloat(
    document.getElementById("franchiseFee").value
  );

  const res = await fetch(`${BASE_API_URL}/api/jobs/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ franchiseFee }),
  });

  const data = await res.json();

  document.getElementById("summaryResult").innerHTML = `
    <p><strong>Total Profit:</strong> $${data.totalProfit}</p>
    <p><strong>Franchise Fee:</strong> $${data.franchiseFee}</p>
    <p><strong>Net Profit:</strong> $${data.netProfit}</p>
    <h3>Shares</h3>
    <ul>
      <li>55%: $${data.shares.share55}</li>
      <li>15%: $${data.shares.share15_1}</li>
      <li>15%: $${data.shares.share15_2}</li>
      <li>15%: $${data.shares.share15_3}</li>
    </ul>
  `;
}

async function editJob(id) {
  const res = await fetch(`${BASE_API_URL}/api/jobs`);
  const jobs = await res.json();
  const job = jobs.find((j) => j._id === id);
  if (!job) return alert("Job not found");

  editJobId = id;

  // Prefill the form
  document.getElementById("jobDate").value = job.date.split("T")[0];
  document.getElementById("totalPayment").value = job.totalPayment;
  document.getElementById("bonus").value = job.bonus;
  document.getElementById("fuel").value = job.fuel;
  document.getElementById("truckRent").value = job.truckRent;

  document
    .querySelectorAll(".salary-row, .misc-row")
    .forEach((row) => row.remove());

  job.salaries.forEach((s) => {
    const row = document.createElement("div");
    row.className = "salary-row";
    row.innerHTML = `
        <input type="text" class="salaryName" value="${s.name}" required>
        <input type="number" class="salaryAmount" value="${s.amount}" required>
        <button type="button" onclick="this.parentElement.remove()">Remove</button>
      `;
    salariesDiv.appendChild(row);
  });

  job.miscellaneous.forEach((m) => {
    const row = document.createElement("div");
    row.className = "misc-row";
    row.innerHTML = `
        <input type="text" class="miscNote" value="${m.note}" required>
        <input type="number" class="miscAmount" value="${m.amount}" required>
        <button type="button" onclick="this.parentElement.remove()">Remove</button>
      `;
    miscDiv.appendChild(row);
  });

  alert("Form filled. Submit to update the job.");
}

window.onload = () => {
  loadJobs();
  loadMonthlyData();
  document.getElementById("jobDate").value = new Date()
    .toISOString()
    .split("T")[0];
};
