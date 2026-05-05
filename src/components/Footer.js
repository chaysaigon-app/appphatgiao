'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(160deg, #0f2b10 0%, #1b4d1e 55%, #0f2b10 100%)',
      color: '#e8f5e9',
      fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
      marginTop: '3rem',
    }}>
      {/* Top accent line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #388e3c, #a5d6a7, #ffca28, #a5d6a7, #388e3c)' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem',
        }}>

          {/* ── Brand ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>🌿</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#a5d6a7', lineHeight: 1.2 }}>
                  Địa Điểm Ăn Chay
                </div>
                <div style={{ fontSize: '0.68rem', color: '#81c784', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  diadiemanchay.com
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#c8e6c9', lineHeight: 1.75, margin: '0 0 1.2rem' }}>
              Nền tảng cộng đồng ăn chay lớn nhất Việt Nam — nơi gặp gỡ của người yêu lối sống xanh, từ bi và bền vững. 1000+ quán chay toàn quốc, diễn đàn 8 chuyên mục, gian hàng chay, VIP doanh nghiệp và kho tri thức Phật pháp & dinh dưỡng chay.
            </p>
            {/* Social icons - display only, no contact */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href="https://www.facebook.com/groups/anchaysaigon" target="_blank" rel="noopener noreferrer"
                aria-label="Group Facebook Ăn Chay Sài Gòn"
                style={iconBtn('#1877f2')}>
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer"
                aria-label="YouTube Địa Điểm Ăn Chay"
                style={iconBtn('#ff0000')}>
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* ── Khám phá ── */}
          <div>
            <h4 style={colTitle}>🍃 Khám phá</h4>
            <ul style={linkList}>
              {[
                { href: '/ban-do',                      label: '📍 Tìm quán chay gần tôi' },
                { href: '/quan-an',                     label: '🗺️ Danh sách quán toàn quốc' },
                { href: '/dien-dan',                    label: '💬 Diễn đàn cộng đồng' },
                { href: '/dien-dan?cat=phat-phap',      label: '🙏 Phật Pháp' },
                { href: '/dien-dan?cat=cong-thuc',      label: '🍳 Công thức nấu chay' },
                { href: '/dien-dan?cat=dinh-duong',     label: '🥗 Dinh dưỡng & Sức khoẻ' },
                { href: '/dien-dan?cat=loi-song',       label: '🌿 Lối sống xanh' },
                { href: '/tri-thuc-phat-giao',          label: '📖 Tri Thức Phật Giáo Nguyên Thủy' },
                { href: '/xem-phap',                    label: '🎬 Xem Pháp — Video Pháp Thoại' },
                { href: '/nghe-phap',                   label: '🎧 Nghe Pháp — Pháp Âm & Thiền Định' },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} style={linkStyle}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* ── Dịch vụ ── */}
          <div>
            <h4 style={colTitle}>⭐ Dịch vụ & Hỗ trợ</h4>
            <ul style={linkList}>
              <li><Link href="/them-quan" style={linkStyle}>➕ Đăng quán chay của bạn</Link></li>
              <li><Link href="/lien-he?service=vip1" style={{ ...linkStyle, color: '#ffca28' }}>🏆 VIP Diễn đàn — duyệt bài tự động</Link></li>
              <li><Link href="/lien-he?service=vip2" style={{ ...linkStyle, color: '#64b5f6' }}>📘 VIP Group Facebook</Link></li>
              <li><Link href="/lien-he?service=vip_nha_hang_1" style={{ ...linkStyle, color: '#ffb74d' }}>🥉 VIP Nhà Hàng Cơ bản</Link></li>
              <li><Link href="/lien-he?service=vip_nha_hang_2" style={{ ...linkStyle, color: '#cfd8dc' }}>🥈 VIP Nhà Hàng Nổi bật</Link></li>
              <li><Link href="/lien-he?service=vip_nha_hang_3" style={{ ...linkStyle, color: '#ffe082' }}>🥇 VIP Nhà Hàng Premium</Link></li>
              <li style={{ paddingTop: '6px' }}>
                <Link href="/lien-he" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #43a047, #2e7d32)',
                  color: '#fff', padding: '8px 16px', borderRadius: '20px',
                  textDecoration: 'none', fontWeight: 700, fontSize: '0.83rem',
                  boxShadow: '0 3px 12px rgba(66,160,71,0.45)',
                }}>
                  📩 Liên hệ Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Về chúng tôi ── */}
          <div>
            <h4 style={colTitle}>🙏 Về Địa Điểm Ăn Chay</h4>
            <p style={{ fontSize: '0.82rem', color: '#a5d6a7', lineHeight: 1.8, margin: '0 0 1rem' }}>
              Được xây dựng với tâm nguyện kết nối cộng đồng — nơi mọi người cùng học hỏi, giao lưu, chia sẻ tri thức về lối sống chay và buôn bán, quảng bá sản phẩm chay lành mạnh đến đúng người cần.
            </p>
            <ul style={linkList}>
              {[
                { href: '/gioi-thieu', label: 'Giới thiệu' },
                { href: '/huong-dan',  label: 'Hướng dẫn sử dụng' },
                { href: '/lien-he',    label: 'Liên hệ & Hỗ trợ' },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} style={{ ...linkStyle, fontSize: '0.82rem' }}>→ {label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── SEO keyword block ── */}
        <div style={{
          borderTop: '1px solid rgba(165,214,167,0.12)',
          paddingTop: '1.4rem',
          marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '0.72rem', color: '#4a7c4e', lineHeight: 2, margin: 0, textAlign: 'center' }}>
quán ăn chay · nhà hàng chay · đồ chay ngon · cơm chay · bún bò chay · phở chay · lẩu chay · bánh mì chay · cơm tấm chay ·
            ăn chay trường · ăn chay kỳ · thuần chay · vegan Việt Nam · đồ ăn chay Sài Gòn · quán chay Hà Nội · quán chay Đà Nẵng ·
            diễn đàn ăn chay · Phật pháp · ăn chay theo đạo Phật · Ahiṃsā · bất bạo động · thiền chay ·
            dinh dưỡng chay · protein thực vật · omega-3 thực vật · B12 · sắt thực vật ·
            VIP nhà hàng chay · quảng cáo quán chay · đăng ký quán chay · gian hàng chay ·
            lối sống xanh · zero waste · yoga ăn chay · cộng đồng ăn chay Việt Nam
          </p>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          borderTop: '1px solid rgba(165,214,167,0.12)',
          paddingTop: '1.1rem',
          paddingBottom: '1.4rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#81c784' }}>
            © {new Date().getFullYear()} <strong style={{ color: '#a5d6a7' }}>Địa Điểm Ăn Chay</strong> · diadiemanchay.com
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#4a7c4e', maxWidth: '560px', textAlign: 'right', lineHeight: 1.6 }}>
            Diễn đàn kết nối cộng đồng — thành viên tự chịu hoàn toàn trách nhiệm về nội dung đăng tải.
            Ban quản trị không lưu trữ thông tin giao dịch và không chịu trách nhiệm về hoạt động mua bán giữa các thành viên.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ── Style helpers ──────────────────────────────────────────────────────────────
const colTitle = {
  color: '#a5d6a7',
  fontWeight: 700,
  fontSize: '0.88rem',
  marginBottom: '0.9rem',
  marginTop: 0,
  letterSpacing: '0.04em',
}
const linkList = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}
const linkStyle = {
  color: '#c8e6c9',
  textDecoration: 'none',
  fontSize: '0.84rem',
  display: 'block',
  lineHeight: 1.4,
}
function iconBtn(bg) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: bg,
    color: '#fff',
    textDecoration: 'none',
    flexShrink: 0,
  }
}
