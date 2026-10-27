// Runs in GitHub Actions (not in the visitor's browser).
// Requires OPENAI_API_KEY to be configured as a GitHub Actions repository secret.
const fs = require("node:fs");

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Missing OPENAI_API_KEY repository secret.");
  process.exit(1);
}

const seedNames = [
  "ESP32 DevKit (WROOM-32)", "Data-capable USB cable", "5 mm LEDs, single colour (20 pcs)",
  "Resistor pack, 220 Ω (100 pcs)", "Breadboard 830 points", "Jumper wires (120 pcs)",
  "Tactile push buttons (10 pcs)", "DHT11 temperature & humidity sensor",
  "SSD1306 0.96″ OLED, 128×64 (I2C)", "BME280 temp, humidity & pressure",
  "HC-SR04 ultrasonic sensor", "HC-SR501 PIR motion sensor", "10 kΩ potentiometer",
  "Active buzzer module", "1-channel relay module (5 V)", "SG90 micro servo", "L298N motor driver",
  "DC gear motor with wheel", "MAX7219 LED matrix (8×32)", "16×2 LCD with I2C backpack",
  "ESP32-CAM with OV2640", "18650 Li-ion cell with holder", "Digital multimeter",
  "Capacitor assortment (ceramic + electrolytic)", "Resistor assortment kit (600 pcs)",
  "DHT22 temperature & humidity sensor", "LDR photoresistor (10 pcs)",
  "RGB LEDs, common cathode (10 pcs)", "2N2222 NPN transistors (20 pcs)",
  "Passive buzzer module", "ILI9341 2.8″ TFT display (SPI)", "RFID-RC522 module with tags"
];

const file = "products.json";
let previous = [];
try { previous = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
if (!Array.isArray(previous)) previous = [];

const known = new Set([...seedNames, ...previous.map(p => p.n || "")]
  .map(n => String(n).trim().toLowerCase()));

async function main() {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a careful catalog assistant for an ESP32 electronics hobby shop.
Suggest up to 4 distinct, commonly used electronics components or maker modules not already listed.
Do not claim live availability or real supplier prices. Return JSON only:
{"products":[{"n":"product name","c":"one of Prototyping Essentials, Sensors, Actuators & Control, Displays & Comms, Boards, Power, Robotics, Tools","p":integer in PKR as an illustrative estimate,"d":"short factual description"}]}.
Do not suggest mains-voltage dangerous DIY kits. Prices are placeholders and must be verified before selling.`
        },
        {
          role: "user",
          content: `Current catalog product names (avoid duplicates):\n${[...known].join("\n")}\nSuggest up to 4 useful new products for ESP32 learners.`
        }
      ]
    })
  });

  const bodyText = await response.text();
  let payload;
  try { payload = JSON.parse(bodyText); }
  catch { throw new Error("AI service returned unreadable data."); }
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI request failed (${response.status})`);

  let result;
  try { result = JSON.parse(payload.choices?.[0]?.message?.content || "{}"); }
  catch { throw new Error("AI did not return valid JSON."); }

  const cats = new Set([
    "Prototyping Essentials", "Sensors", "Actuators & Control",
    "Displays & Comms", "Boards", "Power", "Robotics", "Tools"
  ]);
  const priorNames = new Set([...known]);
  const fresh = (Array.isArray(result.products) ? result.products : [])
    .filter(p => p && typeof p.n === "string" && p.n.trim().length > 2 &&
      !priorNames.has(p.n.trim().toLowerCase()) && cats.has(p.c) &&
      Number.isFinite(Number(p.p)))
    .slice(0, 4)
    .map((p, i) => ({
      id: Date.now() + i,
      n: p.n.trim(),
      c: p.c,
      p: Math.max(0, Math.round(Number(p.p))),
      d: String(p.d || "AI-suggested electronics component. Verify specifications before listing.").slice(0, 240),
      s: 0,
      st: 0,
      k: "ai-product",
      aiSuggested: true
    }));

  const allNames = new Set(previous.map(p => String(p.n || "").trim().toLowerCase()));
  const additions = fresh.filter(p => !allNames.has(p.n.toLowerCase()));
  fs.writeFileSync(file, JSON.stringify([...previous, ...additions], null, 2) + "\n");
  console.log(`Added ${additions.length} new AI product suggestion(s). Total saved: ${previous.length + additions.length}.`);
}

main().catch(err => {
  console.error("AI product discovery failed:", err.message);
  process.exit(1);
});
