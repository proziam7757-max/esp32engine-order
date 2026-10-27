const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const AUTO_DISCOVER = process.env.AUTO_DISCOVER === 'true';
const STORE_FILE = path.join(__dirname, 'ai-products.json');
const HTML_FILE = path.join(__dirname, 'index.html');
const existingSeedNames = [
  'ESP32 DevKit (WROOM-32)','Data-capable USB cable','5 mm LEDs, single colour (20 pcs)',
  'Resistor pack, 220 Ω (100 pcs)','Breadboard 830 points','Jumper wires (120 pcs)',
  'Tactile push buttons (10 pcs)','DHT11 temperature & humidity sensor',
  'SSD1306 0.96″ OLED, 128×64 (I2C)','BME280 temp, humidity & pressure',
  'HC-SR04 ultrasonic sensor','HC-SR501 PIR motion sensor','10 kΩ potentiometer',
  'Active buzzer module','1-channel relay module (5 V)','SG90 micro servo','L298N motor driver',
  'DC gear motor with wheel','MAX7219 LED matrix (8×32)','16×2 LCD with I2C backpack',
  'ESP32-CAM with OV2640','18650 Li-ion cell with holder','Digital multimeter',
  'Capacitor assortment (ceramic + electrolytic)','Resistor assortment kit (600 pcs)',
  'DHT22 temperature & humidity sensor','LDR photoresistor (10 pcs)',
  'RGB LEDs, common cathode (10 pcs)','2N2222 NPN transistors (20 pcs)',
  'Passive buzzer module','ILI9341 2.8″ TFT display (SPI)','RFID-RC522 module with tags'
];
function readProducts(){try{return JSON.parse(fs.readFileSync(STORE_FILE,'utf8'))}catch{return []}}
function writeProducts(items){fs.writeFileSync(STORE_FILE,JSON.stringify(items,null,2))}
function send(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'same-origin','Cache-Control':'no-store'});res.end(JSON.stringify(obj))}
function readBody(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>100000)reject(new Error('Request too large'))});req.on('end',()=>{try{resolve(JSON.parse(b||'{}'))}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject)})}
async function discover(existingNames=[]){
  if(!OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is not set on the server');
  const current=[...new Set([...existingSeedNames,...readProducts().map(p=>p.n),...existingNames])];
  const response=await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',headers:{'Authorization':`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',temperature:0.5,
      messages:[
        {role:'system',content:'You are a careful catalog assistant for an ESP32 electronics hobby shop. Suggest genuinely distinct, commonly used electronics components or maker modules that are not in the supplied catalog. Do not claim live availability or real supplier prices. Return only valid JSON: {"products":[{"n":"product name","c":"one of Prototyping Essentials, Sensors, Actuators & Control, Displays & Comms, Boards, Power, Robotics, Tools","p":integer in PKR as a clearly illustrative estimate,"d":"short factual description","s":0,"st":0}]} . Suggest at most 4 items. Do not suggest mains-voltage dangerous DIY kits, batteries without safety caveats, or duplicate variants. Estimates are placeholders and must be verified by the shop owner.'},
        {role:'user',content:`Current catalog product names (avoid duplicates):\n${current.join('\n')}\nSuggest up to 4 useful new products for ESP32 learners. Return JSON only.`}
      ],response_format:{type:'json_object'}})
  });
  const raw=await response.text();let payload;try{payload=JSON.parse(raw)}catch{throw new Error('AI service returned an unreadable response')}
  if(!response.ok)throw new Error(payload.error?.message||`AI request failed (${response.status})`);
  let result;try{result=JSON.parse(payload.choices?.[0]?.message?.content||'{}')}catch{throw new Error('AI did not return valid product JSON')}
  const prior=new Set(current.map(x=>x.toLowerCase()));
  const cats=new Set(['Prototyping Essentials','Sensors','Actuators & Control','Displays & Comms','Boards','Power','Robotics','Tools']);
  const fresh=(Array.isArray(result.products)?result.products:[]).filter(x=>x&&typeof x.n==='string'&&!prior.has(x.n.trim().toLowerCase())&&cats.has(x.c)&&Number.isFinite(Number(x.p))&&x.n.trim().length>2).slice(0,4).map((x,i)=>({id:Date.now()+i,n:x.n.trim(),c:x.c,p:Math.max(0,Math.round(Number(x.p))),d:String(x.d||'AI-suggested electronics component. Verify specifications before listing.').slice(0,240),s:0,st:0,k:'ai-product',aiSuggested:true}));
  const all=readProducts();const seen=new Set(all.map(x=>x.n.toLowerCase()));const added=fresh.filter(x=>!seen.has(x.n.toLowerCase()));writeProducts([...all,...added]);return added;
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/api/products')return send(res,200,{products:readProducts()});
  if(req.method==='POST'&&url.pathname==='/api/ai-discover'){
    if(!ADMIN_TOKEN)return send(res,503,{error:'Set ADMIN_TOKEN on the server before enabling AI discovery.'});
    if(req.headers['x-admin-token']!==ADMIN_TOKEN)return send(res,401,{error:'Incorrect admin token.'});
    try{const body=await readBody(req);const products=await discover(Array.isArray(body.existingProducts)?body.existingProducts:[]);return send(res,200,{added:products.length,products})}catch(e){return send(res,500,{error:e.message||'AI discovery failed'})}
  }
  if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html')){try{const html=fs.readFileSync(HTML_FILE);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html)}catch{return send(res,500,{error:'index.html not found'})}}
  res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');
});
server.listen(PORT,()=>console.log(`ESP32 AI Shop running at http://localhost:${PORT}`));
if(AUTO_DISCOVER){const run=async()=>{try{const added=await discover();console.log(`Scheduled AI discovery added ${added.length} suggestion(s).`)}catch(e){console.error('Scheduled AI discovery failed:',e.message)}};setTimeout(run,15000);setInterval(run,24*60*60*1000)}
