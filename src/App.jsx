import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Check, ChevronLeft, CircleHelp, FlipHorizontal, LoaderCircle, Shirt, Sparkles, Video, X } from 'lucide-react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

const products = [
  { id: 'tee', name: 'تيشيرت Essential', type: 'تيشيرت', color: 'أسود', price: '790 ج.م', tone: '#252724', accent: '#d7d4ca', description: 'قصة مريحة وخامة قطن ناعمة للاستخدام اليومي.' },
  { id: 'jacket', name: 'جاكت Urban', type: 'جاكت', color: 'زيتي', price: '1,890 ج.م', tone: '#59634b', accent: '#d9d2bd', description: 'طبقة خارجية بطابع عصري وتفاصيل عملية.' },
  { id: 'hoodie', name: 'هودي Studio', type: 'هودي', color: 'رمادي', price: '1,250 ج.م', tone: '#777b79', accent: '#e6e3db', description: 'هودي واسع بملمس ناعم وراحة طوال اليوم.' },
]

function garmentSvg(product) {
  const jacket = product.id === 'jacket'
  const hoodie = product.id === 'hoodie'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 560"><defs><linearGradient id="fabric" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${product.accent}" stop-opacity=".28"/><stop offset=".45" stop-color="${product.tone}"/><stop offset="1" stop-color="#090b09" stop-opacity=".3"/></linearGradient></defs><path d="M180 52 Q250 20 320 52 L405 100 Q438 118 455 166 L405 205 365 166 375 510 Q250 540 125 510 L135 166 95 205 45 166 Q62 118 95 100Z" fill="url(#fabric)" stroke="${product.accent}" stroke-opacity=".58" stroke-width="5" stroke-linejoin="round"/>${hoodie ? '<path d="M180 58 Q250 150 320 58 Q310 12 250 10 Q190 12 180 58Z" fill="none" stroke="#d8d5ca" stroke-opacity=".45" stroke-width="8"/>' : ''}<path d="M180 53 Q250 115 320 53" fill="none" stroke="${product.accent}" stroke-opacity=".7" stroke-width="7"/>${jacket ? '<path d="M250 90 V510 M210 120 L250 155 290 120" stroke="#e2ddcd" stroke-opacity=".8" stroke-width="7" fill="none"/><path d="M155 310 H210 M290 310 H345" stroke="#d9d2bd" stroke-opacity=".55" stroke-width="5"/>' : '<path d="M150 485 Q250 505 350 485" stroke="${product.accent}" stroke-opacity=".45" stroke-width="5" fill="none"/>'}<path d="M110 115 L155 160 M390 115 L345 160" stroke="#fff" stroke-opacity=".12" stroke-width="3"/></svg>`
}

function describeError(error) {
  if (error == null) return 'لم يتم إرجاع تفاصيل من المكتبة'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.stack || error.message || error.name
  if (typeof Event !== 'undefined' && error instanceof Event) {
    const target = error.target
    const targetInfo = target && 'src' in target ? ` | المصدر: ${target.src}` : ''
    return `حدث المتصفح "${error.type}" أثناء تحميل أو تهيئة النموذج${targetInfo}. غالبًا تعذر تحميل أحد ملفات النموذج أو WASM.`
  }
  if (typeof error === 'object') {
    try {
      const details = JSON.stringify(error, Object.getOwnPropertyNames(error))
      if (details && details !== '{}') return details
      if (error.type || error.target) return `حدث المتصفح: ${error.type || 'خطأ تحميل'}`
    } catch {}
    return String(error)
  }
  return String(error)
}

function App() {
  const [selected, setSelected] = useState(products[0])
  const [cameraOn, setCameraOn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [poseReady, setPoseReady] = useState(false)
  const [facing, setFacing] = useState('user')
  const [showGuide, setShowGuide] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const poseRef = useRef(null)
  const rafRef = useRef(null)
  const garmentRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)

  useEffect(() => { garmentRef.current = selected; if (cameraOn) drawFrame() }, [selected])
  useEffect(() => () => stopCamera(), [])

  async function loadPose() {
    if (poseRef.current) return poseRef.current

    // Load MediaPipe WASM assets from this deployment, not a third-party CDN.
    // The prebuild script copies the installed package assets into /public/mediapipe/wasm.
    let vision
    try {
      vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
    } catch (error) {
      throw new Error(`تعذر تحميل ملفات MediaPipe المحلية (WASM): ${describeError(error)}. أعد نشر المشروع بعد التأكد من تنفيذ خطوة نسخ ملفات WASM أثناء البناء.`)
    }

    // Fetch the model ourselves so network/CORS/HTTP failures are reported clearly
    // instead of being reduced by the WASM loader to an opaque browser Event.
    const modelAssetPath = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
    let modelResponse
    try {
      modelResponse = await fetch(modelAssetPath, { mode: 'cors', cache: 'force-cache' })
    } catch (error) {
      throw new Error(`تعذر الاتصال بخادم نموذج تتبع الجسم: ${describeError(error)}. تحقق من حظر storage.googleapis.com أو جرّب شبكة أخرى.`)
    }
    if (!modelResponse.ok) {
      throw new Error(`خادم نموذج تتبع الجسم أعاد HTTP ${modelResponse.status} ${modelResponse.statusText}`)
    }
    const modelBytes = new Uint8Array(await modelResponse.arrayBuffer())
    if (modelBytes.byteLength < 100000) {
      throw new Error(`تم تحميل ملف النموذج بحجم غير متوقع: ${modelBytes.byteLength} بايت`)
    }
    const options = { runningMode: 'VIDEO', numPoses: 1 }
    let gpuError
    try {
      // CPU is more compatible with mobile browsers and devices without WebGL support.
      poseRef.current = await PoseLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { modelAssetBuffer: modelBytes, delegate: 'CPU' },
      })
    } catch (error) {
      gpuError = error
      console.warn('MediaPipe CPU delegate failed, trying GPU:', error)
      try {
        poseRef.current = await PoseLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetBuffer: modelBytes, delegate: 'GPU' },
        })
      } catch (gpuFailure) {
        throw new Error(`فشل تشغيل نموذج تتبع الجسم. CPU: ${describeError(gpuError)} | GPU: ${describeError(gpuFailure)}`)
      }
    }
    return poseRef.current
  }

  async function startCamera() {
    setError(''); setLoading(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('المتصفح لا يدعم تشغيل الكاميرا. افتح الموقع عبر HTTPS أو localhost.')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true)
      try { await loadPose(); setPoseReady(true) } catch (e) { console.error('Virtual try-on pose initialization failed:', e, e?.stack); setError(describeError(e) || 'تعذر تحميل تتبع الجسم. افتح تفاصيل الخطأ من وحدة تحكم المتصفح.') }
      drawFrame()
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'لم تسمح للمتصفح باستخدام الكاميرا. فعّل الإذن من إعدادات الموقع ثم حاول مرة أخرى.' : e.message || 'حدثت مشكلة أثناء تشغيل الكاميرا.')
      stopCamera()
    } finally { setLoading(false) }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false); setPoseReady(false)
    const ctx = canvasRef.current?.getContext('2d'); if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  function drawFrame() {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(drawFrame); return }
    const w = video.videoWidth, h = video.videoHeight
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, w, h)
    if (poseRef.current && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime
      const result = poseRef.current.detectForVideo(video, performance.now())
      const p = result.landmarks?.[0]
      if (p) {
        const ls = p[11], rs = p[12], lh = p[23], rh = p[24]
        if ([ls, rs, lh, rh].every(v => v && v.visibility > .35)) {
          const sx = (ls.x + rs.x) / 2 * w, sy = (ls.y + rs.y) / 2 * h
          const hx = (lh.x + rh.x) / 2 * w, hy = (lh.y + rh.y) / 2 * h
          const shoulder = Math.hypot((ls.x-rs.x)*w, (ls.y-rs.y)*h)
          const torso = Math.hypot(hx-sx, hy-sy)
          const width = shoulder * 2.12, height = Math.max(torso * 2.35, shoulder * 2.1)
          const angle = Math.atan2((rs.y-ls.y)*h, (rs.x-ls.x)*w)
          const svg = garmentSvg(garmentRef.current)
          const img = new Image()
          img.onload = () => { ctx.save(); ctx.translate(sx, sy + shoulder*.12); ctx.rotate(angle); ctx.globalAlpha = .88; ctx.drawImage(img, -width/2, -shoulder*.48, width, height); ctx.restore() }
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
        }
      }
    }
    rafRef.current = requestAnimationFrame(drawFrame)
  }

  async function switchCamera() {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    if (cameraOn) { stopCamera(); setTimeout(() => startCamera(), 150) }
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#home"><span className="brand-mark"><Sparkles size={19}/></span><span>VESTRA<small>THE VIRTUAL FITTING ROOM</small></span></a><nav><a href="#collection">المجموعة</a><a href="#how">كيف تعمل؟</a></nav><a className="nav-cta" href="#tryon">ابدأ التجربة <ChevronLeft size={16}/></a></header>
    <main>
      <section className="hero" id="home"><div className="hero-copy"><div className="eyebrow"><span/> مستقبل تجربة التسوق وصل</div><h1>مش مجرد مقاس..<br/><em>دي إطلالتك</em></h1><p>اختار القطعة اللي بتحبها، افتح الكاميرا وشوفها عليك في لحظتها. جرّب ستايل جديد قبل ما تاخد قرارك.</p><div className="hero-actions"><a className="primary-btn" href="#tryon">جرّبها عليك الآن <ChevronLeft size={18}/></a><a className="text-link" href="#collection">اكتشف المجموعة <span>↙</span></a></div><div className="hero-proof"><div className="proof-icon"><Camera size={18}/></div><span><b>تجربة مباشرة</b><small>الكاميرا تشتغل على جهازك</small></span><i/> <span><b>خصوصيتك أولاً</b><small>الفيديو لا يتم رفعه</small></span></div></div><div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-label label-top">YOUR STYLE, YOUR RULES</div><div className="model-card"><img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1000&auto=format&fit=crop&q=85" alt="عارض أزياء يرتدي تيشيرت"/><div className="model-overlay"><span>01 / THE ESSENTIALS</span><b>Find your<br/>new favorite.</b></div></div><div className="floating-tag"><Sparkles size={15}/> FIT IT. FEEL IT.</div><div className="art-stamp">V<br/>—<br/>01</div></div></section>
      <section className="ticker"><span>TRY IT BEFORE YOU BUY IT</span><b>✳</b><span>YOUR CAMERA. YOUR FIT.</span><b>✳</b><span>STYLE WITHOUT GUESSWORK</span><b>✳</b></section>
      <section className="collection section-wrap" id="collection"><div className="section-heading"><div><div className="eyebrow">CURATED FOR YOU / 001</div><h2>اختار <em>إطلالتك</em></h2></div><p>ثلاث قطع مختارة لتبدأ رحلتك في غرفة التجربة الافتراضية.</p></div><div className="product-grid">{products.map((p,i)=><button key={p.id} className={'product-card '+(selected.id===p.id?'active':'')} onClick={()=>{setSelected(p);document.getElementById('tryon')?.scrollIntoView({behavior:'smooth'})}}><div className={'product-visual visual-'+p.id}><span className="product-index">0{i+1}</span><img src={p.id==='tee'?'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80':p.id==='jacket'?'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80':'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&auto=format&fit=crop&q=80'} alt={p.name}/><span className="try-badge">جرّبها عليك ↙</span></div><div className="product-info"><div><h3>{p.name}</h3><small>{p.type} · {p.color}</small></div><b>{p.price}</b></div></button>)}</div></section>
      <section className="try-section" id="tryon"><div className="section-wrap"><div className="section-heading"><div><div className="eyebrow">THE FITTING ROOM / LIVE</div><h2>دورك <em>تجرّب</em></h2></div><p>قف أمام الكاميرا بحيث يظهر الجزء العلوي من جسمك، وسيتم ضبط القطعة على موضع كتفيك.</p></div><div className="fitting-layout"><div className="camera-panel"><div className="camera-topline"><span><i className={cameraOn?'live-dot':''}/>{cameraOn?'LIVE FITTING ROOM':'VIRTUAL FITTING ROOM'}</span><button onClick={()=>setShowGuide(!showGuide)}><CircleHelp size={16}/> مساعدة</button></div><div className="camera-stage"><video ref={videoRef} playsInline muted className={cameraOn?'visible':''}/><canvas ref={canvasRef}/>{!cameraOn&&<div className="camera-placeholder"><div className="camera-symbol"><Camera size={34}/></div><b>مستعد تشوف اللوك عليك؟</b><span>اسمح باستخدام الكاميرا وابدأ التجربة</span><button className="primary-btn" onClick={startCamera} disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<Camera size={18}/>} {loading?'جاري تجهيز الكاميرا...':'افتح الكاميرا'}</button></div>}{cameraOn&&<div className="camera-hint">{poseReady?'حرّك جسمك براحة وشاهد القطعة تتحرك معك':'الكاميرا تعمل — جاري تجهيز تتبع الجسم'}</div>}</div>{error&&<div className="error-note"><X size={16}/>{error}</div>}<div className="camera-controls">{cameraOn?<><button className="control-btn" onClick={switchCamera}><FlipHorizontal size={17}/> تبديل الكاميرا</button><button className="control-btn stop" onClick={stopCamera}><CameraOff size={17}/> إيقاف الكاميرا</button></>:<span>🔒 لا يتم تسجيل أو حفظ الفيديو</span>}<span className="engine-status"><i className={poseReady?'live-dot':''}/>{poseReady?'تتبع الجسم جاهز':'بانتظار الكاميرا'}</span></div>{showGuide&&<div className="guide-box">قف على بُعد متر إلى مترين من الكاميرا، واجعل كتفيك وخصرك ظاهرين بإضاءة جيدة. التجربة الحالية تقريبية وتعتمد على تتبع وضعية الجسم.</div>}</div><aside className="product-panel"><div className="panel-kicker">SELECTED PIECE <span>01 / 03</span></div><div className="selected-product-image"><img src={selected.id==='tee'?'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80':selected.id==='jacket'?'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80':'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&auto=format&fit=crop&q=80'} alt={selected.name}/><span className="selected-chip"><Check size={13}/> جاهز للتجربة</span></div><div className="selected-details"><div><span className="eyebrow">VESTRA / NEW DROP</span><h3>{selected.name}</h3><p>{selected.description}</p></div><strong>{selected.price}</strong></div><div className="selector-label">اختار القطعة</div><div className="piece-options">{products.map(p=><button key={p.id} onClick={()=>setSelected(p)} className={selected.id===p.id?'chosen':''}><span style={{background:p.tone}}/>{p.type}</button>)}</div><div className="privacy-note"><Sparkles size={17}/><span><b>خصوصيتك في أمان</b><small>معالجة الكاميرا تتم داخل متصفحك. لا نرفع الفيديو إلى خادم.</small></span></div><button className="wide-try-btn" onClick={cameraOn?stopCamera:startCamera} disabled={loading}>{cameraOn?'إنهاء التجربة':'ابدأ تجربة القطعة'} <ChevronLeft size={18}/></button></aside></div></div></section>
      <section className="how-section section-wrap" id="how"><div className="eyebrow">SIMPLE AS 1, 2, 3</div><h2>ثلاث خطوات.. <em>وإطلالتك جاهزة</em></h2><div className="steps"><div><span>01</span><Camera size={23}/><h3>افتح الكاميرا</h3><p>اسمح للمتصفح باستخدام الكاميرا من جهازك.</p></div><div><span>02</span><Shirt size={23}/><h3>اختار القطعة</h3><p>تنقّل بين التيشيرت والجاكت والهُودي.</p></div><div><span>03</span><Sparkles size={23}/><h3>شوفها عليك</h3><p>شاهد محاكاة مباشرة تتبع موضع جسمك.</p></div></div></section>
    </main><footer><a className="brand" href="#home"><span className="brand-mark"><Sparkles size={17}/></span><span>VESTRA<small>THE VIRTUAL FITTING ROOM</small></span></a><span>تجربة أولية لتقنية تجربة الملابس الافتراضية</span><span>© 2026 VESTRA STUDIO</span></footer>
  </div>
}
export default App
