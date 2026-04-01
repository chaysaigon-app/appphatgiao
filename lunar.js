/**
 * lunar.js
 * Thuật toán chuyển đổi Dương Lịch sang Âm Lịch Việt Nam
 * Dựa trên thuật toán của Hồ Ngọc Đức (Ho Ngoc Duc)
 * Múi giờ: UTC+7 (Việt Nam)
 *
 * Tham khảo: https://www.informatik.uni-leipzig.de/~duc/amlich/
 */

// ============================================================
// CÁC HÀM TÍNH LỊCH NỘI BỘ (Internal helpers)
// ============================================================

/**
 * Tính số ngày Julius từ ngày dương lịch.
 * Công thức dùng lịch Gregorian.
 * @param {number} dd - Ngày
 * @param {number} mm - Tháng
 * @param {number} yy - Năm
 * @returns {number} Số ngày Julius
 */
function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      dd +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      32083;
  }
  return jd;
}

/**
 * Chuyển số ngày Julius sang ngày dương lịch.
 * @param {number} jd - Số ngày Julius
 * @returns {{dd, mm, yy}} Object ngày dương lịch
 */
function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) {
    // Lịch Gregorian
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((146097 * b) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const dd = e - Math.floor((153 * m + 2) / 5) + 1;
  const mm = m + 3 - 12 * Math.floor(m / 10);
  const yy = 100 * b + d - 4800 + Math.floor(m / 10);
  return { dd, mm, yy };
}

/**
 * Tính ngày bắt đầu của tháng âm lịch thứ k (tính từ tháng 1/2000).
 * Trả về số ngày Julius của ngày đầu tháng đó.
 * @param {number} k - Số thứ tự tháng (tính từ 1/2000)
 * @returns {number} Số ngày Julius
 */
function newMoon(k) {
  // Công thức tính trăng non (Meeus/Chapront)
  const T = k / 1236.85; // Thế kỷ Julius từ J1900
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3 +
    0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  // Điều chỉnh cho mặt trời (Sun's mean anomaly)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  // Điều chỉnh cho mặt trăng (Moon's mean anomaly)
  const Mprime =
    306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  // Điều chỉnh cho đối xứng mặt trăng (Moon's argument of latitude)
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M) -
    0.4068 * Math.sin(Mprime * dr) +
    0.0161 * Math.sin(dr * 2 * Mprime) -
    0.0004 * Math.sin(dr * 3 * Mprime) +
    0.0104 * Math.sin(dr * 2 * F) -
    0.0051 * Math.sin(dr * (M + Mprime)) -
    0.0074 * Math.sin(dr * (M - Mprime)) +
    0.0004 * Math.sin(dr * (2 * F + M)) -
    0.0004 * Math.sin(dr * (2 * F - M)) -
    0.0006 * Math.sin(dr * (2 * F + Mprime)) +
    0.001 * Math.sin(dr * (2 * F - Mprime)) +
    0.0005 * Math.sin(dr * (M + 2 * Mprime));

  let deltat;
  if (T < -11) {
    deltat =
      0.001 +
      0.000839 * T +
      0.0002261 * T2 -
      0.00000845 * T3 -
      0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }

  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + 7 / 24); // Cộng múi giờ UTC+7
}

/**
 * Tính vị trí Mặt Trời tại thời điểm JD (dùng để tính tháng nhuận).
 * Trả về góc hoàng đạo (0-11, mỗi 30 độ = 1 cung).
 * @param {number} jd - Số ngày Julius
 * @returns {number} Vị trí mặt trời (0–11)
 */
function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525; // Số thế kỷ Julius từ J2000
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2; // Mean anomaly
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2; // Mean longitude
  let DL =
    (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) +
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M); // Equation of center
  let L = L0 + DL; // Geocentric true longitude
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2)); // Normalize to [0, 2π)
  return Math.floor(L / Math.PI * 6); // 0..11
}

/**
 * Tính số tháng trăng (k) từ năm âm lịch.
 * @param {number} year - Năm
 * @returns {number} k
 */
function getNewMoonDay(k) {
  return newMoon(k);
}

/**
 * Xác định tháng nhuận trong năm.
 * Tháng nhuận là tháng không có Trung khí (Trung khí là vị trí mặt trời ở giữa 2 cung hoàng đạo).
 * @param {number} a11 - Ngày Julius của tháng 11 âm lịch năm trước
 * @param {number} leapPrec - Tháng trước có nhuận không
 * @returns {{leapMonth, leapMonthDiff}} Tháng nhuận và offset
 */
function getLeapMonthOffset(a11) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last;
  let i = 1; // Bắt đầu từ tháng 2
  let arc = sunLongitude(newMoon(k + i));
  do {
    last = arc;
    i++;
    arc = sunLongitude(newMoon(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

// ============================================================
// HÀM CHÍNH: Chuyển ngày Dương sang Âm
// ============================================================

/**
 * Chuyển đổi ngày dương lịch sang âm lịch Việt Nam.
 * @param {number} dd - Ngày dương lịch
 * @param {number} mm - Tháng dương lịch
 * @param {number} yy - Năm dương lịch
 * @returns {{
 *   ngayAm: number,
 *   thangAm: number,
 *   namAm: number,
 *   thangNhuan: boolean,
 *   soNgayTrongThang: number,
 *   canChi: string
 * }}
 */
function convertSolarToLunar(dd, mm, yy) {
  const dayNumber = jdFromDate(dd, mm, yy); // Số ngày Julius của ngày cần đổi

  // Tìm tháng 11 của năm trước và năm hiện tại (để xác định nhuận)
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoon(k + 1);
  if (monthStart > dayNumber) {
    monthStart = newMoon(k);
  }

  // Tính tháng 11 âm lịch năm trước (tháng 11 chứa đông chí)
  let a11 = getLunarMonth11(yy);
  let b11 = a11;

  // Nếu ngày đang xét trước tháng 11 → dùng năm trước
  if (a11 >= monthStart) {
    b11 = a11; // b11 = tháng 11 năm yy
    a11 = getLunarMonth11(yy - 1); // a11 = tháng 11 năm yy-1
  } else {
    b11 = getLunarMonth11(yy + 1); // b11 = tháng 11 năm yy+1
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);

  // Kiểm tra tháng nhuận
  let leapMonthDiff = 0;
  let isLeap = false;

  if (b11 - a11 > 365) {
    // Năm có nhuận
    leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      isLeap = diff === leapMonthDiff;
    }
  }

  let lunarMonth = diff + 11;
  if (lunarMonth > 12) lunarMonth -= 12;

  // Tính số ngày trong tháng âm lịch hiện tại
  const nextMonthStart = newMoon(k + 2);
  const daysInLunarMonth = nextMonthStart - monthStart;

  // Tính năm âm lịch
  let lunarYear;
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear = yy;
  } else {
    lunarYear = yy + 1;
  }

  // Tính năm âm lịch chính xác hơn
  if (a11 >= monthStart) {
    lunarYear = yy;
  } else {
    lunarYear = yy + 1;
  }

  // Xác định năm âm lịch dựa trên tháng
  const monthFromA11 = diff + 11;
  if (monthFromA11 > 12) {
    lunarYear = yy + 1;
  } else {
    lunarYear = yy;
  }

  // Tính Can Chi cho năm âm lịch
  const canChi = getCanChi(lunarYear);

  return {
    ngayAm: lunarDay,
    thangAm: lunarMonth,
    namAm: lunarYear,
    thangNhuan: isLeap,
    soNgayTrongThang: daysInLunarMonth,
    canChi: canChi,
  };
}

/**
 * Tính ngày Julius của đầu tháng 11 âm lịch trong năm dương lịch.
 * Tháng 11 âm lịch là tháng chứa ngày Đông Chí (khoảng 21/12 dương lịch).
 * @param {number} yy - Năm dương lịch
 * @returns {number} Số ngày Julius
 */
function getLunarMonth11(yy) {
  const off = jdFromDate(31, 12, yy) - 2415021; // Offset từ ngày gốc
  const k = Math.floor(off / 29.530588853);
  let nm = newMoon(k);
  const sunLong = sunLongitude(nm); // Vị trí mặt trời
  if (sunLong >= 9) {
    nm = newMoon(k - 1); // Lùi 1 tháng
  }
  return nm;
}

// ============================================================
// HỖ TRỢ: Can Chi, Thập Trai, v.v.
// ============================================================

/** Danh sách 10 Thiên Can */
const THIEN_CAN = [
  "Canh", "Tân", "Nhâm", "Quý", "Giáp",
  "Ất", "Bính", "Đinh", "Mậu", "Kỷ",
];

/** Danh sách 12 Địa Chi */
const DIA_CHI = [
  "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu",
  "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi",
];

/**
 * Tính Can Chi của năm âm lịch.
 * @param {number} namAm - Năm âm lịch
 * @returns {string} Chuỗi Can Chi (VD: "Giáp Thìn")
 */
function getCanChi(namAm) {
  const can = THIEN_CAN[namAm % 10];
  const chi = DIA_CHI[namAm % 12];
  return `${can} ${chi}`;
}

/**
 * Tính số thứ tự ngày trong năm (Day of Year), từ 1 đến 365/366.
 * Dùng để chọn kệ Kinh Pháp Cú theo ngày.
 * @param {Date} date - Đối tượng Date
 * @returns {number} Ngày thứ N trong năm
 */
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0); // Ngày 0 = 31/12 năm trước
  const diff =
    date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Kiểm tra xem ngày âm lịch có phải ngày Thập Trai không.
 * Ngày Thập Trai: 1, 8, 14, 15, 18, 23, 24, 28, 29, 30.
 * Nếu tháng thiếu (29 ngày), thêm ngày 27 vào danh sách.
 * @param {number} ngayAm - Ngày âm lịch
 * @param {number} soNgayTrongThang - Số ngày trong tháng âm lịch đó
 * @returns {boolean}
 */
function isThapTrai(ngayAm, soNgayTrongThang) {
  // Danh sách cơ bản
  const danhSachThapTrai = [1, 8, 14, 15, 18, 23, 24, 28, 29, 30];
  // Nếu tháng thiếu (chỉ có 29 ngày), thêm ngày 27
  if (soNgayTrongThang === 29) {
    danhSachThapTrai.push(27);
  }
  return danhSachThapTrai.includes(ngayAm);
}

/**
 * Tính thông tin âm lịch cho một ngày dương lịch cụ thể.
 * Đây là hàm wrapper tiện dụng cho toàn bộ app.
 * @param {Date} date - Đối tượng Date (hoặc để trống để dùng hôm nay)
 * @returns {object} Thông tin âm lịch đầy đủ
 */
function getLunarDate(date) {
  date = date || new Date();
  const dd = date.getDate();
  const mm = date.getMonth() + 1; // JS month is 0-indexed
  const yy = date.getFullYear();
  return convertSolarToLunar(dd, mm, yy);
}

/**
 * Lấy thông tin lịch cho tất cả ngày trong tháng dương lịch.
 * @param {number} year - Năm dương lịch
 * @param {number} month - Tháng dương lịch (1-12)
 * @returns {Array<object>} Mảng thông tin từng ngày
 */
function getMonthData(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate(); // Số ngày trong tháng DL
  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const lunar = getLunarDate(date);
    result.push({
      duongLich: d,
      thu: date.getDay(), // 0=CN, 1=T2, ..., 6=T7
      ...lunar,
      laThapTrai: isThapTrai(lunar.ngayAm, lunar.soNgayTrongThang),
    });
  }
  return result;
}

// ============================================================
// TÊN THÁNG ÂM LỊCH & TIỆN ÍCH HIỂN THỊ
// ============================================================

/** Tên các tháng âm lịch */
const TEN_THANG_AM = [
  "", // index 0 (placeholder)
  "Giêng", "Hai", "Ba", "Tư", "Năm", "Sáu",
  "Bảy", "Tám", "Chín", "Mười", "Một", "Chạp",
];

/** Tên các ngày trong tuần */
const TEN_THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Tên tháng tiếng Việt đầy đủ */
const TEN_THANG_DL = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
