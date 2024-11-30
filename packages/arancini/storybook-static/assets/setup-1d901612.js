import{j as B,a as Ae,F as Ge}from"./index.es-6456b573.js";import{R as Be,c as Qe,E as $e,V as y,M as V,T as F,Q as Le,P as Q,O as $,S as De,d as E,a as _,u as Je,C as et}from"./react-three-fiber.esm-dca5276d.js";import{r as I}from"./index-76fb7be0.js";import{_ as tt}from"./extends-98964cd2.js";var nt=Object.defineProperty,ot=(h,p,b)=>p in h?nt(h,p,{enumerable:!0,configurable:!0,writable:!0,value:b}):h[p]=b,o=(h,p,b)=>(ot(h,typeof p!="symbol"?p+"":p,b),b);const J=new Be,Ce=new Qe,at=Math.cos(70*(Math.PI/180)),Re=(h,p)=>(h%p+p)%p;let it=class extends $e{constructor(p,b){super(),o(this,"object"),o(this,"domElement"),o(this,"enabled",!0),o(this,"target",new y),o(this,"minDistance",0),o(this,"maxDistance",1/0),o(this,"minZoom",0),o(this,"maxZoom",1/0),o(this,"minPolarAngle",0),o(this,"maxPolarAngle",Math.PI),o(this,"minAzimuthAngle",-1/0),o(this,"maxAzimuthAngle",1/0),o(this,"enableDamping",!1),o(this,"dampingFactor",.05),o(this,"enableZoom",!0),o(this,"zoomSpeed",1),o(this,"enableRotate",!0),o(this,"rotateSpeed",1),o(this,"enablePan",!0),o(this,"panSpeed",1),o(this,"screenSpacePanning",!0),o(this,"keyPanSpeed",7),o(this,"zoomToCursor",!1),o(this,"autoRotate",!1),o(this,"autoRotateSpeed",2),o(this,"reverseOrbit",!1),o(this,"reverseHorizontalOrbit",!1),o(this,"reverseVerticalOrbit",!1),o(this,"keys",{LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"}),o(this,"mouseButtons",{LEFT:V.ROTATE,MIDDLE:V.DOLLY,RIGHT:V.PAN}),o(this,"touches",{ONE:F.ROTATE,TWO:F.DOLLY_PAN}),o(this,"target0"),o(this,"position0"),o(this,"zoom0"),o(this,"_domElementKeyEvents",null),o(this,"getPolarAngle"),o(this,"getAzimuthalAngle"),o(this,"setPolarAngle"),o(this,"setAzimuthalAngle"),o(this,"getDistance"),o(this,"listenToKeyEvents"),o(this,"stopListenToKeyEvents"),o(this,"saveState"),o(this,"reset"),o(this,"update"),o(this,"connect"),o(this,"dispose"),this.object=p,this.domElement=b,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>u.phi,this.getAzimuthalAngle=()=>u.theta,this.setPolarAngle=t=>{let n=Re(t,2*Math.PI),a=u.phi;a<0&&(a+=2*Math.PI),n<0&&(n+=2*Math.PI);let s=Math.abs(n-a);2*Math.PI-s<s&&(n<a?n+=2*Math.PI:a+=2*Math.PI),f.phi=n-a,e.update()},this.setAzimuthalAngle=t=>{let n=Re(t,2*Math.PI),a=u.theta;a<0&&(a+=2*Math.PI),n<0&&(n+=2*Math.PI);let s=Math.abs(n-a);2*Math.PI-s<s&&(n<a?n+=2*Math.PI:a+=2*Math.PI),f.theta=n-a,e.update()},this.getDistance=()=>e.object.position.distanceTo(e.target),this.listenToKeyEvents=t=>{t.addEventListener("keydown",ie),this._domElementKeyEvents=t},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener("keydown",ie),this._domElementKeyEvents=null},this.saveState=()=>{e.target0.copy(e.target),e.position0.copy(e.object.position),e.zoom0=e.object.zoom},this.reset=()=>{e.target.copy(e.target0),e.object.position.copy(e.position0),e.object.zoom=e.zoom0,e.object.updateProjectionMatrix(),e.dispatchEvent(k),e.update(),l=i.NONE},this.update=(()=>{const t=new y,n=new y(0,1,0),a=new Le().setFromUnitVectors(p.up,n),s=a.clone().invert(),m=new y,C=new Le,N=2*Math.PI;return function(){const je=e.object.position;a.setFromUnitVectors(p.up,n),s.copy(a).invert(),t.copy(je).sub(e.target),t.applyQuaternion(a),u.setFromVector3(t),e.autoRotate&&l===i.NONE&&ee(xe()),e.enableDamping?(u.theta+=f.theta*e.dampingFactor,u.phi+=f.phi*e.dampingFactor):(u.theta+=f.theta,u.phi+=f.phi);let R=e.minAzimuthAngle,S=e.maxAzimuthAngle;isFinite(R)&&isFinite(S)&&(R<-Math.PI?R+=N:R>Math.PI&&(R-=N),S<-Math.PI?S+=N:S>Math.PI&&(S-=N),R<=S?u.theta=Math.max(R,Math.min(S,u.theta)):u.theta=u.theta>(R+S)/2?Math.max(R,u.theta):Math.min(S,u.theta)),u.phi=Math.max(e.minPolarAngle,Math.min(e.maxPolarAngle,u.phi)),u.makeSafe(),e.enableDamping===!0?e.target.addScaledVector(x,e.dampingFactor):e.target.add(x),e.zoomToCursor&&v||e.object.isOrthographicCamera?u.radius=ne(u.radius):u.radius=ne(u.radius*O),t.setFromSpherical(u),t.applyQuaternion(s),je.copy(e.target).add(t),e.object.lookAt(e.target),e.enableDamping===!0?(f.theta*=1-e.dampingFactor,f.phi*=1-e.dampingFactor,x.multiplyScalar(1-e.dampingFactor)):(f.set(0,0,0),x.set(0,0,0));let W=!1;if(e.zoomToCursor&&v){let q=null;if(e.object instanceof Q&&e.object.isPerspectiveCamera){const U=t.length();q=ne(U*O);const G=U-q;e.object.position.addScaledVector(H,G),e.object.updateMatrixWorld()}else if(e.object.isOrthographicCamera){const U=new y(g.x,g.y,0);U.unproject(e.object),e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom/O)),e.object.updateProjectionMatrix(),W=!0;const G=new y(g.x,g.y,0);G.unproject(e.object),e.object.position.sub(G).add(U),e.object.updateMatrixWorld(),q=t.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),e.zoomToCursor=!1;q!==null&&(e.screenSpacePanning?e.target.set(0,0,-1).transformDirection(e.object.matrix).multiplyScalar(q).add(e.object.position):(J.origin.copy(e.object.position),J.direction.set(0,0,-1).transformDirection(e.object.matrix),Math.abs(e.object.up.dot(J.direction))<at?p.lookAt(e.target):(Ce.setFromNormalAndCoplanarPoint(e.object.up,e.target),J.intersectPlane(Ce,e.target))))}else e.object instanceof $&&e.object.isOrthographicCamera&&(e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom/O)),e.object.updateProjectionMatrix(),W=!0);return O=1,v=!1,W||m.distanceToSquared(e.object.position)>Z||8*(1-C.dot(e.object.quaternion))>Z?(e.dispatchEvent(k),m.copy(e.object.position),C.copy(e.object.quaternion),W=!1,!0):!1}})(),this.connect=t=>{t===document&&console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'),e.domElement=t,e.domElement.style.touchAction="none",e.domElement.addEventListener("contextmenu",Oe),e.domElement.addEventListener("pointerdown",Pe),e.domElement.addEventListener("pointercancel",Te),e.domElement.addEventListener("wheel",ve)},this.dispose=()=>{var t,n,a,s,m,C;(t=e.domElement)==null||t.removeEventListener("contextmenu",Oe),(n=e.domElement)==null||n.removeEventListener("pointerdown",Pe),(a=e.domElement)==null||a.removeEventListener("pointercancel",Te),(s=e.domElement)==null||s.removeEventListener("wheel",ve),(m=e.domElement)==null||m.ownerDocument.removeEventListener("pointermove",oe),(C=e.domElement)==null||C.ownerDocument.removeEventListener("pointerup",ae),e._domElementKeyEvents!==null&&e._domElementKeyEvents.removeEventListener("keydown",ie)};const e=this,k={type:"change"},P={type:"start"},z={type:"end"},i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let l=i.NONE;const Z=1e-6,u=new De,f=new De;let O=1;const x=new y,M=new E,w=new E,j=new E,A=new E,L=new E,D=new E,T=new E,d=new E,c=new E,H=new y,g=new E;let v=!1;const r=[],X={};function xe(){return 2*Math.PI/60/60*e.autoRotateSpeed}function K(){return Math.pow(.95,e.zoomSpeed)}function ee(t){e.reverseOrbit||e.reverseHorizontalOrbit?f.theta+=t:f.theta-=t}function re(t){e.reverseOrbit||e.reverseVerticalOrbit?f.phi+=t:f.phi-=t}const le=(()=>{const t=new y;return function(a,s){t.setFromMatrixColumn(s,0),t.multiplyScalar(-a),x.add(t)}})(),ce=(()=>{const t=new y;return function(a,s){e.screenSpacePanning===!0?t.setFromMatrixColumn(s,1):(t.setFromMatrixColumn(s,0),t.crossVectors(e.object.up,t)),t.multiplyScalar(a),x.add(t)}})(),Y=(()=>{const t=new y;return function(a,s){const m=e.domElement;if(m&&e.object instanceof Q&&e.object.isPerspectiveCamera){const C=e.object.position;t.copy(C).sub(e.target);let N=t.length();N*=Math.tan(e.object.fov/2*Math.PI/180),le(2*a*N/m.clientHeight,e.object.matrix),ce(2*s*N/m.clientHeight,e.object.matrix)}else m&&e.object instanceof $&&e.object.isOrthographicCamera?(le(a*(e.object.right-e.object.left)/e.object.zoom/m.clientWidth,e.object.matrix),ce(s*(e.object.top-e.object.bottom)/e.object.zoom/m.clientHeight,e.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),e.enablePan=!1)}})();function te(t){e.object instanceof Q&&e.object.isPerspectiveCamera||e.object instanceof $&&e.object.isOrthographicCamera?O/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),e.enableZoom=!1)}function ue(t){e.object instanceof Q&&e.object.isPerspectiveCamera||e.object instanceof $&&e.object.isOrthographicCamera?O*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),e.enableZoom=!1)}function de(t){if(!e.zoomToCursor||!e.domElement)return;v=!0;const n=e.domElement.getBoundingClientRect(),a=t.clientX-n.left,s=t.clientY-n.top,m=n.width,C=n.height;g.x=a/m*2-1,g.y=-(s/C)*2+1,H.set(g.x,g.y,1).unproject(e.object).sub(e.object.position).normalize()}function ne(t){return Math.max(e.minDistance,Math.min(e.maxDistance,t))}function pe(t){M.set(t.clientX,t.clientY)}function Ne(t){de(t),T.set(t.clientX,t.clientY)}function me(t){A.set(t.clientX,t.clientY)}function _e(t){w.set(t.clientX,t.clientY),j.subVectors(w,M).multiplyScalar(e.rotateSpeed);const n=e.domElement;n&&(ee(2*Math.PI*j.x/n.clientHeight),re(2*Math.PI*j.y/n.clientHeight)),M.copy(w),e.update()}function Ie(t){d.set(t.clientX,t.clientY),c.subVectors(d,T),c.y>0?te(K()):c.y<0&&ue(K()),T.copy(d),e.update()}function ke(t){L.set(t.clientX,t.clientY),D.subVectors(L,A).multiplyScalar(e.panSpeed),Y(D.x,D.y),A.copy(L),e.update()}function ze(t){de(t),t.deltaY<0?ue(K()):t.deltaY>0&&te(K()),e.update()}function Ye(t){let n=!1;switch(t.code){case e.keys.UP:Y(0,e.keyPanSpeed),n=!0;break;case e.keys.BOTTOM:Y(0,-e.keyPanSpeed),n=!0;break;case e.keys.LEFT:Y(e.keyPanSpeed,0),n=!0;break;case e.keys.RIGHT:Y(-e.keyPanSpeed,0),n=!0;break}n&&(t.preventDefault(),e.update())}function fe(){if(r.length==1)M.set(r[0].pageX,r[0].pageY);else{const t=.5*(r[0].pageX+r[1].pageX),n=.5*(r[0].pageY+r[1].pageY);M.set(t,n)}}function he(){if(r.length==1)A.set(r[0].pageX,r[0].pageY);else{const t=.5*(r[0].pageX+r[1].pageX),n=.5*(r[0].pageY+r[1].pageY);A.set(t,n)}}function be(){const t=r[0].pageX-r[1].pageX,n=r[0].pageY-r[1].pageY,a=Math.sqrt(t*t+n*n);T.set(0,a)}function Ve(){e.enableZoom&&be(),e.enablePan&&he()}function Fe(){e.enableZoom&&be(),e.enableRotate&&fe()}function ge(t){if(r.length==1)w.set(t.pageX,t.pageY);else{const a=se(t),s=.5*(t.pageX+a.x),m=.5*(t.pageY+a.y);w.set(s,m)}j.subVectors(w,M).multiplyScalar(e.rotateSpeed);const n=e.domElement;n&&(ee(2*Math.PI*j.x/n.clientHeight),re(2*Math.PI*j.y/n.clientHeight)),M.copy(w)}function ye(t){if(r.length==1)L.set(t.pageX,t.pageY);else{const n=se(t),a=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);L.set(a,s)}D.subVectors(L,A).multiplyScalar(e.panSpeed),Y(D.x,D.y),A.copy(L)}function Ee(t){const n=se(t),a=t.pageX-n.x,s=t.pageY-n.y,m=Math.sqrt(a*a+s*s);d.set(0,m),c.set(0,Math.pow(d.y/T.y,e.zoomSpeed)),te(c.y),T.copy(d)}function He(t){e.enableZoom&&Ee(t),e.enablePan&&ye(t)}function qe(t){e.enableZoom&&Ee(t),e.enableRotate&&ge(t)}function Pe(t){var n,a;e.enabled!==!1&&(r.length===0&&((n=e.domElement)==null||n.ownerDocument.addEventListener("pointermove",oe),(a=e.domElement)==null||a.ownerDocument.addEventListener("pointerup",ae)),We(t),t.pointerType==="touch"?Xe(t):Ue(t))}function oe(t){e.enabled!==!1&&(t.pointerType==="touch"?Ke(t):Ze(t))}function ae(t){var n,a,s;Me(t),r.length===0&&((n=e.domElement)==null||n.releasePointerCapture(t.pointerId),(a=e.domElement)==null||a.ownerDocument.removeEventListener("pointermove",oe),(s=e.domElement)==null||s.ownerDocument.removeEventListener("pointerup",ae)),e.dispatchEvent(z),l=i.NONE}function Te(t){Me(t)}function Ue(t){let n;switch(t.button){case 0:n=e.mouseButtons.LEFT;break;case 1:n=e.mouseButtons.MIDDLE;break;case 2:n=e.mouseButtons.RIGHT;break;default:n=-1}switch(n){case V.DOLLY:if(e.enableZoom===!1)return;Ne(t),l=i.DOLLY;break;case V.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){if(e.enablePan===!1)return;me(t),l=i.PAN}else{if(e.enableRotate===!1)return;pe(t),l=i.ROTATE}break;case V.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){if(e.enableRotate===!1)return;pe(t),l=i.ROTATE}else{if(e.enablePan===!1)return;me(t),l=i.PAN}break;default:l=i.NONE}l!==i.NONE&&e.dispatchEvent(P)}function Ze(t){if(e.enabled!==!1)switch(l){case i.ROTATE:if(e.enableRotate===!1)return;_e(t);break;case i.DOLLY:if(e.enableZoom===!1)return;Ie(t);break;case i.PAN:if(e.enablePan===!1)return;ke(t);break}}function ve(t){e.enabled===!1||e.enableZoom===!1||l!==i.NONE&&l!==i.ROTATE||(t.preventDefault(),e.dispatchEvent(P),ze(t),e.dispatchEvent(z))}function ie(t){e.enabled===!1||e.enablePan===!1||Ye(t)}function Xe(t){switch(we(t),r.length){case 1:switch(e.touches.ONE){case F.ROTATE:if(e.enableRotate===!1)return;fe(),l=i.TOUCH_ROTATE;break;case F.PAN:if(e.enablePan===!1)return;he(),l=i.TOUCH_PAN;break;default:l=i.NONE}break;case 2:switch(e.touches.TWO){case F.DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;Ve(),l=i.TOUCH_DOLLY_PAN;break;case F.DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;Fe(),l=i.TOUCH_DOLLY_ROTATE;break;default:l=i.NONE}break;default:l=i.NONE}l!==i.NONE&&e.dispatchEvent(P)}function Ke(t){switch(we(t),l){case i.TOUCH_ROTATE:if(e.enableRotate===!1)return;ge(t),e.update();break;case i.TOUCH_PAN:if(e.enablePan===!1)return;ye(t),e.update();break;case i.TOUCH_DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;He(t),e.update();break;case i.TOUCH_DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;qe(t),e.update();break;default:l=i.NONE}}function Oe(t){e.enabled!==!1&&t.preventDefault()}function We(t){r.push(t)}function Me(t){delete X[t.pointerId];for(let n=0;n<r.length;n++)if(r[n].pointerId==t.pointerId){r.splice(n,1);return}}function we(t){let n=X[t.pointerId];n===void 0&&(n=new E,X[t.pointerId]=n),n.set(t.pageX,t.pageY)}function se(t){const n=t.pointerId===r[0].pointerId?r[1]:r[0];return X[n.pointerId]}b!==void 0&&this.connect(b),this.update()}};const st=I.forwardRef(({makeDefault:h,camera:p,regress:b,domElement:e,enableDamping:k=!0,keyEvents:P=!1,onChange:z,onStart:i,onEnd:l,...Z},u)=>{const f=_(c=>c.invalidate),O=_(c=>c.camera),x=_(c=>c.gl),M=_(c=>c.events),w=_(c=>c.setEvents),j=_(c=>c.set),A=_(c=>c.get),L=_(c=>c.performance),D=p||O,T=e||M.connected||x.domElement,d=I.useMemo(()=>new it(D),[D]);return Je(()=>{d.enabled&&d.update()},-1),I.useEffect(()=>(P&&d.connect(P===!0?T:P),d.connect(T),()=>void d.dispose()),[P,T,b,d,f]),I.useEffect(()=>{const c=v=>{f(),b&&L.regress(),z&&z(v)},H=v=>{i&&i(v)},g=v=>{l&&l(v)};return d.addEventListener("change",c),d.addEventListener("start",H),d.addEventListener("end",g),()=>{d.removeEventListener("start",H),d.removeEventListener("end",g),d.removeEventListener("change",c)}},[z,i,l,d,f,w]),I.useEffect(()=>{if(h){const c=A().controls;return j({controls:d}),()=>j({controls:c})}},[h,d]),I.createElement("primitive",tt({ref:u,object:d,enableDamping:k},Z))}),Se=({children:h,cameraFov:p=75,cameraPosition:b=[-5,5,5],controls:e=!0,lights:k=!0,...P})=>B(et,{shadows:!0,camera:{position:b,fov:p},...P,children:Ae(I.StrictMode,{children:[h,k&&Ae(Ge,{children:[B("ambientLight",{intensity:.8}),B("pointLight",{intensity:1,position:[0,6,0]})]}),e&&B(st,{})]})});try{Se.displayName="Setup",Se.__docgenInfo={description:"",displayName:"Setup",props:{gl:{defaultValue:null,description:"A threejs renderer instance or props that go into the default renderer",name:"gl",required:!1,type:{name:"GLProps"}},shadows:{defaultValue:null,description:"Enables shadows (by default PCFsoft). Can accept `gl.shadowMap` options for fine-tuning,\nbut also strings: 'basic' | 'percentage' | 'soft' | 'variance'.\n@see https://threejs.org/docs/#api/en/renderers/WebGLRenderer.shadowMap",name:"shadows",required:!1,type:{name:'boolean | "basic" | "percentage" | "soft" | "variance" | Partial<WebGLShadowMap>'}},legacy:{defaultValue:null,description:`Disables three r139 color management.
@see https://threejs.org/docs/#manual/en/introduction/Color-management`,name:"legacy",required:!1,type:{name:"boolean"}},linear:{defaultValue:null,description:"Switch off automatic sRGB color space and gamma correction",name:"linear",required:!1,type:{name:"boolean"}},flat:{defaultValue:null,description:"Use `THREE.NoToneMapping` instead of `THREE.ACESFilmicToneMapping`",name:"flat",required:!1,type:{name:"boolean"}},orthographic:{defaultValue:null,description:"Creates an orthographic camera",name:"orthographic",required:!1,type:{name:"boolean"}},frameloop:{defaultValue:null,description:"R3F's render mode. Set to `demand` to only render on state change or `never` to take control.\n@see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#on-demand-rendering",name:"frameloop",required:!1,type:{name:"enum",value:[{value:'"always"'},{value:'"demand"'},{value:'"never"'}]}},performance:{defaultValue:null,description:`R3F performance options for adaptive performance.
@see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#movement-regression`,name:"performance",required:!1,type:{name:'Partial<Omit<Performance, "regress">>'}},dpr:{defaultValue:null,description:"Target pixel ratio. Can clamp between a range: `[min, max]`",name:"dpr",required:!1,type:{name:"Dpr"}},raycaster:{defaultValue:null,description:"Props that go into the default raycaster",name:"raycaster",required:!1,type:{name:"Partial<Raycaster>"}},scene:{defaultValue:null,description:"A `THREE.Scene` instance or props that go into the default scene",name:"scene",required:!1,type:{name:"Scene | Partial<Object3DNode<Scene, typeof Scene>>"}},camera:{defaultValue:null,description:"A `THREE.Camera` instance or props that go into the default camera",name:"camera",required:!1,type:{name:"((Camera | Partial<Omit<ExtendedColors<Overwrite<Partial<Camera>, NodeProps<Camera, typeof Camera>>>, NonFunctionKeys<...>> & { ...; } & EventHandlers & Omit<...> & Omit<...>>) & { ...; })"}},events:{defaultValue:null,description:"An R3F event manager to manage elements' pointer events",name:"events",required:!1,type:{name:"((store: UseBoundStore<RootState>) => EventManager<HTMLElement>)"}},onCreated:{defaultValue:null,description:"Callback after the canvas has rendered (but not yet committed)",name:"onCreated",required:!1,type:{name:"((state: RootState) => void)"}},onPointerMissed:{defaultValue:null,description:"Response for pointer clicks that have missed any target",name:"onPointerMissed",required:!1,type:{name:"((event: MouseEvent) => void)"}},cameraFov:{defaultValue:{value:"75"},description:"",name:"cameraFov",required:!1,type:{name:"number"}},cameraPosition:{defaultValue:{value:"[-5, 5, 5]"},description:"",name:"cameraPosition",required:!1,type:{name:"[number, number, number]"}},controls:{defaultValue:{value:"true"},description:"",name:"controls",required:!1,type:{name:"boolean"}},lights:{defaultValue:{value:"true"},description:"",name:"lights",required:!1,type:{name:"boolean"}}}}}catch{}export{st as O,Se as S};
