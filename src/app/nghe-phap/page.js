'use client'
import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { addCoins } from '@/lib/users'
import {
  collection, query, orderBy, getDocs, addDoc,
  deleteDoc, doc, serverTimestamp, where,
} from 'firebase/firestore'

function removeDiacritics(str){
  return(str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
}
function timeAgo(ts){
  if(!ts)return'vừa xong'
  const d=ts.toDate?ts.toDate():new Date(ts),s=Math.floor((Date.now()-d)/1000)
  if(s<60)return'vừa xong';if(s<3600)return Math.floor(s/60)+' phút'
  if(s<86400)return Math.floor(s/3600)+' giờ';return Math.floor(s/86400)+' ngày'
}
function parseAudioLink(url){
  if(!url)return null
  const sp=(url).match(/open\.spotify\.com\/(track|episode|show|playlist|album)\/([a-zA-Z0-9]+)/)
  if(sp)return{type:'spotify',kind:sp[1],id:sp[2]}
  const yt=(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if(yt)return{type:'youtube',id:yt[1]}
  return null
}
function getEmbedUrl(item){
  if(item.type==='spotify')return`https://open.spotify.com/embed/${item.spotify_kind||'track'}/${item.spotify_id}?utm_source=oembed&theme=0`
  if(item.type==='youtube')return`https://www.youtube.com/embed/${item.youtube_id}?autoplay=1&rel=0`
  return null
}
function getCover(item){
  if(item.thumbnail)return item.thumbnail
  if(item.youtube_id)return`https://img.youtube.com/vi/${item.youtube_id}/mqdefault.jpg`
  return null
}

const AI_NAME='Hoa Sen AI 🤖',AI_UID='hoa-sen-ai-bot'
async function triggerAIReply({audioId,audioTitle,userComment,currentComments,onAIReply}){
  if(currentComments.some(c=>c.authorId===AI_UID))return
  await new Promise(r=>setTimeout(r,10000))
  try{
    const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:`Bạn đang trả lời bình luận dưới bài pháp âm: "${audioTitle}"\nBình luận: "${userComment}"\nHãy trả lời ngắn gọn 2-3 câu, ấm áp, theo tinh thần Phật pháp Theravāda. Xưng "con", gọi "quý vị". Kết bằng 🙏`}]})})
    const data=await res.json();if(!data.reply)return
    const ref=await addDoc(collection(db,'audio_comments'),{audioId,authorId:AI_UID,authorName:AI_NAME,text:data.reply,likes:0,isAI:true,createdAt:serverTimestamp()})
    onAIReply({id:ref.id,audioId,authorId:AI_UID,authorName:AI_NAME,text:data.reply,likes:0,isAI:true,createdAt:null})
  }catch(e){console.error(e)}
}

function CommentSection({audioItem}){
  const{user,profile}=useAuth()
  const[comments,setComments]=useState([])
  const[text,setText]=useState('')
  const[posting,setPosting]=useState(false)
  const[loading,setLoading]=useState(true)
  useEffect(()=>{
    if(!audioItem?.id)return;setLoading(true);setComments([])
    getDocs(query(collection(db,'audio_comments'),where('audioId','==',audioItem.id),orderBy('createdAt','asc')))
      .then(snap=>setComments(snap.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false))
  },[audioItem?.id])
  async function handlePost(e){
    e&&e.preventDefault();if(!text.trim()||!user||posting)return;setPosting(true)
    const userText=text.trim()
    try{
      const name=profile?.displayName||user.displayName||user.email?.split('@')[0]||'Thành viên'
      const ref=await addDoc(collection(db,'audio_comments'),{audioId:audioItem.id,authorId:user.uid,authorName:name,text:userText,likes:0,createdAt:serverTimestamp()})
      await addCoins(user.uid,2,'audio_comment',audioItem.id).catch(()=>{})
      const newC={id:ref.id,audioId:audioItem.id,authorId:user.uid,authorName:name,text:userText,likes:0,createdAt:null}
      setComments(prev=>{const u=[...prev,newC];triggerAIReply({audioId:audioItem.id,audioTitle:audioItem.title,userComment:userText,currentComments:u,onAIReply:c=>setComments(p=>[...p,c])});return u})
      setText('')
    }catch(e){console.error(e)};setPosting(false)
  }
  async function handleDelete(id){
    if(!confirm('Xóa?'))return
    await deleteDoc(doc(db,'audio_comments',id)).catch(()=>{})
    setComments(p=>p.filter(c=>c.id!==id))
  }
  return(
    <div className="mt-6 pt-5 border-t border-zinc-800">
      <p className="text-sm font-bold text-white mb-4">{comments.length} bình luận</p>
      {user?(
        <form onSubmit={handlePost} className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full font-black text-black text-xs flex items-center justify-center flex-shrink-0" style={{background:'#1DB954'}}>{(user.displayName||'U')[0].toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handlePost()}
              placeholder="Chia sẻ cảm nhận..."
              className="w-full bg-transparent border-b border-zinc-700 focus:border-white pb-2 text-sm text-white focus:outline-none placeholder-zinc-600 transition-colors"/>
            {text.trim()&&(
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={()=>setText('')} className="text-sm text-zinc-400 px-3 py-1 rounded-full hover:bg-zinc-800">Hủy</button>
                <button type="submit" disabled={posting} className="text-sm font-bold text-black px-4 py-1 rounded-full disabled:opacity-50" style={{background:'#1DB954'}}>{posting?'Đang gửi...':'Bình luận'}</button>
              </div>
            )}
          </div>
        </form>
      ):(
        <div className="mb-4 text-sm text-zinc-500"><a href="/dang-nhap" style={{color:'#1DB954'}} className="font-bold hover:underline">Đăng nhập</a> để bình luận</div>
      )}
      {loading?<p className="text-xs text-zinc-600 py-2">Đang tải...</p>:comments.length===0?<p className="text-xs text-zinc-600 py-2">Chưa có bình luận nào.</p>:(
        <div className="space-y-5">
          {comments.map(c=>(
            <div key={c.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0 ${c.isAI?'bg-green-700':'bg-zinc-600'}`}>{c.isAI?'🤖':(c.authorName||'A')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-bold text-white">{c.authorName}</span>
                  {c.isAI&&<span className="text-[9px] bg-green-900/60 text-green-300 font-bold px-1.5 py-0.5 rounded-full">AI</span>}
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

function AudioCard({item,onPlay,isActive}){
  const cover=getCover(item)
  return(
    <div onClick={()=>onPlay(item)} className="group cursor-pointer rounded-xl p-3 transition-all"
      style={{background:isActive?'#282828':'transparent'}}
      onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background='#1a1a1a'}}
      onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background='transparent'}}>
      <div className="relative rounded-xl overflow-hidden mb-3" style={{aspectRatio:'1/1',background:'#282828'}}>
        {cover?<img src={cover} alt={item.title} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}}/>:null}
        <div className={`absolute inset-0 items-center justify-center text-4xl ${cover?'hidden':'flex'}`} style={{background:'linear-gradient(135deg,#1a3a1a,#2d5a2d)'}}>🎧</div>
        <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl" style={{background:'#1DB954'}}>
            <svg width="14" height="14" fill="black" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <p className={`text-sm font-bold leading-snug line-clamp-2 mb-1 transition-colors ${isActive?'text-green-400':'text-white'}`}>{item.title}</p>
      <p className="text-xs text-zinc-400 truncate">{item.teacher||'Pháp Âm'}</p>
    </div>
  )
}

export default function NghePhapPage(){
  const[items,setItems]=useState([])
  const[loading,setLoading]=useState(true)
  const[activeItem,setActiveItem]=useState(null)
  const[search,setSearch]=useState('')
  const[showDetail,setShowDetail]=useState(false)

  useEffect(()=>{
    getDocs(query(collection(db,'dharma_audio'),orderBy('createdAt','desc')))
      .then(snap=>setItems(snap.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const filtered=search.trim()
    ?items.filter(v=>{const q=removeDiacritics(search);return removeDiacritics(v.title||'').includes(q)||removeDiacritics(v.teacher||'').includes(q)})
    :items

  const embedUrl=activeItem?getEmbedUrl(activeItem):null
  const isSpotify=activeItem?.type==='spotify'

  return(
    <div className="min-h-screen" style={{background:'#121212',paddingBottom:activeItem?90:0}}>
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <div className="hidden lg:flex flex-col flex-shrink-0" style={{width:240,background:'#000',position:'fixed',top:0,left:0,bottom:0,zIndex:30}}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#1DB954'}}><span className="text-black">🎧</span></div>
              <span className="font-black text-white">Nghe Pháp</span>
            </div>
            <nav className="space-y-1">
              {[['🏠','Trang chủ','/'],[' 🎬','Xem Pháp','/xem-phap'],['☸️','Tri Thức','/tri-thuc-phat-giao'],['💬','Diễn Đàn','/dien-dan']].map(([icon,label,href])=>(
                <a key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{color:'#b3b3b3'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='#fff';e.currentTarget.style.background='#282828'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='#b3b3b3';e.currentTarget.style.background='transparent'}}>
                  <span>{icon}</span>{label}
                </a>
              ))}
            </nav>
          </div>
          {items.length>0&&(
            <div className="px-4 mt-2 flex-1 overflow-y-auto">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Gần đây</p>
              {items.slice(0,8).map(item=>{
                const cover=getCover(item)
                return(
                  <div key={item.id} onClick={()=>setActiveItem(item)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors"
                    style={{background:activeItem?.id===item.id?'#282828':'transparent'}}
                    onMouseEnter={e=>{e.currentTarget.style.background='#1a1a1a'}}
                    onMouseLeave={e=>{e.currentTarget.style.background=activeItem?.id===item.id?'#282828':'transparent'}}>
                    <div className="w-10 h-10 rounded flex-shrink-0 overflow-hidden" style={{background:'#282828'}}>
                      {cover?<img src={cover} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-base">🎧</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${activeItem?.id===item.id?'text-green-400':'text-white'}`}>{item.title}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{item.teacher||'Pháp Âm'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex-1 lg:ml-60">
          <div className="sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center gap-4" style={{background:'rgba(18,18,18,0.95)',backdropFilter:'blur(20px)',borderBottom:'1px solid #282828'}}>
            <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{background:'#1DB954'}}>🎧</div>
              <span className="font-black text-white text-sm">Nghe Pháp</span>
            </div>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="🔍 Tìm pháp âm, giảng sư... (gõ không dấu được)"
                  className="w-full rounded-full px-5 py-2.5 text-sm text-white focus:outline-none placeholder-zinc-500"
                  style={{background:'#282828',border:'1px solid #404040'}}/>
                {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-sm">✕</button>}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-8 py-6">
            {/* Now playing hero */}
            {activeItem&&(
              <div className="mb-10 rounded-2xl overflow-hidden" style={{background:'linear-gradient(180deg,#1a3a1a,#121212)'}}>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl" style={{background:'#282828'}}>
                      {getCover(activeItem)?<img src={getCover(activeItem)} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-5xl" style={{background:'linear-gradient(135deg,#1a3a1a,#2d5a2d)'}}>🎧</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'#1DB954'}}>Đang phát</p>
                      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">{activeItem.title}</h1>
                      <p className="text-zinc-400 font-semibold mb-4">{activeItem.teacher||'Pháp Âm'}</p>
                      {activeItem.description&&<p className="text-sm text-zinc-500 leading-relaxed mb-4 line-clamp-2">{activeItem.description}</p>}
                      <button onClick={()=>setShowDetail(v=>!v)}
                        className="text-sm font-bold px-4 py-2 rounded-full transition-colors"
                        style={{background:showDetail?'#282828':'#1DB954',color:showDetail?'#fff':'#000'}}>
                        {showDetail?'▲ Ẩn bình luận':'💬 Bình luận'}
                      </button>
                    </div>
                  </div>
                </div>
                {showDetail&&(
                  <div className="px-6 sm:px-8 pb-8">
                    <CommentSection audioItem={activeItem}/>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black text-white">{search?`"${search}"` :'Pháp Âm'}</h2>
              {!loading&&<span className="text-sm text-zinc-600 ml-auto">{filtered.length} bài</span>}
            </div>

            {loading?(
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {[...Array(10)].map((_,i)=>(
                  <div key={i} className="animate-pulse p-3 rounded-xl" style={{background:'#1a1a1a'}}>
                    <div className="rounded-xl bg-zinc-800 mb-3" style={{aspectRatio:'1/1'}}/>
                    <div className="h-3 bg-zinc-800 rounded w-3/4 mb-2"/><div className="h-3 bg-zinc-800 rounded w-1/2"/>
                  </div>
                ))}
              </div>
            ):filtered.length===0?(
              <div className="text-center py-24">
                <p className="text-6xl mb-4">🎧</p>
                <p className="font-semibold text-lg" style={{color:'#b3b3b3'}}>{search?`Không tìm thấy "${search}"`:'Chưa có pháp âm nào. Admin sẽ thêm sớm!'}</p>
              </div>
            ):(
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filtered.map(item=><AudioCard key={item.id} item={item} onPlay={setActiveItem} isActive={activeItem?.id===item.id}/>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky player */}
      {activeItem&&embedUrl&&(
        <div className="fixed bottom-0 inset-x-0 z-50" style={{background:'#181818',borderTop:'1px solid #282828'}}>
          {isSpotify?(
            <iframe key={embedUrl} src={embedUrl}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              style={{width:'100%',height:80,border:'none'}}/>
          ):(
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0" style={{background:'#282828'}}>
                {getCover(activeItem)?<img src={getCover(activeItem)} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center">🎧</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{activeItem.title}</p>
                <p className="text-xs text-zinc-400">{activeItem.teacher||'Pháp Âm'}</p>
              </div>
              <a href={`https://www.youtube.com/watch?v=${activeItem.youtube_id}`} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full text-black transition-colors" style={{background:'#1DB954'}}>
                ▶ Nghe
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
