'use client'
import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { addCoins } from '@/lib/users'
import {
  collection, query, orderBy, getDocs, addDoc,
  deleteDoc, doc, serverTimestamp, where,
} from 'firebase/firestore'

function ytThumb(id) { return `https://img.youtube.com/vi/${id}/mqdefault.jpg` }

function removeDiacritics(str) {
  return (str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
}

function timeAgo(ts) {
  if (!ts) return 'vừa xong'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now()-d)/1000)
  if (s<60) return 'vừa xong'
  if (s<3600) return Math.floor(s/60)+' phút'
  if (s<86400) return Math.floor(s/3600)+' giờ'
  return Math.floor(s/86400)+' ngày'
}

const AI_NAME='Hoa Sen AI 🤖', AI_UID='hoa-sen-ai-bot'
async function triggerAIReply({videoId,videoTitle,userComment,currentComments,onAIReply}){
  if(currentComments.some(c=>c.authorId===AI_UID))return
  await new Promise(r=>setTimeout(r,10000))
  try{
    const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:[{role:'user',content:`Bạn đang trả lời bình luận dưới video pháp thoại: "${videoTitle}"\nBình luận: "${userComment}"\nHãy trả lời ngắn gọn 2-3 câu, ấm áp, theo tinh thần Phật pháp Theravāda. Xưng "con", gọi "quý vị". Kết bằng 🙏`}]})})
    const data=await res.json()
    if(!data.reply)return
    const ref=await addDoc(collection(db,'video_comments'),{videoId,authorId:AI_UID,authorName:AI_NAME,text:data.reply,likes:0,isAI:true,createdAt:serverTimestamp()})
    onAIReply({id:ref.id,videoId,authorId:AI_UID,authorName:AI_NAME,text:data.reply,likes:0,isAI:true,createdAt:null})
  }catch(e){console.error(e)}
}

function CommentSection({video}){
  const {user,profile}=useAuth()
  const [comments,setComments]=useState([])
  const [text,setText]=useState('')
  const [posting,setPosting]=useState(false)
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    if(!video?.id)return
    setLoading(true);setComments([])
    getDocs(query(collection(db,'video_comments'),where('videoId','==',video.id),orderBy('createdAt','asc')))
      .then(snap=>setComments(snap.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false))
  },[video?.id])
  async function handlePost(e){
    e&&e.preventDefault()
    if(!text.trim()||!user||posting)return
    setPosting(true)
    const userText=text.trim()
    try{
      const name=profile?.displayName||user.displayName||user.email?.split('@')[0]||'Thành viên'
      const ref=await addDoc(collection(db,'video_comments'),{videoId:video.id,authorId:user.uid,authorName:name,text:userText,likes:0,createdAt:serverTimestamp()})
      await addCoins(user.uid,2,'video_comment',video.id).catch(()=>{})
      const newC={id:ref.id,videoId:video.id,authorId:user.uid,authorName:name,text:userText,likes:0,createdAt:null}
      setComments(prev=>{const u=[...prev,newC];triggerAIReply({videoId:video.id,videoTitle:video.title,userComment:userText,currentComments:u,onAIReply:c=>setComments(p=>[...p,c])});return u})
      setText('')
    }catch(e){console.error(e)}
    setPosting(false)
  }
  async function handleDelete(id){
    if(!confirm('Xóa?'))return
    await deleteDoc(doc(db,'video_comments',id)).catch(()=>{})
    setComments(p=>p.filter(c=>c.id!==id))
  }
  return(
    <div className="mt-4">
      <p className="text-sm font-bold text-white mb-4">{comments.length} bình luận</p>
      {user?(
        <form onSubmit={handlePost} className="flex gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{(user.displayName||'U')[0].toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handlePost()}
              placeholder="Chia sẻ cảm nhận..."
              className="w-full bg-transparent border-b border-zinc-700 focus:border-white pb-2 text-sm text-white focus:outline-none placeholder-zinc-600 transition-colors"/>
            {text.trim()&&(
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={()=>setText('')} className="text-sm text-zinc-400 px-3 py-1 rounded-full hover:bg-zinc-800">Hủy</button>
                <button type="submit" disabled={posting} className="text-sm font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-full disabled:opacity-50">{posting?'Đang gửi...':'Bình luận'}</button>
              </div>
            )}
          </div>
        </form>
      ):(
        <div className="mb-4 text-sm text-zinc-500"><a href="/dang-nhap" className="text-red-400 font-bold hover:underline">Đăng nhập</a> để bình luận</div>
      )}
      {loading?<p className="text-xs text-zinc-600 py-2">Đang tải...</p>:comments.length===0?<p className="text-xs text-zinc-600 py-2">Chưa có bình luận.</p>:(
        <div className="space-y-4">
          {comments.map(c=>(
            <div key={c.id} className="flex gap-2.5">
              <div className={`w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0 ${c.isAI?'bg-red-700':'bg-zinc-600'}`}>{c.isAI?'🤖':(c.authorName||'A')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-bold text-white">{c.authorName}</span>
                  {c.isAI&&<span className="text-[9px] bg-red-900/60 text-red-300 font-bold px-1.5 py-0.5 rounded-full">AI</span>}
                  <span className="text-[10px] text-zinc-600">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed break-words">{c.text}</p>
                {user?.uid===c.authorId&&<button onClick={()=>handleDelete(c.id)} className="text-[11px] text-zinc-600 hover:text-red-400 mt-1">Xóa</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TikTokPlayer({videos,startIndex,onClose}){
  const [idx,setIdx]=useState(startIndex)
  const [showComments,setShowComments]=useState(false)
  const touchStartY=useRef(null)
  const video=videos[idx]

  useEffect(()=>{
    function onKey(e){
      if(e.key==='Escape')onClose()
      if(e.key==='ArrowDown'||e.key==='ArrowRight')setIdx(i=>Math.min(i+1,videos.length-1))
      if(e.key==='ArrowUp'||e.key==='ArrowLeft')setIdx(i=>Math.max(i-1,0))
    }
    window.addEventListener('keydown',onKey)
    return()=>window.removeEventListener('keydown',onKey)
  },[videos.length,onClose])

  useEffect(()=>{ document.body.style.overflow='hidden'; return()=>{document.body.style.overflow=''} },[])

  return(
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{background:'#000'}}
      onTouchStart={e=>{touchStartY.current=e.touches[0].clientY}}
      onTouchEnd={e=>{
        const dy=(touchStartY.current||0)-e.changedTouches[0].clientY
        if(dy>60)setIdx(i=>Math.min(i+1,videos.length-1))
        if(dy<-60)setIdx(i=>Math.max(i-1,0))
        touchStartY.current=null
      }}
      onWheel={e=>{
        if(e.deltaY>40)setIdx(i=>Math.min(i+1,videos.length-1))
        if(e.deltaY<-40)setIdx(i=>Math.max(i-1,0))
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3" style={{background:'linear-gradient(to bottom,rgba(0,0,0,0.8),transparent)'}}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center"><svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
          <span className="text-white text-sm font-bold">Xem Pháp</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-xs">{idx+1} / {videos.length}</span>
          <button onClick={onClose} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-lg font-bold transition-colors">✕</button>
        </div>
      </div>

      {/* Player */}
      <div className="flex-1">
        {video&&<iframe key={video.youtube_id}
          src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0&playsinline=1`}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen className="w-full h-full" style={{border:'none'}}/>}
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 inset-x-0 px-4 pb-6 pt-16" style={{background:'linear-gradient(to top,rgba(0,0,0,0.9),rgba(0,0,0,0.5),transparent)'}}>
        <div className="flex items-end gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-snug mb-1 line-clamp-2">{video?.title}</p>
            <p className="text-zinc-400 text-sm">{video?.teacher||'Pháp Thoại'}</p>
          </div>
          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            <button onClick={()=>setShowComments(v=>!v)} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <span className="text-white text-xs">Bình luận</span>
            </button>
            <button onClick={()=>navigator.share?.({title:video?.title,url:window.location.href})||navigator.clipboard?.writeText(window.location.href)}
              className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </div>
              <span className="text-white text-xs">Chia sẻ</span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          {idx>0&&<button onClick={()=>setIdx(i=>i-1)} className="text-zinc-400 text-xs hover:text-white transition-colors">↑ Trước</button>}
          {idx<videos.length-1&&<button onClick={()=>setIdx(i=>i+1)} className="text-zinc-400 text-xs hover:text-white transition-colors">Tiếp ↓</button>}
        </div>
      </div>

      {/* Comment drawer */}
      {showComments&&video&&(
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-3xl overflow-hidden" style={{background:'#1a1a1a',maxHeight:'70vh'}}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <span className="font-bold text-white">Bình luận</span>
            <button onClick={()=>setShowComments(false)} className="text-zinc-400 hover:text-white text-lg font-bold">✕</button>
          </div>
          <div className="overflow-y-auto px-5 pb-5" style={{maxHeight:'calc(70vh - 60px)'}}>
            <CommentSection video={video}/>
          </div>
        </div>
      )}
    </div>
  )
}

function VideoCard({video,onPlay}){
  return(
    <div className="group cursor-pointer" onClick={()=>onPlay(video)}>
      <div className="relative rounded-xl overflow-hidden bg-zinc-900" style={{aspectRatio:'16/9'}}>
        <img src={ytThumb(video.youtube_id)} alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e=>{e.target.src='https://placehold.co/320x180/111/444?text=Video'}}/>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-2xl">
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2.5">
        <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{(video.teacher||'P')[0].toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">{video.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{video.teacher||'Pháp Thoại'}</p>
          <p className="text-xs text-zinc-600">{timeAgo(video.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

export default function XemPhapPage(){
  const [videos,setVideos]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [playerState,setPlayerState]=useState(null)

  useEffect(()=>{
    getDocs(query(collection(db,'dharma_videos'),orderBy('createdAt','desc')))
      .then(snap=>setVideos(snap.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const filtered=search.trim()
    ?videos.filter(v=>{const q=removeDiacritics(search);return removeDiacritics(v.title||'').includes(q)||removeDiacritics(v.teacher||'').includes(q)})
    :videos

  return(
    <div className="min-h-screen" style={{background:'#0f0f0f'}}>
      {playerState&&<TikTokPlayer videos={playerState.videos} startIndex={playerState.startIndex} onClose={()=>setPlayerState(null)}/>}

      <div style={{background:'#0f0f0f',borderBottom:'1px solid #272727'}} className="sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center"><svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
            <span className="font-black text-white text-base hidden sm:block">Xem Pháp</span>
          </div>
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="🔍 Tìm pháp thoại, giảng sư... (gõ không dấu được)"
                className="w-full rounded-full px-5 py-2 text-sm text-white focus:outline-none placeholder-zinc-500 pr-10"
                style={{background:'#121212',border:'1px solid #3f3f3f'}}/>
              {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-sm">✕</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-black text-white">{search?`Kết quả: "${search}"` :'Pháp Thoại Video'}</h2>
          {!loading&&<span className="text-sm text-zinc-600 ml-auto">{filtered.length} video</span>}
        </div>
        {!loading&&filtered.length>0&&(
          <button onClick={()=>setPlayerState({videos:filtered,startIndex:0})}
            className="mb-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-full transition-colors text-sm">
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Xem tất cả ({filtered.length} video)
          </button>
        )}
        {loading?(
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_,i)=>(
              <div key={i} className="animate-pulse">
                <div className="rounded-xl bg-zinc-900" style={{aspectRatio:'16/9'}}/>
                <div className="flex gap-2.5 mt-3"><div className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0"/><div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-zinc-800 rounded w-full"/><div className="h-3 bg-zinc-800 rounded w-2/3"/></div></div>
              </div>
            ))}
          </div>
        ):filtered.length===0?(
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🎬</p>
            <p className="font-semibold text-lg text-zinc-500">{search?`Không tìm thấy "${search}"`:'Chưa có video nào. Admin sẽ thêm sớm!'}</p>
          </div>
        ):(
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {filtered.map((v,i)=><VideoCard key={v.id} video={v} onPlay={()=>setPlayerState({videos:filtered,startIndex:i})}/>)}
          </div>
        )}
      </div>
    </div>
  )
}
