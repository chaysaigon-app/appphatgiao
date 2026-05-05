'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import AdminGuard from '@/components/AdminGuard'

function parseAudioLink(url) {
  if (!url) return null
  const sp = url.match(/open\.spotify\.com\/(track|episode|show|playlist|album)\/([a-zA-Z0-9]+)/)
  if (sp) return { type:'spotify', kind:sp[1], id:sp[2] }
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { type:'youtube', id:yt[1] }
  return null
}
const KIND_LABEL = { track:'Bài hát', episode:'Tập podcast', show:'Podcast', playlist:'Playlist', album:'Album' }

export default function AdminNghePhapPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [link, setLink] = useState('')
  const [meta, setMeta] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getDocs(query(collection(db,'dharma_audio'), orderBy('createdAt','desc')))
      .then(snap => setItems(snap.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const parsed = parseAudioLink(link)

  // Auto-fetch metadata
  useEffect(() => {
    if (!parsed) { setMeta(null); return }
    setFetching(true); setMeta(null)
    let url = ''
    if (parsed.type === 'spotify') {
      url = `https://open.spotify.com/oembed?url=${encodeURIComponent(link.trim())}`
    } else {
      url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${parsed.id}`
    }
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setMeta({
          title: d.title || '',
          teacher: d.author_name || d.provider_name || '',
          thumbnail: d.thumbnail_url || (parsed.type==='youtube' ? `https://img.youtube.com/vi/${parsed.id}/mqdefault.jpg` : ''),
          description: '',
        })
      })
      .catch(() => setMeta({ title:'', teacher:'', thumbnail: parsed.type==='youtube'?`https://img.youtube.com/vi/${parsed.id}/mqdefault.jpg`:'', description:'' }))
      .finally(() => setFetching(false))
  }, [link])

  async function handleAdd(e) {
    e.preventDefault()
    if (!parsed) { setMsg('❌ Link không hợp lệ'); return }
    if (!meta?.title?.trim()) { setMsg('❌ Tiêu đề trống'); return }
    setSaving(true); setMsg('')
    try {
      const data = {
        link: link.trim(), title: meta.title.trim(),
        teacher: meta.teacher.trim(), description: meta.description?.trim()||'',
        thumbnail: meta.thumbnail||'', type: parsed.type, visible: true,
        createdAt: serverTimestamp(),
      }
      if (parsed.type==='spotify') { data.spotify_id=parsed.id; data.spotify_kind=parsed.kind }
      if (parsed.type==='youtube') { data.youtube_id=parsed.id }
      const ref = await addDoc(collection(db,'dharma_audio'), data)
      setItems(p => [{id:ref.id,...data,createdAt:null},...p])
      setLink(''); setMeta(null); setMsg('✅ Đã thêm!')
    } catch(e) { setMsg('❌ Lỗi: '+e.message) }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Xóa bài này?')) return
    await deleteDoc(doc(db,'dharma_audio',id)).catch(()=>{})
    setItems(p=>p.filter(i=>i.id!==id))
  }

  async function handleToggle(id, cur) {
    await updateDoc(doc(db,'dharma_audio',id),{visible:!cur}).catch(()=>{})
    setItems(p=>p.map(i=>i.id===id?{...i,visible:!cur}:i))
  }

  return (
    <AdminGuard>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:'#1DB954'}}>🎧</div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Quản lý Pháp Âm</h1>
            <p className="text-sm text-gray-500">Dán link Spotify hoặc YouTube → tự lấy tiêu đề & ảnh bìa</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">➕ Thêm bài mới</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Link Spotify hoặc YouTube *</label>
              <input value={link} onChange={e=>setLink(e.target.value)}
                placeholder="https://open.spotify.com/... hoặc https://youtu.be/..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 transition-colors"
              />
              {link && !parsed && <p className="text-xs text-red-500 mt-1">Link không hợp lệ — cần Spotify hoặc YouTube</p>}
              {parsed && !fetching && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:parsed.type==='spotify'?'#1DB95420':'#ff000020',color:parsed.type==='spotify'?'#1DB954':'#ef4444'}}>
                    {parsed.type==='spotify' ? `Spotify · ${KIND_LABEL[parsed.kind]||parsed.kind}` : 'YouTube'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{parsed.id}</span>
                </div>
              )}
            </div>

            {parsed && (
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                {fetching ? (
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:'#1DB954',borderTopColor:'transparent'}}/>
                    <span className="text-sm text-gray-500">Đang lấy thông tin...</span>
                  </div>
                ) : meta ? (
                  <div className="flex gap-4 p-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{background:'#1DB95420'}}>
                      {meta.thumbnail ? <img src={meta.thumbnail} alt="" className="w-full h-full object-cover"/> : <span className="text-2xl">🎧</span>}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tiêu đề</label>
                        <input value={meta.title} onChange={e=>setMeta(m=>({...m,title:e.target.value}))}
                          className="w-full border-b border-gray-200 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:border-green-400 bg-transparent"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giảng sư / Kênh</label>
                        <input value={meta.teacher} onChange={e=>setMeta(m=>({...m,teacher:e.target.value}))}
                          className="w-full border-b border-gray-200 py-1 text-sm text-gray-600 focus:outline-none focus:border-green-400 bg-transparent"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả (tuỳ chọn)</label>
                        <input value={meta.description} onChange={e=>setMeta(m=>({...m,description:e.target.value}))}
                          placeholder="Thêm mô tả nếu muốn..."
                          className="w-full border-b border-gray-200 py-1 text-sm text-gray-500 focus:outline-none focus:border-green-400 bg-transparent placeholder-gray-300"/>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving||fetching||!parsed||!meta?.title?.trim()}
                className="font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-40 transition-colors text-black" style={{background:'#1DB954'}}>
                {saving ? '⏳ Đang lưu...' : '➕ Thêm bài'}
              </button>
              {msg && <span className={`text-sm font-semibold ${msg.startsWith('✅')?'text-green-600':'text-red-500'}`}>{msg}</span>}
            </div>
          </form>
        </div>

        <h2 className="text-sm font-bold text-gray-700 mb-3">{items.length} bài pháp âm</h2>
        {loading ? <p className="text-center py-8 text-gray-400">Đang tải...</p>
        : items.length === 0 ? <p className="text-center py-8 text-gray-400">Chưa có bài nào</p>
        : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className={`bg-white rounded-xl border p-4 flex gap-4 items-center ${!item.visible?'opacity-50 border-red-100':'border-gray-100'}`}>
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{background:'#1DB95415'}}>
                  {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover"/> : <span className="text-xl">🎧</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.title}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{background:item.type==='spotify'?'#1DB95420':'#ff000020',color:item.type==='spotify'?'#1DB954':'#ef4444'}}>
                      {item.type==='spotify'?'SP':'YT'}
                    </span>
                  </div>
                  {item.teacher && <p className="text-xs text-gray-500">{item.teacher}</p>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={()=>handleToggle(item.id,item.visible)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${item.visible?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                    {item.visible?'✅':'🚫'}
                  </button>
                  <button onClick={()=>handleDelete(item.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
