const FEE_PER_SUBJECT = 500;
const SUBJECTS = [
  "Java Programming",
  "Database Management Systems",
  "Computer Networks",
  "Operating Systems",
  "Mathematics"
];
const $ = id => document.getElementById(id);
let currentRegistration = null;
let paid = false;
let registrations = loadRecords();

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem("examPortalRecords"));
    if (Array.isArray(saved)) return saved;
  } catch (e) {}
  return [
    {id:"EX2026002", name:"Anjali Sharma", studentId:"23CS102", course:"B.Tech CSE", subjects:["Operating Systems"], fee:500, status:"Paid", paymentMethod:"UPI", email:"anjali@example.com", year:"2nd Year"}
  ];
}
function saveRecords() {
  localStorage.setItem("examPortalRecords", JSON.stringify(registrations));
}
function showMessage(text, isError=false) {
  const el = $("message");
  el.textContent = text;
  el.classList.toggle("error", isError);
  el.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}
function hideMessage() { $("message").classList.add("hidden"); }
function go(page) {
  hideMessage();
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("hidden", p.id !== page));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  if (page === "payment") renderPayment();
  if (page === "receipt") renderReceipt();
  if (page === "admin") renderAdmin();
  window.scrollTo({top:0, behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => go(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));

function renderSubjects() {
  $("subjectList").innerHTML = SUBJECTS.map(s => `<label class="subject-option"><input type="checkbox" value="${s}" checked> <span>${s}</span></label>`).join("");
  $("subjectList").querySelectorAll("input").forEach(input => input.addEventListener("change", updateTotal));
  updateTotal();
}
function selectedSubjects() {
  return [...$("subjectList").querySelectorAll("input:checked")].map(input => input.value);
}
function updateTotal() {
  const count = selectedSubjects().length;
  $("subjectCount").textContent = count;
  $("totalFee").textContent = money(count * FEE_PER_SUBJECT);
}
function money(value) { return "₹" + Number(value || 0).toLocaleString("en-IN"); }
function registrationId(studentId) {
  return "EX" + studentId.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const id = $("loginId").value.trim();
  if (!id || !$("loginPassword").value.trim()) return showMessage("Enter both Student ID and password.", true);
  $("studentId").value = id;
  const found = registrations.find(r => r.studentId.toLowerCase() === id.toLowerCase());
  if (found) {
    $("fullName").value = found.name;
    $("email").value = found.email || "";
    $("course").value = found.course;
    $("year").value = found.year || "2nd Year";
    $("subjectList").querySelectorAll("input").forEach(input => input.checked = found.subjects.includes(input.value));
    currentRegistration = found;
    paid = found.status === "Paid";
    updateTotal();
  }
  showMessage("Demo login successful. Continue with your registration.");
  go("register");
});

$("registrationForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("fullName").value.trim();
  const studentId = $("studentId").value.trim();
  const email = $("email").value.trim();
  const subjects = selectedSubjects();
  if (!name || !studentId || !email) return showMessage("Please complete your name, student ID and email.", true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage("Please enter a valid email address.", true);
  if (!subjects.length) return showMessage("Please select at least one subject.", true);
  const id = registrationId(studentId);
  const existing = registrations.find(r => r.id === id);
  currentRegistration = {
    id, name, studentId, email, course:$("course").value, year:$("year").value,
    subjects, fee:subjects.length * FEE_PER_SUBJECT,
    status: existing?.status === "Paid" ? "Paid" : "Pending",
    paymentMethod: existing?.paymentMethod || ""
  };
  paid = currentRegistration.status === "Paid";
  registrations = registrations.filter(r => r.id !== id);
  registrations.unshift(currentRegistration);
  saveRecords();
  showMessage("Registration details saved. Review your fee and continue to payment.");
  go("payment");
});

function renderPayment() {
  if (!currentRegistration) {
    $("paymentSummary").innerHTML = `<p>No current registration found. Complete the <a href="#" id="goRegisterLink">registration form</a> first.</p>`;
    $("goRegisterLink")?.addEventListener("click", e => {e.preventDefault();go("register");});
    $("payButton").disabled = true;
    $("payButton").textContent = "Register First";
    return;
  }
  $("payButton").disabled = false;
  $("payButton").textContent = paid ? "Payment Already Confirmed" : "Simulate Payment";
  $("paymentSummary").innerHTML = `
    <div class="summary-row"><span>Student</span><strong>${escapeHtml(currentRegistration.name)}</strong></div>
    <div class="summary-row"><span>Student ID</span><strong>${escapeHtml(currentRegistration.studentId)}</strong></div>
    ${currentRegistration.subjects.map(s=>`<div class="summary-row"><span>${escapeHtml(s)}</span><strong>${money(FEE_PER_SUBJECT)}</strong></div>`).join("")}
    <div class="summary-row total"><span>Total Fee</span><strong>${money(currentRegistration.fee)}</strong></div>
    ${paid ? '<p class="hint">Payment is confirmed in this demo.</p>' : ''}
  `;
}
$("payButton").addEventListener("click", () => {
  if (!currentRegistration) { showMessage("Complete student registration first.", true); go("register"); return; }
  if (paid) { go("receipt"); return; }
  currentRegistration.status = "Paid";
  currentRegistration.paymentMethod = $("paymentMethod").value;
  paid = true;
  registrations = registrations.map(r => r.id === currentRegistration.id ? {...currentRegistration} : r);
  saveRecords();
  showMessage("Demo payment successful. Your confirmation receipt is ready.");
  go("receipt");
});

function renderReceipt() {
  const r = currentRegistration;
  if (!r) {
    $("receiptContent").innerHTML = '<p>No registration available yet. Please register first.</p>';
    return;
  }
  const status = paid || r.status === "Paid" ? "Paid" : "Pending";
  $("receiptContent").innerHTML = `
    <div class="receipt-title"><div class="check">${status === "Paid" ? "✅" : "🧾"}</div><h3>Exam Registration Receipt</h3><p>Academic Year 2026–2027</p><span class="status ${status}">${status === "Paid" ? "PAYMENT CONFIRMED" : "PAYMENT PENDING"}</span></div>
    <hr>
    <div class="summary-row"><span>Registration ID</span><strong>${escapeHtml(r.id)}</strong></div>
    <div class="summary-row"><span>Student Name</span><strong>${escapeHtml(r.name)}</strong></div>
    <div class="summary-row"><span>Student ID</span><strong>${escapeHtml(r.studentId)}</strong></div>
    <div class="summary-row"><span>Course</span><strong>${escapeHtml(r.course)}</strong></div>
    <div class="summary-row"><span>Academic Year</span><strong>${escapeHtml(r.year || "2nd Year")}</strong></div>
    <div class="summary-row"><span>Email</span><strong>${escapeHtml(r.email)}</strong></div>
    <p><strong>Registered Subjects</strong></p><ol class="receipt-subjects">${r.subjects.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ol>
    <div class="summary-row total"><span>Total Fee</span><strong>${money(r.fee)}</strong></div>
    <div class="summary-row"><span>Payment Method</span><strong>${escapeHtml(status === "Paid" ? (r.paymentMethod || "Demo payment") : "Not paid")}</strong></div>
    <p class="hint">Prototype receipt only. This is not an official college document.</p>
  `;
}
function receiptText() {
  if (!currentRegistration) return "No registration available.";
  const r = currentRegistration;
  return `EXAM REGISTRATION RECEIPT\nRegistration ID: ${r.id}\nName: ${r.name}\nStudent ID: ${r.studentId}\nCourse: ${r.course}\nAcademic Year: ${r.year}\nEmail: ${r.email}\nSubjects: ${r.subjects.join(", ")}\nTotal Fee: ${money(r.fee)}\nPayment Status: ${(paid || r.status==="Paid") ? "Paid (Demo)" : "Pending"}\nPayment Method: ${r.paymentMethod || "Not paid"}`;
}
$("copyReceipt").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(receiptText());
    showMessage("Receipt details copied to clipboard.");
  } catch (e) {
    const area = document.createElement("textarea");
    area.value = receiptText(); document.body.appendChild(area); area.select();
    document.execCommand("copy"); area.remove();
    showMessage("Receipt details copied to clipboard.");
  }
});

function renderAdmin() {
  const paidCount = registrations.filter(r=>r.status==="Paid").length;
  $("statRegistrations").textContent = registrations.length;
  $("statPaid").textContent = paidCount;
  $("statPending").textContent = registrations.length - paidCount;
  $("statFees").textContent = money(registrations.filter(r=>r.status==="Paid").reduce((sum,r)=>sum+(r.fee || 0),0));
  const filter = $("adminFilter").value;
  const filtered = registrations.filter(r=>filter==="All" || r.status===filter);
  $("recordsTable").innerHTML = filtered.map(r=>`<tr>
    <td>${escapeHtml(r.id)}</td><td><strong>${escapeHtml(r.name)}</strong><br><small>${escapeHtml(r.studentId)}</small></td>
    <td>${escapeHtml(r.course)}</td><td>${r.subjects.map(escapeHtml).join(", ")}</td><td>${money(r.fee)}</td>
    <td><span class="status ${r.status}">${r.status}</span></td>
    <td>${r.status==="Pending" ? `<button class="secondary" data-mark-paid="${escapeHtml(r.id)}">Mark Paid</button>` : "—"}</td></tr>`).join("");
  $("emptyRecords").classList.toggle("hidden", filtered.length > 0);
  $("recordsTable").querySelectorAll("[data-mark-paid]").forEach(btn=>btn.addEventListener("click",()=>{
    const id=btn.dataset.markPaid;
    registrations=registrations.map(r=>r.id===id?{...r,status:"Paid",paymentMethod:r.paymentMethod||"Admin marked"}:r);
    if (currentRegistration?.id===id) {currentRegistration=registrations.find(r=>r.id===id);paid=true;}
    saveRecords();renderAdmin();showMessage("Registration marked as paid in the demo.");
  }));
}
$("adminFilter").addEventListener("change", renderAdmin);
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
renderSubjects();
renderAdmin();
go("home");
