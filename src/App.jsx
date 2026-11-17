import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Check, ChevronLeft, CircleHelp, FlipHorizontal, LoaderCircle, Shirt, Sparkles, X } from 'lucide-react'
import { createDecartClient, models } from '@decartai/sdk'

const products = [
  {id:'tee',name:'تيشيرت Essential',type:'تيشيرت',category:'تيشيرتات',color:'أسود',price:'790 ج.م',tone:'#252724',image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=85',description:'قطن ناعم وقصة يومية مريحة.',prompt:'a plain black cotton crew-neck short-sleeve T-shirt'},
  {id:'tee-white',name:'تيشيرت Clean',type:'تيشيرت',category:'تيشيرتات',color:'أبيض',price:'690 ج.م',tone:'#e9e7df',image:'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=900&auto=format&fit=crop&q=85',description:'تيشيرت أبيض أساسي بتصميم نظيف.',prompt:'a clean white cotton crew-neck short-sleeve T-shirt'},
  {id:'tee-graphic',name:'تيشيرت Graphic',type:'تيشيرت',category:'تيشيرتات',color:'أوف وايت',price:'850 ج.م',tone:'#d7d0c3',image:'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=900&auto=format&fit=crop&q=85',description:'ستايل شبابي بطابع جرافيكي.',prompt:'an off-white graphic print streetwear T-shirt'},
  {id:'shirt',name:'قميص Oxford',type:'قميص',category:'قمصان',color:'أزرق فاتح',price:'1,090 ج.م',tone:'#9db9cc',image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=85',description:'قميص أنيق مناسب للكاجوال والسمارت.',prompt:'a light blue Oxford button-down shirt'},
  {id:'shirt-black',name:'قميص Minimal',type:'قميص',category:'قمصان',color:'أسود',price:'1,190 ج.م',tone:'#202020',image:'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=900&auto=format&fit=crop&q=85',description:'قميص أسود بقصة عصرية بسيطة.',prompt:'a black long-sleeve button-up shirt'},
  {id:'hoodie',name:'هودي Studio',type:'هودي',category:'هوديز وسويتشيرت',color:'رمادي',price:'1,250 ج.م',tone:'#777b79',image:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=85',description:'هودي واسع بملمس ناعم.',prompt:'a medium grey cotton pullover hoodie'},
  {id:'hoodie-black',name:'هودي Core',type:'هودي',category:'هوديز وسويتشيرت',color:'أسود',price:'1,390 ج.م',tone:'#242424',image:'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=900&auto=format&fit=crop&q=85',description:'هودي أسود أساسي للطبقات اليومية.',prompt:'a black pullover hoodie'},
  {id:'sweatshirt',name:'سويتشيرت Relax',type:'سويتشيرت',category:'هوديز وسويتشيرت',color:'بيج',price:'1,150 ج.م',tone:'#c9bba5',image:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=85',description:'سويتشيرت مريح بلون هادئ.',prompt:'a beige crewneck sweatshirt'},
  {id:'jacket',name:'جاكت Urban',type:'جاكت',category:'جاكيتات',color:'زيتي',price:'1,890 ج.م',tone:'#59634b',image:'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&auto=format&fit=crop&q=85',description:'جاكت بومبر بطابع عصري.',prompt:'an olive green casual bomber jacket'},
  {id:'jacket-denim',name:'جاكت Denim',type:'جاكت جينز',category:'جاكيتات',color:'أزرق دنيم',price:'1,750 ج.م',tone:'#526d85',image:'https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=900&auto=format&fit=crop&q=85',description:'جاكت جينز كلاسيكي للوك يومي.',prompt:'a classic blue denim jacket'},
  {id:'coat',name:'معطف Classic',type:'معطف',category:'جاكيتات',color:'جملي',price:'2,650 ج.م',tone:'#a9825c',image:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=900&auto=format&fit=crop&q=85',description:'معطف طويل أنيق بطابع كلاسيكي.',prompt:'a camel long wool overcoat'},
  {id:'cardigan',name:'كارديجان Soft',type:'كارديجان',category:'هوديز وسويتشيرت',color:'كريمي',price:'1,490 ج.م',tone:'#d8d0bf',image:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=900&auto=format&fit=crop&q=85',description:'كارديجان ناعم لإطلالة متعددة الطبقات.',prompt:'a cream knit cardigan'}
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
  const [activeCategory, setActiveCategory] = useState('الكل')
  const [searchTerm, setSearchTerm] = useState('')
  const categories = ['الكل', ...new Set(products.map(p => p.category))]
  const visibleProducts = products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && (p.name.includes(searchTerm.trim()) || p.type.includes(searchTerm.trim()) || p.color.includes(searchTerm.trim())))
  const videoRef = useRef(null)
  const outputVideoRef = useRef(null)
  const streamRef = useRef(null)
  const realtimeRef = useRef(null)
  const startingRef = useRef(false)
  async function applySelectedGarment(product) {
    if (!realtimeRef.current) return
    const response = await fetch(product.image)
    if (!response.ok) throw new Error('تعذر تحميل صورة قطعة الملابس. حاول مرة أخرى.')
    const prompt = 'Substitute the current upper-body clothing with ' + product.prompt + '. Preserve the person identity, face, pose, body shape, background and lighting.'
    await realtimeRef.current.setImage(await response.blob(), { prompt, enhance: false })
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
      <section className="hero" id="home"><div className="hero-copy"><div className="eyebrow"><span/> مستقبل تجربة التسوق وصل</div><h1>مش مجرد مقاس..<br/><em>دي إطلالتك</em></h1><p>اختار القطعة اللي بتحبها، افتح الكاميرا وشوفها عليك في لحظتها. جرّب ستايل جديد قبل ما تاخد قرارك.</p><div className="hero-actions"><a className="primary-btn" href="#tryon">جرّبها عليك الآن <ChevronLeft size={18}/></a><a className="text-link" href="#collection">اكتشف المجموعة <span>↙</span></a></div><div className="hero-proof"><div className="proof-icon"><Camera size={18}/></div><span><b>تجربة مباشرة</b><small>مدعومة بمحرك Decart AI</small></span><i/> <span><b>خصوصيتك أولاً</b><small>معالجة عبر Decart AI</small></span></div></div><div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-label label-top">YOUR STYLE, YOUR RULES</div><div className="model-card"><img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1000&auto=format&fit=crop&q=85" alt="عارض أزياء يرتدي تيشيرت"/><div className="model-overlay"><span>01 / THE ESSENTIALS</span><b>Find your<br/>new favorite.</b></div></div><div className="floating-tag"><Sparkles size={15}/> FIT IT. FEEL IT.</div><div className="art-stamp">V<br/>—<br/>01</div></div></section>
      <section className="ticker"><span>TRY IT BEFORE YOU BUY IT</span><b>✳</b><span>YOUR CAMERA. YOUR FIT.</span><b>✳</b><span>STYLE WITHOUT GUESSWORK</span><b>✳</b></section>
      <section className="collection section-wrap" id="collection"><div className="section-heading"><div><div className="eyebrow">CURATED FOR YOU / 001</div><h2>اختار <em>إطلالتك</em></h2></div><p>اكتشف تشكيلتنا المختارة من التيشيرتات والقمصان والهوديز والجاكيتات.</p></div><div className="catalog-tools"><div className="category-filters">{categories.map(category=><button key={category} className={activeCategory===category?'selected':''} onClick={()=>setActiveCategory(category)}>{category}</button>)}</div><label className="catalog-search"><span>⌕</span><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="ابحث عن قطعة أو لون..." /></label></div><div className="catalog-count">عرض {visibleProducts.length} من {products.length} قطعة</div><div className="product-grid">{visibleProducts.map((p,i)=><button key={p.id} className={'product-card '+(selected.id===p.id?'active':'')} onClick={()=>{setSelected(p);document.getElementById('tryon')?.scrollIntoView({behavior:'smooth'})}}><div className="product-visual"><span className="product-index">{String(i+1).padStart(2,'0')}</span><img src={p.image} alt={p.name} loading="lazy"/><span className="try-badge">جرّبها عليك ↙</span></div><div className="product-info"><div><h3>{p.name}</h3><small>{p.type} · {p.color}</small></div><b>{p.price}</b></div></button>)}</div></div></section>
      <section className="try-section" id="tryon"><div className="section-wrap"><div className="section-heading"><div><div className="eyebrow">THE FITTING ROOM / LIVE</div><h2>دورك <em>تجرّب</em></h2></div><p>قف أمام الكاميرا بحيث يظهر الجزء العلوي من جسمك بوضوح لتجربة القطعة المختارة.</p></div><div className="fitting-layout"><div className="camera-panel"><div className="camera-topline"><span><i className={cameraOn?'live-dot':''}/>{cameraOn?'LIVE FITTING ROOM':'VIRTUAL FITTING ROOM'}</span><button onClick={()=>setShowGuide(!showGuide)}><CircleHelp size={16}/> مساعدة</button></div><div className="camera-stage"><video ref={videoRef} playsInline muted className={cameraOn?'visible':''}/><video ref={outputVideoRef} playsInline muted className={'ai-output '+(outputReady?'visible':'')} />{!cameraOn&&<div className="camera-placeholder"><div className="camera-symbol"><Camera size={34}/></div><b>مستعد تشوف اللوك عليك؟</b><span>اسمح باستخدام الكاميرا وابدأ التجربة</span><button className="primary-btn" onClick={startCamera} disabled={loading}>{loading?<LoaderCircle className="spin" size={18}/>:<Camera size={18}/>} {loading?'جاري تجهيز الكاميرا...':'افتح الكاميرا'}</button></div>}{cameraOn&&<div className="camera-hint">{!engineReady?'جاري الاتصال بمحرك Decart للذكاء الاصطناعي':outputReady?'التجربة الذكية تعمل — حرّك جسمك لمعاينة القطعة':'تم الاتصال — جاري تجهيز الفيديو المعدّل'}</div>}</div>{error&&<div className="error-note"><X size={16}/>{error}</div>}<div className="camera-controls">{cameraOn?<><button className="control-btn" onClick={switchCamera}><FlipHorizontal size={17}/> تبديل الكاميرا</button><button className="control-btn stop" onClick={stopCamera}><CameraOff size={17}/> إيقاف الكاميرا</button></>:<span>🔒 يُعالج الفيديو لدى Decart ولا تحفظه VESTRA</span>}<span className="engine-status"><i className={engineReady?'live-dot':''}/>{engineReady?'محرك Decart متصل':'بانتظار الكاميرا'}</span></div>{showGuide&&<div className="guide-box">قف على بُعد متر إلى مترين من الكاميرا، واجعل كتفيك وخصرك ظاهرين بإضاءة جيدة. تستخدم التجربة محرك Decart AI لتحويل بث الكاميرا إلى معاينة ملابس مباشرة.</div>}</div><aside className="product-panel"><div className="panel-kicker">SELECTED PIECE <span>{String(products.findIndex(p=>p.id===selected.id)+1).padStart(2,'0')} / {String(products.length).padStart(2,'0')}</span></div><div className="selected-product-image"><img src={selected.image} alt={selected.name}/><span className="selected-chip"><Check size={13}/> جاهز للتجربة</span></div><div className="selected-details"><div><span className="eyebrow">VESTRA / NEW DROP</span><h3>{selected.name}</h3><p>{selected.description}</p></div><strong>{selected.price}</strong></div><div className="selector-label">اختار القطعة</div><div className="piece-options">{products.map(p=><button key={p.id} onClick={()=>setSelected(p)} className={selected.id===p.id?'chosen':''}><span style={{background:p.tone}}/>{p.name}</button>)}</div><div className="privacy-note"><Sparkles size={17}/><span><b>خصوصيتك في أمان</b><small>يتم إرسال بث الكاميرا إلى Decart لمعالجة تجربة الملابس، ولا نخزّن الفيديو في VESTRA.</small></span></div><button className="wide-try-btn" onClick={cameraOn?stopCamera:startCamera} disabled={loading}>{cameraOn?'إنهاء التجربة':'ابدأ تجربة القطعة'} <ChevronLeft size={18}/></button></aside></div></div></section>
      <section className="how-section section-wrap" id="how"><div className="eyebrow">SIMPLE AS 1, 2, 3</div><h2>اختار، جرّب، <em>وشوف اللوك عليك</em></h2><div className="steps"><div><span>01</span><Camera size={23}/><h3>افتح الكاميرا</h3><p>اسمح للمتصفح باستخدام الكاميرا من جهازك.</p></div><div><span>02</span><Shirt size={23}/><h3>اختار القطعة</h3><p>تنقّل بين قطع مختلفة من الملابس واختر اللي يناسبك.</p></div><div><span>03</span><Sparkles size={23}/><h3>شوفها عليك</h3><p>شاهد معاينة الملابس بالذكاء الاصطناعي في الوقت الفعلي.</p></div></div></section>
    </main><footer><a className="brand" href="#home"><span className="brand-mark"><Sparkles size={17}/></span><span>VESTRA<small>THE VIRTUAL FITTING ROOM</small></span></a><span>تجربة الملابس الافتراضية بالذكاء الاصطناعي</span><span>© 2026 VESTRA STUDIO</span></footer>
  </div>
}
export default App
