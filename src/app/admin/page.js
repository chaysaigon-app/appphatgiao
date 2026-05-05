'use client'
import AdminGuard from '@/components/AdminGuard'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection, getDocs, query, where, orderBy,
  limit, doc, updateDoc, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { getStats } from '@/lib/admin'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now()-d)/1000)
  if (s < 60)    return 'Vừa xong'
  if (s < 3600)  return Math.floor(s/60)+' phút'
  if (s < 86400) return Math.floor(s/3600)+' giờ'
  return Math.floor(s/86400)+' ngày'
}

const CATS = {
  'phat-phap': '🙏 Phật Pháp',
  'bat-dau': '🌱 Bắt đầu ăn chay',
  'dinh-duong': '🥗 Dinh dưỡng & Sức khoẻ',
  'cong-thuc': '🍳 Công thức & Nấu ăn',
  'tam-su': '💬 Tâm sự & Chia sẻ',
  'loi-song': '🌿 Lối sống xanh',
  'mua-ban': '🏪 Mua bán & Giới thiệu',
  'su-kien': '📅 Sự kiện & Tin tức',
  'kinh-nghiem': '💚 Kinh nghiệm',
  'hoi-dap': '❓ Hỏi đáp',
  'cho-chay': '🏪 Chợ chay',
}
const CAT_COLOR = {
  'phat-phap': 'bg-yellow-100 text-yellow-700',
  'bat-dau': 'bg-green-100 text-green-700',
  'dinh-duong': 'bg-teal-100 text-teal-700',
  'cong-thuc': 'bg-amber-100 text-amber-700',
  'tam-su': 'bg-pink-100 text-pink-700',
  'loi-song': 'bg-emerald-100 text-emerald-700',
  'mua-ban': 'bg-orange-100 text-orange-700',
  'su-kien': 'bg-blue-100 text-blue-700',
  'kinh-nghiem': 'bg-emerald-100 text-emerald-700',
  'hoi-dap': 'bg-purple-100 text-purple-700',
  'cho-chay': 'bg-orange-100 text-orange-700',
}

// ── CARD BÀI CHỜ DUYỆT ─────────────────────────────────────────────────────
function PendingCard({ topic, onApproved, onCategoryChange }) {
  const [loading, setLoading]    = useState(false)
  const [done,    setDone]       = useState(false)
  const [editCat, setEditCat]    = useState(false)

  async function approve() {
    setLoading(true)
    await updateDoc(doc(db,'forum_topics',topic.id), {
      promoted: true, promotedAt: serverTimestamp(), promotedBy: 'admin-dashboard'
    })
    setDone(true)
    if (onApproved) onApproved(topic.id)
    setLoading(false)
  }

  async function changeCategory(newCat) {
    await updateDoc(doc(db,'forum_topics',topic.id), { category: newCat })
    setEditCat(false)
    if (onCategoryChange) onCategoryChange(topic.id, newCat)
  }

  if (done) return null

  const isLegacy = topic.category && !CATS[topic.category]

  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {/* Select sửa chuyên mục ngay tại chỗ */}
          {editCat ? (
            <select autoFocus defaultValue={topic.category||''}
              onChange={e=>changeCategory(e.target.value)}
              onBlur={()=>setEditCat(false)}
              className="text-xs border border-green-400 rounded-lg px-2 py-0.5 focus:outline-none bg-white font-bold">
              <option value="" disabled>Chọn chuyên mục</option>
              {Object.entries(CATS).map(([v,l])=>(
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          ) : (
            <button onClick={()=>setEditCat(true)} title="Bấm để sửa chuyên mục"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:ring-2 hover:ring-green-300 transition-all ${
                isLegacy ? 'bg-red-100 text-red-600 ring-1 ring-red-300' :
                CAT_COLOR[topic.category]||'bg-gray-100 text-gray-500'
              }`}>
              {isLegacy ? `⚠️ ${topic.category}` : CATS[topic.category]||'—'} ✎
            </button>
          )}
        </div>
        <p className="text-sm font-bold text-gray-900 line-clamp-1">{topic.title}</p>
        <p className="text-[11px] text-gray-400">{topic.authorName} · {timeAgo(topic.createdAt)} trước</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0 items-center">
        <button onClick={approve} disabled={loading}
          className="text-xs bg-green-600 hover:bg-green-700 text-white font-black px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
          {loading ? '⏳' : '✅ Duyệt'}
        </button>
        <a href={`/dien-dan/${topic.id}`} target="_blank"
          className="text-[11px] text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-2 py-1.5 rounded-xl font-bold transition-colors">
          Xem
        </a>
      </div>
    </div>
  )
}

// ── ROW BÀI MỚI NHẤT (có nút sửa chuyên mục + publish) ──────────────────────
function RecentRow({ topic: initT }) {
  const [topic,   setTopic]   = useState(initT)
  const [editCat, setEditCat] = useState(false)
  const [busy,    setBusy]    = useState(false)

  const isLegacy = topic.category && !CATS[topic.category]

  async function changeCategory(newCat) {
    setBusy(true)
    await updateDoc(doc(db,'forum_topics',topic.id), { category: newCat })
    setTopic(p=>({...p, category: newCat}))
    setEditCat(false)
    setBusy(false)
  }

  async function togglePromote() {
    setBusy(true)
    const v = !topic.promoted
    await updateDoc(doc(db,'forum_topics',topic.id), {
      promoted: v, promotedAt: v ? serverTimestamp() : null
    })
    setTopic(p=>({...p, promoted: v}))
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        {/* Chuyên mục — bấm để sửa */}
        <div className="mb-0.5">
          {editCat ? (
            <select autoFocus defaultValue={topic.category||''}
              onChange={e=>changeCategory(e.target.value)}
              onBlur={()=>setEditCat(false)}
              className="text-xs border border-green-400 rounded-lg px-2 py-0.5 focus:outline-none bg-white font-bold">
              <option value="" disabled>Chọn chuyên mục</option>
              {Object.entries(CATS).map(([v,l])=>(
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          ) : (
            <button onClick={()=>setEditCat(true)} title="Bấm để sửa chuyên mục"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:ring-2 hover:ring-green-300 transition-all ${
                isLegacy ? 'bg-red-100 text-red-600 ring-1 ring-red-300' :
                CAT_COLOR[topic.category]||'bg-gray-100 text-gray-500'
              }`}>
              {isLegacy ? `⚠️ ${topic.category}` : CATS[topic.category]||'—'} ✎
            </button>
          )}
        </div>
        <p className="text-sm font-bold text-gray-900 line-clamp-1">{topic.title}</p>
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span>{topic.authorName}</span>
          <span>{timeAgo(topic.createdAt)} trước</span>
          {topic.featured && <span className="text-amber-500">📌</span>}
        </div>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {/* Nút publish/unpublish */}
        <button onClick={togglePromote} disabled={busy}
          title={topic.promoted ? 'Đang hiện trang chủ — bấm để ẩn' : 'Chưa lên trang chủ — bấm để publish'}
          className={`text-[11px] border px-2 py-1.5 rounded-xl font-bold transition-colors ${
            topic.promoted
              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-50'
              : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
          }`}>
          {topic.promoted ? '✅ Live' : '⏳ Publish'}
        </button>
        <a href={`/dien-dan/${topic.id}`} target="_blank"
          className="text-[11px] text-blue-400 hover:text-blue-600 border border-blue-200 px-2 py-1.5 rounded-xl font-bold transition-colors">
          Xem
        </a>
      </div>
    </div>
  )
}

// ── ALL TOPICS PANEL — kéo hết bài từ Firestore ──────────────────────────────
function AllTopicsPanel() {
  const [topics,    setTopics]    = useState([])
  const [loaded,    setLoaded]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterPub, setFilterPub] = useState('all') // all | published | pending
  const [page,      setPage]      = useState(0)
  const PER_PAGE = 30

  async function load() {
    setLoading(true)
    try {
      // Kéo toàn bộ — không giới hạn để admin quản lý đầy đủ
      const snap = await getDocs(query(
        collection(db,'forum_topics'),
        orderBy('createdAt','desc'),
        limit(500)
      ))
      setTopics(snap.docs.map(d=>({id:d.id,...d.data()})))
      setLoaded(true)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  async function changeCategory(id, newCat) {
    await updateDoc(doc(db,'forum_topics',id), { category: newCat })
    setTopics(p=>p.map(t=>t.id===id?{...t,category:newCat}:t))
  }

  async function togglePromote(t) {
    const v = !t.promoted
    await updateDoc(doc(db,'forum_topics',t.id), {
      promoted: v, promotedAt: v ? serverTimestamp() : null
    })
    setTopics(p=>p.map(x=>x.id===t.id?{...x,promoted:v}:x))
  }

  async function toggleHide(t) {
    await updateDoc(doc(db,'forum_topics',t.id), { hidden: !t.hidden })
    setTopics(p=>p.map(x=>x.id===t.id?{...x,hidden:!t.hidden}:x))
  }

  // Bulk: sửa tất cả legacy category
  async function fixAllLegacy() {
    const LEGACY_MAP = {
      'chia-se':'tam-su','suc-khoe':'dinh-duong','moi-truong':'loi-song',
      'tam-linh':'phat-phap','tin-tuc':'su-kien','hanh-trinh':'tam-su',
      'san-pham':'mua-ban','quan-an':'mua-ban','video':'tam-su',
    }
    const toFix = topics.filter(t=>t.category && !CATS[t.category] && LEGACY_MAP[t.category])
    if (!toFix.length) { alert('Không có bài nào cần sửa!'); return }
    if (!confirm(`Tự động sửa ${toFix.length} bài có chuyên mục cũ?`)) return
    const batch = writeBatch(db)
    toFix.forEach(t => batch.update(doc(db,'forum_topics',t.id), {
      category: LEGACY_MAP[t.category]
    }))
    await batch.commit()
    const updMap = Object.fromEntries(toFix.map(t=>[t.id, LEGACY_MAP[t.category]]))
    setTopics(p=>p.map(t=>updMap[t.id]?{...t,category:updMap[t.id]}:t))
    alert(`✅ Đã sửa ${toFix.length} bài`)
  }

  // Filter + search
  const filtered = topics.filter(t => {
    if (filterCat && t.category !== filterCat) return false
    if (filterPub === 'published' && !t.promoted) return false
    if (filterPub === 'pending'   &&  t.promoted) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (t.title||'').toLowerCase().includes(q) ||
             (t.authorName||'').toLowerCase().includes(q)
    }
    return true
  })

  const paginated = filtered.slice(page*PER_PAGE, (page+1)*PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const legacyCount = topics.filter(t=>t.category&&!CATS[t.category]).length

  if (!loaded) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <p className="text-3xl mb-3">📋</p>
      <p className="text-sm text-gray-500 mb-4">Kéo toàn bộ bài viết từ Firestore để quản lý</p>
      <button onClick={load} disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl transition-colors">
        {loading ? '⏳ Đang tải...' : '📥 Tải tất cả bài viết'}
      </button>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-gray-900">📋 Tất cả bài viết</h3>
            <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
              {filtered.length}/{topics.length}
            </span>
            {legacyCount > 0 && (
              <button onClick={fixAllLegacy}
                className="text-xs bg-red-100 text-red-600 hover:bg-red-200 font-bold px-2 py-0.5 rounded-full transition-colors">
                ⚠️ {legacyCount} chuyên mục cũ — Tự động sửa
              </button>
            )}
          </div>
          <button onClick={load} disabled={loading}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-1.5 rounded-xl">
            {loading?'⏳':'🔄'} Tải lại
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <input type="search" value={search} onChange={e=>{ setSearch(e.target.value); setPage(0) }}
            placeholder="🔍 Tìm tiêu đề, tác giả..."
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-green-400 flex-1 min-w-40"/>
          <select value={filterCat} onChange={e=>{ setFilterCat(e.target.value); setPage(0) }}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none">
            <option value="">Tất cả danh mục</option>
            {Object.entries(CATS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            <option value="__legacy__">⚠️ Danh mục cũ</option>
          </select>
          <select value={filterPub} onChange={e=>{ setFilterPub(e.target.value); setPage(0) }}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none">
            <option value="all">Tất cả</option>
            <option value="published">✅ Đã publish</option>
            <option value="pending">⏳ Chưa publish</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">⏳ Đang tải...</div>
      ) : paginated.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">Không có bài nào</div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {paginated.map(t => {
              const isLegacy = t.category && !CATS[t.category]
              return (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 ${t.hidden?'opacity-50':''}`}>
                  {/* Chuyên mục — select inline */}
                  <select
                    value={t.category||''}
                    onChange={e=>changeCategory(t.id, e.target.value)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer flex-shrink-0 ${
                      isLegacy ? 'bg-red-100 text-red-600 ring-1 ring-red-300' :
                      CAT_COLOR[t.category]||'bg-gray-100 text-gray-500'
                    }`}
                    title="Bấm để đổi chuyên mục">
                    {isLegacy && <option value={t.category}>⚠️ {t.category}</option>}
                    {Object.entries(CATS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{t.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{t.authorName}</span>
                      <span>{timeAgo(t.createdAt)} trước</span>
                      <span>💬{t.replyCount||0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>togglePromote(t)}
                      title={t.promoted?'Live — bấm để ẩn':'Chưa publish — bấm để live'}
                      className={`text-[11px] border px-2 py-1 rounded-lg font-bold transition-colors ${
                        t.promoted
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                      }`}>
                      {t.promoted?'✅':'⏳'}
                    </button>
                    <button onClick={()=>toggleHide(t)} title={t.hidden?'Đang ẩn — bấm để hiện':'Bấm để ẩn'}
                      className={`text-[11px] border px-2 py-1 rounded-lg font-bold transition-colors ${
                        t.hidden
                          ? 'bg-red-100 text-red-600 border-red-200'
                          : 'text-gray-300 border-gray-200 hover:text-red-500 hover:border-red-200'
                      }`}>
                      {t.hidden?'👁 Hiện':'🚫'}
                    </button>
                    <a href={`/dien-dan/${t.id}`} target="_blank"
                      className="text-[11px] text-blue-400 border border-blue-200 px-2 py-1 rounded-lg font-bold hover:text-blue-600">
                      Xem
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Trang {page+1}/{totalPages} · {filtered.length} bài
              </span>
              <div className="flex gap-1">
                <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl font-bold disabled:opacity-40 hover:bg-gray-50">
                  ← Trước
                </button>
                <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl font-bold disabled:opacity-40 hover:bg-gray-50">
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
function AdminDashboardInner() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [pending, setPending] = useState([])
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [baseStats, allTopicsSnap, claimSnap, qtvSnap] = await Promise.all([
          getStats(),
          getDocs(query(collection(db,'forum_topics'), orderBy('createdAt','desc'), limit(200))),
          getDocs(query(collection(db,'claim_requests'), where('status','==','pending'), limit(99))).catch(()=>({size:0})),
          getDocs(query(collection(db,'moderator_requests'), where('status','==','pending'), limit(99))).catch(()=>({size:0})),
        ])
        const all     = allTopicsSnap.docs.map(d=>({id:d.id,...d.data()}))
        const total   = all.filter(t=>!t.hidden).length
        const pList   = all.filter(t=>!t.promoted&&!t.hidden)
          .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
        const rList   = all.slice(0,6)
        setPending(pList); setRecent(rList)
        setStats({ ...baseStats, forumTotal:total, pendingForum:pList.length,
          pendingClaim:claimSnap.size, pendingQtv:qtvSnap.size })
      } catch(e){ console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  function handleApproved(id) {
    setPending(p=>p.filter(t=>t.id!==id))
    setStats(s=>s?{...s,pendingForum:Math.max(0,(s.pendingForum||1)-1)}:s)
  }

  function handleCatChange(id, newCat) {
    setPending(p=>p.map(t=>t.id===id?{...t,category:newCat}:t))
    setRecent(r=>r.map(t=>t.id===id?{...t,category:newCat}:t))
  }

  const hour = new Date().getHours()
  const greeting = hour<12?'Chào buổi sáng':hour<18?'Chào buổi chiều':'Chào buổi tối'
  const firstName = user?.displayName?.split(' ').pop()||'Admin'

  const STAT_CARDS = stats ? [
    { label:'Quán ăn',      value:stats.restaurants,  icon:'🥗', href:'/admin/quan-an',    color:'bg-green-50 text-green-700' },
    { label:'Thành viên',   value:stats.users,         icon:'👥', href:'/admin/thanh-vien', color:'bg-blue-50 text-blue-700' },
    { label:'Bài diễn đàn', value:stats.forumTotal||0, icon:'💬', href:'/admin/forum',      color:'bg-purple-50 text-purple-700' },
    { label:'Chờ duyệt',    value:stats.pendingForum||0,icon:'⏳',href:'/admin/forum',
      color:stats.pendingForum>0?'bg-amber-50 text-amber-700':'bg-gray-50 text-gray-400', pulse:stats.pendingForum>0 },
    { label:'Claim quán',   value:stats.pendingClaim||0,icon:'🏪',href:'/admin/claim',
      color:stats.pendingClaim>0?'bg-red-50 text-red-600':'bg-gray-50 text-gray-400', pulse:stats.pendingClaim>0 },
    { label:'Đơn QTV',      value:stats.pendingQtv||0, icon:'🌿', href:'/admin/tinh-nguyen',
      color:stats.pendingQtv>0?'bg-teal-50 text-teal-700':'bg-gray-50 text-gray-400', pulse:stats.pendingQtv>0 },
  ] : []

  return (
    <div className="p-6 max-w-5xl space-y-6">

      {/* GREETING */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">{greeting}, {firstName} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </p>
      </div>

      {/* STAT CARDS */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i)=><div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STAT_CARDS.map(c=>(
            <Link key={c.label} href={c.href}
              className={`relative rounded-2xl p-5 transition-all hover:scale-[1.02] hover:shadow-sm ${c.color}`}>
              {c.pulse && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"/>
                </span>
              )}
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-3xl font-black leading-none mb-1">{c.value.toLocaleString('vi-VN')}</div>
              <div className="text-xs font-medium opacity-80">{c.label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* HÀNG 2: PENDING + RECENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* BÀI CHỜ DUYỆT */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-gray-900">⏳ Chờ lên trang chủ</h2>
              {pending.length>0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-black px-2 py-0.5 rounded-full">{pending.length}</span>
              )}
            </div>
            <Link href="/admin/forum" className="text-xs text-green-600 font-bold hover:underline">Tất cả →</Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : pending.length===0 ? (
            <div className="p-10 text-center text-gray-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-medium">Không có bài nào chờ duyệt</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pending.slice(0,8).map(t=>(
                <PendingCard key={t.id} topic={t} onApproved={handleApproved} onCategoryChange={handleCatChange}/>
              ))}
              {pending.length>8 && (
                <div className="px-5 py-3 text-center">
                  <Link href="/admin/forum" className="text-xs text-green-600 font-bold hover:underline">
                    +{pending.length-8} bài khác →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BÀI MỚI NHẤT */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-black text-gray-900">💬 Bài viết mới nhất</h2>
            <Link href="/admin/forum" className="text-xs text-green-600 font-bold hover:underline">Quản lý →</Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : recent.length===0 ? (
            <div className="p-10 text-center text-gray-400">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm">Chưa có bài viết nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(t=><RecentRow key={t.id} topic={t}/>)}
            </div>
          )}
        </div>
      </div>

      {/* TẤT CẢ BÀI VIẾT — kéo từ Firestore */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900">📋 Quản lý toàn bộ bài viết</h2>
          {!showAll && (
            <button onClick={()=>setShowAll(true)}
              className="text-sm bg-green-600 hover:bg-green-700 text-white font-black px-4 py-2 rounded-xl transition-colors">
              📥 Mở bảng quản lý
            </button>
          )}
        </div>
        {showAll && <AllTopicsPanel/>}
      </div>

      {/* THAO TÁC NHANH */}
      <div>
        <h2 className="font-black text-gray-900 mb-3">⚡ Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {href:'/admin/spotlight',   icon:'✨',label:'Spotlight Banner',      desc:'Nhà hàng nổi bật trang chủ'},
            {href:'/admin/forum',      icon:'💬',label:'Duyệt bài diễn đàn',   desc:'Đẩy bài lên trang chủ',  badge:stats?.pendingForum},
            {href:'/admin/quan-an',    icon:'🥗',label:'Thêm quán ăn mới',      desc:'Import hoặc thêm thủ công'},
            {href:'/admin/vip',        icon:'⭐',label:'Quản lý VIP',           desc:'Thành viên & yêu cầu đăng ký'},
            {href:'/admin/thanh-vien', icon:'👥',label:'Thành viên',             desc:'Quản lý tài khoản'},
            {href:'/admin/claim',      icon:'🏪',label:'Duyệt claim quán',      desc:'Xác nhận chủ quán',      badge:stats?.pendingClaim},
            {href:'/admin/badwords',     icon:'🚫',label:'Quản lý từ cấm',        desc:'Bật/tắt, thêm từ, scan bài vi phạm'},
            {href:'/admin/vip-nha-hang', icon:'🏪',label:'VIP Nhà Hàng',           desc:'Quản lý gói VIP quán ăn chay'},
            {href:'/admin/video-phap',   icon:'🎬',label:'Video Pháp',             desc:'Thêm/xóa pháp thoại YouTube'},
            {href:'/admin/nghe-phap',    icon:'🎧',label:'Pháp Âm',               desc:'Thêm/xóa pháp âm Spotify & YouTube'},
          ].map(l=>(
            <Link key={l.href} href={l.href}
              className="relative bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:bg-green-50/30 transition-all group">
              {l.badge>0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {l.badge}
                </span>
              )}
              <div className="text-2xl mb-2">{l.icon}</div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">{l.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
export default function AdminDashboard() {
  return <AdminGuard><AdminDashboardInner /></AdminGuard>
}
