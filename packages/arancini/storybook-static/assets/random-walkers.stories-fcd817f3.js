var x=Object.defineProperty;var E=(t,n,e)=>n in t?x(t,n,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[n]=e;var r=(t,n,e)=>(E(t,typeof n!="symbol"?n+"":n,e),e);import{g as C,j as S,m as p}from"./index.es-6456b573.js";import{r as M}from"./index-76fb7be0.js";import"./_commonjsHelpers-de833af9.js";const u=10;class b extends p{constructor(){super(...arguments);r(this,"context",this.singleton("canvasContext"));r(this,"toDraw",this.query(e=>e.with("position").and.any("red","blue")))}onUpdate(){const{ctx:e,width:s,height:o}=this.context;e.clearRect(0,0,s,o);const m=s/2,h=o/2;for(const c of this.toDraw){const{position:{x:w,y:i}}=c,a=c.red?"red":"blue";e.fillStyle=a,e.fillRect(m+(w-u/2),h+(i-u/2),u,u)}}}const l=class l extends p{constructor(){super(...arguments);r(this,"walkers",this.query(e=>e.with("position")));r(this,"movementCountdown",l.timeBetweenMovements)}onUpdate(e){if(this.movementCountdown-=e,this.movementCountdown<=0){for(const s of this.walkers){const{position:o}=s;o.x=o.x+(Math.random()-.5)*3,o.y=o.y+(Math.random()-.5)*3}this.movementCountdown=l.timeBetweenMovements}}};r(l,"timeBetweenMovements",.05);let v=l;class W extends p{constructor(){super(...arguments);r(this,"walkers",this.query(e=>e.some("red","blue")))}onUpdate(){for(const e of this.walkers)Math.random()>=.95&&(e.blue?(this.world.remove(e,"blue"),this.world.add(e,"red",!0)):(this.world.remove(e,"red"),this.world.add(e,"blue",!0)))}}const d=()=>(M.useEffect(()=>{const t=new C({components:["position","red","blue","canvasContext"]});t.registerSystem(v),t.registerSystem(b),t.registerSystem(W);const n=100;for(let i=0;i<n;i++){const a={position:{x:(Math.random()-.5)*300,y:(Math.random()-.5)*300}};i%2===0?a.red=!0:a.blue=!0,t.create(a)}const e=document.querySelector("#example-canvas");e.width=window.innerWidth,e.height=window.innerHeight;const s={canvasContext:{ctx:e.getContext("2d"),width:e.width,height:e.height}};t.create(s);const o=()=>{s.canvasContext.width=e.width=window.innerWidth,s.canvasContext.height=e.height=window.innerHeight};window.addEventListener("resize",o,!1),o(),t.init();const m=()=>performance.now()/1e3;let h=!0,c=m();const w=()=>{if(!h)return;requestAnimationFrame(w);const i=m(),a=i-c;c=i,t.step(a)};return w(),()=>{h=!1,t.reset()}}),S("canvas",{id:"example-canvas"})),R={name:"Vanilla / Random Walkers",component:d};var y,g,f;d.parameters={...d.parameters,docs:{...(y=d.parameters)==null?void 0:y.docs,source:{originalSource:`() => {
  useEffect(() => {
    const world = new World<Entity>({
      components: ['position', 'red', 'blue', 'canvasContext']
    });
    world.registerSystem(WalkSystem);
    world.registerSystem(DrawSystem);
    world.registerSystem(FlipSystem);

    // how many entities to create
    const n = 100;

    // create entities in the World's default
    for (let i = 0; i < n; i++) {
      const entity: Entity = {
        position: {
          x: (Math.random() - 0.5) * 300,
          y: (Math.random() - 0.5) * 300
        }
      };
      if (i % 2 === 0) {
        entity.red = true;
      } else {
        entity.blue = true;
      }
      world.create(entity);
    }

    // create an entity with a component containing the canvas context
    const canvasElement = (document.querySelector('#example-canvas') as HTMLCanvasElement);
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    const canvasEntity = {
      canvasContext: {
        ctx: canvasElement.getContext('2d')!,
        width: canvasElement.width,
        height: canvasElement.height
      }
    };
    world.create(canvasEntity);

    // handle resizing
    const resize = () => {
      canvasEntity.canvasContext.width = canvasElement.width = window.innerWidth;
      canvasEntity.canvasContext.height = canvasElement.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, false);
    resize();
    world.init();
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
  return <canvas id="example-canvas" />;
}`,...(f=(g=d.parameters)==null?void 0:g.docs)==null?void 0:f.source}}};const T=["RandomColorChangingWalkers"];export{d as RandomColorChangingWalkers,T as __namedExportsOrder,R as default};
