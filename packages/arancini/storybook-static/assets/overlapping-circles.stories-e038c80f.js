var q=Object.defineProperty;var M=(e,i,t)=>i in e?q(e,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[i]=t;var d=(e,i,t)=>(M(e,typeof i!="symbol"?i+"":i,t),t);import{m as u,g as W,j as T}from"./index.es-6456b573.js";import{r as b}from"./index-76fb7be0.js";import"./_commonjsHelpers-de833af9.js";class g{constructor(){d(this,"x");d(this,"y");this.x=0,this.y=0}set(i,t){return this.x=i,this.y=t,this}copy(i){return this.x=i.x,this.y=i.y,this}clone(){return new g().set(this.x,this.y)}}function m(e,i){return Math.random()*(i-e)+e}function H(e,i){const t=i.position.x-e.position.x,r=i.position.y-e.position.y,s=Math.sqrt(r*r+t*t);if(s>e.radius+i.radius||s<Math.abs(e.radius-i.radius))return!1;const c=(e.radius*e.radius-i.radius*i.radius+s*s)/(2*s),l=e.position.x+t*c/s,o=e.position.y+r*c/s,n=Math.sqrt(e.radius*e.radius-c*c),a=-r*(n/s),h=t*(n/s),x=l+a,E=l-a,S=o+h,C=o-h;return[x,S,E,C]}function p(e,i,t,r){return e.beginPath(),e.arc(i,t,r,0,Math.PI*2,!1),e.fill(),this}function k(e,i,t,r,s){e.beginPath(),e.moveTo(i,t),e.lineTo(r,s),e.stroke()}class I extends u{constructor(){super(...arguments);d(this,"movingCircles",this.query(t=>t.with("movement","circle")));d(this,"context",this.singleton("canvas"))}onUpdate(t){let r=this.context.width,s=this.context.height,c=.5,l=this.movingCircles.entities;for(let o=0;o<l.length;o++){let{circle:n,movement:a}=l[o];n.position.x+=a.velocity.x*a.acceleration.x*t*c,n.position.y+=a.velocity.y*a.acceleration.y*t*c,a.acceleration.x>1&&(a.acceleration.x-=t*c),a.acceleration.y>1&&(a.acceleration.y-=t*c),a.acceleration.x<1&&(a.acceleration.x=1),a.acceleration.y<1&&(a.acceleration.y=1),n.position.y+n.radius<0&&(n.position.y=s+n.radius),n.position.y-n.radius>s&&(n.position.y=-n.radius),n.position.x-n.radius>r&&(n.position.x=0),n.position.x+n.radius<0&&(n.position.x=r)}}}class P extends u{constructor(){super(...arguments);d(this,"circles",this.query(t=>t.with("circle")))}onUpdate(){let t=this.circles.entities;for(let r=0;r<t.length;r++){let s=t[r];s.intersecting&&(s.intersecting.points.length=0);let{circle:c}=s;for(let l=r+1;l<t.length;l++){let o=t[l],{circle:n}=o;const a=H(c,n);a!==!1&&(s.intersecting||this.world.add(s,"intersecting",{points:[]}),s.intersecting.points.push(a))}s.intersecting&&s.intersecting.points.length===0&&this.world.remove(s,"intersecting")}}onDestroy(){let t=this.circles.entities;for(let r=0;r<t.length;r++){let s=t[r];s.intersecting&&(s.intersecting.points.length=0)}}}class j extends u{constructor(){super(...arguments);d(this,"circles",this.query(t=>t.with("circle")));d(this,"intersectingCircles",this.query(t=>t.with("intersecting")));d(this,"context",this.singleton("canvas"))}onUpdate(){const{ctx:t,width:r,height:s}=this.context;t.fillStyle="black",t.fillRect(0,0,r,r);let c=this.circles.entities;for(let o=0;o<c.length;o++){let{circle:n}=c[o];t.beginPath(),t.arc(n.position.x,n.position.y,n.radius,0,2*Math.PI,!1),t.lineWidth=1,t.strokeStyle="#fff",t.stroke()}let l=this.intersectingCircles.entities;for(let o=0;o<l.length;o++){let{intersecting:n}=l[o];for(let a=0;a<n.points.length;a++){const h=n.points[a];t.lineWidth=2,t.strokeStyle="#ff9",t.fillStyle="rgba(255, 255,255, 0.2)",p(t,h[0],h[1],8),p(t,h[2],h[3],8),t.fillStyle="#fff",p(t,h[0],h[1],3),p(t,h[2],h[3],3),k(t,h[0],h[1],h[2],h[3])}}}}const y=()=>(b.useEffect(()=>{const e=new W({components:["circle","movement","intersecting","canvas"]});e.registerSystem(I).registerSystem(j).registerSystem(P);const i=document.querySelector("#example-canvas");i.width=window.innerWidth,i.height=window.innerHeight;const t={canvas:{canvasElement:i,ctx:i.getContext("2d"),width:i.width,height:i.height}};e.create(t),window.addEventListener("resize",()=>{t.canvas.width=i.width=window.innerWidth,t.canvas.height=i.height=window.innerHeight},!1);for(let o=0;o<30;o++){const n={circle:{position:new g,radius:0},movement:{velocity:new g,acceleration:new g}};e.create(n),n.circle.position.set(m(0,t.canvas.width),m(0,t.canvas.height)),n.circle.radius=m(20,100),n.movement.velocity.set(m(-20,20),m(-20,20))}e.init();const r=()=>performance.now()/1e3;let s=!0,c=r();const l=()=>{if(!s)return;requestAnimationFrame(l);const o=r(),n=o-c;c=o,e.step(n)};return l(),()=>{s=!1,e.reset()}}),T("canvas",{id:"example-canvas"})),_={name:"Vanilla / Overlapping Circles",component:y};var v,w,f;y.parameters={...y.parameters,docs:{...(v=y.parameters)==null?void 0:v.docs,source:{originalSource:`() => {
  useEffect(() => {
    const world = new World<Entity>({
      components: ['circle', 'movement', 'intersecting', 'canvas']
    });
    world.registerSystem(MovementSystem).registerSystem(Renderer).registerSystem(IntersectionSystem);
    const canvasElement = (document.querySelector('#example-canvas') as HTMLCanvasElement);
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    const canvasEntity = {
      canvas: {
        canvasElement,
        ctx: canvasElement.getContext('2d')!,
        width: canvasElement.width,
        height: canvasElement.height
      }
    };
    world.create(canvasEntity);
    window.addEventListener('resize', () => {
      canvasEntity.canvas.width = canvasElement.width = window.innerWidth;
      canvasEntity.canvas.height = canvasElement.height = window.innerHeight;
    }, false);
    for (let i = 0; i < 30; i++) {
      const entity = {
        circle: {
          position: new Vector2(),
          radius: 0
        },
        movement: {
          velocity: new Vector2(),
          acceleration: new Vector2()
        }
      };
      world.create(entity);
      entity.circle.position.set(random(0, canvasEntity.canvas.width), random(0, canvasEntity.canvas.height));
      entity.circle.radius = random(20, 100);
      entity.movement.velocity.set(random(-20, 20), random(-20, 20));
    }
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
}`,...(f=(w=y.parameters)==null?void 0:w.docs)==null?void 0:f.source}}};const U=["MovementSystem","IntersectionSystem","Renderer","OverlappingCircles"];export{P as IntersectionSystem,I as MovementSystem,y as OverlappingCircles,j as Renderer,U as __namedExportsOrder,_ as default};
