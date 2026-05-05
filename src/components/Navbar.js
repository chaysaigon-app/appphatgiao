'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/i18n/LangContext'
import { useRouter, usePathname } from 'next/navigation'
import { getBookmarks } from '@/lib/bookmarks'
import LangToggle from './LangToggle'
import NotificationBell from './NotificationBell'

// ── Forum categories — must match dien-dan/page.js CAT_LABEL ─────────────────
const FORUM_CATS = [
  { cat: '',            icon: '🏠', label: 'Tất cả bài viết' },
  { cat: 'phat-phap',  icon: '🙏', label: 'Phật Pháp' },
  { cat: 'bat-dau',    icon: '🌱', label: 'Bắt đầu ăn chay' },
  { cat: 'dinh-duong', icon: '🥗', label: 'Dinh dưỡng & Sức khoẻ' },
  { cat: 'cong-thuc',  icon: '🍳', label: 'Công thức & Nấu ăn' },
  { cat: 'tam-su',     icon: '💬', label: 'Tâm sự & Chia sẻ' },
  { cat: 'loi-song',   icon: '🌿', label: 'Lối sống xanh' },
  { cat: 'mua-ban',    icon: '🏪', label: 'Mua bán & Giới thiệu' },
  { cat: 'su-kien',    icon: '📅', label: 'Sự kiện & Tin tức' },
]

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const { t, locale } = useLang()
  const [open, setOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setBookmarkCount(getBookmarks().length)
    function onChanged(e) { setBookmarkCount(e.detail.length) }
    window.addEventListener('bookmarks-changed', onChanged)
    return () => window.removeEventListener('bookmarks-changed', onChanged)
  }, [])

  async function handleLogout() { await logout(); router.push('/') }
  const isAdmin = profile?.role === 'admin'
  const showExploreBanner = pathname !== '/gioi-thieu'

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🥗</span>
          <span className="font-black text-gray-900 text-base hidden sm:block">
            Địa Điểm <span className="text-green-600">Ăn Chay</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden xl:flex items-center gap-1 flex-1 justify-center">

          {/* Bản Đồ Quán Chay */}
          <Link href="/ban-do"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
            🗺️ Bản Đồ Quán Chay
          </Link>

          {/* Danh Sách Nhà Hàng Chay */}
          <Link href="/quan-an"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
            🍽️ Nhà Hàng Chay
          </Link>

          {/* Diễn Đàn Ăn Chay — direct link */}
          <Link href="/dien-dan"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
            💬 Diễn Đàn Ăn Chay
          </Link>

          {/* Tri Thức Phật Giáo */}
          <Link href="/tri-thuc-phat-giao"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
            ☸️ Tri Thức
          </Link>

          {/* Xem Pháp */}
          <Link href="/xem-phap"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
            🎬 Xem Pháp
          </Link>

          {/* Nghe Pháp */}
          <Link href="/nghe-phap"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
            🎧 Nghe Pháp
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">

          <a href="https://ggreencoin.com" target="_blank" rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1 text-xs text-green-700 font-bold bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-full hover:bg-green-100 transition-colors">
            🪙 GC
          </a>

          <LangToggle className="hidden md:flex"/>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenu(!mobileMenu)}
            className="xl:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            {mobileMenu
              ? <span className="text-lg font-bold">✕</span>
              : <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
            }
          </button>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
                {profile && (
                  <span className="hidden sm:flex items-center gap-1 bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full font-bold border border-green-200">
                    🪙 {profile.greenCoins ?? 0}
                  </span>
                )}
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-sm">
                  {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                </div>
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
                  <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-2xl w-56 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-black text-gray-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      {profile && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            🪙 {profile.greenCoins ?? 0} GC
                          </span>
                          {profile.role && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                              ${isAdmin ? 'bg-purple-100 text-purple-700'
                                : profile.role === 'moderator' ? 'bg-blue-100 text-blue-700'
                                : profile.role === 'vendor' ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'}`}>
                              {profile.role === 'moderator' ? '🌿 QTV' : profile.role}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-2"><LangToggle/></div>
                    </div>
                    {[
                      ['/profile',     '👤', 'Tài khoản & GC'],
                      ['/yeu-thich',   '❤️', 'Quán yêu thích'],
                      ['/cua-toi',     '🏪', 'Quán của tôi'],
                      ['/tinh-nguyen', '🌿', 'Làm QTV'],
                    ].map(([href, icon, label]) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        onClick={() => setOpen(false)}>
                        <span>{icon}</span>{label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-1"/>
                    <a href="https://ggreencoin.com" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 font-bold transition-colors"
                      onClick={() => setOpen(false)}>
                      🪙 Green Coin ↗
                    </a>
                    {showExploreBanner && (
                      <Link href="/gioi-thieu"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium transition-colors"
                        onClick={() => setOpen(false)}>
                        ✨ Khám phá
                      </Link>
                    )}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1"/>
                        <Link href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                          onClick={() => setOpen(false)}>
                          ⚙️ Admin
                        </Link>
                        <Link href="/admin/vip"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                          onClick={() => setOpen(false)}>
                          ⭐ Quản lý VIP
                        </Link>
                        <Link href="/admin/bai-viet"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                          onClick={() => setOpen(false)}>
                          📝 Quản lý bài viết
                        </Link>
                        <Link href="/admin/forum"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                          onClick={() => setOpen(false)}>
                          💬 Quản lý diễn đàn
                        </Link>
                      </>
                    )}
                    <div className="border-t border-gray-100 my-1"/>
                    <button onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors">
                      🚪 Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/dang-nhap" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                Đăng nhập
              </Link>
              <Link href="/dang-ky" className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="xl:hidden border-t border-gray-100 bg-white pb-safe">
          <div className="max-w-6xl mx-auto px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">Địa điểm</p>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {[
                ['/ban-do',    '🗺️', 'Bản Đồ Quán Chay'],
                ['/quan-an',   '🍽️', 'Nhà Hàng Chay'],
                ['/tri-thuc-phat-giao', '☸️', 'Tri Thức PG'],
                ['/yeu-thich', '❤️', 'Yêu thích'],
                ['/xem-phap',  '🎬', 'Xem Pháp'],
                ['/nghe-phap', '🎧', 'Nghe Pháp'],
              ].map(([href, icon, label]) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 text-sm text-gray-700 font-medium py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenu(false)}>
                  <span>{icon}</span>{label}
                </Link>
              ))}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">Diễn Đàn Ăn Chay</p>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {FORUM_CATS.map(({ cat, icon, label }) => (
                <Link
                  key={cat || 'all'}
                  href={cat ? `/dien-dan?cat=${cat}` : '/dien-dan'}
                  className="flex items-center gap-2 text-sm text-gray-700 font-medium py-2 px-3 rounded-xl hover:bg-green-50 transition-colors"
                  onClick={() => setMobileMenu(false)}>
                  <span>{icon}</span>{label}
                </Link>
              ))}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">Khác</p>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {[
                ['/tin-tuc',     '📰', 'Tin tức'],
                ['/su-kien',     '📅', 'Sự kiện'],
                ['/video',       '🎬', 'Video'],
                ['/tinh-nguyen', '🌿', 'Làm QTV'],
                ['/gioi-thieu',  '✨', 'Giới thiệu'],
                ['/lien-he',     '📩', 'Liên hệ Admin'],
              ].map(([href, icon, label]) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 text-sm text-gray-700 font-medium py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenu(false)}>
                  <span>{icon}</span>{label}
                </Link>
              ))}
            </div>
          </div>
          <div className="px-4 pb-3 flex items-center gap-3 border-t border-gray-50 pt-2">
            <LangToggle/>
            <a href="https://ggreencoin.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-bold text-green-700">
              🪙 Green Coin ↗
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
