'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import AdminGuard from '@/components/AdminGuard'

function ytThumb(id) { return `https://img.youtube.com/vi/${id}/mqdefault.jpg` }
function parseYouTubeId(url) {
  const m = (url||'').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function AdminVideoPhapPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [link, setLink] = useState('')
  const [meta, setMeta] = useState(null)   // { title, teacher, thumbnail } auto-fetched
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getDocs(query(collection(db,'dharma_videos'), orderBy('createdAt','desc')))
      .then(snap => setVideos(snap.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const ytId = parseYouTubeId(link)

  // Auto-fetch từ noembed khi link thay đổi và hợp lệ
  useEffect(() => {
    if (!ytId) { setMeta(null); return }
    setFetching(true); setMeta(null)
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`)
      .then(r => r.json())
      .then(d => {
        setMeta({
          title: d.title || '',
          teacher: d.author_name || '',
          thumbnail: d.thumbnail_url || ytThumb(ytId),
          description: '',
        })
      })
      .catch(() => setMeta({ title:'', teacher:'', thumbnail: ytThumb(ytId), description:'' }))
      .finally(() => setFetching(false))
  }, [ytId])

  async function handleAdd(e) {
    e.preventDefault()
    if (!ytId) { setMsg('❌ Link YouTube không hợp lệ'); return }
    if (!meta?.title?.trim()) { setMsg('❌ Tiêu đề trống — kiểm tra lại link'); return }
    setSaving(true); setMsg('')
    try {
      const ref = await addDoc(collection(db,'dharma_videos'), {
        youtube_id: ytId,
        title: meta.title.trim(),
        teacher: meta.teacher.trim(),
        description: meta.description?.trim() || '',
        thumbnail: meta.thumbnail || ytThumb(ytId),
        visible: true,
        createdAt: serverTimestamp(),
      })
      setVideos(p => [{ id:ref.id, youtube_id:ytId, ...meta, visible:true, createdAt:null }, ...p])
      setLink(''); setMeta(null)
      setMsg('✅ Đã thêm!')
    } catch(e) { setMsg('❌ Lỗi: ' + e.message) }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Xóa video này?')) return
    await deleteDoc(doc(db,'dharma_videos',id)).catch(()=>{})
    setVideos(p=>p.filter(v=>v.id!==id))
  }

  async function handleToggle(id, cur) {
    await updateDoc(doc(db,'dharma_videos',id),{visible:!cur}).catch(()=>{})
    setVideos(p=>p.map(v=>v.id===id?{...v,visible:!cur}:v))
  }

  return (
    <AdminGuard>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Quản lý Video Pháp</h1>
            <p className="text-sm text-gray-500">Dán link YouTube → tự lấy tiêu đề & mô tả</p>
          </div>
        </div>

        {/* Add form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">➕ Thêm video mới</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Link input */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Link YouTube *</label>
              <input value={link} onChange={e=>setLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 transition-colors"
              />
              {link && !ytId && <p className="text-xs text-red-500 mt-1">Link không hợp lệ</p>}
            </div>

            {/* Preview sau khi fetch */}
            {ytId && (
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                {fetching ? (
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
                    <span className="text-sm text-gray-500">Đang lấy thông tin từ YouTube...</span>
                  </div>
                ) : meta ? (
                  <div className="flex gap-4 p-4">
                    <img src={meta.thumbnail || ytThumb(ytId)} alt="" className="w-32 rounded-lg object-cover flex-shrink-0" style={{aspectRatio:'16/9'}}/>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tiêu đề</label>
                        <input value={meta.title} onChange={e=>setMeta(m=>({...m,title:e.target.value}))}
                          className="w-full border-b border-gray-200 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:border-red-400 bg-transparent"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giảng sư / Kênh</label>
                        <input value={meta.teacher} onChange={e=>setMeta(m=>({...m,teacher:e.target.value}))}
                          className="w-full border-b border-gray-200 py-1 text-sm text-gray-600 focus:outline-none focus:border-red-400 bg-transparent"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả ngắn (tuỳ chọn)</label>
                        <input value={meta.description} onChange={e=>setMeta(m=>({...m,description:e.target.value}))}
                          placeholder="Thêm mô tả nếu muốn..."
                          className="w-full border-b border-gray-200 py-1 text-sm text-gray-500 focus:outline-none focus:border-red-400 bg-transparent placeholder-gray-300"/>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving||fetching||!ytId||!meta?.title?.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-40 transition-colors">
                {saving ? '⏳ Đang lưu...' : '➕ Thêm video'}
              </button>
              {msg && <span className={`text-sm font-semibold ${msg.startsWith('✅')?'text-green-600':'text-red-500'}`}>{msg}</span>}
            </div>
          </form>
        </div>

        {/* Video list */}
        <h2 className="text-sm font-bold text-gray-700 mb-3">{videos.length} video</h2>
        {loading ? <p className="text-center py-8 text-gray-400">Đang tải...</p>
        : videos.length === 0 ? <p className="text-center py-8 text-gray-400">Chưa có video nào</p>
        : (
          <div className="space-y-3">
            {videos.map(v => (
              <div key={v.id} className={`bg-white rounded-xl border p-4 flex gap-4 items-center ${!v.visible?'opacity-50 border-red-100':'border-gray-100'}`}>
                <img src={ytThumb(v.youtube_id)} alt="" className="w-28 rounded-lg flex-shrink-0 object-cover" style={{aspectRatio:'16/9'}}/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{v.title}</p>
                  {v.teacher && <p className="text-xs text-gray-500 mt-0.5">{v.teacher}</p>}
                  <p className="text-[10px] text-gray-400 font-mono mt-1">{v.youtube_id}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={()=>handleToggle(v.id,v.visible)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${v.visible?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                    {v.visible?'✅ Hiện':'🚫 Ẩn'}
                  </button>
                  <button onClick={()=>handleDelete(v.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    🗑 Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
