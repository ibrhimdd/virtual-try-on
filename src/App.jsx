import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Check, ChevronLeft, CircleHelp, FlipHorizontal, LoaderCircle, Shirt, Sparkles, X } from 'lucide-react'
import { createDecartClient, models } from '@decartai/sdk'

const products = [
  { id: 'tee', name: 'تيشيرت Essential', type: 'تيشيرت', color: 'أسود', price: '790 ج.م', tone: '#252724', accent: '#d7d4ca', description: 'قصة مريحة وخامة قطن ناعمة للاستخدام اليومي.' },
  { id: 'jacket', name: 'جاكت Urban', type: 'جاكت', color: 'زيتي', price: '1,890 ج.م', tone: '#59634b', accent: '#d9d2bd', description: 'طبقة خارجية بطابع عصري وتفاصيل عملية.' },
  { id: 'hoodie', name: 'هودي Studio', type: 'هودي', color: 'رمادي', price: '1,250 ج.م', tone: '#777b79', accent: '#e6e3db', description: 'هودي واسع بملمس ناعم وراحة طوال اليوم.' },
]


function App() {
  const [selected, setSelected] = useState(products[0])
  const [cameraOn, setCameraOn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [engineReady, setEngineReady] = useState(false)
  const [outputReady, setOutputReady] = useState(false)
  const [facing, setFacing] = useState('user')
  const [showGuide, setShowGuide] = useState(false)
  const videoRef = useRef(null)
  const outputVideoRef = useRef(null)
  const streamRef = useRef(null)
  const realtimeRef = useRef(null)
  const startingRef = useRef(false)
  const garmentImages = {
    tee: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=90',
    jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&auto=format&fit=crop&q=90',
    hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=90',
  }
  const garmentPrompts = {
    tee: 'Substitute the current top with a plain black cotton crew-neck short-sleeve T-shirt, realistic soft cotton texture, natural relaxed fit, preserve the person face and body.',
    jacket: 'Substitute the current top with an olive green casual bomber jacket, realistic matte fabric, natural relaxed fit, preserve the person face and body.',
    hoodie: 'Substitute the current top with a medium grey cotton pullover hoodie, realistic fleece texture, natural relaxed fit, preserve the person face and body.',
  }
  async function applySelectedGarment(product) {
    if (!realtimeRef.current) return
    const response = await fetch(garmentImages[product.id])
    if (!response.ok) throw new Error('تعذر تحميل صورة قطعة الملابس. حاول مرة أخرى.')
    await realtimeRef.current.setImage(await response.blob(), { prompt: garmentPrompts[product.id], enhance: false })
  }
  useEffect(() => { if (realtimeRef.current) applySelectedGarment(selected).catch(e => setError(e.message || 'تعذر تغيير قطعة الملابس.')) }, [selected])
  useEffect(() => () => stopCamera(), [])
  async function startCamera() {
    if (startingRef.current || cameraOn) return
    startingRef.current = true; setError(''); setLoading(true); setOutputReady(false); setEngineReady(false)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('المتصفح لا يدعم الكاميرا. افتح الموقع عبر HTTPS.')
      const model = models.realtime('lucy-vton-3.6')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing, frameRate: model.fps, width: model.width, height: model.height } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      const client = createDecartClient({ apiKeyProvider: async () => {
        const response = await fetch('/api/realtime-token', { method: 'POST' })
        const data = await response.json()
        if (!response.ok || !data.apiKey) throw new Error(data.error || 'تعذر الحصول على تصريح جلسة Decart.')
        return data.apiKey
      }})
      const realtimeClient = await client.realtime.connect(stream, { model, mirror: 'auto', onRemoteStream: async transformedStream => {
        if (!outputVideoRef.current) return
        outputVideoRef.current.srcObject = transformedStream
        try { await outputVideoRef.current.play() } catch (e) { console.warn('Output autoplay was blocked:', e) }
        setOutputReady(true)
      }})
      realtimeRef.current = realtimeClient; setEngineReady(true)
      await applySelectedGarment(selected); setCameraOn(true)
    } catch (e) {
      console.error('Decart realtime try-on failed:', e); setError(e.message || 'تعذر تشغيل تجربة الملابس بالذكاء الاصطناعي.')
      realtimeRef.current?.disconnect?.(); realtimeRef.current = null
      streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setCameraOn(false); setEngineReady(false); setOutputReady(false)
    } finally { startingRef.current = false; setLoading(false) }
  }
  function stopCamera() {
    realtimeRef.current?.disconnect?.(); realtimeRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    if (outputVideoRef.current) outputVideoRef.current.srcObject = null
    setCameraOn(false); setEngineReady(false); setOutputReady(false)
  }
  async function switchCamera() {
    const next = facing === 'user' ? 'environment' : 'user'
    if (cameraOn) { stopCamera(); setFacing(next); setTimeout(() => startCamera(), 250) } else setFacing(next)
  }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#home"><span className="brand-mark"><Sparkles size={19}/></span><span>VESTRA<small>THE VIRTUAL FITTING ROOM</small></span></a><nav><a href="#collection">المجموعة</a><a href="#how">كيف تعمل؟</a></nav><a className="nav-cta" href="#tryon">ابدأ التجربة <ChevronLeft size={16}/></a></header>
    <main>
      <section className="hero" id="home"><div className="hero-copy"><div className="eyebrow"><span/> مستقبل تجربة التسوق وصل</div><h1>مش مجرد مقاس..<br/><em>دي إطلالتك</em></h1><p>اختار القطعة اللي بتحبها، افتح الكاميرا وشوفها عليك في لحظتها. جرّب ستايل جديد قبل ما تاخد قرارك.</p><div className="hero-actions"><a className="primary-btn" href="#tryon">جرّبها عليك الآن <ChevronLeft size={18}/></a><a className="text-link" href="#collection">اكتشف المجموعة <span>↙</span></a></div><div className="hero-proof"><div className="proof-icon"><Camera size={18}/></div><span><b>تجربة مباشرة</b><small>معالجة مباشرة بالذكاء الاصطناعي</small></span><i/> <span><b>خصوصيتك أولاً</b><small>الفيديو لا يتم رفعه</small></span></div></div><div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-label label-top">YOUR STYLE, YOUR RULES</div><div className="model-card"><img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1000&auto=format&fit=crop&q=85" alt="عارض أزياء يرتدي تيشيرت"/><div className="model-overlay"><span>01 / THE ESSENTIALS</span><b>Find your<br/>new favorite.</b></div></div><div className="floating-tag"><Sparkles size={15}/> FIT IT. FEEL IT.</div><div className="art-stamp">V<br/>—<br/>01</div></div></section>
      <section className="ticker"><span>TRY IT BEFORE YOU BUY IT</span><b>✳</b><span>YOUR CAMERA. YOUR FIT.</span><b>✳</b><span>STYLE WITHOUT GUESSWORK</span><b>✳</b></section>
      <section className="collection section-wrap" id="collection"><div className="section-heading"><div><div className="eyebrow">CURATED FOR YOU / 001</div><h2>اختار <em>إطلالتك</em></h2></div><p>ثلاث قطع مختارة لتبدأ رحلتك في غرفة التجربة الافتراضية.</p></div><div className="product-grid">{products.map((p,i)=><button key={p.id} className={'product-card '+(selected.id===p.id?'active':'')} onClick={()=>{setSelected(p);document.getElementById('tryon')?.scrollIntoView({behavior:'smooth'})}}><div className={'product-visual visual-'+p.id}><span className="product-index">0{i+1}</span><img src={p.id==='tee'?'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80':p.id==='jacket'?'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80':'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&auto=format&fit=crop&q=80'} alt={p.name}/><span className="try-badge">جرّبها عليك ↙</span></div><div className="product-info"><div><h3>{p.name}</h3><small>{p.type} · {p.color}</small></div><b>{p.price}</b></div></button>)}</div></section>
      <section className="try-section" id="tryon"><div className="section-wrap"><div className="section-heading"><div><div className="eyebrow">THE FITTING ROOM / LIVE</div><h2>دورك <em>تجرّب</em></h2></div><p>قف أمام الكاميرا بحيث يظهر الجزء العلوي من جسمك، وسيتم ضبط القطعة على موضع كتفيك.</p></div><div className="fitting-layout"><div className="camera-panel"><div className="camera-topline"><span><i className={cameraOn?'live-dot':''}/>{cameraOn?'LIVE FITTING ROOM':'VIRTUAL FITTING ROOM'}</span><button onClick={()=>setShowGuide(!showGuide)}><CircleHelp size={16}/> مساعدة</button></div><div className="camera-stage"><video ref={videoRef} playsInline muted className={cameraOn?'visible':''}/><video ref={outputVideoRef} playsInline muted className={'ai-output '+(outputReady?'visible':'')} />{!cameraOn&&<div className="camera-placeholder"><div className="camera-symbol"><Camera size={34}/></div><b>مستعد تشوف اللوك عليك؟</b><span>اسمح باستخدام الكاميرا وابدأ التجربة</span><button className="primary-btn" onClick={startCamera} disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<Camera size={18}/>} {loading?'جاري تجهيز الكاميرا...':'افتح الكاميرا'}</button></div>}{cameraOn&&<div className="camera-hint">{!engineReady?'جاري الاتصال بمحرك Decart للذكاء الاصطناعي':outputReady?'التجربة الذكية تعمل — حرّك جسمك لمعاينة القطعة':'تم الاتصال — جاري تجهيز الفيديو المعدّل'}</div>}</div>{error&&<div className="error-note"><X size={16}/>{error}</div>}<div className="camera-controls">{cameraOn?<><button className="control-btn" onClick={switchCamera}><FlipHorizontal size={17}/> تبديل الكاميرا</button><button className="control-btn stop" onClick={stopCamera}><CameraOff size={17}/> إيقاف الكاميرا</button></>:<span>🔒 يُعالج الفيديو لدى Decart ولا تحفظه VESTRA</span>}<span className="engine-status"><i className={engineReady?'live-dot':''}/>{engineReady?'محرك Decart متصل':'بانتظار الكاميرا'}</span></div>{showGuide&&<div className="guide-box">قف على بُعد متر إلى مترين من الكاميرا، واجعل كتفيك وخصرك ظاهرين بإضاءة جيدة. تستخدم التجربة محرك Decart AI لتحويل بث الكاميرا إلى معاينة ملابس مباشرة.</div>}</div><aside className="product-panel"><div className="panel-kicker">SELECTED PIECE <span>01 / 03</span></div><div className="selected-product-image"><img src={selected.id==='tee'?'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80':selected.id==='jacket'?'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80':'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&auto=format&fit=crop&q=80'} alt={selected.name}/><span className="selected-chip"><Check size={13}/> جاهز للتجربة</span></div><div className="selected-details"><div><span className="eyebrow">VESTRA / NEW DROP</span><h3>{selected.name}</h3><p>{selected.description}</p></div><strong>{selected.price}</strong></div><div className="selector-label">اختار القطعة</div><div className="piece-options">{products.map(p=><button key={p.id} onClick={()=>setSelected(p)} className={selected.id===p.id?'chosen':''}><span style={{background:p.tone}}/>{p.type}</button>)}</div><div className="privacy-note"><Sparkles size={17}/><span><b>خصوصيتك في أمان</b><small>يتم إرسال بث الكاميرا إلى Decart لمعالجة تجربة الملابس، ولا نخزّن الفيديو في VESTRA.</small></span></div><button className="wide-try-btn" onClick={cameraOn?stopCamera:startCamera} disabled={loading}>{cameraOn?'إنهاء التجربة':'ابدأ تجربة القطعة'} <ChevronLeft size={18}/></button></aside></div></div></section>
      <section className="how-section section-wrap" id="how"><div className="eyebrow">SIMPLE AS 1, 2, 3</div><h2>ثلاث خطوات.. <em>وإطلالتك جاهزة</em></h2><div className="steps"><div><span>01</span><Camera size={23}/><h3>افتح الكاميرا</h3><p>اسمح للمتصفح باستخدام الكاميرا من جهازك.</p></div><div><span>02</span><Shirt size={23}/><h3>اختار القطعة</h3><p>تنقّل بين التيشيرت والجاكت والهُودي.</p></div><div><span>03</span><Sparkles size={23}/><h3>شوفها عليك</h3><p>شاهد معاينة الملابس بالذكاء الاصطناعي في الوقت الفعلي.</p></div></div></section>
    </main><footer><a className="brand" href="#home"><span className="brand-mark"><Sparkles size={17}/></span><span>VESTRA<small>THE VIRTUAL FITTING ROOM</small></span></a><span>تجربة أولية لتقنية تجربة الملابس الافتراضية</span><span>© 2026 VESTRA STUDIO</span></footer>
  </div>
}
export default App
