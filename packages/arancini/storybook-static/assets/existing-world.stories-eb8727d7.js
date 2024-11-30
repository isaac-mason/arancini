import{g as Ee,j as E,F as We,a as je}from"./index.es-6456b573.js";import{a as Re,u as $e,D as Ce,V as z,O as oe,P as ae,b as Oe}from"./react-three-fiber.esm-dca5276d.js";import{r as n}from"./index-76fb7be0.js";import{R as Fe,L as He}from"./timeline-composer.esm-08db1a3e.js";import{S as Te}from"./setup-1d901612.js";import{_ as Ie}from"./extends-98964cd2.js";import{a as ze}from"./client-8a8da4b9.js";import"./_commonjsHelpers-de833af9.js";const $=new z,_=new z,Ae=new z;function Le(e,t,s){const i=$.setFromMatrixPosition(e.matrixWorld);i.project(t);const o=s.width/2,a=s.height/2;return[i.x*o+o,-(i.y*a)+a]}function Ve(e,t){const s=$.setFromMatrixPosition(e.matrixWorld),i=_.setFromMatrixPosition(t.matrixWorld),o=s.sub(i),a=t.getWorldDirection(Ae);return o.angleTo(a)>Math.PI/2}function De(e,t,s,i){const o=$.setFromMatrixPosition(e.matrixWorld),a=o.clone();a.project(t),s.setFromCamera(a,t);const x=s.intersectObjects(i,!0);if(x.length){const b=x[0].distance;return o.distanceTo(s.ray.origin)<b}return!0}function ke(e,t){if(t instanceof oe)return t.zoom;if(t instanceof ae){const s=$.setFromMatrixPosition(e.matrixWorld),i=_.setFromMatrixPosition(t.matrixWorld),o=t.fov*Math.PI/180,a=s.distanceTo(i);return 1/(2*Math.tan(o/2)*a)}else return 1}function _e(e,t,s){if(t instanceof ae||t instanceof oe){const i=$.setFromMatrixPosition(e.matrixWorld),o=_.setFromMatrixPosition(t.matrixWorld),a=i.distanceTo(o),x=(s[1]-s[0])/(t.far-t.near),b=s[1]-x*t.far;return Math.round(x*a+b)}}const k=e=>Math.abs(e)<1e-10?0:e;function ce(e,t,s=""){let i="matrix3d(";for(let o=0;o!==16;o++)i+=k(t[o]*e.elements[o])+(o!==15?",":")");return s+i}const Ne=(e=>t=>ce(t,e))([1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1]),Be=(e=>(t,s)=>ce(t,e(s),"translate(-50%,-50%)"))(e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1]);function Ze(e){return e&&typeof e=="object"&&"current"in e}const Ge=n.forwardRef(({children:e,eps:t=.001,style:s,className:i,prepend:o,center:a,fullscreen:x,portal:b,distanceFactor:W,sprite:le=!1,transform:h=!1,occlude:c,onOcclude:B,castShadow:ue,receiveShadow:de,material:fe,geometry:Z,zIndexRange:C=[16777271,0],calculatePosition:G=Le,as:me="div",wrapperClass:A,pointerEvents:q="auto",...p},J)=>{const{gl:K,camera:l,scene:Q,size:d,raycaster:he,events:xe,viewport:pe}=Re(),[u]=n.useState(()=>document.createElement(me)),L=n.useRef(),m=n.useRef(null),U=n.useRef(0),O=n.useRef([0,0]),j=n.useRef(null),V=n.useRef(null),S=(b==null?void 0:b.current)||xe.connected||K.domElement.parentNode,y=n.useRef(null),F=n.useRef(!1),H=n.useMemo(()=>c&&c!=="blending"||Array.isArray(c)&&c.length&&Ze(c[0]),[c]);n.useLayoutEffect(()=>{const f=K.domElement;c&&c==="blending"?(f.style.zIndex=`${Math.floor(C[0]/2)}`,f.style.position="absolute",f.style.pointerEvents="none"):(f.style.zIndex=null,f.style.position=null,f.style.pointerEvents=null)},[c]),n.useLayoutEffect(()=>{if(m.current){const f=L.current=ze(u);if(Q.updateMatrixWorld(),h)u.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{const r=G(m.current,l,d);u.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${r[0]}px,${r[1]}px,0);transform-origin:0 0;`}return S&&(o?S.prepend(u):S.appendChild(u)),()=>{S&&S.removeChild(u),f.unmount()}}},[S,h]),n.useLayoutEffect(()=>{A&&(u.className=A)},[A]);const X=n.useMemo(()=>h?{position:"absolute",top:0,left:0,width:d.width,height:d.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:a?"translate3d(-50%,-50%,0)":"none",...x&&{top:-d.height/2,left:-d.width/2,width:d.width,height:d.height},...s},[s,a,x,d,h]),ve=n.useMemo(()=>({position:"absolute",pointerEvents:q}),[q]);n.useLayoutEffect(()=>{if(F.current=!1,h){var f;(f=L.current)==null||f.render(n.createElement("div",{ref:j,style:X},n.createElement("div",{ref:V,style:ve},n.createElement("div",{ref:J,className:i,style:s,children:e}))))}else{var r;(r=L.current)==null||r.render(n.createElement("div",{ref:J,style:X,className:i,children:e}))}});const w=n.useRef(!0);$e(f=>{if(m.current){l.updateMatrixWorld(),m.current.updateWorldMatrix(!0,!1);const r=h?O.current:G(m.current,l,d);if(h||Math.abs(U.current-l.zoom)>t||Math.abs(O.current[0]-r[0])>t||Math.abs(O.current[1]-r[1])>t){const g=Ve(m.current,l);let v=!1;H&&(Array.isArray(c)?v=c.map(M=>M.current):c!=="blending"&&(v=[Q]));const R=w.current;if(v){const M=De(m.current,l,he,v);w.current=M&&!g}else w.current=!g;R!==w.current&&(B?B(!w.current):u.style.display=w.current?"block":"none");const T=Math.floor(C[0]/2),ye=c?H?[C[0],T]:[T-1,0]:C;if(u.style.zIndex=`${_e(m.current,l,ye)}`,h){const[M,ee]=[d.width/2,d.height/2],D=l.projectionMatrix.elements[5]*ee,{isOrthographicCamera:te,top:ge,left:Me,bottom:Pe,right:be}=l,Se=Ne(l.matrixWorldInverse),we=te?`scale(${D})translate(${k(-(be+Me)/2)}px,${k((ge+Pe)/2)}px)`:`translateZ(${D}px)`;let P=m.current.matrixWorld;le&&(P=l.matrixWorldInverse.clone().transpose().copyPosition(P).scale(m.current.scale),P.elements[3]=P.elements[7]=P.elements[11]=0,P.elements[15]=1),u.style.width=d.width+"px",u.style.height=d.height+"px",u.style.perspective=te?"":`${D}px`,j.current&&V.current&&(j.current.style.transform=`${we}${Se}translate(${M}px,${ee}px)`,V.current.style.transform=Be(P,1/((W||10)/400)))}else{const M=W===void 0?1:ke(m.current,l)*W;u.style.transform=`translate3d(${r[0]}px,${r[1]}px,0) scale(${M})`}O.current=r,U.current=l.zoom}}if(!H&&y.current&&!F.current)if(h){if(j.current){const r=j.current.children[0];if(r!=null&&r.clientWidth&&r!=null&&r.clientHeight){const{isOrthographicCamera:g}=l;if(g||Z)p.scale&&(Array.isArray(p.scale)?p.scale instanceof z?y.current.scale.copy(p.scale.clone().divideScalar(1)):y.current.scale.set(1/p.scale[0],1/p.scale[1],1/p.scale[2]):y.current.scale.setScalar(1/p.scale));else{const v=(W||10)/400,R=r.clientWidth*v,T=r.clientHeight*v;y.current.scale.set(R,T,1)}F.current=!0}}}else{const r=u.children[0];if(r!=null&&r.clientWidth&&r!=null&&r.clientHeight){const g=1/pe.factor,v=r.clientWidth*g,R=r.clientHeight*g;y.current.scale.set(v,R,1),F.current=!0}y.current.lookAt(f.camera.position)}});const Y=n.useMemo(()=>({vertexShader:h?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom" 
            is false. 
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;
            
            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[h]);return n.createElement("group",Ie({},p,{ref:m}),c&&!H&&n.createElement("mesh",{castShadow:ue,receiveShadow:de,ref:y},Z||n.createElement("planeGeometry",null),fe||n.createElement("shaderMaterial",{side:Ce,vertexShader:Y.vertexShader,fragmentShader:Y.fragmentShader})))}),tt={title:"React / Existing World"},N=new Ee;N.init();const{Entity:ne}=Oe(N),I=()=>{const[e,t]=n.useState("");return n.useEffect(()=>{const s=setInterval(()=>{const i=N.entities.length;t(`${i} ${i===1?"entity":"entities"}`)},.1);return()=>{clearInterval(s)}},[]),E(We,{children:je(Te,{cameraPosition:[0,0,20],children:[E(ne,{}),E(Fe,{seconds:4,children:E(He,{seconds:2,children:E(ne,{})})}),E(Ge,{style:{color:"white"},transform:!0,scale:3,children:e})]})})};var re,se,ie;I.parameters={...I.parameters,docs:{...(re=I.parameters)==null?void 0:re.docs,source:{originalSource:`() => {
  const [worldStats, setWorldStats] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      const n = world.entities.length;
      setWorldStats(\`\${n} \${n === 1 ? 'entity' : 'entities'}\`);
    }, 1 / 10);
    return () => {
      clearInterval(interval);
    };
  }, []);
  return <>
      <Setup cameraPosition={[0, 0, 20]}>
        <Entity />

        <Repeat seconds={4}>
          <Lifetime seconds={2}>
            <Entity />
          </Lifetime>
        </Repeat>

        <Html style={{
        color: 'white'
      }} transform scale={3}>
          {worldStats}
        </Html>
      </Setup>
    </>;
}`,...(ie=(se=I.parameters)==null?void 0:se.docs)==null?void 0:ie.source}}};const nt=["ExistingWorld"];export{I as ExistingWorld,nt as __namedExportsOrder,tt as default};
