var M=Object.defineProperty;var B=(o,s,e)=>s in o?M(o,s,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[s]=e;var m=(o,s,e)=>(B(o,typeof s!="symbol"?s+"":s,e),e);import{g as L,j as l,F as R,a as q,m as f}from"./index.es-6456b573.js";import{r as D}from"./index-76fb7be0.js";import"./_commonjsHelpers-de833af9.js";class U extends f{constructor(){super(...arguments);m(this,"emojisToRender",this.query(e=>e.with("position","emoji","distanceToTarget")));m(this,"emojisDomElement",document.getElementById("emojis"))}onInit(){this.emojisToRender.onEntityAdded.add(e=>{const{emoji:t}=e;this.emojisDomElement.appendChild(t.domElement),t.dirty=!0})}onDestroy(){for(const e of this.emojisToRender){const{emoji:t}=e;t.domElement.remove()}}onUpdate(){for(const e of this.emojisToRender){const{emoji:t}=e;if(!t.dirty)continue;const{position:a,distanceToTarget:r}=e;if(!r)continue;const{distance:i}=r;t.revealed?i>8?t.domElement.innerText="🥶":i>5?t.domElement.innerText="❄️":i>3?t.domElement.innerText="🕯":i>=2?t.domElement.innerText="🔥":i>=1?t.domElement.innerText="🫣":t.domElement.innerText="💣":t.domElement.innerText="☁";const c=28,n=a.x*c,d=a.y*c;t.domElement.className=`emoji ${t.revealed?"revealed":""}`,t.domElement.style.left=`${n+document.body.clientWidth/2-c/2}px`,t.domElement.style.top=`${d-c/2}px`,t.dirty=!1}}}class G extends f{constructor(){super(...arguments);m(this,"emojis",this.query(e=>e.with("emoji","position")));m(this,"target",this.query(e=>e.with("target","position")))}onInit(){this.emojis.onEntityAdded.add(e=>{const{position:{x:t,y:a}}=e,{position:r}=this.target.first,i=Math.sqrt(Math.pow(r.x-t,2)+Math.pow(r.y-a,2));this.world.add(e,"distanceToTarget",{distance:i})})}}class w extends f{constructor(){super(...arguments);m(this,"emojis",this.query(e=>e.with("emoji","position")));m(this,"target",this.query(e=>e.with("target","position")));m(this,"gameState",this.singleton("gameState",{required:!0}));m(this,"nRevealedDomElement",document.createElement("p"))}onInit(){document.querySelector("#score").appendChild(this.nRevealedDomElement),this.nRevealedDomElement.innerText="Click on an emoji to start",this.emojis.onEntityAdded.add(e=>{const{emoji:t}=e;t.domElement.addEventListener("click",()=>{if(!(!this.gameState||this.gameState.foundBomb)&&!t.revealed){t.revealed=!0,this.gameState.clicks+=1;const a=this.target.first,{position:r}=a,{position:i}=e;r.x===i.x&&r.y===i.y?(this.gameState.foundBomb=!0,this.nRevealedDomElement.innerText="You found the bomb in "+this.gameState.clicks.toString()+" clicks!"):this.nRevealedDomElement.innerText=w.scoreText(this.gameState.clicks),t.dirty=!0}})})}static scoreText(e){return`${e} clicks so far...`}}const p=()=>(D.useEffect(()=>{const o=new L({components:["position","emoji","distanceToTarget","target","gameState"]});o.registerSystem(G).registerSystem(U).registerSystem(w),o.init();const s=(n,d)=>Math.floor(Math.random()*(d-n+1)+n),e=()=>{const n={gameState:{clicks:0,foundBomb:!1}};o.create(n);const d=11,y=-Math.floor(d/2),g=Math.ceil(d/2),j=11,E=-Math.floor(j/2),T=Math.ceil(j/2),b={position:{x:s(y+2,g-2),y:s(E+2,T-2)},target:!0};o.create(b);for(let u=y;u<g;u++)for(let h=E;h<T;h++){const k={position:{x:h,y:u},emoji:{revealed:!1,dirty:!1,domElement:document.createElement("div")}};o.create(k)}return()=>{o.reset()}};let t=e();document.querySelector("#reset").addEventListener("click",()=>{t(),t=e()}),window.addEventListener("resize",()=>{o.filter(n=>n.with("emoji")).forEach(n=>{n.emoji.dirty=!0})});const a=()=>performance.now()/1e3;let r=!0,i=a();const c=()=>{if(!r)return;requestAnimationFrame(c);const n=a(),d=n-i;i=n,o.step(d)};return c(),()=>{r=!1,o.reset()}}),l(R,{children:q("div",{id:"emoji-sweeper",children:[l("p",{children:"Click the emojis to reveal them. Try to find the bomb in as few clicks as possible!"}),l("div",{id:"score"}),l("button",{id:"reset",children:"Reset"}),l("div",{id:"emojis"})]})})),$={name:"Vanilla / Find The Bomb",component:p};var x,v,S;p.parameters={...p.parameters,docs:{...(x=p.parameters)==null?void 0:x.docs,source:{originalSource:`() => {
  useEffect(() => {
    const world = new World<Entity>({
      components: ['position', 'emoji', 'distanceToTarget', 'target', 'gameState']
    });
    world.registerSystem(DistanceSystem).registerSystem(EmojiRendererSystem).registerSystem(InteractionSystem);
    world.init();
    const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
    const setupGame = () => {
      const gameState = {
        gameState: {
          clicks: 0,
          foundBomb: false
        }
      };
      world.create(gameState);
      const rows = 11;
      const rowsLower = -Math.floor(rows / 2);
      const rowsUpper = Math.ceil(rows / 2);
      const cols = 11;
      const colsLower = -Math.floor(cols / 2);
      const colsUpper = Math.ceil(cols / 2);
      const target = {
        position: {
          x: randomBetween(rowsLower + 2, rowsUpper - 2),
          y: randomBetween(colsLower + 2, colsUpper - 2)
        },
        target: true
      };
      world.create(target);
      for (let i = rowsLower; i < rowsUpper; i++) {
        for (let j = colsLower; j < colsUpper; j++) {
          const emoji = {
            position: {
              x: j,
              y: i
            },
            emoji: {
              revealed: false,
              dirty: false,
              domElement: document.createElement('div')
            }
          };
          world.create(emoji);
        }
      }
      return () => {
        world.reset();
      };
    };
    let destroyGame = setupGame();
    document.querySelector('#reset')!.addEventListener('click', () => {
      destroyGame();
      destroyGame = setupGame();
    });
    window.addEventListener('resize', () => {
      world.filter(entities => entities.with('emoji')).forEach(entity => {
        entity.emoji.dirty = true;
      });
    });
    const now = () => performance.now() / 1000;
    let running = true;
    let lastTime = now();
    const update = () => {
      if (!running) return;
      requestAnimationFrame(update);
      const time = now();
      const delta = time - lastTime;
      lastTime = time;
      world.step(delta);
    };
    update();
    return () => {
      running = false;
      world.reset();
    };
  });
  return <>
      <div id="emoji-sweeper">
        <p>
          Click the emojis to reveal them. Try to find the bomb in as few clicks
          as possible!
        </p>
        <div id="score"></div>
        <button id="reset">Reset</button>
        <div id="emojis"></div>
      </div>
    </>;
}`,...(S=(v=p.parameters)==null?void 0:v.docs)==null?void 0:S.source}}};const P=["FindTheBomb"];export{p as FindTheBomb,P as __namedExportsOrder,$ as default};
