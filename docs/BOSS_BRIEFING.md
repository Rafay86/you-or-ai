# Boss briefing: You, AI, or Both? Studio

Ye file tumhare liye hai. Isse padh ke tum boss ko poora product samjha sakte ho, demo de sakte ho, aur sawalon ke jawab de sakte ho. Numbers wahi hain jo app mein example data mein dikhte hain (fictional data).

---

## 1. Ek line mein

> Ye tool kisi bhi company ke ek workflow ko task-by-task todta hai, aur bolta hai **kaun karega: insaan (You), AI, ya dono (Both)**. Phir uske upar plan, paisa, roadmap aur pilot ka hisaab deta hai. Sab kuch saaf rules se, koi black box nahi.

**30 second ka pitch:**
"Log poochte hain 'AI kahan lagayein?'. Galat sawaal hai. Sahi sawaal hai 'is kaam ka kaunsa hissa AI kare, kaunsa insaan, aur kaunsa dono?'. Ye tool wahi batata hai, wajah ke saath, aur phir batata hai kitna paisa bachega, kya-kya tayyari chahiye, aur pilot ke baad expand karna hai ya rokna hai."

---

## 2. Teen cheezein jo boss ko pehle samjhani hain

**a) You / AI / Both kya hai**

| Verdict | Matlab | Example (weekly report) |
|---|---|---|
| **You** | Insaan karega | Kaunsi delay leadership tak jaaye, ye manager decide karta hai. Department leads ke saath team conversation |
| **AI** | AI karega, limits ke andar | Updates gather karna, spreadsheets consolidate karna, data clean karna |
| **Both** | AI madad karta hai, insaan verify ya decide karta hai | AI commentary ka draft banata hai, manager edit aur approve karta hai |
| **Needs Assessment** | Zaroori info missing hai, isliye guess nahi karte | Jab task ka description ya owner missing ho |

**Zaroori baat:** yahan "AI" ka matlab "bina dekhe apne aap chalega" nahi hai. Har AI task ke saath review ya exception ka raasta hota hai.

**b) Verdict kaise aata hai (koi jadoo nahi)**

Tool har task ko 9 baaton par jaanchta hai:

| Baat | AI ki taraf jhukata hai | Insaan ki taraf jhukata hai |
|---|---|---|
| Kaam kitna repeat hota hai | Bahut | Kam |
| Data kaisa hai | Structured | Unstructured |
| Judgment chahiye? | Kam | Zyada |
| Data kitna sensitive hai | | Confidential ya Restricted |
| Galti ka nuksaan | | High ya Critical |
| Output check karna kitna aasaan | Aasaan | Mushkil |
| Exceptions kitne | Kam | Zyada |
| Rishta ya relationship ka mahatva | | Zyada |
| Systems tak AI ki pahunch confirm hai? | | Confirm nahi to insaan ki taraf |

Har verdict ke saath wajah likhi hoti hai. User chahe to override kar sakta hai, aur app record karta hai kisne badla aur kyun.

**c) Teen tarah ki cheezein jo hamesha alag dikhti hain**

Business case mein har number ke saath label hota hai:
- **Your fact:** jo user ne khud diya.
- **From template:** starter template ka default.
- **Estimate:** product ka apna andaza. Isse asli figure se badalna hai.

Boss ko ye pasand aayega, kyunki kuch bhi "precise ROI" bana ke nahi bechte.

---

## 3. Do scenarios (yahi sabse zyada poochha jaayega)

Har project mein do future ke raaste hote hain. Example (weekly management report) ke numbers:

| | **Scenario A: Cautious, human-led** | **Scenario B: More automated** |
|---|---|---|
| Soch | AI sirf mechanical kaam (data prep) karta hai, insaan sab kuch dekhta hai | AI zyada kaam karta hai, insaan sirf exceptions aur sign-off dekhta hai |
| Insaan ki mehnat | 110 ghante/mahina | 55 ghante/mahina |
| AI ka hissa | 35% | 70% |
| Setup mein lagega | 4 hafte | 6 hafte |
| Chalane ka kharcha | $600/mahina | $1,200/mahina |
| Samay bachega | 72 ghante/mahina | 127 ghante/mahina |
| Risks | Bachat kam, dheemi improvement | Source spreadsheet ka format badle to dikkat, manager ko AI draft review karna seekhna padega |
| Controls chahiye | Har variance ka dual manual review, weekly analyst check-in | Automatic schema alert, VP ka single-button approval |

**Boss ko kaise samjhana:**
"A safe hai par kam bachata hai. B zyada bachata hai par zyada tayyari aur control maangta hai. App dono ko side-by-side dikhata hai, aur jo choose karo usi ke hisaab se business case badal jaata hai."

Naye project mein bhi do scenarios bante hain (cautious aur more automated), par unke numbers tumhare diye hours par based hote hain. Agar tumne hours nahi diye to woh placeholder hote hain aur label mein "Estimate" likha aata hai.

---

## 4. Nau steps (sidebar mein isi order mein)

Har step ke saath: kya karta hai, aur demo mein kya dikhana hai.

1. **Begin.** Teen raaste: Quick start (5 sawaal), Upload a procedure (PDF/Word/text), ya Industry library. *Demo: "Try a sample procedure" dabao. Dikhao ki har step ke saath page/section likha aata hai.*
2. **Confirm the work.** Har step editable: kaun karta hai, kaunse systems, kitna time, kahan atakta hai, exceptions. "Practice mein hota hai par likha nahi" wale steps add kar sakte ho. *Demo: ek step add karo, dikhao ki wo alag label ("Happens in practice") ke saath aata hai.*
3. **Who does what.** Har task ka You/AI/Both verdict aur wajah. *Demo: ek task kholo, wajah padho, override karo, "Decision Trace" mein naam aur kaaran dikhao.*
4. **Redesign.** Aaj ka workflow aur naya workflow side-by-side. Kahan human review gate hai. *Demo: proposed tab mein manager ka "decides what to escalate" node dikhao.*
5. **People and controls.** Har change ek task se juda hai: kaunse skills seekhne hain, training, business aur technical owner, controls, testing, approval, aur "ye pehle chahiye" wali list. *Demo: ek prerequisite tick karo, roadmap mein woh item Complete ho jaata hai aur uske peeche wala khul jaata hai.*
6. **Business case.** Aaj ka kharcha, bachat ki range, setup ka kharcha, chalane ka kharcha. Assumptions editable, number turant badalte hain. *Demo: hourly cost badlo aur dikhao ki label "Your fact" ban gaya.*
7. **Roadmap.** 30/60/90 din, changes se apne aap bana. Prerequisite missing ho to item **Blocked** dikhta hai. *Demo: blocked item ko start karne ki koshish karo, app rokta hai.*
8. **Pilot.** Pilot ke asli numbers daalo, baseline aur target se compare hote hain. Ye bhi dikhata hai **kaunsi assumption galat nikli**. *Demo: ek actual daalo, "Was wrong / Held" dikhao.*
9. **Decide.** Evidence se recommendation: Expand, Improve and retest, ya Stop. Bina pilot data ke ye "abhi decide nahi ho sakta" bolta hai, Stop nahi.

Iske alawa: **Executive summary** (ek page ka review), **Governance and risks**, **Saved projects** (versions ke saath) aur **Download report** (PDF).

---

## 5. Demo script (7 minute)

Example ko already load kiya hua hai: "Weekly Management Reporting" (fictional).

1. **Home (1 min).** Venn dikhao: 12 tasks mein 7 AI, 3 Both, 2 You. "Ye sirf ginti nahi, har task ki wajah likhi hai."
2. **Who does what (2 min).** Teen tasks kholo:
   - *Consolidate information* → **AI** (repetitive, structured, low judgment).
   - *Investigate unusual movements* → **Both** (AI draft karta hai, manager context ke saath asli baat karta hai).
   - *Decide which delays and risks to escalate* → **You** (accountability manager ki hai).
3. **Redesign (1 min).** Naya workflow, aur manager ka escalation gate.
4. **People and controls (1 min).** Ek change kholo, skills aur controls dikhao, batao ki ye generic checklist nahi hai, is task ke attributes se bana hai.
5. **Business case aur scenarios (1 min).** 42 ghante/hafta aaj ka effort, $141,960/saal. Scenario B mein net $50k se $85k/saal ki range, $30k setup. Zor do: "range hai, forecast nahi."
6. **Pilot aur decision (1 min).** Pilot mein weekly time 42 se 31 ghante, quality 82% se 94%, errors 18% se 4.5%. Par adoption 72% hai jabki target 80%. Isliye recommendation **Improve and retest**, expand nahi.

**Ant mein bolo:** "Aur ye sab tumhare apne workflow par bhi chal sakta hai: Quick start se 5 sawaal, ya apna procedure upload karo."

---

## 6. Boss ke sambhavit sawal aur jawab

**"Ye ChatGPT jaisa hai kya?"**
Nahi. Ye chatbot nahi hai. Ye workflow ko todta hai aur decision, plan, paisa aur pilot ka tracking deta hai. Koi paid AI API nahi lagti.

**"Verdict par bharosa kaise karein?"**
Har verdict ke rules aur wajah dikhti hain, koi black box nahi. Aur aakhri decision insaan ka hai: override hota hai aur record hota hai.

**"Hamare confidential documents ka kya?"**
Upload browser ke andar hi padha jaata hai. Na server par jaata hai, na kisi AI service ko bheja jaata hai, na log hota hai. Ye design se hai, sirf vaada nahi.

**"ROI kitna pakka hai?"**
Pakka nahi hai, aur app bhi aisa nahi kehta. Range dikhata hai, aur har input ke saath label hai (tumhara fact / template / estimate). Asli confidence pilot ke baad aata hai.

**"Kya ye compliance guarantee karta hai?"**
Nahi. Controls sujhaav hain jinhe tumhari apni policies ke saath check karna hai. Kisi regulation ka claim nahi.

**"Agar AI galat nikla?"**
Isliye har AI/Both task ke saath review ya exception route, testing aur approval likha aata hai. Pilot mein galat assumptions pakde jaate hain.

**"Kitna time lagta hai shuru karne mein?"**
Quick start mein ek minute. Apna procedure upload karo to review ke baad turant analysis.

**"Hamare industry ke examples hain?"**
Banking (onboarding/KYC, loan document check, complaint triage), Insurance (claims, renewal) aur weekly report. Sab fictional starters hain, apne process ke roop mein badalne ke liye.

---

## 7. Imaandari se: abhi kya nahi hai

Boss ko pehle hi bata do, taaki baad mein surprise na ho:
- Data sirf ek browser mein rehta hai. Login, sharing aur server storage nahi hain.
- Document extraction heuristic hai. Saaf numbered procedure achha padhta hai, likhe hue paragraphs kamzor. Isliye insaan ka review mandatory hai.
- Scanned PDF (OCR) support nahi hai.
- Business-case ki maths simple hai aur asli data se calibrate nahi hui.
- Kuch purane pages (Discover, Future State, Scenario, Governance) ka design abhi naya nahi hua.
- Enterprise launch se pehle: server storage, audit log, accessibility audit, aur company ki apni policy packs chahiye.

Ye "prototype nahi, kaam karta hua pehla version" hai. Enterprise-ready nahi.

---

## 8. Do kaam jo tumhe demo se pehle karne chahiye

1. `npm run dev` chalao aur ek baar poora example khud dekh lo.
2. Ek baar apna koi chhota asli procedure upload karke dekho, taaki live demo mein surprise na ho.
