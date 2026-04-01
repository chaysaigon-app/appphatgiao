/**
 * app.js
 * Logic chính của ứng dụng Lịch Âm Dương - Phật Giáo Nguyên Thủy
 * Xử lý: render lịch tháng, chi tiết ngày, ngày Thập Trai, Kinh Pháp Cú
 */

// ============================================================
// BIẾN TRẠNG THÁI (State)
// ============================================================

/** Ngày đang xem (không nhất thiết là hôm nay) */
let currentViewDate = new Date();

/** Hôm nay */
const TODAY = new Date();

// ============================================================
// ĐĂNG KÝ SERVICE WORKER (PWA)
// ============================================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => console.log("✅ Service Worker đã đăng ký:", reg.scope))
      .catch((err) => console.error("❌ Service Worker lỗi:", err));
  });
}

// ============================================================
// SỰ KIỆN "ADD TO HOME SCREEN" (PWA Install Prompt)
// ============================================================
let deferredInstallPrompt = null;
const installBanner = document.getElementById("install-banner");
const btnInstall = document.getElementById("btn-install");
const btnDismiss = document.getElementById("btn-dismiss");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Hiển thị banner cài đặt sau 2 giây
  setTimeout(() => {
    if (installBanner) installBanner.classList.add("visible");
  }, 2000);
});

if (btnInstall) {
  btnInstall.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log("Kết quả cài đặt:", outcome);
      deferredInstallPrompt = null;
    }
    installBanner.classList.remove("visible");
  });
}

if (btnDismiss) {
  btnDismiss.addEventListener("click", () => {
    installBanner.classList.remove("visible");
  });
}

// ============================================================
// HÀM RENDER LỊCH THÁNG
// ============================================================

/**
 * Render lưới lịch tháng (calendar grid).
 * Vẽ các ô ngày, đánh dấu hôm nay, đánh dấu ngày Thập Trai.
 */
function renderMonthCalendar() {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth() + 1; // 1-12

  // Cập nhật tiêu đề tháng
  document.getElementById("month-title").textContent = `${TEN_THANG_DL[month - 1]} · ${year}`;

  // Lấy dữ liệu lịch cả tháng
  const monthData = getMonthData(year, month);

  // Tính thứ của ngày đầu tháng (0=CN, dịch sang lưới bắt đầu từ T2)
  const firstDayDate = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDayDate.getDay(); // 0=CN
  // Chuyển sang hệ T2 đầu tuần: CN→6, T2→0, T3→1...
  const offset = (firstDayOfWeek + 6) % 7;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  // Thêm ô trống ở đầu (offset ngày đầu tháng)
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  // Render từng ngày trong tháng
  monthData.forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "cal-day";

    // Kiểm tra hôm nay
    const isToday =
      day.duongLich === TODAY.getDate() &&
      month === TODAY.getMonth() + 1 &&
      year === TODAY.getFullYear();

    // Kiểm tra cuối tuần (T7=6, CN=0)
    const isWeekend = day.thu === 0 || day.thu === 6;

    if (isToday) cell.classList.add("today");
    if (isWeekend) cell.classList.add("weekend");
    if (day.laThapTrai) cell.classList.add("thap-trai");

    // Nội dung ô ngày
    cell.innerHTML = `
      <span class="solar-day">${day.duongLich}</span>
      <span class="lunar-day">${day.ngayAm}${day.ngayAm === 1 ? "/" + day.thangAm : ""}</span>
      ${day.laThapTrai ? '<span class="lotus-dot" title="Ngày Thập Trai">●</span>' : ""}
    `;

    // Click vào ngày → cập nhật chi tiết ngày
    cell.addEventListener("click", () => {
      currentViewDate = new Date(year, month - 1, day.duongLich);
      renderDayDetail();
      highlightSelectedDay(day.duongLich);
    });

    grid.appendChild(cell);
  });
}

/**
 * Làm nổi bật ô ngày được chọn trong lưới lịch.
 * @param {number} selectedDay - Ngày được chọn
 */
function highlightSelectedDay(selectedDay) {
  const cells = document.querySelectorAll(".cal-day:not(.empty)");
  cells.forEach((cell) => cell.classList.remove("selected"));
  const idx = selectedDay - 1;
  // Tìm ô đúng (bỏ qua ô empty)
  const allCells = Array.from(document.querySelectorAll(".cal-day"));
  const dayCells = allCells.filter((c) => !c.classList.contains("empty"));
  if (dayCells[idx]) dayCells[idx].classList.add("selected");
}

// ============================================================
// HÀM RENDER CHI TIẾT NGÀY
// ============================================================

/**
 * Render panel chi tiết cho ngày đang chọn.
 * Hiển thị: Thứ, Ngày DL, Ngày ÂL, Can Chi, Thập Trai, Kệ Pháp Cú.
 */
function renderDayDetail() {
  const d = currentViewDate.getDate();
  const m = currentViewDate.getMonth() + 1;
  const y = currentViewDate.getFullYear();
  const lunar = getLunarDate(currentViewDate);

  // Tên thứ đầy đủ
  const thuDay = currentViewDate.getDay();
  const tenThuDayDu = [
    "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư",
    "Thứ Năm", "Thứ Sáu", "Thứ Bảy",
  ];

  // Cập nhật UI
  document.getElementById("detail-thu").textContent = tenThuDayDu[thuDay];
  document.getElementById("detail-solar-day").textContent = d;
  document.getElementById("detail-solar-month-year").textContent = `Tháng ${m} · ${y}`;
  document.getElementById("detail-lunar-day").textContent = `Ngày ${lunar.ngayAm}`;
  document.getElementById("detail-lunar-month").textContent =
    `Tháng ${TEN_THANG_AM[lunar.thangAm]}${lunar.thangNhuan ? " (Nhuận)" : ""} · Năm ${lunar.canChi}`;

  // Thập Trai
  const thapTraiBadge = document.getElementById("thap-trai-badge");
  if (lunar.soNgayTrongThang > 0 && isThapTrai(lunar.ngayAm, lunar.soNgayTrongThang)) {
    thapTraiBadge.style.display = "flex";
  } else {
    thapTraiBadge.style.display = "none";
  }

  // Kệ Pháp Cú theo ngày
  renderPhapCu(currentViewDate);
}

// ============================================================
// HÀM RENDER KINH PHÁP CÚ
// ============================================================

/**
 * Chọn và hiển thị một bài kệ Kinh Pháp Cú tương ứng với ngày.
 * Dùng công thức: dayOfYear % tổng_số_kệ → cùng 1 bài cho tất cả user trong ngày đó.
 * @param {Date} date - Ngày cần hiển thị
 */
function renderPhapCu(date) {
  const dayOfYear = getDayOfYear(date); // 1 → 365
  const index = (dayOfYear - 1) % PHAP_CU.length; // 0-indexed
  const ke = PHAP_CU[index];

  document.getElementById("phapcu-pham").textContent = ke.pham;
  document.getElementById("phapcu-ke-ngon").innerHTML = ke.ke_ngon
    .split("\n")
    .map((line) => `<span>${line}</span>`)
    .join("<br>");
  document.getElementById("phapcu-y-nghia").textContent = ke.y_nghia;
}

// ============================================================
// ĐIỀU HƯỚNG THÁNG (Previous / Next)
// ============================================================

/** Chuyển sang tháng trước */
function prevMonth() {
  currentViewDate = new Date(
    currentViewDate.getFullYear(),
    currentViewDate.getMonth() - 1,
    1
  );
  renderAll();
}

/** Chuyển sang tháng sau */
function nextMonth() {
  currentViewDate = new Date(
    currentViewDate.getFullYear(),
    currentViewDate.getMonth() + 1,
    1
  );
  renderAll();
}

/** Về hôm nay */
function goToday() {
  currentViewDate = new Date(TODAY);
  renderAll();
  // Cuộn lên đầu
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// SWIPE GESTURE (Vuốt trái/phải để đổi tháng)
// ============================================================
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  const delta = touchStartX - touchEndX;
  if (Math.abs(delta) > 60) {
    // Threshold 60px
    if (delta > 0) {
      nextMonth(); // Vuốt trái → tháng sau
    } else {
      prevMonth(); // Vuốt phải → tháng trước
    }
  }
});

// ============================================================
// GẮN SỰ KIỆN NÚT BẤM
// ============================================================
document.getElementById("btn-prev-month").addEventListener("click", prevMonth);
document.getElementById("btn-next-month").addEventListener("click", nextMonth);
document.getElementById("btn-today").addEventListener("click", goToday);

// ============================================================
// HÀM RENDER TỔNG HỢP
// ============================================================

/**
 * Render lại toàn bộ giao diện.
 */
function renderAll() {
  renderMonthCalendar();
  renderDayDetail();

  // Nếu đang xem tháng hiện tại → highlight hôm nay
  const isCurrentMonth =
    currentViewDate.getMonth() === TODAY.getMonth() &&
    currentViewDate.getFullYear() === TODAY.getFullYear();

  if (isCurrentMonth) {
    highlightSelectedDay(TODAY.getDate());
  }
}

// ============================================================
// KHỞI ĐỘNG ỨNG DỤNG
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
});
