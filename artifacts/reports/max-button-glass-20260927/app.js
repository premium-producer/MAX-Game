function yf(n,e,t,i,s,r,o={}){let a=1;for(let d of n)for(let f of n){let m=f.right-d.left,x=f.bottom-d.top;m>0&&(a=Math.min(a,(e.right-e.left-d.padLeft-f.padRight)/m)),x>0&&(a=Math.min(a,(e.bottom-e.top-d.padTop-f.padBottom)/x))}a=Math.max(.001,a);let c=-1/0,l=1/0,u=-1/0,h=1/0;for(let d of n)c=Math.max(c,e.left-(t/2+(d.left-t/2)*a-d.padLeft)),l=Math.min(l,e.right-(t/2+(d.right-t/2)*a+d.padRight)),u=Math.max(u,e.top-(i/2+(d.top-i/2)*a-d.padTop)),h=Math.min(h,e.bottom-(i/2+(d.bottom-i/2)*a+d.padBottom));return o.zoom=a,o.x=Math.max(c,Math.min(l,s)),o.y=Math.max(u,Math.min(h,r)),o}function vf(n,e,{moved:t=!1,cancelled:i=!1,item:s,rect:r}={}){return!!(n&&s&&n.item===s&&Uu(n,e,{moved:t,cancelled:i,rect:r}))}function Uu(n,e,{moved:t=!1,cancelled:i=!1,rect:s}={}){return!!(n&&!i&&!t&&!n.swiped&&!n.multitouch&&n.pointerId===e.pointerId&&e.button===0&&Math.hypot(e.clientX-n.x,e.clientY-n.y)<=(n.slopPx??8)&&e.clientX>=s.left&&e.clientX<=s.right&&e.clientY>=s.top&&e.clientY<=s.bottom)}var _f=Object.freeze({fieldScale:1,objectScale:1,showRangeCircle:!0,sizes:Object.freeze({})}),zs=_f;function bf(n={},e={}){let t=r=>r&&typeof r=="object"&&!Array.isArray(r),i=(r,o)=>{if(typeof r!="number"||!Number.isFinite(r)||r<.1||r>5)throw new Error(`${o}: \u0443\u043A\u0430\u0436\u0438 \u0447\u0438\u0441\u043B\u043E \u043E\u0442 0.1 \u0434\u043E 5`);return r};if(!t(n)||Object.keys(n).some(r=>!["fieldScale","objectScale","showRangeCircle","sizes"].includes(r)))throw new Error("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0440\u0430\u043A\u0443\u0440\u0441\u0430: \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u043F\u043E\u043B\u044F");if(n.showRangeCircle!==void 0&&typeof n.showRangeCircle!="boolean")throw new Error("\u041A\u0440\u0443\u0433 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0439 \u0434\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438: \u0432\u044B\u0431\u0435\u0440\u0438 \u043F\u043E\u043A\u0430\u0437 \u0438\u043B\u0438 \u0441\u043A\u0440\u044B\u0442\u0438\u0435");let s=n.sizes??{};if(!t(s))throw new Error("\u0420\u0430\u0437\u043C\u0435\u0440\u044B \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432 \u0440\u0430\u043A\u0443\u0440\u0441\u0430: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u044A\u0435\u043A\u0442");for(let[r,o]of Object.entries(s)){if(!Object.hasOwn(e,r)&&!["endpoint:A","endpoint:B"].includes(r))throw new Error(`\u0420\u0430\u0437\u043C\u0435\u0440\u044B \u0440\u0430\u043A\u0443\u0440\u0441\u0430: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043E\u0431\u044A\u0435\u043A\u0442 ${r}`);i(o,`\u0420\u0430\u0437\u043C\u0435\u0440 ${r}`)}return{showRangeCircle:n.showRangeCircle??!0,fieldScale:i(n.fieldScale??1,"\u041F\u043E\u043B\u0435 \u0441\u0432\u044F\u0437\u0438"),objectScale:i(n.objectScale??1,"\u0420\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432"),sizes:{...s}}}function Sf(n=_f){zs=n}function Fu(n,e,t){return e*(t?zs.objectScale*(zs.sizes[n]??1):1)}function Ou(n,e){return n*(e?zs.fieldScale:1)}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */var ap=0,Mh=1,lp=2;var da=1,cp=2,$r=3,ji=0,xn=1,Ft=2,Fn=0,ti=1,mn=2,Eh=3,wh=4,up=5;var ys=100,hp=101,dp=102,fp=103,pp=104,mp=200,gp=201,xp=202,yp=203,El=204,wl=205,vp=206,_p=207,bp=208,Sp=209,Mp=210,Ep=211,wp=212,Tp=213,Ap=214,Tl=0,Al=1,Cl=2,qs=3,Rl=4,Pl=5,Il=6,Ll=7,Th=0,Cp=1,Rp=2,qn=0,fa=1,pa=2,ma=3,ga=4,xa=5,ya=6,va=7;var Ah=300,Ts=301,Ks=302,oc=303,ac=304,_a=306,Yi=1e3,Dn=1001,Lr=1002,pn=1003,Pp=1004;var ba=1005;var qt=1006,lc=1007;var gi=1008;var $n=1009,Ch=1010,Rh=1011,jr=1012,cc=1013,xi=1014,yi=1015,on=1016,uc=1017,hc=1018,Yr=1020,Ph=35902,Ih=35899,Lh=1021,Dh=1022,oi=1023,Ai=1026,As=1027,Zr=1028,dc=1029,Cs=1030,fc=1031;var pc=1033,Sa=33776,Ma=33777,Ea=33778,wa=33779,mc=35840,gc=35841,xc=35842,yc=35843,vc=36196,_c=37492,bc=37496,Sc=37488,Mc=37489,Ta=37490,Ec=37491,wc=37808,Tc=37809,Ac=37810,Cc=37811,Rc=37812,Pc=37813,Ic=37814,Lc=37815,Dc=37816,Nc=37817,Uc=37818,Fc=37819,Oc=37820,Bc=37821,zc=36492,Hc=36494,kc=36495,Vc=36283,Gc=36284,Aa=36285,Wc=36286;var No=2300,Dl=2301,Ml=2302,uh=2303,hh=2400,dh=2401,fh=2402;var Ip=3200;var Nh=0,Lp=1,yn="",fn="srgb",Uo="srgb-linear",Fo="linear",wt="srgb";var Ws=7680;var ph=519,Dp=512,Np=513,Up=514,Xc=515,Fp=516,Op=517,qc=518,Bp=519,Nl=35044,$c=35048;var Uh="300 es",pi=2e3,Oo=2001;function u0(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function h0(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function Dr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function zp(){let n=Dr("canvas");return n.style.display="block",n}var Mf={},Nr=null;function Bo(...n){let e="THREE."+n.shift();Nr?Nr("log",e,...n):console.log(e,...n)}function Hp(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function tt(...n){n=Hp(n);let e="THREE."+n.shift();if(Nr)Nr("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function at(...n){n=Hp(n);let e="THREE."+n.shift();if(Nr)Nr("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Xs(...n){let e=n.join(" ");e in Mf||(Mf[e]=!0,tt(...n))}function kp(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}var Vp={[Tl]:Al,[Cl]:Il,[Rl]:Ll,[qs]:Pl,[Al]:Tl,[Il]:Cl,[Ll]:Rl,[Pl]:qs},Ci=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Sn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ef=1234567,Po=Math.PI/180,Ur=180/Math.PI;function Ti(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Sn[n&255]+Sn[n>>8&255]+Sn[n>>16&255]+Sn[n>>24&255]+"-"+Sn[e&255]+Sn[e>>8&255]+"-"+Sn[e>>16&15|64]+Sn[e>>24&255]+"-"+Sn[t&63|128]+Sn[t>>8&255]+"-"+Sn[t>>16&255]+Sn[t>>24&255]+Sn[i&255]+Sn[i>>8&255]+Sn[i>>16&255]+Sn[i>>24&255]).toLowerCase()}function ht(n,e,t){return Math.max(e,Math.min(t,n))}function Fh(n,e){return(n%e+e)%e}function d0(n,e,t,i,s){return i+(n-e)*(s-i)/(t-e)}function f0(n,e,t){return n!==e?(t-n)/(e-n):0}function Io(n,e,t){return(1-t)*n+t*e}function p0(n,e,t,i){return Io(n,e,1-Math.exp(-t*i))}function m0(n,e=1){return e-Math.abs(Fh(n,e*2)-e)}function g0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function x0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function y0(n,e){return n+Math.floor(Math.random()*(e-n+1))}function v0(n,e){return n+Math.random()*(e-n)}function _0(n){return n*(.5-Math.random())}function b0(n){n!==void 0&&(Ef=n);let e=Ef+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function S0(n){return n*Po}function M0(n){return n*Ur}function E0(n){return(n&n-1)===0&&n!==0}function w0(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function T0(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function A0(n,e,t,i,s){let r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+i)/2),u=o((e+i)/2),h=r((e-i)/2),d=o((e-i)/2),f=r((i-e)/2),m=o((i-e)/2);switch(s){case"XYX":n.set(a*u,c*h,c*d,a*l);break;case"YZY":n.set(c*d,a*u,c*h,a*l);break;case"ZXZ":n.set(c*h,c*d,a*u,a*l);break;case"XZX":n.set(a*u,c*m,c*f,a*l);break;case"YXY":n.set(c*f,a*u,c*m,a*l);break;case"ZYZ":n.set(c*m,c*f,a*u,a*l);break;default:tt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function fi(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function It(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ne={DEG2RAD:Po,RAD2DEG:Ur,generateUUID:Ti,clamp:ht,euclideanModulo:Fh,mapLinear:d0,inverseLerp:f0,lerp:Io,damp:p0,pingpong:m0,smoothstep:g0,smootherstep:x0,randInt:y0,randFloat:v0,randFloatSpread:_0,seededRandom:b0,degToRad:S0,radToDeg:M0,isPowerOfTwo:E0,ceilPowerOfTwo:w0,floorPowerOfTwo:T0,setQuaternionFromProperEuler:A0,normalize:It,denormalize:fi},Vh=class Vh{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ht(this.x,e.x,t.x),this.y=ht(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ht(this.x,e,t),this.y=ht(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ht(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ht(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Vh.prototype.isVector2=!0;var xe=Vh,Nn=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let c=i[s+0],l=i[s+1],u=i[s+2],h=i[s+3],d=r[o+0],f=r[o+1],m=r[o+2],x=r[o+3];if(h!==x||c!==d||l!==f||u!==m){let g=c*d+l*f+u*m+h*x;g<0&&(d=-d,f=-f,m=-m,x=-x,g=-g);let p=1-a;if(g<.9995){let M=Math.acos(g),E=Math.sin(M);p=Math.sin(p*M)/E,a=Math.sin(a*M)/E,c=c*p+d*a,l=l*p+f*a,u=u*p+m*a,h=h*p+x*a}else{c=c*p+d*a,l=l*p+f*a,u=u*p+m*a,h=h*p+x*a;let M=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=M,l*=M,u*=M,h*=M}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],c=i[s+1],l=i[s+2],u=i[s+3],h=r[o],d=r[o+1],f=r[o+2],m=r[o+3];return e[t]=a*m+u*h+c*f-l*d,e[t+1]=c*m+u*d+l*h-a*f,e[t+2]=l*m+u*f+a*d-c*h,e[t+3]=u*m-a*h-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(i/2),u=a(s/2),h=a(r/2),d=c(i/2),f=c(s/2),m=c(r/2);switch(o){case"XYZ":this._x=d*u*h+l*f*m,this._y=l*f*h-d*u*m,this._z=l*u*m+d*f*h,this._w=l*u*h-d*f*m;break;case"YXZ":this._x=d*u*h+l*f*m,this._y=l*f*h-d*u*m,this._z=l*u*m-d*f*h,this._w=l*u*h+d*f*m;break;case"ZXY":this._x=d*u*h-l*f*m,this._y=l*f*h+d*u*m,this._z=l*u*m+d*f*h,this._w=l*u*h-d*f*m;break;case"ZYX":this._x=d*u*h-l*f*m,this._y=l*f*h+d*u*m,this._z=l*u*m-d*f*h,this._w=l*u*h+d*f*m;break;case"YZX":this._x=d*u*h+l*f*m,this._y=l*f*h+d*u*m,this._z=l*u*m-d*f*h,this._w=l*u*h-d*f*m;break;case"XZY":this._x=d*u*h-l*f*m,this._y=l*f*h-d*u*m,this._z=l*u*m+d*f*h,this._w=l*u*h+d*f*m;break;default:tt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],d=i+a+h;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-c)*f,this._y=(r-l)*f,this._z=(o-s)*f}else if(i>a&&i>h){let f=2*Math.sqrt(1+i-a-h);this._w=(u-c)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+l)/f}else if(a>h){let f=2*Math.sqrt(1+a-i-h);this._w=(r-l)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(c+u)/f}else{let f=2*Math.sqrt(1+h-i-a);this._w=(o-s)/f,this._x=(r+l)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ht(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=i*u+o*a+s*l-r*c,this._y=s*u+o*c+r*a-i*l,this._z=r*u+o*l+i*c-s*a,this._w=o*u-i*a-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=this.dot(e);a<0&&(i=-i,s=-s,r=-r,o=-o,a=-a);let c=1-t;if(a<.9995){let l=Math.acos(a),u=Math.sin(l);c=Math.sin(c*l)/u,t=Math.sin(t*l)/u,this._x=this._x*c+i*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+o*t,this._onChangeCallback()}else this._x=this._x*c+i*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Gh=class Gh{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(wf.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(wf.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*s-a*i),u=2*(a*t-r*s),h=2*(r*i-o*t);return this.x=t+c*l+o*h-a*u,this.y=i+c*u+a*l-r*h,this.z=s+c*h+r*u-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ht(this.x,e.x,t.x),this.y=ht(this.y,e.y,t.y),this.z=ht(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ht(this.x,e,t),this.y=ht(this.y,e,t),this.z=ht(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ht(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=s*c-r*a,this.y=r*o-i*c,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Bu.copy(this).projectOnVector(e),this.sub(Bu)}reflect(e){return this.sub(Bu.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ht(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Gh.prototype.isVector3=!0;var I=Gh,Bu=new I,wf=new Nn,Wh=class Wh{constructor(e,t,i,s,r,o,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,c,l)}set(e,t,i,s,r,o,a,c,l){let u=this.elements;return u[0]=e,u[1]=s,u[2]=a,u[3]=t,u[4]=r,u[5]=c,u[6]=i,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],c=i[6],l=i[1],u=i[4],h=i[7],d=i[2],f=i[5],m=i[8],x=s[0],g=s[3],p=s[6],M=s[1],E=s[4],v=s[7],A=s[2],C=s[5],N=s[8];return r[0]=o*x+a*M+c*A,r[3]=o*g+a*E+c*C,r[6]=o*p+a*v+c*N,r[1]=l*x+u*M+h*A,r[4]=l*g+u*E+h*C,r[7]=l*p+u*v+h*N,r[2]=d*x+f*M+m*A,r[5]=d*g+f*E+m*C,r[8]=d*p+f*v+m*N,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-i*r*u+i*a*c+s*r*l-s*o*c}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,d=a*c-u*r,f=l*r-o*c,m=t*h+i*d+s*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/m;return e[0]=h*x,e[1]=(s*l-u*i)*x,e[2]=(a*i-s*o)*x,e[3]=d*x,e[4]=(u*t-s*c)*x,e[5]=(s*r-a*t)*x,e[6]=f*x,e[7]=(i*c-l*t)*x,e[8]=(o*t-i*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(i*c,i*l,-i*(c*o+l*a)+o+e,-s*l,s*c,-s*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return Xs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(zu.makeScale(e,t)),this}rotate(e){return Xs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(zu.makeRotation(-e)),this}translate(e,t){return Xs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(zu.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Wh.prototype.isMatrix3=!0;var nt=Wh,zu=new nt,Tf=new nt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Af=new nt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function C0(){let n={enabled:!0,workingColorSpace:Uo,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===wt&&(s.r=qi(s.r),s.g=qi(s.g),s.b=qi(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===wt&&(s.r=Pr(s.r),s.g=Pr(s.g),s.b=Pr(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===yn?Fo:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Xs("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Xs("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Uo]:{primaries:e,whitePoint:i,transfer:Fo,toXYZ:Tf,fromXYZ:Af,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:fn},outputColorSpaceConfig:{drawingBufferColorSpace:fn}},[fn]:{primaries:e,whitePoint:i,transfer:wt,toXYZ:Tf,fromXYZ:Af,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:fn}}}),n}var yt=C0();function qi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Pr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var mr,Ul=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{mr===void 0&&(mr=Dr("canvas")),mr.width=e.width,mr.height=e.height;let s=mr.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=mr}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Dr("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=qi(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(qi(t[i]/255)*255):t[i]=qi(t[i]);return{data:t,width:e.width,height:e.height}}else return tt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},R0=0,Fr=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:R0++}),this.uuid=Ti(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Hu(s[o].image)):r.push(Hu(s[o]))}else r=Hu(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function Hu(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ul.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(tt("Texture: Unable to serialize Texture."),{})}var P0=0,ku=new I,rn=class n extends Ci{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Dn,s=Dn,r=qt,o=gi,a=oi,c=$n,l=n.DEFAULT_ANISOTROPY,u=yn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:P0++}),this.uuid=Ti(),this.name="",this.source=new Fr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new xe(0,0),this.repeat=new xe(1,1),this.center=new xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new nt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ku).x}get height(){return this.source.getSize(ku).y}get depth(){return this.source.getSize(ku).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){tt(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){tt(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ah)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Yi:e.x=e.x-Math.floor(e.x);break;case Dn:e.x=e.x<0?0:1;break;case Lr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Yi:e.y=e.y-Math.floor(e.y);break;case Dn:e.y=e.y<0?0:1;break;case Lr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};rn.DEFAULT_IMAGE=null;rn.DEFAULT_MAPPING=Ah;rn.DEFAULT_ANISOTROPY=1;var Xh=class Xh{constructor(e=0,t=0,i=0,s=1){this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,c=e.elements,l=c[0],u=c[4],h=c[8],d=c[1],f=c[5],m=c[9],x=c[2],g=c[6],p=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-x)<.01&&Math.abs(m-g)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+x)<.1&&Math.abs(m+g)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(l+1)/2,v=(f+1)/2,A=(p+1)/2,C=(u+d)/4,N=(h+x)/4,_=(m+g)/4;return E>v&&E>A?E<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(E),s=C/i,r=N/i):v>A?v<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),i=C/s,r=_/s):A<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(A),i=N/r,s=_/r),this.set(i,s,r,t),this}let M=Math.sqrt((g-m)*(g-m)+(h-x)*(h-x)+(d-u)*(d-u));return Math.abs(M)<.001&&(M=1),this.x=(g-m)/M,this.y=(h-x)/M,this.z=(d-u)/M,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ht(this.x,e.x,t.x),this.y=ht(this.y,e.y,t.y),this.z=ht(this.z,e.z,t.z),this.w=ht(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ht(this.x,e,t),this.y=ht(this.y,e,t),this.z=ht(this.z,e,t),this.w=ht(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ht(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Xh.prototype.isVector4=!0;var Lt=Xh,Fl=class extends Ci{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:qt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new Lt(0,0,e,t),this.scissorTest=!1,this.viewport=new Lt(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:i.depth},r=new rn(s),o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:qt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Fr(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Zt=class extends Fl{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},zo=class extends rn{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=pn,this.minFilter=pn,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ol=class extends rn{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=pn,this.minFilter=pn,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var rc=class rc{constructor(e,t,i,s,r,o,a,c,l,u,h,d,f,m,x,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,c,l,u,h,d,f,m,x,g)}set(e,t,i,s,r,o,a,c,l,u,h,d,f,m,x,g){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=m,p[11]=x,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new rc().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,s=1/gr.setFromMatrixColumn(e,0).length(),r=1/gr.setFromMatrixColumn(e,1).length(),o=1/gr.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),c=Math.cos(s),l=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){let d=o*u,f=o*h,m=a*u,x=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=f+m*l,t[5]=d-x*l,t[9]=-a*c,t[2]=x-d*l,t[6]=m+f*l,t[10]=o*c}else if(e.order==="YXZ"){let d=c*u,f=c*h,m=l*u,x=l*h;t[0]=d+x*a,t[4]=m*a-f,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=f*a-m,t[6]=x+d*a,t[10]=o*c}else if(e.order==="ZXY"){let d=c*u,f=c*h,m=l*u,x=l*h;t[0]=d-x*a,t[4]=-o*h,t[8]=m+f*a,t[1]=f+m*a,t[5]=o*u,t[9]=x-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let d=o*u,f=o*h,m=a*u,x=a*h;t[0]=c*u,t[4]=m*l-f,t[8]=d*l+x,t[1]=c*h,t[5]=x*l+d,t[9]=f*l-m,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*l,m=a*c,x=a*l;t[0]=c*u,t[4]=x-d*h,t[8]=m*h+f,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=f*h+m,t[10]=d-x*h}else if(e.order==="XZY"){let d=o*c,f=o*l,m=a*c,x=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=d*h+x,t[5]=o*u,t[9]=f*h-m,t[2]=m*h-f,t[6]=a*u,t[10]=x*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(I0,e,L0)}lookAt(e,t,i){let s=this.elements;return kn.subVectors(e,t),kn.lengthSq()===0&&(kn.z=1),kn.normalize(),hs.crossVectors(i,kn),hs.lengthSq()===0&&(Math.abs(i.z)===1?kn.x+=1e-4:kn.z+=1e-4,kn.normalize(),hs.crossVectors(i,kn)),hs.normalize(),Za.crossVectors(kn,hs),s[0]=hs.x,s[4]=Za.x,s[8]=kn.x,s[1]=hs.y,s[5]=Za.y,s[9]=kn.y,s[2]=hs.z,s[6]=Za.z,s[10]=kn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],c=i[8],l=i[12],u=i[1],h=i[5],d=i[9],f=i[13],m=i[2],x=i[6],g=i[10],p=i[14],M=i[3],E=i[7],v=i[11],A=i[15],C=s[0],N=s[4],_=s[8],w=s[12],V=s[1],k=s[5],T=s[9],D=s[13],ee=s[2],j=s[6],G=s[10],X=s[14],Y=s[3],me=s[7],ae=s[11],Te=s[15];return r[0]=o*C+a*V+c*ee+l*Y,r[4]=o*N+a*k+c*j+l*me,r[8]=o*_+a*T+c*G+l*ae,r[12]=o*w+a*D+c*X+l*Te,r[1]=u*C+h*V+d*ee+f*Y,r[5]=u*N+h*k+d*j+f*me,r[9]=u*_+h*T+d*G+f*ae,r[13]=u*w+h*D+d*X+f*Te,r[2]=m*C+x*V+g*ee+p*Y,r[6]=m*N+x*k+g*j+p*me,r[10]=m*_+x*T+g*G+p*ae,r[14]=m*w+x*D+g*X+p*Te,r[3]=M*C+E*V+v*ee+A*Y,r[7]=M*N+E*k+v*j+A*me,r[11]=M*_+E*T+v*G+A*ae,r[15]=M*w+E*D+v*X+A*Te,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],d=e[10],f=e[14],m=e[3],x=e[7],g=e[11],p=e[15],M=c*f-l*d,E=a*f-l*h,v=a*d-c*h,A=o*f-l*u,C=o*d-c*u,N=o*h-a*u;return t*(x*M-g*E+p*v)-i*(m*M-g*A+p*C)+s*(m*E-x*A+p*N)-r*(m*v-x*C+g*N)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[1],o=e[5],a=e[9],c=e[2],l=e[6],u=e[10];return t*(o*u-a*l)-i*(r*u-a*c)+s*(r*l-o*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],d=e[10],f=e[11],m=e[12],x=e[13],g=e[14],p=e[15],M=t*a-i*o,E=t*c-s*o,v=t*l-r*o,A=i*c-s*a,C=i*l-r*a,N=s*l-r*c,_=u*x-h*m,w=u*g-d*m,V=u*p-f*m,k=h*g-d*x,T=h*p-f*x,D=d*p-f*g,ee=M*D-E*T+v*k+A*V-C*w+N*_;if(ee===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let j=1/ee;return e[0]=(a*D-c*T+l*k)*j,e[1]=(s*T-i*D-r*k)*j,e[2]=(x*N-g*C+p*A)*j,e[3]=(d*C-h*N-f*A)*j,e[4]=(c*V-o*D-l*w)*j,e[5]=(t*D-s*V+r*w)*j,e[6]=(g*v-m*N-p*E)*j,e[7]=(u*N-d*v+f*E)*j,e[8]=(o*T-a*V+l*_)*j,e[9]=(i*V-t*T-r*_)*j,e[10]=(m*C-x*v+p*M)*j,e[11]=(h*v-u*C-f*M)*j,e[12]=(a*w-o*k-c*_)*j,e[13]=(t*k-i*w+s*_)*j,e[14]=(x*E-m*A-g*M)*j,e[15]=(u*A-h*E+d*M)*j,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,c=e.z,l=r*o,u=r*a;return this.set(l*o+i,l*a-s*c,l*c+s*a,0,l*a+s*c,u*a+i,u*c-s*o,0,l*c-s*a,u*c+s*o,r*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,u=o+o,h=a+a,d=r*l,f=r*u,m=r*h,x=o*u,g=o*h,p=a*h,M=c*l,E=c*u,v=c*h,A=i.x,C=i.y,N=i.z;return s[0]=(1-(x+p))*A,s[1]=(f+v)*A,s[2]=(m-E)*A,s[3]=0,s[4]=(f-v)*C,s[5]=(1-(d+p))*C,s[6]=(g+M)*C,s[7]=0,s[8]=(m+E)*N,s[9]=(g-M)*N,s[10]=(1-(d+x))*N,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return i.set(1,1,1),t.identity(),this;let o=gr.set(s[0],s[1],s[2]).length(),a=gr.set(s[4],s[5],s[6]).length(),c=gr.set(s[8],s[9],s[10]).length();r<0&&(o=-o),ui.copy(this);let l=1/o,u=1/a,h=1/c;return ui.elements[0]*=l,ui.elements[1]*=l,ui.elements[2]*=l,ui.elements[4]*=u,ui.elements[5]*=u,ui.elements[6]*=u,ui.elements[8]*=h,ui.elements[9]*=h,ui.elements[10]*=h,t.setFromRotationMatrix(ui),i.x=o,i.y=a,i.z=c,this}makePerspective(e,t,i,s,r,o,a=pi,c=!1){let l=this.elements,u=2*r/(t-e),h=2*r/(i-s),d=(t+e)/(t-e),f=(i+s)/(i-s),m,x;if(c)m=r/(o-r),x=o*r/(o-r);else if(a===pi)m=-(o+r)/(o-r),x=-2*o*r/(o-r);else if(a===Oo)m=-o/(o-r),x=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=pi,c=!1){let l=this.elements,u=2/(t-e),h=2/(i-s),d=-(t+e)/(t-e),f=-(i+s)/(i-s),m,x;if(c)m=1/(o-r),x=o/(o-r);else if(a===pi)m=-2/(o-r),x=-(o+r)/(o-r);else if(a===Oo)m=-1/(o-r),x=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=h,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=m,l[14]=x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};rc.prototype.isMatrix4=!0;var zt=rc,gr=new I,ui=new zt,I0=new I(0,0,0),L0=new I(1,1,1),hs=new I,Za=new I,kn=new I,Cf=new zt,Rf=new Nn,ni=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(ht(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ht(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(ht(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-ht(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ht(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-ht(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:tt("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Cf.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Cf,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Rf.setFromEuler(this),this.setFromQuaternion(Rf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ni.DEFAULT_ORDER="XYZ";var Or=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},D0=0,Pf=new I,xr=new Nn,Hi=new zt,Ja=new I,Eo=new I,N0=new I,U0=new Nn,If=new I(1,0,0),Lf=new I(0,1,0),Df=new I(0,0,1),Nf={type:"added"},F0={type:"removed"},yr={type:"childadded",child:null},Vu={type:"childremoved",child:null},Un=class n extends Ci{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:D0++}),this.uuid=Ti(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new I,t=new ni,i=new Nn,s=new I(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new zt},normalMatrix:{value:new nt}}),this.matrix=new zt,this.matrixWorld=new zt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Or,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return xr.setFromAxisAngle(e,t),this.quaternion.multiply(xr),this}rotateOnWorldAxis(e,t){return xr.setFromAxisAngle(e,t),this.quaternion.premultiply(xr),this}rotateX(e){return this.rotateOnAxis(If,e)}rotateY(e){return this.rotateOnAxis(Lf,e)}rotateZ(e){return this.rotateOnAxis(Df,e)}translateOnAxis(e,t){return Pf.copy(e).applyQuaternion(this.quaternion),this.position.add(Pf.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(If,e)}translateY(e){return this.translateOnAxis(Lf,e)}translateZ(e){return this.translateOnAxis(Df,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Hi.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ja.copy(e):Ja.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Eo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Hi.lookAt(Eo,Ja,this.up):Hi.lookAt(Ja,Eo,this.up),this.quaternion.setFromRotationMatrix(Hi),s&&(Hi.extractRotation(s.matrixWorld),xr.setFromRotationMatrix(Hi),this.quaternion.premultiply(xr.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(at("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Nf),yr.child=e,this.dispatchEvent(yr),yr.child=null):at("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(F0),Vu.child=e,this.dispatchEvent(Vu),Vu.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Hi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Hi.multiply(e.parent.matrixWorld)),e.applyMatrix4(Hi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Nf),yr.child=e,this.dispatchEvent(yr),yr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Eo,e,N0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Eo,U0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*i-r[8]*s,r[13]+=i-r[1]*t-r[5]*i-r[9]*s,r[14]+=s-r[2]*t-r[6]*i-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){let h=c[l];r(e.shapes,h)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),f=o(e.animations),m=o(e.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),m.length>0&&(i.nodes=m)}return i.object=s,i;function o(a){let c=[];for(let l in a){let u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};Un.DEFAULT_UP=new I(0,1,0);Un.DEFAULT_MATRIX_AUTO_UPDATE=!0;Un.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Xt=class extends Un{constructor(){super(),this.isGroup=!0,this.type="Group"}},O0={type:"move"},Br=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Xt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Xt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Xt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let x of e.hand.values()){let g=t.getJointPose(x,i),p=this._getHandJoint(l,x);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,m=.005;l.inputState.pinching&&d>f+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(O0)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Xt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Gp={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ds={h:0,s:0,l:0},Ka={h:0,s:0,l:0};function Gu(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ye=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=fn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,yt.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=yt.workingColorSpace){return this.r=e,this.g=t,this.b=i,yt.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=yt.workingColorSpace){if(e=Fh(e,1),t=ht(t,0,1),i=ht(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Gu(o,r,e+1/3),this.g=Gu(o,r,e),this.b=Gu(o,r,e-1/3)}return yt.colorSpaceToWorking(this,s),this}setStyle(e,t=fn){function i(r){r!==void 0&&parseFloat(r)<1&&tt("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:tt("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);tt("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=fn){let i=Gp[e.toLowerCase()];return i!==void 0?this.setHex(i,t):tt("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=qi(e.r),this.g=qi(e.g),this.b=qi(e.b),this}copyLinearToSRGB(e){return this.r=Pr(e.r),this.g=Pr(e.g),this.b=Pr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=fn){return yt.workingToColorSpace(Mn.copy(this),e),Math.round(ht(Mn.r*255,0,255))*65536+Math.round(ht(Mn.g*255,0,255))*256+Math.round(ht(Mn.b*255,0,255))}getHexString(e=fn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=yt.workingColorSpace){yt.workingToColorSpace(Mn.copy(this),t);let i=Mn.r,s=Mn.g,r=Mn.b,o=Math.max(i,s,r),a=Math.min(i,s,r),c,l,u=(a+o)/2;if(a===o)c=0,l=0;else{let h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case i:c=(s-r)/h+(s<r?6:0);break;case s:c=(r-i)/h+2;break;case r:c=(i-s)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=yt.workingColorSpace){return yt.workingToColorSpace(Mn.copy(this),t),e.r=Mn.r,e.g=Mn.g,e.b=Mn.b,e}getStyle(e=fn){yt.workingToColorSpace(Mn.copy(this),e);let t=Mn.r,i=Mn.g,s=Mn.b;return e!==fn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(ds),this.setHSL(ds.h+e,ds.s+t,ds.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ds),e.getHSL(Ka);let i=Io(ds.h,Ka.h,t),s=Io(ds.s,Ka.s,t),r=Io(ds.l,Ka.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Mn=new Ye;Ye.NAMES=Gp;var Zi=class extends Un{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ni,this.environmentIntensity=1,this.environmentRotation=new ni,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},hi=new I,ki=new I,Wu=new I,Vi=new I,vr=new I,_r=new I,Uf=new I,Xu=new I,qu=new I,$u=new I,ju=new Lt,Yu=new Lt,Zu=new Lt,xs=class n{constructor(e=new I,t=new I,i=new I){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),hi.subVectors(e,t),s.cross(hi);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){hi.subVectors(s,t),ki.subVectors(i,t),Wu.subVectors(e,t);let o=hi.dot(hi),a=hi.dot(ki),c=hi.dot(Wu),l=ki.dot(ki),u=ki.dot(Wu),h=o*l-a*a;if(h===0)return r.set(0,0,0),null;let d=1/h,f=(l*c-a*u)*d,m=(o*u-a*c)*d;return r.set(1-f-m,m,f)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,Vi)===null?!1:Vi.x>=0&&Vi.y>=0&&Vi.x+Vi.y<=1}static getInterpolation(e,t,i,s,r,o,a,c){return this.getBarycoord(e,t,i,s,Vi)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Vi.x),c.addScaledVector(o,Vi.y),c.addScaledVector(a,Vi.z),c)}static getInterpolatedAttribute(e,t,i,s,r,o){return ju.setScalar(0),Yu.setScalar(0),Zu.setScalar(0),ju.fromBufferAttribute(e,t),Yu.fromBufferAttribute(e,i),Zu.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(ju,r.x),o.addScaledVector(Yu,r.y),o.addScaledVector(Zu,r.z),o}static isFrontFacing(e,t,i,s){return hi.subVectors(i,t),ki.subVectors(e,t),hi.cross(ki).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return hi.subVectors(this.c,this.b),ki.subVectors(this.a,this.b),hi.cross(ki).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;vr.subVectors(s,i),_r.subVectors(r,i),Xu.subVectors(e,i);let c=vr.dot(Xu),l=_r.dot(Xu);if(c<=0&&l<=0)return t.copy(i);qu.subVectors(e,s);let u=vr.dot(qu),h=_r.dot(qu);if(u>=0&&h<=u)return t.copy(s);let d=c*h-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(i).addScaledVector(vr,o);$u.subVectors(e,r);let f=vr.dot($u),m=_r.dot($u);if(m>=0&&f<=m)return t.copy(r);let x=f*l-c*m;if(x<=0&&l>=0&&m<=0)return a=l/(l-m),t.copy(i).addScaledVector(_r,a);let g=u*m-f*h;if(g<=0&&h-u>=0&&f-m>=0)return Uf.subVectors(r,s),a=(h-u)/(h-u+(f-m)),t.copy(s).addScaledVector(Uf,a);let p=1/(g+x+d);return o=x*p,a=d*p,t.copy(i).addScaledVector(vr,o).addScaledVector(_r,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Gn=class{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(di.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(di.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=di.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,di):di.fromBufferAttribute(r,o),di.applyMatrix4(e.matrixWorld),this.expandByPoint(di);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Qa.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Qa.copy(i.boundingBox)),Qa.applyMatrix4(e.matrixWorld),this.union(Qa)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,di),di.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(wo),el.subVectors(this.max,wo),br.subVectors(e.a,wo),Sr.subVectors(e.b,wo),Mr.subVectors(e.c,wo),fs.subVectors(Sr,br),ps.subVectors(Mr,Sr),Hs.subVectors(br,Mr);let t=[0,-fs.z,fs.y,0,-ps.z,ps.y,0,-Hs.z,Hs.y,fs.z,0,-fs.x,ps.z,0,-ps.x,Hs.z,0,-Hs.x,-fs.y,fs.x,0,-ps.y,ps.x,0,-Hs.y,Hs.x,0];return!Ju(t,br,Sr,Mr,el)||(t=[1,0,0,0,1,0,0,0,1],!Ju(t,br,Sr,Mr,el))?!1:(tl.crossVectors(fs,ps),t=[tl.x,tl.y,tl.z],Ju(t,br,Sr,Mr,el))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,di).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(di).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Gi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Gi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Gi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Gi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Gi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Gi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Gi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Gi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Gi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Gi=[new I,new I,new I,new I,new I,new I,new I,new I],di=new I,Qa=new Gn,br=new I,Sr=new I,Mr=new I,fs=new I,ps=new I,Hs=new I,wo=new I,el=new I,tl=new I,ks=new I;function Ju(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){ks.fromArray(n,r);let a=s.x*Math.abs(ks.x)+s.y*Math.abs(ks.y)+s.z*Math.abs(ks.z),c=e.dot(ks),l=t.dot(ks),u=i.dot(ks);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var tn=new I,nl=new xe,B0=0,en=class extends Ci{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:B0++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Nl,this.updateRanges=[],this.gpuType=yi,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)nl.fromBufferAttribute(this,t),nl.applyMatrix3(e),this.setXY(t,nl.x,nl.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)tn.fromBufferAttribute(this,t),tn.applyMatrix3(e),this.setXYZ(t,tn.x,tn.y,tn.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)tn.fromBufferAttribute(this,t),tn.applyMatrix4(e),this.setXYZ(t,tn.x,tn.y,tn.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)tn.fromBufferAttribute(this,t),tn.applyNormalMatrix(e),this.setXYZ(t,tn.x,tn.y,tn.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)tn.fromBufferAttribute(this,t),tn.transformDirection(e),this.setXYZ(t,tn.x,tn.y,tn.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=fi(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=It(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=fi(t,this.array)),t}setX(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=fi(t,this.array)),t}setY(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=fi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=fi(t,this.array)),t}setW(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),i=It(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),i=It(i,this.array),s=It(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),i=It(i,this.array),s=It(s,this.array),r=It(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Nl&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var Ho=class extends en{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var ko=class extends en{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var vt=class extends en{constructor(e,t,i){super(new Float32Array(e),t,i)}},z0=new Gn,To=new I,Ku=new I,ii=class{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):z0.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;To.subVectors(e,this.center);let t=To.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(To,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ku.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(To.copy(e.center).add(Ku)),this.expandByPoint(To.copy(e.center).sub(Ku))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},H0=0,Qn=new zt,Qu=new Un,Er=new I,Vn=new Gn,Ao=new Gn,dn=new I,Tt=class n extends Ci{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:H0++}),this.uuid=Ti(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(u0(e)?ko:Ho)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new nt().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Qn.makeRotationFromQuaternion(e),this.applyMatrix4(Qn),this}rotateX(e){return Qn.makeRotationX(e),this.applyMatrix4(Qn),this}rotateY(e){return Qn.makeRotationY(e),this.applyMatrix4(Qn),this}rotateZ(e){return Qn.makeRotationZ(e),this.applyMatrix4(Qn),this}translate(e,t,i){return Qn.makeTranslation(e,t,i),this.applyMatrix4(Qn),this}scale(e,t,i){return Qn.makeScale(e,t,i),this.applyMatrix4(Qn),this}lookAt(e){return Qu.lookAt(e),Qu.updateMatrix(),this.applyMatrix4(Qu.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Er).negate(),this.translate(Er.x,Er.y,Er.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new vt(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&tt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Gn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){at("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];Vn.setFromBufferAttribute(r),this.morphTargetsRelative?(dn.addVectors(this.boundingBox.min,Vn.min),this.boundingBox.expandByPoint(dn),dn.addVectors(this.boundingBox.max,Vn.max),this.boundingBox.expandByPoint(dn)):(this.boundingBox.expandByPoint(Vn.min),this.boundingBox.expandByPoint(Vn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&at('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ii);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){at("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){let i=this.boundingSphere.center;if(Vn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Ao.setFromBufferAttribute(a),this.morphTargetsRelative?(dn.addVectors(Vn.min,Ao.min),Vn.expandByPoint(dn),dn.addVectors(Vn.max,Ao.max),Vn.expandByPoint(dn)):(Vn.expandByPoint(Ao.min),Vn.expandByPoint(Ao.max))}Vn.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)dn.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(dn));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)dn.fromBufferAttribute(a,l),c&&(Er.fromBufferAttribute(e,l),dn.add(Er)),s=Math.max(s,i.distanceToSquared(dn))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&at('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){at("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new en(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));let a=[],c=[];for(let _=0;_<i.count;_++)a[_]=new I,c[_]=new I;let l=new I,u=new I,h=new I,d=new xe,f=new xe,m=new xe,x=new I,g=new I;function p(_,w,V){l.fromBufferAttribute(i,_),u.fromBufferAttribute(i,w),h.fromBufferAttribute(i,V),d.fromBufferAttribute(r,_),f.fromBufferAttribute(r,w),m.fromBufferAttribute(r,V),u.sub(l),h.sub(l),f.sub(d),m.sub(d);let k=1/(f.x*m.y-m.x*f.y);isFinite(k)&&(x.copy(u).multiplyScalar(m.y).addScaledVector(h,-f.y).multiplyScalar(k),g.copy(h).multiplyScalar(f.x).addScaledVector(u,-m.x).multiplyScalar(k),a[_].add(x),a[w].add(x),a[V].add(x),c[_].add(g),c[w].add(g),c[V].add(g))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let _=0,w=M.length;_<w;++_){let V=M[_],k=V.start,T=V.count;for(let D=k,ee=k+T;D<ee;D+=3)p(e.getX(D+0),e.getX(D+1),e.getX(D+2))}let E=new I,v=new I,A=new I,C=new I;function N(_){A.fromBufferAttribute(s,_),C.copy(A);let w=a[_];E.copy(w),E.sub(A.multiplyScalar(A.dot(w))).normalize(),v.crossVectors(C,w);let k=v.dot(c[_])<0?-1:1;o.setXYZW(_,E.x,E.y,E.z,k)}for(let _=0,w=M.length;_<w;++_){let V=M[_],k=V.start,T=V.count;for(let D=k,ee=k+T;D<ee;D+=3)N(e.getX(D+0)),N(e.getX(D+1)),N(e.getX(D+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new en(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let s=new I,r=new I,o=new I,a=new I,c=new I,l=new I,u=new I,h=new I;if(e)for(let d=0,f=e.count;d<f;d+=3){let m=e.getX(d+0),x=e.getX(d+1),g=e.getX(d+2);s.fromBufferAttribute(t,m),r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,g),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(i,m),c.fromBufferAttribute(i,x),l.fromBufferAttribute(i,g),a.add(u),c.add(u),l.add(u),i.setXYZ(m,a.x,a.y,a.z),i.setXYZ(x,c.x,c.y,c.z),i.setXYZ(g,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)dn.fromBufferAttribute(e,t),dn.normalize(),e.setXYZ(t,dn.x,dn.y,dn.z)}toNonIndexed(){function e(a,c){let l=a.array,u=a.itemSize,h=a.normalized,d=new l.constructor(c.length*u),f=0,m=0;for(let x=0,g=c.length;x<g;x++){a.isInterleavedBufferAttribute?f=c[x]*a.data.stride+a.offset:f=c[x]*u;for(let p=0;p<u;p++)d[m++]=l[f++]}return new en(d,u,h)}if(this.index===null)return tt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let c=s[a],l=e(c,i);t.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let u=0,h=l.length;u<h;u++){let d=l[u],f=e(d,i);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let c in i){let l=i[c];e.data.attributes[c]=l.toJSON(e.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],u=[];for(let h=0,d=l.length;h<d;h++){let f=l[h];u.push(f.toJSON(e.data))}u.length>0&&(s[c]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let l in s){let u=s[l];this.setAttribute(l,u.clone(t))}let r=e.morphAttributes;for(let l in r){let u=[],h=r[l];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,u=o.length;l<u;l++){let h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},Vo=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Nl,this.updateRanges=[],this.version=0,this.uuid=Ti()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[i+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ti()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ti()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},An=new I,si=class n{constructor(e,t,i,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)An.fromBufferAttribute(this,t),An.applyMatrix4(e),this.setXYZ(t,An.x,An.y,An.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)An.fromBufferAttribute(this,t),An.applyNormalMatrix(e),this.setXYZ(t,An.x,An.y,An.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)An.fromBufferAttribute(this,t),An.transformDirection(e),this.setXYZ(t,An.x,An.y,An.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=fi(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=It(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=It(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=It(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=It(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=It(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=fi(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=fi(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=fi(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=fi(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=It(t,this.array),i=It(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=It(t,this.array),i=It(i,this.array),s=It(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=It(t,this.array),i=It(i,this.array),s=It(s,this.array),r=It(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){Bo("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new en(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Bo("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},k0=0,Ji=class extends Ci{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:k0++}),this.uuid=Ti(),this.name="",this.type="Material",this.blending=ti,this.side=ji,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=El,this.blendDst=wl,this.blendEquation=ys,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ye(0,0,0),this.blendAlpha=0,this.depthFunc=qs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ph,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ws,this.stencilZFail=Ws,this.stencilZPass=Ws,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){tt(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){tt(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ti&&(i.blending=this.blending),this.side!==ji&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==El&&(i.blendSrc=this.blendSrc),this.blendDst!==wl&&(i.blendDst=this.blendDst),this.blendEquation!==ys&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==qs&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ph&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ws&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ws&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ws&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ye().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new xe().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new xe().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var Wi=new I,eh=new I,il=new I,ms=new I,th=new I,sl=new I,nh=new I,Ki=class{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Wi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Wi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Wi.copy(this.origin).addScaledVector(this.direction,t),Wi.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){eh.copy(e).add(t).multiplyScalar(.5),il.copy(t).sub(e).normalize(),ms.copy(this.origin).sub(eh);let r=e.distanceTo(t)*.5,o=-this.direction.dot(il),a=ms.dot(this.direction),c=-ms.dot(il),l=ms.lengthSq(),u=Math.abs(1-o*o),h,d,f,m;if(u>0)if(h=o*c-a,d=o*a-c,m=r*u,h>=0)if(d>=-m)if(d<=m){let x=1/u;h*=x,d*=x,f=h*(h+o*d+2*a)+d*(o*h+d+2*c)+l}else d=r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d=-r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d<=-m?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l):d<=m?(h=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(eh).addScaledVector(il,d),f}intersectSphere(e,t){Wi.subVectors(e.center,this.origin);let i=Wi.dot(this.direction),s=Wi.dot(Wi)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,c=i+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,c,l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return l>=0?(i=(e.min.x-d.x)*l,s=(e.max.x-d.x)*l):(i=(e.max.x-d.x)*l,s=(e.min.x-d.x)*l),u>=0?(r=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(r=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(e.min.z-d.z)*h,c=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,c=(e.min.z-d.z)*h),i>c||a>s)||((a>i||i!==i)&&(i=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,Wi)!==null}intersectTriangle(e,t,i,s,r){th.subVectors(t,e),sl.subVectors(i,e),nh.crossVectors(th,sl);let o=this.direction.dot(nh),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ms.subVectors(this.origin,e);let c=a*this.direction.dot(sl.crossVectors(ms,sl));if(c<0)return null;let l=a*this.direction.dot(th.cross(ms));if(l<0||c+l>o)return null;let u=-a*ms.dot(nh);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ut=class extends Ji{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ye(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ni,this.combine=Th,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Ff=new zt,Vs=new Ki,rl=new ii,Of=new I,ol=new I,al=new I,ll=new I,ih=new I,cl=new I,Bf=new I,ul=new I,ft=class extends Un{constructor(e=new Tt,t=new Ut){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){cl.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let u=a[c],h=r[c];u!==0&&(ih.fromBufferAttribute(h,e),o?cl.addScaledVector(ih,u):cl.addScaledVector(ih.sub(t),u))}t.add(cl)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),rl.copy(i.boundingSphere),rl.applyMatrix4(r),Vs.copy(e.ray).recast(e.near),!(rl.containsPoint(Vs.origin)===!1&&(Vs.intersectSphere(rl,Of)===null||Vs.origin.distanceToSquared(Of)>(e.far-e.near)**2))&&(Ff.copy(r).invert(),Vs.copy(e.ray).applyMatrix4(Ff),!(i.boundingBox!==null&&Vs.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Vs)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,x=d.length;m<x;m++){let g=d[m],p=o[g.materialIndex],M=Math.max(g.start,f.start),E=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let v=M,A=E;v<A;v+=3){let C=a.getX(v),N=a.getX(v+1),_=a.getX(v+2);s=hl(this,p,e,i,l,u,h,C,N,_),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let m=Math.max(0,f.start),x=Math.min(a.count,f.start+f.count);for(let g=m,p=x;g<p;g+=3){let M=a.getX(g),E=a.getX(g+1),v=a.getX(g+2);s=hl(this,o,e,i,l,u,h,M,E,v),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,x=d.length;m<x;m++){let g=d[m],p=o[g.materialIndex],M=Math.max(g.start,f.start),E=Math.min(c.count,Math.min(g.start+g.count,f.start+f.count));for(let v=M,A=E;v<A;v+=3){let C=v,N=v+1,_=v+2;s=hl(this,p,e,i,l,u,h,C,N,_),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let m=Math.max(0,f.start),x=Math.min(c.count,f.start+f.count);for(let g=m,p=x;g<p;g+=3){let M=g,E=g+1,v=g+2;s=hl(this,o,e,i,l,u,h,M,E,v),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function V0(n,e,t,i,s,r,o,a){let c;if(e.side===xn?c=i.intersectTriangle(o,r,s,!0,a):c=i.intersectTriangle(s,r,o,e.side===ji,a),c===null)return null;ul.copy(a),ul.applyMatrix4(n.matrixWorld);let l=t.ray.origin.distanceTo(ul);return l<t.near||l>t.far?null:{distance:l,point:ul.clone(),object:n}}function hl(n,e,t,i,s,r,o,a,c,l){n.getVertexPosition(a,ol),n.getVertexPosition(c,al),n.getVertexPosition(l,ll);let u=V0(n,e,t,i,ol,al,ll,Bf);if(u){let h=new I;xs.getBarycoord(Bf,ol,al,ll,h),s&&(u.uv=xs.getInterpolatedAttribute(s,a,c,l,h,new xe)),r&&(u.uv1=xs.getInterpolatedAttribute(r,a,c,l,h,new xe)),o&&(u.normal=xs.getInterpolatedAttribute(o,a,c,l,h,new I),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let d={a,b:c,c:l,normal:new I,materialIndex:0};xs.getNormal(ol,al,ll,d.normal),u.face=d,u.barycoord=h}return u}var $s=class extends rn{constructor(e=null,t=1,i=1,s,r,o,a,c,l=pn,u=pn,h,d){super(null,o,a,c,l,u,s,r,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var sh=new I,G0=new I,W0=new nt,ei=class{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=sh.subVectors(i,t).cross(G0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let s=e.delta(sh),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let o=-(e.start.dot(this.normal)+this.constant)/r;return i===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(s,o)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||W0.getNormalMatrix(e),s=this.coplanarPoint(sh).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Gs=new ii,X0=new xe(.5,.5),dl=new I,Go=class{constructor(e=new ei,t=new ei,i=new ei,s=new ei,r=new ei,o=new ei){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=pi,i=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],c=r[2],l=r[3],u=r[4],h=r[5],d=r[6],f=r[7],m=r[8],x=r[9],g=r[10],p=r[11],M=r[12],E=r[13],v=r[14],A=r[15];if(s[0].setComponents(l-o,f-u,p-m,A-M).normalize(),s[1].setComponents(l+o,f+u,p+m,A+M).normalize(),s[2].setComponents(l+a,f+h,p+x,A+E).normalize(),s[3].setComponents(l-a,f-h,p-x,A-E).normalize(),i)s[4].setComponents(c,d,g,v).normalize(),s[5].setComponents(l-c,f-d,p-g,A-v).normalize();else if(s[4].setComponents(l-c,f-d,p-g,A-v).normalize(),t===pi)s[5].setComponents(l+c,f+d,p+g,A+v).normalize();else if(t===Oo)s[5].setComponents(c,d,g,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Gs.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Gs.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Gs)}intersectsSprite(e){Gs.center.set(0,0,0);let t=X0.distanceTo(e.center);return Gs.radius=.7071067811865476+t,Gs.applyMatrix4(e.matrixWorld),this.intersectsSphere(Gs)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(dl.x=s.normal.x>0?e.max.x:e.min.x,dl.y=s.normal.y>0?e.max.y:e.min.y,dl.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(dl)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Qi=class extends Ji{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ye(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Bl=new I,zl=new I,zf=new zt,Co=new Ki,fl=new ii,rh=new I,Hf=new I,vs=class extends Un{constructor(e=new Tt,t=new Qi){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)Bl.fromBufferAttribute(t,s-1),zl.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=Bl.distanceTo(zl);e.setAttribute("lineDistance",new vt(i,1))}else tt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),fl.copy(i.boundingSphere),fl.applyMatrix4(s),fl.radius+=r,e.ray.intersectsSphere(fl)===!1)return;zf.copy(s).invert(),Co.copy(e.ray).applyMatrix4(zf);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,u=i.index,d=i.attributes.position;if(u!==null){let f=Math.max(0,o.start),m=Math.min(u.count,o.start+o.count);for(let x=f,g=m-1;x<g;x+=l){let p=u.getX(x),M=u.getX(x+1),E=pl(this,e,Co,c,p,M,x);E&&t.push(E)}if(this.isLineLoop){let x=u.getX(m-1),g=u.getX(f),p=pl(this,e,Co,c,x,g,m-1);p&&t.push(p)}}else{let f=Math.max(0,o.start),m=Math.min(d.count,o.start+o.count);for(let x=f,g=m-1;x<g;x+=l){let p=pl(this,e,Co,c,x,x+1,x);p&&t.push(p)}if(this.isLineLoop){let x=pl(this,e,Co,c,m-1,f,m-1);x&&t.push(x)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function pl(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(Bl.fromBufferAttribute(a,s),zl.fromBufferAttribute(a,r),t.distanceSqToSegment(Bl,zl,rh,Hf)>i)return;rh.applyMatrix4(n.matrixWorld);let l=e.ray.origin.distanceTo(rh);if(!(l<e.near||l>e.far))return{distance:l,point:Hf.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var kf=new I,Vf=new I,Wo=class extends vs{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)kf.fromBufferAttribute(t,s),Vf.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+kf.distanceTo(Vf);e.setAttribute("lineDistance",new vt(i,1))}else tt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var zr=class extends Ji{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ye(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Gf=new zt,mh=new Ki,ml=new ii,gl=new I,Hr=class extends Un{constructor(e=new Tt,t=new zr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ml.copy(i.boundingSphere),ml.applyMatrix4(s),ml.radius+=r,e.ray.intersectsSphere(ml)===!1)return;Gf.copy(s).invert(),mh.copy(e.ray).applyMatrix4(Gf);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=i.index,h=i.attributes.position;if(l!==null){let d=Math.max(0,o.start),f=Math.min(l.count,o.start+o.count);for(let m=d,x=f;m<x;m++){let g=l.getX(m);gl.fromBufferAttribute(h,g),Wf(gl,g,c,s,e,t,this)}}else{let d=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let m=d,x=f;m<x;m++)gl.fromBufferAttribute(h,m),Wf(gl,m,c,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Wf(n,e,t,i,s,r,o){let a=mh.distanceSqToPoint(n);if(a<t){let c=new I;mh.closestPointToPoint(n,c),c.applyMatrix4(i);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var Xo=class extends rn{constructor(e=[],t=Ts,i,s,r,o,a,c,l,u){super(e,t,i,s,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},qo=class extends rn{constructor(e,t,i,s,r,o,a,c,l){super(e,t,i,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}};var es=class extends rn{constructor(e,t,i=xi,s,r,o,a=pn,c=pn,l,u=Ai,h=1){if(u!==Ai&&u!==As)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:h};super(d,s,r,o,a,c,u,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Fr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Hl=class extends es{constructor(e,t=xi,i=Ts,s,r,o=pn,a=pn,c,l=Ai){let u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,i,s,r,o,a,c,l),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},$o=class extends rn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},kr=class n extends Tt{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],u=[],h=[],d=0,f=0;m("z","y","x",-1,-1,i,t,e,o,r,0),m("z","y","x",1,-1,i,t,-e,o,r,1),m("x","z","y",1,1,e,i,t,s,o,2),m("x","z","y",1,-1,e,i,-t,s,o,3),m("x","y","z",1,-1,e,t,i,s,r,4),m("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(c),this.setAttribute("position",new vt(l,3)),this.setAttribute("normal",new vt(u,3)),this.setAttribute("uv",new vt(h,2));function m(x,g,p,M,E,v,A,C,N,_,w){let V=v/N,k=A/_,T=v/2,D=A/2,ee=C/2,j=N+1,G=_+1,X=0,Y=0,me=new I;for(let ae=0;ae<G;ae++){let Te=ae*k-D;for(let Se=0;Se<j;Se++){let lt=Se*V-T;me[x]=lt*M,me[g]=Te*E,me[p]=ee,l.push(me.x,me.y,me.z),me[x]=0,me[g]=0,me[p]=C>0?1:-1,u.push(me.x,me.y,me.z),h.push(Se/N),h.push(1-ae/_),X+=1}}for(let ae=0;ae<_;ae++)for(let Te=0;Te<N;Te++){let Se=d+Te+j*ae,lt=d+Te+j*(ae+1),dt=d+(Te+1)+j*(ae+1),it=d+(Te+1)+j*ae;c.push(Se,lt,it),c.push(lt,dt,it),Y+=6}a.addGroup(f,Y,w),f+=Y,d+=X}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var ts=class n extends Tt{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],c=[],l=new I,u=new xe;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let h=0,d=3;h<=t;h++,d+=3){let f=i+h/t*s;l.x=e*Math.cos(f),l.y=e*Math.sin(f),o.push(l.x,l.y,l.z),a.push(0,0,1),u.x=(o[d]/e+1)/2,u.y=(o[d+1]/e+1)/2,c.push(u.x,u.y)}for(let h=1;h<=t;h++)r.push(h,h+1,0);this.setIndex(r),this.setAttribute("position",new vt(o,3)),this.setAttribute("normal",new vt(a,3)),this.setAttribute("uv",new vt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}};var Wn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){tt("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,c=r-1,l;for(;a<=c;)if(s=Math.floor(a+(c-a)/2),l=i[s]-o,l<0)a=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,i[s]===o)return s/(r-1);let u=i[s],d=i[s+1]-u,f=(o-u)/d;return(s+f)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),c=t||(o.isVector2?new xe:new I);return c.copy(a).sub(o).normalize(),c}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new I,s=[],r=[],o=[],a=new I,c=new zt;for(let f=0;f<=e;f++){let m=f/e;s[f]=this.getTangentAt(m,new I)}r[0]=new I,o[0]=new I;let l=Number.MAX_VALUE,u=Math.abs(s[0].x),h=Math.abs(s[0].y),d=Math.abs(s[0].z);u<=l&&(l=u,i.set(1,0,0)),h<=l&&(l=h,i.set(0,1,0)),d<=l&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();let m=Math.acos(ht(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(c.makeRotationAxis(a,m))}o[f].crossVectors(s[f],r[f])}if(t===!0){let f=Math.acos(ht(r[0].dot(r[e]),-1,1));f/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(f=-f);for(let m=1;m<=e;m++)r[m].applyMatrix4(c.makeRotationAxis(s[m],f*m)),o[m].crossVectors(s[m],r[m])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Vr=class extends Wn{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(e,t=new xe){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=c-this.aX,f=l-this.aY;c=d*u-f*h+this.aX,l=d*h+f*u+this.aY}return i.set(c,l)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},kl=class extends Vr{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Oh(){let n=0,e=0,t=0,i=0;function s(r,o,a,c){n=r,e=a,t=-3*r+3*o-2*a-c,i=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,l){s(o,a,l*(a-r),l*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,l,u,h){let d=(o-r)/l-(a-r)/(l+u)+(a-o)/u,f=(a-o)/u-(c-o)/(u+h)+(c-a)/h;d*=u,f*=u,s(o,a,d,f)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var Xf=new I,qf=new I,oh=new Oh,ah=new Oh,lh=new Oh,jo=class extends Wn{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new I){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let l,u;this.closed||a>0?l=s[(a-1)%r]:(qf.subVectors(s[0],s[1]).add(s[0]),l=qf);let h=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?u=s[(a+2)%r]:(Xf.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=Xf),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,m=Math.pow(l.distanceToSquared(h),f),x=Math.pow(h.distanceToSquared(d),f),g=Math.pow(d.distanceToSquared(u),f);x<1e-4&&(x=1),m<1e-4&&(m=x),g<1e-4&&(g=x),oh.initNonuniformCatmullRom(l.x,h.x,d.x,u.x,m,x,g),ah.initNonuniformCatmullRom(l.y,h.y,d.y,u.y,m,x,g),lh.initNonuniformCatmullRom(l.z,h.z,d.z,u.z,m,x,g)}else this.curveType==="catmullrom"&&(oh.initCatmullRom(l.x,h.x,d.x,u.x,this.tension),ah.initCatmullRom(l.y,h.y,d.y,u.y,this.tension),lh.initCatmullRom(l.z,h.z,d.z,u.z,this.tension));return i.set(oh.calc(c),ah.calc(c),lh.calc(c)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new I().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function $f(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,c=n*a;return(2*t-2*i+r+o)*c+(-3*t+3*i-2*r-o)*a+r*n+t}function q0(n,e){let t=1-n;return t*t*e}function $0(n,e){return 2*(1-n)*n*e}function j0(n,e){return n*n*e}function Lo(n,e,t,i){return q0(n,e)+$0(n,t)+j0(n,i)}function Y0(n,e){let t=1-n;return t*t*t*e}function Z0(n,e){let t=1-n;return 3*t*t*n*e}function J0(n,e){return 3*(1-n)*n*n*e}function K0(n,e){return n*n*n*e}function Do(n,e,t,i,s){return Y0(n,e)+Z0(n,t)+J0(n,i)+K0(n,s)}var Yo=class extends Wn{constructor(e=new xe,t=new xe,i=new xe,s=new xe){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new xe){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Do(e,s.x,r.x,o.x,a.x),Do(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Vl=class extends Wn{constructor(e=new I,t=new I,i=new I,s=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new I){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Do(e,s.x,r.x,o.x,a.x),Do(e,s.y,r.y,o.y,a.y),Do(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Zo=class extends Wn{constructor(e=new xe,t=new xe){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new xe){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new xe){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Gl=class extends Wn{constructor(e=new I,t=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new I){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new I){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Jo=class extends Wn{constructor(e=new xe,t=new xe,i=new xe){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new xe){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Lo(e,s.x,r.x,o.x),Lo(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ko=class extends Wn{constructor(e=new I,t=new I,i=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new I){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Lo(e,s.x,r.x,o.x),Lo(e,s.y,r.y,o.y),Lo(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Qo=class extends Wn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new xe){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,c=s[o===0?o:o-1],l=s[o],u=s[o>s.length-2?s.length-1:o+1],h=s[o>s.length-3?s.length-1:o+2];return i.set($f(a,c.x,l.x,u.x,h.x),$f(a,c.y,l.y,u.y,h.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new xe().fromArray(s))}return this}},jf=Object.freeze({__proto__:null,ArcCurve:kl,CatmullRomCurve3:jo,CubicBezierCurve:Yo,CubicBezierCurve3:Vl,EllipseCurve:Vr,LineCurve:Zo,LineCurve3:Gl,QuadraticBezierCurve:Jo,QuadraticBezierCurve3:Ko,SplineCurve:Qo}),Wl=class extends Wn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new jf[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,c=o.getPoints(a);for(let l=0;l<c.length;l++){let u=c[l];i&&i.equals(u)||(t.push(u),i=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new jf[s.type]().fromJSON(s))}return this}},ri=class extends Wl{constructor(e){super(),this.type="Path",this.currentPoint=new xe,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Zo(this.currentPoint.clone(),new xe(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new Jo(this.currentPoint.clone(),new xe(e,t),new xe(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,o){let a=new Yo(this.currentPoint.clone(),new xe(e,t),new xe(i,s),new xe(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Qo(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,o){let a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(e+a,t+c,i,s,r,o),this}absarc(e,t,i,s,r,o){return this.absellipse(e,t,i,i,s,r,o),this}ellipse(e,t,i,s,r,o,a,c){let l=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+l,t+u,i,s,r,o,a,c),this}absellipse(e,t,i,s,r,o,a,c){let l=new Vr(e,t,i,s,r,o,a,c);if(this.curves.length>0){let h=l.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(l);let u=l.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},_s=class extends ri{constructor(e){super(e),this.uuid=Ti(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,s=this.holes.length;i<s;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(new ri().fromJSON(s))}return this}};function Q0(n,e,t=2){let i=e&&e.length,s=i?e[0]*t:n.length,r=Wp(n,0,s,t,!0),o=[];if(!r||r.next===r.prev)return o;let a,c,l;if(i&&(r=sx(n,e,r,t)),n.length>80*t){a=n[0],c=n[1];let u=a,h=c;for(let d=t;d<s;d+=t){let f=n[d],m=n[d+1];f<a&&(a=f),m<c&&(c=m),f>u&&(u=f),m>h&&(h=m)}l=Math.max(u-a,h-c),l=l!==0?32767/l:0}return ea(r,o,t,a,c,l,0),o}function Wp(n,e,t,i,s){let r;if(s===mx(n,e,t,i)>0)for(let o=e;o<t;o+=i)r=Yf(o/i|0,n[o],n[o+1],r);else for(let o=t-i;o>=e;o-=i)r=Yf(o/i|0,n[o],n[o+1],r);return r&&Gr(r,r.next)&&(na(r),r=r.next),r}function js(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(Gr(t,t.next)||jt(t.prev,t,t.next)===0)){if(na(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function ea(n,e,t,i,s,r,o){if(!n)return;!o&&r&&cx(n,i,s,r);let a=n;for(;n.prev!==n.next;){let c=n.prev,l=n.next;if(r?tx(n,i,s,r):ex(n)){e.push(c.i,n.i,l.i),na(n),n=l.next,a=l.next;continue}if(n=l,n===a){o?o===1?(n=nx(js(n),e),ea(n,e,t,i,s,r,2)):o===2&&ix(n,e,t,i,s,r):ea(js(n),e,t,i,s,r,1);break}}}function ex(n){let e=n.prev,t=n,i=n.next;if(jt(e,t,i)>=0)return!1;let s=e.x,r=t.x,o=i.x,a=e.y,c=t.y,l=i.y,u=Math.min(s,r,o),h=Math.min(a,c,l),d=Math.max(s,r,o),f=Math.max(a,c,l),m=i.next;for(;m!==e;){if(m.x>=u&&m.x<=d&&m.y>=h&&m.y<=f&&Ro(s,a,r,c,o,l,m.x,m.y)&&jt(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function tx(n,e,t,i){let s=n.prev,r=n,o=n.next;if(jt(s,r,o)>=0)return!1;let a=s.x,c=r.x,l=o.x,u=s.y,h=r.y,d=o.y,f=Math.min(a,c,l),m=Math.min(u,h,d),x=Math.max(a,c,l),g=Math.max(u,h,d),p=gh(f,m,e,t,i),M=gh(x,g,e,t,i),E=n.prevZ,v=n.nextZ;for(;E&&E.z>=p&&v&&v.z<=M;){if(E.x>=f&&E.x<=x&&E.y>=m&&E.y<=g&&E!==s&&E!==o&&Ro(a,u,c,h,l,d,E.x,E.y)&&jt(E.prev,E,E.next)>=0||(E=E.prevZ,v.x>=f&&v.x<=x&&v.y>=m&&v.y<=g&&v!==s&&v!==o&&Ro(a,u,c,h,l,d,v.x,v.y)&&jt(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;E&&E.z>=p;){if(E.x>=f&&E.x<=x&&E.y>=m&&E.y<=g&&E!==s&&E!==o&&Ro(a,u,c,h,l,d,E.x,E.y)&&jt(E.prev,E,E.next)>=0)return!1;E=E.prevZ}for(;v&&v.z<=M;){if(v.x>=f&&v.x<=x&&v.y>=m&&v.y<=g&&v!==s&&v!==o&&Ro(a,u,c,h,l,d,v.x,v.y)&&jt(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function nx(n,e){let t=n;do{let i=t.prev,s=t.next.next;!Gr(i,s)&&qp(i,t,t.next,s)&&ta(i,s)&&ta(s,i)&&(e.push(i.i,t.i,s.i),na(t),na(t.next),t=n=s),t=t.next}while(t!==n);return js(t)}function ix(n,e,t,i,s,r){let o=n;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&dx(o,a)){let c=$p(o,a);o=js(o,o.next),c=js(c,c.next),ea(o,e,t,i,s,r,0),ea(c,e,t,i,s,r,0);return}a=a.next}o=o.next}while(o!==n)}function sx(n,e,t,i){let s=[];for(let r=0,o=e.length;r<o;r++){let a=e[r]*i,c=r<o-1?e[r+1]*i:n.length,l=Wp(n,a,c,i,!1);l===l.next&&(l.steiner=!0),s.push(hx(l))}s.sort(rx);for(let r=0;r<s.length;r++)t=ox(s[r],t);return t}function rx(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=i-s}return t}function ox(n,e){let t=ax(n,e);if(!t)return e;let i=$p(t,n);return js(i,i.next),js(t,t.next)}function ax(n,e){let t=e,i=n.x,s=n.y,r=-1/0,o;if(Gr(n,t))return t;do{if(Gr(n,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){let h=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(h<=i&&h>r&&(r=h,o=t.x<t.next.x?t:t.next,h===i))return o}t=t.next}while(t!==e);if(!o)return null;let a=o,c=o.x,l=o.y,u=1/0;t=o;do{if(i>=t.x&&t.x>=c&&i!==t.x&&Xp(s<l?i:r,s,c,l,s<l?r:i,s,t.x,t.y)){let h=Math.abs(s-t.y)/(i-t.x);ta(t,n)&&(h<u||h===u&&(t.x>o.x||t.x===o.x&&lx(o,t)))&&(o=t,u=h)}t=t.next}while(t!==a);return o}function lx(n,e){return jt(n.prev,n,e.prev)<0&&jt(e.next,n,n.next)<0}function cx(n,e,t,i){let s=n;do s.z===0&&(s.z=gh(s.x,s.y,e,t,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==n);s.prevZ.nextZ=null,s.prevZ=null,ux(s)}function ux(n){let e,t=1;do{let i=n,s;n=null;let r=null;for(e=0;i;){e++;let o=i,a=0;for(let l=0;l<t&&(a++,o=o.nextZ,!!o);l++);let c=t;for(;a>0||c>0&&o;)a!==0&&(c===0||!o||i.z<=o.z)?(s=i,i=i.nextZ,a--):(s=o,o=o.nextZ,c--),r?r.nextZ=s:n=s,s.prevZ=r,r=s;i=o}r.nextZ=null,t*=2}while(e>1);return n}function gh(n,e,t,i,s){return n=(n-t)*s|0,e=(e-i)*s|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function hx(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function Xp(n,e,t,i,s,r,o,a){return(s-o)*(e-a)>=(n-o)*(r-a)&&(n-o)*(i-a)>=(t-o)*(e-a)&&(t-o)*(r-a)>=(s-o)*(i-a)}function Ro(n,e,t,i,s,r,o,a){return!(n===o&&e===a)&&Xp(n,e,t,i,s,r,o,a)}function dx(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!fx(n,e)&&(ta(n,e)&&ta(e,n)&&px(n,e)&&(jt(n.prev,n,e.prev)||jt(n,e.prev,e))||Gr(n,e)&&jt(n.prev,n,n.next)>0&&jt(e.prev,e,e.next)>0)}function jt(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function Gr(n,e){return n.x===e.x&&n.y===e.y}function qp(n,e,t,i){let s=yl(jt(n,e,t)),r=yl(jt(n,e,i)),o=yl(jt(t,i,n)),a=yl(jt(t,i,e));return!!(s!==r&&o!==a||s===0&&xl(n,t,e)||r===0&&xl(n,i,e)||o===0&&xl(t,n,i)||a===0&&xl(t,e,i))}function xl(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function yl(n){return n>0?1:n<0?-1:0}function fx(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&qp(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function ta(n,e){return jt(n.prev,n,n.next)<0?jt(n,e,n.next)>=0&&jt(n,n.prev,e)>=0:jt(n,e,n.prev)<0||jt(n,n.next,e)<0}function px(n,e){let t=n,i=!1,s=(n.x+e.x)/2,r=(n.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function $p(n,e){let t=xh(n.i,n.x,n.y),i=xh(e.i,e.x,e.y),s=n.next,r=e.prev;return n.next=e,e.prev=n,t.next=s,s.prev=t,i.next=t,t.prev=i,r.next=i,i.prev=r,i}function Yf(n,e,t,i){let s=xh(n,e,t);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function na(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function xh(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function mx(n,e,t,i){let s=0;for(let r=e,o=t-i;r<t;r+=i)s+=(n[o]-n[r])*(n[r+1]+n[o+1]),o=r;return s}var yh=class{static triangulate(e,t,i=2){return Q0(e,t,i)}},$i=class n{static area(e){let t=e.length,i=0;for(let s=t-1,r=0;r<t;s=r++)i+=e[s].x*e[r].y-e[r].x*e[s].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],s=[],r=[];Zf(e),Jf(i,e);let o=e.length;t.forEach(Zf);for(let c=0;c<t.length;c++)s.push(o),o+=t[c].length,Jf(i,t[c]);let a=yh.triangulate(i,s);for(let c=0;c<a.length;c+=3)r.push(a.slice(c,c+3));return r}};function Zf(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function Jf(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var Cn=class n extends Tt{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),c=Math.floor(s),l=a+1,u=c+1,h=e/a,d=t/c,f=[],m=[],x=[],g=[];for(let p=0;p<u;p++){let M=p*d-o;for(let E=0;E<l;E++){let v=E*h-r;m.push(v,-M,0),x.push(0,0,1),g.push(E/a),g.push(1-p/c)}}for(let p=0;p<c;p++)for(let M=0;M<a;M++){let E=M+l*p,v=M+l*(p+1),A=M+1+l*(p+1),C=M+1+l*p;f.push(E,v,C),f.push(v,A,C)}this.setIndex(f),this.setAttribute("position",new vt(m,3)),this.setAttribute("normal",new vt(x,3)),this.setAttribute("uv",new vt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},bs=class n extends Tt{constructor(e=.5,t=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],c=[],l=[],u=[],h=e,d=(t-e)/s,f=new I,m=new xe;for(let x=0;x<=s;x++){for(let g=0;g<=i;g++){let p=r+g/i*o;f.x=h*Math.cos(p),f.y=h*Math.sin(p),c.push(f.x,f.y,f.z),l.push(0,0,1),m.x=(f.x/t+1)/2,m.y=(f.y/t+1)/2,u.push(m.x,m.y)}h+=d}for(let x=0;x<s;x++){let g=x*(i+1);for(let p=0;p<i;p++){let M=p+g,E=M,v=M+i+1,A=M+i+2,C=M+1;a.push(E,v,C),a.push(v,A,C)}}this.setIndex(a),this.setAttribute("position",new vt(c,3)),this.setAttribute("normal",new vt(l,3)),this.setAttribute("uv",new vt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},Ys=class n extends Tt{constructor(e=new _s([new xe(0,.5),new xe(-.5,-.5),new xe(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],s=[],r=[],o=[],a=0,c=0;if(Array.isArray(e)===!1)l(e);else for(let u=0;u<e.length;u++)l(e[u]),this.addGroup(a,c,u),a+=c,c=0;this.setIndex(i),this.setAttribute("position",new vt(s,3)),this.setAttribute("normal",new vt(r,3)),this.setAttribute("uv",new vt(o,2));function l(u){let h=s.length/3,d=u.extractPoints(t),f=d.shape,m=d.holes;$i.isClockWise(f)===!1&&(f=f.reverse());for(let g=0,p=m.length;g<p;g++){let M=m[g];$i.isClockWise(M)===!0&&(m[g]=M.reverse())}let x=$i.triangulateShape(f,m);for(let g=0,p=m.length;g<p;g++){let M=m[g];f=f.concat(M)}for(let g=0,p=f.length;g<p;g++){let M=f[g];s.push(M.x,M.y,0),r.push(0,0,1),o.push(M.x,M.y)}for(let g=0,p=x.length;g<p;g++){let M=x[g],E=M[0]+h,v=M[1]+h,A=M[2]+h;i.push(E,v,A),c+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return gx(t,e)}static fromJSON(e,t){let i=[];for(let s=0,r=e.shapes.length;s<r;s++){let o=t[e.shapes[s]];i.push(o)}return new n(i,e.curveSegments)}};function gx(n,e){if(e.shapes=[],Array.isArray(n))for(let t=0,i=n.length;t<i;t++){let s=n[t];e.shapes.push(s.uuid)}else e.shapes.push(n.uuid);return e}var Zs=class n extends Tt{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let c=Math.min(o+a,Math.PI),l=0,u=[],h=new I,d=new I,f=[],m=[],x=[],g=[];for(let p=0;p<=i;p++){let M=[],E=p/i,v=o+E*a,A=e*Math.cos(v),C=Math.sqrt(e*e-A*A),N=0;p===0&&o===0?N=.5/t:p===i&&c===Math.PI&&(N=-.5/t);for(let _=0;_<=t;_++){let w=_/t,V=s+w*r;h.x=-C*Math.cos(V),h.y=A,h.z=C*Math.sin(V),m.push(h.x,h.y,h.z),d.copy(h).normalize(),x.push(d.x,d.y,d.z),g.push(w+N,1-E),M.push(l++)}u.push(M)}for(let p=0;p<i;p++)for(let M=0;M<t;M++){let E=u[p][M+1],v=u[p][M],A=u[p+1][M],C=u[p+1][M+1];(p!==0||o>0)&&f.push(E,v,C),(p!==i-1||c<Math.PI)&&f.push(v,A,C)}this.setIndex(f),this.setAttribute("position",new vt(m,3)),this.setAttribute("normal",new vt(x,3)),this.setAttribute("uv",new vt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var ia=class extends Tt{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],i=new Set,s=new I,r=new I;if(e.index!==null){let o=e.attributes.position,a=e.index,c=e.groups;c.length===0&&(c=[{start:0,count:a.count,materialIndex:0}]);for(let l=0,u=c.length;l<u;++l){let h=c[l],d=h.start,f=h.count;for(let m=d,x=d+f;m<x;m+=3)for(let g=0;g<3;g++){let p=a.getX(m+g),M=a.getX(m+(g+1)%3);s.fromBufferAttribute(o,p),r.fromBufferAttribute(o,M),Kf(s,r,i)===!0&&(t.push(s.x,s.y,s.z),t.push(r.x,r.y,r.z))}}}else{let o=e.attributes.position;for(let a=0,c=o.count/3;a<c;a++)for(let l=0;l<3;l++){let u=3*a+l,h=3*a+(l+1)%3;s.fromBufferAttribute(o,u),r.fromBufferAttribute(o,h),Kf(s,r,i)===!0&&(t.push(s.x,s.y,s.z),t.push(r.x,r.y,r.z))}}this.setAttribute("position",new vt(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function Kf(n,e,t){let i=`${n.x},${n.y},${n.z}-${e.x},${e.y},${e.z}`,s=`${e.x},${e.y},${e.z}-${n.x},${n.y},${n.z}`;return t.has(i)===!0||t.has(s)===!0?!1:(t.add(i),t.add(s),!0)}function Qs(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];if(Qf(s))s.isRenderTargetTexture?(tt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone();else if(Array.isArray(s))if(Qf(s[0])){let r=[];for(let o=0,a=s.length;o<a;o++)r[o]=s[o].clone();e[t][i]=r}else e[t][i]=s.slice();else e[t][i]=s}}return e}function wn(n){let e={};for(let t=0;t<n.length;t++){let i=Qs(n[t]);for(let s in i)e[s]=i[s]}return e}function Qf(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function xx(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Bh(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:yt.workingColorSpace}var Rn={clone:Qs,merge:wn},yx=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,vx=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,St=class extends Ji{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=yx,this.fragmentShader=vx,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Qs(e.uniforms),this.uniformsGroups=xx(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let s=e.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=t[s.value]||null;break;case"c":this.uniforms[i].value=new Ye().setHex(s.value);break;case"v2":this.uniforms[i].value=new xe().fromArray(s.value);break;case"v3":this.uniforms[i].value=new I().fromArray(s.value);break;case"v4":this.uniforms[i].value=new Lt().fromArray(s.value);break;case"m3":this.uniforms[i].value=new nt().fromArray(s.value);break;case"m4":this.uniforms[i].value=new zt().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Wr=class extends St{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Xl=class extends Ji{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ip,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ql=class extends Ji{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var sa=class extends Qi{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function vl(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}var Ss=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let c=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},$l=class extends Ss{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:hh,endingEnd:hh}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case dh:r=e,a=2*t-i;break;case fh:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(c===void 0)switch(this.getSettings_().endingEnd){case dh:o=e,c=2*i-t;break;case fh:o=1,c=i+s[1]-s[0];break;default:o=e-1,c=t}let l=(i-t)*.5,u=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-i),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(i-t)/(s-t),x=m*m,g=x*m,p=-d*g+2*d*x-d*m,M=(1+d)*g+(-1.5-2*d)*x+(-.5+d)*m+1,E=(-1-f)*g+(1.5+f)*x+.5*m,v=f*g-f*x;for(let A=0;A!==a;++A)r[A]=p*o[u+A]+M*o[l+A]+E*o[c+A]+v*o[h+A];return r}},jl=class extends Ss{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=(i-t)/(s-t),h=1-u;for(let d=0;d!==a;++d)r[d]=o[l+d]*h+o[c+d]*u;return r}},Yl=class extends Ss{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Zl=class extends Ss{interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this.inTangents,h=this.outTangents;if(!u||!h){let m=(i-t)/(s-t),x=1-m;for(let g=0;g!==a;++g)r[g]=o[l+g]*x+o[c+g]*m;return r}let d=a*2,f=e-1;for(let m=0;m!==a;++m){let x=o[l+m],g=o[c+m],p=f*d+m*2,M=h[p],E=h[p+1],v=e*d+m*2,A=u[v],C=u[v+1],N=(i-t)/(s-t),_,w,V,k,T;for(let D=0;D<8;D++){_=N*N,w=_*N,V=1-N,k=V*V,T=k*V;let j=T*t+3*k*N*M+3*V*_*A+w*s-i;if(Math.abs(j)<1e-10)break;let G=3*k*(M-t)+6*V*N*(A-M)+3*_*(s-A);if(Math.abs(G)<1e-10)break;N=N-j/G,N=Math.max(0,Math.min(1,N))}r[m]=T*x+3*k*N*E+3*V*_*C+w*g}return r}},Xn=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=vl(t,this.TimeBufferType),this.values=vl(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:vl(e.times,Array),values:vl(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Yl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new jl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new $l(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Zl(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case No:t=this.InterpolantFactoryMethodDiscrete;break;case Dl:t=this.InterpolantFactoryMethodLinear;break;case Ml:t=this.InterpolantFactoryMethodSmooth;break;case uh:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return tt("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return No;case this.InterpolantFactoryMethodLinear:return Dl;case this.InterpolantFactoryMethodSmooth:return Ml;case this.InterpolantFactoryMethodBezier:return uh}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(at("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(at("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let c=i[a];if(typeof c=="number"&&isNaN(c)){at("KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){at("KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(s!==void 0&&h0(s))for(let a=0,c=s.length;a!==c;++a){let l=s[a];if(isNaN(l)){at("KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===Ml,r=e.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=e[a],u=e[a+1];if(l!==u&&(a!==1||l!==e[0]))if(s)c=!0;else{let h=a*i,d=h-i,f=h+i;for(let m=0;m!==i;++m){let x=t[h+m];if(x!==t[d+m]||x!==t[f+m]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let h=a*i,d=o*i;for(let f=0;f!==i;++f)t[d+f]=t[h+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,c=o*i,l=0;l!==i;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};Xn.prototype.ValueTypeName="";Xn.prototype.TimeBufferType=Float32Array;Xn.prototype.ValueBufferType=Float32Array;Xn.prototype.DefaultInterpolation=Dl;var Ms=class extends Xn{constructor(e,t,i){super(e,t,i)}};Ms.prototype.ValueTypeName="bool";Ms.prototype.ValueBufferType=Array;Ms.prototype.DefaultInterpolation=No;Ms.prototype.InterpolantFactoryMethodLinear=void 0;Ms.prototype.InterpolantFactoryMethodSmooth=void 0;var Jl=class extends Xn{constructor(e,t,i,s){super(e,t,i,s)}};Jl.prototype.ValueTypeName="color";var Kl=class extends Xn{constructor(e,t,i,s){super(e,t,i,s)}};Kl.prototype.ValueTypeName="number";var Ql=class extends Ss{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(i-t)/(s-t),l=e*a;for(let u=l+a;l!==u;l+=4)Nn.slerpFlat(r,0,o,l-a,o,l,c);return r}},ra=class extends Xn{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new Ql(this.times,this.values,this.getValueSize(),e)}};ra.prototype.ValueTypeName="quaternion";ra.prototype.InterpolantFactoryMethodSmooth=void 0;var Es=class extends Xn{constructor(e,t,i){super(e,t,i)}};Es.prototype.ValueTypeName="string";Es.prototype.ValueBufferType=Array;Es.prototype.DefaultInterpolation=No;Es.prototype.InterpolantFactoryMethodLinear=void 0;Es.prototype.InterpolantFactoryMethodSmooth=void 0;var ec=class extends Xn{constructor(e,t,i,s){super(e,t,i,s)}};ec.prototype.ValueTypeName="vector";var Ir={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(ep(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!ep(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function ep(n){try{let e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var tc=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){let h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=l.length;h<d;h+=2){let f=l[h],m=l[h+1];if(f.global&&(f.lastIndex=0),f.test(u))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},jp=new tc,ns=class{constructor(e){this.manager=e!==void 0?e:jp,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};ns.DEFAULT_MATERIAL_NAME="__DEFAULT";var Xi={},vh=class extends Error{constructor(e,t){super(e),this.response=t}},oa=class extends ns{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=Ir.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0);return}if(Xi[e]!==void 0){Xi[e].push({onLoad:t,onProgress:i,onError:s});return}Xi[e]=[],Xi[e].push({onLoad:t,onProgress:i,onError:s});let o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&tt("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let u=Xi[e],h=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,m=f!==0,x=0,g=new ReadableStream({start(p){M();function M(){h.read().then(({done:E,value:v})=>{if(E)p.close();else{x+=v.byteLength;let A=new ProgressEvent("progress",{lengthComputable:m,loaded:x,total:f});for(let C=0,N=u.length;C<N;C++){let _=u[C];_.onProgress&&_.onProgress(A)}p.enqueue(v),M()}},E=>{p.error(E)})}}});return new Response(g)}else throw new vh(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return l.json();default:if(a==="")return l.text();{let h=/charset="?([^;"\s]*)"?/i.exec(a),d=h&&h[1]?h[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(m=>f.decode(m))}}}).then(l=>{Ir.add(`file:${e}`,l);let u=Xi[e];delete Xi[e];for(let h=0,d=u.length;h<d;h++){let f=u[h];f.onLoad&&f.onLoad(l)}}).catch(l=>{let u=Xi[e];if(u===void 0)throw this.manager.itemError(e),l;delete Xi[e];for(let h=0,d=u.length;h<d;h++){let f=u[h];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var wr=new WeakMap,nc=class extends ns{constructor(e){super(e)}load(e,t,i,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=Ir.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0);else{let h=wr.get(o);h===void 0&&(h=[],wr.set(o,h)),h.push({onLoad:t,onError:s})}return o}let a=Dr("img");function c(){u(),t&&t(this);let h=wr.get(this)||[];for(let d=0;d<h.length;d++){let f=h[d];f.onLoad&&f.onLoad(this)}wr.delete(this),r.manager.itemEnd(e)}function l(h){u(),s&&s(h),Ir.remove(`image:${e}`);let d=wr.get(this)||[];for(let f=0;f<d.length;f++){let m=d[f];m.onError&&m.onError(h)}wr.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function u(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),Ir.add(`image:${e}`,a),r.manager.itemStart(e),a.src=e,a}};var aa=class extends ns{constructor(e){super(e)}load(e,t,i,s){let r=new rn,o=new nc(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},i,s),r}};var _l=new I,bl=new Nn,wi=new I,la=class extends Un{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new zt,this.projectionMatrix=new zt,this.projectionMatrixInverse=new zt,this.coordinateSystem=pi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(_l,bl,wi),wi.x===1&&wi.y===1&&wi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(_l,bl,wi.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(_l,bl,wi),wi.x===1&&wi.y===1&&wi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(_l,bl,wi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},gs=new I,tp=new xe,np=new xe,En=class extends la{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Ur*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Po*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ur*2*Math.atan(Math.tan(Po*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){gs.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(gs.x,gs.y).multiplyScalar(-e/gs.z),gs.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(gs.x,gs.y).multiplyScalar(-e/gs.z)}getViewSize(e,t){return this.getViewBounds(e,tp,np),t.subVectors(np,tp)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Po*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,t-=o.offsetY*i/l,s*=o.width/c,i*=o.height/l}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var is=class extends la{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,c=s-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var ca=class extends Tt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var Tr=-90,Ar=1,ic=class extends Un{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new En(Tr,Ar,e,t);s.layers=this.layers,this.add(s);let r=new En(Tr,Ar,e,t);r.layers=this.layers,this.add(r);let o=new En(Tr,Ar,e,t);o.layers=this.layers,this.add(o);let a=new En(Tr,Ar,e,t);a.layers=this.layers,this.add(a);let c=new En(Tr,Ar,e,t);c.layers=this.layers,this.add(c);let l=new En(Tr,Ar,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,c]=t;for(let l of t)this.remove(l);if(e===pi)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Oo)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let x=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(i,0,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(i,1,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,2,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(i,4,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),i.texture.generateMipmaps=x,e.setRenderTarget(i,5,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,d,f),e.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},sc=class extends En{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Js=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=_x.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function _x(){this._document.hidden===!1&&this.reset()}var zh="\\[\\]\\.:\\/",bx=new RegExp("["+zh+"]","g"),Hh="[^"+zh+"]",Sx="[^"+zh.replace("\\.","")+"]",Mx=/((?:WC+[\/:])*)/.source.replace("WC",Hh),Ex=/(WCOD+)?/.source.replace("WCOD",Sx),wx=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Hh),Tx=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Hh),Ax=new RegExp("^"+Mx+Ex+wx+Tx+"$"),Cx=["material","materials","bones","map"],_h=class{constructor(e,t,i){let s=i||Gt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},Gt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(bx,"")}static parseTrackName(e){let t=Ax.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);Cx.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let c=i(a.children);if(c)return c}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){tt("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let l=t.objectIndex;switch(i){case"materials":if(!e.material){at("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){at("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){at("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===l){l=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){at("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){at("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){at("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(l!==void 0){if(e[l]===void 0){at("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[s];if(o===void 0){let l=t.nodeName;at("PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){at("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){at("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Gt.Composite=_h;Gt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Gt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Gt.prototype.GetterByBindingType=[Gt.prototype._getValue_direct,Gt.prototype._getValue_array,Gt.prototype._getValue_arrayElement,Gt.prototype._getValue_toArray];Gt.prototype.SetterByBindingTypeAndVersioning=[[Gt.prototype._setValue_direct,Gt.prototype._setValue_direct_setNeedsUpdate,Gt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Gt.prototype._setValue_array,Gt.prototype._setValue_array_setNeedsUpdate,Gt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Gt.prototype._setValue_arrayElement,Gt.prototype._setValue_arrayElement_setNeedsUpdate,Gt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Gt.prototype._setValue_fromArray,Gt.prototype._setValue_fromArray_setNeedsUpdate,Gt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var cE=new Float32Array(1);var ws=class extends Vo{constructor(e,t,i=1){super(e,t),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}clone(e){let t=super.clone(e);return t.meshPerAttribute=this.meshPerAttribute,t}toJSON(e){let t=super.toJSON(e);return t.isInstancedInterleavedBuffer=!0,t.meshPerAttribute=this.meshPerAttribute,t}};var ip=new zt,ua=class{constructor(e,t,i=0,s=1/0){this.ray=new Ki(e,t),this.near=i,this.far=s,this.camera=null,this.layers=new Or,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):at("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return ip.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ip),this}intersectObject(e,t=!0,i=[]){return bh(e,this,i,t),i.sort(sp),i}intersectObjects(e,t=!0,i=[]){for(let s=0,r=e.length;s<r;s++)bh(e[s],this,i,t);return i.sort(sp),i}};function sp(n,e){return n.distance-e.distance}function bh(n,e,t,i){let s=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(s=!1),s===!0&&i===!0){let r=n.children;for(let o=0,a=r.length;o<a;o++)bh(r[o],e,t,!0)}}var Xr=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=ht(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(ht(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var qh=class qh{constructor(e,t,i,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=i,r[3]=s,this}};qh.prototype.isMatrix2=!0;var Sh=qh,rp=new xe,qr=class{constructor(e=new xe(1/0,1/0),t=new xe(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=rp.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,rp).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},op=new I,Sl=new I,Cr=new I,Rr=new I,ch=new I,Rx=new I,Px=new I,ha=class{constructor(e=new I,t=new I){this.start=e,this.end=t}set(e,t){return this.start.copy(e),this.end.copy(t),this}copy(e){return this.start.copy(e.start),this.end.copy(e.end),this}getCenter(e){return e.addVectors(this.start,this.end).multiplyScalar(.5)}delta(e){return e.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(e,t){return this.delta(t).multiplyScalar(e).add(this.start)}closestPointToPointParameter(e,t){op.subVectors(e,this.start),Sl.subVectors(this.end,this.start);let i=Sl.dot(Sl);if(i===0)return 0;let r=Sl.dot(op)/i;return t&&(r=ht(r,0,1)),r}closestPointToPoint(e,t,i){let s=this.closestPointToPointParameter(e,t);return this.delta(i).multiplyScalar(s).add(this.start)}distanceSqToLine3(e,t=Rx,i=Px){let s=10000000000000001e-32,r,o,a=this.start,c=e.start,l=this.end,u=e.end;Cr.subVectors(l,a),Rr.subVectors(u,c),ch.subVectors(a,c);let h=Cr.dot(Cr),d=Rr.dot(Rr),f=Rr.dot(ch);if(h<=s&&d<=s)return t.copy(a),i.copy(c),t.sub(i),t.dot(t);if(h<=s)r=0,o=f/d,o=ht(o,0,1);else{let m=Cr.dot(ch);if(d<=s)o=0,r=ht(-m/h,0,1);else{let x=Cr.dot(Rr),g=h*d-x*x;g!==0?r=ht((x*f-m*d)/g,0,1):r=0,o=(x*r+f)/d,o<0?(o=0,r=ht(-m/h,0,1)):o>1&&(o=1,r=ht((x-m)/h,0,1))}}return t.copy(a).addScaledVector(Cr,r),i.copy(c).addScaledVector(Rr,o),t.distanceToSquared(i)}applyMatrix4(e){return this.start.applyMatrix4(e),this.end.applyMatrix4(e),this}equals(e){return e.start.equals(this.start)&&e.end.equals(this.end)}clone(){return new this.constructor().copy(this)}};var mi=class{constructor(){this.type="ShapePath",this.color=new Ye,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new ri,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,i,s){return this.currentPath.quadraticCurveTo(e,t,i,s),this}bezierCurveTo(e,t,i,s,r,o){return this.currentPath.bezierCurveTo(e,t,i,s,r,o),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(c,l){let u=!1,h=l.length;for(let d=0,f=h-1;d<h;f=d++){let m=l[d],x=l[f];m.y>c.y!=x.y>c.y&&c.x<(x.x-m.x)*(c.y-m.y)/(x.y-m.y)+m.x&&(u=!u)}return u}function t(c,l){let u=l.getCenter(new xe);if(e(u,c))return u;let h=u.y,d=[],f=c.length;for(let m=0;m<f;m++){let x=c[m],g=c[(m+1)%f];if(x.y>h!=g.y>h){let p=x.x+(h-x.y)*(g.x-x.x)/(g.y-x.y);d.push(p)}}return d.length>1&&(d.sort((m,x)=>m-x),u.x=(d[0]+d[1])/2),u}let i=this.userData.style&&this.userData.style.fillRule||"nonzero";i!=="nonzero"&&i!=="evenodd"&&(tt('Fill-rule "'+i+'" is not supported, falling back to "nonzero".'),i="nonzero");let s=i==="nonzero"?(c=>c!==0):(c=>(c&1)!==0),r=[];for(let c of this.subPaths){let l=c.getPoints();if(l.length<3)continue;let u=$i.area(l);if(u===0)continue;let h=new qr;for(let d=0;d<l.length;d++)h.expandByPoint(l[d]);r.push({subPath:c,points:l,boundingBox:h,interiorPoint:t(l,h),absArea:Math.abs(u),winding:u<0?-1:1,container:null,exclude:!1,role:null})}r.sort((c,l)=>l.absArea-c.absArea);for(let c=0;c<r.length;c++){let l=r[c],u=0;for(let h=c-1;h>=0;h--){let d=r[h];if(d.boundingBox.containsBox(l.boundingBox)&&e(l.interiorPoint,d.points)){l.container=d.exclude?d.container:d,u=d.winding,l.winding+=u;break}}s(l.winding)===s(u)&&(l.exclude=!0)}for(let c of r)c.exclude||(c.role=c.container===null||c.container.role==="hole"?"outer":"hole");let o=[],a=new Map;for(let c of r){if(c.exclude||c.role!=="outer")continue;let l=new _s;l.curves=c.subPath.curves,o.push(l),a.set(c,l)}for(let c of r){if(c.exclude||c.role!=="hole")continue;let l=a.get(c.container);if(!l)continue;let u=new ri;u.curves=c.subPath.curves,l.holes.push(u)}return o}};function kh(n,e,t,i){let s=Ix(i);switch(t){case Lh:return n*e;case Zr:return n*e/s.components*s.byteLength;case dc:return n*e/s.components*s.byteLength;case Cs:return n*e*2/s.components*s.byteLength;case fc:return n*e*2/s.components*s.byteLength;case Dh:return n*e*3/s.components*s.byteLength;case oi:return n*e*4/s.components*s.byteLength;case pc:return n*e*4/s.components*s.byteLength;case Sa:case Ma:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ea:case wa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case gc:case yc:return Math.max(n,16)*Math.max(e,8)/4;case mc:case xc:return Math.max(n,8)*Math.max(e,8)/2;case vc:case _c:case Sc:case Mc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case bc:case Ta:case Ec:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case wc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Tc:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Ac:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Cc:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Rc:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Pc:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Ic:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Lc:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Dc:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Nc:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Uc:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Fc:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Oc:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Bc:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case zc:case Hc:case kc:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Vc:case Gc:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Aa:case Wc:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Ix(n){switch(n){case $n:case Ch:return{byteLength:1,components:1};case jr:case Rh:case on:return{byteLength:2,components:1};case uc:case hc:return{byteLength:2,components:4};case xi:case cc:case yi:return{byteLength:4,components:1};case Ph:case Ih:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));typeof window<"u"&&(window.__THREE__?tt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function xm(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Ox(n){let e=new WeakMap;function t(a,c){let l=a.array,u=a.usage,h=l.byteLength,d=n.createBuffer();n.bindBuffer(c,d),n.bufferData(c,l,u),a.onUploadCallback();let f;if(l instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=n.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=n.SHORT;else if(l instanceof Uint32Array)f=n.UNSIGNED_INT;else if(l instanceof Int32Array)f=n.INT;else if(l instanceof Int8Array)f=n.BYTE;else if(l instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:h}}function i(a,c,l){let u=c.array,h=c.updateRanges;if(n.bindBuffer(l,a),h.length===0)n.bufferSubData(l,0,u);else{h.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<h.length;f++){let m=h[d],x=h[f];x.start<=m.start+m.count+1?m.count=Math.max(m.count,x.start+x.count-m.start):(++d,h[d]=x)}h.length=d+1;for(let f=0,m=h.length;f<m;f++){let x=h[f];n.bufferSubData(l,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(n.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}var Bx=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,zx=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Hx=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,kx=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Vx=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Gx=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Wx=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Xx=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,qx=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,$x=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,jx=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Yx=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Zx=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Jx=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Kx=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Qx=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ey=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ty=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ny=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,iy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,sy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,ry=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,oy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,ay=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ly=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,cy=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,uy=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,hy=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,dy=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,fy=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,py="gl_FragColor = linearToOutputTexel( gl_FragColor );",my=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,gy=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,xy=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,yy=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,vy=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,_y=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,by=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Sy=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,My=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ey=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,wy=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ty=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Ay=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Cy=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ry=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Py=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Iy=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ly=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Dy=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ny=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Uy=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Fy=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Oy=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,By=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,zy=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Hy=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,ky=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Vy=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Gy=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wy=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Xy=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,qy=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,$y=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,jy=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Yy=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zy=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Jy=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Ky=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Qy=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ev=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,tv=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,nv=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,iv=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,sv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,rv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ov=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,av=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,lv=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,cv=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,uv=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,hv=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,dv=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,fv=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,pv=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,mv=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,gv=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,xv=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,yv=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,vv=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,_v=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,bv=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Sv=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Mv=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Ev=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,wv=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Tv=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Av=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Cv=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Rv=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Pv=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Iv=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Lv=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Dv=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Nv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Uv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Fv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Ov=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Bv=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,zv=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kv=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Vv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Gv=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Wv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Xv=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,qv=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,$v=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,jv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Yv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Jv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Kv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Qv=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,e_=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,t_=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,n_=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,i_=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,s_=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,r_=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,o_=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,a_=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,l_=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,c_=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,u_=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,h_=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,d_=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,f_=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,p_=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,m_=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,g_=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,x_=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,gt={alphahash_fragment:Bx,alphahash_pars_fragment:zx,alphamap_fragment:Hx,alphamap_pars_fragment:kx,alphatest_fragment:Vx,alphatest_pars_fragment:Gx,aomap_fragment:Wx,aomap_pars_fragment:Xx,batching_pars_vertex:qx,batching_vertex:$x,begin_vertex:jx,beginnormal_vertex:Yx,bsdfs:Zx,iridescence_fragment:Jx,bumpmap_pars_fragment:Kx,clipping_planes_fragment:Qx,clipping_planes_pars_fragment:ey,clipping_planes_pars_vertex:ty,clipping_planes_vertex:ny,color_fragment:iy,color_pars_fragment:sy,color_pars_vertex:ry,color_vertex:oy,common:ay,cube_uv_reflection_fragment:ly,defaultnormal_vertex:cy,displacementmap_pars_vertex:uy,displacementmap_vertex:hy,emissivemap_fragment:dy,emissivemap_pars_fragment:fy,colorspace_fragment:py,colorspace_pars_fragment:my,envmap_fragment:gy,envmap_common_pars_fragment:xy,envmap_pars_fragment:yy,envmap_pars_vertex:vy,envmap_physical_pars_fragment:Py,envmap_vertex:_y,fog_vertex:by,fog_pars_vertex:Sy,fog_fragment:My,fog_pars_fragment:Ey,gradientmap_pars_fragment:wy,lightmap_pars_fragment:Ty,lights_lambert_fragment:Ay,lights_lambert_pars_fragment:Cy,lights_pars_begin:Ry,lights_toon_fragment:Iy,lights_toon_pars_fragment:Ly,lights_phong_fragment:Dy,lights_phong_pars_fragment:Ny,lights_physical_fragment:Uy,lights_physical_pars_fragment:Fy,lights_fragment_begin:Oy,lights_fragment_maps:By,lights_fragment_end:zy,lightprobes_pars_fragment:Hy,logdepthbuf_fragment:ky,logdepthbuf_pars_fragment:Vy,logdepthbuf_pars_vertex:Gy,logdepthbuf_vertex:Wy,map_fragment:Xy,map_pars_fragment:qy,map_particle_fragment:$y,map_particle_pars_fragment:jy,metalnessmap_fragment:Yy,metalnessmap_pars_fragment:Zy,morphinstance_vertex:Jy,morphcolor_vertex:Ky,morphnormal_vertex:Qy,morphtarget_pars_vertex:ev,morphtarget_vertex:tv,normal_fragment_begin:nv,normal_fragment_maps:iv,normal_pars_fragment:sv,normal_pars_vertex:rv,normal_vertex:ov,normalmap_pars_fragment:av,clearcoat_normal_fragment_begin:lv,clearcoat_normal_fragment_maps:cv,clearcoat_pars_fragment:uv,iridescence_pars_fragment:hv,opaque_fragment:dv,packing:fv,premultiplied_alpha_fragment:pv,project_vertex:mv,dithering_fragment:gv,dithering_pars_fragment:xv,roughnessmap_fragment:yv,roughnessmap_pars_fragment:vv,shadowmap_pars_fragment:_v,shadowmap_pars_vertex:bv,shadowmap_vertex:Sv,shadowmask_pars_fragment:Mv,skinbase_vertex:Ev,skinning_pars_vertex:wv,skinning_vertex:Tv,skinnormal_vertex:Av,specularmap_fragment:Cv,specularmap_pars_fragment:Rv,tonemapping_fragment:Pv,tonemapping_pars_fragment:Iv,transmission_fragment:Lv,transmission_pars_fragment:Dv,uv_pars_fragment:Nv,uv_pars_vertex:Uv,uv_vertex:Fv,worldpos_vertex:Ov,background_vert:Bv,background_frag:zv,backgroundCube_vert:Hv,backgroundCube_frag:kv,cube_vert:Vv,cube_frag:Gv,depth_vert:Wv,depth_frag:Xv,distance_vert:qv,distance_frag:$v,equirect_vert:jv,equirect_frag:Yv,linedashed_vert:Zv,linedashed_frag:Jv,meshbasic_vert:Kv,meshbasic_frag:Qv,meshlambert_vert:e_,meshlambert_frag:t_,meshmatcap_vert:n_,meshmatcap_frag:i_,meshnormal_vert:s_,meshnormal_frag:r_,meshphong_vert:o_,meshphong_frag:a_,meshphysical_vert:l_,meshphysical_frag:c_,meshtoon_vert:u_,meshtoon_frag:h_,points_vert:d_,points_frag:f_,shadow_vert:p_,shadow_frag:m_,sprite_vert:g_,sprite_frag:x_},Ie={common:{diffuse:{value:new Ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new nt},alphaMap:{value:null},alphaMapTransform:{value:new nt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new nt}},envmap:{envMap:{value:null},envMapRotation:{value:new nt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new nt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new nt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new nt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new nt},normalScale:{value:new xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new nt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new nt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new nt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new nt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new I},probesMax:{value:new I},probesResolution:{value:new I}},points:{diffuse:{value:new Ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new nt},alphaTest:{value:0},uvTransform:{value:new nt}},sprite:{diffuse:{value:new Ye(16777215)},opacity:{value:1},center:{value:new xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new nt},alphaMap:{value:null},alphaMapTransform:{value:new nt},alphaTest:{value:0}}},Pn={basic:{uniforms:wn([Ie.common,Ie.specularmap,Ie.envmap,Ie.aomap,Ie.lightmap,Ie.fog]),vertexShader:gt.meshbasic_vert,fragmentShader:gt.meshbasic_frag},lambert:{uniforms:wn([Ie.common,Ie.specularmap,Ie.envmap,Ie.aomap,Ie.lightmap,Ie.emissivemap,Ie.bumpmap,Ie.normalmap,Ie.displacementmap,Ie.fog,Ie.lights,{emissive:{value:new Ye(0)},envMapIntensity:{value:1}}]),vertexShader:gt.meshlambert_vert,fragmentShader:gt.meshlambert_frag},phong:{uniforms:wn([Ie.common,Ie.specularmap,Ie.envmap,Ie.aomap,Ie.lightmap,Ie.emissivemap,Ie.bumpmap,Ie.normalmap,Ie.displacementmap,Ie.fog,Ie.lights,{emissive:{value:new Ye(0)},specular:{value:new Ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:gt.meshphong_vert,fragmentShader:gt.meshphong_frag},standard:{uniforms:wn([Ie.common,Ie.envmap,Ie.aomap,Ie.lightmap,Ie.emissivemap,Ie.bumpmap,Ie.normalmap,Ie.displacementmap,Ie.roughnessmap,Ie.metalnessmap,Ie.fog,Ie.lights,{emissive:{value:new Ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:gt.meshphysical_vert,fragmentShader:gt.meshphysical_frag},toon:{uniforms:wn([Ie.common,Ie.aomap,Ie.lightmap,Ie.emissivemap,Ie.bumpmap,Ie.normalmap,Ie.displacementmap,Ie.gradientmap,Ie.fog,Ie.lights,{emissive:{value:new Ye(0)}}]),vertexShader:gt.meshtoon_vert,fragmentShader:gt.meshtoon_frag},matcap:{uniforms:wn([Ie.common,Ie.bumpmap,Ie.normalmap,Ie.displacementmap,Ie.fog,{matcap:{value:null}}]),vertexShader:gt.meshmatcap_vert,fragmentShader:gt.meshmatcap_frag},points:{uniforms:wn([Ie.points,Ie.fog]),vertexShader:gt.points_vert,fragmentShader:gt.points_frag},dashed:{uniforms:wn([Ie.common,Ie.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:gt.linedashed_vert,fragmentShader:gt.linedashed_frag},depth:{uniforms:wn([Ie.common,Ie.displacementmap]),vertexShader:gt.depth_vert,fragmentShader:gt.depth_frag},normal:{uniforms:wn([Ie.common,Ie.bumpmap,Ie.normalmap,Ie.displacementmap,{opacity:{value:1}}]),vertexShader:gt.meshnormal_vert,fragmentShader:gt.meshnormal_frag},sprite:{uniforms:wn([Ie.sprite,Ie.fog]),vertexShader:gt.sprite_vert,fragmentShader:gt.sprite_frag},background:{uniforms:{uvTransform:{value:new nt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:gt.background_vert,fragmentShader:gt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new nt}},vertexShader:gt.backgroundCube_vert,fragmentShader:gt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:gt.cube_vert,fragmentShader:gt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:gt.equirect_vert,fragmentShader:gt.equirect_frag},distance:{uniforms:wn([Ie.common,Ie.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:gt.distance_vert,fragmentShader:gt.distance_frag},shadow:{uniforms:wn([Ie.lights,Ie.fog,{color:{value:new Ye(0)},opacity:{value:1}}]),vertexShader:gt.shadow_vert,fragmentShader:gt.shadow_frag}};Pn.physical={uniforms:wn([Pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new nt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new nt},clearcoatNormalScale:{value:new xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new nt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new nt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new nt},sheen:{value:0},sheenColor:{value:new Ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new nt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new nt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new nt},transmissionSamplerSize:{value:new xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new nt},attenuationDistance:{value:0},attenuationColor:{value:new Ye(0)},specularColor:{value:new Ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new nt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new nt},anisotropyVector:{value:new xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new nt}}]),vertexShader:gt.meshphysical_vert,fragmentShader:gt.meshphysical_frag};var jc={r:0,b:0,g:0},y_=new zt,ym=new nt;ym.set(-1,0,0,0,1,0,0,0,1);function v_(n,e,t,i,s,r){let o=new Ye(0),a=s===!0?0:1,c,l,u=null,h=0,d=null;function f(M){let E=M.isScene===!0?M.background:null;if(E&&E.isTexture){let v=M.backgroundBlurriness>0;E=e.get(E,v)}return E}function m(M){let E=!1,v=f(M);v===null?g(o,a):v&&v.isColor&&(g(v,1),E=!0);let A=n.xr.getEnvironmentBlendMode();A==="additive"?t.buffers.color.setClear(0,0,0,1,r):A==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(n.autoClear||E)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function x(M,E){let v=f(E);v&&(v.isCubeTexture||v.mapping===_a)?(l===void 0&&(l=new ft(new kr(1,1,1),new St({name:"BackgroundCubeMaterial",uniforms:Qs(Pn.backgroundCube.uniforms),vertexShader:Pn.backgroundCube.vertexShader,fragmentShader:Pn.backgroundCube.fragmentShader,side:xn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(A,C,N){this.matrixWorld.copyPosition(N.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=v,l.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(y_.makeRotationFromEuler(E.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(ym),l.material.toneMapped=yt.getTransfer(v.colorSpace)!==wt,(u!==v||h!==v.version||d!==n.toneMapping)&&(l.material.needsUpdate=!0,u=v,h=v.version,d=n.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new ft(new Cn(2,2),new St({name:"BackgroundMaterial",uniforms:Qs(Pn.background.uniforms),vertexShader:Pn.background.vertexShader,fragmentShader:Pn.background.fragmentShader,side:ji,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.toneMapped=yt.getTransfer(v.colorSpace)!==wt,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||h!==v.version||d!==n.toneMapping)&&(c.material.needsUpdate=!0,u=v,h=v.version,d=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function g(M,E){M.getRGB(jc,Bh(n)),t.buffers.color.setClear(jc.r,jc.g,jc.b,E,r)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(M,E=1){o.set(M),a=E,g(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(M){a=M,g(o,a)},render:m,addToRenderList:x,dispose:p}}function __(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=d(null),r=s,o=!1;function a(k,T,D,ee,j){let G=!1,X=h(k,ee,D,T);r!==X&&(r=X,l(r.object)),G=f(k,ee,D,j),G&&m(k,ee,D,j),j!==null&&e.update(j,n.ELEMENT_ARRAY_BUFFER),(G||o)&&(o=!1,v(k,T,D,ee),j!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(j).buffer))}function c(){return n.createVertexArray()}function l(k){return n.bindVertexArray(k)}function u(k){return n.deleteVertexArray(k)}function h(k,T,D,ee){let j=ee.wireframe===!0,G=i[T.id];G===void 0&&(G={},i[T.id]=G);let X=k.isInstancedMesh===!0?k.id:0,Y=G[X];Y===void 0&&(Y={},G[X]=Y);let me=Y[D.id];me===void 0&&(me={},Y[D.id]=me);let ae=me[j];return ae===void 0&&(ae=d(c()),me[j]=ae),ae}function d(k){let T=[],D=[],ee=[];for(let j=0;j<t;j++)T[j]=0,D[j]=0,ee[j]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:T,enabledAttributes:D,attributeDivisors:ee,object:k,attributes:{},index:null}}function f(k,T,D,ee){let j=r.attributes,G=T.attributes,X=0,Y=D.getAttributes();for(let me in Y)if(Y[me].location>=0){let Te=j[me],Se=G[me];if(Se===void 0&&(me==="instanceMatrix"&&k.instanceMatrix&&(Se=k.instanceMatrix),me==="instanceColor"&&k.instanceColor&&(Se=k.instanceColor)),Te===void 0||Te.attribute!==Se||Se&&Te.data!==Se.data)return!0;X++}return r.attributesNum!==X||r.index!==ee}function m(k,T,D,ee){let j={},G=T.attributes,X=0,Y=D.getAttributes();for(let me in Y)if(Y[me].location>=0){let Te=G[me];Te===void 0&&(me==="instanceMatrix"&&k.instanceMatrix&&(Te=k.instanceMatrix),me==="instanceColor"&&k.instanceColor&&(Te=k.instanceColor));let Se={};Se.attribute=Te,Te&&Te.data&&(Se.data=Te.data),j[me]=Se,X++}r.attributes=j,r.attributesNum=X,r.index=ee}function x(){let k=r.newAttributes;for(let T=0,D=k.length;T<D;T++)k[T]=0}function g(k){p(k,0)}function p(k,T){let D=r.newAttributes,ee=r.enabledAttributes,j=r.attributeDivisors;D[k]=1,ee[k]===0&&(n.enableVertexAttribArray(k),ee[k]=1),j[k]!==T&&(n.vertexAttribDivisor(k,T),j[k]=T)}function M(){let k=r.newAttributes,T=r.enabledAttributes;for(let D=0,ee=T.length;D<ee;D++)T[D]!==k[D]&&(n.disableVertexAttribArray(D),T[D]=0)}function E(k,T,D,ee,j,G,X){X===!0?n.vertexAttribIPointer(k,T,D,j,G):n.vertexAttribPointer(k,T,D,ee,j,G)}function v(k,T,D,ee){x();let j=ee.attributes,G=D.getAttributes(),X=T.defaultAttributeValues;for(let Y in G){let me=G[Y];if(me.location>=0){let ae=j[Y];if(ae===void 0&&(Y==="instanceMatrix"&&k.instanceMatrix&&(ae=k.instanceMatrix),Y==="instanceColor"&&k.instanceColor&&(ae=k.instanceColor)),ae!==void 0){let Te=ae.normalized,Se=ae.itemSize,lt=e.get(ae);if(lt===void 0)continue;let dt=lt.buffer,it=lt.type,he=lt.bytesPerElement,Z=it===n.INT||it===n.UNSIGNED_INT||ae.gpuType===cc;if(ae.isInterleavedBufferAttribute){let O=ae.data,F=O.stride,P=ae.offset;if(O.isInstancedInterleavedBuffer){for(let q=0;q<me.locationSize;q++)p(me.location+q,O.meshPerAttribute);k.isInstancedMesh!==!0&&ee._maxInstanceCount===void 0&&(ee._maxInstanceCount=O.meshPerAttribute*O.count)}else for(let q=0;q<me.locationSize;q++)g(me.location+q);n.bindBuffer(n.ARRAY_BUFFER,dt);for(let q=0;q<me.locationSize;q++)E(me.location+q,Se/me.locationSize,it,Te,F*he,(P+Se/me.locationSize*q)*he,Z)}else{if(ae.isInstancedBufferAttribute){for(let O=0;O<me.locationSize;O++)p(me.location+O,ae.meshPerAttribute);k.isInstancedMesh!==!0&&ee._maxInstanceCount===void 0&&(ee._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let O=0;O<me.locationSize;O++)g(me.location+O);n.bindBuffer(n.ARRAY_BUFFER,dt);for(let O=0;O<me.locationSize;O++)E(me.location+O,Se/me.locationSize,it,Te,Se*he,Se/me.locationSize*O*he,Z)}}else if(X!==void 0){let Te=X[Y];if(Te!==void 0)switch(Te.length){case 2:n.vertexAttrib2fv(me.location,Te);break;case 3:n.vertexAttrib3fv(me.location,Te);break;case 4:n.vertexAttrib4fv(me.location,Te);break;default:n.vertexAttrib1fv(me.location,Te)}}}}M()}function A(){w();for(let k in i){let T=i[k];for(let D in T){let ee=T[D];for(let j in ee){let G=ee[j];for(let X in G)u(G[X].object),delete G[X];delete ee[j]}}delete i[k]}}function C(k){if(i[k.id]===void 0)return;let T=i[k.id];for(let D in T){let ee=T[D];for(let j in ee){let G=ee[j];for(let X in G)u(G[X].object),delete G[X];delete ee[j]}}delete i[k.id]}function N(k){for(let T in i){let D=i[T];for(let ee in D){let j=D[ee];if(j[k.id]===void 0)continue;let G=j[k.id];for(let X in G)u(G[X].object),delete G[X];delete j[k.id]}}}function _(k){for(let T in i){let D=i[T],ee=k.isInstancedMesh===!0?k.id:0,j=D[ee];if(j!==void 0){for(let G in j){let X=j[G];for(let Y in X)u(X[Y].object),delete X[Y];delete j[G]}delete D[ee],Object.keys(D).length===0&&delete i[T]}}}function w(){V(),o=!0,r!==s&&(r=s,l(r.object))}function V(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:w,resetDefaultState:V,dispose:A,releaseStatesOfGeometry:C,releaseStatesOfObject:_,releaseStatesOfProgram:N,initAttributes:x,enableAttribute:g,disableUnusedAttributes:M}}function b_(n,e,t){let i;function s(c){i=c}function r(c,l){n.drawArrays(i,c,l),t.update(l,i,1)}function o(c,l,u){u!==0&&(n.drawArraysInstanced(i,c,l,u),t.update(l,i,u))}function a(c,l,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,u);let d=0;for(let f=0;f<u;f++)d+=l[f];t.update(d,i,1)}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function S_(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let N=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(N.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(N){return!(N!==oi&&i.convert(N)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(N){let _=N===on&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(N!==$n&&i.convert(N)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&N!==yi&&!_)}function c(N){if(N==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";N="mediump"}return N==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",u=c(l);u!==l&&(tt("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);let h=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&tt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),m=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),E=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),A=n.getParameter(n.MAX_SAMPLES),C=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:M,maxVaryings:E,maxFragmentUniforms:v,maxSamples:A,samples:C}}function M_(n){let e=this,t=null,i=0,s=!1,r=!1,o=new ei,a=new nt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){let f=h.length!==0||d||i!==0||s;return s=d,i=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,f){let m=h.clippingPlanes,x=h.clipIntersection,g=h.clipShadows,p=n.get(h);if(!s||m===null||m.length===0||r&&!g)r?u(null):l();else{let M=r?0:i,E=M*4,v=p.clippingState||null;c.value=v,v=u(m,d,E,f);for(let A=0;A!==E;++A)v[A]=t[A];p.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=M}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(h,d,f,m){let x=h!==null?h.length:0,g=null;if(x!==0){if(g=c.value,m!==!0||g===null){let p=f+x*4,M=d.matrixWorldInverse;a.getNormalMatrix(M),(g===null||g.length<p)&&(g=new Float32Array(p));for(let E=0,v=f;E!==x;++E,v+=4)o.copy(h[E]).applyMatrix4(M,a),o.normal.toArray(g,v),g[v+3]=o.constant}c.value=g,c.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,g}}var Rs=4,Yp=[.125,.215,.35,.446,.526,.582],er=20,E_=256,Ca=new is,Zp=new Ye,$h=null,jh=0,Yh=0,Zh=!1,w_=new I,Zc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=w_}=r;$h=this._renderer.getRenderTarget(),jh=this._renderer.getActiveCubeFace(),Yh=this._renderer.getActiveMipmapLevel(),Zh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,s,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Qp(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Kp(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget($h,jh,Yh),this._renderer.xr.enabled=Zh,e.scissorTest=!1,Jr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ts||e.mapping===Ks?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),$h=this._renderer.getRenderTarget(),jh=this._renderer.getActiveCubeFace(),Yh=this._renderer.getActiveMipmapLevel(),Zh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:qt,minFilter:qt,generateMipmaps:!1,type:on,format:oi,colorSpace:Uo,depthBuffer:!1},s=Jp(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Jp(e,t,i);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=T_(r)),this._blurMaterial=C_(r,e,t),this._ggxMaterial=A_(r,e,t)}return s}_compileMaterial(e){let t=new ft(new Tt,e);this._renderer.compile(t,Ca)}_sceneToCubeUV(e,t,i,s,r){let c=new En(90,1,t,i),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,f=h.toneMapping;h.getClearColor(Zp),h.toneMapping=qn,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(s),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ft(new kr,new Ut({name:"PMREM.Background",side:xn,depthWrite:!1,depthTest:!1})));let x=this._backgroundBox,g=x.material,p=!1,M=e.background;M?M.isColor&&(g.color.copy(M),e.background=null,p=!0):(g.color.copy(Zp),p=!0);for(let E=0;E<6;E++){let v=E%3;v===0?(c.up.set(0,l[E],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+u[E],r.y,r.z)):v===1?(c.up.set(0,0,l[E]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+u[E],r.z)):(c.up.set(0,l[E],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+u[E]));let A=this._cubeSize;Jr(s,v*A,E>2?A:0,A,A),h.setRenderTarget(s),p&&h.render(x,c),h.render(e,c)}h.toneMapping=f,h.autoClear=d,e.background=M}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===Ts||e.mapping===Ks;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Qp()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Kp());let r=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=r;let a=r.uniforms;a.envMap.value=e;let c=this._cubeSize;Jr(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(o,Ca)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=i}_applyGGXFilter(e,t,i){let s=this._renderer,r=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;let c=o.uniforms,l=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),h=Math.sqrt(l*l-u*u),d=0+l*1.25,f=h*d,{_lodMax:m}=this,x=this._sizeLods[i],g=3*x*(i>m-Rs?i-m+Rs:0),p=4*(this._cubeSize-x);c.envMap.value=e.texture,c.roughness.value=f,c.mipInt.value=m-t,Jr(r,g,p,3*x,2*x),s.setRenderTarget(r),s.render(a,Ca),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=m-i,Jr(e,g,p,3*x,2*x),s.setRenderTarget(e),s.render(a,Ca)}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&at("blur direction must be either latitudinal or longitudinal!");let u=3,h=this._lodMeshes[s];h.material=l;let d=l.uniforms,f=this._sizeLods[i]-1,m=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*er-1),x=r/m,g=isFinite(r)?1+Math.floor(u*x):er;g>er&&tt(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${er}`);let p=[],M=0;for(let N=0;N<er;++N){let _=N/x,w=Math.exp(-_*_/2);p.push(w),N===0?M+=w:N<g&&(M+=2*w)}for(let N=0;N<p.length;N++)p[N]=p[N]/M;d.envMap.value=e.texture,d.samples.value=g,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:E}=this;d.dTheta.value=m,d.mipInt.value=E-i;let v=this._sizeLods[s],A=3*v*(s>E-Rs?s-E+Rs:0),C=4*(this._cubeSize-v);Jr(t,A,C,3*v,2*v),c.setRenderTarget(t),c.render(h,Ca)}};function T_(n){let e=[],t=[],i=[],s=n,r=n-Rs+1+Yp.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let c=1/a;o>n-Rs?c=Yp[o-n+Rs-1]:o===0&&(c=0),t.push(c);let l=1/(a-2),u=-l,h=1+l,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,m=6,x=3,g=2,p=1,M=new Float32Array(x*m*f),E=new Float32Array(g*m*f),v=new Float32Array(p*m*f);for(let C=0;C<f;C++){let N=C%3*2/3-1,_=C>2?0:-1,w=[N,_,0,N+2/3,_,0,N+2/3,_+1,0,N,_,0,N+2/3,_+1,0,N,_+1,0];M.set(w,x*m*C),E.set(d,g*m*C);let V=[C,C,C,C,C,C];v.set(V,p*m*C)}let A=new Tt;A.setAttribute("position",new en(M,x)),A.setAttribute("uv",new en(E,g)),A.setAttribute("faceIndex",new en(v,p)),i.push(new ft(A,null)),s>Rs&&s--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Jp(n,e,t){let i=new Zt(n,e,t);return i.texture.mapping=_a,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Jr(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function A_(n,e,t){return new St({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:E_,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Qc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function C_(n,e,t){let i=new Float32Array(er),s=new I(0,1,0);return new St({name:"SphericalGaussianBlur",defines:{n:er,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Qc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Kp(){return new St({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Qc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Qp(){return new St({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Qc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Qc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var Jc=class extends Zt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Xo(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new kr(5,5,5),r=new St({name:"CubemapFromEquirect",uniforms:Qs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:xn,blending:Fn});r.uniforms.tEquirect.value=t;let o=new ft(s,r),a=t.minFilter;return t.minFilter===gi&&(t.minFilter=qt),new ic(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}};function R_(n){let e=new WeakMap,t=new WeakMap,i=null;function s(d,f=!1){return d==null?null:f?o(d):r(d)}function r(d){if(d&&d.isTexture){let f=d.mapping;if(f===oc||f===ac)if(e.has(d)){let m=e.get(d).texture;return a(m,d.mapping)}else{let m=d.image;if(m&&m.height>0){let x=new Jc(m.height);return x.fromEquirectangularTexture(n,d),e.set(d,x),d.addEventListener("dispose",l),a(x.texture,d.mapping)}else return null}}return d}function o(d){if(d&&d.isTexture){let f=d.mapping,m=f===oc||f===ac,x=f===Ts||f===Ks;if(m||x){let g=t.get(d),p=g!==void 0?g.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return i===null&&(i=new Zc(n)),g=m?i.fromEquirectangular(d,g):i.fromCubemap(d,g),g.texture.pmremVersion=d.pmremVersion,t.set(d,g),g.texture;if(g!==void 0)return g.texture;{let M=d.image;return m&&M&&M.height>0||x&&M&&c(M)?(i===null&&(i=new Zc(n)),g=m?i.fromEquirectangular(d):i.fromCubemap(d),g.texture.pmremVersion=d.pmremVersion,t.set(d,g),d.addEventListener("dispose",u),g.texture):null}}}return d}function a(d,f){return f===oc?d.mapping=Ts:f===ac&&(d.mapping=Ks),d}function c(d){let f=0,m=6;for(let x=0;x<m;x++)d[x]!==void 0&&f++;return f===m}function l(d){let f=d.target;f.removeEventListener("dispose",l);let m=e.get(f);m!==void 0&&(e.delete(f),m.dispose())}function u(d){let f=d.target;f.removeEventListener("dispose",u);let m=t.get(f);m!==void 0&&(t.delete(f),m.dispose())}function h(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:h}}function P_(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s=n.getExtension(i);return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&Xs("WebGLRenderer: "+i+" extension not supported."),s}}}function I_(n,e,t,i){let s={},r=new WeakMap;function o(h){let d=h.target;d.index!==null&&e.remove(d.index);for(let m in d.attributes)e.remove(d.attributes[m]);d.removeEventListener("dispose",o),delete s[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,t.memory.geometries++),d}function c(h){let d=h.attributes;for(let f in d)e.update(d[f],n.ARRAY_BUFFER)}function l(h){let d=[],f=h.index,m=h.attributes.position,x=0;if(m===void 0)return;if(f!==null){let M=f.array;x=f.version;for(let E=0,v=M.length;E<v;E+=3){let A=M[E+0],C=M[E+1],N=M[E+2];d.push(A,C,C,N,N,A)}}else{let M=m.array;x=m.version;for(let E=0,v=M.length/3-1;E<v;E+=3){let A=E+0,C=E+1,N=E+2;d.push(A,C,C,N,N,A)}}let g=new(m.count>=65535?ko:Ho)(d,1);g.version=x;let p=r.get(h);p&&e.remove(p),r.set(h,g)}function u(h){let d=r.get(h);if(d){let f=h.index;f!==null&&d.version<f.version&&l(h)}else l(h);return r.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function L_(n,e,t){let i;function s(h){i=h}let r,o;function a(h){r=h.type,o=h.bytesPerElement}function c(h,d){n.drawElements(i,d,r,h*o),t.update(d,i,1)}function l(h,d,f){f!==0&&(n.drawElementsInstanced(i,d,r,h*o,f),t.update(d,i,f))}function u(h,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,d,0,r,h,0,f);let x=0;for(let g=0;g<f;g++)x+=d[g];t.update(x,i,1)}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function D_(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:at("WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function N_(n,e,t){let i=new WeakMap,s=new Lt;function r(o,a,c){let l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0,d=i.get(a);if(d===void 0||d.count!==h){let w=function(){N.dispose(),i.delete(a),a.removeEventListener("dispose",w)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],M=a.morphAttributes.color||[],E=0;f===!0&&(E=1),m===!0&&(E=2),x===!0&&(E=3);let v=a.attributes.position.count*E,A=1;v>e.maxTextureSize&&(A=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let C=new Float32Array(v*A*4*h),N=new zo(C,v,A,h);N.type=yi,N.needsUpdate=!0;let _=E*4;for(let V=0;V<h;V++){let k=g[V],T=p[V],D=M[V],ee=v*A*4*V;for(let j=0;j<k.count;j++){let G=j*_;f===!0&&(s.fromBufferAttribute(k,j),C[ee+G+0]=s.x,C[ee+G+1]=s.y,C[ee+G+2]=s.z,C[ee+G+3]=0),m===!0&&(s.fromBufferAttribute(T,j),C[ee+G+4]=s.x,C[ee+G+5]=s.y,C[ee+G+6]=s.z,C[ee+G+7]=0),x===!0&&(s.fromBufferAttribute(D,j),C[ee+G+8]=s.x,C[ee+G+9]=s.y,C[ee+G+10]=s.z,C[ee+G+11]=D.itemSize===4?s.w:1)}}d={count:h,texture:N,size:new xe(v,A)},i.set(a,d),a.addEventListener("dispose",w)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let x=0;x<l.length;x++)f+=l[x];let m=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(n,"morphTargetBaseInfluence",m),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:r}}function U_(n,e,t,i,s){let r=new WeakMap;function o(l){let u=s.render.frame,h=l.geometry,d=e.get(l,h);if(r.get(d)!==u&&(e.update(d),r.set(d,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==u&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,u))),l.isSkinnedMesh){let f=l.skeleton;r.get(f)!==u&&(f.update(),r.set(f,u))}return d}function a(){r=new WeakMap}function c(l){let u=l.target;u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:o,dispose:a}}var F_={[fa]:"LINEAR_TONE_MAPPING",[pa]:"REINHARD_TONE_MAPPING",[ma]:"CINEON_TONE_MAPPING",[ga]:"ACES_FILMIC_TONE_MAPPING",[ya]:"AGX_TONE_MAPPING",[va]:"NEUTRAL_TONE_MAPPING",[xa]:"CUSTOM_TONE_MAPPING"};function O_(n,e,t,i,s,r){let o=new Zt(e,t,{type:n,depthBuffer:s,stencilBuffer:r,samples:i?4:0,depthTexture:s?new es(e,t):void 0}),a=new Zt(e,t,{type:on,depthBuffer:!1,stencilBuffer:!1}),c=new Tt;c.setAttribute("position",new vt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new vt([0,2,0,0,2,0],2));let l=new Wr({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new ft(c,l),h=new is(-1,1,1,-1,0,1),d=null,f=null,m=!1,x,g=null,p=[],M=!1;this.setSize=function(E,v){o.setSize(E,v),a.setSize(E,v);for(let A=0;A<p.length;A++){let C=p[A];C.setSize&&C.setSize(E,v)}},this.setEffects=function(E){p=E,M=p.length>0&&p[0].isRenderPass===!0;let v=o.width,A=o.height;for(let C=0;C<p.length;C++){let N=p[C];N.setSize&&N.setSize(v,A)}},this.begin=function(E,v){if(m||E.toneMapping===qn&&p.length===0)return!1;if(g=v,v!==null){let A=v.width,C=v.height;(o.width!==A||o.height!==C)&&this.setSize(A,C)}return M===!1&&E.setRenderTarget(o),x=E.toneMapping,E.toneMapping=qn,!0},this.hasRenderPass=function(){return M},this.end=function(E,v){E.toneMapping=x,m=!0;let A=o,C=a;for(let N=0;N<p.length;N++){let _=p[N];if(_.enabled!==!1&&(_.render(E,C,A,v),_.needsSwap!==!1)){let w=A;A=C,C=w}}if(d!==E.outputColorSpace||f!==E.toneMapping){d=E.outputColorSpace,f=E.toneMapping,l.defines={},yt.getTransfer(d)===wt&&(l.defines.SRGB_TRANSFER="");let N=F_[f];N&&(l.defines[N]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=A.texture,E.setRenderTarget(g),E.render(u,h),g=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){o.depthTexture&&o.depthTexture.dispose(),o.dispose(),a.dispose(),c.dispose(),l.dispose()}}var vm=new rn,Qh=new es(1,1),_m=new zo,bm=new Ol,Sm=new Xo,em=[],tm=[],nm=new Float32Array(16),im=new Float32Array(9),sm=new Float32Array(4);function Qr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=em[s];if(r===void 0&&(r=new Float32Array(s),em[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function an(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function ln(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function eu(n,e){let t=tm[e];t===void 0&&(t=new Int32Array(e),tm[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function B_(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function z_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(an(t,e))return;n.uniform2fv(this.addr,e),ln(t,e)}}function H_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(an(t,e))return;n.uniform3fv(this.addr,e),ln(t,e)}}function k_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(an(t,e))return;n.uniform4fv(this.addr,e),ln(t,e)}}function V_(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(an(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),ln(t,e)}else{if(an(t,i))return;sm.set(i),n.uniformMatrix2fv(this.addr,!1,sm),ln(t,i)}}function G_(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(an(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),ln(t,e)}else{if(an(t,i))return;im.set(i),n.uniformMatrix3fv(this.addr,!1,im),ln(t,i)}}function W_(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(an(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),ln(t,e)}else{if(an(t,i))return;nm.set(i),n.uniformMatrix4fv(this.addr,!1,nm),ln(t,i)}}function X_(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function q_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(an(t,e))return;n.uniform2iv(this.addr,e),ln(t,e)}}function $_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(an(t,e))return;n.uniform3iv(this.addr,e),ln(t,e)}}function j_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(an(t,e))return;n.uniform4iv(this.addr,e),ln(t,e)}}function Y_(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Z_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(an(t,e))return;n.uniform2uiv(this.addr,e),ln(t,e)}}function J_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(an(t,e))return;n.uniform3uiv(this.addr,e),ln(t,e)}}function K_(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(an(t,e))return;n.uniform4uiv(this.addr,e),ln(t,e)}}function Q_(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Qh.compareFunction=t.isReversedDepthBuffer()?qc:Xc,r=Qh):r=vm,t.setTexture2D(e||r,s)}function eb(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||bm,s)}function tb(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Sm,s)}function nb(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||_m,s)}function ib(n){switch(n){case 5126:return B_;case 35664:return z_;case 35665:return H_;case 35666:return k_;case 35674:return V_;case 35675:return G_;case 35676:return W_;case 5124:case 35670:return X_;case 35667:case 35671:return q_;case 35668:case 35672:return $_;case 35669:case 35673:return j_;case 5125:return Y_;case 36294:return Z_;case 36295:return J_;case 36296:return K_;case 35678:case 36198:case 36298:case 36306:case 35682:return Q_;case 35679:case 36299:case 36307:return eb;case 35680:case 36300:case 36308:case 36293:return tb;case 36289:case 36303:case 36311:case 36292:return nb}}function sb(n,e){n.uniform1fv(this.addr,e)}function rb(n,e){let t=Qr(e,this.size,2);n.uniform2fv(this.addr,t)}function ob(n,e){let t=Qr(e,this.size,3);n.uniform3fv(this.addr,t)}function ab(n,e){let t=Qr(e,this.size,4);n.uniform4fv(this.addr,t)}function lb(n,e){let t=Qr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function cb(n,e){let t=Qr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function ub(n,e){let t=Qr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function hb(n,e){n.uniform1iv(this.addr,e)}function db(n,e){n.uniform2iv(this.addr,e)}function fb(n,e){n.uniform3iv(this.addr,e)}function pb(n,e){n.uniform4iv(this.addr,e)}function mb(n,e){n.uniform1uiv(this.addr,e)}function gb(n,e){n.uniform2uiv(this.addr,e)}function xb(n,e){n.uniform3uiv(this.addr,e)}function yb(n,e){n.uniform4uiv(this.addr,e)}function vb(n,e,t){let i=this.cache,s=e.length,r=eu(t,s);an(i,r)||(n.uniform1iv(this.addr,r),ln(i,r));let o;this.type===n.SAMPLER_2D_SHADOW?o=Qh:o=vm;for(let a=0;a!==s;++a)t.setTexture2D(e[a]||o,r[a])}function _b(n,e,t){let i=this.cache,s=e.length,r=eu(t,s);an(i,r)||(n.uniform1iv(this.addr,r),ln(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||bm,r[o])}function bb(n,e,t){let i=this.cache,s=e.length,r=eu(t,s);an(i,r)||(n.uniform1iv(this.addr,r),ln(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Sm,r[o])}function Sb(n,e,t){let i=this.cache,s=e.length,r=eu(t,s);an(i,r)||(n.uniform1iv(this.addr,r),ln(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||_m,r[o])}function Mb(n){switch(n){case 5126:return sb;case 35664:return rb;case 35665:return ob;case 35666:return ab;case 35674:return lb;case 35675:return cb;case 35676:return ub;case 5124:case 35670:return hb;case 35667:case 35671:return db;case 35668:case 35672:return fb;case 35669:case 35673:return pb;case 5125:return mb;case 36294:return gb;case 36295:return xb;case 36296:return yb;case 35678:case 36198:case 36298:case 36306:case 35682:return vb;case 35679:case 36299:case 36307:return _b;case 35680:case 36300:case 36308:case 36293:return bb;case 36289:case 36303:case 36311:case 36292:return Sb}}var ed=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=ib(t.type)}},td=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Mb(t.type)}},nd=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Jh=/(\w+)(\])?(\[|\.)?/g;function rm(n,e){n.seq.push(e),n.map[e.id]=e}function Eb(n,e,t){let i=n.name,s=i.length;for(Jh.lastIndex=0;;){let r=Jh.exec(i),o=Jh.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){rm(t,l===void 0?new ed(a,n,e):new td(a,n,e));break}else{let h=t.map[a];h===void 0&&(h=new nd(a),rm(t,h)),t=h}}}var Kr=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){let a=e.getActiveUniform(t,o),c=e.getUniformLocation(t,a.name);Eb(a,c,this)}let s=[],r=[];for(let o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(o):r.push(o);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],c=i[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function om(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var wb=37297,Tb=0;function Ab(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var am=new nt;function Cb(n){yt._getMatrix(am,yt.workingColorSpace,n);let e=`mat3( ${am.elements.map(t=>t.toFixed(4))} )`;switch(yt.getTransfer(n)){case Fo:return[e,"LinearTransferOETF"];case wt:return[e,"sRGBTransferOETF"];default:return tt("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function lm(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=(n.getShaderInfoLog(e)||"").trim();if(i&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+Ab(n.getShaderSource(e),a)}else return r}function Rb(n,e){let t=Cb(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var Pb={[fa]:"Linear",[pa]:"Reinhard",[ma]:"Cineon",[ga]:"ACESFilmic",[ya]:"AgX",[va]:"Neutral",[xa]:"Custom"};function Ib(n,e){let t=Pb[e];return t===void 0?(tt("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Yc=new I;function Lb(){yt.getLuminanceCoefficients(Yc);let n=Yc.x.toFixed(4),e=Yc.y.toFixed(4),t=Yc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Db(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Pa).join(`
`)}function Nb(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Ub(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function Pa(n){return n!==""}function cm(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function um(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Fb=/^[ \t]*#include +<([\w\d./]+)>/gm;function id(n){return n.replace(Fb,Bb)}var Ob=new Map;function Bb(n,e){let t=gt[e];if(t===void 0){let i=Ob.get(e);if(i!==void 0)t=gt[i],tt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return id(t)}var zb=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function hm(n){return n.replace(zb,Hb)}function Hb(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function dm(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var kb={[da]:"SHADOWMAP_TYPE_PCF",[$r]:"SHADOWMAP_TYPE_VSM"};function Vb(n){return kb[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Gb={[Ts]:"ENVMAP_TYPE_CUBE",[Ks]:"ENVMAP_TYPE_CUBE",[_a]:"ENVMAP_TYPE_CUBE_UV"};function Wb(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Gb[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var Xb={[Ks]:"ENVMAP_MODE_REFRACTION"};function qb(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Xb[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var $b={[Th]:"ENVMAP_BLENDING_MULTIPLY",[Cp]:"ENVMAP_BLENDING_MIX",[Rp]:"ENVMAP_BLENDING_ADD"};function jb(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":$b[n.combine]||"ENVMAP_BLENDING_NONE"}function Yb(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Zb(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,c=Vb(t),l=Wb(t),u=qb(t),h=jb(t),d=Yb(t),f=Db(t),m=Nb(r),x=s.createProgram(),g,p,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Pa).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Pa).join(`
`),p.length>0&&(p+=`
`)):(g=[dm(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Pa).join(`
`),p=[dm(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==qn?"#define TONE_MAPPING":"",t.toneMapping!==qn?gt.tonemapping_pars_fragment:"",t.toneMapping!==qn?Ib("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",gt.colorspace_pars_fragment,Rb("linearToOutputTexel",t.outputColorSpace),Lb(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Pa).join(`
`)),o=id(o),o=cm(o,t),o=um(o,t),a=id(a),a=cm(a,t),a=um(a,t),o=hm(o),a=hm(a),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",t.glslVersion===Uh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Uh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let E=M+g+o,v=M+p+a,A=om(s,s.VERTEX_SHADER,E),C=om(s,s.FRAGMENT_SHADER,v);s.attachShader(x,A),s.attachShader(x,C),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function N(k){if(n.debug.checkShaderErrors){let T=s.getProgramInfoLog(x)||"",D=s.getShaderInfoLog(A)||"",ee=s.getShaderInfoLog(C)||"",j=T.trim(),G=D.trim(),X=ee.trim(),Y=!0,me=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(Y=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,x,A,C);else{let ae=lm(s,A,"vertex"),Te=lm(s,C,"fragment");at("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+k.name+`
Material Type: `+k.type+`

Program Info Log: `+j+`
`+ae+`
`+Te)}else j!==""?tt("WebGLProgram: Program Info Log:",j):(G===""||X==="")&&(me=!1);me&&(k.diagnostics={runnable:Y,programLog:j,vertexShader:{log:G,prefix:g},fragmentShader:{log:X,prefix:p}})}s.deleteShader(A),s.deleteShader(C),_=new Kr(s,x),w=Ub(s,x)}let _;this.getUniforms=function(){return _===void 0&&N(this),_};let w;this.getAttributes=function(){return w===void 0&&N(this),w};let V=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return V===!1&&(V=s.getProgramParameter(x,wb)),V},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Tb++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=A,this.fragmentShader=C,this}var Jb=0,sd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new rd(e),t.set(e,i)),i}},rd=class{constructor(e){this.id=Jb++,this.code=e,this.usedTimes=0}};function Kb(n){return n===Cs||n===Ta||n===Aa}function Qb(n,e,t,i,s,r){let o=new Or,a=new sd,c=new Set,l=[],u=new Map,h=i.logarithmicDepthBuffer,d=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(_){return c.add(_),_===0?"uv":`uv${_}`}function x(_,w,V,k,T,D){let ee=k.fog,j=T.geometry,G=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?k.environment:null,X=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,Y=e.get(_.envMap||G,X),me=Y&&Y.mapping===_a?Y.image.height:null,ae=f[_.type];_.precision!==null&&(d=i.getMaxPrecision(_.precision),d!==_.precision&&tt("WebGLProgram.getParameters:",_.precision,"not supported, using",d,"instead."));let Te=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,Se=Te!==void 0?Te.length:0,lt=0;j.morphAttributes.position!==void 0&&(lt=1),j.morphAttributes.normal!==void 0&&(lt=2),j.morphAttributes.color!==void 0&&(lt=3);let dt,it,he,Z;if(ae){let $e=Pn[ae];dt=$e.vertexShader,it=$e.fragmentShader}else{dt=_.vertexShader,it=_.fragmentShader;let $e=a.getVertexShaderStage(_),Ot=a.getFragmentShaderStage(_);a.update(_,$e,Ot),he=$e.id,Z=Ot.id}let O=n.getRenderTarget(),F=n.state.buffers.depth.getReversed(),P=T.isInstancedMesh===!0,q=T.isBatchedMesh===!0,ce=!!_.map,pe=!!_.matcap,z=!!Y,oe=!!_.aoMap,J=!!_.lightMap,fe=!!_.bumpMap&&_.wireframe===!1,ye=!!_.normalMap,ve=!!_.displacementMap,Be=!!_.emissiveMap,Ae=!!_.metalnessMap,Q=!!_.roughnessMap,b=_.anisotropy>0,qe=_.clearcoat>0,Ke=_.dispersion>0,R=_.iridescence>0,y=_.sheen>0,B=_.transmission>0,L=b&&!!_.anisotropyMap,U=qe&&!!_.clearcoatMap,ue=qe&&!!_.clearcoatNormalMap,ge=qe&&!!_.clearcoatRoughnessMap,te=R&&!!_.iridescenceMap,le=R&&!!_.iridescenceThicknessMap,Ee=y&&!!_.sheenColorMap,Xe=y&&!!_.sheenRoughnessMap,Re=!!_.specularMap,Ce=!!_.specularColorMap,et=!!_.specularIntensityMap,rt=B&&!!_.transmissionMap,ct=B&&!!_.thicknessMap,$=!!_.gradientMap,Le=!!_.alphaMap,de=_.alphaTest>0,De=!!_.alphaHash,Ue=!!_.extensions,be=qn;_.toneMapped&&(O===null||O.isXRRenderTarget===!0)&&(be=n.toneMapping);let Ze={shaderID:ae,shaderType:_.type,shaderName:_.name,vertexShader:dt,fragmentShader:it,defines:_.defines,customVertexShaderID:he,customFragmentShaderID:Z,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:d,batching:q,batchingColor:q&&T._colorsTexture!==null,instancing:P,instancingColor:P&&T.instanceColor!==null,instancingMorph:P&&T.morphTexture!==null,outputColorSpace:O===null?n.outputColorSpace:O.isXRRenderTarget===!0?O.texture.colorSpace:yt.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:ce,matcap:pe,envMap:z,envMapMode:z&&Y.mapping,envMapCubeUVHeight:me,aoMap:oe,lightMap:J,bumpMap:fe,normalMap:ye,displacementMap:ve,emissiveMap:Be,normalMapObjectSpace:ye&&_.normalMapType===Lp,normalMapTangentSpace:ye&&_.normalMapType===Nh,packedNormalMap:ye&&_.normalMapType===Nh&&Kb(_.normalMap.format),metalnessMap:Ae,roughnessMap:Q,anisotropy:b,anisotropyMap:L,clearcoat:qe,clearcoatMap:U,clearcoatNormalMap:ue,clearcoatRoughnessMap:ge,dispersion:Ke,iridescence:R,iridescenceMap:te,iridescenceThicknessMap:le,sheen:y,sheenColorMap:Ee,sheenRoughnessMap:Xe,specularMap:Re,specularColorMap:Ce,specularIntensityMap:et,transmission:B,transmissionMap:rt,thicknessMap:ct,gradientMap:$,opaque:_.transparent===!1&&_.blending===ti&&_.alphaToCoverage===!1,alphaMap:Le,alphaTest:de,alphaHash:De,combine:_.combine,mapUv:ce&&m(_.map.channel),aoMapUv:oe&&m(_.aoMap.channel),lightMapUv:J&&m(_.lightMap.channel),bumpMapUv:fe&&m(_.bumpMap.channel),normalMapUv:ye&&m(_.normalMap.channel),displacementMapUv:ve&&m(_.displacementMap.channel),emissiveMapUv:Be&&m(_.emissiveMap.channel),metalnessMapUv:Ae&&m(_.metalnessMap.channel),roughnessMapUv:Q&&m(_.roughnessMap.channel),anisotropyMapUv:L&&m(_.anisotropyMap.channel),clearcoatMapUv:U&&m(_.clearcoatMap.channel),clearcoatNormalMapUv:ue&&m(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&m(_.clearcoatRoughnessMap.channel),iridescenceMapUv:te&&m(_.iridescenceMap.channel),iridescenceThicknessMapUv:le&&m(_.iridescenceThicknessMap.channel),sheenColorMapUv:Ee&&m(_.sheenColorMap.channel),sheenRoughnessMapUv:Xe&&m(_.sheenRoughnessMap.channel),specularMapUv:Re&&m(_.specularMap.channel),specularColorMapUv:Ce&&m(_.specularColorMap.channel),specularIntensityMapUv:et&&m(_.specularIntensityMap.channel),transmissionMapUv:rt&&m(_.transmissionMap.channel),thicknessMapUv:ct&&m(_.thicknessMap.channel),alphaMapUv:Le&&m(_.alphaMap.channel),vertexTangents:!!j.attributes.tangent&&(ye||b),vertexNormals:!!j.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,pointsUvs:T.isPoints===!0&&!!j.attributes.uv&&(ce||Le),fog:!!ee,useFog:_.fog===!0,fogExp2:!!ee&&ee.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||j.attributes.normal===void 0&&ye===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:F,skinning:T.isSkinnedMesh===!0,hasPositionAttribute:j.attributes.position!==void 0,morphTargets:j.morphAttributes.position!==void 0,morphNormals:j.morphAttributes.normal!==void 0,morphColors:j.morphAttributes.color!==void 0,morphTargetsCount:Se,morphTextureStride:lt,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:D.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&V.length>0,shadowMapType:n.shadowMap.type,toneMapping:be,decodeVideoTexture:ce&&_.map.isVideoTexture===!0&&yt.getTransfer(_.map.colorSpace)===wt,decodeVideoTextureEmissive:Be&&_.emissiveMap.isVideoTexture===!0&&yt.getTransfer(_.emissiveMap.colorSpace)===wt,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Ft,flipSided:_.side===xn,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:Ue&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ue&&_.extensions.multiDraw===!0||q)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Ze.vertexUv1s=c.has(1),Ze.vertexUv2s=c.has(2),Ze.vertexUv3s=c.has(3),c.clear(),Ze}function g(_){let w=[];if(_.shaderID?w.push(_.shaderID):(w.push(_.customVertexShaderID),w.push(_.customFragmentShaderID)),_.defines!==void 0)for(let V in _.defines)w.push(V),w.push(_.defines[V]);return _.isRawShaderMaterial===!1&&(p(w,_),M(w,_),w.push(n.outputColorSpace)),w.push(_.customProgramCacheKey),w.join()}function p(_,w){_.push(w.precision),_.push(w.outputColorSpace),_.push(w.envMapMode),_.push(w.envMapCubeUVHeight),_.push(w.mapUv),_.push(w.alphaMapUv),_.push(w.lightMapUv),_.push(w.aoMapUv),_.push(w.bumpMapUv),_.push(w.normalMapUv),_.push(w.displacementMapUv),_.push(w.emissiveMapUv),_.push(w.metalnessMapUv),_.push(w.roughnessMapUv),_.push(w.anisotropyMapUv),_.push(w.clearcoatMapUv),_.push(w.clearcoatNormalMapUv),_.push(w.clearcoatRoughnessMapUv),_.push(w.iridescenceMapUv),_.push(w.iridescenceThicknessMapUv),_.push(w.sheenColorMapUv),_.push(w.sheenRoughnessMapUv),_.push(w.specularMapUv),_.push(w.specularColorMapUv),_.push(w.specularIntensityMapUv),_.push(w.transmissionMapUv),_.push(w.thicknessMapUv),_.push(w.combine),_.push(w.fogExp2),_.push(w.sizeAttenuation),_.push(w.morphTargetsCount),_.push(w.morphAttributeCount),_.push(w.numDirLights),_.push(w.numPointLights),_.push(w.numSpotLights),_.push(w.numSpotLightMaps),_.push(w.numHemiLights),_.push(w.numRectAreaLights),_.push(w.numDirLightShadows),_.push(w.numPointLightShadows),_.push(w.numSpotLightShadows),_.push(w.numSpotLightShadowsWithMaps),_.push(w.numLightProbes),_.push(w.shadowMapType),_.push(w.toneMapping),_.push(w.numClippingPlanes),_.push(w.numClipIntersection),_.push(w.depthPacking)}function M(_,w){o.disableAll(),w.instancing&&o.enable(0),w.instancingColor&&o.enable(1),w.instancingMorph&&o.enable(2),w.matcap&&o.enable(3),w.envMap&&o.enable(4),w.normalMapObjectSpace&&o.enable(5),w.normalMapTangentSpace&&o.enable(6),w.clearcoat&&o.enable(7),w.iridescence&&o.enable(8),w.alphaTest&&o.enable(9),w.vertexColors&&o.enable(10),w.vertexAlphas&&o.enable(11),w.vertexUv1s&&o.enable(12),w.vertexUv2s&&o.enable(13),w.vertexUv3s&&o.enable(14),w.vertexTangents&&o.enable(15),w.anisotropy&&o.enable(16),w.alphaHash&&o.enable(17),w.batching&&o.enable(18),w.dispersion&&o.enable(19),w.batchingColor&&o.enable(20),w.gradientMap&&o.enable(21),w.packedNormalMap&&o.enable(22),w.vertexNormals&&o.enable(23),_.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.reversedDepthBuffer&&o.enable(4),w.skinning&&o.enable(5),w.morphTargets&&o.enable(6),w.morphNormals&&o.enable(7),w.morphColors&&o.enable(8),w.premultipliedAlpha&&o.enable(9),w.shadowMapEnabled&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),w.decodeVideoTextureEmissive&&o.enable(20),w.alphaToCoverage&&o.enable(21),w.numLightProbeGrids>0&&o.enable(22),w.hasPositionAttribute&&o.enable(23),_.push(o.mask)}function E(_){let w=f[_.type],V;if(w){let k=Pn[w];V=Rn.clone(k.uniforms)}else V=_.uniforms;return V}function v(_,w){let V=u.get(w);return V!==void 0?++V.usedTimes:(V=new Zb(n,w,_,s),l.push(V),u.set(w,V)),V}function A(_){if(--_.usedTimes===0){let w=l.indexOf(_);l[w]=l[l.length-1],l.pop(),u.delete(_.cacheKey),_.destroy()}}function C(_){a.remove(_)}function N(){a.dispose()}return{getParameters:x,getProgramCacheKey:g,getUniforms:E,acquireProgram:v,releaseProgram:A,releaseShaderCache:C,programs:l,dispose:N}}function eS(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,c){n.get(o)[a]=c}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function tS(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function fm(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function pm(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function a(d,f,m,x,g,p){let M=n[e];return M===void 0?(M={id:d.id,object:d,geometry:f,material:m,materialVariant:o(d),groupOrder:x,renderOrder:d.renderOrder,z:g,group:p},n[e]=M):(M.id=d.id,M.object=d,M.geometry=f,M.material=m,M.materialVariant=o(d),M.groupOrder=x,M.renderOrder=d.renderOrder,M.z=g,M.group=p),e++,M}function c(d,f,m,x,g,p){let M=a(d,f,m,x,g,p);m.transmission>0?i.push(M):m.transparent===!0?s.push(M):t.push(M)}function l(d,f,m,x,g,p){let M=a(d,f,m,x,g,p);m.transmission>0?i.unshift(M):m.transparent===!0?s.unshift(M):t.unshift(M)}function u(d,f,m){t.length>1&&t.sort(d||tS),i.length>1&&i.sort(f||fm),s.length>1&&s.sort(f||fm),m&&(t.reverse(),i.reverse(),s.reverse())}function h(){for(let d=e,f=n.length;d<f;d++){let m=n[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:c,unshift:l,finish:h,sort:u}}function nS(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new pm,n.set(i,[o])):s>=r.length?(o=new pm,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function iS(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new I,color:new Ye};break;case"SpotLight":t={position:new I,direction:new I,color:new Ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new Ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new Ye,groundColor:new Ye};break;case"RectAreaLight":t={color:new Ye,position:new I,halfWidth:new I,halfHeight:new I};break}return n[e.id]=t,t}}}function sS(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var rS=0;function oS(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function aS(n){let e=new iS,t=sS(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new I);let s=new I,r=new zt,o=new zt;function a(l){let u=0,h=0,d=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let f=0,m=0,x=0,g=0,p=0,M=0,E=0,v=0,A=0,C=0,N=0;l.sort(oS);for(let w=0,V=l.length;w<V;w++){let k=l[w],T=k.color,D=k.intensity,ee=k.distance,j=null;if(k.shadow&&k.shadow.map&&(k.shadow.map.texture.format===Cs?j=k.shadow.map.texture:j=k.shadow.map.depthTexture||k.shadow.map.texture),k.isAmbientLight)u+=T.r*D,h+=T.g*D,d+=T.b*D;else if(k.isLightProbe){for(let G=0;G<9;G++)i.probe[G].addScaledVector(k.sh.coefficients[G],D);N++}else if(k.isDirectionalLight){let G=e.get(k);if(G.color.copy(k.color).multiplyScalar(k.intensity),k.castShadow){let X=k.shadow,Y=t.get(k);Y.shadowIntensity=X.intensity,Y.shadowBias=X.bias,Y.shadowNormalBias=X.normalBias,Y.shadowRadius=X.radius,Y.shadowMapSize=X.mapSize,i.directionalShadow[f]=Y,i.directionalShadowMap[f]=j,i.directionalShadowMatrix[f]=k.shadow.matrix,M++}i.directional[f]=G,f++}else if(k.isSpotLight){let G=e.get(k);G.position.setFromMatrixPosition(k.matrixWorld),G.color.copy(T).multiplyScalar(D),G.distance=ee,G.coneCos=Math.cos(k.angle),G.penumbraCos=Math.cos(k.angle*(1-k.penumbra)),G.decay=k.decay,i.spot[x]=G;let X=k.shadow;if(k.map&&(i.spotLightMap[A]=k.map,A++,X.updateMatrices(k),k.castShadow&&C++),i.spotLightMatrix[x]=X.matrix,k.castShadow){let Y=t.get(k);Y.shadowIntensity=X.intensity,Y.shadowBias=X.bias,Y.shadowNormalBias=X.normalBias,Y.shadowRadius=X.radius,Y.shadowMapSize=X.mapSize,i.spotShadow[x]=Y,i.spotShadowMap[x]=j,v++}x++}else if(k.isRectAreaLight){let G=e.get(k);G.color.copy(T).multiplyScalar(D),G.halfWidth.set(k.width*.5,0,0),G.halfHeight.set(0,k.height*.5,0),i.rectArea[g]=G,g++}else if(k.isPointLight){let G=e.get(k);if(G.color.copy(k.color).multiplyScalar(k.intensity),G.distance=k.distance,G.decay=k.decay,k.castShadow){let X=k.shadow,Y=t.get(k);Y.shadowIntensity=X.intensity,Y.shadowBias=X.bias,Y.shadowNormalBias=X.normalBias,Y.shadowRadius=X.radius,Y.shadowMapSize=X.mapSize,Y.shadowCameraNear=X.camera.near,Y.shadowCameraFar=X.camera.far,i.pointShadow[m]=Y,i.pointShadowMap[m]=j,i.pointShadowMatrix[m]=k.shadow.matrix,E++}i.point[m]=G,m++}else if(k.isHemisphereLight){let G=e.get(k);G.skyColor.copy(k.color).multiplyScalar(D),G.groundColor.copy(k.groundColor).multiplyScalar(D),i.hemi[p]=G,p++}}g>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Ie.LTC_FLOAT_1,i.rectAreaLTC2=Ie.LTC_FLOAT_2):(i.rectAreaLTC1=Ie.LTC_HALF_1,i.rectAreaLTC2=Ie.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=h,i.ambient[2]=d;let _=i.hash;(_.directionalLength!==f||_.pointLength!==m||_.spotLength!==x||_.rectAreaLength!==g||_.hemiLength!==p||_.numDirectionalShadows!==M||_.numPointShadows!==E||_.numSpotShadows!==v||_.numSpotMaps!==A||_.numLightProbes!==N)&&(i.directional.length=f,i.spot.length=x,i.rectArea.length=g,i.point.length=m,i.hemi.length=p,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=E,i.pointShadowMap.length=E,i.spotShadow.length=v,i.spotShadowMap.length=v,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=E,i.spotLightMatrix.length=v+A-C,i.spotLightMap.length=A,i.numSpotLightShadowsWithMaps=C,i.numLightProbes=N,_.directionalLength=f,_.pointLength=m,_.spotLength=x,_.rectAreaLength=g,_.hemiLength=p,_.numDirectionalShadows=M,_.numPointShadows=E,_.numSpotShadows=v,_.numSpotMaps=A,_.numLightProbes=N,i.version=rS++)}function c(l,u){let h=0,d=0,f=0,m=0,x=0,g=u.matrixWorldInverse;for(let p=0,M=l.length;p<M;p++){let E=l[p];if(E.isDirectionalLight){let v=i.directional[h];v.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(g),h++}else if(E.isSpotLight){let v=i.spot[f];v.position.setFromMatrixPosition(E.matrixWorld),v.position.applyMatrix4(g),v.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(g),f++}else if(E.isRectAreaLight){let v=i.rectArea[m];v.position.setFromMatrixPosition(E.matrixWorld),v.position.applyMatrix4(g),o.identity(),r.copy(E.matrixWorld),r.premultiply(g),o.extractRotation(r),v.halfWidth.set(E.width*.5,0,0),v.halfHeight.set(0,E.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),m++}else if(E.isPointLight){let v=i.point[d];v.position.setFromMatrixPosition(E.matrixWorld),v.position.applyMatrix4(g),d++}else if(E.isHemisphereLight){let v=i.hemi[x];v.direction.setFromMatrixPosition(E.matrixWorld),v.direction.transformDirection(g),x++}}}return{setup:a,setupView:c,state:i}}function mm(n){let e=new aS(n),t=[],i=[],s=[];function r(d){h.camera=d,t.length=0,i.length=0,s.length=0}function o(d){t.push(d)}function a(d){i.push(d)}function c(d){s.push(d)}function l(){e.setup(t)}function u(d){e.setupView(t,d)}let h={lightsArray:t,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function lS(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new mm(n),e.set(s,[a])):r>=o.length?(a=new mm(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var cS=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,uS=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,hS=[new I(1,0,0),new I(-1,0,0),new I(0,1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1)],dS=[new I(0,-1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1),new I(0,-1,0),new I(0,-1,0)],gm=new zt,Ra=new I,Kh=new I;function fS(n,e,t){let i=new Go,s=new xe,r=new xe,o=new Lt,a=new Xl,c=new ql,l={},u=t.maxTextureSize,h={[ji]:xn,[xn]:ji,[Ft]:Ft},d=new St({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new xe},radius:{value:4}},vertexShader:cS,fragmentShader:uS}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let m=new Tt;m.setAttribute("position",new en(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new ft(m,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=da;let p=this.type;this.render=function(C,N,_){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||C.length===0)return;this.type===cp&&(tt("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=da);let w=n.getRenderTarget(),V=n.getActiveCubeFace(),k=n.getActiveMipmapLevel(),T=n.state;T.setBlending(Fn),T.buffers.depth.getReversed()===!0?T.buffers.color.setClear(0,0,0,0):T.buffers.color.setClear(1,1,1,1),T.buffers.depth.setTest(!0),T.setScissorTest(!1);let D=p!==this.type;D&&N.traverse(function(ee){ee.material&&(Array.isArray(ee.material)?ee.material.forEach(j=>j.needsUpdate=!0):ee.material.needsUpdate=!0)});for(let ee=0,j=C.length;ee<j;ee++){let G=C[ee],X=G.shadow;if(X===void 0){tt("WebGLShadowMap:",G,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;s.copy(X.mapSize);let Y=X.getFrameExtents();s.multiply(Y),r.copy(X.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/Y.x),s.x=r.x*Y.x,X.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/Y.y),s.y=r.y*Y.y,X.mapSize.y=r.y));let me=n.state.buffers.depth.getReversed();if(X.camera._reversedDepth=me,X.map===null||D===!0){if(X.map!==null&&(X.map.depthTexture!==null&&(X.map.depthTexture.dispose(),X.map.depthTexture=null),X.map.dispose()),this.type===$r){if(G.isPointLight){tt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}X.map=new Zt(s.x,s.y,{format:Cs,type:on,minFilter:qt,magFilter:qt,generateMipmaps:!1}),X.map.texture.name=G.name+".shadowMap",X.map.depthTexture=new es(s.x,s.y,yi),X.map.depthTexture.name=G.name+".shadowMapDepth",X.map.depthTexture.format=Ai,X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=pn,X.map.depthTexture.magFilter=pn}else G.isPointLight?(X.map=new Jc(s.x),X.map.depthTexture=new Hl(s.x,xi)):(X.map=new Zt(s.x,s.y),X.map.depthTexture=new es(s.x,s.y,xi)),X.map.depthTexture.name=G.name+".shadowMap",X.map.depthTexture.format=Ai,this.type===da?(X.map.depthTexture.compareFunction=me?qc:Xc,X.map.depthTexture.minFilter=qt,X.map.depthTexture.magFilter=qt):(X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=pn,X.map.depthTexture.magFilter=pn);X.camera.updateProjectionMatrix()}let ae=X.map.isWebGLCubeRenderTarget?6:1;for(let Te=0;Te<ae;Te++){if(X.map.isWebGLCubeRenderTarget)n.setRenderTarget(X.map,Te),n.clear();else{Te===0&&(n.setRenderTarget(X.map),n.clear());let Se=X.getViewport(Te);o.set(r.x*Se.x,r.y*Se.y,r.x*Se.z,r.y*Se.w),T.viewport(o)}if(G.isPointLight){let Se=X.camera,lt=X.matrix,dt=G.distance||Se.far;dt!==Se.far&&(Se.far=dt,Se.updateProjectionMatrix()),Ra.setFromMatrixPosition(G.matrixWorld),Se.position.copy(Ra),Kh.copy(Se.position),Kh.add(hS[Te]),Se.up.copy(dS[Te]),Se.lookAt(Kh),Se.updateMatrixWorld(),lt.makeTranslation(-Ra.x,-Ra.y,-Ra.z),gm.multiplyMatrices(Se.projectionMatrix,Se.matrixWorldInverse),X._frustum.setFromProjectionMatrix(gm,Se.coordinateSystem,Se.reversedDepth)}else X.updateMatrices(G);i=X.getFrustum(),v(N,_,X.camera,G,this.type)}X.isPointLightShadow!==!0&&this.type===$r&&M(X,_),X.needsUpdate=!1}p=this.type,g.needsUpdate=!1,n.setRenderTarget(w,V,k)};function M(C,N){let _=e.update(x);d.defines.VSM_SAMPLES!==C.blurSamples&&(d.defines.VSM_SAMPLES=C.blurSamples,f.defines.VSM_SAMPLES=C.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new Zt(s.x,s.y,{format:Cs,type:on})),d.uniforms.shadow_pass.value=C.map.depthTexture,d.uniforms.resolution.value=C.mapSize,d.uniforms.radius.value=C.radius,n.setRenderTarget(C.mapPass),n.clear(),n.renderBufferDirect(N,null,_,d,x,null),f.uniforms.shadow_pass.value=C.mapPass.texture,f.uniforms.resolution.value=C.mapSize,f.uniforms.radius.value=C.radius,n.setRenderTarget(C.map),n.clear(),n.renderBufferDirect(N,null,_,f,x,null)}function E(C,N,_,w){let V=null,k=_.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(k!==void 0)V=k;else if(V=_.isPointLight===!0?c:a,n.localClippingEnabled&&N.clipShadows===!0&&Array.isArray(N.clippingPlanes)&&N.clippingPlanes.length!==0||N.displacementMap&&N.displacementScale!==0||N.alphaMap&&N.alphaTest>0||N.map&&N.alphaTest>0||N.alphaToCoverage===!0){let T=V.uuid,D=N.uuid,ee=l[T];ee===void 0&&(ee={},l[T]=ee);let j=ee[D];j===void 0&&(j=V.clone(),ee[D]=j,N.addEventListener("dispose",A)),V=j}if(V.visible=N.visible,V.wireframe=N.wireframe,w===$r?V.side=N.shadowSide!==null?N.shadowSide:N.side:V.side=N.shadowSide!==null?N.shadowSide:h[N.side],V.alphaMap=N.alphaMap,V.alphaTest=N.alphaToCoverage===!0?.5:N.alphaTest,V.map=N.map,V.clipShadows=N.clipShadows,V.clippingPlanes=N.clippingPlanes,V.clipIntersection=N.clipIntersection,V.displacementMap=N.displacementMap,V.displacementScale=N.displacementScale,V.displacementBias=N.displacementBias,V.wireframeLinewidth=N.wireframeLinewidth,V.linewidth=N.linewidth,_.isPointLight===!0&&V.isMeshDistanceMaterial===!0){let T=n.properties.get(V);T.light=_}return V}function v(C,N,_,w,V){if(C.visible===!1)return;if(C.layers.test(N.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&V===$r)&&(!C.frustumCulled||i.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,C.matrixWorld);let D=e.update(C),ee=C.material;if(Array.isArray(ee)){let j=D.groups;for(let G=0,X=j.length;G<X;G++){let Y=j[G],me=ee[Y.materialIndex];if(me&&me.visible){let ae=E(C,me,w,V);C.onBeforeShadow(n,C,N,_,D,ae,Y),n.renderBufferDirect(_,null,D,ae,C,Y),C.onAfterShadow(n,C,N,_,D,ae,Y)}}}else if(ee.visible){let j=E(C,ee,w,V);C.onBeforeShadow(n,C,N,_,D,j,null),n.renderBufferDirect(_,null,D,j,C,null),C.onAfterShadow(n,C,N,_,D,j,null)}}let T=C.children;for(let D=0,ee=T.length;D<ee;D++)v(T[D],N,_,w,V)}function A(C){C.target.removeEventListener("dispose",A);for(let _ in l){let w=l[_],V=C.target.uuid;V in w&&(w[V].dispose(),delete w[V])}}}function pS(n,e){function t(){let $=!1,Le=new Lt,de=null,De=new Lt(0,0,0,0);return{setMask:function(Ue){de!==Ue&&!$&&(n.colorMask(Ue,Ue,Ue,Ue),de=Ue)},setLocked:function(Ue){$=Ue},setClear:function(Ue,be,Ze,$e,Ot){Ot===!0&&(Ue*=$e,be*=$e,Ze*=$e),Le.set(Ue,be,Ze,$e),De.equals(Le)===!1&&(n.clearColor(Ue,be,Ze,$e),De.copy(Le))},reset:function(){$=!1,de=null,De.set(-1,0,0,0)}}}function i(){let $=!1,Le=!1,de=null,De=null,Ue=null;return{setReversed:function(be){if(Le!==be){let Ze=e.get("EXT_clip_control");be?Ze.clipControlEXT(Ze.LOWER_LEFT_EXT,Ze.ZERO_TO_ONE_EXT):Ze.clipControlEXT(Ze.LOWER_LEFT_EXT,Ze.NEGATIVE_ONE_TO_ONE_EXT),Le=be;let $e=Ue;Ue=null,this.setClear($e)}},getReversed:function(){return Le},setTest:function(be){be?O(n.DEPTH_TEST):F(n.DEPTH_TEST)},setMask:function(be){de!==be&&!$&&(n.depthMask(be),de=be)},setFunc:function(be){if(Le&&(be=Vp[be]),De!==be){switch(be){case Tl:n.depthFunc(n.NEVER);break;case Al:n.depthFunc(n.ALWAYS);break;case Cl:n.depthFunc(n.LESS);break;case qs:n.depthFunc(n.LEQUAL);break;case Rl:n.depthFunc(n.EQUAL);break;case Pl:n.depthFunc(n.GEQUAL);break;case Il:n.depthFunc(n.GREATER);break;case Ll:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}De=be}},setLocked:function(be){$=be},setClear:function(be){Ue!==be&&(Ue=be,Le&&(be=1-be),n.clearDepth(be))},reset:function(){$=!1,de=null,De=null,Ue=null,Le=!1}}}function s(){let $=!1,Le=null,de=null,De=null,Ue=null,be=null,Ze=null,$e=null,Ot=null;return{setTest:function(_t){$||(_t?O(n.STENCIL_TEST):F(n.STENCIL_TEST))},setMask:function(_t){Le!==_t&&!$&&(n.stencilMask(_t),Le=_t)},setFunc:function(_t,zn,Hn){(de!==_t||De!==zn||Ue!==Hn)&&(n.stencilFunc(_t,zn,Hn),de=_t,De=zn,Ue=Hn)},setOp:function(_t,zn,Hn){(be!==_t||Ze!==zn||$e!==Hn)&&(n.stencilOp(_t,zn,Hn),be=_t,Ze=zn,$e=Hn)},setLocked:function(_t){$=_t},setClear:function(_t){Ot!==_t&&(n.clearStencil(_t),Ot=_t)},reset:function(){$=!1,Le=null,de=null,De=null,Ue=null,be=null,Ze=null,$e=null,Ot=null}}}let r=new t,o=new i,a=new s,c=new WeakMap,l=new WeakMap,u={},h={},d={},f=new WeakMap,m=[],x=null,g=!1,p=null,M=null,E=null,v=null,A=null,C=null,N=null,_=new Ye(0,0,0),w=0,V=!1,k=null,T=null,D=null,ee=null,j=null,G=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),X=!1,Y=0,me=n.getParameter(n.VERSION);me.indexOf("WebGL")!==-1?(Y=parseFloat(/^WebGL (\d)/.exec(me)[1]),X=Y>=1):me.indexOf("OpenGL ES")!==-1&&(Y=parseFloat(/^OpenGL ES (\d)/.exec(me)[1]),X=Y>=2);let ae=null,Te={},Se=n.getParameter(n.SCISSOR_BOX),lt=n.getParameter(n.VIEWPORT),dt=new Lt().fromArray(Se),it=new Lt().fromArray(lt);function he($,Le,de,De){let Ue=new Uint8Array(4),be=n.createTexture();n.bindTexture($,be),n.texParameteri($,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri($,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ze=0;Ze<de;Ze++)$===n.TEXTURE_3D||$===n.TEXTURE_2D_ARRAY?n.texImage3D(Le,0,n.RGBA,1,1,De,0,n.RGBA,n.UNSIGNED_BYTE,Ue):n.texImage2D(Le+Ze,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ue);return be}let Z={};Z[n.TEXTURE_2D]=he(n.TEXTURE_2D,n.TEXTURE_2D,1),Z[n.TEXTURE_CUBE_MAP]=he(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[n.TEXTURE_2D_ARRAY]=he(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Z[n.TEXTURE_3D]=he(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),O(n.DEPTH_TEST),o.setFunc(qs),fe(!1),ye(Mh),O(n.CULL_FACE),oe(Fn);function O($){u[$]!==!0&&(n.enable($),u[$]=!0)}function F($){u[$]!==!1&&(n.disable($),u[$]=!1)}function P($,Le){return d[$]!==Le?(n.bindFramebuffer($,Le),d[$]=Le,$===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=Le),$===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=Le),!0):!1}function q($,Le){let de=m,De=!1;if($){de=f.get(Le),de===void 0&&(de=[],f.set(Le,de));let Ue=$.textures;if(de.length!==Ue.length||de[0]!==n.COLOR_ATTACHMENT0){for(let be=0,Ze=Ue.length;be<Ze;be++)de[be]=n.COLOR_ATTACHMENT0+be;de.length=Ue.length,De=!0}}else de[0]!==n.BACK&&(de[0]=n.BACK,De=!0);De&&n.drawBuffers(de)}function ce($){return x!==$?(n.useProgram($),x=$,!0):!1}let pe={[ys]:n.FUNC_ADD,[hp]:n.FUNC_SUBTRACT,[dp]:n.FUNC_REVERSE_SUBTRACT};pe[fp]=n.MIN,pe[pp]=n.MAX;let z={[mp]:n.ZERO,[gp]:n.ONE,[xp]:n.SRC_COLOR,[El]:n.SRC_ALPHA,[Mp]:n.SRC_ALPHA_SATURATE,[bp]:n.DST_COLOR,[vp]:n.DST_ALPHA,[yp]:n.ONE_MINUS_SRC_COLOR,[wl]:n.ONE_MINUS_SRC_ALPHA,[Sp]:n.ONE_MINUS_DST_COLOR,[_p]:n.ONE_MINUS_DST_ALPHA,[Ep]:n.CONSTANT_COLOR,[wp]:n.ONE_MINUS_CONSTANT_COLOR,[Tp]:n.CONSTANT_ALPHA,[Ap]:n.ONE_MINUS_CONSTANT_ALPHA};function oe($,Le,de,De,Ue,be,Ze,$e,Ot,_t){if($===Fn){g===!0&&(F(n.BLEND),g=!1);return}if(g===!1&&(O(n.BLEND),g=!0),$!==up){if($!==p||_t!==V){if((M!==ys||A!==ys)&&(n.blendEquation(n.FUNC_ADD),M=ys,A=ys),_t)switch($){case ti:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case mn:n.blendFunc(n.ONE,n.ONE);break;case Eh:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case wh:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:at("WebGLState: Invalid blending: ",$);break}else switch($){case ti:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case mn:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Eh:at("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case wh:at("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:at("WebGLState: Invalid blending: ",$);break}E=null,v=null,C=null,N=null,_.set(0,0,0),w=0,p=$,V=_t}return}Ue=Ue||Le,be=be||de,Ze=Ze||De,(Le!==M||Ue!==A)&&(n.blendEquationSeparate(pe[Le],pe[Ue]),M=Le,A=Ue),(de!==E||De!==v||be!==C||Ze!==N)&&(n.blendFuncSeparate(z[de],z[De],z[be],z[Ze]),E=de,v=De,C=be,N=Ze),($e.equals(_)===!1||Ot!==w)&&(n.blendColor($e.r,$e.g,$e.b,Ot),_.copy($e),w=Ot),p=$,V=!1}function J($,Le){$.side===Ft?F(n.CULL_FACE):O(n.CULL_FACE);let de=$.side===xn;Le&&(de=!de),fe(de),$.blending===ti&&$.transparent===!1?oe(Fn):oe($.blending,$.blendEquation,$.blendSrc,$.blendDst,$.blendEquationAlpha,$.blendSrcAlpha,$.blendDstAlpha,$.blendColor,$.blendAlpha,$.premultipliedAlpha),o.setFunc($.depthFunc),o.setTest($.depthTest),o.setMask($.depthWrite),r.setMask($.colorWrite);let De=$.stencilWrite;a.setTest(De),De&&(a.setMask($.stencilWriteMask),a.setFunc($.stencilFunc,$.stencilRef,$.stencilFuncMask),a.setOp($.stencilFail,$.stencilZFail,$.stencilZPass)),Be($.polygonOffset,$.polygonOffsetFactor,$.polygonOffsetUnits),$.alphaToCoverage===!0?O(n.SAMPLE_ALPHA_TO_COVERAGE):F(n.SAMPLE_ALPHA_TO_COVERAGE)}function fe($){k!==$&&($?n.frontFace(n.CW):n.frontFace(n.CCW),k=$)}function ye($){$!==ap?(O(n.CULL_FACE),$!==T&&($===Mh?n.cullFace(n.BACK):$===lp?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):F(n.CULL_FACE),T=$}function ve($){$!==D&&(X&&n.lineWidth($),D=$)}function Be($,Le,de){$?(O(n.POLYGON_OFFSET_FILL),(ee!==Le||j!==de)&&(ee=Le,j=de,o.getReversed()&&(Le=-Le),n.polygonOffset(Le,de))):F(n.POLYGON_OFFSET_FILL)}function Ae($){$?O(n.SCISSOR_TEST):F(n.SCISSOR_TEST)}function Q($){$===void 0&&($=n.TEXTURE0+G-1),ae!==$&&(n.activeTexture($),ae=$)}function b($,Le,de){de===void 0&&(ae===null?de=n.TEXTURE0+G-1:de=ae);let De=Te[de];De===void 0&&(De={type:void 0,texture:void 0},Te[de]=De),(De.type!==$||De.texture!==Le)&&(ae!==de&&(n.activeTexture(de),ae=de),n.bindTexture($,Le||Z[$]),De.type=$,De.texture=Le)}function qe(){let $=Te[ae];$!==void 0&&$.type!==void 0&&(n.bindTexture($.type,null),$.type=void 0,$.texture=void 0)}function Ke(){try{n.compressedTexImage2D(...arguments)}catch($){at("WebGLState:",$)}}function R(){try{n.compressedTexImage3D(...arguments)}catch($){at("WebGLState:",$)}}function y(){try{n.texSubImage2D(...arguments)}catch($){at("WebGLState:",$)}}function B(){try{n.texSubImage3D(...arguments)}catch($){at("WebGLState:",$)}}function L(){try{n.compressedTexSubImage2D(...arguments)}catch($){at("WebGLState:",$)}}function U(){try{n.compressedTexSubImage3D(...arguments)}catch($){at("WebGLState:",$)}}function ue(){try{n.texStorage2D(...arguments)}catch($){at("WebGLState:",$)}}function ge(){try{n.texStorage3D(...arguments)}catch($){at("WebGLState:",$)}}function te(){try{n.texImage2D(...arguments)}catch($){at("WebGLState:",$)}}function le(){try{n.texImage3D(...arguments)}catch($){at("WebGLState:",$)}}function Ee($){return h[$]!==void 0?h[$]:n.getParameter($)}function Xe($,Le){h[$]!==Le&&(n.pixelStorei($,Le),h[$]=Le)}function Re($){dt.equals($)===!1&&(n.scissor($.x,$.y,$.z,$.w),dt.copy($))}function Ce($){it.equals($)===!1&&(n.viewport($.x,$.y,$.z,$.w),it.copy($))}function et($,Le){let de=l.get(Le);de===void 0&&(de=new WeakMap,l.set(Le,de));let De=de.get($);De===void 0&&(De=n.getUniformBlockIndex(Le,$.name),de.set($,De))}function rt($,Le){let De=l.get(Le).get($);c.get(Le)!==De&&(n.uniformBlockBinding(Le,De,$.__bindingPointIndex),c.set(Le,De))}function ct(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},h={},ae=null,Te={},d={},f=new WeakMap,m=[],x=null,g=!1,p=null,M=null,E=null,v=null,A=null,C=null,N=null,_=new Ye(0,0,0),w=0,V=!1,k=null,T=null,D=null,ee=null,j=null,dt.set(0,0,n.canvas.width,n.canvas.height),it.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:O,disable:F,bindFramebuffer:P,drawBuffers:q,useProgram:ce,setBlending:oe,setMaterial:J,setFlipSided:fe,setCullFace:ye,setLineWidth:ve,setPolygonOffset:Be,setScissorTest:Ae,activeTexture:Q,bindTexture:b,unbindTexture:qe,compressedTexImage2D:Ke,compressedTexImage3D:R,texImage2D:te,texImage3D:le,pixelStorei:Xe,getParameter:Ee,updateUBOMapping:et,uniformBlockBinding:rt,texStorage2D:ue,texStorage3D:ge,texSubImage2D:y,texSubImage3D:B,compressedTexSubImage2D:L,compressedTexSubImage3D:U,scissor:Re,viewport:Ce,reset:ct}}function mS(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new xe,u=new WeakMap,h=new Set,d,f=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(R,y){return m?new OffscreenCanvas(R,y):Dr("canvas")}function g(R,y,B){let L=1,U=Ke(R);if((U.width>B||U.height>B)&&(L=B/Math.max(U.width,U.height)),L<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){let ue=Math.floor(L*U.width),ge=Math.floor(L*U.height);d===void 0&&(d=x(ue,ge));let te=y?x(ue,ge):d;return te.width=ue,te.height=ge,te.getContext("2d").drawImage(R,0,0,ue,ge),tt("WebGLRenderer: Texture has been resized from ("+U.width+"x"+U.height+") to ("+ue+"x"+ge+")."),te}else return"data"in R&&tt("WebGLRenderer: Image in DataTexture is too big ("+U.width+"x"+U.height+")."),R;return R}function p(R){return R.generateMipmaps}function M(R){n.generateMipmap(R)}function E(R){return R.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?n.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function v(R,y,B,L,U,ue=!1){if(R!==null){if(n[R]!==void 0)return n[R];tt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let ge;L&&(ge=e.get("EXT_texture_norm16"),ge||tt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let te=y;if(y===n.RED&&(B===n.FLOAT&&(te=n.R32F),B===n.HALF_FLOAT&&(te=n.R16F),B===n.UNSIGNED_BYTE&&(te=n.R8),B===n.UNSIGNED_SHORT&&ge&&(te=ge.R16_EXT),B===n.SHORT&&ge&&(te=ge.R16_SNORM_EXT)),y===n.RED_INTEGER&&(B===n.UNSIGNED_BYTE&&(te=n.R8UI),B===n.UNSIGNED_SHORT&&(te=n.R16UI),B===n.UNSIGNED_INT&&(te=n.R32UI),B===n.BYTE&&(te=n.R8I),B===n.SHORT&&(te=n.R16I),B===n.INT&&(te=n.R32I)),y===n.RG&&(B===n.FLOAT&&(te=n.RG32F),B===n.HALF_FLOAT&&(te=n.RG16F),B===n.UNSIGNED_BYTE&&(te=n.RG8),B===n.UNSIGNED_SHORT&&ge&&(te=ge.RG16_EXT),B===n.SHORT&&ge&&(te=ge.RG16_SNORM_EXT)),y===n.RG_INTEGER&&(B===n.UNSIGNED_BYTE&&(te=n.RG8UI),B===n.UNSIGNED_SHORT&&(te=n.RG16UI),B===n.UNSIGNED_INT&&(te=n.RG32UI),B===n.BYTE&&(te=n.RG8I),B===n.SHORT&&(te=n.RG16I),B===n.INT&&(te=n.RG32I)),y===n.RGB_INTEGER&&(B===n.UNSIGNED_BYTE&&(te=n.RGB8UI),B===n.UNSIGNED_SHORT&&(te=n.RGB16UI),B===n.UNSIGNED_INT&&(te=n.RGB32UI),B===n.BYTE&&(te=n.RGB8I),B===n.SHORT&&(te=n.RGB16I),B===n.INT&&(te=n.RGB32I)),y===n.RGBA_INTEGER&&(B===n.UNSIGNED_BYTE&&(te=n.RGBA8UI),B===n.UNSIGNED_SHORT&&(te=n.RGBA16UI),B===n.UNSIGNED_INT&&(te=n.RGBA32UI),B===n.BYTE&&(te=n.RGBA8I),B===n.SHORT&&(te=n.RGBA16I),B===n.INT&&(te=n.RGBA32I)),y===n.RGB&&(B===n.UNSIGNED_SHORT&&ge&&(te=ge.RGB16_EXT),B===n.SHORT&&ge&&(te=ge.RGB16_SNORM_EXT),B===n.UNSIGNED_INT_5_9_9_9_REV&&(te=n.RGB9_E5),B===n.UNSIGNED_INT_10F_11F_11F_REV&&(te=n.R11F_G11F_B10F)),y===n.RGBA){let le=ue?Fo:yt.getTransfer(U);B===n.FLOAT&&(te=n.RGBA32F),B===n.HALF_FLOAT&&(te=n.RGBA16F),B===n.UNSIGNED_BYTE&&(te=le===wt?n.SRGB8_ALPHA8:n.RGBA8),B===n.UNSIGNED_SHORT&&ge&&(te=ge.RGBA16_EXT),B===n.SHORT&&ge&&(te=ge.RGBA16_SNORM_EXT),B===n.UNSIGNED_SHORT_4_4_4_4&&(te=n.RGBA4),B===n.UNSIGNED_SHORT_5_5_5_1&&(te=n.RGB5_A1)}return(te===n.R16F||te===n.R32F||te===n.RG16F||te===n.RG32F||te===n.RGBA16F||te===n.RGBA32F)&&e.get("EXT_color_buffer_float"),te}function A(R,y){let B;return R?y===null||y===xi||y===Yr?B=n.DEPTH24_STENCIL8:y===yi?B=n.DEPTH32F_STENCIL8:y===jr&&(B=n.DEPTH24_STENCIL8,tt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===xi||y===Yr?B=n.DEPTH_COMPONENT24:y===yi?B=n.DEPTH_COMPONENT32F:y===jr&&(B=n.DEPTH_COMPONENT16),B}function C(R,y){return p(R)===!0||R.isFramebufferTexture&&R.minFilter!==pn&&R.minFilter!==qt?Math.log2(Math.max(y.width,y.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?y.mipmaps.length:1}function N(R){let y=R.target;y.removeEventListener("dispose",N),w(y),y.isVideoTexture&&u.delete(y),y.isHTMLTexture&&h.delete(y)}function _(R){let y=R.target;y.removeEventListener("dispose",_),k(y)}function w(R){let y=i.get(R);if(y.__webglInit===void 0)return;let B=R.source,L=f.get(B);if(L){let U=L[y.__cacheKey];U.usedTimes--,U.usedTimes===0&&V(R),Object.keys(L).length===0&&f.delete(B)}i.remove(R)}function V(R){let y=i.get(R);n.deleteTexture(y.__webglTexture);let B=R.source,L=f.get(B);delete L[y.__cacheKey],o.memory.textures--}function k(R){let y=i.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),i.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let L=0;L<6;L++){if(Array.isArray(y.__webglFramebuffer[L]))for(let U=0;U<y.__webglFramebuffer[L].length;U++)n.deleteFramebuffer(y.__webglFramebuffer[L][U]);else n.deleteFramebuffer(y.__webglFramebuffer[L]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[L])}else{if(Array.isArray(y.__webglFramebuffer))for(let L=0;L<y.__webglFramebuffer.length;L++)n.deleteFramebuffer(y.__webglFramebuffer[L]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let L=0;L<y.__webglColorRenderbuffer.length;L++)y.__webglColorRenderbuffer[L]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[L]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let B=R.textures;for(let L=0,U=B.length;L<U;L++){let ue=i.get(B[L]);ue.__webglTexture&&(n.deleteTexture(ue.__webglTexture),o.memory.textures--),i.remove(B[L])}i.remove(R)}let T=0;function D(){T=0}function ee(){return T}function j(R){T=R}function G(){let R=T;return R>=s.maxTextures&&tt("WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+s.maxTextures),T+=1,R}function X(R){let y=[];return y.push(R.wrapS),y.push(R.wrapT),y.push(R.wrapR||0),y.push(R.magFilter),y.push(R.minFilter),y.push(R.anisotropy),y.push(R.internalFormat),y.push(R.format),y.push(R.type),y.push(R.generateMipmaps),y.push(R.premultiplyAlpha),y.push(R.flipY),y.push(R.unpackAlignment),y.push(R.colorSpace),y.join()}function Y(R,y){let B=i.get(R);if(R.isVideoTexture&&b(R),R.isRenderTargetTexture===!1&&R.isExternalTexture!==!0&&R.version>0&&B.__version!==R.version){let L=R.image;if(L===null)tt("WebGLRenderer: Texture marked for update but no image data found.");else if(L.complete===!1)tt("WebGLRenderer: Texture marked for update but image is incomplete");else{F(B,R,y);return}}else R.isExternalTexture&&(B.__webglTexture=R.sourceTexture?R.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,B.__webglTexture,n.TEXTURE0+y)}function me(R,y){let B=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&B.__version!==R.version){F(B,R,y);return}else R.isExternalTexture&&(B.__webglTexture=R.sourceTexture?R.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,B.__webglTexture,n.TEXTURE0+y)}function ae(R,y){let B=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&B.__version!==R.version){F(B,R,y);return}t.bindTexture(n.TEXTURE_3D,B.__webglTexture,n.TEXTURE0+y)}function Te(R,y){let B=i.get(R);if(R.isCubeDepthTexture!==!0&&R.version>0&&B.__version!==R.version){P(B,R,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,B.__webglTexture,n.TEXTURE0+y)}let Se={[Yi]:n.REPEAT,[Dn]:n.CLAMP_TO_EDGE,[Lr]:n.MIRRORED_REPEAT},lt={[pn]:n.NEAREST,[Pp]:n.NEAREST_MIPMAP_NEAREST,[ba]:n.NEAREST_MIPMAP_LINEAR,[qt]:n.LINEAR,[lc]:n.LINEAR_MIPMAP_NEAREST,[gi]:n.LINEAR_MIPMAP_LINEAR},dt={[Dp]:n.NEVER,[Bp]:n.ALWAYS,[Np]:n.LESS,[Xc]:n.LEQUAL,[Up]:n.EQUAL,[qc]:n.GEQUAL,[Fp]:n.GREATER,[Op]:n.NOTEQUAL};function it(R,y){if(y.type===yi&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===qt||y.magFilter===lc||y.magFilter===ba||y.magFilter===gi||y.minFilter===qt||y.minFilter===lc||y.minFilter===ba||y.minFilter===gi)&&tt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(R,n.TEXTURE_WRAP_S,Se[y.wrapS]),n.texParameteri(R,n.TEXTURE_WRAP_T,Se[y.wrapT]),(R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY)&&n.texParameteri(R,n.TEXTURE_WRAP_R,Se[y.wrapR]),n.texParameteri(R,n.TEXTURE_MAG_FILTER,lt[y.magFilter]),n.texParameteri(R,n.TEXTURE_MIN_FILTER,lt[y.minFilter]),y.compareFunction&&(n.texParameteri(R,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(R,n.TEXTURE_COMPARE_FUNC,dt[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===pn||y.minFilter!==ba&&y.minFilter!==gi||y.type===yi&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let B=e.get("EXT_texture_filter_anisotropic");n.texParameterf(R,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function he(R,y){let B=!1;R.__webglInit===void 0&&(R.__webglInit=!0,y.addEventListener("dispose",N));let L=y.source,U=f.get(L);U===void 0&&(U={},f.set(L,U));let ue=X(y);if(ue!==R.__cacheKey){U[ue]===void 0&&(U[ue]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,B=!0),U[ue].usedTimes++;let ge=U[R.__cacheKey];ge!==void 0&&(U[R.__cacheKey].usedTimes--,ge.usedTimes===0&&V(y)),R.__cacheKey=ue,R.__webglTexture=U[ue].texture}return B}function Z(R,y,B){return Math.floor(Math.floor(R/B)/y)}function O(R,y,B,L){let ue=R.updateRanges;if(ue.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,y.width,y.height,B,L,y.data);else{ue.sort((Xe,Re)=>Xe.start-Re.start);let ge=0;for(let Xe=1;Xe<ue.length;Xe++){let Re=ue[ge],Ce=ue[Xe],et=Re.start+Re.count,rt=Z(Ce.start,y.width,4),ct=Z(Re.start,y.width,4);Ce.start<=et+1&&rt===ct&&Z(Ce.start+Ce.count-1,y.width,4)===rt?Re.count=Math.max(Re.count,Ce.start+Ce.count-Re.start):(++ge,ue[ge]=Ce)}ue.length=ge+1;let te=t.getParameter(n.UNPACK_ROW_LENGTH),le=t.getParameter(n.UNPACK_SKIP_PIXELS),Ee=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,y.width);for(let Xe=0,Re=ue.length;Xe<Re;Xe++){let Ce=ue[Xe],et=Math.floor(Ce.start/4),rt=Math.ceil(Ce.count/4),ct=et%y.width,$=Math.floor(et/y.width),Le=rt,de=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,ct),t.pixelStorei(n.UNPACK_SKIP_ROWS,$),t.texSubImage2D(n.TEXTURE_2D,0,ct,$,Le,de,B,L,y.data)}R.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,te),t.pixelStorei(n.UNPACK_SKIP_PIXELS,le),t.pixelStorei(n.UNPACK_SKIP_ROWS,Ee)}}function F(R,y,B){let L=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(L=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(L=n.TEXTURE_3D);let U=he(R,y),ue=y.source;t.bindTexture(L,R.__webglTexture,n.TEXTURE0+B);let ge=i.get(ue);if(ue.version!==ge.__version||U===!0){if(t.activeTexture(n.TEXTURE0+B),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){let de=yt.getPrimaries(yt.workingColorSpace),De=y.colorSpace===yn?null:yt.getPrimaries(y.colorSpace),Ue=y.colorSpace===yn||de===De?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ue)}t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment);let le=g(y.image,!1,s.maxTextureSize);le=qe(y,le);let Ee=r.convert(y.format,y.colorSpace),Xe=r.convert(y.type),Re=v(y.internalFormat,Ee,Xe,y.normalized,y.colorSpace,y.isVideoTexture);it(L,y);let Ce,et=y.mipmaps,rt=y.isVideoTexture!==!0,ct=ge.__version===void 0||U===!0,$=ue.dataReady,Le=C(y,le);if(y.isDepthTexture)Re=A(y.format===As,y.type),ct&&(rt?t.texStorage2D(n.TEXTURE_2D,1,Re,le.width,le.height):t.texImage2D(n.TEXTURE_2D,0,Re,le.width,le.height,0,Ee,Xe,null));else if(y.isDataTexture)if(et.length>0){rt&&ct&&t.texStorage2D(n.TEXTURE_2D,Le,Re,et[0].width,et[0].height);for(let de=0,De=et.length;de<De;de++)Ce=et[de],rt?$&&t.texSubImage2D(n.TEXTURE_2D,de,0,0,Ce.width,Ce.height,Ee,Xe,Ce.data):t.texImage2D(n.TEXTURE_2D,de,Re,Ce.width,Ce.height,0,Ee,Xe,Ce.data);y.generateMipmaps=!1}else rt?(ct&&t.texStorage2D(n.TEXTURE_2D,Le,Re,le.width,le.height),$&&O(y,le,Ee,Xe)):t.texImage2D(n.TEXTURE_2D,0,Re,le.width,le.height,0,Ee,Xe,le.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){rt&&ct&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Le,Re,et[0].width,et[0].height,le.depth);for(let de=0,De=et.length;de<De;de++)if(Ce=et[de],y.format!==oi)if(Ee!==null)if(rt){if($)if(y.layerUpdates.size>0){let Ue=kh(Ce.width,Ce.height,y.format,y.type);for(let be of y.layerUpdates){let Ze=Ce.data.subarray(be*Ue/Ce.data.BYTES_PER_ELEMENT,(be+1)*Ue/Ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,de,0,0,be,Ce.width,Ce.height,1,Ee,Ze)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,de,0,0,0,Ce.width,Ce.height,le.depth,Ee,Ce.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,de,Re,Ce.width,Ce.height,le.depth,0,Ce.data,0,0);else tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else rt?$&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,de,0,0,0,Ce.width,Ce.height,le.depth,Ee,Xe,Ce.data):t.texImage3D(n.TEXTURE_2D_ARRAY,de,Re,Ce.width,Ce.height,le.depth,0,Ee,Xe,Ce.data)}else{rt&&ct&&t.texStorage2D(n.TEXTURE_2D,Le,Re,et[0].width,et[0].height);for(let de=0,De=et.length;de<De;de++)Ce=et[de],y.format!==oi?Ee!==null?rt?$&&t.compressedTexSubImage2D(n.TEXTURE_2D,de,0,0,Ce.width,Ce.height,Ee,Ce.data):t.compressedTexImage2D(n.TEXTURE_2D,de,Re,Ce.width,Ce.height,0,Ce.data):tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):rt?$&&t.texSubImage2D(n.TEXTURE_2D,de,0,0,Ce.width,Ce.height,Ee,Xe,Ce.data):t.texImage2D(n.TEXTURE_2D,de,Re,Ce.width,Ce.height,0,Ee,Xe,Ce.data)}else if(y.isDataArrayTexture)if(rt){if(ct&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Le,Re,le.width,le.height,le.depth),$)if(y.layerUpdates.size>0){let de=kh(le.width,le.height,y.format,y.type);for(let De of y.layerUpdates){let Ue=le.data.subarray(De*de/le.data.BYTES_PER_ELEMENT,(De+1)*de/le.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,De,le.width,le.height,1,Ee,Xe,Ue)}y.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,le.width,le.height,le.depth,Ee,Xe,le.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Re,le.width,le.height,le.depth,0,Ee,Xe,le.data);else if(y.isData3DTexture)rt?(ct&&t.texStorage3D(n.TEXTURE_3D,Le,Re,le.width,le.height,le.depth),$&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,le.width,le.height,le.depth,Ee,Xe,le.data)):t.texImage3D(n.TEXTURE_3D,0,Re,le.width,le.height,le.depth,0,Ee,Xe,le.data);else if(y.isFramebufferTexture){if(ct)if(rt)t.texStorage2D(n.TEXTURE_2D,Le,Re,le.width,le.height);else{let de=le.width,De=le.height;for(let Ue=0;Ue<Le;Ue++)t.texImage2D(n.TEXTURE_2D,Ue,Re,de,De,0,Ee,Xe,null),de>>=1,De>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in n){let de=n.canvas;if(de.hasAttribute("layoutsubtree")||de.setAttribute("layoutsubtree","true"),le.parentNode!==de){de.appendChild(le),h.add(y),de.onpaint=De=>{let Ue=De.changedElements;for(let be of h)Ue.includes(be.image)&&(be.needsUpdate=!0)},de.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,le);else{let Ue=n.RGBA,be=n.RGBA,Ze=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,Ue,be,Ze,le)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(et.length>0){if(rt&&ct){let de=Ke(et[0]);t.texStorage2D(n.TEXTURE_2D,Le,Re,de.width,de.height)}for(let de=0,De=et.length;de<De;de++)Ce=et[de],rt?$&&t.texSubImage2D(n.TEXTURE_2D,de,0,0,Ee,Xe,Ce):t.texImage2D(n.TEXTURE_2D,de,Re,Ee,Xe,Ce);y.generateMipmaps=!1}else if(rt){if(ct){let de=Ke(le);t.texStorage2D(n.TEXTURE_2D,Le,Re,de.width,de.height)}$&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Ee,Xe,le)}else t.texImage2D(n.TEXTURE_2D,0,Re,Ee,Xe,le);p(y)&&M(L),ge.__version=ue.version,y.onUpdate&&y.onUpdate(y)}R.__version=y.version}function P(R,y,B){if(y.image.length!==6)return;let L=he(R,y),U=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,R.__webglTexture,n.TEXTURE0+B);let ue=i.get(U);if(U.version!==ue.__version||L===!0){t.activeTexture(n.TEXTURE0+B);let ge=yt.getPrimaries(yt.workingColorSpace),te=y.colorSpace===yn?null:yt.getPrimaries(y.colorSpace),le=y.colorSpace===yn||ge===te?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,le);let Ee=y.isCompressedTexture||y.image[0].isCompressedTexture,Xe=y.image[0]&&y.image[0].isDataTexture,Re=[];for(let be=0;be<6;be++)!Ee&&!Xe?Re[be]=g(y.image[be],!0,s.maxCubemapSize):Re[be]=Xe?y.image[be].image:y.image[be],Re[be]=qe(y,Re[be]);let Ce=Re[0],et=r.convert(y.format,y.colorSpace),rt=r.convert(y.type),ct=v(y.internalFormat,et,rt,y.normalized,y.colorSpace),$=y.isVideoTexture!==!0,Le=ue.__version===void 0||L===!0,de=U.dataReady,De=C(y,Ce);it(n.TEXTURE_CUBE_MAP,y);let Ue;if(Ee){$&&Le&&t.texStorage2D(n.TEXTURE_CUBE_MAP,De,ct,Ce.width,Ce.height);for(let be=0;be<6;be++){Ue=Re[be].mipmaps;for(let Ze=0;Ze<Ue.length;Ze++){let $e=Ue[Ze];y.format!==oi?et!==null?$?de&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze,0,0,$e.width,$e.height,et,$e.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze,ct,$e.width,$e.height,0,$e.data):tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):$?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze,0,0,$e.width,$e.height,et,rt,$e.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze,ct,$e.width,$e.height,0,et,rt,$e.data)}}}else{if(Ue=y.mipmaps,$&&Le){Ue.length>0&&De++;let be=Ke(Re[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,De,ct,be.width,be.height)}for(let be=0;be<6;be++)if(Xe){$?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,0,0,0,Re[be].width,Re[be].height,et,rt,Re[be].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,0,ct,Re[be].width,Re[be].height,0,et,rt,Re[be].data);for(let Ze=0;Ze<Ue.length;Ze++){let Ot=Ue[Ze].image[be].image;$?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze+1,0,0,Ot.width,Ot.height,et,rt,Ot.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze+1,ct,Ot.width,Ot.height,0,et,rt,Ot.data)}}else{$?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,0,0,0,et,rt,Re[be]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,0,ct,et,rt,Re[be]);for(let Ze=0;Ze<Ue.length;Ze++){let $e=Ue[Ze];$?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze+1,0,0,et,rt,$e.image[be]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ze+1,ct,et,rt,$e.image[be])}}}p(y)&&M(n.TEXTURE_CUBE_MAP),ue.__version=U.version,y.onUpdate&&y.onUpdate(y)}R.__version=y.version}function q(R,y,B,L,U,ue){let ge=r.convert(B.format,B.colorSpace),te=r.convert(B.type),le=v(B.internalFormat,ge,te,B.normalized,B.colorSpace),Ee=i.get(y),Xe=i.get(B);if(Xe.__renderTarget=y,!Ee.__hasExternalTextures){let Re=Math.max(1,y.width>>ue),Ce=Math.max(1,y.height>>ue);U===n.TEXTURE_3D||U===n.TEXTURE_2D_ARRAY?t.texImage3D(U,ue,le,Re,Ce,y.depth,0,ge,te,null):t.texImage2D(U,ue,le,Re,Ce,0,ge,te,null)}t.bindFramebuffer(n.FRAMEBUFFER,R),Q(y)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,L,U,Xe.__webglTexture,0,Ae(y)):(U===n.TEXTURE_2D||U>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&U<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,L,U,Xe.__webglTexture,ue),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ce(R,y,B){if(n.bindRenderbuffer(n.RENDERBUFFER,R),y.depthBuffer){let L=y.depthTexture,U=L&&L.isDepthTexture?L.type:null,ue=A(y.stencilBuffer,U),ge=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Q(y)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ae(y),ue,y.width,y.height):B?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ae(y),ue,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,ue,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ge,n.RENDERBUFFER,R)}else{let L=y.textures;for(let U=0;U<L.length;U++){let ue=L[U],ge=r.convert(ue.format,ue.colorSpace),te=r.convert(ue.type),le=v(ue.internalFormat,ge,te,ue.normalized,ue.colorSpace);Q(y)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ae(y),le,y.width,y.height):B?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ae(y),le,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,le,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function pe(R,y,B){let L=y.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,R),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let U=i.get(y.depthTexture);if(U.__renderTarget=y,(!U.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),L){if(U.__webglInit===void 0&&(U.__webglInit=!0,y.depthTexture.addEventListener("dispose",N)),U.__webglTexture===void 0){U.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,U.__webglTexture),it(n.TEXTURE_CUBE_MAP,y.depthTexture);let Ee=r.convert(y.depthTexture.format),Xe=r.convert(y.depthTexture.type),Re;y.depthTexture.format===Ai?Re=n.DEPTH_COMPONENT24:y.depthTexture.format===As&&(Re=n.DEPTH24_STENCIL8);for(let Ce=0;Ce<6;Ce++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,0,Re,y.width,y.height,0,Ee,Xe,null)}}else Y(y.depthTexture,0);let ue=U.__webglTexture,ge=Ae(y),te=L?n.TEXTURE_CUBE_MAP_POSITIVE_X+B:n.TEXTURE_2D,le=y.depthTexture.format===As?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(y.depthTexture.format===Ai)Q(y)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,le,te,ue,0,ge):n.framebufferTexture2D(n.FRAMEBUFFER,le,te,ue,0);else if(y.depthTexture.format===As)Q(y)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,le,te,ue,0,ge):n.framebufferTexture2D(n.FRAMEBUFFER,le,te,ue,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function z(R){let y=i.get(R),B=R.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==R.depthTexture){let L=R.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),L){let U=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,L.removeEventListener("dispose",U)};L.addEventListener("dispose",U),y.__depthDisposeCallback=U}y.__boundDepthTexture=L}if(R.depthTexture&&!y.__autoAllocateDepthBuffer)if(B)for(let L=0;L<6;L++)pe(y.__webglFramebuffer[L],R,L);else{let L=R.texture.mipmaps;L&&L.length>0?pe(y.__webglFramebuffer[0],R,0):pe(y.__webglFramebuffer,R,0)}else if(B){y.__webglDepthbuffer=[];for(let L=0;L<6;L++)if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[L]),y.__webglDepthbuffer[L]===void 0)y.__webglDepthbuffer[L]=n.createRenderbuffer(),ce(y.__webglDepthbuffer[L],R,!1);else{let U=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ue=y.__webglDepthbuffer[L];n.bindRenderbuffer(n.RENDERBUFFER,ue),n.framebufferRenderbuffer(n.FRAMEBUFFER,U,n.RENDERBUFFER,ue)}}else{let L=R.texture.mipmaps;if(L&&L.length>0?t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),ce(y.__webglDepthbuffer,R,!1);else{let U=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ue=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ue),n.framebufferRenderbuffer(n.FRAMEBUFFER,U,n.RENDERBUFFER,ue)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function oe(R,y,B){let L=i.get(R);y!==void 0&&q(L.__webglFramebuffer,R,R.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),B!==void 0&&z(R)}function J(R){let y=R.texture,B=i.get(R),L=i.get(y);R.addEventListener("dispose",_);let U=R.textures,ue=R.isWebGLCubeRenderTarget===!0,ge=U.length>1;if(ge||(L.__webglTexture===void 0&&(L.__webglTexture=n.createTexture()),L.__version=y.version,o.memory.textures++),ue){B.__webglFramebuffer=[];for(let te=0;te<6;te++)if(y.mipmaps&&y.mipmaps.length>0){B.__webglFramebuffer[te]=[];for(let le=0;le<y.mipmaps.length;le++)B.__webglFramebuffer[te][le]=n.createFramebuffer()}else B.__webglFramebuffer[te]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){B.__webglFramebuffer=[];for(let te=0;te<y.mipmaps.length;te++)B.__webglFramebuffer[te]=n.createFramebuffer()}else B.__webglFramebuffer=n.createFramebuffer();if(ge)for(let te=0,le=U.length;te<le;te++){let Ee=i.get(U[te]);Ee.__webglTexture===void 0&&(Ee.__webglTexture=n.createTexture(),o.memory.textures++)}if(R.samples>0&&Q(R)===!1){B.__webglMultisampledFramebuffer=n.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let te=0;te<U.length;te++){let le=U[te];B.__webglColorRenderbuffer[te]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,B.__webglColorRenderbuffer[te]);let Ee=r.convert(le.format,le.colorSpace),Xe=r.convert(le.type),Re=v(le.internalFormat,Ee,Xe,le.normalized,le.colorSpace,R.isXRRenderTarget===!0),Ce=Ae(R);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ce,Re,R.width,R.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+te,n.RENDERBUFFER,B.__webglColorRenderbuffer[te])}n.bindRenderbuffer(n.RENDERBUFFER,null),R.depthBuffer&&(B.__webglDepthRenderbuffer=n.createRenderbuffer(),ce(B.__webglDepthRenderbuffer,R,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ue){t.bindTexture(n.TEXTURE_CUBE_MAP,L.__webglTexture),it(n.TEXTURE_CUBE_MAP,y);for(let te=0;te<6;te++)if(y.mipmaps&&y.mipmaps.length>0)for(let le=0;le<y.mipmaps.length;le++)q(B.__webglFramebuffer[te][le],R,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+te,le);else q(B.__webglFramebuffer[te],R,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0);p(y)&&M(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ge){for(let te=0,le=U.length;te<le;te++){let Ee=U[te],Xe=i.get(Ee),Re=n.TEXTURE_2D;(R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(Re=R.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Re,Xe.__webglTexture),it(Re,Ee),q(B.__webglFramebuffer,R,Ee,n.COLOR_ATTACHMENT0+te,Re,0),p(Ee)&&M(Re)}t.unbindTexture()}else{let te=n.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(te=R.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(te,L.__webglTexture),it(te,y),y.mipmaps&&y.mipmaps.length>0)for(let le=0;le<y.mipmaps.length;le++)q(B.__webglFramebuffer[le],R,y,n.COLOR_ATTACHMENT0,te,le);else q(B.__webglFramebuffer,R,y,n.COLOR_ATTACHMENT0,te,0);p(y)&&M(te),t.unbindTexture()}R.depthBuffer&&z(R)}function fe(R){let y=R.textures;for(let B=0,L=y.length;B<L;B++){let U=y[B];if(p(U)){let ue=E(R),ge=i.get(U).__webglTexture;t.bindTexture(ue,ge),M(ue),t.unbindTexture()}}}let ye=[],ve=[];function Be(R){if(R.samples>0){if(Q(R)===!1){let y=R.textures,B=R.width,L=R.height,U=n.COLOR_BUFFER_BIT,ue=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ge=i.get(R),te=y.length>1;if(te)for(let Ee=0;Ee<y.length;Ee++)t.bindFramebuffer(n.FRAMEBUFFER,ge.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ge.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ge.__webglMultisampledFramebuffer);let le=R.texture.mipmaps;le&&le.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ge.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ge.__webglFramebuffer);for(let Ee=0;Ee<y.length;Ee++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(U|=n.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(U|=n.STENCIL_BUFFER_BIT)),te){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ge.__webglColorRenderbuffer[Ee]);let Xe=i.get(y[Ee]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Xe,0)}n.blitFramebuffer(0,0,B,L,0,0,B,L,U,n.NEAREST),c===!0&&(ye.length=0,ve.length=0,ye.push(n.COLOR_ATTACHMENT0+Ee),R.depthBuffer&&R.resolveDepthBuffer===!1&&(ye.push(ue),ve.push(ue),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,ve)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ye))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),te)for(let Ee=0;Ee<y.length;Ee++){t.bindFramebuffer(n.FRAMEBUFFER,ge.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.RENDERBUFFER,ge.__webglColorRenderbuffer[Ee]);let Xe=i.get(y[Ee]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ge.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.TEXTURE_2D,Xe,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ge.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&c){let y=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function Ae(R){return Math.min(s.maxSamples,R.samples)}function Q(R){let y=i.get(R);return R.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function b(R){let y=o.render.frame;u.get(R)!==y&&(u.set(R,y),R.update())}function qe(R,y){let B=R.colorSpace,L=R.format,U=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||B!==Uo&&B!==yn&&(yt.getTransfer(B)===wt?(L!==oi||U!==$n)&&tt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):at("WebGLTextures: Unsupported texture color space:",B)),y}function Ke(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(l.width=R.naturalWidth||R.width,l.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(l.width=R.displayWidth,l.height=R.displayHeight):(l.width=R.width,l.height=R.height),l}this.allocateTextureUnit=G,this.resetTextureUnits=D,this.getTextureUnits=ee,this.setTextureUnits=j,this.setTexture2D=Y,this.setTexture2DArray=me,this.setTexture3D=ae,this.setTextureCube=Te,this.rebindTextures=oe,this.setupRenderTarget=J,this.updateRenderTargetMipmap=fe,this.updateMultisampleRenderTarget=Be,this.setupDepthRenderbuffer=z,this.setupFrameBufferTexture=q,this.useMultisampledRTT=Q,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function gS(n,e){function t(i,s=yn){let r,o=yt.getTransfer(s);if(i===$n)return n.UNSIGNED_BYTE;if(i===uc)return n.UNSIGNED_SHORT_4_4_4_4;if(i===hc)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Ph)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Ih)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Ch)return n.BYTE;if(i===Rh)return n.SHORT;if(i===jr)return n.UNSIGNED_SHORT;if(i===cc)return n.INT;if(i===xi)return n.UNSIGNED_INT;if(i===yi)return n.FLOAT;if(i===on)return n.HALF_FLOAT;if(i===Lh)return n.ALPHA;if(i===Dh)return n.RGB;if(i===oi)return n.RGBA;if(i===Ai)return n.DEPTH_COMPONENT;if(i===As)return n.DEPTH_STENCIL;if(i===Zr)return n.RED;if(i===dc)return n.RED_INTEGER;if(i===Cs)return n.RG;if(i===fc)return n.RG_INTEGER;if(i===pc)return n.RGBA_INTEGER;if(i===Sa||i===Ma||i===Ea||i===wa)if(o===wt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===Sa)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Ma)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ea)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===wa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===Sa)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Ma)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ea)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===wa)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===mc||i===gc||i===xc||i===yc)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===mc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===gc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===xc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===yc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===vc||i===_c||i===bc||i===Sc||i===Mc||i===Ta||i===Ec)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===vc||i===_c)return o===wt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===bc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(i===Sc)return r.COMPRESSED_R11_EAC;if(i===Mc)return r.COMPRESSED_SIGNED_R11_EAC;if(i===Ta)return r.COMPRESSED_RG11_EAC;if(i===Ec)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===wc||i===Tc||i===Ac||i===Cc||i===Rc||i===Pc||i===Ic||i===Lc||i===Dc||i===Nc||i===Uc||i===Fc||i===Oc||i===Bc)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===wc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Tc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Ac)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Cc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Rc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Pc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ic)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Lc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Dc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Nc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Uc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Fc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Oc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Bc)return o===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===zc||i===Hc||i===kc)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===zc)return o===wt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Hc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===kc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Vc||i===Gc||i===Aa||i===Wc)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===Vc)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Gc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Aa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Wc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Yr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var xS=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,yS=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,od=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new $o(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new St({vertexShader:xS,fragmentShader:yS,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ft(new Cn(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ad=class extends Ci{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",c=1,l=null,u=null,h=null,d=null,f=null,m=null,x=typeof XRWebGLBinding<"u",g=new od,p={},M=t.getContextAttributes(),E=null,v=null,A=[],C=[],N=new xe,_=null,w=new En;w.viewport=new Lt;let V=new En;V.viewport=new Lt;let k=[w,V],T=new sc,D=null,ee=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(he){let Z=A[he];return Z===void 0&&(Z=new Br,A[he]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(he){let Z=A[he];return Z===void 0&&(Z=new Br,A[he]=Z),Z.getGripSpace()},this.getHand=function(he){let Z=A[he];return Z===void 0&&(Z=new Br,A[he]=Z),Z.getHandSpace()};function j(he){let Z=C.indexOf(he.inputSource);if(Z===-1)return;let O=A[Z];O!==void 0&&(O.update(he.inputSource,he.frame,l||o),O.dispatchEvent({type:he.type,data:he.inputSource}))}function G(){s.removeEventListener("select",j),s.removeEventListener("selectstart",j),s.removeEventListener("selectend",j),s.removeEventListener("squeeze",j),s.removeEventListener("squeezestart",j),s.removeEventListener("squeezeend",j),s.removeEventListener("end",G),s.removeEventListener("inputsourceschange",X);for(let he=0;he<A.length;he++){let Z=C[he];Z!==null&&(C[he]=null,A[he].disconnect(Z))}D=null,ee=null,g.reset();for(let he in p)delete p[he];e.setRenderTarget(E),f=null,d=null,h=null,s=null,v=null,it.stop(),i.isPresenting=!1,e.setPixelRatio(_),e.setSize(N.width,N.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(he){r=he,i.isPresenting===!0&&tt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(he){a=he,i.isPresenting===!0&&tt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(he){l=he},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h===null&&x&&(h=new XRWebGLBinding(s,t)),h},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(he){if(s=he,s!==null){if(E=e.getRenderTarget(),s.addEventListener("select",j),s.addEventListener("selectstart",j),s.addEventListener("selectend",j),s.addEventListener("squeeze",j),s.addEventListener("squeezestart",j),s.addEventListener("squeezeend",j),s.addEventListener("end",G),s.addEventListener("inputsourceschange",X),M.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(N),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let O=null,F=null,P=null;M.depth&&(P=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,O=M.stencil?As:Ai,F=M.stencil?Yr:xi);let q={colorFormat:t.RGBA8,depthFormat:P,scaleFactor:r};h=this.getBinding(),d=h.createProjectionLayer(q),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new Zt(d.textureWidth,d.textureHeight,{format:oi,type:$n,depthTexture:new es(d.textureWidth,d.textureHeight,F,void 0,void 0,void 0,void 0,void 0,void 0,O),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let O={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,O),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new Zt(f.framebufferWidth,f.framebufferHeight,{format:oi,type:$n,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),it.setContext(s),it.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function X(he){for(let Z=0;Z<he.removed.length;Z++){let O=he.removed[Z],F=C.indexOf(O);F>=0&&(C[F]=null,A[F].disconnect(O))}for(let Z=0;Z<he.added.length;Z++){let O=he.added[Z],F=C.indexOf(O);if(F===-1){for(let q=0;q<A.length;q++)if(q>=C.length){C.push(O),F=q;break}else if(C[q]===null){C[q]=O,F=q;break}if(F===-1)break}let P=A[F];P&&P.connect(O)}}let Y=new I,me=new I;function ae(he,Z,O){Y.setFromMatrixPosition(Z.matrixWorld),me.setFromMatrixPosition(O.matrixWorld);let F=Y.distanceTo(me),P=Z.projectionMatrix.elements,q=O.projectionMatrix.elements,ce=P[14]/(P[10]-1),pe=P[14]/(P[10]+1),z=(P[9]+1)/P[5],oe=(P[9]-1)/P[5],J=(P[8]-1)/P[0],fe=(q[8]+1)/q[0],ye=ce*J,ve=ce*fe,Be=F/(-J+fe),Ae=Be*-J;if(Z.matrixWorld.decompose(he.position,he.quaternion,he.scale),he.translateX(Ae),he.translateZ(Be),he.matrixWorld.compose(he.position,he.quaternion,he.scale),he.matrixWorldInverse.copy(he.matrixWorld).invert(),P[10]===-1)he.projectionMatrix.copy(Z.projectionMatrix),he.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{let Q=ce+Be,b=pe+Be,qe=ye-Ae,Ke=ve+(F-Ae),R=z*pe/b*Q,y=oe*pe/b*Q;he.projectionMatrix.makePerspective(qe,Ke,R,y,Q,b),he.projectionMatrixInverse.copy(he.projectionMatrix).invert()}}function Te(he,Z){Z===null?he.matrixWorld.copy(he.matrix):he.matrixWorld.multiplyMatrices(Z.matrixWorld,he.matrix),he.matrixWorldInverse.copy(he.matrixWorld).invert()}this.updateCamera=function(he){if(s===null)return;let Z=he.near,O=he.far;g.texture!==null&&(g.depthNear>0&&(Z=g.depthNear),g.depthFar>0&&(O=g.depthFar)),T.near=V.near=w.near=Z,T.far=V.far=w.far=O,(D!==T.near||ee!==T.far)&&(s.updateRenderState({depthNear:T.near,depthFar:T.far}),D=T.near,ee=T.far),T.layers.mask=he.layers.mask|6,w.layers.mask=T.layers.mask&-5,V.layers.mask=T.layers.mask&-3;let F=he.parent,P=T.cameras;Te(T,F);for(let q=0;q<P.length;q++)Te(P[q],F);P.length===2?ae(T,w,V):T.projectionMatrix.copy(w.projectionMatrix),Se(he,T,F)};function Se(he,Z,O){O===null?he.matrix.copy(Z.matrixWorld):(he.matrix.copy(O.matrixWorld),he.matrix.invert(),he.matrix.multiply(Z.matrixWorld)),he.matrix.decompose(he.position,he.quaternion,he.scale),he.updateMatrixWorld(!0),he.projectionMatrix.copy(Z.projectionMatrix),he.projectionMatrixInverse.copy(Z.projectionMatrixInverse),he.isPerspectiveCamera&&(he.fov=Ur*2*Math.atan(1/he.projectionMatrix.elements[5]),he.zoom=1)}this.getCamera=function(){return T},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(he){c=he,d!==null&&(d.fixedFoveation=he),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=he)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(T)},this.getCameraTexture=function(he){return p[he]};let lt=null;function dt(he,Z){if(u=Z.getViewerPose(l||o),m=Z,u!==null){let O=u.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let F=!1;O.length!==T.cameras.length&&(T.cameras.length=0,F=!0);for(let pe=0;pe<O.length;pe++){let z=O[pe],oe=null;if(f!==null)oe=f.getViewport(z);else{let fe=h.getViewSubImage(d,z);oe=fe.viewport,pe===0&&(e.setRenderTargetTextures(v,fe.colorTexture,fe.depthStencilTexture),e.setRenderTarget(v))}let J=k[pe];J===void 0&&(J=new En,J.layers.enable(pe),J.viewport=new Lt,k[pe]=J),J.matrix.fromArray(z.transform.matrix),J.matrix.decompose(J.position,J.quaternion,J.scale),J.projectionMatrix.fromArray(z.projectionMatrix),J.projectionMatrixInverse.copy(J.projectionMatrix).invert(),J.viewport.set(oe.x,oe.y,oe.width,oe.height),pe===0&&(T.matrix.copy(J.matrix),T.matrix.decompose(T.position,T.quaternion,T.scale)),F===!0&&T.cameras.push(J)}let P=s.enabledFeatures;if(P&&P.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){h=i.getBinding();let pe=h.getDepthInformation(O[0]);pe&&pe.isValid&&pe.texture&&g.init(pe,s.renderState)}if(P&&P.includes("camera-access")&&x){e.state.unbindTexture(),h=i.getBinding();for(let pe=0;pe<O.length;pe++){let z=O[pe].camera;if(z){let oe=p[z];oe||(oe=new $o,p[z]=oe);let J=h.getCameraImage(z);oe.sourceTexture=J}}}}for(let O=0;O<A.length;O++){let F=C[O],P=A[O];F!==null&&P!==void 0&&P.update(F,Z,l||o)}lt&&lt(he,Z),Z.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Z}),m=null}let it=new xm;it.setAnimationLoop(dt),this.setAnimationLoop=function(he){lt=he},this.dispose=function(){}}},vS=new zt,Mm=new nt;Mm.set(-1,0,0,0,1,0,0,0,1);function _S(n,e){function t(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function i(g,p){p.color.getRGB(g.fogColor.value,Bh(n)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,M,E,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(g,p):p.isMeshLambertMaterial?(r(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(g,p),h(g,p)):p.isMeshPhongMaterial?(r(g,p),u(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(g,p),d(g,p),p.isMeshPhysicalMaterial&&f(g,p,v)):p.isMeshMatcapMaterial?(r(g,p),m(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),x(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?c(g,p,M,E):p.isSpriteMaterial?l(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,t(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===xn&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,t(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===xn&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,t(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,t(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let M=e.get(p),E=M.envMap,v=M.envMapRotation;E&&(g.envMap.value=E,g.envMapRotation.value.setFromMatrix4(vS.makeRotationFromEuler(v)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Mm),g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function c(g,p,M,E){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*M,g.scale.value=E*.5,p.map&&(g.map.value=p.map,t(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function l(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function u(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function h(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function d(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function f(g,p,M){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===xn&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=M.texture,g.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function x(g,p){let M=e.get(p).light;g.referencePosition.value.setFromMatrixPosition(M.matrixWorld),g.nearDistance.value=M.shadow.camera.near,g.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function bS(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(v,A){let C=A.program;i.uniformBlockBinding(v,C)}function l(v,A){let C=s[v.id];C===void 0&&(g(v),C=u(v),s[v.id]=C,v.addEventListener("dispose",M));let N=A.program;i.updateUBOMapping(v,N);let _=e.render.frame;r[v.id]!==_&&(d(v),r[v.id]=_)}function u(v){let A=h();v.__bindingPointIndex=A;let C=n.createBuffer(),N=v.__size,_=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,C),n.bufferData(n.UNIFORM_BUFFER,N,_),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,A,C),C}function h(){for(let v=0;v<a;v++)if(o.indexOf(v)===-1)return o.push(v),v;return at("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(v){let A=s[v.id],C=v.uniforms,N=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,A);for(let _=0,w=C.length;_<w;_++){let V=C[_];if(Array.isArray(V))for(let k=0,T=V.length;k<T;k++)f(V[k],_,k,N);else f(V,_,0,N)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(v,A,C,N){if(x(v,A,C,N)===!0){let _=v.__offset,w=v.value;if(Array.isArray(w)){let V=0;for(let k=0;k<w.length;k++){let T=w[k],D=p(T);m(T,v.__data,V),typeof T!="number"&&typeof T!="boolean"&&!T.isMatrix3&&!ArrayBuffer.isView(T)&&(V+=D.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(w,v.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,_,v.__data)}}function m(v,A,C){typeof v=="number"||typeof v=="boolean"?A[0]=v:v.isMatrix3?(A[0]=v.elements[0],A[1]=v.elements[1],A[2]=v.elements[2],A[3]=0,A[4]=v.elements[3],A[5]=v.elements[4],A[6]=v.elements[5],A[7]=0,A[8]=v.elements[6],A[9]=v.elements[7],A[10]=v.elements[8],A[11]=0):ArrayBuffer.isView(v)?A.set(new v.constructor(v.buffer,v.byteOffset,A.length)):v.toArray(A,C)}function x(v,A,C,N){let _=v.value,w=A+"_"+C;if(N[w]===void 0)return typeof _=="number"||typeof _=="boolean"?N[w]=_:ArrayBuffer.isView(_)?N[w]=_.slice():N[w]=_.clone(),!0;{let V=N[w];if(typeof _=="number"||typeof _=="boolean"){if(V!==_)return N[w]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(V.equals(_)===!1)return V.copy(_),!0}}return!1}function g(v){let A=v.uniforms,C=0,N=16;for(let w=0,V=A.length;w<V;w++){let k=Array.isArray(A[w])?A[w]:[A[w]];for(let T=0,D=k.length;T<D;T++){let ee=k[T],j=Array.isArray(ee.value)?ee.value:[ee.value];for(let G=0,X=j.length;G<X;G++){let Y=j[G],me=p(Y),ae=C%N,Te=ae%me.boundary,Se=ae+Te;C+=Te,Se!==0&&N-Se<me.storage&&(C+=N-Se),ee.__data=new Float32Array(me.storage/Float32Array.BYTES_PER_ELEMENT),ee.__offset=C,C+=me.storage}}}let _=C%N;return _>0&&(C+=N-_),v.__size=C,v.__cache={},this}function p(v){let A={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(A.boundary=4,A.storage=4):v.isVector2?(A.boundary=8,A.storage=8):v.isVector3||v.isColor?(A.boundary=16,A.storage=12):v.isVector4?(A.boundary=16,A.storage=16):v.isMatrix3?(A.boundary=48,A.storage=48):v.isMatrix4?(A.boundary=64,A.storage=64):v.isTexture?tt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(A.boundary=16,A.storage=v.byteLength):tt("WebGLRenderer: Unsupported uniform value type.",v),A}function M(v){let A=v.target;A.removeEventListener("dispose",M);let C=o.indexOf(A.__bindingPointIndex);o.splice(C,1),n.deleteBuffer(s[A.id]),delete s[A.id],delete r[A.id]}function E(){for(let v in s)n.deleteBuffer(s[v]);o=[],s={},r={}}return{bind:c,update:l,dispose:E}}var SS=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ri=null;function MS(){return Ri===null&&(Ri=new $s(SS,16,16,Cs,on),Ri.name="DFG_LUT",Ri.minFilter=qt,Ri.magFilter=qt,Ri.wrapS=Dn,Ri.wrapT=Dn,Ri.generateMipmaps=!1,Ri.needsUpdate=!0),Ri}var Kc=class{constructor(e={}){let{canvas:t=zp(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1,outputBufferType:f=$n}=e;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=o;let x=f,g=new Set([pc,fc,dc]),p=new Set([$n,xi,jr,Yr,uc,hc]),M=new Uint32Array(4),E=new Int32Array(4),v=new I,A=null,C=null,N=[],_=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=qn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let V=this,k=!1,T=null,D=null,ee=null,j=null;this._outputColorSpace=fn;let G=0,X=0,Y=null,me=-1,ae=null,Te=new Lt,Se=new Lt,lt=null,dt=new Ye(0),it=0,he=t.width,Z=t.height,O=1,F=null,P=null,q=new Lt(0,0,he,Z),ce=new Lt(0,0,he,Z),pe=!1,z=new Go,oe=!1,J=!1,fe=new zt,ye=new I,ve=new Lt,Be={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ae=!1;function Q(){return Y===null?O:1}let b=i;function qe(S,K){return t.getContext(S,K)}try{let S={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"185"}`),t.addEventListener("webglcontextlost",Ot,!1),t.addEventListener("webglcontextrestored",_t,!1),t.addEventListener("webglcontextcreationerror",zn,!1),b===null){let K="webgl2";if(b=qe(K,S),b===null)throw qe(K)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(S){throw at("WebGLRenderer: "+S.message),S}let Ke,R,y,B,L,U,ue,ge,te,le,Ee,Xe,Re,Ce,et,rt,ct,$,Le,de,De,Ue,be;function Ze(){Ke=new P_(b),Ke.init(),De=new gS(b,Ke),R=new S_(b,Ke,e,De),y=new pS(b,Ke),R.reversedDepthBuffer&&d&&y.buffers.depth.setReversed(!0),D=b.createFramebuffer(),ee=b.createFramebuffer(),j=b.createFramebuffer(),B=new D_(b),L=new eS,U=new mS(b,Ke,y,L,R,De,B),ue=new R_(V),ge=new Ox(b),Ue=new __(b,ge),te=new I_(b,ge,B,Ue),le=new U_(b,te,ge,Ue,B),$=new N_(b,R,U),et=new M_(L),Ee=new Qb(V,ue,Ke,R,Ue,et),Xe=new _S(V,L),Re=new nS,Ce=new lS(Ke),ct=new v_(V,ue,y,le,m,c),rt=new fS(V,le,R),be=new bS(b,B,R,y),Le=new b_(b,Ke,B),de=new L_(b,Ke,B),B.programs=Ee.programs,V.capabilities=R,V.extensions=Ke,V.properties=L,V.renderLists=Re,V.shadowMap=rt,V.state=y,V.info=B}Ze(),x!==$n&&(w=new O_(x,t.width,t.height,a,s,r));let $e=new ad(V,b);this.xr=$e,this.getContext=function(){return b},this.getContextAttributes=function(){return b.getContextAttributes()},this.forceContextLoss=function(){let S=Ke.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Ke.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return O},this.setPixelRatio=function(S){S!==void 0&&(O=S,this.setSize(he,Z,!1))},this.getSize=function(S){return S.set(he,Z)},this.setSize=function(S,K,re=!0){if($e.isPresenting){tt("WebGLRenderer: Can't change size while VR device is presenting.");return}he=S,Z=K,t.width=Math.floor(S*O),t.height=Math.floor(K*O),re===!0&&(t.style.width=S+"px",t.style.height=K+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,S,K)},this.getDrawingBufferSize=function(S){return S.set(he*O,Z*O).floor()},this.setDrawingBufferSize=function(S,K,re){he=S,Z=K,O=re,t.width=Math.floor(S*re),t.height=Math.floor(K*re),this.setViewport(0,0,S,K)},this.setEffects=function(S){if(x===$n){at("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(S){for(let K=0;K<S.length;K++)if(S[K].isOutputPass===!0){tt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(S||[])},this.getCurrentViewport=function(S){return S.copy(Te)},this.getViewport=function(S){return S.copy(q)},this.setViewport=function(S,K,re,ne){S.isVector4?q.set(S.x,S.y,S.z,S.w):q.set(S,K,re,ne),y.viewport(Te.copy(q).multiplyScalar(O).round())},this.getScissor=function(S){return S.copy(ce)},this.setScissor=function(S,K,re,ne){S.isVector4?ce.set(S.x,S.y,S.z,S.w):ce.set(S,K,re,ne),y.scissor(Se.copy(ce).multiplyScalar(O).round())},this.getScissorTest=function(){return pe},this.setScissorTest=function(S){y.setScissorTest(pe=S)},this.setOpaqueSort=function(S){F=S},this.setTransparentSort=function(S){P=S},this.getClearColor=function(S){return S.copy(ct.getClearColor())},this.setClearColor=function(){ct.setClearColor(...arguments)},this.getClearAlpha=function(){return ct.getClearAlpha()},this.setClearAlpha=function(){ct.setClearAlpha(...arguments)},this.clear=function(S=!0,K=!0,re=!0){let ne=0;if(S){let se=!1;if(Y!==null){let Oe=Y.texture.format;se=g.has(Oe)}if(se){let Oe=Y.texture.type,Ve=p.has(Oe),Pe=ct.getClearColor(),ze=ct.getClearAlpha(),je=Pe.r,ut=Pe.g,pt=Pe.b;Ve?(M[0]=je,M[1]=ut,M[2]=pt,M[3]=ze,b.clearBufferuiv(b.COLOR,0,M)):(E[0]=je,E[1]=ut,E[2]=pt,E[3]=ze,b.clearBufferiv(b.COLOR,0,E))}else ne|=b.COLOR_BUFFER_BIT}K&&(ne|=b.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),re&&(ne|=b.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ne!==0&&b.clear(ne)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(S){S.setRenderer(this),T=S},this.dispose=function(){t.removeEventListener("webglcontextlost",Ot,!1),t.removeEventListener("webglcontextrestored",_t,!1),t.removeEventListener("webglcontextcreationerror",zn,!1),ct.dispose(),Re.dispose(),Ce.dispose(),L.dispose(),ue.dispose(),le.dispose(),Ue.dispose(),be.dispose(),Ee.dispose(),$e.dispose(),$e.removeEventListener("sessionstart",ls),$e.removeEventListener("sessionend",Us),un.stop()};function Ot(S){S.preventDefault(),Bo("WebGLRenderer: Context Lost."),k=!0}function _t(){Bo("WebGLRenderer: Context Restored."),k=!1;let S=B.autoReset,K=rt.enabled,re=rt.autoUpdate,ne=rt.needsUpdate,se=rt.type;Ze(),B.autoReset=S,rt.enabled=K,rt.autoUpdate=re,rt.needsUpdate=ne,rt.type=se}function zn(S){at("WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Hn(S){let K=S.target;K.removeEventListener("dispose",Hn),Xa(K)}function Xa(S){go(S),L.remove(S)}function go(S){let K=L.get(S).programs;K!==void 0&&(K.forEach(function(re){Ee.releaseProgram(re)}),S.isShaderMaterial&&Ee.releaseShaderCache(S))}this.renderBufferDirect=function(S,K,re,ne,se,Oe){K===null&&(K=Be);let Ve=se.isMesh&&se.matrixWorld.determinantAffine()<0,Pe=ur(S,K,re,ne,se);y.setMaterial(ne,Ve);let ze=re.index,je=1;if(ne.wireframe===!0){if(ze=te.getWireframeAttribute(re),ze===void 0)return;je=2}let ut=re.drawRange,pt=re.attributes.position,Ge=ut.start*je,bt=(ut.start+ut.count)*je;Oe!==null&&(Ge=Math.max(Ge,Oe.start*je),bt=Math.min(bt,(Oe.start+Oe.count)*je)),ze!==null?(Ge=Math.max(Ge,0),bt=Math.min(bt,ze.count)):pt!=null&&(Ge=Math.max(Ge,0),bt=Math.min(bt,pt.count));let Et=bt-Ge;if(Et<0||Et===1/0)return;Ue.setup(se,ne,Pe,re,ze);let kt,Rt=Le;if(ze!==null&&(kt=ge.get(ze),Rt=de,Rt.setIndex(kt)),se.isMesh)ne.wireframe===!0?(y.setLineWidth(ne.wireframeLinewidth*Q()),Rt.setMode(b.LINES)):Rt.setMode(b.TRIANGLES);else if(se.isLine){let $t=ne.linewidth;$t===void 0&&($t=1),y.setLineWidth($t*Q()),se.isLineSegments?Rt.setMode(b.LINES):se.isLineLoop?Rt.setMode(b.LINE_LOOP):Rt.setMode(b.LINE_STRIP)}else se.isPoints?Rt.setMode(b.POINTS):se.isSprite&&Rt.setMode(b.TRIANGLES);if(se.isBatchedMesh)if(Ke.get("WEBGL_multi_draw"))Rt.renderMultiDraw(se._multiDrawStarts,se._multiDrawCounts,se._multiDrawCount);else{let $t=se._multiDrawStarts,We=se._multiDrawCounts,Bt=se._multiDrawCount,mt=ze?ge.get(ze).bytesPerElement:1,Yt=L.get(ne).currentProgram.getUniforms();for(let Wt=0;Wt<Bt;Wt++)Yt.setValue(b,"_gl_DrawID",Wt),Rt.render($t[Wt]/mt,We[Wt])}else if(se.isInstancedMesh)Rt.renderInstances(Ge,Et,se.count);else if(re.isInstancedBufferGeometry){let $t=re._maxInstanceCount!==void 0?re._maxInstanceCount:1/0,We=Math.min(re.instanceCount,$t);Rt.renderInstances(Ge,Et,We)}else Rt.render(Ge,Et)};function xo(S,K,re){S.transparent===!0&&S.side===Ft&&S.forceSinglePass===!1?(S.side=xn,S.needsUpdate=!0,Jn(S,K,re),S.side=ji,S.needsUpdate=!0,Jn(S,K,re),S.side=Ft):Jn(S,K,re)}this.compile=function(S,K,re=null){re===null&&(re=S),C=Ce.get(re),C.init(K),_.push(C),re.traverseVisible(function(se){se.isLight&&se.layers.test(K.layers)&&(C.pushLight(se),se.castShadow&&C.pushShadow(se))}),S!==re&&S.traverseVisible(function(se){se.isLight&&se.layers.test(K.layers)&&(C.pushLight(se),se.castShadow&&C.pushShadow(se))}),C.setupLights();let ne=new Set;return S.traverse(function(se){if(!(se.isMesh||se.isPoints||se.isLine||se.isSprite))return;let Oe=se.material;if(Oe)if(Array.isArray(Oe))for(let Ve=0;Ve<Oe.length;Ve++){let Pe=Oe[Ve];xo(Pe,re,se),ne.add(Pe)}else xo(Oe,re,se),ne.add(Oe)}),C=_.pop(),ne},this.compileAsync=function(S,K,re=null){let ne=this.compile(S,K,re);return new Promise(se=>{function Oe(){if(ne.forEach(function(Ve){L.get(Ve).currentProgram.isReady()&&ne.delete(Ve)}),ne.size===0){se(S);return}setTimeout(Oe,10)}Ke.get("KHR_parallel_shader_compile")!==null?Oe():setTimeout(Oe,10)})};let lr=null;function yo(S){lr&&lr(S)}function ls(){un.stop()}function Us(){un.start()}let un=new xm;un.setAnimationLoop(yo),typeof self<"u"&&un.setContext(self),this.setAnimationLoop=function(S){lr=S,$e.setAnimationLoop(S),S===null?un.stop():un.start()},$e.addEventListener("sessionstart",ls),$e.addEventListener("sessionend",Us),this.render=function(S,K){if(K!==void 0&&K.isCamera!==!0){at("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(k===!0)return;T!==null&&T.renderStart(S,K);let re=$e.enabled===!0&&$e.isPresenting===!0,ne=w!==null&&(Y===null||re)&&w.begin(V,Y);if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),K.parent===null&&K.matrixWorldAutoUpdate===!0&&K.updateMatrixWorld(),$e.enabled===!0&&$e.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&($e.cameraAutoUpdate===!0&&$e.updateCamera(K),K=$e.getCamera()),S.isScene===!0&&S.onBeforeRender(V,S,K,Y),C=Ce.get(S,_.length),C.init(K),C.state.textureUnits=U.getTextureUnits(),_.push(C),fe.multiplyMatrices(K.projectionMatrix,K.matrixWorldInverse),z.setFromProjectionMatrix(fe,pi,K.reversedDepth),J=this.localClippingEnabled,oe=et.init(this.clippingPlanes,J),A=Re.get(S,N.length),A.init(),N.push(A),$e.enabled===!0&&$e.isPresenting===!0){let Ve=V.xr.getDepthSensingMesh();Ve!==null&&Ln(Ve,K,-1/0,V.sortObjects)}Ln(S,K,0,V.sortObjects),A.finish(),V.sortObjects===!0&&A.sort(F,P,K.reversedDepth),Ae=$e.enabled===!1||$e.isPresenting===!1||$e.hasDepthSensing()===!1,Ae&&ct.addToRenderList(A,S),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),oe===!0&&et.beginShadows();let se=C.state.shadowsArray;if(rt.render(se,S,K),oe===!0&&et.endShadows(),(ne&&w.hasRenderPass())===!1){let Ve=A.opaque,Pe=A.transmissive;if(C.setupLights(),K.isArrayCamera){let ze=K.cameras;if(Pe.length>0)for(let je=0,ut=ze.length;je<ut;je++){let pt=ze[je];cs(Ve,Pe,S,pt)}Ae&&ct.render(S);for(let je=0,ut=ze.length;je<ut;je++){let pt=ze[je];cr(A,S,pt,pt.viewport)}}else Pe.length>0&&cs(Ve,Pe,S,K),Ae&&ct.render(S),cr(A,S,K)}Y!==null&&X===0&&(U.updateMultisampleRenderTarget(Y),U.updateRenderTargetMipmap(Y)),ne&&w.end(V),S.isScene===!0&&S.onAfterRender(V,S,K),Ue.resetDefaultState(),me=-1,ae=null,_.pop(),_.length>0?(C=_[_.length-1],U.setTextureUnits(C.state.textureUnits),oe===!0&&et.setGlobalState(V.clippingPlanes,C.state.camera)):C=null,N.pop(),N.length>0?A=N[N.length-1]:A=null,T!==null&&T.renderEnd()};function Ln(S,K,re,ne){if(S.visible===!1)return;if(S.layers.test(K.layers)){if(S.isGroup)re=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(K);else if(S.isLightProbeGrid)C.pushLightProbeGrid(S);else if(S.isLight)C.pushLight(S),S.castShadow&&C.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||z.intersectsSprite(S)){ne&&ve.setFromMatrixPosition(S.matrixWorld).applyMatrix4(fe);let Ve=le.update(S),Pe=S.material;Pe.visible&&A.push(S,Ve,Pe,re,ve.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||z.intersectsObject(S))){let Ve=le.update(S),Pe=S.material;if(ne&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),ve.copy(S.boundingSphere.center)):(Ve.boundingSphere===null&&Ve.computeBoundingSphere(),ve.copy(Ve.boundingSphere.center)),ve.applyMatrix4(S.matrixWorld).applyMatrix4(fe)),Array.isArray(Pe)){let ze=Ve.groups;for(let je=0,ut=ze.length;je<ut;je++){let pt=ze[je],Ge=Pe[pt.materialIndex];Ge&&Ge.visible&&A.push(S,Ve,Ge,re,ve.z,pt)}}else Pe.visible&&A.push(S,Ve,Pe,re,ve.z,null)}}let Oe=S.children;for(let Ve=0,Pe=Oe.length;Ve<Pe;Ve++)Ln(Oe[Ve],K,re,ne)}function cr(S,K,re,ne){let{opaque:se,transmissive:Oe,transparent:Ve}=S;C.setupLightsView(re),oe===!0&&et.setGlobalState(V.clippingPlanes,re),ne&&y.viewport(Te.copy(ne)),se.length>0&&Fs(se,K,re),Oe.length>0&&Fs(Oe,K,re),Ve.length>0&&Fs(Ve,K,re),y.buffers.depth.setTest(!0),y.buffers.depth.setMask(!0),y.buffers.color.setMask(!0),y.setPolygonOffset(!1)}function cs(S,K,re,ne){if((re.isScene===!0?re.overrideMaterial:null)!==null)return;if(C.state.transmissionRenderTarget[ne.id]===void 0){let Ge=Ke.has("EXT_color_buffer_half_float")||Ke.has("EXT_color_buffer_float");C.state.transmissionRenderTarget[ne.id]=new Zt(1,1,{generateMipmaps:!0,type:Ge?on:$n,minFilter:gi,samples:Math.max(4,R.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:yt.workingColorSpace})}let Oe=C.state.transmissionRenderTarget[ne.id],Ve=ne.viewport||Te;Oe.setSize(Ve.z*V.transmissionResolutionScale,Ve.w*V.transmissionResolutionScale);let Pe=V.getRenderTarget(),ze=V.getActiveCubeFace(),je=V.getActiveMipmapLevel();V.setRenderTarget(Oe),V.getClearColor(dt),it=V.getClearAlpha(),it<1&&V.setClearColor(16777215,.5),V.clear(),Ae&&ct.render(re);let ut=V.toneMapping;V.toneMapping=qn;let pt=ne.viewport;if(ne.viewport!==void 0&&(ne.viewport=void 0),C.setupLightsView(ne),oe===!0&&et.setGlobalState(V.clippingPlanes,ne),Fs(S,re,ne),U.updateMultisampleRenderTarget(Oe),U.updateRenderTargetMipmap(Oe),Ke.has("WEBGL_multisampled_render_to_texture")===!1){let Ge=!1;for(let bt=0,Et=K.length;bt<Et;bt++){let kt=K[bt],{object:Rt,geometry:$t,material:We,group:Bt}=kt;if(We.side===Ft&&Rt.layers.test(ne.layers)){let mt=We.side;We.side=xn,We.needsUpdate=!0,Fi(Rt,re,ne,$t,We,Bt),We.side=mt,We.needsUpdate=!0,Ge=!0}}Ge===!0&&(U.updateMultisampleRenderTarget(Oe),U.updateRenderTargetMipmap(Oe))}V.setRenderTarget(Pe,ze,je),V.setClearColor(dt,it),pt!==void 0&&(ne.viewport=pt),V.toneMapping=ut}function Fs(S,K,re){let ne=K.isScene===!0?K.overrideMaterial:null;for(let se=0,Oe=S.length;se<Oe;se++){let Ve=S[se],{object:Pe,geometry:ze,group:je}=Ve,ut=Ve.material;ut.allowOverride===!0&&ne!==null&&(ut=ne),Pe.layers.test(re.layers)&&Fi(Pe,K,re,ze,ut,je)}}function Fi(S,K,re,ne,se,Oe){S.onBeforeRender(V,K,re,ne,se,Oe),S.modelViewMatrix.multiplyMatrices(re.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),se.onBeforeRender(V,K,re,ne,S,Oe),se.transparent===!0&&se.side===Ft&&se.forceSinglePass===!1?(se.side=xn,se.needsUpdate=!0,V.renderBufferDirect(re,K,ne,se,S,Oe),se.side=ji,se.needsUpdate=!0,V.renderBufferDirect(re,K,ne,se,S,Oe),se.side=Ft):V.renderBufferDirect(re,K,ne,se,S,Oe),S.onAfterRender(V,K,re,ne,se,Oe)}function Jn(S,K,re){K.isScene!==!0&&(K=Be);let ne=L.get(S),se=C.state.lights,Oe=C.state.shadowsArray,Ve=se.state.version,Pe=Ee.getParameters(S,se.state,Oe,K,re,C.state.lightProbeGridArray),ze=Ee.getProgramCacheKey(Pe),je=ne.programs;ne.environment=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?K.environment:null,ne.fog=K.fog;let ut=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap;ne.envMap=ue.get(S.envMap||ne.environment,ut),ne.envMapRotation=ne.environment!==null&&S.envMap===null?K.environmentRotation:S.envMapRotation,je===void 0&&(S.addEventListener("dispose",Hn),je=new Map,ne.programs=je);let pt=je.get(ze);if(pt!==void 0){if(ne.currentProgram===pt&&ne.lightsStateVersion===Ve)return qa(S,Pe),pt}else Pe.uniforms=Ee.getUniforms(S),T!==null&&S.isNodeMaterial&&T.build(S,re,Pe),S.onBeforeCompile(Pe,V),pt=Ee.acquireProgram(Pe,ze),je.set(ze,pt),ne.uniforms=Pe.uniforms;let Ge=ne.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ge.clippingPlanes=et.uniform),qa(S,Pe),ne.needsLights=_o(S),ne.lightsStateVersion=Ve,ne.needsLights&&(Ge.ambientLightColor.value=se.state.ambient,Ge.lightProbe.value=se.state.probe,Ge.directionalLights.value=se.state.directional,Ge.directionalLightShadows.value=se.state.directionalShadow,Ge.spotLights.value=se.state.spot,Ge.spotLightShadows.value=se.state.spotShadow,Ge.rectAreaLights.value=se.state.rectArea,Ge.ltc_1.value=se.state.rectAreaLTC1,Ge.ltc_2.value=se.state.rectAreaLTC2,Ge.pointLights.value=se.state.point,Ge.pointLightShadows.value=se.state.pointShadow,Ge.hemisphereLights.value=se.state.hemi,Ge.directionalShadowMatrix.value=se.state.directionalShadowMatrix,Ge.spotLightMatrix.value=se.state.spotLightMatrix,Ge.spotLightMap.value=se.state.spotLightMap,Ge.pointShadowMatrix.value=se.state.pointShadowMatrix),ne.lightProbeGrid=C.state.lightProbeGridArray.length>0,ne.currentProgram=pt,ne.uniformsList=null,pt}function vo(S){if(S.uniformsList===null){let K=S.currentProgram.getUniforms();S.uniformsList=Kr.seqWithValue(K.seq,S.uniforms)}return S.uniformsList}function qa(S,K){let re=L.get(S);re.outputColorSpace=K.outputColorSpace,re.batching=K.batching,re.batchingColor=K.batchingColor,re.instancing=K.instancing,re.instancingColor=K.instancingColor,re.instancingMorph=K.instancingMorph,re.skinning=K.skinning,re.morphTargets=K.morphTargets,re.morphNormals=K.morphNormals,re.morphColors=K.morphColors,re.morphTargetsCount=K.morphTargetsCount,re.numClippingPlanes=K.numClippingPlanes,re.numIntersection=K.numClipIntersection,re.vertexAlphas=K.vertexAlphas,re.vertexTangents=K.vertexTangents,re.toneMapping=K.toneMapping}function $a(S,K){if(S.length===0)return null;if(S.length===1)return S[0].texture!==null?S[0]:null;v.setFromMatrixPosition(K.matrixWorld);for(let re=0,ne=S.length;re<ne;re++){let se=S[re];if(se.texture!==null&&se.boundingBox.containsPoint(v))return se}return null}function ur(S,K,re,ne,se){K.isScene!==!0&&(K=Be),U.resetTextureUnits();let Oe=K.fog,Ve=ne.isMeshStandardMaterial||ne.isMeshLambertMaterial||ne.isMeshPhongMaterial?K.environment:null,Pe=Y===null?V.outputColorSpace:Y.isXRRenderTarget===!0?Y.texture.colorSpace:yt.workingColorSpace,ze=ne.isMeshStandardMaterial||ne.isMeshLambertMaterial&&!ne.envMap||ne.isMeshPhongMaterial&&!ne.envMap,je=ue.get(ne.envMap||Ve,ze),ut=ne.vertexColors===!0&&!!re.attributes.color&&re.attributes.color.itemSize===4,pt=!!re.attributes.tangent&&(!!ne.normalMap||ne.anisotropy>0),Ge=!!re.morphAttributes.position,bt=!!re.morphAttributes.normal,Et=!!re.morphAttributes.color,kt=qn;ne.toneMapped&&(Y===null||Y.isXRRenderTarget===!0)&&(kt=V.toneMapping);let Rt=re.morphAttributes.position||re.morphAttributes.normal||re.morphAttributes.color,$t=Rt!==void 0?Rt.length:0,We=L.get(ne),Bt=C.state.lights;if(oe===!0&&(J===!0||S!==ae)){let Dt=S===ae&&ne.id===me;et.setState(ne,S,Dt)}let mt=!1;ne.version===We.__version?(We.needsLights&&We.lightsStateVersion!==Bt.state.version||We.outputColorSpace!==Pe||se.isBatchedMesh&&We.batching===!1||!se.isBatchedMesh&&We.batching===!0||se.isBatchedMesh&&We.batchingColor===!0&&se.colorTexture===null||se.isBatchedMesh&&We.batchingColor===!1&&se.colorTexture!==null||se.isInstancedMesh&&We.instancing===!1||!se.isInstancedMesh&&We.instancing===!0||se.isSkinnedMesh&&We.skinning===!1||!se.isSkinnedMesh&&We.skinning===!0||se.isInstancedMesh&&We.instancingColor===!0&&se.instanceColor===null||se.isInstancedMesh&&We.instancingColor===!1&&se.instanceColor!==null||se.isInstancedMesh&&We.instancingMorph===!0&&se.morphTexture===null||se.isInstancedMesh&&We.instancingMorph===!1&&se.morphTexture!==null||We.envMap!==je||ne.fog===!0&&We.fog!==Oe||We.numClippingPlanes!==void 0&&(We.numClippingPlanes!==et.numPlanes||We.numIntersection!==et.numIntersection)||We.vertexAlphas!==ut||We.vertexTangents!==pt||We.morphTargets!==Ge||We.morphNormals!==bt||We.morphColors!==Et||We.toneMapping!==kt||We.morphTargetsCount!==$t||!!We.lightProbeGrid!=C.state.lightProbeGridArray.length>0)&&(mt=!0):(mt=!0,We.__version=ne.version);let Yt=We.currentProgram;mt===!0&&(Yt=Jn(ne,K,se),T&&ne.isNodeMaterial&&T.onUpdateProgram(ne,Yt,We));let Wt=!1,hn=!1,st=!1,Mt=Yt.getUniforms(),Vt=We.uniforms;if(y.useProgram(Yt.program)&&(Wt=!0,hn=!0,st=!0),ne.id!==me&&(me=ne.id,hn=!0),We.needsLights){let Dt=$a(C.state.lightProbeGridArray,se);We.lightProbeGrid!==Dt&&(We.lightProbeGrid=Dt,hn=!0)}if(Wt||ae!==S){y.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),Mt.setValue(b,"projectionMatrix",S.projectionMatrix),Mt.setValue(b,"viewMatrix",S.matrixWorldInverse);let Mi=Mt.map.cameraPosition;Mi!==void 0&&Mi.setValue(b,ye.setFromMatrixPosition(S.matrixWorld)),R.logarithmicDepthBuffer&&Mt.setValue(b,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(ne.isMeshPhongMaterial||ne.isMeshToonMaterial||ne.isMeshLambertMaterial||ne.isMeshBasicMaterial||ne.isMeshStandardMaterial||ne.isShaderMaterial)&&Mt.setValue(b,"isOrthographic",S.isOrthographicCamera===!0),ae!==S&&(ae=S,hn=!0,st=!0)}if(We.needsLights&&(Bt.state.directionalShadowMap.length>0&&Mt.setValue(b,"directionalShadowMap",Bt.state.directionalShadowMap,U),Bt.state.spotShadowMap.length>0&&Mt.setValue(b,"spotShadowMap",Bt.state.spotShadowMap,U),Bt.state.pointShadowMap.length>0&&Mt.setValue(b,"pointShadowMap",Bt.state.pointShadowMap,U)),se.isSkinnedMesh){Mt.setOptional(b,se,"bindMatrix"),Mt.setOptional(b,se,"bindMatrixInverse");let Dt=se.skeleton;Dt&&(Dt.boneTexture===null&&Dt.computeBoneTexture(),Mt.setValue(b,"boneTexture",Dt.boneTexture,U))}se.isBatchedMesh&&(Mt.setOptional(b,se,"batchingTexture"),Mt.setValue(b,"batchingTexture",se._matricesTexture,U),Mt.setOptional(b,se,"batchingIdTexture"),Mt.setValue(b,"batchingIdTexture",se._indirectTexture,U),Mt.setOptional(b,se,"batchingColorTexture"),se._colorsTexture!==null&&Mt.setValue(b,"batchingColorTexture",se._colorsTexture,U));let Kn=re.morphAttributes;if((Kn.position!==void 0||Kn.normal!==void 0||Kn.color!==void 0)&&$.update(se,re,Yt),(hn||We.receiveShadow!==se.receiveShadow)&&(We.receiveShadow=se.receiveShadow,Mt.setValue(b,"receiveShadow",se.receiveShadow)),(ne.isMeshStandardMaterial||ne.isMeshLambertMaterial||ne.isMeshPhongMaterial)&&ne.envMap===null&&K.environment!==null&&(Vt.envMapIntensity.value=K.environmentIntensity),Vt.dfgLUT!==void 0&&(Vt.dfgLUT.value=MS()),hn){if(Mt.setValue(b,"toneMappingExposure",V.toneMappingExposure),We.needsLights&&Oi(Vt,st),Oe&&ne.fog===!0&&Xe.refreshFogUniforms(Vt,Oe),Xe.refreshMaterialUniforms(Vt,ne,O,Z,C.state.transmissionRenderTarget[S.id]),We.needsLights&&We.lightProbeGrid){let Dt=We.lightProbeGrid;Vt.probesSH.value=Dt.texture,Vt.probesMin.value.copy(Dt.boundingBox.min),Vt.probesMax.value.copy(Dt.boundingBox.max),Vt.probesResolution.value.copy(Dt.resolution)}Kr.upload(b,vo(We),Vt,U)}if(ne.isShaderMaterial&&ne.uniformsNeedUpdate===!0&&(Kr.upload(b,vo(We),Vt,U),ne.uniformsNeedUpdate=!1),ne.isSpriteMaterial&&Mt.setValue(b,"center",se.center),Mt.setValue(b,"modelViewMatrix",se.modelViewMatrix),Mt.setValue(b,"normalMatrix",se.normalMatrix),Mt.setValue(b,"modelMatrix",se.matrixWorld),ne.uniformsGroups!==void 0){let Dt=ne.uniformsGroups;for(let Mi=0,Bi=Dt.length;Mi<Bi;Mi++){let ci=Dt[Mi];be.update(ci,Yt),be.bind(ci,Yt)}}return Yt}function Oi(S,K){S.ambientLightColor.needsUpdate=K,S.lightProbe.needsUpdate=K,S.directionalLights.needsUpdate=K,S.directionalLightShadows.needsUpdate=K,S.pointLights.needsUpdate=K,S.pointLightShadows.needsUpdate=K,S.spotLights.needsUpdate=K,S.spotLightShadows.needsUpdate=K,S.rectAreaLights.needsUpdate=K,S.hemisphereLights.needsUpdate=K}function _o(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return Y},this.setRenderTargetTextures=function(S,K,re){let ne=L.get(S);ne.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,ne.__autoAllocateDepthBuffer===!1&&(ne.__useRenderToTexture=!1),L.get(S.texture).__webglTexture=K,L.get(S.depthTexture).__webglTexture=ne.__autoAllocateDepthBuffer?void 0:re,ne.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,K){let re=L.get(S);re.__webglFramebuffer=K,re.__useDefaultFramebuffer=K===void 0},this.setRenderTarget=function(S,K=0,re=0){Y=S,G=K,X=re;let ne=null,se=!1,Oe=!1;if(S){let Pe=L.get(S);if(Pe.__useDefaultFramebuffer!==void 0){y.bindFramebuffer(b.FRAMEBUFFER,Pe.__webglFramebuffer),Te.copy(S.viewport),Se.copy(S.scissor),lt=S.scissorTest,y.viewport(Te),y.scissor(Se),y.setScissorTest(lt),me=-1;return}else if(Pe.__webglFramebuffer===void 0)U.setupRenderTarget(S);else if(Pe.__hasExternalTextures)U.rebindTextures(S,L.get(S.texture).__webglTexture,L.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let ut=S.depthTexture;if(Pe.__boundDepthTexture!==ut){if(ut!==null&&L.has(ut)&&(S.width!==ut.image.width||S.height!==ut.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");U.setupDepthRenderbuffer(S)}}let ze=S.texture;(ze.isData3DTexture||ze.isDataArrayTexture||ze.isCompressedArrayTexture)&&(Oe=!0);let je=L.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(je[K])?ne=je[K][re]:ne=je[K],se=!0):S.samples>0&&U.useMultisampledRTT(S)===!1?ne=L.get(S).__webglMultisampledFramebuffer:Array.isArray(je)?ne=je[re]:ne=je,Te.copy(S.viewport),Se.copy(S.scissor),lt=S.scissorTest}else Te.copy(q).multiplyScalar(O).floor(),Se.copy(ce).multiplyScalar(O).floor(),lt=pe;if(re!==0&&(ne=D),y.bindFramebuffer(b.FRAMEBUFFER,ne)&&y.drawBuffers(S,ne),y.viewport(Te),y.scissor(Se),y.setScissorTest(lt),se){let Pe=L.get(S.texture);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_CUBE_MAP_POSITIVE_X+K,Pe.__webglTexture,re)}else if(Oe){let Pe=K;for(let ze=0;ze<S.textures.length;ze++){let je=L.get(S.textures[ze]);b.framebufferTextureLayer(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0+ze,je.__webglTexture,re,Pe)}}else if(S!==null&&re!==0){let Pe=L.get(S.texture);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,Pe.__webglTexture,re)}me=-1},this.readRenderTargetPixels=function(S,K,re,ne,se,Oe,Ve,Pe=0){if(!(S&&S.isWebGLRenderTarget)){at("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ze=L.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Ve!==void 0&&(ze=ze[Ve]),ze){y.bindFramebuffer(b.FRAMEBUFFER,ze);try{let je=S.textures[Pe],ut=je.format,pt=je.type;if(S.textures.length>1&&b.readBuffer(b.COLOR_ATTACHMENT0+Pe),!R.textureFormatReadable(ut)){at("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!R.textureTypeReadable(pt)){at("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}K>=0&&K<=S.width-ne&&re>=0&&re<=S.height-se&&b.readPixels(K,re,ne,se,De.convert(ut),De.convert(pt),Oe)}finally{let je=Y!==null?L.get(Y).__webglFramebuffer:null;y.bindFramebuffer(b.FRAMEBUFFER,je)}}},this.readRenderTargetPixelsAsync=async function(S,K,re,ne,se,Oe,Ve,Pe=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ze=L.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Ve!==void 0&&(ze=ze[Ve]),ze)if(K>=0&&K<=S.width-ne&&re>=0&&re<=S.height-se){y.bindFramebuffer(b.FRAMEBUFFER,ze);let je=S.textures[Pe],ut=je.format,pt=je.type;if(S.textures.length>1&&b.readBuffer(b.COLOR_ATTACHMENT0+Pe),!R.textureFormatReadable(ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!R.textureTypeReadable(pt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ge=b.createBuffer();b.bindBuffer(b.PIXEL_PACK_BUFFER,Ge),b.bufferData(b.PIXEL_PACK_BUFFER,Oe.byteLength,b.STREAM_READ),b.readPixels(K,re,ne,se,De.convert(ut),De.convert(pt),0);let bt=Y!==null?L.get(Y).__webglFramebuffer:null;y.bindFramebuffer(b.FRAMEBUFFER,bt);let Et=b.fenceSync(b.SYNC_GPU_COMMANDS_COMPLETE,0);return b.flush(),await kp(b,Et,4),b.bindBuffer(b.PIXEL_PACK_BUFFER,Ge),b.getBufferSubData(b.PIXEL_PACK_BUFFER,0,Oe),b.deleteBuffer(Ge),b.deleteSync(Et),Oe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,K=null,re=0){let ne=Math.pow(2,-re),se=Math.floor(S.image.width*ne),Oe=Math.floor(S.image.height*ne),Ve=K!==null?K.x:0,Pe=K!==null?K.y:0;U.setTexture2D(S,0),b.copyTexSubImage2D(b.TEXTURE_2D,re,0,0,Ve,Pe,se,Oe),y.unbindTexture()},this.copyTextureToTexture=function(S,K,re=null,ne=null,se=0,Oe=0){let Ve,Pe,ze,je,ut,pt,Ge,bt,Et,kt=S.isCompressedTexture?S.mipmaps[Oe]:S.image;if(re!==null)Ve=re.max.x-re.min.x,Pe=re.max.y-re.min.y,ze=re.isBox3?re.max.z-re.min.z:1,je=re.min.x,ut=re.min.y,pt=re.isBox3?re.min.z:0;else{let Vt=Math.pow(2,-se);Ve=Math.floor(kt.width*Vt),Pe=Math.floor(kt.height*Vt),S.isDataArrayTexture?ze=kt.depth:S.isData3DTexture?ze=Math.floor(kt.depth*Vt):ze=1,je=0,ut=0,pt=0}ne!==null?(Ge=ne.x,bt=ne.y,Et=ne.z):(Ge=0,bt=0,Et=0);let Rt=De.convert(K.format),$t=De.convert(K.type),We;K.isData3DTexture?(U.setTexture3D(K,0),We=b.TEXTURE_3D):K.isDataArrayTexture||K.isCompressedArrayTexture?(U.setTexture2DArray(K,0),We=b.TEXTURE_2D_ARRAY):(U.setTexture2D(K,0),We=b.TEXTURE_2D),y.activeTexture(b.TEXTURE0),y.pixelStorei(b.UNPACK_FLIP_Y_WEBGL,K.flipY),y.pixelStorei(b.UNPACK_PREMULTIPLY_ALPHA_WEBGL,K.premultiplyAlpha),y.pixelStorei(b.UNPACK_ALIGNMENT,K.unpackAlignment);let Bt=y.getParameter(b.UNPACK_ROW_LENGTH),mt=y.getParameter(b.UNPACK_IMAGE_HEIGHT),Yt=y.getParameter(b.UNPACK_SKIP_PIXELS),Wt=y.getParameter(b.UNPACK_SKIP_ROWS),hn=y.getParameter(b.UNPACK_SKIP_IMAGES);y.pixelStorei(b.UNPACK_ROW_LENGTH,kt.width),y.pixelStorei(b.UNPACK_IMAGE_HEIGHT,kt.height),y.pixelStorei(b.UNPACK_SKIP_PIXELS,je),y.pixelStorei(b.UNPACK_SKIP_ROWS,ut),y.pixelStorei(b.UNPACK_SKIP_IMAGES,pt);let st=S.isDataArrayTexture||S.isData3DTexture,Mt=K.isDataArrayTexture||K.isData3DTexture;if(S.isDepthTexture){let Vt=L.get(S),Kn=L.get(K),Dt=L.get(Vt.__renderTarget),Mi=L.get(Kn.__renderTarget);y.bindFramebuffer(b.READ_FRAMEBUFFER,Dt.__webglFramebuffer),y.bindFramebuffer(b.DRAW_FRAMEBUFFER,Mi.__webglFramebuffer);for(let Bi=0;Bi<ze;Bi++)st&&(b.framebufferTextureLayer(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,L.get(S).__webglTexture,se,pt+Bi),b.framebufferTextureLayer(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,L.get(K).__webglTexture,Oe,Et+Bi)),b.blitFramebuffer(je,ut,Ve,Pe,Ge,bt,Ve,Pe,b.DEPTH_BUFFER_BIT,b.NEAREST);y.bindFramebuffer(b.READ_FRAMEBUFFER,null),y.bindFramebuffer(b.DRAW_FRAMEBUFFER,null)}else if(se!==0||S.isRenderTargetTexture||L.has(S)){let Vt=L.get(S),Kn=L.get(K);y.bindFramebuffer(b.READ_FRAMEBUFFER,ee),y.bindFramebuffer(b.DRAW_FRAMEBUFFER,j);for(let Dt=0;Dt<ze;Dt++)st?b.framebufferTextureLayer(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,Vt.__webglTexture,se,pt+Dt):b.framebufferTexture2D(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,Vt.__webglTexture,se),Mt?b.framebufferTextureLayer(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,Kn.__webglTexture,Oe,Et+Dt):b.framebufferTexture2D(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,Kn.__webglTexture,Oe),se!==0?b.blitFramebuffer(je,ut,Ve,Pe,Ge,bt,Ve,Pe,b.COLOR_BUFFER_BIT,b.NEAREST):Mt?b.copyTexSubImage3D(We,Oe,Ge,bt,Et+Dt,je,ut,Ve,Pe):b.copyTexSubImage2D(We,Oe,Ge,bt,je,ut,Ve,Pe);y.bindFramebuffer(b.READ_FRAMEBUFFER,null),y.bindFramebuffer(b.DRAW_FRAMEBUFFER,null)}else Mt?S.isDataTexture||S.isData3DTexture?b.texSubImage3D(We,Oe,Ge,bt,Et,Ve,Pe,ze,Rt,$t,kt.data):K.isCompressedArrayTexture?b.compressedTexSubImage3D(We,Oe,Ge,bt,Et,Ve,Pe,ze,Rt,kt.data):b.texSubImage3D(We,Oe,Ge,bt,Et,Ve,Pe,ze,Rt,$t,kt):S.isDataTexture?b.texSubImage2D(b.TEXTURE_2D,Oe,Ge,bt,Ve,Pe,Rt,$t,kt.data):S.isCompressedTexture?b.compressedTexSubImage2D(b.TEXTURE_2D,Oe,Ge,bt,kt.width,kt.height,Rt,kt.data):b.texSubImage2D(b.TEXTURE_2D,Oe,Ge,bt,Ve,Pe,Rt,$t,kt);y.pixelStorei(b.UNPACK_ROW_LENGTH,Bt),y.pixelStorei(b.UNPACK_IMAGE_HEIGHT,mt),y.pixelStorei(b.UNPACK_SKIP_PIXELS,Yt),y.pixelStorei(b.UNPACK_SKIP_ROWS,Wt),y.pixelStorei(b.UNPACK_SKIP_IMAGES,hn),Oe===0&&K.generateMipmaps&&b.generateMipmap(We),y.unbindTexture()},this.initRenderTarget=function(S){L.get(S).__webglFramebuffer===void 0&&U.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?U.setTextureCube(S,0):S.isData3DTexture?U.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?U.setTexture2DArray(S,0):U.setTexture2D(S,0),y.unbindTexture()},this.resetState=function(){G=0,X=0,Y=null,y.reset(),Ue.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return pi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=yt._getDrawingBufferColorSpace(e),t.unpackColorSpace=yt._getUnpackColorSpace()}};var tu=class{constructor(e=3){this.earthRadius=e,this.center=new I,this.sample=new I,this.projected=new I,this.right=new I,this.up=new I,this.ray=new I,this.snapshot={nodes:Object.create(null),revision:0,timestamp:0,interacting:!1,hidden:!1},this.changed=!1,this.generation=0}begin(e,t,i,s,r,o,a,c,l=!1){this.camera=e,this.width=t,this.height=i,e.updateMatrixWorld(!0),this.right.set(1,0,0).applyQuaternion(e.quaternion),this.up.set(0,1,0).applyQuaternion(e.quaternion);let u=this.snapshot;this.changed=u.mission!==r||u.placements!==o||u.interacting!==c||u.hidden!==l||a-u.timestamp>120||a<u.timestamp,u.mission=r,u.placements=o,u.timestamp=a,u.interacting=c,u.hidden=l,this.generation++}occluded(e){if(this.earthRadius<=0)return!1;let t=this.camera.position;this.ray.copy(e).sub(t);let i=this.ray.length();this.ray.divideScalar(i||1);let s=t.dot(this.ray),r=t.lengthSq()-this.earthRadius**2,o=s*s-r;return o>=0&&-s-Math.sqrt(o)>0&&-s-Math.sqrt(o)<i-.002}add(e,t,i,s,r,o=!1){let a=this.snapshot,c=a.nodes[e]||(a.nodes[e]={x:NaN,y:NaN,radius:NaN,iconRadius:NaN});this.center.copy(t).addScaledVector(this.up,i),this.projected.copy(this.center).project(this.camera);let l=(this.projected.x+1)*this.width/2,u=(1-this.projected.y)*this.height/2,h=!o&&Number.isFinite(l)&&Number.isFinite(u)&&this.projected.z>-1&&this.projected.z<1,d=h?"":"clipped";this.sample.copy(this.center).addScaledVector(this.right,s).project(this.camera);let f=Math.hypot((this.sample.x+1)*this.width/2-l,(1-this.sample.y)*this.height/2-u),m=f*r/s;(!Number.isFinite(f)||f<=0)&&(h=!1,d="radius"),(this.occluded(this.center)||i>0&&this.occluded(t))&&(h=!1,d="earth");for(let x=0;x<4&&h;x++)this.sample.copy(this.center).addScaledVector(x<2?this.right:this.up,(x%2?1:-1)*r),this.occluded(this.sample)&&(h=!1,d="earth");(l-m<0||l+m>this.width||u-m<0||u+m>this.height)&&(h=!1,d="viewport"),(!Number.isFinite(c.x)||Math.abs(c.x-l)>.02||Math.abs(c.y-u)>.02||Math.abs(c.radius-f)>.02||Math.abs(c.iconRadius-m)>.02||c.eligible!==h)&&(c.x=l,c.y=u,c.radius=f,c.iconRadius=m,c.eligible=h,c.reason=d,this.changed=!0),c.generation=this.generation}finish(){for(let e in this.snapshot.nodes)this.snapshot.nodes[e].generation!==this.generation&&(delete this.snapshot.nodes[e],this.changed=!0);return this.changed&&this.snapshot.revision++,this.snapshot}};var nu=class{constructor(){this.cancel()}begin(e,t,i=0){this.phase="waiting",this.cardLead=Math.max(0,i),this.waitElapsed=0,this.cardsStarted=!1,this.bases=0,this.waves=0,this.elapsed=0,this.baseDuration=Math.max(1,e),this.waveDuration=Math.max(1,t)}cancel(){this.phase="idle",this.cardsStarted=!1,this.bases=1,this.waves=1,this.elapsed=0}update(e,t,i=!1){if(this.phase==="idle"||this.phase==="done")return;if(this.phase==="waiting"){if(!this.cardsStarted||(this.waitElapsed+=Math.max(0,e),!t||!i&&this.waitElapsed<this.cardLead))return;this.phase="bases",this.elapsed=0}if(i){this.bases=this.waves=1,this.phase="done";return}this.elapsed+=Math.max(0,e);let s=this.phase==="bases"?this.baseDuration:this.waveDuration,r=Math.min(1,this.elapsed/s),o=r*r*(3-2*r);this.phase==="bases"?this.bases=o:this.waves=o,r===1&&(this.phase=this.phase==="bases"?"waves":"done",this.elapsed=0)}};var wS="./config/earth-contours.json",eo="classic",ld=/^[a-z][a-z0-9-]{0,63}$/,Em=/^\.\/earth\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.svg$/;function wm(n){if(n?.schemaVersion!==1||!Array.isArray(n.variants)||!n.variants.length)throw new Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043A\u0430\u0442\u0430\u043B\u043E\u0433 \u043A\u043E\u043D\u0442\u0443\u0440\u043E\u0432 \u0417\u0435\u043C\u043B\u0438");let e=new Set,t=n.variants.map(i=>{if(typeof i?.id!="string"||!ld.test(i.id)||e.has(i.id))throw new Error("\u041D\u0443\u0436\u0435\u043D \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 ID \u043A\u043E\u043D\u0442\u0443\u0440\u0430");if(typeof i.label!="string"||!i.label.trim()||i.label.length>100)throw new Error("\u041D\u0443\u0436\u043D\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043D\u0442\u0443\u0440\u0430");if(!Em.test(i.border)||!Em.test(i.fill)||i.border===i.fill)throw new Error("\u041D\u0443\u0436\u043D\u044B \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 SVG \u043A\u043E\u043D\u0442\u0443\u0440\u0430 \u0438 \u0437\u0430\u043B\u0438\u0432\u043A\u0438");return e.add(i.id),Object.freeze({id:i.id,label:i.label.trim(),border:i.border,fill:i.fill})});if(!e.has(eo))throw new Error("\u0412 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u043E\u0441\u0442\u0430\u0432\u0430\u0442\u044C\u0441\u044F \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0443\u0440 classic");return Object.freeze({schemaVersion:1,variants:Object.freeze(t)})}var Tm=wm({schemaVersion:1,variants:[{id:eo,label:"\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439",border:"./earth/Russia_Border_Mask_6K.svg",fill:"./earth/Russia_Fill_Mask_6K.svg"}]});function Ia(n,e=eo){let t=n.variants.find(i=>i.id===e);if(!t)throw new Error(`\u041A\u043E\u043D\u0442\u0443\u0440 \xAB${e}\xBB \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0412\u044B\u0431\u0435\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442.`);return t}async function iu(n=fetch){let e=await n(wS,{cache:"no-store"});if(!e.ok)throw new Error(`\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u043A\u043E\u043D\u0442\u0443\u0440\u043E\u0432: HTTP ${e.status}`);return wm(await e.json())}function Am({initial:n,load:e,apply:t,release:i}){let s=n,r=n.id,o=null,a=0,c=!1;return{get activeId(){return s.id},select(l){if(c)return Promise.reject(new Error("Contour switcher disposed"));if(l===r&&o)return o;r=l;let u=++a;return l===s.id?(o=null,Promise.resolve(!0)):(o=Promise.resolve().then(()=>e(l)).then(h=>{if(c||u!==a)return i(h),!1;try{t(h)}catch(f){throw i(h),f}let d=s;return s={id:l,resource:h},i(d.resource),!0}).finally(()=>{u===a&&(o=null)}),o)},dispose(){c||(c=!0,a++,i(s.resource))}}}var cd=/^(?!(?:__proto__|constructor|prototype)$)[a-zA-Z0-9_-]+$/,vi=Object.freeze(Object.fromEntries([["terminal","\u0422\u0435\u0440\u043C\u0438\u043D\u0430\u043B","terminal"],["satellite","\u0421\u043F\u0443\u0442\u043D\u0438\u043A","sputnik"],["gateway","\u0428\u043B\u044E\u0437","station"],["core","\u0426\u0435\u043D\u0442\u0440 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445","core"],["internet","\u0418\u043D\u0442\u0435\u0440\u043D\u0435\u0442","internet"],["point-a","\u0411\u0443\u043A\u0432\u0430 A","endpoint-a"],["point-b","\u0411\u0443\u043A\u0432\u0430 \u0411","endpoint-b"]].map(([n,e,t])=>[n,Object.freeze({label:e,src:`./icons/${t}.svg`})]))),TS=Object.freeze(Object.fromEntries([["terminal","\u0430\u0431\u043E\u043D\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B","\u0422\u0415\u0420\u041C\u0418\u041D\u0410\u041B","ground"],["satellite","\u043A\u043E\u0441\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0430\u043F\u043F\u0430\u0440\u0430\u0442","\u0421\u041F\u0423\u0422\u041D\u0418\u041A","orbital"],["gateway","\u0448\u043B\u044E\u0437\u043E\u0432\u0430\u044F \u0441\u0442\u0430\u043D\u0446\u0438\u044F","\u0428\u041B\u042E\u0417","ground"],["core","\u0446\u0435\u043D\u0442\u0440 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445","\u0426\u041E\u0414","ground"],["internet","\u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442","\u0418\u041D\u0422\u0415\u0420\u041D\u0415\u0422","ground"]].map(([n,e,t,i])=>[n,Object.freeze({label:e,short:t,icon:n,behavior:i})]))),Ht=n=>{throw new Error(n)},tr=n=>n&&typeof n=="object"&&!Array.isArray(n),su=(n,e)=>typeof n=="string"&&n.trim()&&n.length<=160?n:Ht(`${e}: \u043D\u0443\u0436\u0435\u043D \u0442\u0435\u043A\u0441\u0442 (1\u2013160 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432)`);function AS(n){(typeof n!="string"||n.length>131072)&&Ht("SVG: \u0440\u0430\u0437\u043C\u0435\u0440 \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 128 \u041A\u0411");let e=n.trim().replace(/^<\?xml[^?]*\?>\s*/i,"").replace(/<!--[\s\S]*?-->/g,""),t=new Set(["svg","g","path","rect","circle","ellipse","line","polyline","polygon"]),i=new Set(["xmlns","viewBox","width","height","id","d","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","points","transform","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","opacity"]),s=[],r=0,o=0,a=0;for(let l of e.matchAll(/<([^<>]+)>/g)){e.slice(r,l.index).trim()&&Ht("SVG: \u0442\u0435\u043A\u0441\u0442 \u043D\u0443\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0432 \u043A\u0440\u0438\u0432\u044B\u0435"),r=l.index+l[0].length;let u=l[1],h=u.startsWith("/"),d=u.endsWith("/"),f=u.match(/^\/?([a-zA-Z][\w-]*)/)?.[1];if(t.has(f)||Ht(`SVG: \u044D\u043B\u0435\u043C\u0435\u043D\u0442 ${f||u} \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F. \u041D\u0443\u0436\u043D\u044B \u043A\u043E\u043D\u0442\u0443\u0440\u044B \u0431\u0435\u0437 \u0442\u0435\u043A\u0441\u0442\u0430, \u043C\u0430\u0441\u043E\u043A, \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432 \u0438 \u0432\u043D\u0435\u0448\u043D\u0438\u0445 \u0441\u0441\u044B\u043B\u043E\u043A`),h){(u!==`/${f}`||s.pop()!==f)&&Ht("SVG: \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432");continue}!s.length&&(f!=="svg"||++a!==1)&&Ht("SVG: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u043A\u043E\u0440\u043D\u0435\u0432\u043E\u0439 svg"),f==="svg"&&s.length&&Ht("SVG: \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0439 svg \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F");let m=u.slice(f.length,d?-1:void 0),x=/\s+([\w:-]+)\s*=\s*(["'])([^<>]*?)\2/g,g=0,p=new Set;for(let M of m.matchAll(x))(m.slice(g,M.index).trim()||!i.has(M[1])||p.has(M[1]))&&Ht(`SVG: \u043D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0430\u0442\u0440\u0438\u0431\u0443\u0442 ${M[1]}`),(/[&\\]/.test(M[3])||/url\s*\(|javascript:|data:/i.test(M[3]))&&Ht("SVG: \u0441\u0441\u044B\u043B\u043A\u0438 \u0438 \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u0438 \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u044B"),M[1]==="xmlns"&&M[3]!=="http://www.w3.org/2000/svg"&&Ht("SVG: \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 xmlns"),["opacity","fill-opacity","stroke-opacity"].includes(M[1])&&Number(M[3])!==1&&Ht("SVG: \u043F\u043E\u043B\u0443\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0435 \u043A\u043E\u043D\u0442\u0443\u0440\u044B \u043D\u0443\u0436\u043D\u043E \u0441\u0432\u0435\u0441\u0442\u0438 \u043A \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0439 \u043F\u0438\u043A\u0442\u043E\u0433\u0440\u0430\u043C\u043C\u0435"),p.add(M[1]),g=M.index+M[0].length;m.slice(g).trim()&&Ht("SVG: \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u0430\u0442\u0440\u0438\u0431\u0443\u0442\u044B"),["svg","g"].includes(f)||o++,d||s.push(f)}(s.length||a!==1||!o||e.slice(r).trim())&&Ht("SVG: \u043D\u0443\u0436\u0435\u043D \u0437\u0430\u043A\u043E\u043D\u0447\u0435\u043D\u043D\u044B\u0439 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 \u0432\u0435\u043A\u0442\u043E\u0440\u043D\u044B\u043C\u0438 \u043A\u043E\u043D\u0442\u0443\u0440\u0430\u043C\u0438");let c=e.replace(/\b(fill|stroke)\s*=\s*(["'])(.*?)\2/g,(l,u,h,d)=>`${u}=${h}${d==="none"?"none":"#FFFFFF"}${h}`);return c=c.replace(/<svg\b([^>]*)>/,(l,u)=>(/\bxmlns\s*=/.test(u)||(l=l.replace("<svg",'<svg xmlns="http://www.w3.org/2000/svg"')),/\bfill\s*=/.test(u)||(l=l.replace("<svg",'<svg fill="#FFFFFF"')),l)),c}function ud(n={}){let e=n.icons??vi,t=n.objectTypes??TS;(!tr(e)||!tr(t)||!Object.keys(t).length)&&Ht("\u041D\u0443\u0436\u043D\u044B \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 icons \u0438 \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u043A\u0430\u0442\u0430\u043B\u043E\u0433 objectTypes");let i=new Set(Object.values(vi).map(u=>u.src)),s=0,r=Object.fromEntries(Object.entries(e).map(([u,h])=>{(!cd.test(u)||!tr(h))&&Ht(`\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u0430\u044F \u0438\u043A\u043E\u043D\u043A\u0430 ${u}`);let d=su(h.label,`\u0418\u043A\u043E\u043D\u043A\u0430 ${u}`);if(h.svg!==void 0){h.src!==void 0&&Ht(`\u0418\u043A\u043E\u043D\u043A\u0430 ${u}: \u0437\u0430\u0434\u0430\u0439\u0442\u0435 svg \u0438\u043B\u0438 src, \u043D\u0435 \u043E\u0431\u0430`);let f=AS(h.svg);return s+=f.length,[u,{label:d,svg:f}]}return i.has(h.src)||Ht(`\u0418\u043A\u043E\u043D\u043A\u0430 ${u}: \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u0443\u0439\u0442\u0435 SVG \u0447\u0435\u0440\u0435\u0437 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440, \u0432\u043D\u0435\u0448\u043D\u0438\u0435 \u043F\u0443\u0442\u0438 \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u044B`),[u,{label:d,src:h.src}]}));s>1048576&&Ht("\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 SVG: \u043E\u0431\u0449\u0438\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 1 \u041C\u0411");let o=Object.fromEntries(Object.entries(t).map(([u,h])=>{(!cd.test(u)||!tr(h))&&Ht(`\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043E\u0431\u044A\u0435\u043A\u0442\u0430 ${u}`),Object.hasOwn(r,h.icon)||Ht(`\u041E\u0431\u044A\u0435\u043A\u0442 ${u}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u0438\u043A\u043E\u043D\u043A\u0430 ${h.icon}`),["ground","orbital"].includes(h.behavior)||Ht(`\u041E\u0431\u044A\u0435\u043A\u0442 ${u}: \u043F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435 ground \u0438\u043B\u0438 orbital`);let d=h.placementSurface??(h.behavior==="orbital"?"any":"land");return["land","water","any"].includes(d)||Ht(`\u041E\u0431\u044A\u0435\u043A\u0442 ${u}: \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C land, water \u0438\u043B\u0438 any`),[u,{label:su(h.label,u),short:su(h.short,u),icon:h.icon,behavior:h.behavior,placementSurface:d}]})),a=n.pointIcons??["point-a","point-b"].filter(u=>Object.hasOwn(r,u));(!Array.isArray(a)||new Set(a).size!==a.length||a.some(u=>typeof u!="string"||!Object.hasOwn(r,u)))&&Ht("pointIcons: \u043D\u0443\u0436\u043D\u044B \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0435 ID \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0445 SVG");let c=n.equipmentSets??{};tr(c)||Ht("equipmentSets: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0441\u043B\u043E\u0432\u0430\u0440\u044C \u043D\u0430\u0431\u043E\u0440\u043E\u0432");let l=Object.fromEntries(Object.entries(c).map(([u,h])=>{(!cd.test(u)||!tr(h)||!tr(h.inventory))&&Ht(`\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043D\u0430\u0431\u043E\u0440 ${u}`);let d=Object.fromEntries(Object.entries(h.inventory).map(([f,m])=>((!Object.hasOwn(o,f)||!Number.isInteger(m)||m<0)&&Ht(`\u041D\u0430\u0431\u043E\u0440 ${u}: ${f} \u2014 \u043D\u0443\u0436\u0435\u043D \u0442\u0438\u043F \u0431\u0430\u043D\u043A\u0430 \u0438 \u0446\u0435\u043B\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E >= 0`),[f,m])));return[u,{label:su(h.label,`\u041D\u0430\u0431\u043E\u0440 ${u}`),inventory:d}]}));return{icons:r,objectTypes:o,pointIcons:[...a],equipmentSets:l}}function nr(n){return n?.svg?`data:image/svg+xml;charset=utf-8,${encodeURIComponent(n.svg)}`:n?.src||""}function hd(n={}){let{icons:e,objectTypes:t}=ud(n||{});return Object.fromEntries(Object.entries(t).map(([i,s])=>[i,{...s,iconId:s.icon,icon:nr(e[s.icon])}]))}var dd=Object.freeze(["./earth/Earth_Diffuse_4K.jpg","./earth/Earth_Illumination_Core_4K.webp","./earth/Earth_Specular_4K.webp","./earth/Earth_Normal_4K.webp","./earth/Earth_Clouds_4K.webp","./earth/Russia_Fill_Mask_6K.svg"]),CS="./earth/Russia_Border_Mask_6K.svg",Cm=Object.freeze(["./brand/assets/logos/max-mono-white.svg"]),RS=Object.freeze(['400 24px "Max Sans"','500 24px "Max Sans"','600 24px "Max Sans"']);function Rm(n,e,t=Tm,i,s=!1){let r=Ia(t,i),o=[...new Set([...s?[]:Object.values(vi).map(nr),...Object.values(n.system?.icons||{}).map(nr),...Object.values(e).map(a=>a.icon)].filter(Boolean))];return s?{icons:o,contours:t,vectorSources:[],images:[...new Set([...Cm,...o])]}:{icons:o,contours:t,vectorSources:[r.border],images:[...new Set([...Cm,...o,...dd.slice(0,5),r.fill,r.border])]}}async function to(n,e=6e4,t="Resource"){let i=new AbortController,s;try{return await Promise.race([Promise.resolve().then(()=>n(i.signal)),new Promise((r,o)=>{s=setTimeout(()=>{i.abort(),o(new Error(`${t}: timeout`))},e)})])}finally{clearTimeout(s)}}async function ou(n,e=()=>{},t=4){let i=0,s=0,r,o=new Array(n.length);if(e(0,n.length),await Promise.all(Array.from({length:Math.min(t,n.length)},async()=>{for(;!r&&i<n.length;){let a=i++;try{o[a]=await n[a](),e(++s,n.length)}catch(c){r||(r=c)}}})),r)throw r;return o}var ru=class{constructor(){this.entries=new Map,this.icons=[],this.disposed=!1}async load(e,t,{fetchImpl:i=fetch,imageFactory:s=()=>new Image}={}){return this.icons=e.icons,this.contours=e.contours,await ou(e.images.map(r=>()=>to(async o=>{let a=await i(r,{signal:o,cache:"no-cache"});if(!a.ok)throw new Error(`${r}: HTTP ${a.status}`);let c=await a.blob();if(o.aborted||this.disposed)throw new Error("Asset preparation cancelled");if((e.vectorSources||[CS]).includes(r)){this.entries.set(r,{url:null,image:null,text:await c.text()});return}let l=URL.createObjectURL(c),u=s(),h={url:l,image:u,text:null};this.entries.set(r,h),u.decoding="async",u.src=l,await u.decode(),(r.includes(".svg")||r.startsWith("data:image/svg+xml"))&&(h.text=await c.text())},6e4,r)),t),this}get(e){let t=this.entries.get(e);if(!t)throw new Error(`Asset was not prepared: ${e}`);return t}url(e){return this.get(e).url}dispose(){this.disposed=!0;for(let e of this.entries.values())e.image&&(e.image.src=""),e.url&&URL.revokeObjectURL(e.url);this.entries.clear()}};async function Pm(n,e){await ou(RS.map(t=>()=>to(async()=>{if(!(await n.load(t,"\u0421\u0432\u044F\u0437\u044C Satellite 0123456789")).length)throw new Error(`Font unavailable: ${t}`)},6e4,t)),e,2)}function au(){return new Promise(n=>setTimeout(n,0))}async function Im(n){let e=n.fenceSync(n.SYNC_GPU_COMMANDS_COMPLETE,0);if(!e)throw new Error("GPU preparation fence unavailable");n.flush();try{await to(async t=>{for(;!t.aborted;){if(n.isContextLost())throw new Error("WebGL context lost during preparation");let i=n.clientWaitSync(e,0,0);if(i===n.WAIT_FAILED)throw new Error("GPU preparation failed");if(i===n.ALREADY_SIGNALED||i===n.CONDITION_SATISFIED)return;await au()}},6e4,"GPU preparation")}finally{n.deleteSync(e)}}var La=fn,Da=class n extends ns{constructor(e){super(e),this.defaultDPI=90,this.defaultUnit="px"}load(e,t,i,s){let r=this,o=new oa(r.manager);o.setPath(r.path),o.setRequestHeader(r.requestHeader),o.setWithCredentials(r.withCredentials),o.load(e,function(a){try{t(r.parse(a))}catch(c){s?s(c):console.error(c),r.manager.itemError(e)}},i,s)}parse(e){let t=this;function i(O,F){if(O.nodeType!==1)return;O.hasAttribute("filter")&&console.warn("THREE.SVGLoader: Filters are not supported.");let P=A(O),q=!1,ce=null;switch(O.nodeName){case"svg":F=x(O,F);break;case"style":r(O);break;case"g":F=x(O,F);break;case"path":F=x(O,F),O.hasAttribute("d")&&(ce=s(O));break;case"rect":F=x(O,F),ce=c(O);break;case"polygon":F=x(O,F),ce=l(O);break;case"polyline":F=x(O,F),ce=u(O);break;case"circle":F=x(O,F),ce=h(O);break;case"ellipse":F=x(O,F),ce=d(O);break;case"line":F=x(O,F),ce=f(O);break;case"defs":q=!0;break;case"use":F=x(O,F);let oe=(O.getAttributeNS("http://www.w3.org/1999/xlink","href")||"").substring(1),J=O.viewportElement.getElementById(oe);J?i(J,F):console.warn("SVGLoader: 'use node' references non-existent node id: "+oe);break;default:}if(ce){F.fill!==void 0&&F.fill!=="none"&&!F.fill.startsWith("url")&&ce.color.setStyle(F.fill,La),_(ce,it),j.push(ce);let z=Object.assign({},F);z.strokeWidth=F.strokeWidth*D(it),ce.userData={node:O,style:z,transform:it.clone(),gradients:X}}let pe=O.childNodes;for(let z=0;z<pe.length;z++){let oe=pe[z];q&&oe.nodeName!=="style"&&oe.nodeName!=="defs"||i(oe,F)}P&&(Y.pop(),Y.length>0?it.copy(Y[Y.length-1]):it.identity())}function s(O){let F=new mi,P=new xe,q=new xe,ce=new xe,pe=!0,z=!1,oe=O.getAttribute("d");if(oe===""||oe==="none")return null;let J=oe.match(/[a-df-z][^a-df-z]*/ig);for(let fe=0,ye=J.length;fe<ye;fe++){let ve=J[fe],Be=ve.charAt(0),Ae=ve.slice(1).trim();pe===!0&&(z=!0,pe=!1);let Q;switch(Be){case"M":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=2)P.x=Q[b+0],P.y=Q[b+1],q.x=P.x,q.y=P.y,b===0?F.moveTo(P.x,P.y):F.lineTo(P.x,P.y),b===0&&ce.copy(P);break;case"H":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b++)P.x=Q[b],q.x=P.x,q.y=P.y,F.lineTo(P.x,P.y),b===0&&z===!0&&ce.copy(P);break;case"V":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b++)P.y=Q[b],q.x=P.x,q.y=P.y,F.lineTo(P.x,P.y),b===0&&z===!0&&ce.copy(P);break;case"L":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=2)P.x=Q[b+0],P.y=Q[b+1],q.x=P.x,q.y=P.y,F.lineTo(P.x,P.y),b===0&&z===!0&&ce.copy(P);break;case"C":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=6)F.bezierCurveTo(Q[b+0],Q[b+1],Q[b+2],Q[b+3],Q[b+4],Q[b+5]),q.x=Q[b+2],q.y=Q[b+3],P.x=Q[b+4],P.y=Q[b+5],b===0&&z===!0&&ce.copy(P);break;case"S":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=4)F.bezierCurveTo(g(P.x,q.x),g(P.y,q.y),Q[b+0],Q[b+1],Q[b+2],Q[b+3]),q.x=Q[b+0],q.y=Q[b+1],P.x=Q[b+2],P.y=Q[b+3],b===0&&z===!0&&ce.copy(P);break;case"Q":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=4)F.quadraticCurveTo(Q[b+0],Q[b+1],Q[b+2],Q[b+3]),q.x=Q[b+0],q.y=Q[b+1],P.x=Q[b+2],P.y=Q[b+3],b===0&&z===!0&&ce.copy(P);break;case"T":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=2){let Ke=g(P.x,q.x),R=g(P.y,q.y);F.quadraticCurveTo(Ke,R,Q[b+0],Q[b+1]),q.x=Ke,q.y=R,P.x=Q[b+0],P.y=Q[b+1],b===0&&z===!0&&ce.copy(P)}break;case"A":Q=p(Ae,[3,4],7);for(let b=0,qe=Q.length;b<qe;b+=7){if(Q[b+5]==P.x&&Q[b+6]==P.y)continue;let Ke=P.clone();P.x=Q[b+5],P.y=Q[b+6],q.x=P.x,q.y=P.y,o(F,Q[b],Q[b+1],Q[b+2],Q[b+3],Q[b+4],Ke,P),b===0&&z===!0&&ce.copy(P)}break;case"m":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=2)P.x+=Q[b+0],P.y+=Q[b+1],q.x=P.x,q.y=P.y,b===0?F.moveTo(P.x,P.y):F.lineTo(P.x,P.y),b===0&&ce.copy(P);break;case"h":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b++)P.x+=Q[b],q.x=P.x,q.y=P.y,F.lineTo(P.x,P.y),b===0&&z===!0&&ce.copy(P);break;case"v":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b++)P.y+=Q[b],q.x=P.x,q.y=P.y,F.lineTo(P.x,P.y),b===0&&z===!0&&ce.copy(P);break;case"l":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=2)P.x+=Q[b+0],P.y+=Q[b+1],q.x=P.x,q.y=P.y,F.lineTo(P.x,P.y),b===0&&z===!0&&ce.copy(P);break;case"c":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=6)F.bezierCurveTo(P.x+Q[b+0],P.y+Q[b+1],P.x+Q[b+2],P.y+Q[b+3],P.x+Q[b+4],P.y+Q[b+5]),q.x=P.x+Q[b+2],q.y=P.y+Q[b+3],P.x+=Q[b+4],P.y+=Q[b+5],b===0&&z===!0&&ce.copy(P);break;case"s":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=4)F.bezierCurveTo(g(P.x,q.x),g(P.y,q.y),P.x+Q[b+0],P.y+Q[b+1],P.x+Q[b+2],P.y+Q[b+3]),q.x=P.x+Q[b+0],q.y=P.y+Q[b+1],P.x+=Q[b+2],P.y+=Q[b+3],b===0&&z===!0&&ce.copy(P);break;case"q":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=4)F.quadraticCurveTo(P.x+Q[b+0],P.y+Q[b+1],P.x+Q[b+2],P.y+Q[b+3]),q.x=P.x+Q[b+0],q.y=P.y+Q[b+1],P.x+=Q[b+2],P.y+=Q[b+3],b===0&&z===!0&&ce.copy(P);break;case"t":Q=p(Ae);for(let b=0,qe=Q.length;b<qe;b+=2){let Ke=g(P.x,q.x),R=g(P.y,q.y);F.quadraticCurveTo(Ke,R,P.x+Q[b+0],P.y+Q[b+1]),q.x=Ke,q.y=R,P.x=P.x+Q[b+0],P.y=P.y+Q[b+1],b===0&&z===!0&&ce.copy(P)}break;case"a":Q=p(Ae,[3,4],7);for(let b=0,qe=Q.length;b<qe;b+=7){if(Q[b+5]==0&&Q[b+6]==0)continue;let Ke=P.clone();P.x+=Q[b+5],P.y+=Q[b+6],q.x=P.x,q.y=P.y,o(F,Q[b],Q[b+1],Q[b+2],Q[b+3],Q[b+4],Ke,P),b===0&&z===!0&&ce.copy(P)}break;case"Z":case"z":F.currentPath.autoClose=!0,F.currentPath.curves.length>0&&(P.copy(ce),F.currentPath.currentPoint.copy(P),pe=!0);break;default:console.warn(ve)}z=!1}return F}function r(O){if(!(!O.sheet||!O.sheet.cssRules||!O.sheet.cssRules.length))for(let F=0;F<O.sheet.cssRules.length;F++){let P=O.sheet.cssRules[F];if(P.type!==1)continue;let q=P.selectorText.split(/,/gm).filter(Boolean).map(ce=>ce.trim());for(let ce=0;ce<q.length;ce++){let pe=Object.fromEntries(Object.entries(P.style).filter(([,z])=>z!==""));G[q[ce]]=Object.assign(G[q[ce]]||{},pe)}}}function o(O,F,P,q,ce,pe,z,oe){if(F==0||P==0){O.lineTo(oe.x,oe.y);return}q=q*Math.PI/180,F=Math.abs(F),P=Math.abs(P);let J=(z.x-oe.x)/2,fe=(z.y-oe.y)/2,ye=Math.cos(q)*J+Math.sin(q)*fe,ve=-Math.sin(q)*J+Math.cos(q)*fe,Be=F*F,Ae=P*P,Q=ye*ye,b=ve*ve,qe=Q/Be+b/Ae;if(qe>1){let le=Math.sqrt(qe);F=le*F,P=le*P,Be=F*F,Ae=P*P}let Ke=Be*b+Ae*Q,R=(Be*Ae-Ke)/Ke,y=Math.sqrt(Math.max(0,R));ce===pe&&(y=-y);let B=y*F*ve/P,L=-y*P*ye/F,U=Math.cos(q)*B-Math.sin(q)*L+(z.x+oe.x)/2,ue=Math.sin(q)*B+Math.cos(q)*L+(z.y+oe.y)/2,ge=a(1,0,(ye-B)/F,(ve-L)/P),te=a((ye-B)/F,(ve-L)/P,(-ye-B)/F,(-ve-L)/P)%(Math.PI*2);O.currentPath.absellipse(U,ue,F,P,ge,ge+te,pe===0,q)}function a(O,F,P,q){let ce=O*P+F*q,pe=Math.sqrt(O*O+F*F)*Math.sqrt(P*P+q*q),z=Math.acos(Math.max(-1,Math.min(1,ce/pe)));return O*q-F*P<0&&(z=-z),z}function c(O){let F=v(O.getAttribute("x")||0),P=v(O.getAttribute("y")||0),q=v(O.getAttribute("rx")||O.getAttribute("ry")||0),ce=v(O.getAttribute("ry")||O.getAttribute("rx")||0),pe=v(O.getAttribute("width")),z=v(O.getAttribute("height")),oe=1-.551915024494,J=new mi;return J.moveTo(F+q,P),J.lineTo(F+pe-q,P),(q!==0||ce!==0)&&J.bezierCurveTo(F+pe-q*oe,P,F+pe,P+ce*oe,F+pe,P+ce),J.lineTo(F+pe,P+z-ce),(q!==0||ce!==0)&&J.bezierCurveTo(F+pe,P+z-ce*oe,F+pe-q*oe,P+z,F+pe-q,P+z),J.lineTo(F+q,P+z),(q!==0||ce!==0)&&J.bezierCurveTo(F+q*oe,P+z,F,P+z-ce*oe,F,P+z-ce),J.lineTo(F,P+ce),(q!==0||ce!==0)&&J.bezierCurveTo(F,P+ce*oe,F+q*oe,P,F+q,P),J}function l(O){function F(pe,z,oe){let J=v(z),fe=v(oe);ce===0?q.moveTo(J,fe):q.lineTo(J,fe),ce++}let P=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,q=new mi,ce=0;return O.getAttribute("points").replace(P,F),q.currentPath.autoClose=!0,q}function u(O){function F(pe,z,oe){let J=v(z),fe=v(oe);ce===0?q.moveTo(J,fe):q.lineTo(J,fe),ce++}let P=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,q=new mi,ce=0;return O.getAttribute("points").replace(P,F),q.currentPath.autoClose=!1,q}function h(O){let F=v(O.getAttribute("cx")||0),P=v(O.getAttribute("cy")||0),q=v(O.getAttribute("r")||0),ce=new ri;ce.absarc(F,P,q,0,Math.PI*2);let pe=new mi;return pe.subPaths.push(ce),pe}function d(O){let F=v(O.getAttribute("cx")||0),P=v(O.getAttribute("cy")||0),q=v(O.getAttribute("rx")||0),ce=v(O.getAttribute("ry")||0),pe=new ri;pe.absellipse(F,P,q,ce,0,Math.PI*2);let z=new mi;return z.subPaths.push(pe),z}function f(O){let F=v(O.getAttribute("x1")||0),P=v(O.getAttribute("y1")||0),q=v(O.getAttribute("x2")||0),ce=v(O.getAttribute("y2")||0),pe=new mi;return pe.moveTo(F,P),pe.lineTo(q,ce),pe.currentPath.autoClose=!1,pe}function m(O){let F="http://www.w3.org/1999/xlink",P=O.querySelectorAll("linearGradient, radialGradient"),q=["x1","y1","x2","y2","cx","cy","r","fx","fy","gradientUnits","gradientTransform","spreadMethod"],ce={};for(let z of P){let oe=z.getAttribute("id");if(!oe)continue;let J={type:z.nodeName==="radialGradient"?"radialGradient":"linearGradient",attrs:{},stops:null,href:null},fe=z.getAttributeNS(F,"href")||z.getAttribute("href")||"";fe.startsWith("#")&&(J.href=fe.substring(1));for(let ve of q)z.hasAttribute(ve)&&(J.attrs[ve]=z.getAttribute(ve));let ye=z.querySelectorAll("stop");if(ye.length>0){J.stops=[];for(let ve of ye){let Be=ve.getAttribute("stop-color");!Be&&ve.style&&(Be=ve.style["stop-color"]),Be||(Be="#000");let Ae=ve.getAttribute("stop-opacity");(Ae===null||Ae==="")&&ve.style&&(Ae=ve.style["stop-opacity"]),Ae=Ae===null||Ae===""||Ae===void 0?1:Math.max(0,Math.min(1,parseFloat(Ae)));let Q=Math.max(0,Math.min(1,parseFloat(ve.getAttribute("offset")||"0")));J.stops.push({offset:Q,color:Be,opacity:Ae})}}ce[oe]=J}function pe(z,oe){let J=ce[z];if(!J||oe.has(z))return J;if(oe.add(z),J.href&&ce[J.href]){let fe=pe(J.href,oe);if(fe){J.stops||(J.stops=fe.stops);for(let ye in fe.attrs)ye in J.attrs||(J.attrs[ye]=fe.attrs[ye])}}return J}for(let z in ce)pe(z,new Set);for(let z in ce){let ve=function(Be){return typeof Be!="string"?0:Be.endsWith("%")?parseFloat(Be)/100:v(Be)},oe=ce[z],J=oe.attrs,fe=J.gradientUnits==="userSpaceOnUse"?"userSpaceOnUse":"objectBoundingBox",ye={type:oe.type,gradientUnits:fe,spreadMethod:J.spreadMethod==="reflect"||J.spreadMethod==="repeat"?J.spreadMethod:"pad",gradientTransform:null,stops:(oe.stops||[]).slice().sort((Be,Ae)=>Be.offset-Ae.offset)};if(J.gradientTransform&&(ye.gradientTransform=new nt,N(J.gradientTransform,ye.gradientTransform)),oe.type==="linearGradient")ye.x1=J.x1!==void 0?ve(J.x1):0,ye.y1=J.y1!==void 0?ve(J.y1):0,ye.x2=J.x2!==void 0?ve(J.x2):fe==="objectBoundingBox"?1:0,ye.y2=J.y2!==void 0?ve(J.y2):0;else{let Be=fe==="objectBoundingBox"?.5:0,Ae=fe==="objectBoundingBox"?.5:0;ye.cx=J.cx!==void 0?ve(J.cx):Be,ye.cy=J.cy!==void 0?ve(J.cy):Be,ye.r=J.r!==void 0?ve(J.r):Ae,ye.fx=J.fx!==void 0?ve(J.fx):ye.cx,ye.fy=J.fy!==void 0?ve(J.fy):ye.cy}X[z]=ye}}function x(O,F){F=Object.assign({},F);let P={};if(O.hasAttribute("class")){let z=O.getAttribute("class").split(/\s/).filter(Boolean).map(oe=>oe.trim());for(let oe=0;oe<z.length;oe++)P=Object.assign(P,G["."+z[oe]])}O.hasAttribute("id")&&(P=Object.assign(P,G["#"+O.getAttribute("id")]));function q(z,oe,J){J===void 0&&(J=function(ye){return ye}),O.hasAttribute(z)&&(F[oe]=J(O.getAttribute(z))),P[oe]&&(F[oe]=J(P[oe])),O.style&&O.style[z]!==""&&(F[oe]=J(O.style[z]))}function ce(z){return Math.max(0,Math.min(1,v(z)))}function pe(z){return Math.max(0,v(z))}return q("fill","fill"),q("fill-opacity","fillOpacity",ce),q("fill-rule","fillRule"),q("opacity","opacity",ce),q("stroke","stroke"),q("stroke-opacity","strokeOpacity",ce),q("stroke-width","strokeWidth",pe),q("stroke-linejoin","strokeLineJoin"),q("stroke-linecap","strokeLineCap"),q("stroke-miterlimit","strokeMiterLimit",pe),q("visibility","visibility"),F}function g(O,F){return O-(F-O)}function p(O,F,P){if(typeof O!="string")throw new TypeError("Invalid input: "+typeof O);let q={SEPARATOR:/[ \t\r\n\,.\-+]/,WHITESPACE:/[ \t\r\n]/,DIGIT:/[\d]/,SIGN:/[-+]/,POINT:/\./,COMMA:/,/,EXP:/e/i,FLAGS:/[01]/},ce=0,pe=1,z=2,oe=3,J=ce,fe=!0,ye="",ve="",Be=[];function Ae(Ke,R,y){let B=new SyntaxError('Unexpected character "'+Ke+'" at index '+R+".");throw B.partial=y,B}function Q(){ye!==""&&(ve===""?Be.push(Number(ye)):Be.push(Number(ye)*Math.pow(10,Number(ve)))),ye="",ve=""}let b,qe=O.length;for(let Ke=0;Ke<qe;Ke++){if(b=O[Ke],Array.isArray(F)&&F.includes(Be.length%P)&&q.FLAGS.test(b)){J=pe,ye=b,Q();continue}if(J===ce){if(q.WHITESPACE.test(b))continue;if(q.DIGIT.test(b)||q.SIGN.test(b)){J=pe,ye=b;continue}if(q.POINT.test(b)){J=z,ye=b;continue}q.COMMA.test(b)&&(fe&&Ae(b,Ke,Be),fe=!0)}if(J===pe){if(q.DIGIT.test(b)){ye+=b;continue}if(q.POINT.test(b)){ye+=b,J=z;continue}if(q.EXP.test(b)){J=oe;continue}q.SIGN.test(b)&&ye.length===1&&q.SIGN.test(ye[0])&&Ae(b,Ke,Be)}if(J===z){if(q.DIGIT.test(b)){ye+=b;continue}if(q.EXP.test(b)){J=oe;continue}q.POINT.test(b)&&ye[ye.length-1]==="."&&Ae(b,Ke,Be)}if(J===oe){if(q.DIGIT.test(b)){ve+=b;continue}if(q.SIGN.test(b)){if(ve===""){ve+=b;continue}ve.length===1&&q.SIGN.test(ve)&&Ae(b,Ke,Be)}}q.WHITESPACE.test(b)?(Q(),J=ce,fe=!1):q.COMMA.test(b)?(Q(),J=ce,fe=!0):q.SIGN.test(b)?(Q(),J=pe,ye=b):q.POINT.test(b)?(Q(),J=z,ye=b):Ae(b,Ke,Be)}return Q(),Be}let M=["mm","cm","in","pt","pc","px"],E={mm:{mm:1,cm:.1,in:1/25.4,pt:72/25.4,pc:6/25.4,px:-1},cm:{mm:10,cm:1,in:1/2.54,pt:72/2.54,pc:6/2.54,px:-1},in:{mm:25.4,cm:2.54,in:1,pt:72,pc:6,px:-1},pt:{mm:25.4/72,cm:2.54/72,in:1/72,pt:1,pc:6/72,px:-1},pc:{mm:25.4/6,cm:2.54/6,in:1/6,pt:72/6,pc:1,px:-1},px:{px:1}};function v(O){let F="px";if(typeof O=="string"||O instanceof String)for(let q=0,ce=M.length;q<ce;q++){let pe=M[q];if(O.endsWith(pe)){F=pe,O=O.substring(0,O.length-pe.length);break}}let P;return F==="px"&&t.defaultUnit!=="px"?P=E.in[t.defaultUnit]/t.defaultDPI:(P=E[F][t.defaultUnit],P<0&&(P=E[F].in*t.defaultDPI)),P*parseFloat(O)}function A(O){if(!(O.hasAttribute("transform")||O.nodeName==="use"&&(O.hasAttribute("x")||O.hasAttribute("y"))))return null;let F=C(O);return Y.length>0&&F.premultiply(Y[Y.length-1]),it.copy(F),Y.push(F),F}function C(O){let F=new nt;if(O.nodeName==="use"&&(O.hasAttribute("x")||O.hasAttribute("y"))){let P=v(O.getAttribute("x")||0),q=v(O.getAttribute("y")||0);F.makeTranslation(P,q)}return O.hasAttribute("transform")&&N(O.getAttribute("transform"),F),F}function N(O,F){let P=me,q=O.split(")");for(let ce=q.length-1;ce>=0;ce--){let pe=q[ce].trim();if(pe==="")continue;let z=pe.indexOf("("),oe=pe.length;if(z>0&&z<oe){let J=pe.slice(0,z),fe=p(pe.slice(z+1));switch(P.identity(),J){case"translate":if(fe.length>=1){let ye=fe[0],ve=0;fe.length>=2&&(ve=fe[1]),P.makeTranslation(ye,ve)}break;case"rotate":if(fe.length>=1){let ye=0,ve=0,Be=0;ye=fe[0]*Math.PI/180,fe.length>=3&&(ve=fe[1],Be=fe[2]),ae.makeTranslation(-ve,-Be),Te.makeRotation(ye),Se.multiplyMatrices(Te,ae),ae.makeTranslation(ve,Be),P.multiplyMatrices(ae,Se)}break;case"scale":if(fe.length>=1){let ye=fe[0],ve=ye;fe.length>=2&&(ve=fe[1]),P.makeScale(ye,ve)}break;case"skewX":fe.length===1&&P.set(1,Math.tan(fe[0]*Math.PI/180),0,0,1,0,0,0,1);break;case"skewY":fe.length===1&&P.set(1,0,0,Math.tan(fe[0]*Math.PI/180),1,0,0,0,1);break;case"matrix":fe.length===6&&P.set(fe[0],fe[2],fe[4],fe[1],fe[3],fe[5],0,0,1);break}F.premultiply(P)}}return F}function _(O,F){function P(z){dt.set(z.x,z.y,1).applyMatrix3(F),z.set(dt.x,dt.y)}function q(z){let oe=z.xRadius,J=z.yRadius,fe=Math.cos(z.aRotation),ye=Math.sin(z.aRotation),ve=new I(oe*fe,oe*ye,0),Be=new I(-J*ye,J*fe,0),Ae=ve.applyMatrix3(F),Q=Be.applyMatrix3(F),b=me.set(Ae.x,Q.x,0,Ae.y,Q.y,0,0,0,1),qe=ae.copy(b).invert(),y=Te.copy(qe).transpose().multiply(qe).elements,B=ee(y[0],y[1],y[4]),L=Math.sqrt(B.rt1),U=Math.sqrt(B.rt2);if(z.xRadius=1/L,z.yRadius=1/U,z.aRotation=Math.atan2(B.sn,B.cs),!((z.aEndAngle-z.aStartAngle)%(2*Math.PI)<Number.EPSILON)){let ge=ae.set(L,0,0,0,U,0,0,0,1),te=Te.set(B.cs,B.sn,0,-B.sn,B.cs,0,0,0,1),le=ge.multiply(te).multiply(b),Ee=Xe=>{let{x:Re,y:Ce}=new I(Math.cos(Xe),Math.sin(Xe),0).applyMatrix3(le);return Math.atan2(Ce,Re)};z.aStartAngle=Ee(z.aStartAngle),z.aEndAngle=Ee(z.aEndAngle),w(F)&&(z.aClockwise=!z.aClockwise)}}function ce(z){let oe=k(F),J=T(F);z.xRadius*=oe,z.yRadius*=J;let fe=oe>Number.EPSILON?Math.atan2(F.elements[1],F.elements[0]):Math.atan2(-F.elements[3],F.elements[4]);z.aRotation+=fe,w(F)&&(z.aStartAngle*=-1,z.aEndAngle*=-1,z.aClockwise=!z.aClockwise)}let pe=O.subPaths;for(let z=0,oe=pe.length;z<oe;z++){let fe=pe[z].curves;for(let ye=0;ye<fe.length;ye++){let ve=fe[ye];ve.isLineCurve?(P(ve.v1),P(ve.v2)):ve.isCubicBezierCurve?(P(ve.v0),P(ve.v1),P(ve.v2),P(ve.v3)):ve.isQuadraticBezierCurve?(P(ve.v0),P(ve.v1),P(ve.v2)):ve.isEllipseCurve&&(lt.set(ve.aX,ve.aY),P(lt),ve.aX=lt.x,ve.aY=lt.y,V(F)?q(ve):ce(ve))}}}function w(O){let F=O.elements;return F[0]*F[4]-F[1]*F[3]<0}function V(O){let F=O.elements,P=F[0]*F[3]+F[1]*F[4];if(P===0)return!1;let q=k(O),ce=T(O);return Math.abs(P/(q*ce))>Number.EPSILON}function k(O){let F=O.elements;return Math.sqrt(F[0]*F[0]+F[1]*F[1])}function T(O){let F=O.elements;return Math.sqrt(F[3]*F[3]+F[4]*F[4])}function D(O){let F=O.elements,P=F[0]*F[4]-F[1]*F[3];return Math.sqrt(Math.abs(P))}function ee(O,F,P){let q,ce,pe,z,oe,J=O+P,fe=O-P,ye=Math.sqrt(fe*fe+4*F*F);return J>0?(q=.5*(J+ye),oe=1/q,ce=O*oe*P-F*oe*F):J<0?ce=.5*(J-ye):(q=.5*ye,ce=-.5*ye),fe>0?pe=fe+ye:pe=fe-ye,Math.abs(pe)>2*Math.abs(F)?(oe=-2*F/pe,z=1/Math.sqrt(1+oe*oe),pe=oe*z):Math.abs(F)===0?(pe=1,z=0):(oe=-.5*pe/F,pe=1/Math.sqrt(1+oe*oe),z=oe*pe),fe>0&&(oe=pe,pe=-z,z=oe),{rt1:q,rt2:ce,cs:pe,sn:z}}let j=[],G={},X={},Y=[],me=new nt,ae=new nt,Te=new nt,Se=new nt,lt=new xe,dt=new I,it=new nt,he=new DOMParser().parseFromString(e,"image/svg+xml");return m(he),i(he.documentElement,{fill:"#000",fillOpacity:1,strokeOpacity:1,strokeWidth:1,strokeLineJoin:"miter",strokeLineCap:"butt",strokeMiterLimit:4}),{paths:j,gradients:X,xml:he.documentElement}}static createFillMaterial(e){let t=e.userData.style;if(t.fill===void 0||t.fill==="none")return null;let i=e.color,s=null,r=Lm.exec(t.fill);if(r){let a=e.userData.gradients&&e.userData.gradients[r[1]];s=PS(a,e)}let o=new Ut({opacity:t.fillOpacity*(t.opacity||1),transparent:!0,side:Ft,depthWrite:!1});return s!==null?o.map=s:o.color=i,o}static createStrokeMaterial(e){let t=e.userData.style;return t.stroke===void 0||t.stroke==="none"?null:(Lm.test(t.stroke)&&console.warn("THREE.SVGLoader: Gradient strokes are not supported."),new Ut({color:new Ye().setStyle(t.stroke,La),opacity:t.strokeOpacity*(t.opacity||1),transparent:!0,side:Ft,depthWrite:!1}))}static createShapes(e){return console.warn("SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead."),e.toShapes()}static getStrokeStyle(e,t,i,s,r){return e=e!==void 0?e:1,t=t!==void 0?t:"#000",i=i!==void 0?i:"miter",s=s!==void 0?s:"butt",r=r!==void 0?r:4,{strokeColor:t,strokeWidth:e,strokeLineJoin:i,strokeLineCap:s,strokeMiterLimit:r}}static pointsToStroke(e,t,i,s){let r=[],o=[],a=[];if(n.pointsToStrokeWithBuffers(e,t,i,s,r,o,a)===0)return null;let c=new Tt;return c.setAttribute("position",new vt(r,3)),c.setAttribute("normal",new vt(o,3)),c.setAttribute("uv",new vt(a,2)),c}static pointsToStrokeWithBuffers(e,t,i,s,r,o,a,c){let l=new xe,u=new xe,h=new xe,d=new xe,f=new xe,m=new xe,x=new xe,g=new xe,p=new xe,M=new xe,E=new xe,v=new xe,A=new xe,C=new xe,N=new xe,_=new xe,w=new xe;i=i!==void 0?i:12,s=s!==void 0?s:.001,c=c!==void 0?c:0,e=pe(e);let V=e.length;if(V<2)return 0;let k=e[0].equals(e[V-1]),T,D=e[0],ee,j=t.strokeWidth/2,G=1/(V-1),X=0,Y,me,ae,Te,Se=!1,lt=0,dt=c*3,it=c*2;he(e[0],e[1],l).multiplyScalar(j),g.copy(e[0]).sub(l),p.copy(e[0]).add(l),M.copy(g),E.copy(p);for(let z=1;z<V;z++){T=e[z],z===V-1?k?ee=e[1]:ee=void 0:ee=e[z+1];let oe=l;if(he(D,T,oe),h.copy(oe).multiplyScalar(j),v.copy(T).sub(h),A.copy(T).add(h),Y=X+G,me=!1,ee!==void 0){he(T,ee,u),h.copy(u).multiplyScalar(j),C.copy(T).sub(h),N.copy(T).add(h),ae=!0,h.subVectors(ee,D),oe.dot(h)<0&&(ae=!1),z===1&&(Se=ae),h.subVectors(ee,T),h.normalize();let J=Math.abs(oe.dot(h));if(J>Number.EPSILON){let fe=j/J;h.multiplyScalar(-fe),d.subVectors(T,D),f.copy(d).setLength(fe).add(h),_.copy(f).negate();let ye=f.length(),ve=d.length();d.divideScalar(ve),m.subVectors(ee,T);let Be=m.length();if(m.divideScalar(Be),d.dot(_)<ve&&m.dot(_)<Be&&(me=!0),w.copy(f).add(T),_.add(T),me){let Ae=ae?p:g,Q=(w.x-Ae.x)*(_.y-Ae.y)-(w.y-Ae.y)*(_.x-Ae.x);(ae&&Q<0||!ae&&Q>0)&&_.copy(Ae)}switch(Te=!1,me?ae?(N.copy(_),A.copy(_)):(C.copy(_),v.copy(_)):F(),t.strokeLineJoin){case"bevel":P(ae,me,Y);break;case"round":q(ae,me),ae?O(T,v,C,Y,0):O(T,N,A,Y,1);break;default:let Ae=j*t.strokeMiterLimit/ye;if(Ae<1)if(t.strokeLineJoin!=="miter-clip"){P(ae,me,Y);break}else q(ae,me),ae?(m.subVectors(w,v).multiplyScalar(Ae).add(v),x.subVectors(w,C).multiplyScalar(Ae).add(C),Z(v,Y,0),Z(m,Y,0),Z(T,Y,.5),Z(T,Y,.5),Z(m,Y,0),Z(x,Y,0),Z(T,Y,.5),Z(x,Y,0),Z(C,Y,0)):(m.subVectors(w,A).multiplyScalar(Ae).add(A),x.subVectors(w,N).multiplyScalar(Ae).add(N),Z(A,Y,1),Z(m,Y,1),Z(T,Y,.5),Z(T,Y,.5),Z(m,Y,1),Z(x,Y,1),Z(T,Y,.5),Z(x,Y,1),Z(N,Y,1));else me?(ae?(Z(p,X,1),Z(g,X,0),Z(w,Y,0),Z(p,X,1),Z(w,Y,0),Z(_,Y,1)):(Z(p,X,1),Z(g,X,0),Z(w,Y,1),Z(g,X,0),Z(_,Y,0),Z(w,Y,1)),ae?C.copy(w):N.copy(w)):ae?(Z(v,Y,0),Z(w,Y,0),Z(T,Y,.5),Z(T,Y,.5),Z(w,Y,0),Z(C,Y,0)):(Z(A,Y,1),Z(w,Y,1),Z(T,Y,.5),Z(T,Y,.5),Z(w,Y,1),Z(N,Y,1)),Te=!0;break}}else F()}else F();!k&&z===V-1&&ce(e[0],M,E,ae,!0,X),X=Y,D=T,g.copy(C),p.copy(N)}if(!k)ce(T,v,A,ae,!1,Y);else if(me&&r){let z=w,oe=_;Se!==ae&&(z=_,oe=w),ae?(Te||Se)&&(oe.toArray(r,0),oe.toArray(r,9),Te&&z.toArray(r,3)):(Te||!Se)&&(oe.toArray(r,3),oe.toArray(r,9),Te&&z.toArray(r,0))}if(r){let z=[new xe,new xe,new xe],oe=c*3;for(let J=oe;J<dt;J+=9)z[0].set(r[J],r[J+1]),z[1].set(r[J+3],r[J+4]),z[2].set(r[J+6],r[J+7]),$i.area(z)<0&&(r[J+3]=z[0].x,r[J+4]=z[0].y)}return lt;function he(z,oe,J){return J.subVectors(oe,z),J.set(-J.y,J.x).normalize()}function Z(z,oe,J){r&&(r[dt]=z.x,r[dt+1]=z.y,r[dt+2]=0,o&&(o[dt]=0,o[dt+1]=0,o[dt+2]=1),dt+=3,a&&(a[it]=oe,a[it+1]=J,it+=2)),lt+=3}function O(z,oe,J,fe,ye){l.copy(oe).sub(z).normalize(),u.copy(J).sub(z).normalize();let ve=Math.PI,Be=l.dot(u);Math.abs(Be)<1&&(ve=Math.abs(Math.acos(Be))),ve/=i,h.copy(oe);for(let Ae=0,Q=i-1;Ae<Q;Ae++)d.copy(h).rotateAround(z,ve),Z(h,fe,ye),Z(d,fe,ye),Z(z,fe,.5),h.copy(d);Z(h,fe,ye),Z(J,fe,ye),Z(z,fe,.5)}function F(){Z(p,X,1),Z(g,X,0),Z(v,Y,0),Z(p,X,1),Z(v,Y,0),Z(A,Y,1)}function P(z,oe,J){oe?z?(Z(p,X,1),Z(g,X,0),Z(v,Y,0),Z(p,X,1),Z(v,Y,0),Z(_,Y,1),Z(v,J,0),Z(C,J,0),Z(_,J,.5)):(Z(p,X,1),Z(g,X,0),Z(A,Y,1),Z(g,X,0),Z(_,Y,0),Z(A,Y,1),Z(A,J,1),Z(_,J,0),Z(N,J,1)):z?(Z(v,J,0),Z(C,J,0),Z(T,J,.5)):(Z(A,J,1),Z(N,J,0),Z(T,J,.5))}function q(z,oe){oe&&(z?(Z(p,X,1),Z(g,X,0),Z(v,Y,0),Z(p,X,1),Z(v,Y,0),Z(_,Y,1),Z(v,X,0),Z(T,Y,.5),Z(_,Y,1),Z(T,Y,.5),Z(C,X,0),Z(_,Y,1)):(Z(p,X,1),Z(g,X,0),Z(A,Y,1),Z(g,X,0),Z(_,Y,0),Z(A,Y,1),Z(A,X,1),Z(_,Y,0),Z(T,Y,.5),Z(T,Y,.5),Z(_,Y,0),Z(N,X,1)))}function ce(z,oe,J,fe,ye,ve){switch(t.strokeLineCap){case"round":ye?O(z,J,oe,ve,.5):O(z,oe,J,ve,.5);break;case"square":if(ye)l.subVectors(oe,z),u.set(l.y,-l.x),h.addVectors(l,u).add(z),d.subVectors(u,l).add(z),fe?(h.toArray(r,3),d.toArray(r,0),d.toArray(r,9)):(h.toArray(r,3),a[7]===1?d.toArray(r,9):h.toArray(r,9),d.toArray(r,0));else{l.subVectors(J,z),u.set(l.y,-l.x),h.addVectors(l,u).add(z),d.subVectors(u,l).add(z);let Be=r.length;fe?(h.toArray(r,Be-3),d.toArray(r,Be-6),d.toArray(r,Be-12)):(d.toArray(r,Be-6),h.toArray(r,Be-3),d.toArray(r,Be-12))}break;default:break}}function pe(z){let oe=!1;for(let fe=1,ye=z.length-1;fe<ye;fe++)if(z[fe].distanceTo(z[fe+1])<s){oe=!0;break}if(!oe)return z;let J=[];J.push(z[0]);for(let fe=1,ye=z.length-1;fe<ye;fe++)z[fe].distanceTo(z[fe+1])>=s&&J.push(z[fe]);return J.push(z[z.length-1]),J}}},Lm=/^\s*url\(\s*(?:["']\s*)?#([^)'"\s]+)(?:\s*["'])?\s*\)\s*$/;function PS(n,e,t=256){if(!n||!Array.isArray(n.stops)||n.stops.length===0)return null;let i=e.userData.transform,s=n.gradientUnits==="objectBoundingBox",r=null;if(s&&(r=IS(e,i),r===null))return null;function o(h,d,f){f.set(h,d,1),n.gradientTransform&&f.applyMatrix3(n.gradientTransform),s&&f.set(r.minX+f.x*r.width,r.minY+f.y*r.height,1),i&&f.applyMatrix3(i)}let a=document.createElement("canvas"),c;if(n.type==="linearGradient"){a.width=t,a.height=1;let h=a.getContext("2d"),d=h.createLinearGradient(0,0,t,0);Dm(d,n.stops),h.fillStyle=d,h.fillRect(0,0,t,1);let f=new I,m=new I;o(n.x1,n.y1,f),o(n.x2,n.y2,m);let x=m.x-f.x,g=m.y-f.y,p=x*x+g*g||1e-20,M=x/p,E=g/p,v=-(M*f.x+E*f.y);c=new nt().set(M,E,v,0,0,.5,0,0,1)}else{let h=n.cx,d=n.cy,f=n.fx,m=n.fy,x=n.r;if(n.gradientTransform){let _=new I;_.set(h,d,1).applyMatrix3(n.gradientTransform),h=_.x,d=_.y,_.set(f,m,1).applyMatrix3(n.gradientTransform),f=_.x,m=_.y}if(s&&(h=r.minX+h*r.width,d=r.minY+d*r.height,f=r.minX+f*r.width,m=r.minY+m*r.height,x=x*Math.sqrt((r.width*r.width+r.height*r.height)/2)),x<=0)return null;a.width=t,a.height=t;let g=a.getContext("2d"),p=h-x,M=d-x,E=2*x,v=t/E;g.setTransform(v,0,0,v,-p*v,-M*v);let A=g.createRadialGradient(f,m,0,h,d,x);Dm(A,n.stops),g.fillStyle=A,g.fillRect(p,M,E,E);let C=i?i.clone().invert():new nt;c=new nt().set(1/E,0,-p/E,0,1/E,-M/E,0,0,1).multiply(C)}let l=new qo(a);l.colorSpace=La,l.flipY=!1,l.matrixAutoUpdate=!1,l.matrix=c;let u=n.spreadMethod==="reflect"?Lr:n.spreadMethod==="repeat"?Yi:Dn;return l.wrapS=u,l.wrapT=u,l}function IS(n,e){let t=e?e.clone().invert():null,i=new xe,s=new qr;for(let r of n.subPaths)for(let o of r.getPoints())i.copy(o),t&&i.applyMatrix3(t),s.expandByPoint(i);return s.isEmpty()?null:{minX:s.min.x,minY:s.min.y,width:s.max.x-s.min.x,height:s.max.y-s.min.y}}function Dm(n,e){let t=new Ye;for(let i of e){let s=i.color;if(i.opacity<1){t.setStyle(i.color,La);let r=/rgb\(([^)]+)\)/.exec(t.getStyle(La));r&&(s=`rgba(${r[1]},${i.opacity})`)}n.addColorStop(Math.max(0,Math.min(1,i.offset)),s)}}Ie.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new xe},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};Pn.line={uniforms:Rn.merge([Ie.common,Ie.fog,Ie.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};var Ps=class extends St{constructor(e){super({type:"LineMaterial",uniforms:Rn.clone(Pn.line.uniforms),vertexShader:Pn.line.vertexShader,fragmentShader:Pn.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}};var Nm=new Gn,lu=new I,Is=class extends ca{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";let e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],t=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],i=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(i),this.setAttribute("position",new vt(e,3)),this.setAttribute("uv",new vt(t,2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new ws(t,6,1);return this.setAttribute("instanceStart",new si(i,3,0)),this.setAttribute("instanceEnd",new si(i,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new ws(t,6,1);return this.setAttribute("instanceColorStart",new si(i,3,0)),this.setAttribute("instanceColorEnd",new si(i,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new ia(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Gn);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),Nm.setFromBufferAttribute(t),this.boundingBox.union(Nm))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ii),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)lu.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(lu)),lu.fromBufferAttribute(t,r),s=Math.max(s,i.distanceToSquared(lu));this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}};var fd=new Lt,Um=new I,Fm=new I,vn=new Lt,_n=new Lt,Pi=new Lt,pd=new I,md=new zt,bn=new ha,Om=new I,cu=new Gn,uu=new ii,Ii=new Lt,Li,ir;function Bm(n,e,t){return Ii.set(0,0,-e,1).applyMatrix4(n.projectionMatrix),Ii.multiplyScalar(1/Ii.w),Ii.x=ir/t.width,Ii.y=ir/t.height,Ii.applyMatrix4(n.projectionMatrixInverse),Ii.multiplyScalar(1/Ii.w),Math.abs(Math.max(Ii.x,Ii.y))}function LS(n,e){let t=n.matrixWorld,i=n.geometry,s=i.attributes.instanceStart,r=i.attributes.instanceEnd,o=Math.min(i.instanceCount,s.count);for(let a=0,c=o;a<c;a++){bn.start.fromBufferAttribute(s,a),bn.end.fromBufferAttribute(r,a),bn.applyMatrix4(t);let l=new I,u=new I;Li.distanceSqToSegment(bn.start,bn.end,u,l),u.distanceTo(l)<ir*.5&&e.push({point:u,pointOnLine:l,distance:Li.origin.distanceTo(u),object:n,face:null,faceIndex:a,uv:null,uv1:null})}}function DS(n,e,t){let i=e.projectionMatrix,r=n.material.resolution,o=n.matrixWorld,a=n.geometry,c=a.attributes.instanceStart,l=a.attributes.instanceEnd,u=Math.min(a.instanceCount,c.count),h=-e.near;Li.at(1,Pi),Pi.w=1,Pi.applyMatrix4(e.matrixWorldInverse),Pi.applyMatrix4(i),Pi.multiplyScalar(1/Pi.w),Pi.x*=r.x/2,Pi.y*=r.y/2,Pi.z=0,pd.copy(Pi),md.multiplyMatrices(e.matrixWorldInverse,o);for(let d=0,f=u;d<f;d++){if(vn.fromBufferAttribute(c,d),_n.fromBufferAttribute(l,d),vn.w=1,_n.w=1,vn.applyMatrix4(md),_n.applyMatrix4(md),vn.z>h&&_n.z>h)continue;if(vn.z>h){let E=vn.z-_n.z,v=(vn.z-h)/E;vn.lerp(_n,v)}else if(_n.z>h){let E=_n.z-vn.z,v=(_n.z-h)/E;_n.lerp(vn,v)}vn.applyMatrix4(i),_n.applyMatrix4(i),vn.multiplyScalar(1/vn.w),_n.multiplyScalar(1/_n.w),vn.x*=r.x/2,vn.y*=r.y/2,_n.x*=r.x/2,_n.y*=r.y/2,bn.start.copy(vn),bn.start.z=0,bn.end.copy(_n),bn.end.z=0;let x=bn.closestPointToPointParameter(pd,!0);bn.at(x,Om);let g=Ne.lerp(vn.z,_n.z,x),p=g>=-1&&g<=1,M=pd.distanceTo(Om)<ir*.5;if(p&&M){bn.start.fromBufferAttribute(c,d),bn.end.fromBufferAttribute(l,d),bn.start.applyMatrix4(o),bn.end.applyMatrix4(o);let E=new I,v=new I;Li.distanceSqToSegment(bn.start,bn.end,v,E),t.push({point:v,pointOnLine:E,distance:Li.origin.distanceTo(v),object:n,face:null,faceIndex:d,uv:null,uv1:null})}}}var no=class extends ft{constructor(e=new Is,t=new Ps({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,s=new Float32Array(2*t.count);for(let o=0,a=0,c=t.count;o<c;o++,a+=2)Um.fromBufferAttribute(t,o),Fm.fromBufferAttribute(i,o),s[a]=a===0?0:s[a-1],s[a+1]=s[a]+Um.distanceTo(Fm);let r=new ws(s,2,1);return e.setAttribute("instanceDistanceStart",new si(r,1,0)),e.setAttribute("instanceDistanceEnd",new si(r,1,1)),this}raycast(e,t){let i=this.material.worldUnits,s=e.camera;if(s===null&&!i&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),i===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;let r=e.params.Line2!==void 0&&e.params.Line2.threshold||0;Li=e.ray;let o=this.matrixWorld,a=this.geometry,c=this.material;ir=c.linewidth+r,a.boundingSphere===null&&a.computeBoundingSphere(),uu.copy(a.boundingSphere).applyMatrix4(o);let l;if(i)l=ir*.5;else{let h=Math.max(s.near,uu.distanceToPoint(Li.origin));l=Bm(s,h,c.resolution)}if(uu.radius+=l,Li.intersectsSphere(uu)===!1)return;a.boundingBox===null&&a.computeBoundingBox(),cu.copy(a.boundingBox).applyMatrix4(o);let u;if(i)u=ir*.5;else{let h=Math.max(s.near,cu.distanceToPoint(Li.origin));u=Bm(s,h,c.resolution)}cu.expandByScalar(u),Li.intersectsBox(cu)!==!1&&(i?LS(this,t):DS(this,s,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(fd),this.material.uniforms.resolution.value.set(fd.z,fd.w))}};var io={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var jn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},NS=new is(-1,1,1,-1,0,1),gd=class extends Tt{constructor(){super(),this.setAttribute("position",new vt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new vt([0,2,0,0,2,0],2))}},US=new gd,Ls=class{constructor(e){this._mesh=new ft(US,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,NS)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var hu=class extends jn{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof St?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Rn.clone(e.uniforms),this.material=new St({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Ls(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Na=class extends jn{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){let s=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},du=class extends jn{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var fu=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let i=e.getSize(new xe);this._width=i.width,this._height=i.height,t=new Zt(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:on}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new hu(io),this.copyPass.material.blending=Fn,this.timer=new Js}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),i=!1;for(let s=0,r=this.passes.length;s<r;s++){let o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),o.needsSwap){if(i){let a=this.renderer.getContext(),c=this.renderer.state.buffers.stencil;c.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),c.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}Na!==void 0&&(o instanceof Na?i=!0:o instanceof du&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new xe);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let i=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(i,s),this.renderTarget2.setSize(i,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(i,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var pu=class extends jn{constructor(e,t,i=null,s=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Ye}render(e,t,i){let s=e.autoClear;e.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=s}};var zm={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ye(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var so=class n extends jn{constructor(e,t=1,i,s){super(),this.strength=t,this.radius=i,this.threshold=s,this.resolution=e!==void 0?new xe(e.x,e.y):new xe(256,256),this.clearColor=new Ye(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new Zt(r,o,{type:on}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){let h=new Zt(r,o,{type:on});h.texture.name="UnrealBloomPass.h"+u,h.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(h);let d=new Zt(r,o,{type:on});d.texture.name="UnrealBloomPass.v"+u,d.texture.generateMipmaps=!1,this.renderTargetsVertical.push(d),r=Math.round(r/2),o=Math.round(o/2)}let a=zm;this.highPassUniforms=Rn.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new St({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];let c=[6,10,14,18,22];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(c[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new xe(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new I(1,1,1),new I(1,1,1),new I(1,1,1),new I(1,1,1),new I(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Rn.clone(io.uniforms),this.blendMaterial=new St({uniforms:this.copyUniforms,vertexShader:io.vertexShader,fragmentShader:io.fragmentShader,premultipliedAlpha:!0,blending:mn,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Ye,this._oldClearAlpha=1,this._basic=new Ut,this._fsQuad=new Ls(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let i=Math.round(e/2),s=Math.round(t/2);this.renderTargetBright.setSize(i,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(i,s),this.renderTargetsVertical[r].setSize(i,s),this.separableBlurMaterials[r].uniforms.invSize.value=new xe(1/i,1/s),i=Math.round(i/2),s=Math.round(s/2)}render(e,t,i,s,r){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),r&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=i.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let a=this.renderTargetBright;for(let c=0;c<this.nMips;c++)this._fsQuad.material=this.separableBlurMaterials[c],this.separableBlurMaterials[c].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[c].uniforms.direction.value=n.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[c]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[c].uniforms.colorTexture.value=this.renderTargetsHorizontal[c].texture,this.separableBlurMaterials[c].uniforms.direction.value=n.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[c]),e.clear(),this._fsQuad.render(e),a=this.renderTargetsVertical[c];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){let t=[],i=e/3;for(let s=0;s<e;s++)t.push(.39894*Math.exp(-.5*s*s/(i*i))/i);return new St({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new xe(.5,.5)},direction:{value:new xe(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new St({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};so.BlurDirectionX=new xe(1,0);so.BlurDirectionY=new xe(0,1);var Ua={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var mu=class extends jn{constructor(){super(),this.isOutputPass=!0,this.uniforms=Rn.clone(Ua.uniforms),this.material=new Wr({name:Ua.name,uniforms:this.uniforms,vertexShader:Ua.vertexShader,fragmentShader:Ua.fragmentShader}),this._fsQuad=new Ls(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,i){this.uniforms.tDiffuse.value=i.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},yt.getTransfer(this._outputColorSpace)===wt&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===fa?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===pa?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===ma?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===ga?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===ya?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===va?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===xa&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};function km(n,e=!1){let t=n[0].index!==null,i=new Set(Object.keys(n[0].attributes)),s=new Set(Object.keys(n[0].morphAttributes)),r={},o={},a=n[0].morphTargetsRelative,c=new Tt,l=0;for(let u=0;u<n.length;++u){let h=n[u],d=0;if(t!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in h.attributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(h.attributes[f]),d++}if(d!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in h.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(h.morphAttributes[f])}if(e){let f;if(t)f=h.index.count;else if(h.attributes.position!==void 0)f=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,f,u),l+=f}}if(t){let u=0,h=[];for(let d=0;d<n.length;++d){let f=n[d].index;for(let m=0;m<f.count;++m)h.push(f.getX(m)+u);u+=n[d].attributes.position.count}c.setIndex(h)}for(let u in r){let h=Hm(r[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;c.setAttribute(u,h)}for(let u in o){let h=o[u][0].length;if(h!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[u]=[];for(let d=0;d<h;++d){let f=[];for(let x=0;x<o[u].length;++x)f.push(o[u][x][d]);let m=Hm(f);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;c.morphAttributes[u].push(m)}}}return c}function Hm(n){let e,t,i,s=-1,r=0;for(let l=0;l<n.length;++l){let u=n[l];if(e===void 0&&(e=u.array.constructor),e!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=u.itemSize),t!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=u.normalized),i!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=u.gpuType),s!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*t}let o=new e(r),a=new en(o,t,i),c=0;for(let l=0;l<n.length;++l){let u=n[l];if(u.isInterleavedBufferAttribute){let h=c/t;for(let d=0,f=u.count;d<f;d++)for(let m=0;m<t;m++){let x=u.getComponent(d,m);a.setComponent(d+h,m,x)}}else o.set(u.array,c);c+=u.count*t}return s!==void 0&&(a.gpuType=s),a}var gu=Object.freeze({corridorFraction:.25,ambiguityFraction:.01,minimumEndpointSpan:120,iconGap:8,stableHoldMs:300}),Vm=n=>["screenProjected","hybridProjected"].includes(n);var OS=n=>({...gu,...n?.screen});function Gm(n,e,t,i){let s=OS(n),r=e?.nodes||{},o=x=>r[x.id]?.eligible===!0&&!x.placementBlocked,a=x=>[r[x.id]?.x??0,r[x.id]?.y??0,0],c=x=>r[x.id]?.radius??0,l=(x,g)=>o(x)&&o(g)?Math.hypot(r[x.id].x-r[g.id].x,r[x.id].y-r[g.id].y):1/0,u=r[t.id],h=r[i.id],d=u&&h?Math.hypot(h.x-u.x,h.y-u.y):NaN,f=Number.isFinite(d)&&d>=s.minimumEndpointSpan;return{vector:a,radius:c,distance:l,valid:o,connects:(x,g)=>o(x)&&o(g)&&l(x,g)>=(r[x.id]?.iconRadius??0)+(r[g.id]?.iconRadius??0)+s.iconGap,axisValid:f,corridorWidth:f?d*s.corridorFraction:0,ambiguityEpsilon:s.ambiguityFraction}}var ss=.72,Fa=.34,Oa=1.4;function Wm(n){Fa=n.minAltitude??.34,Oa=n.maxAltitude??1.4,ss=n.defaultAltitude??.72}var Yn=Object.freeze(Object.fromEntries(Object.entries({terminal:{size:1,signalRadius:.46},satellite:{size:1,signalRadius:.78,radiusAtMinAltitude:.78,radiusAtMaxAltitude:.78,minAltitude:.34,maxAltitude:1.4,defaultAltitude:.72},gateway:{size:1,signalRadius:.62},core:{size:1,signalRadius:.56},internet:{size:1,signalRadius:.5},"endpoint:A":{size:1,signalRadius:6.5},"endpoint:B":{size:1,signalRadius:6.5}}).map(([n,e])=>[n,Object.freeze(e)])));function BS(n){return n?Object.fromEntries([...Object.entries(n).map(([e,t])=>[e,{...t.behavior==="orbital"?Yn.satellite:Yn.terminal,...e!=="satellite"&&t.behavior==="ground"?{signalRadius:Yn[e]?.signalRadius??.46}:{}}]),["endpoint:A",Yn["endpoint:A"]],["endpoint:B",Yn["endpoint:B"]]]):Yn}function Ba(n={},e){let t=BS(e);if(!n||typeof n!="object"||Array.isArray(n))throw new Error("objectSettings: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u044A\u0435\u043A\u0442");for(let i of Object.keys(n))if(!Object.hasOwn(t,i))throw new Error(`objectSettings: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F ${i}`);return Object.fromEntries(Object.entries(t).map(([i,s])=>{let r=n[i]===void 0?{}:n[i];if(!r||typeof r!="object"||Array.isArray(r))throw new Error(`objectSettings.${i}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u044A\u0435\u043A\u0442`);for(let[a,c]of Object.entries(r)){if(!Object.hasOwn(s,a))throw new Error(`objectSettings.${i}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u043F\u043E\u043B\u0435 ${a}`);if(typeof c!="number"||!Number.isFinite(c)||c<=0)throw new Error(`objectSettings.${i}.${a}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0447\u0438\u0441\u043B\u043E \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F`)}let o={...s,...r};if("minAltitude"in s&&(o.radiusAtMinAltitude=r.radiusAtMinAltitude??o.signalRadius,o.radiusAtMaxAltitude=r.radiusAtMaxAltitude??o.signalRadius,o.minAltitude>=o.maxAltitude||o.defaultAltitude<o.minAltitude||o.defaultAltitude>o.maxAltitude))throw new Error("\u0412\u044B\u0441\u043E\u0442\u0430 \u0441\u043F\u0443\u0442\u043D\u0438\u043A\u0430: min < max \u0438 min <= default <= max");for(let[a,c]of Object.entries(o))if(typeof c!="number"||!Number.isFinite(c)||c<=0)throw new Error(`objectSettings.${i}.${a}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0447\u0438\u0441\u043B\u043E \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F`);return[i,o]}))}function xu(n,e=Yn,t=n.type){let i=e[t];if(!i)return 0;if(!("minAltitude"in i))return i.signalRadius;let s=Number.isFinite(n.altitude)?n.altitude:i.defaultAltitude??ss,r=i.minAltitude??Fa,o=i.maxAltitude??Oa,a=Math.min(1,Math.max(0,(s-r)/(o-r)));return i.radiusAtMinAltitude+(i.radiusAtMaxAltitude-i.radiusAtMinAltitude)*a}function Xm(n,e,t,i,s){let r=Math.max(s,n.length),o=`endpoint:${t}`,a=`endpoint:${i}`,c=new Map(n.map(w=>[w.id,w])),l=new Map([...c.keys(),o,a].map(w=>[w,new Set])),u=e.filter(w=>!w.closing&&l.has(w.a)&&l.has(w.b));for(let{a:w,b:V}of u)l.get(w).add(V),l.get(V).add(w);let h=new Map(n.map((w,V)=>[w.id,V])),d=new Set,f=[];for(let w of n){if(d.has(w.id))continue;let V=[w.id],k=new Set;for(;V.length;){let D=V.pop();if(!d.has(D)){d.add(D),k.add(D);for(let ee of l.get(D))d.has(ee)||V.push(ee)}}let T=[...k].filter(D=>c.has(D)).sort((D,ee)=>h.get(D)-h.get(ee)).map(D=>c.get(D));f.push({anchor:k.has(o)?k.has(a)?"both":"from":k.has(a)?"to":"free",nodes:T})}let m=f.filter(w=>w.anchor==="from"||w.anchor==="both"),x=f.filter(w=>w.anchor==="to"),g=f.filter(w=>w.anchor==="free"),p=w=>w.reduce((V,k)=>V+k.nodes.length,0),M=p(m),E=p(x),v=p(g),A=[],C=(w,V)=>{for(let k of w){k.offset=V;for(let T of k.nodes)A.push({node:T,position:V++,anchor:k.anchor})}};C(m,0),C(g,M+Math.floor((r-M-E-v)/2)),C(x,r-E);let N=new Map([[o,-1],[a,r],...A.map(({node:w,position:V})=>[w.id,V])]),_=u.map(w=>({...w,fromPosition:N.get(w.a),toPosition:N.get(w.b)}));return{count:r,groups:[...m,...g,...x],items:A,connections:_}}var jm=350;function vd(n,e,t,i,s=jm,r=null){e.some(T=>T.placementBlocked)&&(e=e.filter(T=>!T.placementBlocked));let o=Object.fromEntries(e.map(T=>[T.id,i-T.droppedAt<s?"drop":"base"])),a={},c=[],l=[],u=Object.fromEntries(Object.entries(t).map(([T,D])=>[T,{...D,...n.objectSettings?.[T]}])),h=T=>String(T.id).startsWith("endpoint:")||i-T.droppedAt>=s,d=T=>({...n.endpoints[T],id:`endpoint:${T}`,type:`endpoint:${T}`,altitude:.012}),f=T=>T.signalRadius??xu(T,u,T.type.startsWith("endpoint:")&&!u[T.type]?"endpoint:A":T.type);for(let T of n.topology.paths){let D=zS(n,T).map(({from:G,to:X})=>kS({mission:n,path:T,from:G,to:X,placements:e,point:d,radius:f,awake:h,projection:r})),ee=HS(T,D),j=ee.reduce((G,X)=>VS(X,G)?X:G,ee[0]);a[T.id]={...j.result,from:j.from,to:j.to,alternatives:D.map(G=>({from:G.from,to:G.to,complete:G.result.complete}))},l.push(...j.links);for(let G of D)G!==j&&l.push(...G.links.filter(X=>X.endpointSide&&T.endpointSignals?.[X.endpointSide]==="parallel"));c.push(...j.diagnostics);for(let[G,X]of Object.entries(j.stateUpdates))(X==="link"||o[G]!=="link")&&(o[G]=X)}let m=T=>{if(T.type==="all")return T.children.every(m);if(T.type==="any")return T.children.some(m);if(T.type==="not")return!m(T.children[0]);if(T.type==="atLeast")return T.children.filter(m).length>=T.count;if(T.type==="placed")return e.filter(D=>D.type===T.object).length>=T.count;if(T.type==="allPlaced")return Object.entries(n.inventory).every(([D,ee])=>e.filter(j=>j.type===D).length===ee);if(T.type==="path")return a[T.path]?.complete===!0;if(T.type==="allPaths")return Object.values(a).every(D=>D.complete);if(T.type==="segment"){let D=a[T.path],ee=T.anchor==="end"?D.shift:0,j=T.anchor==="end"?D.tailEdges:D.edges;return T.from+ee>=0&&j.slice(T.from+ee,T.to+ee).length===T.to-T.from&&j.slice(T.from+ee,T.to+ee).every(Boolean)}return!1},x=4096,g=!1,p=(T,D)=>{if(--x<0)return g=!0,null;let ee={...T.bindings},j=new Map(Object.entries(ee).map(([G,X])=>[X,G]));for(let[G,X]of Object.entries(D.bindings)){if(G in ee&&ee[G]!==X||j.has(X)&&j.get(X)!==G)return null;ee[G]=X,j.set(X,G)}return{bindings:ee,paths:[...new Set([...T.paths,...D.paths])]}},M=()=>({bindings:{},paths:[]}),E=(T,D)=>{let ee=[];for(let j of T)for(let G of D){let X=p(j,G);if(X&&ee.push(X),g)return[]}return ee},v=T=>{if(--x<0)return g=!0,[];if(T.type==="all")return T.children.reduce((D,ee)=>E(D,v(ee)),[M()]);if(T.type==="any")return T.children.flatMap(v);if(T.type==="not")return v(T.children[0]).length?[]:[M()];if(T.type==="atLeast"){let D=Array.from({length:T.count+1},()=>[]);D[0]=[M()];for(let ee of T.children){let j=v(ee);for(let G=T.count;G>0;G--)D[G].push(...E(D[G-1],j))}return D[T.count]}if(T.type==="allPaths")return v({type:"all",children:n.topology.paths.map(D=>({type:"path",path:D.id}))});if(!m(T))return[];if(["path","segment"].includes(T.type)){let D=a[T.path];return[{bindings:T.type==="segment"&&T.anchor==="end"?D.tailBindings:D.bindings,paths:[T.path]}]}return[M()]},A=n.objectives.map(T=>v(T.condition).length>0&&!g),C=v({type:"all",children:[n.completion,...n.objectives.map(T=>T.condition)]}),N=C.length>0&&!g;g?c.push({rule:"indeterminate",message:"\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432 \u0443\u0441\u043B\u043E\u0432\u0438\u0439. \u0423\u043F\u0440\u043E\u0441\u0442\u0438\u0442\u0435 \u0432\u044B\u0440\u0430\u0436\u0435\u043D\u0438\u0435; \u043F\u043E\u0431\u0435\u0434\u0430 \u043D\u0435 \u0437\u0430\u0441\u0447\u0438\u0442\u0430\u043D\u0430"}):!N&&A.every(Boolean)&&m(n.completion)&&c.push({rule:"binding",message:"\u041C\u0430\u0440\u0448\u0440\u0443\u0442\u044B \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u043F\u0440\u043E\u0442\u0438\u0432\u043E\u0440\u0435\u0447\u0438\u0432\u044B\u0445 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u043E\u0431\u0449\u0438\u0445 \u0440\u043E\u043B\u0435\u0439"});let _=N?C[0]:M(),w=N?l.filter(T=>_.paths.includes(T.path)):l;if(N){for(let T of e)o[T.id]=Object.values(_.bindings).includes(T.id)?"link":"base";c.length=0}let V=new Set,k=w.filter(T=>{let D=[String(T.a),String(T.b)].sort().join("|");return V.has(D)?!1:(V.add(D),!0)});if(N&&n.connectEndpointsOnComplete)for(let T of n.topology.paths){let D=a[T.id];D.complete&&k.push({a:`endpoint:${D.to}`,b:`endpoint:${D.from}`,correct:!0,endpoint:!0,surface:T.connection.policy!=="screenProjected",screen:T.connection.policy==="screenProjected",closing:!0})}return{complete:N,objectives:A,paths:a,bindings:_.bindings,diagnostics:c,links:k,states:o,evaluate:m,indeterminate:g}}function zS(n,e){let t=(s,r)=>{if(e.endpointSelection?.[s]!=="anyRole")return[e[s]];let o=Object.entries(n.endpoints).filter(([,a])=>a.roles?.includes(r)).map(([a])=>a);return[e[s],...o.filter(a=>a!==e[s])]},i=[];for(let s of t("from","start"))for(let r of t("to","finish"))s!==r&&i.push({from:s,to:r});return i}function HS(n,e){let t=e;for(let i of["from","to"]){if(n.endpointSelection?.[i]!=="anyRole"||n.endpointSignals?.[i]!=="nearest")continue;let s=t.filter(o=>Number.isFinite(o.boundaryDistances[i]));if(!s.length)continue;let r=s.reduce((o,a)=>a.boundaryDistances[i]<o.boundaryDistances[i]?a:o,s[0]);t=t.filter(o=>o[i]===r[i])}return t.length?t:e}function kS({mission:n,path:e,from:t,to:i,placements:s,point:r,radius:o,awake:a,projection:c}){let l={},u=[],h=[],d=[],f={},m=r(t),x=r(i),g=Vm(e.connection.policy),p=e.connection.policy==="hybridProjected",M=L=>n.orbitalTypes?.includes(L.type)===!0,E=(L,U)=>g&&(!p||M(L)||M(U)),v=o,A=g?Gm(e.connection,c,m,x):null,C=A?.vector||(L=>yd(L,!0)),N=A?.distance||$m,_=A?.valid||(()=>!0),w=(L,U)=>!E(L,U)||A.connects(L,U);o=A?.radius||o;let V=A?.corridorWidth??e.connection.corridorWidth,k=A?.ambiguityEpsilon??e.connection.ambiguityEpsilon,T=C(m),D=C(x),ee=D.map((L,U)=>L-T[U]),j=xd(ee,ee)||1,G=s.filter(_).map(L=>{let U=C(L),ue=U.map((le,Ee)=>le-T[Ee]),ge=xd(ue,ee)/j,te=Math.hypot(...ue.map((le,Ee)=>le-ee[Ee]*ge));return{node:L,progress:ge,cross:te,startDistance:Math.hypot(U[0]-T[0],U[1]-T[1],U[2]-T[2]),finishDistance:Math.hypot(U[0]-D[0],U[1]-D[1],U[2]-D[2])}}),X=n.topology.paths.length===1?[...G]:G.filter(L=>L.progress>0&&L.progress<1&&L.cross<=V),Y=(L,U)=>{let ue=G.filter(te=>te[U]<=o(L)+o(te.node));if(!ue.length)return;let ge=ue.reduce((te,le)=>le.cross<te.cross-1e-9||Math.abs(le.cross-te.cross)<=1e-9&&le[U]<te[U]?le:te,ue[0]);X.some(te=>te.node.id===ge.node.id)||X.push(ge)};Y(m,"startDistance"),Y(x,"finishDistance"),X.sort((L,U)=>L.progress-U.progress);let me=X.some((L,U)=>U>0&&Math.abs(L.progress-X[U-1].progress)<=k),ae=[m,...X.map(L=>L.node),x],Te=g&&ae.some((L,U)=>_(L)&&ae.slice(U+1).some(ue=>_(ue)&&!w(L,ue))),Se=[{role:`point-${t}`,type:m.type},...e.steps,{role:`point-${i}`,type:x.type}],lt=ae.length-Se.length,dt=!me&&!Te,it=ae.map((L,U)=>(dt=dt&&L.type===Se[U]?.type,dt&&U>0&&U<ae.length-1&&(l[Se[U].role]=L.id),dt)),he=Se.slice(0,-1).reduce((L,U,ue)=>{let ge=`${U.type}>${Se[ue+1].type}`;return L.set(ge,(L.get(ge)||0)+1),L},new Map),Z=ae.slice(0,-1).map((L,U)=>{let ue=ae[U+1],ge=`${L.type}>${ue.type}`,te=Se.flatMap((le,Ee)=>le.type===L.type&&Se[Ee+1]?.type===ue.type?[Ee]:[]);return he.get(ge)===1?!0:te.includes(U)||te.includes(U-lt)}),O=(L,U)=>E(L,U)?N(L,U):$m(L,U),F=(L,U)=>E(L,U)?o(L)+o(U):v(L)+v(U),P=ae.slice(0,-1).map((L,U)=>{let ue=ae[U+1],ge=O(L,ue),te=F(L,ue),le=w(L,ue)&&ge<=te,Ee=le&&a(L)&&a(ue),Xe=Z[U],Re=U===0?"from":U===ae.length-2?"to":"";if(le){let Ce={a:L.id,b:ue.id,correct:Xe,path:e.id,distance:ge,range:te,...E(L,ue)?{screen:!0}:{},endpoint:!!Re,...Re?{endpointSide:Re}:{},neutral:!Xe&&n.feedback.invalid==="neutral"};h.push({...Ce,active:Ee}),Ee&&u.push(Ce)}return le}),q=P.map((L,U)=>L&&a(ae[U])&&a(ae[U+1])),ce=q.map((L,U)=>L&&it[U]&&it[U+1]),pe=!me&&!Te,z=Array(ae.length).fill(!1),oe={};for(let L=ae.length-1;L>=0;L--){let U=Se[L-lt];pe=pe&&ae[L].type===U?.type,z[L]=pe,pe&&L>0&&L<ae.length-1&&(oe[U.role]=ae[L].id)}let J=ae.slice(0,-1).map((L,U)=>z[U]&&z[U+1]&&a(L)&&a(ae[U+1])&&w(L,ae[U+1])&&O(L,ae[U+1])<=F(L,ae[U+1])),fe=ae.slice(1,-1),ye=[...s].sort((L,U)=>{let ue=ge=>xd(C(ge).map((te,le)=>te-T[le]),ee)/j;return ue(L)-ue(U)||String(L.id).localeCompare(String(U.id),void 0,{numeric:!0})}),ve=Xm(ye,h,t,i,e.steps.length),Be={ordered:fe,nodes:ae,matches:it,edges:ce,tailEdges:J,shift:lt,tailBindings:oe,ambiguous:me,bindings:l,layout:ve,complete:ae.length===Se.length&&ce.every(Boolean)&&!me&&(!g||A.axisValid)};Te&&d.push({rule:"view",path:e.id,message:"\u0420\u0430\u0437\u0432\u0435\u0434\u0438 \u0438\u043A\u043E\u043D\u043A\u0438 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0438 \u0442\u043E\u0447\u043A\u0438 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430 \u0432 \u043F\u043E\u043B\u0435 \u0437\u0440\u0435\u043D\u0438\u044F"}),me&&d.push({rule:"ambiguous",path:e.id,message:"\u0423\u0437\u043B\u044B \u0438\u043C\u0435\u044E\u0442 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u043E\u0435 \u043F\u0440\u043E\u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0432\u0434\u043E\u043B\u044C \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430; \u0440\u0430\u0437\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u0445"});let Ae=Se.reduce((L,U)=>L.set(U.type,(L.get(U.type)||0)+1),new Map),Q=ae.map((L,U)=>{if(U<=0||U>=ae.length-1)return!1;let ue=Se.flatMap((ge,te)=>te>0&&te<Se.length-1&&ge.type===L.type&&Se[te-1].type===ae[U-1].type&&Se[te+1].type===ae[U+1].type?[te]:[]);return Ae.get(L.type)===1?ue.length>0:ue.includes(U)||ue.includes(U-lt)});for(let L=1;L<ae.length-1;L++){let U=ae[L];!a(U)||!(q[L-1]&&q[L])||(Q[L]?f[U.id]="link":(d.push({rule:"slot",path:e.id,node:U.id,slot:L,expected:Se[L]?.type,actual:U.type,message:`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${e.id}: \u043E\u0431\u044A\u0435\u043A\u0442 ${U.type} \u043E\u043A\u0440\u0443\u0436\u0451\u043D \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u043C\u0438 \u0441\u043E\u0441\u0435\u0434\u044F\u043C\u0438`}),n.feedback.invalid==="error"&&(f[U.id]="wrong")))}let b=qm(Se).filter(L=>L.count>1);if(!me&&!Te)for(let L of qm(ae)){let U=b.filter(ge=>ge.type===L.type&&ge.before===L.before&&ge.after===L.after);if(!U.length||U.some(ge=>ge.count===L.count)||!q.slice(L.first-1,L.last+1).every(Boolean))continue;let ue=new Set(ae.slice(L.first,L.last+1).map(ge=>ge.id));for(let ge of ue)d.push({rule:"slot",reason:"run-count",path:e.id,node:ge,expectedCount:U[0].count,actualCount:L.count,message:`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${e.id}: \u043C\u0435\u0436\u0434\u0443 ${L.before} \u0438 ${L.after} \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F ${U[0].count} \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432 ${L.type}, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${L.count}`}),n.feedback.invalid==="error"&&(f[ge]="wrong");for(let ge of[u,ve.connections])for(let te of ge)ue.has(te.a)&&ue.has(te.b)&&(te.correct=!1)}!Be.complete&&!me&&it.every(Boolean)&&d.push({rule:"coverage",path:e.id,message:`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${e.id}: \u043D\u0435\u043F\u043E\u043B\u043D\u0430\u044F \u0446\u0435\u043F\u043E\u0447\u043A\u0430 \u0438\u043B\u0438 \u0440\u0430\u0437\u0440\u044B\u0432 \u0440\u0430\u0434\u0438\u043E\u043F\u043E\u043A\u0440\u044B\u0442\u0438\u044F`});let qe=P.map((L,U)=>L&&it[U]&&it[U+1]),Ke=P.map((L,U)=>L&&z[U]&&z[U+1]),R=ae.length===Se.length&&qe.every(Boolean)&&!me&&(!g||A.axisValid),y=[Number(R),qe.filter(Boolean).length,Ke.filter(Boolean).length,P.filter(Boolean).length,it.filter(Boolean).length,-Math.abs(ae.length-Se.length),+!me],B={from:ae.length>2?O(m,ae[1]):Number.POSITIVE_INFINITY,to:ae.length>2?O(ae.at(-2),x):Number.POSITIVE_INFINITY};return{from:t,to:i,result:Be,links:u,diagnostics:d,stateUpdates:f,score:y,boundaryDistances:B}}function qm(n){let e=[];for(let t=0;t<n.length;){let i=t;for(;i+1<n.length&&n[i+1].type===n[t].type;)i++;t>0&&i+1<n.length&&e.push({first:t,last:i,count:i-t+1,type:n[t].type,before:n[t-1].type,after:n[i+1].type}),t=i+1}return e}function VS(n,e){for(let t=0;t<n.score.length;t++)if(n.score[t]!==e.score[t])return n.score[t]>e.score[t];return!1}function $m(n,e){return Math.hypot(...yd(n).map((t,i)=>t-yd(e)[i]))}function yd(n,e=!1){let t=n.latitude*Math.PI/180,i=n.longitude*Math.PI/180,s=3+(e?0:n.altitude||0);return[s*Math.cos(t)*Math.sin(i),s*Math.sin(t),s*Math.cos(t)*Math.cos(i)]}function xd(n,e){return n.reduce((t,i,s)=>t+i*e[s],0)}var GS=Object.freeze({LAND:0,WATER:1,UNKNOWN:2});var cn=Yn,WS=Yn;var Ds=hd(),Zm=vi,_d=n=>nr(Zm[n?.icon]),_i=n=>Ds[n]?.behavior==="orbital",sr=n=>cn[n]||Yn.satellite;var Ym=Object.freeze({}),XS=Object.freeze([]);function Jm(n){if(!n?.missions?.length||!n.byNumber)throw new Error("\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u043C\u0438\u0441\u0441\u0438\u0439 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D");let e=hd(n.system);for(let t of n.missions){for(let i of t.route)if(!e[i])throw new Error(`\u041C\u0438\u0441\u0441\u0438\u044F ${t.number}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043E\u0431\u044A\u0435\u043A\u0442 ${i}`);for(let i of t.objectives)for(let s of["object","first","second"])if(i.condition[s]&&!e[i.condition[s]])throw new Error(`\u041C\u0438\u0441\u0441\u0438\u044F ${t.number}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043E\u0431\u044A\u0435\u043A\u0442 ${i.condition[s]} \u0432 \u0443\u0441\u043B\u043E\u0432\u0438\u0438 ${i.id}`)}return Ym=n.byNumber,cn=n.objectSettings||Yn,WS=cn,Sf(n.system?.screenAppearance),Wm(cn.satellite||Yn.satellite),Zm=n.system?.icons||vi,Ds=Object.freeze(Object.fromEntries(Object.entries(e).map(([t,i])=>[t,Object.freeze({...i,...cn[t]})]))),XS=Object.freeze(n.missions.map(t=>t.number)),Ym}function yu(n,e=n.type){return n.signalRadius!==void 0?n.signalRadius:xu(n,cn,e)}var qS=["CTA","ONBOARDING","MISSION_SELECT","MISSION_PLAY","END"],$S=["outerInset","headerHeight","frameGap","headerPadding","headerSideColumn","footerHeight","footerBottom","inventoryWidth","columnGap","borderWidth","borderRadius"],jS=["layoutDurationMs","fadeDurationMs","screenDurationMs","screenExitDurationMs","contentStaggerMs","microDurationMs","ambientDurationMs"],YS=["frameRight","frameBottom","footerRight","backgroundBlur"],ZS=new Set(["hidden","floating","panel"]),JS=new Set(["full","frame"]),bd=8;var Sd=Object.freeze({color:"#0D001A",opacity:.9,radius:.127}),Qe=Object.freeze({russiaContour:eo,dayTint:"#00BFFF",nightTint:"#0D001A",dayIntensity:.68,ambientIntensity:.14,saturation:0,textureColorMix:0,textureSaturation:0,surfaceExposure:.78,surfaceGamma:1.16,surfaceContrast:1.12,oceanColor:"#0D001A",oceanIntensity:.92,russiaSurfaceBoost:.9,outsideSurfaceDim:.48,russiaMaskFeather:1.35,cityLightsColor:"#9500FF",cityLightsHotColor:"#FFFFFF",cityLightsIntensity:1.8,cityLightsHotIntensity:2.4,cityLightsGlowIntensity:.72,cityLightsCoreStart:.12,cityLightsGlowStart:.055,cityLightsDayVisibility:.08,cityLightsBlackPoint:.018,cityLightsWhitePoint:.34,cityLightsGamma:1.1,cityLightsHotPoint:.58,cityLightsLimbStart:.035,cityLightsLimbEnd:.2,terminatorSoftness:.34,specularIntensity:.26,normalStrength:.36,cloudHighlights:.2,cloudColor:"#FFFFFF",cloudIntensity:.75,cloudOpacity:.4,cloudBlackPoint:.16,cloudWhitePoint:.58,cloudAltitude:.018,cloudShadowIntensity:.16,hazeColor:"#00BFFF",hazeIntensity:.08,hazePower:2.2,borderColor:"#00BFFF",borderIntensity:1.15,borderCoreIntensity:2.6,borderCoreWidth:2,borderGlowIntensity:.78,emissiveBloomRadius:18,emissiveBloomStrength:.72,emissiveBloomQuality:"high",atmosphereColor:"#00BFFF",atmosphereIntensity:.16,atmospherePower:2.05,atmosphereInnerFeather:.025,atmosphereOuterFeather:.17,atmosphereSunBias:.3}),Md=Object.freeze({target:Object.freeze([0,2.31,0]),rotation:Object.freeze([0,0,0]),distance:7.2,fov:38}),za=Object.freeze({limitsDegrees:Object.freeze({west:13,east:10,north:12,south:10}),centerRussia:!0,verticalCenteringPx:128,endpointSafePaddingPx:32,missionMarkerSafePaddingPx:50}),Si=Object.freeze({delayMs:1e4,fadeMs:1800,periodMs:16e3,yawDegrees:.55,pitchDegrees:.28});async function Km(n="./config/ui-shell.json",e=fetch){let t=await e(n,{cache:"no-store"});if(!t.ok)throw new Error(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430: HTTP ${t.status}`);return KS(await t.json())}function KS(n){if(!n||!Number.isInteger(n.schemaVersion)||n.schemaVersion<1||n.schemaVersion>bd)throw new Error(`ui-shell.json: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F schemaVersion \u043E\u0442 1 \u0434\u043E ${bd}`);let e={width:bi(n.designViewport?.width,"designViewport.width"),height:bi(n.designViewport?.height,"designViewport.height")},t={missionTextLayout:eg(n.typography?.missionTextLayout??"adaptive",new Set(["adaptive","left","justify","justify-4"]),"typography.missionTextLayout")},i={maxDrawingBufferPixels:bi(n.rendering?.maxDrawingBufferPixels,"rendering.maxDrawingBufferPixels"),earth:QS(n.rendering?.earth),nodeIconBackdrop:{color:Di(n.rendering?.nodeIconBackdrop?.color??Sd.color,"rendering.nodeIconBackdrop.color"),opacity:gn(n.rendering?.nodeIconBackdrop?.opacity??Sd.opacity,"rendering.nodeIconBackdrop.opacity"),radius:bi(n.rendering?.nodeIconBackdrop?.radius??Sd.radius,"rendering.nodeIconBackdrop.radius")},signalLinks:{strandCount:wd(n.rendering?.signalLinks?.strandCount,"rendering.signalLinks.strandCount"),segmentCount:wd(n.rendering?.signalLinks?.segmentCount,"rendering.signalLinks.segmentCount"),particleCount:wd(n.rendering?.signalLinks?.particleCount,"rendering.signalLinks.particleCount"),flowSpeed:bi(n.rendering?.signalLinks?.flowSpeed,"rendering.signalLinks.flowSpeed"),waveAmplitude:ai(n.rendering?.signalLinks?.waveAmplitude,"rendering.signalLinks.waveAmplitude"),waveFrequency:bi(n.rendering?.signalLinks?.waveFrequency,"rendering.signalLinks.waveFrequency"),strandSpacing:ai(n.rendering?.signalLinks?.strandSpacing??.0045,"rendering.signalLinks.strandSpacing")}},s=n.interaction?.earthOrbit||za,r={earthOrbit:{limitsDegrees:Object.fromEntries(["west","east","north","south"].map(l=>[l,iM(s.limitsDegrees?.[l]??za.limitsDegrees[l],`interaction.earthOrbit.limitsDegrees.${l}`)])),centerRussia:sM(s.centerRussia??za.centerRussia,"interaction.earthOrbit.centerRussia"),verticalCenteringPx:ai(s.verticalCenteringPx??za.verticalCenteringPx,"interaction.earthOrbit.verticalCenteringPx"),missionMarkerSafePaddingPx:ai(s.missionMarkerSafePaddingPx??50,"interaction.earthOrbit.missionMarkerSafePaddingPx"),endpointSafePaddingPx:ai(s.endpointSafePaddingPx??za.endpointSafePaddingPx,"interaction.earthOrbit.endpointSafePaddingPx")}},o=Object.fromEntries($S.map(l=>[l,ai(n.geometry?.[l],`geometry.${l}`)]));for(let l of["headerHeight","headerSideColumn","footerHeight","inventoryWidth","borderWidth"])if(o[l]===0)throw new Error(`ui-shell.json: geometry.${l} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F`);let a={...Object.fromEntries(jS.map(l=>[l,ai(n.motion?.[l],`motion.${l}`)])),cameraIdle:{delayMs:ai(n.motion?.cameraIdle?.delayMs??Si.delayMs,"motion.cameraIdle.delayMs"),fadeMs:bi(n.motion?.cameraIdle?.fadeMs??Si.fadeMs,"motion.cameraIdle.fadeMs"),periodMs:bi(n.motion?.cameraIdle?.periodMs??Si.periodMs,"motion.cameraIdle.periodMs"),yawDegrees:At(n.motion?.cameraIdle?.yawDegrees??Si.yawDegrees,0,5,"motion.cameraIdle.yawDegrees"),pitchDegrees:At(n.motion?.cameraIdle?.pitchDegrees??Si.pitchDegrees,0,5,"motion.cameraIdle.pitchDegrees")},easing:vu(n.motion?.easing,"motion.easing"),springEasing:vu(n.motion?.springEasing,"motion.springEasing")},c={};for(let l of qS)c[l]=eM(n.states?.[l],l,n.schemaVersion);return tg({schemaVersion:bd,designViewport:e,typography:t,rendering:i,interaction:r,geometry:o,motion:a,states:c})}function QS(n={}){let e=n.russiaContour??eo;if(typeof e!="string"||!ld.test(e))throw new Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 rendering.earth.russiaContour");let t=Math.max(Number(n.cityLightsGlowRadius)||0,Number(n.borderGlowRadius)||0),i={russiaContour:e,dayTint:Di(n.dayTint??Qe.dayTint,"rendering.earth.dayTint"),nightTint:Di(n.nightTint??Qe.nightTint,"rendering.earth.nightTint"),dayIntensity:At(n.dayIntensity??Qe.dayIntensity,0,3,"rendering.earth.dayIntensity"),ambientIntensity:gn(n.ambientIntensity??Qe.ambientIntensity,"rendering.earth.ambientIntensity"),saturation:At(n.saturation??Qe.saturation,0,2,"rendering.earth.saturation"),textureColorMix:gn(n.textureColorMix??Qe.textureColorMix,"rendering.earth.textureColorMix"),textureSaturation:At(n.textureSaturation??Qe.textureSaturation,0,2,"rendering.earth.textureSaturation"),surfaceExposure:At(n.surfaceExposure??Qe.surfaceExposure,0,2,"rendering.earth.surfaceExposure"),surfaceGamma:At(n.surfaceGamma??Qe.surfaceGamma,.5,3,"rendering.earth.surfaceGamma"),surfaceContrast:At(n.surfaceContrast??Qe.surfaceContrast,.5,2,"rendering.earth.surfaceContrast"),oceanColor:Di(n.oceanColor??Qe.oceanColor,"rendering.earth.oceanColor"),oceanIntensity:At(n.oceanIntensity??Qe.oceanIntensity,0,2,"rendering.earth.oceanIntensity"),russiaSurfaceBoost:At(n.russiaSurfaceBoost??Qe.russiaSurfaceBoost,0,2,"rendering.earth.russiaSurfaceBoost"),outsideSurfaceDim:gn(n.outsideSurfaceDim??Qe.outsideSurfaceDim,"rendering.earth.outsideSurfaceDim"),russiaMaskFeather:At(n.russiaMaskFeather??Qe.russiaMaskFeather,.25,4,"rendering.earth.russiaMaskFeather"),cityLightsColor:Di(n.cityLightsColor??Qe.cityLightsColor,"rendering.earth.cityLightsColor"),cityLightsHotColor:Di(n.cityLightsHotColor??Qe.cityLightsHotColor,"rendering.earth.cityLightsHotColor"),cityLightsIntensity:At(n.cityLightsIntensity??Qe.cityLightsIntensity,0,4,"rendering.earth.cityLightsIntensity"),cityLightsHotIntensity:At(n.cityLightsHotIntensity??Qe.cityLightsHotIntensity,0,6,"rendering.earth.cityLightsHotIntensity"),cityLightsGlowIntensity:At(n.cityLightsGlowIntensity??Qe.cityLightsGlowIntensity,0,2,"rendering.earth.cityLightsGlowIntensity"),cityLightsCoreStart:gn(n.cityLightsCoreStart??Qe.cityLightsCoreStart,"rendering.earth.cityLightsCoreStart"),cityLightsGlowStart:gn(n.cityLightsGlowStart??Qe.cityLightsGlowStart,"rendering.earth.cityLightsGlowStart"),cityLightsDayVisibility:gn(n.cityLightsDayVisibility??Qe.cityLightsDayVisibility,"rendering.earth.cityLightsDayVisibility"),cityLightsBlackPoint:gn(n.cityLightsBlackPoint??Qe.cityLightsBlackPoint,"rendering.earth.cityLightsBlackPoint"),cityLightsWhitePoint:gn(n.cityLightsWhitePoint??Qe.cityLightsWhitePoint,"rendering.earth.cityLightsWhitePoint"),cityLightsGamma:At(n.cityLightsGamma??Qe.cityLightsGamma,.1,4,"rendering.earth.cityLightsGamma"),cityLightsHotPoint:gn(n.cityLightsHotPoint??Qe.cityLightsHotPoint,"rendering.earth.cityLightsHotPoint"),cityLightsLimbStart:gn(n.cityLightsLimbStart??Qe.cityLightsLimbStart,"rendering.earth.cityLightsLimbStart"),cityLightsLimbEnd:gn(n.cityLightsLimbEnd??Qe.cityLightsLimbEnd,"rendering.earth.cityLightsLimbEnd"),terminatorSoftness:At(n.terminatorSoftness??Qe.terminatorSoftness,.01,1,"rendering.earth.terminatorSoftness"),specularIntensity:At(n.specularIntensity??Qe.specularIntensity,0,2,"rendering.earth.specularIntensity"),normalStrength:At(n.normalStrength??Qe.normalStrength,0,2,"rendering.earth.normalStrength"),cloudHighlights:At(n.cloudHighlights??Qe.cloudHighlights,0,2,"rendering.earth.cloudHighlights"),cloudColor:Di(n.cloudColor??Qe.cloudColor,"rendering.earth.cloudColor"),cloudIntensity:At(n.cloudIntensity??Qe.cloudIntensity,0,2,"rendering.earth.cloudIntensity"),cloudOpacity:gn(n.cloudOpacity??Qe.cloudOpacity,"rendering.earth.cloudOpacity"),cloudBlackPoint:gn(n.cloudBlackPoint??Qe.cloudBlackPoint,"rendering.earth.cloudBlackPoint"),cloudWhitePoint:gn(n.cloudWhitePoint??Qe.cloudWhitePoint,"rendering.earth.cloudWhitePoint"),cloudAltitude:At(n.cloudAltitude??Qe.cloudAltitude,.003,.08,"rendering.earth.cloudAltitude"),cloudShadowIntensity:gn(n.cloudShadowIntensity??Qe.cloudShadowIntensity,"rendering.earth.cloudShadowIntensity"),hazeColor:Di(n.hazeColor??Qe.hazeColor,"rendering.earth.hazeColor"),hazeIntensity:gn(n.hazeIntensity??Qe.hazeIntensity,"rendering.earth.hazeIntensity"),hazePower:At(n.hazePower??Qe.hazePower,.5,8,"rendering.earth.hazePower"),borderColor:Di(n.borderColor??Qe.borderColor,"rendering.earth.borderColor"),borderIntensity:At(n.borderIntensity??Qe.borderIntensity,0,2,"rendering.earth.borderIntensity"),borderCoreIntensity:At(n.borderCoreIntensity??Qe.borderCoreIntensity,0,6,"rendering.earth.borderCoreIntensity"),borderCoreWidth:At(n.borderCoreWidth??Qe.borderCoreWidth,.5,6,"rendering.earth.borderCoreWidth"),borderGlowIntensity:At(n.borderGlowIntensity??Qe.borderGlowIntensity,0,2,"rendering.earth.borderGlowIntensity"),emissiveBloomRadius:At(n.emissiveBloomRadius??(t||Qe.emissiveBloomRadius),0,64,"rendering.earth.emissiveBloomRadius"),emissiveBloomStrength:At(n.emissiveBloomStrength??Qe.emissiveBloomStrength,0,2,"rendering.earth.emissiveBloomStrength"),emissiveBloomQuality:eg(n.emissiveBloomQuality??Qe.emissiveBloomQuality,new Set(["high","medium","off"]),"rendering.earth.emissiveBloomQuality"),atmosphereColor:Di(n.atmosphereColor??Qe.atmosphereColor,"rendering.earth.atmosphereColor"),atmosphereIntensity:At(n.atmosphereIntensity??Qe.atmosphereIntensity,0,2,"rendering.earth.atmosphereIntensity"),atmospherePower:At(n.atmospherePower??Qe.atmospherePower,.5,8,"rendering.earth.atmospherePower"),atmosphereInnerFeather:At(n.atmosphereInnerFeather??Qe.atmosphereInnerFeather,.001,.25,"rendering.earth.atmosphereInnerFeather"),atmosphereOuterFeather:At(n.atmosphereOuterFeather??Qe.atmosphereOuterFeather,.01,.5,"rendering.earth.atmosphereOuterFeather"),atmosphereSunBias:gn(n.atmosphereSunBias??Qe.atmosphereSunBias,"rendering.earth.atmosphereSunBias")};if(i.cityLightsBlackPoint>=i.cityLightsWhitePoint)throw new Error("ui-shell.json: rendering.earth.cityLightsBlackPoint \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 cityLightsWhitePoint");if(i.cloudBlackPoint>=i.cloudWhitePoint)throw new Error("ui-shell.json: rendering.earth.cloudBlackPoint \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 cloudWhitePoint");if(i.cityLightsLimbStart>=i.cityLightsLimbEnd)throw new Error("ui-shell.json: rendering.earth.cityLightsLimbStart \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 cityLightsLimbEnd");if(i.cityLightsCoreStart>i.cityLightsHotPoint)throw new Error("ui-shell.json: rendering.earth.cityLightsCoreStart \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 cityLightsHotPoint");if(i.atmosphereInnerFeather>=i.atmosphereOuterFeather)throw new Error("ui-shell.json: rendering.earth.atmosphereInnerFeather \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 atmosphereOuterFeather");return i}function eM(n,e,t){if(!n)throw new Error(`ui-shell.json: \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 states.${e}`);let i={};for(let s of["header","frame","footer","inventory","frameAvoidsFooter"]){if(typeof n[s]!="boolean")throw new Error(`ui-shell.json: states.${e}.${s} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C boolean`);i[s]=n[s]}if(!ZS.has(n.footerStyle))throw new Error(`ui-shell.json: states.${e}.footerStyle \u0438\u043C\u0435\u0435\u0442 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435`);if(i.footerStyle=n.footerStyle,!JS.has(n.earthMask))throw new Error(`ui-shell.json: states.${e}.earthMask \u0438\u043C\u0435\u0435\u0442 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435`);i.earthMask=n.earthMask;for(let s of YS)i[s]=ai(n[s],`states.${e}.${s}`);if(i.backgroundDim=ai(n.backgroundDim,`states.${e}.backgroundDim`),i.backgroundDim>1)throw new Error(`ui-shell.json: states.${e}.backgroundDim \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0432 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0435 0\u20131`);return i.cameraView=tM(n.cameraView,`states.${e}.cameraView`,t),i}function tM(n,e,t){if(t<2)return structuredClone(Md);let i=Ed(n?.target,`${e}.target`);if(t>=3)return{target:i,rotation:Ed(n?.rotation,`${e}.rotation`),distance:bi(n?.distance,`${e}.distance`),fov:t>=4?nM(n?.fov,`${e}.fov`):Md.fov};let r=Ed(n?.camera,`${e}.camera`).map((a,c)=>a-i[c]),o=Math.hypot(...r);if(o<.1)throw new Error(`ui-shell.json: ${e}.camera \u0434\u043E\u043B\u0436\u0435\u043D \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C\u0441\u044F \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E \u043E\u0442 target`);return{target:i,rotation:[Math.acos(Math.min(1,Math.max(-1,r[1]/o)))-Math.PI/2,Math.atan2(r[0],r[2]),0],distance:o,fov:Md.fov}}function nM(n,e){let t=bi(n,e);if(t<15||t>100)throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0432 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0435 15\u2013100`);return t}function iM(n,e){let t=ai(n,e);if(t>180)throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0432 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0435 0\u2013180`);return t}function sM(n,e){if(typeof n!="boolean")throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C boolean`);return n}function Ed(n,e){if(!Array.isArray(n)||n.length!==3)throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0442\u0440\u0438 \u0447\u0438\u0441\u043B\u0430`);return n.map((t,i)=>Qm(t,`${e}[${i}]`))}function Qm(n,e){let t=Number(n);if(!Number.isFinite(t))throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0447\u0438\u0441\u043B\u043E\u043C`);return t}function bi(n,e){let t=Number(n);if(!Number.isFinite(t)||t<=0)throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C`);return t}function wd(n,e){let t=bi(n,e);if(!Number.isInteger(t))throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0446\u0435\u043B\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C`);return t}function ai(n,e){let t=Number(n);if(!Number.isFinite(t)||t<0)throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0435\u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C`);return t}function vu(n,e){if(typeof n!="string"||!n.trim())throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u043E\u0439`);return n.trim()}function eg(n,e,t){let i=vu(n,t);if(!e.has(i))throw new Error(`ui-shell.json: ${t} \u0438\u043C\u0435\u0435\u0442 \u043D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 ${i}`);return i}function Di(n,e){let t=vu(n,e);if(!/^#[0-9a-f]{6}$/i.test(t))throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0446\u0432\u0435\u0442\u043E\u043C #RRGGBB`);return t}function gn(n,e){let t=ai(n,e);if(t>1)throw new Error(`ui-shell.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0432 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0435 0\u20131`);return t}function At(n,e,t,i){let s=Qm(n,i);if(s<e||s>t)throw new Error(`ui-shell.json: ${i} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0432 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0435 ${e}\u2013${t}`);return s}function tg(n){if(!n||typeof n!="object"||Object.isFrozen(n))return n;Object.freeze(n);for(let e of Object.values(n))tg(e);return n}var Jt=!1,nn=3,ig=160,sg=96,_u=.08;var rg=.045,rM=.55,Eu=.23,ka=.012,og=.035,Td=7.2,Pd=3840*2160,oM=1920,aM=1080,lM=1280,cM=720,uM=1920*1080,Tg=Object.freeze({strandCount:5,segmentCount:80,particleCount:32,flowSpeed:.19,waveAmplitude:.009,waveFrequency:3.25,strandSpacing:.0045}),Nd=Object.freeze({color:"#0D001A",opacity:.9,radius:.127});function hM(n,e,t,i,s=1,r=Pd){let o=Math.max(1,Number(n)||1),a=Math.max(1,Number(e)||1),c=Math.max(1,Number(t)||o),l=Math.max(1,Number(i)||a),u=Math.min(c/o,l/a),h=Math.max(.25,u*Math.max(.25,Number(s)||1)),d=Math.max(1,Number(r)||Pd),f=Math.sqrt(d/(o*a));return Math.max(.25,Math.min(h,f))}function ag(n,e,t="high"){let i=Math.max(1,Number(n)||1),s=Math.max(1,Number(e)||1);if(t==="off")return{width:1,height:1};let r=t==="medium"?lM:oM,o=t==="medium"?cM:aM,a=Math.min(1,r/i,o/s);return{width:Math.max(1,Math.round(i*a)),height:Math.max(1,Math.round(s*a))}}function lg(n,e,t=4){let i=Math.max(0,Math.floor(Number(t)||0));if(i<2)return 0;let r=Math.max(1,Number(n)||1)*Math.max(1,Number(e)||1)<=uM?4:2;return Math.min(r,i)}function dM(n,e=nn,t=nn*1.4,i=n){let s=Math.max(e+.001,Number(n)||e+.001),r=Math.max(.001,Number(i)||s),o=e*r/Math.sqrt(s*s-e*e);return Ne.clamp(o/Math.max(e,t),0,1)}var bu=Object.freeze({position:Object.freeze([0,2.31,Td]),target:Object.freeze([0,2.31,0]),fov:38,minDistance:Td,maxDistance:Td}),Ui=Object.freeze({rotation:Object.freeze([.38,-3.31,-.02]),maxWestAngle:Ne.degToRad(13),maxEastAngle:Ne.degToRad(10),maxNorthAngle:Ne.degToRad(12),maxSouthAngle:Ne.degToRad(10),verticalCenteringPx:128,endpoints:Object.freeze({A:Object.freeze({latitude:55.75,longitude:37.62}),B:Object.freeze({latitude:58,longitude:120})})});function Ag(n={}){let e=n.limitsDegrees||{},t=(i,s)=>{let r=Number(e[i]);return Number.isFinite(r)?Ne.clamp(r,0,180):Ne.radToDeg(s)};return{west:Ne.degToRad(t("west",Ui.maxWestAngle)),east:Ne.degToRad(t("east",Ui.maxEastAngle)),north:Ne.degToRad(t("north",Ui.maxNorthAngle)),south:Ne.degToRad(t("south",Ui.maxSouthAngle)),centerRussia:n.centerRussia!==!1,verticalCenteringPx:Math.max(0,Number(n.verticalCenteringPx??Ui.verticalCenteringPx)||0)}}function fM(n,e=Ui.maxSouthAngle,t=Ui.maxNorthAngle,i=Ui.verticalCenteringPx){if(!Number.isFinite(n))return 0;let s=n<0?e:t;return!Number.isFinite(s)||s<=0?0:Ne.clamp(Math.abs(n)/s,0,1)*i}var Ha=new I;function pM(n,e,t,i,s={}){Ha.copy(n).applyMatrix4(t.matrixWorldInverse);let r=i/(2*Math.tan(Ne.degToRad(t.fov)/2)),o=Ha.y-.12*e,a=Ha.y+(Eu+.09)*e,c=Math.max(t.near,-Ha.z-.12*e),l=Math.max(t.near,-Ha.z+.12*e);return s.top=i/2-Math.max(r*a/c,r*a/l),s.bottom=i/2-Math.min(r*o/c,r*o/l),s}function mM(n,e,t,i,s,r,o={}){let a=Math.max(1,i-t);o.zoom=Math.min(1,a/Math.max(1,e-n));let c=s/2+(n-s/2)*o.zoom,l=s/2+(e-s/2)*o.zoom;return o.offset=Ne.clamp(r,t-c,i-l),o}var Tn=Object.freeze({sensitivity:.52,followRate:9,friction:7,softZone:Ne.degToRad(4),maxVelocity:Ne.degToRad(95)});function Cg(n){let e=Ne.clamp(Number(n)||0,0,1);return e<.5?4*e**3:1-(-2*e+2)**3/2}function gM(n,e,t,i,s){let r=Cg(t);return n.set(i*r*(Math.sin(e)*.78+Math.sin(e*.47+1.3)*.22),s*r*(Math.sin(e*.73+.8)*.82+Math.sin(e*.31+2.1)*.18)),n}function Ad(n,e){return n+Math.round((e-n)/(Math.PI*2))*Math.PI*2}function cg(n,e,t,i=t,s=Tn.softZone){if(!e)return 1;let r=e>0?i:t,o=Math.max(0,e>0?r-n:n+r);if(o>=s)return 1;let a=Ne.clamp(o/s,0,1);return a*a*(3-2*a)}var Rg=new ni(...Ui.rotation),xM=new Nn().setFromEuler(Rg),yM=new Nn().setFromEuler(new ni(0,Math.PI/2,0)),Pg=xM.clone().multiply(yM),ug=Pg.clone().invert(),hg={cameraUp:new I},Ni=6.5,dg=6e3,vM=3e3;function _M(n,e=nn*1.002){let t=[],i=s=>{let r=s.x/dg*Math.PI*2,o=s.y/vM*Math.PI,a=Math.sin(o);t.push(-e*Math.cos(r)*a,e*Math.cos(o),e*Math.sin(r)*a)};for(let s of n.paths)for(let r of s.subPaths){let o=r.getPoints(1);for(let a=1;a<o.length;a+=1){let c=o[a-1],l=o[a];Math.abs(c.x-l.x)>dg*.5||(i(c),i(l))}}return new Float32Array(t)}function Ig(n){return{signal:n==="drop"?0:1,linked:n==="link"?1:0,wrong:n==="wrong"?1:0}}function fg(n,e,t=!1){return t?49151:n==="wrong"||e==="wrong"?9765119:49151}var Su=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Ud="const vec3 selectionColor = vec3(0.0, 191.0, 255.0) / 255.0;",bM=`
  vec3 nodeAccent(float linked, float wrong) {
    vec3 accent = mix(vec3(0.43137, 0.10196, 1.0), vec3(0.0, 191.0, 255.0) / 255.0, linked);
    return mix(accent, vec3(149.0, 0.0, 255.0) / 255.0, wrong);
  }
`,Lg=`
  uniform float uRounded;
  float nodeCoreDistance(vec2 uv, float radius) {
    vec2 d = abs(uv - .5) - vec2(radius * .68);
    float rounded = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) + radius * .68;
    return mix(distance(uv, vec2(.5)), rounded, uRounded);
  }
`,Dg=`
  uniform float uTime;
  uniform float uSignal;
  uniform float uLinked;
  uniform float uWrong;
  uniform float uPresence;
  uniform float uSelection;
  uniform float uCoreRadius;
  uniform float uAuraWidth;
  uniform float uWaveStart;
  uniform float uWaveEnd;
  varying vec2 vUv;
  ${bM}
  ${Ud}
  ${Lg}

  float band(float value, float center, float width) {
    float edge = max(fwidth(value) * 1.35, 0.00075);
    return 1.0 - smoothstep(width - edge, width + edge, abs(value - center));
  }

  void main() {
    float distanceToCenter = distance(vUv, vec2(0.5));
    if (distanceToCenter > 0.5) discard;

    vec3 accent = nodeAccent(uLinked, uWrong);

    float coreDistance = nodeCoreDistance(vUv, uCoreRadius);
    float coreEdge = max(fwidth(coreDistance) * 1.35, 0.00075);
    float core = 1.0 - smoothstep(uCoreRadius - coreEdge, uCoreRadius + coreEdge, coreDistance);
    float coreBorder = band(coreDistance, uCoreRadius + 0.002, 0.006);
    float aura = exp(-pow(abs(coreDistance - (uCoreRadius + uAuraWidth * 0.22)) / uAuraWidth, 2.0));
    float waves = 0.0;

    float speed = uTime * 0.28;
    for (int index = 0; index < 4; index++) {
      float phase = fract(speed + float(index) * 0.25);
      float radius = mix(min(uWaveStart, uWaveEnd), uWaveEnd, phase);
      waves += band(distanceToCenter, radius, 0.0045) * pow(1.0 - phase, 0.65);
    }
    waves *= uSignal;

    vec3 color = vec3(13.0, 0.0, 26.0) / 255.0 * core;
    color += vec3(1.0) * coreBorder * (1.0 - uSelection);
    float statusMix = max(uLinked, uWrong);
    color += accent * aura * mix(mix(0.18, 0.3, uSignal), 0.7, statusMix) * (1.0 - uSelection);
    color += accent * waves;
    float alpha = max(core * 0.98, max(coreBorder, max(aura * 0.42, waves * 0.82)));
    gl_FragColor = vec4(color, alpha * uPresence);
  }
`,Id=class{constructor(e,t,i,s,r=null,o=null,a=null){this.camera=e,this.domElement=t,this.target=i.clone(),this.targetTarget=i.clone(),this.limits=s,this.freeOrbit=s.freeOrbit===!0,this.preciseOrbit=s.preciseOrbit===!0,this.centerRussia=s.centerRussia!==!1,this.verticalCenteringPx=s.verticalCenteringPx,this.enabled=!0,this.pointerId=null,this.lastPointer=null,this.gestureStart=null,this.gestureAnnounced=!1,this.onOrbitGestureStart=a,this.dragAxis="orbit",this.velocityYaw=0,this.velocityPitch=0,this.velocityRoll=0,this.cameraEuler=new ni(0,0,0,"YXZ"),this.cameraQuaternion=new Nn,this.cameraOffset=new I,this.cameraUp=new I,this.panRight=new I,this.panUp=new I,this.panDelta=new I,this.fov=e.fov,this.targetFov=this.fov,this.viewTransition=null,this.idleMotion=r?{delay:Math.max(0,Number(r.delayMs??Si.delayMs))/1e3,fade:Math.max(.001,Number(r.fadeMs??Si.fadeMs))/1e3,angularSpeed:Math.PI*2/(Math.max(1,Number(r.periodMs??Si.periodMs))/1e3),yawAmplitude:Ne.degToRad(Math.max(0,Number(r.yawDegrees??Si.yawDegrees))),pitchAmplitude:Ne.degToRad(Math.max(0,Number(r.pitchDegrees??Si.pitchDegrees)))}:null,this.reducedMotionQuery=o,this.idleElapsed=0,this.idleBlend=0,this.idlePhase=0,this.idleOffset=new xe,this.onUserActivity=()=>{this.idleElapsed=0},this.onReducedMotionChange=l=>{l.matches&&(this.idleBlend=0,this.idleOffset.set(0,0),this.applyCamera())};let c=new Xr().setFromVector3(e.position.clone().sub(this.target));this.radius=c.radius,this.targetRadius=this.radius,this.yawCenter=c.theta,this.pitchCenter=c.phi-Math.PI/2,this.rollCenter=0,this.yaw=this.yawCenter,this.pitch=this.pitchCenter,this.roll=this.rollCenter,this.targetYaw=this.yaw,this.targetPitch=this.pitch,this.targetRoll=this.roll,this.onPointerDown=l=>{let u=this.freeOrbit&&l.button===0&&l.shiftKey,h=this.freeOrbit&&(l.button===2||l.button===0&&l.altKey);!this.enabled||l.isPrimary===!1||this.pointerId!==null||l.button!==0&&!h||(this.tapGesture?.pointerId!==l.pointerId&&(this.tapGesture=null),this.viewTransition=null,this.targetYaw=this.yaw,this.targetPitch=this.pitch,this.targetRoll=this.roll,this.targetRadius=this.radius,this.targetTarget.copy(this.target),this.pointerId=l.pointerId,this.dragAxis=u?"pan":h?"roll":"orbit",this.lastPointer={x:l.clientX,y:l.clientY,time:l.timeStamp},this.gestureStart={x:l.clientX,y:l.clientY},this.gestureAnnounced=!1,this.velocityYaw=0,this.velocityPitch=0,this.velocityRoll=0,this.domElement.setPointerCapture?.(l.pointerId),l.preventDefault())},this.onPointerMove=l=>{if(!this.enabled||l.pointerId!==this.pointerId||!this.lastPointer)return;if(this.tapGesture){if(this.tapGesture.multitouch||!this.tapGesture.swiped)return;if(!this.gestureAnnounced){let x=l.clientX-this.tapGesture.x,g=l.clientY-this.tapGesture.y,p=Math.hypot(x,g),M=Math.min(1,this.tapGesture.slopPx/p);this.lastPointer.x=this.tapGesture.x+x*M,this.lastPointer.y=this.tapGesture.y+g*M}}!this.gestureAnnounced&&this.gestureStart&&Math.hypot(l.clientX-this.gestureStart.x,l.clientY-this.gestureStart.y)>5&&(this.gestureAnnounced=!0,this.onOrbitGestureStart?.());let u=Math.max(8,l.timeStamp-this.lastPointer.time),h=Math.PI*2*Tn.sensitivity/Math.max(640,this.domElement.clientHeight),d=-(l.clientX-this.lastPointer.x)*h,f=-(l.clientY-this.lastPointer.y)*h,m=u/1e3;if(this.dragAxis==="pan"){let x=2*this.radius*Math.tan(Ne.degToRad(this.fov)/2)/Math.max(1,this.domElement.clientHeight);this.panRight.set(1,0,0).applyQuaternion(this.camera.quaternion),this.panUp.set(0,1,0).applyQuaternion(this.camera.quaternion),this.panDelta.copy(this.panRight).multiplyScalar(-(l.clientX-this.lastPointer.x)*x),this.panDelta.addScaledVector(this.panUp,(l.clientY-this.lastPointer.y)*x),this.targetTarget.add(this.panDelta)}else if(this.dragAxis==="roll"){let x=d;this.targetRoll+=x,this.velocityRoll=this.preciseOrbit?0:Ne.clamp(x/m,-Tn.maxVelocity,Tn.maxVelocity)}else{let x=d*this.yawBoundaryFactor(this.targetYaw,d),g=f*this.pitchBoundaryFactor(this.targetPitch,f);this.targetYaw=this.clampYaw(this.targetYaw+x),this.targetPitch=this.clampPitch(this.targetPitch+g),this.velocityYaw=this.preciseOrbit?0:Ne.clamp(x/m,-Tn.maxVelocity,Tn.maxVelocity),this.velocityPitch=this.preciseOrbit?0:Ne.clamp(g/m,-Tn.maxVelocity,Tn.maxVelocity)}this.preciseOrbit&&(this.yaw=this.targetYaw,this.pitch=this.targetPitch,this.roll=this.targetRoll,this.target.copy(this.targetTarget),this.applyCamera()),this.lastPointer={x:l.clientX,y:l.clientY,time:l.timeStamp},l.preventDefault()},this.onPointerUp=l=>{l.pointerId===this.pointerId&&(this.pointerId=null,this.lastPointer=null,this.gestureStart=null,this.gestureAnnounced=!1,this.tapGesture=null,l.type==="pointercancel"&&(this.velocityYaw=this.velocityPitch=this.velocityRoll=0),this.domElement.hasPointerCapture?.(l.pointerId)&&this.domElement.releasePointerCapture(l.pointerId))},this.onWheel=l=>{if(!this.enabled||!this.freeOrbit||this.screenConnections)return;let u=Math.exp(l.deltaY*.001);this.setRadius(Ne.clamp(this.targetRadius*u,this.limits.minRadius,this.limits.maxRadius),!0),l.preventDefault()},this.onContextMenu=l=>{this.freeOrbit&&l.preventDefault()},t.addEventListener("pointerdown",this.onPointerDown),t.addEventListener("pointermove",this.onPointerMove),t.addEventListener("pointerup",this.onPointerUp),t.addEventListener("pointercancel",this.onPointerUp),t.addEventListener("wheel",this.onWheel,{passive:!1}),t.addEventListener("contextmenu",this.onContextMenu),this.idleMotion&&(window.addEventListener("pointermove",this.onUserActivity,{capture:!0,passive:!0}),window.addEventListener("pointerdown",this.onUserActivity,{capture:!0,passive:!0}),window.addEventListener("wheel",this.onUserActivity,{capture:!0,passive:!0}),window.addEventListener("keydown",this.onUserActivity,!0),window.addEventListener("focus",this.onUserActivity),this.reducedMotionQuery?.addEventListener?.("change",this.onReducedMotionChange)),this.applyCamera()}applyCamera(){Math.abs(this.camera.fov-this.fov)>1e-4&&(this.camera.fov=this.fov,this.camera.updateProjectionMatrix());let e=this.clampPitch(this.pitch+this.idleOffset.y),t=this.clampYaw(this.yaw+this.idleOffset.x);this.cameraEuler.set(e,t,this.roll,"YXZ"),this.cameraQuaternion.setFromEuler(this.cameraEuler),this.camera.position.copy(this.cameraOffset.set(0,0,this.radius).applyQuaternion(this.cameraQuaternion).add(this.target)),this.camera.up.copy(this.cameraUp.set(0,1,0).applyQuaternion(this.cameraQuaternion)),this.camera.lookAt(this.target)}update(e){if(this.updateIdleMotion(e),!this.enabled){this.velocityYaw=0,this.velocityPitch=0,this.velocityRoll=0,this.applyCamera();return}if(this.viewTransition&&this.pointerId===null){let t=this.viewTransition;t.elapsed=Math.min(t.duration,t.elapsed+e);let i=Cg(t.elapsed/t.duration);this.target.lerpVectors(t.startTarget,t.endTarget,i),this.yaw=Ne.lerp(t.startYaw,t.endYaw,i),this.pitch=Ne.lerp(t.startPitch,t.endPitch,i),this.roll=Ne.lerp(t.startRoll,t.endRoll,i),this.radius=Ne.lerp(t.startRadius,t.endRadius,i),this.fov=Ne.lerp(t.startFov,t.endFov,i),t.elapsed>=t.duration&&(this.viewTransition=null),this.applyCamera();return}if(this.pointerId===null&&!this.preciseOrbit){let t=this.velocityYaw*e,i=this.velocityPitch*e,s=this.velocityRoll*e;this.targetYaw=this.clampYaw(this.targetYaw+t*this.yawBoundaryFactor(this.targetYaw,t)),this.targetPitch=this.clampPitch(this.targetPitch+i*this.pitchBoundaryFactor(this.targetPitch,i)),this.targetRoll+=s;let r=Math.exp(-Tn.friction*e);this.velocityYaw*=r,this.velocityPitch*=r,this.velocityRoll*=r,Math.abs(this.velocityYaw)<1e-4&&(this.velocityYaw=0),Math.abs(this.velocityPitch)<1e-4&&(this.velocityPitch=0),Math.abs(this.velocityRoll)<1e-4&&(this.velocityRoll=0)}this.target.x=Ne.damp(this.target.x,this.targetTarget.x,Tn.followRate,e),this.target.y=Ne.damp(this.target.y,this.targetTarget.y,Tn.followRate,e),this.target.z=Ne.damp(this.target.z,this.targetTarget.z,Tn.followRate,e),this.yaw=Ne.damp(this.yaw,this.targetYaw,Tn.followRate,e),this.pitch=Ne.damp(this.pitch,this.targetPitch,Tn.followRate,e),this.roll=Ne.damp(this.roll,this.targetRoll,Tn.followRate,e),this.radius=Ne.damp(this.radius,this.targetRadius,4.5,e),this.fov=Ne.damp(this.fov,this.targetFov,Tn.followRate,e),this.applyCamera()}updateIdleMotion(e){if(this.screenConnections){this.resetIdleMotion(!0);return}if(!this.idleMotion)return;this.idleElapsed+=e;let t=!this.reducedMotionQuery?.matches&&this.idleElapsed>=this.idleMotion.delay,i=e/this.idleMotion.fade;if(this.idleBlend=Ne.clamp(this.idleBlend+(t?i:-i),0,1),this.idleBlend<=0){this.idleOffset.set(0,0);return}this.idlePhase+=e*this.idleMotion.angularSpeed,gM(this.idleOffset,this.idlePhase,this.idleBlend,this.idleMotion.yawAmplitude,this.idleMotion.pitchAmplitude)}resetIdleMotion(e=!1){this.idleElapsed=0,e&&(this.idleBlend=0,this.idleOffset.set(0,0))}setRadius(e,t=!1){this.resetIdleMotion(!0),this.viewTransition=null,this.targetRadius=e,t&&(this.radius=e),this.applyCamera()}setFov(e,t=!1){this.resetIdleMotion(!0),this.viewTransition=null,this.targetFov=Ne.clamp(e,15,100),t&&(this.fov=this.targetFov),this.applyCamera()}clampYaw(e){return this.freeOrbit?e:Ne.clamp(e,this.yawCenter-this.limits.east,this.yawCenter+this.limits.west)}clampPitch(e){return this.freeOrbit?e:Ne.clamp(e,this.pitchCenter-this.limits.south,this.pitchCenter+this.limits.north)}yawBoundaryFactor(e,t){return this.freeOrbit?1:cg(e-this.yawCenter,t,this.limits.east,this.limits.west)}pitchBoundaryFactor(e,t){return this.freeOrbit?1:cg(e-this.pitchCenter,t,this.limits.south,this.limits.north)}setEarthOrbitPreferences(e){let t=Ag(e);Object.assign(this.limits,{west:t.west,east:t.east,north:t.north,south:t.south}),this.centerRussia=t.centerRussia,this.verticalCenteringPx=t.verticalCenteringPx,this.freeOrbit||(this.targetYaw=this.clampYaw(this.targetYaw),this.targetPitch=this.clampPitch(this.targetPitch))}setViewState(e,t=!1,i=0){if(!e?.target)return;this.resetIdleMotion(!0);let s=new I().fromArray(e.target),r=Number(e.distance),o=Number(e.rotation?.[0]),a=Number(e.rotation?.[1]),c=Number(e.rotation?.[2]),l=Number(e.fov??bu.fov);if(![r,o,a,c].every(Number.isFinite)&&e.camera?.length===3){let u=new I().fromArray(e.camera).sub(s);if(u.lengthSq()<.01)return;let h=new Xr().setFromVector3(u);r=h.radius,o=h.phi-Math.PI/2,a=h.theta,c=0}![r,o,a,c,l].every(Number.isFinite)||r<=0||(l=Ne.clamp(l,15,100),e.exact||(a=Ad(a,this.yaw),o=Ad(o,this.pitch),c=Ad(c,this.roll)),this.yawCenter=a,this.pitchCenter=o,this.rollCenter=c,this.targetTarget.copy(s),this.targetRadius=r,this.targetYaw=a,this.targetPitch=o,this.targetRoll=c,this.targetFov=l,this.velocityYaw=0,this.velocityPitch=0,this.velocityRoll=0,t?(this.viewTransition=null,this.target.copy(s),this.radius=r,this.yaw=a,this.pitch=o,this.roll=c,this.fov=l):Number(i)>0?this.viewTransition={duration:Math.max(.001,Number(i)/1e3),elapsed:0,startTarget:this.target.clone(),endTarget:s.clone(),startRadius:this.radius,endRadius:r,startYaw:this.yaw,endYaw:a,startPitch:this.pitch,endPitch:o,startRoll:this.roll,endRoll:c,startFov:this.fov,endFov:l}:this.viewTransition=null,this.applyCamera())}getViewState(){return{target:this.target.toArray(),rotation:[this.pitch,this.yaw,this.roll],distance:this.radius,fov:this.fov}}dispose(){this.domElement.removeEventListener("pointerdown",this.onPointerDown),this.domElement.removeEventListener("pointermove",this.onPointerMove),this.domElement.removeEventListener("pointerup",this.onPointerUp),this.domElement.removeEventListener("pointercancel",this.onPointerUp),this.domElement.removeEventListener("wheel",this.onWheel),this.domElement.removeEventListener("contextmenu",this.onContextMenu),this.idleMotion&&(window.removeEventListener("pointermove",this.onUserActivity,!0),window.removeEventListener("pointerdown",this.onUserActivity,!0),window.removeEventListener("wheel",this.onUserActivity,!0),window.removeEventListener("keydown",this.onUserActivity,!0),window.removeEventListener("focus",this.onUserActivity),this.reducedMotionQuery?.removeEventListener?.("change",this.onReducedMotionChange))}};async function Ng({container:n,planar:e=!1,planarPointAllowed:t=null,placements:i,network:s,itemTypes:r,endpoints:o=Ui.endpoints,selectedItem:a,preparedAssets:c=null,contourCatalog:l=null,startPaused:u=!1,initialView:h,maxDrawingBufferPixels:d=Pd,earthStyle:f=Qe,nodeIconBackdropStyle:m=Nd,signalLinkStyle:x=Tg,earthOrbit:g={},cameraIdleMotion:p=null,onOrbitGestureStart:M=null,freeOrbit:E=!1,preciseOrbit:v=!1,onPlace:A,onSelectPlacement:C=null,onMove:N,onMovePreview:_=null,onMoveCancel:w=null,onConnectionFrame:V=null,placementRejection:k=()=>null,onRemove:T}){Jt=e;let D=new Kc({antialias:!0,alpha:!0,powerPreference:"high-performance"});try{let ee=window.matchMedia("(prefers-reduced-motion: reduce)");D.outputColorSpace=fn,D.toneMapping=qn,D.toneMappingExposure=1.08,D.domElement.className="webgl-canvas",D.domElement.setAttribute("aria-label","\u0422\u0440\u0451\u0445\u043C\u0435\u0440\u043D\u043E\u0435 \u0438\u0433\u0440\u043E\u0432\u043E\u0435 \u043F\u043E\u043B\u0435 \u2014 \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0441\u043F\u0443\u0442\u043D\u0438\u043A \u043F\u043E \u0433\u043B\u043E\u0431\u0443\u0441\u0443; \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0440\u0443\u0447\u043A\u0443 \u0441\u043E \u0441\u0442\u0440\u0435\u043B\u043A\u0430\u043C\u0438 \u0434\u043B\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0432\u044B\u0441\u043E\u0442\u044B"),e&&D.domElement.setAttribute("aria-label","\u0414\u0432\u0443\u043C\u0435\u0440\u043D\u043E\u0435 \u043F\u043E\u043B\u0435 MAX \u2014 \u0440\u0430\u0437\u043C\u0435\u0449\u0430\u0439\u0442\u0435 \u0438 \u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F"),n.replaceChildren(D.domElement);let j=new Zi;j.background=null,D.setClearColor(851994,0),j.fog=null;let G=new En(bu.fov,1,.1,60);G.position.fromArray(bu.position),h?.camera?.length===3&&G.position.fromArray(h.camera);let X={current:new xe,from:new xe,target:new xe,startedAt:0,durationMs:0},Y=null,me=null,ae=[],Te=[],Se=new I,lt={},dt={},it={},he=1,Z=0,O=0,F=Number.NaN,P=Number.NaN,q=new aa,ce=new Da,pe=c?.icons||[...new Set([...Object.values(vi).map(H=>H.src),...Object.values(r).map(H=>H.icon)].filter(Boolean))],z=new Map(await Promise.all(pe.map(async H=>[H,c?Dd(ce.parse(c.get(H).text),.18):await OM(ce,H,.18)]))),oe=l||c?.contours||await iu(),J=Ia(oe,f.russiaContour),fe=async(H,W=null)=>{if(e){let Je=new $s(new Uint8Array([0,0,0,0]),1,1);Je.needsUpdate=!0;let ot=new Is;return ot.setPositions([0,0,0,0,0,0]),{fill:Je,geometry:ot}}let ie=Ia(oe,H),Me=await Promise.allSettled([W?Promise.resolve().then(()=>{let Je=new rn(W.get(ie.fill).image);return Je.needsUpdate=!0,Je}):q.loadAsync(ie.fill),W?Promise.resolve().then(()=>ce.parse(W.get(ie.border).text)):ce.loadAsync(ie.border)]),we=Me.find(Je=>Je.status==="rejected");if(we)throw Me[0].status==="fulfilled"&&Me[0].value.dispose(),we.reason;let He=Me[0].value,_e=_M(Me[1].value);if(!_e.length)throw He.dispose(),new Error("\u041A\u043E\u043D\u0442\u0443\u0440 \u043D\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u043B\u0438\u043D\u0438\u0439");He.colorSpace=yn,He.format=Zr,He.wrapS=Yi,He.wrapT=Dn,He.minFilter=gi,He.magFilter=qt,He.generateMipmaps=!0,He.anisotropy=Math.min(4,D.capabilities.getMaxAnisotropy());let Fe=new Is;return Fe.setPositions(_e),Fe.computeBoundingSphere(),Fe.userData.shared=!0,{fill:He,geometry:Fe}},ye=await fe(J.id,c),ve=(H,W=!1)=>{if(!H)return null;let ie=W?`endpoint:${H}`:H;if(!z.has(ie)){let Me=z.get(H);if(Me&&W){let we=Me.clone();we.scale(.1/.18,.1/.18,1),we.userData.shared=!0,z.set(ie,we)}else if(H.startsWith("data:image/svg+xml;charset=utf-8,")){let we=ce.parse(decodeURIComponent(H.slice(H.indexOf(",")+1)));z.set(ie,Dd(we,W?.1:.18))}}return z.get(ie)||null};for(let H of pe)ve(H,!0);let Be=new Set(z.keys()),Ae=await Promise.all(dd.slice(0,5).map(async H=>{if(e){let ie=new $s(new Uint8Array([0,0,0,0]),1,1);return ie.needsUpdate=!0,ie}if(!c)return q.loadAsync(H);let W=new rn(c.get(H).image);return W.needsUpdate=!0,W})),[Q,b,qe,Ke,R]=Ae,y=ye.fill;Q.colorSpace=fn,b.colorSpace=yn,qe.colorSpace=yn,Ke.colorSpace=yn,R.colorSpace=yn,R.format=Zr;for(let H of[Q,b,qe,Ke,R])H.wrapS=Yi,H.minFilter=gi,H.magFilter=qt,H.generateMipmaps=!0,H.anisotropy=Math.min(8,D.capabilities.getMaxAnisotropy());let B={...Rn.clone(Ie.fog),uDayMap:{value:Q},uSpecularMap:{value:qe},uNormalMap:{value:Ke},uCloudMap:{value:R},uCityMap:{value:b},uRussiaMask:{value:y},uSunDirection:{value:new I(-4,5,7).normalize()},uDayTint:{value:new Ye},uNightTint:{value:new Ye},uDayIntensity:{value:1},uAmbientIntensity:{value:.25},uSaturation:{value:1},uTextureColorMix:{value:0},uTextureSaturation:{value:1},uSurfaceExposure:{value:.78},uSurfaceGamma:{value:1.16},uSurfaceContrast:{value:1.12},uOceanColor:{value:new Ye},uOceanIntensity:{value:.78},uRussiaSurfaceBoost:{value:.9},uOutsideSurfaceDim:{value:.48},uRussiaMaskFeather:{value:1.35},uTerminatorSoftness:{value:.2},uSpecularIntensity:{value:.25},uNormalStrength:{value:.36},uCloudHighlights:{value:.2},uCloudBlackPoint:{value:.16},uCloudWhitePoint:{value:.58},uCloudShadowIntensity:{value:.16},uHazeColor:{value:new Ye},uHazeIntensity:{value:.2},uHazePower:{value:2.2},uCityColor:{value:new Ye},uCityHotColor:{value:new Ye},uCityIntensity:{value:1.65},uCityHotIntensity:{value:2.4},uCityCoreStart:{value:.12},uCityDayVisibility:{value:.12},uCityBlackPoint:{value:.018},uCityWhitePoint:{value:.34},uCityGamma:{value:1.1},uCityHotPoint:{value:.58},uCityLimbStart:{value:.035},uCityLimbEnd:{value:.2}},L=new St({uniforms:B,fog:!0,vertexShader:`
      varying vec2 vEarthUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vWorldBitangent;
      varying vec3 vWorldPosition;
      #include <fog_pars_vertex>
      void main() {
        vEarthUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * worldPosition;
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec3 tangentSeed = vec3(normal.z, 0.0, -normal.x);
        vec3 localTangent = length(tangentSeed) > 0.0001 ? normalize(tangentSeed) : vec3(1.0, 0.0, 0.0);
        vec3 localBitangent = normalize(cross(normal, localTangent));
        vWorldTangent = normalize(mat3(modelMatrix) * localTangent);
        vWorldBitangent = normalize(mat3(modelMatrix) * localBitangent);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,fragmentShader:`
      uniform sampler2D uDayMap;
      uniform sampler2D uSpecularMap;
      uniform sampler2D uNormalMap;
      uniform sampler2D uCloudMap;
      uniform sampler2D uCityMap;
      uniform sampler2D uRussiaMask;
      uniform vec3 uSunDirection;
      uniform vec3 uDayTint;
      uniform vec3 uNightTint;
      uniform float uDayIntensity;
      uniform float uAmbientIntensity;
      uniform float uSaturation;
      uniform float uTextureColorMix;
      uniform float uTextureSaturation;
      uniform float uSurfaceExposure;
      uniform float uSurfaceGamma;
      uniform float uSurfaceContrast;
      uniform vec3 uOceanColor;
      uniform float uOceanIntensity;
      uniform float uRussiaSurfaceBoost;
      uniform float uOutsideSurfaceDim;
      uniform float uRussiaMaskFeather;
      uniform float uTerminatorSoftness;
      uniform float uSpecularIntensity;
      uniform float uNormalStrength;
      uniform float uCloudHighlights;
      uniform float uCloudBlackPoint;
      uniform float uCloudWhitePoint;
      uniform float uCloudShadowIntensity;
      uniform vec3 uHazeColor;
      uniform float uHazeIntensity;
      uniform float uHazePower;
      uniform vec3 uCityColor;
      uniform vec3 uCityHotColor;
      uniform float uCityIntensity;
      uniform float uCityHotIntensity;
      uniform float uCityCoreStart;
      uniform float uCityDayVisibility;
      uniform float uCityBlackPoint;
      uniform float uCityWhitePoint;
      uniform float uCityGamma;
      uniform float uCityHotPoint;
      uniform float uCityLimbStart;
      uniform float uCityLimbEnd;
      varying vec2 vEarthUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vWorldBitangent;
      varying vec3 vWorldPosition;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        vec3 baseNormal = normalize(vWorldNormal);
        vec3 tangentNormal = texture2D(uNormalMap, vEarthUv).xyz * 2.0 - 1.0;
        tangentNormal.xy *= uNormalStrength;
        tangentNormal.z = max(tangentNormal.z, 0.08);
        vec3 normal = normalize(
          normalize(vWorldTangent) * tangentNormal.x
          + normalize(vWorldBitangent) * tangentNormal.y
          + baseNormal * tangentNormal.z
        );
        vec3 sunDirection = normalize(uSunDirection);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float normalToSun = dot(baseNormal, sunDirection);
        float daylight = smoothstep(-uTerminatorSoftness, uTerminatorSoftness, normalToSun);
        float lambert = max(dot(normal, sunDirection), 0.0);

        vec3 daySample = texture2D(uDayMap, vEarthUv).rgb;
        float originalLuminance = dot(daySample, vec3(0.2126, 0.7152, 0.0722));
        vec3 originalColor = mix(vec3(originalLuminance), daySample, uTextureSaturation);
        vec3 gradedSample = pow(max(daySample, vec3(0.0)), vec3(uSurfaceGamma));
        float luminance = dot(gradedSample, vec3(0.2126, 0.7152, 0.0722));
        gradedSample = mix(vec3(luminance), gradedSample, uSaturation);
        gradedSample = max((gradedSample - 0.18) * uSurfaceContrast + 0.18, vec3(0.0));
        vec3 surfaceTint = mix(uNightTint, uDayTint, daylight);
        float surfaceLight = uAmbientIntensity + uDayIntensity * mix(0.08, 1.0, lambert);
        vec3 styledSurface = gradedSample * surfaceTint;
        vec3 surfaceColor = mix(styledSurface, originalColor, uTextureColorMix);
        vec3 outgoingLight = surfaceColor * surfaceLight * uSurfaceExposure;

        // Preserve the continuous data value: the same map defines the hard
        // land/water separation and the softer spatial distribution of sheen.
        float specularSample = clamp(texture2D(uSpecularMap, vEarthUv).r, 0.0, 1.0);
        float oceanMask = smoothstep(0.24, 0.82, specularSample);
        float oceanTextureDetail = smoothstep(0.005, 0.12, originalLuminance);
        vec3 oceanTonalColor = uOceanColor
          * uOceanIntensity
          * mix(0.74, 1.08, oceanTextureDetail)
          * mix(0.72, 1.0, daylight);
        // Ocean color is an authored tonal blend, not a lower clamp. This lets
        // the editor make water darker as well as lighter while retaining the
        // low-frequency detail of the diffuse map.
        outgoingLight = mix(outgoingLight, oceanTonalColor, oceanMask);

        float maximumChannel = max(daySample.r, max(daySample.g, daySample.b));
        float minimumChannel = min(daySample.r, min(daySample.g, daySample.b));
        float neutralSurface = 1.0 - clamp((maximumChannel - minimumChannel) * 4.0, 0.0, 1.0);
        float cloudMask = smoothstep(0.5, 0.88, luminance) * smoothstep(0.45, 0.92, neutralSurface);
        outgoingLight += vec3(1.0) * cloudMask * uCloudHighlights * (0.34 + 0.66 * daylight);

        float viewFacing = clamp(dot(baseNormal, viewDirection), 0.0, 1.0);
        // A direct map-driven sheen replaces the former tight Blinn-Phong lobe.
        // It follows all ocean pixels instead of collapsing into one hotspot;
        // view angle and broad daylight only modulate the mapped distribution.
        float mappedSpecular = smoothstep(0.08, 0.96, specularSample);
        float broadDayResponse = smoothstep(-0.42, 0.72, dot(normal, sunDirection));
        float grazingResponse = pow(1.0 - viewFacing, 1.35);
        float oceanSheen = mappedSpecular
          * mix(0.7, 1.0, grazingResponse)
          * mix(0.34, 1.0, broadDayResponse)
          * mix(0.28, 1.0, daylight);
        vec3 oceanSheenColor = mix(uOceanColor, vec3(1.0), 0.28);
        outgoingLight += oceanSheenColor * oceanSheen * uSpecularIntensity * 0.32;

        float rimHaze = pow(1.0 - viewFacing, uHazePower);
        float hazeAmount = rimHaze * uHazeIntensity * (0.22 + daylight * 0.78);
        outgoingLight += uHazeColor * hazeAmount * (0.25 + luminance * 0.75);

        // The fill SVG is geographic data, not a baked lighting effect. It
        // establishes the requested hierarchy: readable Russia, quiet context.
        float russiaRaw = texture2D(uRussiaMask, vEarthUv).r;
        float russiaEdge = max(fwidth(russiaRaw) * uRussiaMaskFeather, 1.0 / 255.0);
        float russiaMask = smoothstep(0.5 - russiaEdge, 0.5 + russiaEdge, russiaRaw);
        vec3 russiaStyled = gradedSample * mix(uNightTint, uDayTint, 0.82);
        vec3 russiaDetail = mix(russiaStyled, originalColor, uTextureColorMix)
          * uRussiaSurfaceBoost
          * (0.55 + luminance * 0.45);
        float landMask = 1.0 - oceanMask;
        float regionalDim = mix(uOutsideSurfaceDim, 1.0, russiaMask);
        outgoingLight = outgoingLight * mix(1.0, regionalDim, landMask)
          + russiaDetail * russiaMask;

        // The raised cloud shell casts a restrained, slightly offset shadow on
        // the surface. City emission is added afterwards and remains legible.
        float cloudShadowRaw = texture2D(uCloudMap, vEarthUv + vec2(-0.0018, 0.001)).r;
        float cloudShadow = smoothstep(uCloudBlackPoint, uCloudWhitePoint, cloudShadowRaw);
        outgoingLight *= 1.0 - cloudShadow * uCloudShadowIntensity * (0.35 + daylight * 0.65);

        // The source texture contains nearly black exposed rock around the
        // polar ice. Preserve it as detail, but keep it inside the same navy
        // value range instead of allowing isolated absolute-black patches.
        float polarLatitude = smoothstep(0.5, 0.82, abs(vEarthUv.y - 0.5) * 2.0);
        float polarLand = polarLatitude * landMask;
        vec3 polarLandFloor = mix(uNightTint, uDayTint, 0.38 + daylight * 0.32)
          * uSurfaceExposure
          * (0.22 + daylight * 0.12);
        outgoingLight = max(outgoingLight, polarLandFloor * polarLand);

        // The source is a sharp scalar data map. Color, thresholding, hot core,
        // day visibility and horizon attenuation stay fully runtime-controlled.
        // A small positive LOD bias keeps sub-pixel city clusters stable while
        // the globe or idle camera moves; the source remains a sharp data map.
        float cityRaw = texture2D(uCityMap, vEarthUv, 0.75).r;
        float cityAa = max(fwidth(cityRaw) * 1.5, 2.0 / 255.0);
        float citySource = smoothstep(uCityBlackPoint - cityAa, uCityWhitePoint + cityAa, cityRaw);
        citySource = pow(clamp(citySource, 0.0, 1.0), uCityGamma);
        float cityLimbFade = smoothstep(uCityLimbStart, uCityLimbEnd, viewFacing);
        float cityVisibility = mix(1.0, uCityDayVisibility, daylight) * cityLimbFade;
        float cityCore = smoothstep(uCityCoreStart, 1.0, citySource);
        float cityHot = smoothstep(uCityHotPoint, 1.0, citySource);
        vec3 cityColor = mix(uCityColor, uCityHotColor, cityHot);
        outgoingLight += cityColor * cityCore * cityVisibility * uCityIntensity;
        outgoingLight += uCityHotColor * cityHot * cityHot * cityVisibility * uCityHotIntensity;

        gl_FragColor = vec4(outgoingLight, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `}),U=new ft(new Zs(nn,ig,sg),L);U.rotation.copy(Rg),j.add(U);let ue={...Rn.clone(Ie.fog),uMap:{value:R},uSunDirection:{value:B.uSunDirection.value},uColor:{value:new Ye},uIntensity:{value:.75},uOpacity:{value:.4},uBlackPoint:{value:.16},uWhitePoint:{value:.58}},ge=new St({uniforms:ue,transparent:!0,depthTest:!0,depthWrite:!1,blending:ti,vertexShader:`
      varying vec2 vCloudUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      #include <fog_pars_vertex>
      void main() {
        vCloudUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * worldPosition;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,fragmentShader:`
      uniform sampler2D uMap;
      uniform vec3 uSunDirection;
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uOpacity;
      uniform float uBlackPoint;
      uniform float uWhitePoint;
      varying vec2 vCloudUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      #include <fog_pars_fragment>
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float raw = texture2D(uMap, vCloudUv, 0.25).r;
        float aa = max(fwidth(raw) * 1.2, 1.0 / 255.0);
        float mask = smoothstep(uBlackPoint - aa, uWhitePoint + aa, raw);
        float viewFacing = clamp(dot(normal, viewDirection), 0.0, 1.0);
        float limbFade = smoothstep(0.025, 0.18, viewFacing);
        float lambert = max(dot(normal, normalize(uSunDirection)), 0.0);
        float silverLining = pow(1.0 - viewFacing, 2.2) * 0.22;
        float alpha = mask * uOpacity * limbFade;
        if (alpha < 0.001) discard;
        vec3 litCloud = uColor * uIntensity * (0.34 + lambert * 0.66 + silverLining);
        gl_FragColor = vec4(litCloud, alpha);
        #include <fog_fragment>
      }
    `}),te=new ft(new Zs(nn,128,80),ge);te.rotation.copy(U.rotation),te.renderOrder=2,j.add(te);let le=ye.geometry,Ee=new Ye(16777215),Xe=new Ye(49151),Re=new Ps({color:Ee,linewidth:2,transparent:!0,opacity:1,blending:ti,depthWrite:!1,toneMapped:!1,alphaToCoverage:!0}),Ce=new no(le,Re);Ce.rotation.copy(U.rotation),Ce.renderOrder=2.9,j.add(Ce);let et=new Zi,rt=new Ut({colorWrite:!1,depthTest:!0,depthWrite:!0,polygonOffset:!0,polygonOffsetFactor:1,polygonOffsetUnits:1}),ct=new ft(U.geometry,rt);ct.rotation.copy(U.rotation),ct.renderOrder=0,et.add(ct);let $={uMap:{value:b},uSunDirection:{value:B.uSunDirection.value},uColor:{value:B.uCityColor.value},uHotColor:{value:B.uCityHotColor.value},uIntensity:{value:.85},uDayVisibility:{value:.12},uTerminatorSoftness:{value:B.uTerminatorSoftness.value},uBlackPoint:{value:.018},uWhitePoint:{value:.34},uGamma:{value:1.1},uGlowStart:{value:.055},uHotPoint:{value:.58},uLimbStart:{value:.035},uLimbEnd:{value:.2}},Le=new St({uniforms:$,depthTest:!0,depthWrite:!1,toneMapped:!1,vertexShader:`
      varying vec2 vCityUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vCityUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,fragmentShader:`
      uniform sampler2D uMap;
      uniform vec3 uSunDirection;
      uniform vec3 uColor;
      uniform vec3 uHotColor;
      uniform float uIntensity;
      uniform float uDayVisibility;
      uniform float uTerminatorSoftness;
      uniform float uBlackPoint;
      uniform float uWhitePoint;
      uniform float uGamma;
      uniform float uGlowStart;
      uniform float uHotPoint;
      uniform float uLimbStart;
      uniform float uLimbEnd;
      varying vec2 vCityUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float daylight = smoothstep(
          -uTerminatorSoftness,
          uTerminatorSoftness,
          dot(normal, normalize(uSunDirection))
        );
        float viewFacing = clamp(dot(normal, viewDirection), 0.0, 1.0);
        float limbFade = smoothstep(uLimbStart, uLimbEnd, viewFacing);
        float raw = texture2D(uMap, vCityUv, 0.75).r;
        float aa = max(fwidth(raw) * 1.5, 2.0 / 255.0);
        float source = smoothstep(uBlackPoint - aa, uWhitePoint + aa, raw);
        source = pow(clamp(source, 0.0, 1.0), uGamma);
        float visibility = mix(1.0, uDayVisibility, daylight) * limbFade;
        float glowSource = smoothstep(uGlowStart, 1.0, source);
        float energy = glowSource * visibility * uIntensity;
        if (energy < 0.001) discard;
        float hot = smoothstep(uHotPoint, 1.0, source);
        gl_FragColor = vec4(mix(uColor, uHotColor, hot) * energy, 1.0);
      }
    `}),de=new ft(U.geometry,Le);de.rotation.copy(U.rotation),de.renderOrder=1,et.add(de);let De=new Ps({color:16777215,linewidth:3,transparent:!1,blending:Fn,depthTest:!0,depthWrite:!1,toneMapped:!1,alphaToCoverage:!0}),Ue=new no(le,De);Ue.rotation.copy(U.rotation),Ue.renderOrder=2,et.add(Ue);let be=Am({initial:{id:J.id,resource:ye},load:H=>fe(H),apply:({fill:H,geometry:W})=>{D.initTexture(H),B.uRussiaMask.value=H,Ce.geometry=W,Ue.geometry=W},release:({fill:H,geometry:W})=>{H.dispose(),W.dispose()}}),Ze=new Zt(1,1,{type:on,minFilter:qt,magFilter:qt,depthBuffer:!0,stencilBuffer:!1});Ze.texture.colorSpace=yn,Ze.texture.name="XSputnik.borderBloomSource";let $e=new pu(et,G,null,851994,0),Ot=new so(new xe(1,1),.7,.42,.01),_t=new fu(D,Ze);_t.setPixelRatio(1),_t.renderToScreen=!1,_t.addPass($e),_t.addPass(Ot);let zn={uMap:{value:_t.readBuffer.texture},uOpacity:{value:.42}},Hn=new Cn(2,2),Xa=new St({uniforms:zn,transparent:!0,blending:mn,depthTest:!1,depthWrite:!1,toneMapped:!1,vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,fragmentShader:`
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec3 bloomSample = texture2D(uMap, vUv).rgb;
        float alpha = clamp(max(bloomSample.r, max(bloomSample.g, bloomSample.b)) * uOpacity, 0.0, 1.0);
        gl_FragColor = vec4(bloomSample * uOpacity, alpha);
      }
    `}),go=new Zi,xo=new is(-1,1,1,-1,0,1),lr=new ft(Hn,Xa);lr.frustumCulled=!1,go.add(lr);let yo=!0,ls="high",Us=!0,un=new xe,Ln=new Zt(1,1,{type:on,minFilter:qt,magFilter:qt,depthBuffer:!0,stencilBuffer:!1,samples:lg(1,1,D.capabilities.maxSamples)});Ln.texture.colorSpace=yn,Ln.texture.name="XSputnik.earthHDR";let cr=new mu;cr.renderToScreen=!0;let cs={uColor:{value:new Ye},uIntensity:{value:.7},uPower:{value:2.25}},Fs=new ft(new Zs(nn*1.012,ig,sg),new St({uniforms:cs,transparent:!0,blending:mn,side:xn,depthWrite:!1,vertexShader:"varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vNormal=normalize(mat3(modelMatrix)*normal); vec4 world=modelMatrix*vec4(position,1.0); vWorldPosition=world.xyz; gl_Position=projectionMatrix*viewMatrix*world; }",fragmentShader:`
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uPower;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float rim = 1.0 - abs(dot(normalize(vNormal), viewDirection));
          float core = pow(rim, uPower * 1.45);
          float alpha = core * uIntensity * 0.46;
          gl_FragColor = vec4(uColor * (0.7 + core * 0.5), alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `})),Fi={uColor:{value:cs.uColor.value},uIntensity:{value:.7},uDiscRadius:{value:.78},uInnerFeather:{value:.025},uOuterFeather:{value:.17},uSunBias:{value:.3}},Jn=new ft(new Cn(nn*2.8,nn*2.8),new St({uniforms:Fi,transparent:!0,blending:mn,depthTest:!1,depthWrite:!1,toneMapped:!1,vertexShader:"varying vec2 vHaloUv; void main(){ vHaloUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uDiscRadius;
        uniform float uInnerFeather;
        uniform float uOuterFeather;
        uniform float uSunBias;
        varying vec2 vHaloUv;
        void main() {
          float radius = length(vHaloUv - 0.5) * 2.0;
          float radiusDerivative = max(fwidth(radius), 0.0001);
          float seamOverlap = radiusDerivative * 1.5;
          float innerWidth = max(uInnerFeather, radiusDerivative * 2.0);
          float outerWidth = max(uOuterFeather, radiusDerivative * 2.0);
          float innerFade = smoothstep(
            uDiscRadius - innerWidth - seamOverlap,
            uDiscRadius - seamOverlap,
            radius
          );
          float outerFade = 1.0 - smoothstep(
            uDiscRadius + seamOverlap,
            uDiscRadius + outerWidth + seamOverlap,
            radius
          );
          float halo = innerFade * outerFade;
          float lightSide = smoothstep(-0.75, 0.75, (vHaloUv.x - 0.5) * 2.0);
          halo *= mix(1.0, 0.72 + 0.56 * lightSide, uSunBias);
          float alpha = halo * uIntensity * 0.28;
          gl_FragColor = vec4(uColor * halo * 0.72, alpha);
        }
      `}));Jn.renderOrder=-1,j.add(Jn,Fs);let vo=new I,qa=new I,$a=(H={})=>{let W={...Qe,...H};B.uDayTint.value.set(W.dayTint),B.uNightTint.value.set(W.nightTint),B.uDayIntensity.value=Number(W.dayIntensity),B.uAmbientIntensity.value=Number(W.ambientIntensity),B.uSaturation.value=Number(W.saturation),B.uTextureColorMix.value=Number(W.textureColorMix),B.uTextureSaturation.value=Number(W.textureSaturation),B.uSurfaceExposure.value=Number(W.surfaceExposure),B.uSurfaceGamma.value=Number(W.surfaceGamma),B.uSurfaceContrast.value=Number(W.surfaceContrast),B.uOceanColor.value.set(W.oceanColor),B.uOceanIntensity.value=Number(W.oceanIntensity),B.uRussiaSurfaceBoost.value=Number(W.russiaSurfaceBoost),B.uOutsideSurfaceDim.value=Number(W.outsideSurfaceDim),B.uRussiaMaskFeather.value=Number(W.russiaMaskFeather),B.uTerminatorSoftness.value=Number(W.terminatorSoftness),B.uSpecularIntensity.value=Number(W.specularIntensity),B.uNormalStrength.value=Number(W.normalStrength),B.uCloudHighlights.value=Number(W.cloudHighlights);let ie=Ne.clamp(Number(W.cloudBlackPoint),0,.999),Me=Ne.clamp(Math.max(Number(W.cloudWhitePoint),ie+.001),.001,1);B.uCloudBlackPoint.value=ie,B.uCloudWhitePoint.value=Me,B.uCloudShadowIntensity.value=Number(W.cloudShadowIntensity),ue.uColor.value.set(W.cloudColor),ue.uIntensity.value=Number(W.cloudIntensity),ue.uOpacity.value=Number(W.cloudOpacity),ue.uBlackPoint.value=ie,ue.uWhitePoint.value=Me,te.scale.setScalar((nn+Number(W.cloudAltitude))/nn),B.uHazeColor.value.set(W.hazeColor),B.uHazeIntensity.value=Number(W.hazeIntensity),B.uHazePower.value=Number(W.hazePower);let we=Ne.clamp(Number(W.cityLightsBlackPoint),0,.999),He=Ne.clamp(Math.max(Number(W.cityLightsWhitePoint),we+.001),.001,1),_e=Ne.clamp(Number(W.cityLightsLimbStart),0,.999),Fe=Ne.clamp(Math.max(Number(W.cityLightsLimbEnd),_e+.001),.001,1);B.uCityColor.value.set(W.cityLightsColor),B.uCityHotColor.value.set(W.cityLightsHotColor),B.uCityIntensity.value=Number(W.cityLightsIntensity),B.uCityHotIntensity.value=Number(W.cityLightsHotIntensity),B.uCityCoreStart.value=Number(W.cityLightsCoreStart),B.uCityDayVisibility.value=Number(W.cityLightsDayVisibility),B.uCityBlackPoint.value=we,B.uCityWhitePoint.value=He,B.uCityGamma.value=Number(W.cityLightsGamma),B.uCityHotPoint.value=Number(W.cityLightsHotPoint),B.uCityLimbStart.value=_e,B.uCityLimbEnd.value=Fe,$.uIntensity.value=Number(W.cityLightsGlowIntensity),$.uDayVisibility.value=Number(W.cityLightsDayVisibility),$.uTerminatorSoftness.value=Number(W.terminatorSoftness),$.uBlackPoint.value=we,$.uWhitePoint.value=He,$.uGamma.value=Number(W.cityLightsGamma),$.uGlowStart.value=Number(W.cityLightsGlowStart),$.uHotPoint.value=Number(W.cityLightsHotPoint),$.uLimbStart.value=_e,$.uLimbEnd.value=Fe;let Je=Number(W.borderIntensity),ot=Number(W.borderGlowIntensity),Kt=Number(W.borderCoreWidth),Pt=Number(W.cityLightsGlowIntensity),Qt=Number(W.emissiveBloomRadius),Ei=Number(W.emissiveBloomStrength);ls!==W.emissiveBloomQuality&&(Us=!0),ls=W.emissiveBloomQuality;let zi=ls!=="off"&&Qt>.001&&Ei>.001,gf=zi&&Je>.001&&ot>.001,xf=zi&&Pt>.001;Xe.set(W.borderColor),Re.color.copy(Xe).lerp(Ee,.94).multiplyScalar(Number(W.borderCoreIntensity)),Re.linewidth=Kt,Re.opacity=Math.min(1,Je),De.linewidth=Math.max(2.5,Kt+1),De.color.copy(Xe).lerp(Ee,.55).multiplyScalar(Math.min(2,Je*ot)),Ue.visible=gf,de.visible=xf,Ot.strength=1,Ot.radius=Ne.clamp(Qt/64,0,1),zn.uOpacity.value=Ei,yo=gf||xf,cs.uColor.value.set(W.atmosphereColor),cs.uIntensity.value=Number(W.atmosphereIntensity),cs.uPower.value=Number(W.atmospherePower),Fi.uIntensity.value=Number(W.atmosphereIntensity),Fi.uInnerFeather.value=Number(W.atmosphereInnerFeather),Fi.uOuterFeather.value=Number(W.atmosphereOuterFeather),Fi.uSunBias.value=Number(W.atmosphereSunBias)};$a(f);let ur=BM();j.add(ur);let Oi=new Xt,_o=new Xt,S=new Xt,K=new Xt,re=RM(),ne=new Zi;ne.add(_o,K,Oi,S,re.group);let se=new Zi,Oe=new Ut({colorWrite:!1,depthTest:!0,depthWrite:!0}),Ve=new ft(U.geometry,Oe);if(Ve.rotation.copy(U.rotation),se.add(Ve),e){for(let H of[U,te,Ce,ct,de,Ue,Fs,Jn,ur,Ve])H.visible=!1;$e.scene=ne}let Pe=new Map,ze=new nu,je=null,ut=-1,pt=(H=[])=>{let W=new Set(H.map(ie=>String(ie.id)));for(let[ie,Me]of Pe)W.has(ie)||(K.remove(Me),ro(Me),Pe.delete(ie));for(let ie of H){let Me=String(ie.id),we=Pe.get(Me);we||(we=yg(),Pe.set(Me,we),K.add(we));let He=LM(ie);we.position.copy(He.anchorPosition),we.quaternion.setFromUnitVectors(new I(0,0,1),He.surfaceNormal),vg(we,ie.status,ie.active),Rd(we,ze.bases,ze.waves)}},Ge=!1,bt=!1,Et=new Map,kt="",Rt=(H={})=>{let W=JSON.stringify([H,Ge,bt,zs,Object.values(H).map(_d),cn["endpoint:A"].size,cn["endpoint:B"].size]);if(W!==kt){kt=W;for(let ie of Et.values())ie.userData.removing=!0,ie.userData.targetPresence=0;Et.clear();for(let[ie,Me]of Object.entries(H)){let we=_d(Me),He=Eg(S,ve(we,!0),Me.latitude,Me.longitude,Me.size??(cn[`endpoint:${ie}`]||cn["endpoint:A"]).size,m);He.userData.signalRadius=Me.signalRadius??yu(Me,cn[`endpoint:${ie}`]?`endpoint:${ie}`:"endpoint:A"),He.userData.connectionId=`endpoint:${ie}`,He.userData.appearanceType=cn[`endpoint:${ie}`]?`endpoint:${ie}`:"endpoint:A",He.userData.baseSize=He.scale.x,He.userData.baseSignalRadius=He.userData.signalRadius,Mg(He,Ge&&!bt),Et.set(ie,He)}}};Rt(o);let $t=[],We=()=>{let H=new Set;for(let W of[Oi,S])W.traverse(ie=>{ie.geometry&&H.add(ie.geometry)});for(let[W,ie]of z)Be.has(W)||W.startsWith("./icons/")||H.has(ie)||(ie.dispose(),z.delete(W))},Bt=new Map,mt=new Map,Yt=a,Wt=!1,hn=null,st=null,Mt=!1,Vt=null,Kn=()=>{$t.length=0;for(let H of Bt.values())H.userData.removing||$t.push(...Wt?H.userData.surfaceHitTargets:H.userData.hitTargets)},Dt=(H,W)=>{let ie=new Set(H.map(Me=>Me.id));for(let[Me,we]of Bt)ie.has(Me)||(st?.id===Me&&(st=null,re.group.visible=!1),we.userData.removing=!0,we.userData.targetPresence=0);for(let Me of H){let we=Bt.get(Me.id);if(we&&we.userData.isOrbital!==_i(Me.type)&&(Oi.remove(we),ro(we),we=null),!we){let _e=Ds[Me.type];we=mg(Me,W.states[Me.id],ve(_e.icon),m),Bt.set(Me.id,we),Oi.add(we)}gg(we,Ge,bt),Wt&&we.userData.altitudeHandle&&(we.userData.altitudeHandle.group.visible=!1),we.userData.icon.geometry=ve(Ds[Me.type].icon),we.userData.removing=!1,we.userData.targetPresence=1;let He=we.userData.placement;Object.assign(He,Me),He.placementBlocked=Me.placementBlocked||null,He.group=we,st?.id!==Me.id&&(He.preview=null,oo(we,Me)),we.userData.targetVisual=Ig(Me.placementBlocked?"wrong":W.states[Me.id]),xg(we,Wt&&Me.id===hn)}Kn()},Mi=(H,W,ie={})=>{let Me=new Set,we=He=>typeof He=="string"&&He.startsWith("endpoint:")?Et.get(He.slice(9)):Bt.get(He);for(let[He,_e]of W.links.entries()){if(!we(_e.a)||!we(_e.b))continue;let Fe=FM(_e.a,_e.b);Me.add(Fe);let Je=fg(W.states[_e.a],W.states[_e.b],_e.closing===!0&&_e.correct===!0),ot=mt.get(Fe);ot||(ot=Sg(Je,He,x),_o.add(ot.group),mt.set(Fe,ot)),ot.firstId=_e.a,ot.secondId=_e.b,ot.screen=_e.screen===!0,ot.surface=_e.surface===!0&&!ot.screen;for(let Kt of ot.strandMaterials)Kt.depthTest=!ot.screen;ot.particleMaterial.depthTest=!ot.screen,ot.offset=He*.23,ot.targetColor.set(Je),ot.removing=!1}for(let[He,_e]of mt)Me.has(He)||(_e.removing=!0)},Bi=(H,W,ie={})=>{Dt(H,W),Mi(H,W,ie)};Bi(i,s,o);let ci=new ua,Lu=new xe,xt=null,Nt=null,Os=!1,hr=(H,W)=>{let ie=D.domElement.getBoundingClientRect();return Lu.x=(H-ie.left)/ie.width*2-1,Lu.y=-((W-ie.top)/ie.height)*2+1,ci.setFromCamera(Lu,G),ie},bo=(H,W,ie,Me=null,we=null)=>{let He=hr(H,W);if(H<He.left||H>He.right||W<He.top||W>He.bottom)return null;if(e){let ot=ci.ray.intersectPlane(new ei(new I(0,0,1),0),new I);if(!ot)return null;let Kt=(H-He.left)/He.width*1920,Pt=(W-He.top)/He.height*1080,Qt={latitude:ot.y/.03,longitude:ot.x/.03,altitude:_u};return t?t(Qt,ie)?Qt:null:Kt<400||Kt>1625||Pt<190||Pt>840?null:Qt}let _e=_i(ie)?we??sr(ie).defaultAltitude:_u,Fe=_i(ie)&&Me?ao(Me):null,Je=Od(ci.ray,nn+_e,Fe);return Je?pg(Je.clone().applyQuaternion(ug),_e):null},a0=(H,W,ie)=>{let Me=D.domElement.getBoundingClientRect(),we=Me.width*rg,He=Me.height*rg,_e=Ne.clamp(H,Me.left+we,Me.right-we),Fe=Ne.clamp(W,Me.top+He,Me.bottom-He);hr(_e,Fe);let Je=Ne.clamp(Number(ie.dragStartGeo?.altitude??ie.altitude??ss),sr(ie.type).minAltitude,sr(ie.type).maxAltitude),ot=ie.preview||ie.dragStartGeo||ie,Kt=ao(ot),Pt=TM(ci.ray,nn+Je,G.position,Kt);return Pt?pg(Pt.clone().applyQuaternion(ug),Je):Ug(Kt,G.position)?ot:null},l0=(H,W)=>{let ie=D.domElement.getBoundingClientRect(),Me=W.dragStartGeo||W;return{latitude:Me.latitude,longitude:Me.longitude,altitude:EM(Me.altitude??ss,W.dragStartPointer?.y??H,H,ie.height,sr(W.type))}},dr=(H,W=!1)=>{if(!(!W&&Vt===H)){Vt=H;for(let ie of Bt.values()){let Me=ie.userData.altitudeHandle,we=H?.userData.placement?.group===ie||st?.group===ie||Wt&&ie.userData.placement.id===hn;ie.userData.targetInteraction=we?1:0,xg(ie,Wt&&ie.userData.placement.id===hn),Me&&Fg(Me,H===Me.hitTarget||st?.dragMode==="altitude"&&st.group===ie)}D.domElement.style.cursor=Wt?H?"pointer":Yt||hn!=null?"crosshair":"default":H?H.userData.dragMode==="altitude"?"ns-resize":"grab":Yt?"crosshair":"default"}},Jd=H=>{if(H.isPrimary===!1){Nt&&(Nt.multitouch=!0);return}if(Nt){H.pointerId!==Nt.pointerId&&(Nt.multitouch=!0);return}if(H.button!==0||E&&(H.altKey||H.shiftKey))return;let W=hr(H.clientX,H.clientY),ie=ci.intersectObjects($t,!1)[0];if(Nt={x:H.clientX,y:H.clientY,pointerId:H.pointerId,item:Yt},Os=!1,Wt){Nt.slopPx=8*(["touch","pen"].includes(H.pointerType)?2:1),Nt.swiped=!1,xt.tapGesture=Nt,Nt.selectedPlacementId=hn,Nt.hitId=ie?.object.userData.placement.id??null,D.domElement.setPointerCapture?.(H.pointerId);return}if(!ie)return;st=ie.object.userData.placement,st.dragMode=ie.object.userData.dragMode||"surface",st.preview=null,st.dragStartGeo={latitude:st.latitude,longitude:st.longitude,altitude:st.altitude??ss},st.dragOriginGeo={...st.dragStartGeo},st.dragStartPointer={x:H.clientX,y:H.clientY};let Me=st.group.position.clone().project(G),we=W.left+(Me.x+1)*.5*W.width,He=W.top+(1-Me.y)*.5*W.height;st.grabOffset={x:H.clientX-we,y:H.clientY-He},_i(st.type)&&!Ge&&(re.group.visible=!0,Cd(re,st.group.position)),dr(ie.object),xt.enabled=!1,D.domElement.setPointerCapture?.(H.pointerId),H.stopImmediatePropagation(),H.preventDefault()},Kd=(H,W)=>{let ie=D.domElement.getBoundingClientRect();if(H.clientX<ie.left||H.clientX>ie.right||H.clientY<ie.top||H.clientY>ie.bottom)return null;let Me=MM(H.clientX,H.clientY,W.grabOffset);return _i(W.type)?W.dragMode==="altitude"&&!Ge?l0(H.clientY,W):a0(Me.x,Me.y,W):bo(Me.x,Me.y,W.type,W.preview||W)},Qd=H=>{if(!Nt){hr(H.clientX,H.clientY),dr(ci.intersectObjects($t,!1)[0]?.object||null);return}if(H.pointerId!==Nt.pointerId||(Os||(Os=Math.hypot(H.clientX-Nt.x,H.clientY-Nt.y)>(Nt.slopPx??8)),Wt&&(Nt.swiped=Os),!st))return;let W=Kd(H,st);st.placementBlocked=W?k(st.type,W):"outside",D.domElement.style.cursor=st.placementBlocked?"not-allowed":"grabbing",W&&(st.preview=W,Mt=!0,oo(st.group,W),_i(st.type)&&!Ge&&Cd(re,st.group.position),H.stopImmediatePropagation())},ja=(H,W=!1)=>{if(!Nt||H.pointerId!==Nt.pointerId)return;if(Wt){let we=Nt;if(Nt=null,D.domElement.hasPointerCapture?.(H.pointerId)&&D.domElement.releasePointerCapture(H.pointerId),!Uu(we,H,{moved:Os,cancelled:W,rect:D.domElement.getBoundingClientRect()})||document.elementFromPoint(H.clientX,H.clientY)!==D.domElement||we.item!==Yt||we.selectedPlacementId!==hn)return;hr(H.clientX,H.clientY);let He=ci.intersectObjects($t,!1)[0]?.object.userData.placement.id??null;if(He!==we.hitId)return;if(He!=null){C?.(He);return}let _e=hn==null?null:Bt.get(hn)?.userData.placement,Fe=_e?.type||Yt;if(!Fe)return;let Je=bo(H.clientX,H.clientY,Fe,null,_e?.altitude??null);if(!Je)return;_e?N(_e.id,Je):A(Fe,Je);return}let ie=st,Me=!W&&ie&&(Os||ie.preview)?Kd(H,ie):null;if(Mt=!1,st=null,D.domElement.hasPointerCapture?.(H.pointerId)&&D.domElement.releasePointerCapture(H.pointerId),xt&&(xt.enabled=!e),ie)oo(ie.group,ie.dragOriginGeo),ie.preview=null,ie.placementBlocked=null,ie.group.userData.icon.material.color.setHex(16777215),Me?N(ie.id,Me):w?.(ie.id);else if(vf(Nt,H,{moved:Os,cancelled:W,item:Yt,rect:D.domElement.getBoundingClientRect()})&&document.elementFromPoint(H.clientX,H.clientY)===D.domElement){let we=bo(H.clientX,H.clientY,Yt);we&&A(Yt,we)}Nt=null,re.group.visible=!1,ie&&(ie.dragMode=null,ie.dragStartGeo=null,ie.dragStartPointer=null,ie.dragOriginGeo=null),dr(null)},ef=H=>ja(H),tf=H=>ja(H,!0),nf=()=>{Nt||dr(null)},sf=H=>{if(Ge||!st||!_i(st.type)||st.dragMode==="altitude")return;let W=st.preview||st.dragStartGeo||st,ie=Ne.clamp((W.altitude??ss)-H.deltaY*.0015,sr(st.type).minAltitude,sr(st.type).maxAltitude),Me={latitude:W.latitude,longitude:W.longitude,altitude:ie};st.dragStartGeo.altitude=ie,st.preview=Me,Mt=!0,oo(st.group,Me),Cd(re,st.group.position),H.preventDefault()},rf=H=>{if(Wt)return;hr(H.clientX,H.clientY);let W=ci.intersectObjects($t,!1)[0];W&&T(W.object.userData.placement.id)};D.domElement.addEventListener("pointerdown",Jd),D.domElement.addEventListener("pointermove",Qd),D.domElement.addEventListener("pointerup",ef),D.domElement.addEventListener("pointercancel",tf),D.domElement.addEventListener("pointerleave",nf),D.domElement.addEventListener("wheel",sf,{passive:!1}),D.domElement.addEventListener("dblclick",rf);let of=new I().fromArray(bu.target);h?.target?.length===3&&of.fromArray(h.target);let fr=Ag(g);xt=new Id(G,D.domElement,of,{west:fr.west,east:fr.east,north:fr.north,south:fr.south,centerRussia:fr.centerRussia,verticalCenteringPx:fr.verticalCenteringPx,freeOrbit:E,preciseOrbit:v,minRadius:4,maxRadius:14},p,ee,M),h&&xt.setViewState(E?{...h,exact:!0}:h,!0),e&&(xt.enabled=!1);let pr=new tu(e?0:nn),So=new xe,af=null,lf=[],Ya=new Js,Mo=0,cf=0,uf=!1,hf=()=>{if(cf=requestAnimationFrame(hf),uf)return;Ya.update();let H=Math.min(Ya.getDelta(),.05);Mo+=H,Mt&&st?.preview&&_&&(Mt=!1,_(st.id,st.preview)),e||xt.update(H),c0(performance.now()),Bs(),V?.(),Jn.quaternion.copy(G.quaternion),ur.rotation.y+=H*.0035,ur.rotation.x=Math.sin(Mo*.035)*.008;let W=[];for(let _e of Oi.children){let{billboard:Fe,material:Je,icon:ot,altitudeHandle:Kt,visual:Pt,targetVisual:Qt}=_e.userData;Fe.quaternion.copy(G.quaternion),wg(_e,_e.userData.screenConnections&&pr.snapshot.nodes[_e.userData.placement.id]?.eligible,G.quaternion),_e.userData.presence=Ne.damp(_e.userData.presence,_e.userData.targetPresence,Ni,H),_e.userData.interaction=Ne.damp(_e.userData.interaction,_e.userData.targetInteraction,Ni*1.35,H),Pt.signal=Ne.damp(Pt.signal,Qt.signal,Ni,H),Pt.linked=Ne.damp(Pt.linked,Qt.linked,Ni,H),Pt.wrong=Ne.damp(Pt.wrong,Qt.wrong,Ni,H),Je.uniforms.uTime.value=Mo,Je.uniforms.uSignal.value=Pt.signal,Je.uniforms.uLinked.value=Pt.linked;let Ei=!!_e.userData.placement.placementBlocked;Je.uniforms.uWrong.value=Ei?1:Pt.wrong,ot.material.color.setHex(Ei?9765119:16777215),Je.uniforms.uPresence.value=_e.userData.presence,ot.material.opacity=_e.userData.presence,Mu(_e.userData.supportMaterials,_e.userData.presence),PM(_e,H,ee.matches);let zi=_e.userData.presence*(1+_e.userData.interaction*.055);Fe.scale.setScalar(zi),Kt&&CM(Kt,H,_e.userData.presence),_e.userData.removing&&_e.userData.presence<.008&&W.push(_e)}for(let _e of Pe.values()){let Fe=_e.userData.broadcastMaterial;_e.userData.broadcastPlate?.visible&&Fe&&(Fe.uniforms.uTime.value=ee.matches?0:Mo)}for(let _e of W)Oi.remove(_e),Bt.delete(_e.userData.placement.id),ro(_e);let ie=[];for(let _e of S.children)_e.userData.billboard.quaternion.copy(G.quaternion),wg(_e,xt.screenConnections&&!bt&&pr.snapshot.nodes[_e.userData.connectionId]?.eligible,G.quaternion),_e.userData.presence=Ne.damp(_e.userData.presence,_e.userData.targetPresence,Ni,H),Mu(_e.userData.visualMaterials,_e.userData.presence),_e.userData.removing&&_e.userData.presence<.008&&ie.push(_e);for(let _e of ie)S.remove(_e),ro(_e);(W.length||ie.length)&&We();let Me=[],we=1-Math.exp(-Ni*H);for(let[_e,Fe]of mt){let Je=_g(Fe.firstId,Bt,Et),ot=_g(Fe.secondId,Bt,Et);(!Je||!ot)&&(Fe.removing=!0),Fe.opacity=Ne.damp(Fe.opacity,Fe.removing?0:1,Ni,H),Je&&ot&&(bg(Je.position,Je.userData.stemHeight||0,G.quaternion,Fe.startAnchor),bg(ot.position,ot.userData.stemHeight||0,G.quaternion,Fe.endAnchor),NM(Fe,Je.position,ot.position,G,ee.matches?0:Mo));for(let Kt=0;Kt<Fe.strandMaterials.length;Kt+=1){let Pt=Fe.strandMaterials[Kt];Pt.opacity=Fe.opacity*(Kt===Fe.centerStrand?.64:.34),Pt.color.lerp(Fe.targetColor,we)}Fe.particleMaterial.uniforms.uOpacity.value=Fe.opacity*.96,Fe.particleMaterial.uniforms.uColor.value.lerp(Fe.targetColor,we),Fe.removing&&Fe.opacity<.005&&Me.push(_e)}for(let _e of Me){let Fe=mt.get(_e);_o.remove(Fe.group),ro(Fe.group),mt.delete(_e)}ze.update(H*1e3,Oi.children.length===0&&S.children.length===0&&mt.size===0,ee.matches);for(let _e of Pe.values())Rd(_e,ze.bases,ze.waves);ut!==ze.bases&&(ut=ze.bases,je?.(ze.bases)),Jn.quaternion.copy(G.quaternion),G.getWorldDirection(vo);let He=qa.copy(Jn.position).sub(G.position).dot(vo);if(Fi.uDiscRadius.value=dM(G.position.distanceTo(Jn.position),nn,nn*1.4,He),Us){D.getDrawingBufferSize(un);let _e=ag(un.x,un.y,ls);_t.setSize(_e.width,_e.height),Us=!1}Du(H)},Du=(H=0)=>{yo&&_t.render(H),D.setRenderTarget(Ln),D.clear(),D.render(j,G);let W=D.autoClear;D.autoClear=!1,yo&&D.render(go,xo),D.setRenderTarget(null),cr.render(D,null,Ln,H,!1),D.clearDepth(),D.render(se,G),D.render(ne,G),D.autoClear=W},Nu=()=>{let H=Math.max(1,n.clientWidth),W=Math.max(1,n.clientHeight),ie=D.domElement.getBoundingClientRect(),Me=hM(H,W,ie.width,ie.height,window.devicePixelRatio||1,d);D.setDrawingBufferSize(H,W,Me),D.getDrawingBufferSize(un);let we=ag(un.x,un.y,ls);_t.setSize(we.width,we.height),Us=!1,Ln.samples=lg(un.x,un.y,D.capabilities.maxSamples),Ln.setSize(un.x,un.y),G.aspect=H/W,Z=0,Bs()},Bs=()=>{if(e){G.position.set(0,0,9),G.lookAt(0,0,0),G.fov=25,G.aspect=Math.max(1,n.clientWidth)/Math.max(1,n.clientHeight),G.clearViewOffset(),G.zoom=1,G.updateProjectionMatrix(),G.updateMatrixWorld(!0);return}let H=Math.max(1,n.clientWidth),W=Math.max(1,n.clientHeight),ie=-X.current.x,Me=xt?.centerRussia?fM(xt?.pitch-xt?.pitchCenter,xt.limits.south,xt.limits.north,xt.verticalCenteringPx):0,we=X.current.y+Me,He=1;if(Y&&Et.size){G.updateMatrixWorld(!0);let Fe=1/0,Je=-1/0;for(let ot of Et.values())pM(ot.position,ot.scale.y,G,W,dt),Fe=Math.min(Fe,dt.top),Je=Math.max(Je,dt.bottom);mM(Fe,Je,Y.top*W,Y.bottom*W,W,we,it),we=it.offset,He=it.zoom}if(me&&ae.length){G.updateMatrixWorld(!0);let Fe=W/(2*Math.tan(Ne.degToRad(G.fov)/2));for(let Je of ae){Se.copy(Je.position).applyMatrix4(G.matrixWorldInverse);let ot=Math.max(G.near,-Se.z),Kt=H/2+Fe*Se.x/ot,Pt=W/2-Fe*Se.y/ot;Je.card.left=Je.card.right=Kt,Je.card.top=Je.card.bottom=Pt;let Qt=.12,Ei=Math.max(G.near,ot-Qt),zi=ot+Qt;Je.base.left=H/2+Math.min(Fe*(Se.x-Qt)/Ei,Fe*(Se.x-Qt)/zi),Je.base.right=H/2+Math.max(Fe*(Se.x+Qt)/Ei,Fe*(Se.x+Qt)/zi),Je.base.top=W/2-Math.max(Fe*(Se.y+Qt)/Ei,Fe*(Se.y+Qt)/zi),Je.base.bottom=W/2-Math.min(Fe*(Se.y-Qt)/Ei,Fe*(Se.y-Qt)/zi)}yf(Te,me,H,W,X.current.x,we,lt),ie=-lt.x,we=lt.y,He=lt.zoom}let _e=-we;Math.abs(He-he)<1e-6&&H===Z&&W===O&&Math.abs(ie-F)<.01&&Math.abs(_e-P)<.01||(he=He,G.zoom=He,Z=H,O=W,F=ie,P=_e,Math.abs(ie)<.01&&Math.abs(_e)<.01?G.clearViewOffset():G.setViewOffset(H,W,ie,_e,H,W),G.updateProjectionMatrix())},c0=H=>{if(X.durationMs<=0)return;let W=Ne.clamp((H-X.startedAt)/X.durationMs,0,1),ie=W*W*(3-2*W);X.current.lerpVectors(X.from,X.target,ie),W>=1&&(X.durationMs=0)},df=new ResizeObserver(Nu);df.observe(n),Nu();let ff=!1,pf=()=>{ff||(ff=!0,Ya.update(),hf())};u||pf();let mf=!1,us=new Xt;return{cancelPointer(){Nt&&ja({pointerId:Nt.pointerId},!0)},setServicePaused(H){uf=H,Ya.update()},resize:Nu,start:pf,async prepareGPU(H=()=>{}){if(mf)return;for(let[_e,Fe]of Object.entries(r))us.add(mg({id:`warmup:${_e}`,type:_e,latitude:55,longitude:90,altitude:_i(_e)?ss:_u},"link",ve(Fe.icon),m));for(let _e of pe)Eg(us,ve(_e,!0),55,90,1,m);let W=yg();vg(W,"open",!0),us.add(W,Sg(fg("link","link"),0,x).group),us.traverse(_e=>{_e.visible=!0,_e.frustumCulled=!1}),ne.add(us);let ie=(_e,Fe,Je=null)=>async()=>{D.setRenderTarget(Je),await to(()=>D.compileAsync(_e,Fe),6e4,"Shader preparation"),D.setRenderTarget(null)},Me=[...[...Ae,ye.fill].map(_e=>async()=>{D.initTexture(_e),await au()}),ie(j,G,Ln),ie(et,G,_t.readBuffer),ie(go,xo,Ln),ie(se,G),ie(ne,G),async()=>{D.initRenderTarget(Ln),Du(),ne.remove(us),Du(),await Im(D.getContext())}],we=null,He=D.debug.onShaderError;D.debug.onShaderError=(_e,Fe)=>{we=new Error(`Shader preparation failed: ${_e.getProgramInfoLog(Fe)}`)};try{if(await ou(Me,H,1),we)throw we;mf=!0}finally{D.debug.onShaderError=He,D.setRenderTarget(null),ne.remove(us)}},beginMissionMenuReveal(H,W,ie,Me){ze.begin(H,W,ie),je=Me,ut=0,je?.(0);for(let we of Pe.values())Rd(we,0,0)},missionMenuCardsStarted(){ze.cardsStarted=!0},cancelMissionMenuReveal(){ze.cancel(),je=null},setMissionMarkers(H){pt(H)},setMissionMarkerSafeArea(H,W=[]){me=H,ae=H?W.map(ie=>({position:Pe.get(String(ie.id))?.position,card:{left:0,right:0,top:0,bottom:0,padLeft:ie.width/2+2,padRight:ie.width/2+2,padTop:ie.height+ie.stem+2,padBottom:0},base:{left:0,right:0,top:0,bottom:0,padLeft:0,padRight:0,padTop:0,padBottom:0}})).filter(ie=>ie.position):[],Te=ae.flatMap(ie=>[ie.card,ie.base]),Bs()},pickGeo(H,W){return bo(H,W,"editor-anchor")},projectDrop(H,W,ie){return bo(H,W,ie)},setTapControls({enabled:H,selectedId:W=null}){Wt!==H&&(Nt&&ja({pointerId:Nt.pointerId},!0),xt.pointerId!==null&&xt.onPointerUp({pointerId:xt.pointerId}),xt.velocityYaw=xt.velocityPitch=xt.velocityRoll=0,Wt=H,xt.enabled=!e),hn=H?W:null,Kn();for(let ie of Bt.values()){let Me=ie.userData.altitudeHandle;Me&&(Me.group.visible=!Wt&&!Ge)}dr(Vt,!0)},setCameraDistance(H,W=!1){e||xt.setRadius(H,W)},setEndpointSafeArea(H){Y=H,Bs()},setPresentationOffset(H,W,ie=0,Me=!1){X.from.copy(X.current),X.target.set(Number(H)||0,Number(W)||0),X.startedAt=performance.now(),X.durationMs=Me?0:Math.max(0,Number(ie)||0),(Me||X.durationMs===0)&&X.current.copy(X.target),Bs()},projectGeo(H){let W=ao({...H,altitude:H.altitude??ka}),ie=W.clone().normalize(),Me=G.position.clone().sub(W).normalize(),we=W.clone().project(G);return{x:(we.x+1)/2,y:(1-we.y)/2,visible:(e||ie.dot(Me)>0)&&we.z>-1&&we.z<1}},update({placements:H,network:W,selectedItem:ie,endpoints:Me=o}){Yt=ie,Rt(Me),Bi(H,W,Me),We()},setScreenConnections(H,W=!1){bt=!!(H&&W),Ge=!!H,xt.screenConnections=Ge,Ge&&(xt.resetIdleMotion(!0),re.group.visible=!1);for(let ie of Bt.values())gg(ie,Ge,bt);for(let ie of Et.values())Mg(ie,Ge&&!bt);Kn(),dr(null)},captureConnections(H,W,ie,Me,we=!1,He=0){D.getSize(So),He>0&&So.multiplyScalar(He/So.x);let _e=we||!!st||!e&&(xt.pointerId!==null||!!xt.viewTransition||Math.abs(xt.velocityYaw)+Math.abs(xt.velocityPitch)+Math.abs(xt.velocityRoll)>1e-4||Math.abs(xt.yaw-xt.targetYaw)+Math.abs(xt.pitch-xt.targetPitch)>1e-4);pr.begin(G,So.x,So.y,ie,H.mission,H.placements,Me,_e,document.hidden),af!==W.endpoints&&(af=W.endpoints,lf=Object.entries(W.endpoints).map(([Fe,Je])=>{let ot=`endpoint:${Fe}`;return[Fe,Je,ot,cn[ot]?ot:"endpoint:A"]}));for(let[Fe,Je,ot,Kt]of lf){let Pt=Et.get(Fe);!Pt||Pt.userData.removing||pr.add(ot,Pt.position,Pt.userData.stemHeight,Pt.userData.signalRadius,.084*Pt.scale.x)}for(let Fe of H.placements){let Je=Bt.get(Fe.id);!Je||Je.userData.removing||pr.add(Fe.id,Je.position,Je.userData.stemHeight,Je.userData.signalRadius,.127*Je.scale.x,Fe.placementBlocked)}return pr.finish()},getViewState(){return xt.getViewState()},setViewState(H,W=!1,ie=0){e?Bs():xt.setViewState(H,W||ee.matches,ie)},setEarthOrbitPreferences(H){e||xt.setEarthOrbitPreferences(H),Bs()},setEarthStyle(H){return $a(H),be.select(H.russiaContour??Qe.russiaContour)},getEarthContourId(){return be.activeId},dispose(){ro(us),cancelAnimationFrame(cf),je=null,ze.cancel(),df.disconnect(),xt.dispose(),D.domElement.removeEventListener("pointerdown",Jd),D.domElement.removeEventListener("pointermove",Qd),D.domElement.removeEventListener("pointerup",ef),D.domElement.removeEventListener("pointercancel",tf),D.domElement.removeEventListener("pointerleave",nf),D.domElement.removeEventListener("wheel",sf),D.domElement.removeEventListener("dblclick",rf);for(let H of[j,ne])H.traverse(W=>{W.geometry?.userData?.shared||W.geometry?.dispose?.(),Array.isArray(W.material)?W.material.forEach(ie=>ie.dispose()):W.material?.dispose?.()});Q.dispose(),b.dispose(),qe.dispose(),Ke.dispose(),R.dispose(),be.dispose(),Ot.dispose(),_t.dispose(),Ln.dispose(),cr.dispose(),De.dispose(),Le.dispose(),rt.dispose(),Oe.dispose(),Hn.dispose(),Xa.dispose();for(let H of z.values())H.dispose();D.dispose()}}}catch(ee){throw D.dispose(),D.forceContextLoss(),D.domElement.remove(),ee}}function SM({latitude:n,longitude:e,altitude:t=_u}){let i=Ne.degToRad(n),s=Ne.degToRad(e),r=nn+t;return new I(r*Math.cos(i)*Math.sin(s),r*Math.sin(i),r*Math.cos(i)*Math.cos(s))}function pg(n,e){let t=n.clone().normalize();return{latitude:Ne.radToDeg(Math.asin(t.y)),longitude:Ne.radToDeg(Math.atan2(t.x,t.z)),altitude:e}}function ao(n){return Jt?new I(n.longitude*.03,n.latitude*.03,0):SM(n).applyQuaternion(Pg)}function Ld(n,e=0){let t=(s,r)=>{let o=new r,a=s*.32;return o.moveTo(-s+a,-s),o.lineTo(s-a,-s),o.quadraticCurveTo(s,-s,s,-s+a),o.lineTo(s,s-a),o.quadraticCurveTo(s,s,s-a,s),o.lineTo(-s+a,s),o.quadraticCurveTo(-s,s,-s,s-a),o.lineTo(-s,-s+a),o.quadraticCurveTo(-s,-s,-s+a,-s),o.closePath(),o},i=t(n,_s);return e&&i.holes.push(t(n-e,ri)),new Ys(i,8)}function mg(n,e,t,i=Nd){let s=new Xt,r=Ig(e),o=yu(n),a=cn[n.type].size,c=Math.max(o/a,.19)/.49,l=.127/c,u=Fd(n.type),h=_i(n.type),d=new St({uniforms:{uTime:{value:0},uSignal:{value:r.signal},uLinked:{value:r.linked},uWrong:{value:r.wrong},uPresence:{value:0},uSelection:{value:0},uRounded:{value:Jt?1:0},uCoreRadius:{value:l},uAuraWidth:{value:.06/c},uWaveStart:{value:Math.min(.42,l+.05/c)},uWaveEnd:{value:o/a/c}},vertexShader:Su,fragmentShader:Dg,transparent:!0,depthWrite:!1,depthTest:h,blending:mn}),f=new Xt,m=new ft(new Cn(1,1),d);m.scale.set(c,c,1),m.position.y=u,m.renderOrder=9;let x=new ft(new Cn(1,1),new St({uniforms:d.uniforms,vertexShader:Su,fragmentShader:`
      uniform float uCoreRadius;
      uniform float uAuraWidth;
      uniform float uPresence;
      uniform float uSelection;
      varying vec2 vUv;
      ${Ud}
      ${Lg}
      void main() {
        float distanceToCenter = nodeCoreDistance(vUv, uCoreRadius);
        float edge = max(fwidth(distanceToCenter) * 1.35, 0.00075);
        float border = 1.0 - smoothstep(0.006 - edge, 0.006 + edge, abs(distanceToCenter - (uCoreRadius + 0.002)));
        float halo = exp(-pow((distanceToCenter - (uCoreRadius + 0.002)) / uAuraWidth, 2.0));
        float alpha = max(border, halo * 0.35) * uPresence * uSelection;
        gl_FragColor = vec4(selectionColor, alpha);
      }
    `,transparent:!0,depthWrite:!1,depthTest:h,blending:ti,toneMapped:!1}));x.position.z=.001,x.renderOrder=11,x.visible=!1,m.add(x);let g=new Ut({color:i.color,transparent:!0,opacity:i.opacity,depthWrite:!1,depthTest:h,side:Ft,toneMapped:!1});g.userData.baseOpacity=i.opacity;let p=new ft(Jt?Ld(i.radius):new ts(i.radius,64),g);p.position.set(0,u,.008),p.renderOrder=8;let M=new ft(t,new Ut({color:16777215,transparent:!0,opacity:0,depthWrite:!1,depthTest:h,side:Ft,toneMapped:!1}));M.position.y=u,M.position.z=.015,M.renderOrder=10,f.add(p,m,M);let E=h&&!Jt?AM():null;E&&f.add(E.group),s.add(f);let v=u>0?Bd({includeMoveIndicator:!0}):null;v&&s.add(v.group);let A=u>0?Og(u):null;A&&f.add(A.group);let C=new ft(new Cn(.4,.4),new Ut({transparent:!0,opacity:0,depthWrite:!1,depthTest:!1,side:Ft}));C.position.y=u,C.position.z=.02,f.add(C);let N={...n,group:s,preview:null,grabOffset:{x:0,y:0}},_=[C,...v?.hitTargets||[],...A?.hitTargets||[]];for(let k of _)k.userData.placement=N,k.userData.dragMode="surface";E&&(E.hitTarget.userData.placement=N,E.hitTarget.userData.dragMode="altitude");let w=[..._,...E?[E.hitTarget]:[]],V=[g,...v?.group.userData.visualMaterials||[],...A?.visualMaterials||[]];return s.userData={isOrbital:h,billboard:f,plate:m,selectionOutline:x,iconBackdrop:p,anchor:v,altitudeHandle:E,material:d,icon:M,hitTarget:C,hitTargets:w,worldHitTargets:w,surfaceHitTargets:_,supportMaterials:V,placement:N,signalRadius:o,stemHeight:u*a,presence:0,targetPresence:1,interaction:0,targetInteraction:0,selection:0,targetSelection:0,removing:!1,visual:{...r},targetVisual:{...r}},Bg(s),oo(s,n),s}function gg(n,e,t=!1){let i=n.userData;e=!!(e&&(!t||i.isOrbital)),i.screenConnections!==!!e&&(i.screenConnections=!!e,oo(n,i.placement)),i.isOrbital&&(i.altitudeHandle.group.visible=!e,i.hitTargets=e?i.surfaceHitTargets:i.worldHitTargets,e&&Fg(i.altitudeHandle,!1))}function Fd(n){return Jt||_i(n)?0:Eu}function MM(n,e,t={x:0,y:0}){return{x:n-(Number(t.x)||0),y:e-(Number(t.y)||0)}}function EM(n,e,t,i,s={minAltitude:Fa,maxAltitude:Oa}){let r=Math.max(160,i*rM),o=s.maxAltitude-s.minAltitude;return Ne.clamp(n+(e-t)/r*o,s.minAltitude,s.maxAltitude)}function Od(n,e,t=null){let i=wM(n,e);return i.length?!t||i.length===1?i[0]:i.reduce((s,r)=>r.distanceToSquared(t)<s.distanceToSquared(t)?r:s):null}function wM(n,e){let t=-n.origin.dot(n.direction),i=n.origin.lengthSq()-t*t,s=e*e;if(i>s)return[];let r=Math.sqrt(Math.max(0,s-i));return[t-r,t+r].filter(a=>a>=0).map(a=>n.at(a,new I))}function Ug(n,e){let t=n.clone().sub(e),i=t.length(),s=new Ki(e.clone(),t.normalize()),r=Od(s,nn+.01);return!r||e.distanceTo(r)>=i-.01}function TM(n,e,t,i=null){let s=Od(n,e,i);return s&&Ug(s,t)?s:null}function AM(){let n=new Xt;n.position.set(.235,0,.035),n.renderOrder=11;let e=new Ut({color:851994,transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,side:Ft}),t=new ft(new Cn(.13,.25),e);t.renderOrder=10,n.add(t);let i=new Qi({color:49151,transparent:!0,opacity:.78,depthWrite:!1,depthTest:!0,blending:mn}),s=new Tt().setFromPoints([new I(0,-.082,.004),new I(0,.082,.004),new I(-.027,.055,.004),new I(0,.086,.004),new I(0,.086,.004),new I(.027,.055,.004),new I(-.027,-.055,.004),new I(0,-.086,.004),new I(0,-.086,.004),new I(.027,-.055,.004)]),r=new Wo(s,i);r.renderOrder=11,n.add(r);let o=new ft(new Cn(.18,.31),new Ut({transparent:!0,opacity:0,depthWrite:!1,depthTest:!1,side:Ft}));return o.position.z=.012,n.add(o),{group:n,hitTarget:o,backgroundMaterial:e,arrowMaterial:i,activity:0,targetActivity:0,idleBackgroundColor:new Ye(851994),activeBackgroundColor:new Ye(851994),idleArrowColor:new Ye(49151),activeArrowColor:new Ye(16777215)}}function Fg(n,e){n.targetActivity=e?1:0}function CM(n,e,t=1){n.activity=Ne.damp(n.activity,n.targetActivity,Ni*1.45,e),n.backgroundMaterial.opacity=Ne.lerp(.58,.9,n.activity)*t,n.backgroundMaterial.color.lerpColors(n.idleBackgroundColor,n.activeBackgroundColor,n.activity),n.arrowMaterial.opacity=Ne.lerp(.78,1,n.activity)*t,n.arrowMaterial.color.lerpColors(n.idleArrowColor,n.activeArrowColor,n.activity),n.group.scale.setScalar(Ne.lerp(1,1.06,n.activity))}function RM(){let n=new Xt;n.visible=!1;let e=new Float32Array(6),t=new Tt;t.setAttribute("position",new en(e,3));let i=new vs(t,new sa({color:49151,transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,dashSize:.06,gapSize:.035,blending:mn}));i.renderOrder=10,n.add(i);let s=new Xt;for(let[o,a]of[[.055,.88],[.09,.52],[.128,.25]]){let c=new ft(new bs(o-.006,o,64),new Ut({color:49151,transparent:!0,opacity:a,depthWrite:!1,depthTest:!0,side:Ft,blending:mn}));c.position.z=.003,c.renderOrder=10,s.add(c)}let r=new ft(new ts(.027,48),new Ut({color:16777215,transparent:!0,opacity:.95,depthWrite:!1,depthTest:!0,side:Ft}));return r.position.z=.006,r.renderOrder=11,s.add(r),n.add(s),{group:n,line:i,footprint:s}}function Cd(n,e){let t=e.clone().normalize(),i=t.clone().multiplyScalar(nn+ka),s=n.line.geometry.attributes.position.array;s.set(i.toArray(),0),s.set(e.toArray(),3),n.line.geometry.attributes.position.needsUpdate=!0,n.line.computeLineDistances(),n.footprint.position.copy(i),n.footprint.quaternion.setFromUnitVectors(new I(0,0,1),t)}function Bd({includeHitTarget:n=!0,includeMoveIndicator:e=!1}={}){let t=new Xt,i=new Xt;t.add(i);let s=[],r={color:16777215,transparent:!0,depthWrite:!1,depthTest:!0,blending:mn,toneMapped:!1};for(let[u,h]of[[.055,.78],[.082,.48],[.11,.25]]){let d=new Ut({...r,opacity:h,side:Ft});d.userData.baseOpacity=h,s.push(d);let f=new ft(new bs(u-.006,u,64),d);f.position.z=.004,f.renderOrder=7,i.add(f)}let o=new Ut({...r,color:16777215,opacity:.96,side:Ft});o.userData.baseOpacity=.96;let a=new ft(new ts(.032,48),o);a.position.z=.008,a.renderOrder=8,i.add(a);let c=null;if(e){let u=[];for(let d=0;d<4;d+=1){let f=d*Math.PI/2,m=new _s;[[-.009,.018],[.009,.018],[.009,.074],[.029,.074],[0,.116],[-.029,.074],[-.009,.074]].forEach(([g,p],M)=>{let E=g*Math.cos(f)-p*Math.sin(f),v=g*Math.sin(f)+p*Math.cos(f);M===0?m.moveTo(E,v):m.lineTo(E,v)}),m.closePath(),u.push(m)}let h=new St({uniforms:{uOpacity:{value:0}},vertexShader:Su,fragmentShader:`
        uniform float uOpacity;
        ${Ud}
        void main() { gl_FragColor = vec4(selectionColor, uOpacity); }
      `,transparent:!0,depthWrite:!1,depthTest:!0,blending:ti,toneMapped:!1,side:Ft});h.userData.baseOpacity=1,c=new ft(new Ys(u),h),c.position.z=.008,c.renderOrder=11,c.visible=!1,t.add(c)}let l=[];if(n){let u=new ft(new ts(.13,24),new Ut({transparent:!0,opacity:0,depthWrite:!1,depthTest:!1,side:Ft}));u.position.z=.012,t.add(u),l.push(u)}return t.userData.statusMaterials=s,t.userData.beaconMaterial=o,t.userData.visualMaterials=[...s,o,...c?[c.material]:[]],{group:t,hitTargets:l,restingBase:i,moveArrows:c}}function xg(n,e){n.userData.targetSelection=e&&!n.userData.removing?1:0}function PM(n,e,t=!1){let i=n.userData,s=i.removing?0:i.targetSelection,r=t?s:Ne.damp(i.selection,s,Ni*1.35,e);Math.abs(r-s)<.001&&(r=s),i.selection=r,i.material.uniforms.uSelection.value=r,i.selectionOutline.visible=r>0;let o=i.anchor;if(!o?.moveArrows)return;o.restingBase.visible=r<1,o.moveArrows.visible=r>0;let a=i.presence;Mu(o.group.userData.statusMaterials,a*(1-r));let c=o.group.userData.beaconMaterial;c.opacity=c.userData.baseOpacity*a*(1-r),o.moveArrows.material.uniforms.uOpacity.value=a*r}function Og(n,e=.125){let t=new Xt,i=new Qi({color:16777215,transparent:!0,opacity:.72,depthWrite:!1,depthTest:!1,blending:mn});i.userData.baseOpacity=.72;let s=new vs(new Tt().setFromPoints([new I(0,.012,.006),new I(0,Math.max(.02,n-e),.006)]),i);s.renderOrder=7,t.add(s);let r=new ft(new Cn(.09,n),new Ut({transparent:!0,opacity:0,depthWrite:!1,depthTest:!1,side:Ft}));return r.position.y=n*.5,r.position.z=.01,t.add(r),{group:t,hitTargets:[r],visualMaterials:[i]}}function Mu(n=[],e=1){for(let t=0;t<n.length;t+=1){let i=n[t];i.opacity=i.userData.baseOpacity*e}}function oo(n,e){let t=e.type||n.userData.placement.type,i=Fu(t,cn[t].size,n.userData.screenConnections),s=Ou(yu(e,t),n.userData.screenConnections),r=Math.max(s/i,.19)/.49;n.scale.setScalar(i),n.userData.stemHeight=Fd(t)*i,n.userData.signalRadius=s,n.userData.plate.scale.set(r,r,1);let o=n.userData.material.uniforms;o.uCoreRadius.value=.127/r,o.uAuraWidth.value=.06/r,o.uWaveStart.value=Math.min(.42,.177/r),o.uWaveEnd.value=s/i/r;let{anchorPosition:a,surfaceNormal:c}=IM(e,t),{anchor:l,billboard:u}=n.userData;n.position.copy(a),u.position.set(0,0,0),l&&l.group.quaternion.setFromUnitVectors(new I(0,0,1),c)}function IM(n,e=n.type){let t=Fd(e),i=ao(t>0?{...n,altitude:ka}:n),s=Jt?new I(0,0,1):i.clone().normalize();return{anchorPosition:i,surfaceNormal:s}}function LM(n){let e=ao({...n,altitude:ka});return{anchorPosition:e,surfaceNormal:Jt?new I(0,0,1):e.clone().normalize()}}function DM({linked:n=!1,depthTest:e=!0}={}){return new St({uniforms:{uTime:{value:0},uSignal:{value:1},uLinked:{value:n?1:0},uWrong:{value:0},uPresence:{value:1},uSelection:{value:0},uRounded:{value:0},uCoreRadius:{value:.07},uAuraWidth:{value:.055},uWaveStart:{value:.14},uWaveEnd:{value:.48}},vertexShader:Su,fragmentShader:Dg,transparent:!0,depthWrite:!1,depthTest:e,blending:mn,toneMapped:!1})}function yg(){let n=Bd({includeHitTarget:!1}).group,e=DM({linked:!1,depthTest:!0}),t=new ft(new Cn(1,1),e);return t.scale.setScalar(.72),t.position.z=.002,t.renderOrder=6,t.visible=!1,n.add(t),n.userData.broadcastMaterial=e,n.userData.broadcastPlate=t,n}function vg(n,e,t=!1){let i=e==="completed"?49151:16777215,s=e==="locked"||e==="completed"?.8:1;n.userData.statusVisibility=s;for(let r of n.userData.statusMaterials)r.color.setHex(i),r.opacity=r.userData.baseOpacity*s;n.userData.beaconMaterial.color.setHex(16777215),n.userData.beaconMaterial.opacity=n.userData.beaconMaterial.userData.baseOpacity*s,n.userData.broadcastPlate.visible=e==="open"&&t===!0}function Rd(n,e,t){n.visible=e>0;let i=e*(n.userData.statusVisibility??1);for(let r of n.userData.statusMaterials)r.opacity=r.userData.baseOpacity*i;let s=n.userData.beaconMaterial;s.opacity=s.userData.baseOpacity*i,n.userData.broadcastMaterial.uniforms.uPresence.value=t}function _g(n,e,t){return typeof n=="string"&&n.startsWith("endpoint:")?t.get(n.slice(9)):e.get(n)}function bg(n,e,t,i=new I){return hg.cameraUp.set(0,1,0).applyQuaternion(t),i.copy(n).addScaledVector(hg.cameraUp,e)}function Sg(n,e,t){let i={strandCount:Math.max(1,Math.round(t.strandCount)),segmentCount:Math.max(8,Math.round(t.segmentCount)),particleCount:Math.max(1,Math.round(t.particleCount)),flowSpeed:Math.max(.01,Number(t.flowSpeed)),waveAmplitude:Math.max(0,Number(t.waveAmplitude)),waveFrequency:Math.max(1,Number(t.waveFrequency)),strandSpacing:Math.max(0,Number(t.strandSpacing??Tg.strandSpacing))},s=new Xt,r=[],o=[],a=[],c=i.segmentCount+1;for(let m=0;m<i.strandCount;m+=1){let x=new Float32Array(c*3),g=Jt?new Is().setPositions(new Float32Array(i.segmentCount*6)):new Tt,p=new en(x,3);p.setUsage($c),Jt||g.setAttribute("position",p);let M=Jt?Ps:Qi,E=new M({...Jt?{worldUnits:!0,linewidth:.006}:{},color:n,transparent:!0,opacity:0,depthWrite:!1,depthTest:!0,blending:mn,toneMapped:!1}),v=Jt?new no(g,E):new vs(g,E);v.frustumCulled=!1,v.renderOrder=6,s.add(v),r.push(E),o.push(p),a.push(Jt?g.attributes.instanceStart.data:null)}let l=new Float32Array(i.particleCount*3),u=new Tt,h=new en(l,3);h.setUsage($c),u.setAttribute("position",h);let d=new St({uniforms:{uColor:{value:new Ye(n)},uOpacity:{value:0}},transparent:!0,depthWrite:!1,depthTest:!0,blending:mn,toneMapped:!1,vertexShader:`
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(34.0 / max(1.0, -viewPosition.z), 4.0, 10.0);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,fragmentShader:`
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float radius = distance(gl_PointCoord, vec2(0.5));
        float edge = max(fwidth(radius) * 1.25, 0.015);
        float alpha = 1.0 - smoothstep(0.34 - edge, 0.5, radius);
        float glow = 1.0 - smoothstep(0.0, 0.5, radius);
        gl_FragColor = vec4(uColor * (0.9 + glow * 0.75), alpha * uOpacity);
      }
    `}),f=new Hr(u,d);return f.frustumCulled=!1,f.renderOrder=7,s.add(f),{group:s,style:i,strandMaterials:r,strandAttributes:o,strandSegments:a,particleMaterial:d,particleAttribute:h,centerStrand:Math.floor(i.strandCount/2),centerPositions:new Float32Array(c*3),normalPositions:new Float32Array(c*3),binormalPositions:new Float32Array(c*3),startAnchor:new I,endAnchor:new I,midpoint:new I,surfaceStart:new I,surfaceEnd:new I,sample:new I,tangent:new I,normal:new I,binormal:new I,viewDirection:new I,targetColor:new Ye(n),offset:e*.23,opacity:0,removing:!1,surface:!1,surfaceAngle:0,surfaceSinAngle:0}}function NM(n,e,t,i,s){let{style:r}=n,o=r.segmentCount;if(n.surfaceStart.copy(e).normalize(),n.surfaceEnd.copy(t).normalize(),n.surfaceAngle=Math.acos(Ne.clamp(n.surfaceStart.dot(n.surfaceEnd),-1,1)),n.surfaceSinAngle=Math.sin(n.surfaceAngle),n.midpoint.copy(n.startAnchor).add(n.endAnchor).multiplyScalar(.5).normalize().multiplyScalar(Math.max(e.length(),t.length())+.34),n.screen){let l=n.sample.copy(n.startAnchor).add(n.endAnchor).multiplyScalar(.5).project(i).z;if(n.startAnchor.project(i),n.startAnchor.z=l,n.startAnchor.unproject(i),n.endAnchor.project(i),n.endAnchor.z=l,n.endAnchor.unproject(i),n.midpoint.copy(n.startAnchor).add(n.endAnchor).multiplyScalar(.5),Jt){n.tangent.copy(n.endAnchor).sub(n.startAnchor);let u=n.tangent.length();n.viewDirection.set(0,0,1).applyQuaternion(i.quaternion),n.normal.crossVectors(n.tangent,n.viewDirection).normalize(),n.midpoint.addScaledVector(n.normal,u*(.16+.035*Math.sin(s*.7+n.offset*6.28)))}}for(let l=0;l<=o;l+=1){let u=l/o;UM(n,u,n.sample);let h=l*3;n.centerPositions[h]=n.sample.x,n.centerPositions[h+1]=n.sample.y,n.centerPositions[h+2]=n.sample.z}for(let l=0;l<=o;l+=1){let u=l*3,h=Math.max(0,l-1)*3,d=Math.min(o,l+1)*3;n.tangent.set(n.centerPositions[d]-n.centerPositions[h],n.centerPositions[d+1]-n.centerPositions[h+1],n.centerPositions[d+2]-n.centerPositions[h+2]).normalize(),n.sample.fromArray(n.centerPositions,u),n.viewDirection.copy(i.position).sub(n.sample).normalize(),n.normal.crossVectors(n.tangent,n.viewDirection).normalize(),n.normal.lengthSq()<1e-6&&n.normal.set(1,0,0).applyQuaternion(i.quaternion),n.binormal.crossVectors(n.tangent,n.normal).normalize(),n.normal.toArray(n.normalPositions,u),n.binormal.toArray(n.binormalPositions,u)}let a=(r.strandCount-1)*.5;for(let l=0;l<r.strandCount;l+=1){let u=n.strandAttributes[l].array,h=(l-a)*r.strandSpacing,d=l*.82+n.offset*Math.PI*2;for(let m=0;m<=o;m+=1){let x=m/o,g=m*3,p=Math.sin(Math.PI*x),M=x*r.waveFrequency*Math.PI*2-s*3.2+d,E=(h+Math.sin(M)*r.waveAmplitude)*p,v=Math.cos(M*.73)*r.waveAmplitude*.24*p;u[g]=n.centerPositions[g]+n.normalPositions[g]*E+n.binormalPositions[g]*v,u[g+1]=n.centerPositions[g+1]+n.normalPositions[g+1]*E+n.binormalPositions[g+1]*v,u[g+2]=n.centerPositions[g+2]+n.normalPositions[g+2]*E+n.binormalPositions[g+2]*v}n.strandAttributes[l].needsUpdate=!0;let f=n.strandSegments[l];if(f){for(let m=0;m<o;m++)for(let x=0;x<3;x++)f.array[m*6+x]=u[m*3+x],f.array[m*6+3+x]=u[(m+1)*3+x];f.needsUpdate=!0}}let c=n.particleAttribute.array;for(let l=0;l<r.particleCount;l+=1){let h=(s*r.flowSpeed+l/r.particleCount+n.offset)%1*o,d=Math.floor(h),f=Math.min(o,d+1),m=h-d,x=d*3,g=f*3,p=l*3,M=n.strandAttributes[l%r.strandCount].array;for(let E=0;E<3;E+=1)c[p+E]=Ne.lerp(M[x+E],M[g+E],m)}n.particleAttribute.needsUpdate=!0}function UM(n,e,t){if(!n.surface){let i=1-e;return t.copy(n.startAnchor).multiplyScalar(i*i).addScaledVector(n.midpoint,2*i*e).addScaledVector(n.endAnchor,e*e)}return n.surfaceAngle<1e-6||Math.abs(n.surfaceSinAngle)<1e-6?t.copy(n.surfaceStart).lerp(n.surfaceEnd,e).normalize().multiplyScalar(nn+og):t.copy(n.surfaceStart).multiplyScalar(Math.sin((1-e)*n.surfaceAngle)/n.surfaceSinAngle).addScaledVector(n.surfaceEnd,Math.sin(e*n.surfaceAngle)/n.surfaceSinAngle).normalize().multiplyScalar(nn+og),e<.16?t.lerp(n.startAnchor,1-Ne.smoothstep(e/.16,0,1)):e>.84&&t.lerp(n.endAnchor,Ne.smoothstep((e-.84)/.16,0,1)),t}function FM(n,e){return n<e?`${n}:${e}`:`${e}:${n}`}function Mg(n,e){let t=n.userData,i=Fu(t.appearanceType,t.baseSize,e);n.scale.setScalar(i),t.stemHeight=(Jt?0:Eu)*i,t.signalRadius=Ou(t.baseSignalRadius,e)}function Eg(n,e,t,i,s=1,r=Nd){let o=new Xt;o.scale.setScalar(s);let a={transparent:!0,depthWrite:!1,depthTest:!0,side:Ft,toneMapped:!1},c=Jt?0:Eu,l=new Xt,u=new ft(Jt?Ld(.084):new ts(.084,96),new Ut({...a,color:r.color,opacity:r.opacity}));u.position.set(0,c,.002),u.renderOrder=8;let h=new ft(Jt?Ld(.084,.005):new bs(.079,.084,96),new Ut({...a,color:49151,opacity:1}));h.position.set(0,c,.004),h.renderOrder=9;let d=new ft(e||new Tt,new Ut({...a,color:16777215,opacity:1}));d.position.set(0,c,.007),d.renderOrder=10,l.add(u,h,d);let f=Jt?null:Og(c,.084);f&&l.add(f.group),o.add(l);let m=Jt?null:Bd({includeHitTarget:!1}),x=ao({latitude:t,longitude:i,altitude:ka}),g=Jt?new I(0,0,1):x.clone().normalize();m&&(m.group.quaternion.setFromUnitVectors(new I(0,0,1),g),o.add(m.group)),o.position.copy(x);let p=[u.material,h.material,d.material,...f?.visualMaterials||[],...m?.group.userData.visualMaterials||[]];for(let M of p)M.userData.baseOpacity=M.opacity;return Mu(p,0),o.userData={billboard:l,stemHeight:c*s,visualMaterials:p,presence:0,targetPresence:1,removing:!1},Bg(o),n.add(o),o}async function OM(n,e,t){let i=await n.loadAsync(e);return Dd(i,t)}function Dd(n,e=.18){let t=[];for(let h of n.paths){let d=h.userData?.style||{};if(d.fill&&d.fill!=="none")for(let f of h.toShapes())t.push(new Ys(f,18));if(d.stroke&&d.stroke!=="none")for(let f of h.subPaths){let m=Da.pointsToStroke(f.getPoints(24),d,12,1e-4);m&&t.push(m)}}if(!t.length)throw new Error("SVG \u043D\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0435\u043C\u043E\u0439 \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0438");let i=t.map(h=>h.index?h.toNonIndexed():h),s=km(i,!1);for(let h of new Set([...t,...i]))h!==s&&h.dispose();if(!s)throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C SVG-\u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u044E");s.computeBoundingBox();let r=s.boundingBox,o=Math.max(1e-4,r.max.x-r.min.x),a=Math.max(1e-4,r.max.y-r.min.y),c=e/Math.max(o,a),l=(r.min.x+r.max.x)*.5,u=(r.min.y+r.max.y)*.5;return s.translate(-l,-u,0),s.scale(c,-c,1),s.userData.shared=!0,s}function BM(){let e=new Float32Array(1500);for(let i=0;i<500;i+=1){let s=14+i%17*.31,r=i*2.399963,o=1-i/499*2,a=Math.sqrt(1-o*o);e[i*3]=Math.cos(r)*a*s,e[i*3+1]=o*s,e[i*3+2]=Math.sin(r)*a*s}let t=new Tt;return t.setAttribute("position",new en(e,3)),new Hr(t,new zr({color:49151,size:.025,transparent:!0,opacity:.62}))}function ro(n){n.traverse(e=>{e.geometry?.userData?.shared||e.geometry?.dispose?.(),Array.isArray(e.material)?e.material.forEach(t=>t.dispose()):e.material?.dispose?.()})}function Bg(n){let e=new ft(new bs(.995,1.005,96),new Ut({color:49151,transparent:!0,opacity:0,depthTest:!1,depthWrite:!1,toneMapped:!1,side:Ft}));e.visible=!1,e.renderOrder=5,n.add(e),n.userData.connectionContour=e}function wg(n,e,t){let i=n.userData.connectionContour;i&&(i.visible=!!e&&zs.showRangeCircle!==!1&&!n.userData.removing,i.visible&&(i.quaternion.copy(t),i.position.set(0,n.userData.stemHeight/n.scale.x,0).applyQuaternion(t),i.scale.setScalar(n.userData.signalRadius/n.scale.x),i.material.opacity=n.userData.presence*.4,i.material.color.setHex((n.userData.targetVisual?.linked>0,49151))))}var zM=["terminal","satellite","gateway","core","internet"],HM={policy:"geographicCorridor",corridorWidth:2,ambiguityEpsilon:1e-4},kM={invalid:"error"},Hd=Object.freeze([Object.freeze({id:"mission-hub-satellite",kind:"orbital-signal",icon:"satellite",latitude:68.25,longitude:175.35,altitude:1.4,size:.72,signalRadius:.82,signalMode:"always",successWhen:"all-missions-completed"})]),rr=/^(?!(?:__proto__|constructor|prototype)$)[a-zA-Z0-9_-]+$/,ke=(n,e)=>{if(!n)throw new Error(e)},rs=n=>typeof n=="number"&&Number.isFinite(n)&&n>0,VM=(n,e,t)=>{let i=String(e.label??n).trim().toUpperCase();return(n.toUpperCase()==="A"||i==="A"||i==="\u0410")&&t.pointIcons.includes("point-a")?"point-a":(n.toUpperCase()==="B"||i==="B"||i==="\u0411")&&t.pointIcons.includes("point-b")?"point-b":""};function zg(n={}){ke(n.schemaVersion===2,"mission-system: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F schemaVersion 2");let e=ud(n);return{schemaVersion:2,...e,objectSettings:Ba(n.objectSettings,e.objectTypes),screenAppearance:bf(n.screenAppearance,e.objectTypes),missionSelectObjects:kd(n.missionSelectObjects,e.icons),connection:Hg(n.connection),feedback:kg(n.feedback)}}function kd(n,e){let t=n??Hd;ke(Array.isArray(t),"missionSelectObjects: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043C\u0430\u0441\u0441\u0438\u0432");let i=new Set;return t.map((s,r)=>{let o=`missionSelectObjects[${r}]`;return ke(s&&typeof s=="object"&&!Array.isArray(s),`${o}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u044A\u0435\u043A\u0442`),ke(rr.test(s.id)&&!i.has(s.id),`${o}: \u043D\u0443\u0436\u0435\u043D \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 id`),i.add(s.id),ke(s.kind==="orbital-signal",`${o}.kind: \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F orbital-signal`),ke(typeof s.icon=="string"&&Object.hasOwn(e,s.icon),`${o}.icon: \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0443\u044E \u0438\u043A\u043E\u043D\u043A\u0443`),ke(Number.isFinite(s.latitude)&&Math.abs(s.latitude)<=82,`${o}.latitude: \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D -82\u201382`),ke(Number.isFinite(s.longitude)&&Math.abs(s.longitude)<=180,`${o}.longitude: \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D -180\u2013180`),ke(rs(s.altitude)&&s.altitude<=3,`${o}.altitude: \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D 0\u20133`),ke(rs(s.size),`${o}.size: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 > 0`),ke(rs(s.signalRadius),`${o}.signalRadius: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 > 0`),ke(s.signalMode==="always",`${o}.signalMode: \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F always`),ke(s.successWhen==="all-missions-completed",`${o}.successWhen: \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F all-missions-completed`),{id:s.id,kind:s.kind,icon:s.icon,latitude:s.latitude,longitude:s.longitude,altitude:s.altitude,size:s.size,signalRadius:s.signalRadius,signalMode:s.signalMode,successWhen:s.successWhen}})}function Hg(n={}){let e={...HM,...n};if(ke(["geographicCorridor","screenProjected","hybridProjected"].includes(e.policy),"\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0439"),ke(rs(e.corridorWidth)&&rs(e.ambiguityEpsilon),"\u0428\u0438\u0440\u0438\u043D\u0430 \u043A\u043E\u0440\u0438\u0434\u043E\u0440\u0430 \u0438 \u0434\u043E\u043F\u0443\u0441\u043A \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C > 0"),e.policy!=="geographicCorridor"||e.screen!==void 0){ke(e.screen===void 0||e.screen&&typeof e.screen=="object"&&!Array.isArray(e.screen),"\u042D\u043A\u0440\u0430\u043D\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u044A\u0435\u043A\u0442"),e.screen={...gu,...e.screen};for(let[t,i]of Object.entries(e.screen))ke(Object.hasOwn(gu,t)&&rs(i),`\u042D\u043A\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 ${t}: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E > 0`);ke(e.screen.corridorFraction<=1&&e.screen.ambiguityFraction<.5&&e.screen.minimumEndpointSpan<=2e3&&e.screen.iconGap<=100&&e.screen.stableHoldMs>=100&&e.screen.stableHoldMs<=5e3,"\u042D\u043A\u0440\u0430\u043D\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0432\u043D\u0435 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430")}return e}function kg(n={}){let e={...kM,...n};return ke(["error","neutral"].includes(e.invalid),"\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u043E\u0448\u0438\u0431\u043A\u0438: error \u0438\u043B\u0438 neutral"),e}function Vg(n,e){let t=Object.keys(e.objectTypes);ke(rr.test(n.id),"ID \u043C\u0438\u0441\u0441\u0438\u0438: \u043B\u0430\u0442\u0438\u043D\u0438\u0446\u0430, \u0446\u0438\u0444\u0440\u044B, _ \u0438 - (\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0438\u043C\u044F \u0444\u0430\u0439\u043B\u0430)");let i=structuredClone(n.endpoints),s=structuredClone(n.topology);ke(i&&Object.keys(i).length>=2,"\u0422\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u0434\u0432\u0435 \u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0442\u043E\u0447\u043A\u0438");let r=Object.fromEntries(Object.keys(i).map(p=>[p,new Set]));for(let p of s?.paths||[])r[p.from]?.add("start"),r[p.to]?.add("finish");for(let[p,M]of Object.entries(i)){ke(rr.test(p),`\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u0442\u043E\u0447\u043A\u0438 ${p}`),ke(Number.isFinite(M.latitude)&&Math.abs(M.latitude)<=82&&Number.isFinite(M.longitude)&&Math.abs(M.longitude)<=180,`\u0422\u043E\u0447\u043A\u0430 ${p}: \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u0432\u043D\u0435 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430`);for(let E of["size","signalRadius"])M[E]!==void 0&&ke(rs(M[E]),`\u0422\u043E\u0447\u043A\u0430 ${p}: ${E} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C > 0`);M.icon||(M.icon=VM(p,M,e)),ke(M.icon&&Object.hasOwn(e.icons,M.icon)&&e.pointIcons.includes(M.icon),`\u0422\u043E\u0447\u043A\u0430 ${p}: \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u043A\u043E\u043D\u043A\u0443 \u0438\u0437 \u0431\u0430\u043D\u043A\u0430 \u0442\u043E\u0447\u0435\u043A`),M.label="",M.roles!==void 0&&ke(Array.isArray(M.roles),`\u0422\u043E\u0447\u043A\u0430 ${p}: roles \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C`),M.roles=M.roles===void 0?[...r[p]]:[...new Set(M.roles)],ke(M.roles.length>0&&M.roles.every(E=>["start","finish"].includes(E)),`\u0422\u043E\u0447\u043A\u0430 ${p}: \u043D\u0430\u0437\u043D\u0430\u0447\u044C\u0442\u0435 \u0435\u0451 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u043E\u0439 \u0438\u043B\u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u044E\u0449\u0435\u0439`)}let o=n.equipmentSet||"";o&&ke(Object.hasOwn(e.equipmentSets,o),`\u041C\u0438\u0441\u0441\u0438\u044F ${n.name}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043D\u0430\u0431\u043E\u0440 ${o}`);let a={...o?e.equipmentSets[o].inventory:n.inventory};ke(Object.keys(a).length>0,"\u0418\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044C \u043F\u0443\u0441\u0442");for(let[p,M]of Object.entries(a))ke(t.includes(p)&&Number.isInteger(M)&&M>=0,`\u0418\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044C ${p}: \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0446\u0435\u043B\u043E\u0435 \u0447\u0438\u0441\u043B\u043E >= 0`);ke(Array.isArray(s?.paths)&&s.paths.length>0,"\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u0432 topology.paths");let c=new Set,l=new Map;for(let p of s.paths){ke(rr.test(p.id)&&!c.has(p.id),`\u041F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0439 \u0438\u043B\u0438 \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430 ${p.id}`),c.add(p.id),ke(i[p.from]&&i[p.to]&&p.from!==p.to,`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u0437\u043D\u044B\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0442\u043E\u0447\u043A\u0438`),ke(i[p.from].roles.includes("start"),`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u0442\u043E\u0447\u043A\u0430 ${p.from} \u043D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0430 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u043E\u0439`),ke(i[p.to].roles.includes("finish"),`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u0442\u043E\u0447\u043A\u0430 ${p.to} \u043D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u044E\u0449\u0435\u0439`),p.endpointSelection={from:"specific",to:"specific",...p.endpointSelection},ke(["specific","anyRole"].includes(p.endpointSelection.from),`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u044B\u0445 \u0442\u043E\u0447\u0435\u043A`),ke(["specific","anyRole"].includes(p.endpointSelection.to),`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u044E\u0449\u0438\u0445 \u0442\u043E\u0447\u0435\u043A`),p.endpointSignals={from:"nearest",to:"nearest",...p.endpointSignals},ke(["nearest","parallel"].includes(p.endpointSignals.from),`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u0441\u0438\u0433\u043D\u0430\u043B\u0430 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u044B\u0445 \u0442\u043E\u0447\u0435\u043A`),ke(["nearest","parallel"].includes(p.endpointSignals.to),`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u0441\u0438\u0433\u043D\u0430\u043B\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u044E\u0449\u0438\u0445 \u0442\u043E\u0447\u0435\u043A`);let M=i[p.from],E=i[p.to];ke(Math.hypot(M.latitude-E.latitude,M.longitude-E.longitude)>.001,`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u0442\u043E\u0447\u043A\u0438 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u044E\u0442`),ke(Array.isArray(p.steps)&&p.steps.length>0,`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0440\u043E\u043B\u0438`),p.connection=Hg({...e.connection,...p.connection});let v=new Set;for(let A of p.steps)ke(rr.test(A.role)&&!v.has(A.role)&&t.includes(A.type),`\u041C\u0430\u0440\u0448\u0440\u0443\u0442 ${p.id}: \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u0430\u044F \u0438\u043B\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u0440\u043E\u043B\u044C ${A.role}`),v.add(A.role),ke(!l.has(A.role)||l.get(A.role)===A.type,`\u041E\u0431\u0449\u0430\u044F \u0440\u043E\u043B\u044C ${A.role} \u0434\u043E\u043B\u0436\u043D\u0430 \u0438\u043C\u0435\u0442\u044C \u043E\u0434\u0438\u043D \u0442\u0438\u043F`),l.set(A.role,A.type)}for(let p of t)ke([...l.values()].filter(M=>M===p).length<=(a[p]||0),`\u041C\u0438\u0441\u0441\u0438\u044F \xAB${n.name}\xBB: \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044C ${p} \u043C\u0435\u043D\u044C\u0448\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u0440\u043E\u043B\u0435\u0439`);let u=new Set,h={pathIds:c,roles:l,topology:s,equipmentTypes:t,objectiveIds:u},d=n.objectives.map(p=>(ke(rr.test(p.id)&&!u.has(p.id),`\u041F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0439 \u0438\u043B\u0438 \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u0437\u0430\u0434\u0430\u0447\u0438 ${p.id}`),u.add(p.id),{...p,condition:zd(p.condition,h)})),f=zd(n.completion||{type:"allPaths"},h),m=GM(n.feedbackEvents,{...h,objectiveIds:u},n),x=n.objectSettings||{};for(let[p,M]of Object.entries(x)){ke(e.objectSettings[p]&&M&&typeof M=="object"&&!Array.isArray(M),`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A ${p}`);for(let[E,v]of Object.entries(M))ke(Object.hasOwn(e.objectSettings[p],E)&&rs(v),`\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 ${p}.${E}`)}let g=Ba(Object.fromEntries(Object.entries(e.objectSettings).map(([p,M])=>[p,{...M,...x[p]}])),e.objectTypes);return{orbitalTypes:Object.entries(e.objectTypes).filter(([,p])=>p.behavior==="orbital").map(([p])=>p),endpoints:i,inventory:a,...o?{equipmentSet:o}:{},topology:s,objectives:d,completion:f,feedback:kg({...e.feedback,...n.feedback}),feedbackEvents:m,objectSettings:g,route:s.paths[0].steps.map(p=>p.type)}}function GM(n,e,t={}){let i=n||WM(t);ke(i&&Array.isArray(i.success)&&Array.isArray(i.error),"\u041F\u043E\u043F\u0430\u043F\u044B \u043C\u0438\u0441\u0441\u0438\u0438: \u043D\u0443\u0436\u043D\u044B \u0441\u043F\u0438\u0441\u043A\u0438 success \u0438 error");let s=new Set,r=(c,l)=>{ke(l&&rr.test(l.id)&&!s.has(l.id),`\u041F\u043E\u043F\u0430\u043F: \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0439 \u0438\u043B\u0438 \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID ${l?.id||""}`),s.add(l.id),ke(typeof l.eyebrow=="string"&&l.eyebrow.trim(),`\u041F\u043E\u043F\u0430\u043F ${l.id}: \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u043D\u0430\u0434\u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A`),ke(typeof l.title=="string"&&l.title.trim(),`\u041F\u043E\u043F\u0430\u043F ${l.id}: \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A`),ke(typeof l.message=="string",`\u041F\u043E\u043F\u0430\u043F ${l.id}: message \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u043E\u0439`);let u=XM(l.condition,e);if(c==="success"){let d=l.action||(u.type==="missionComplete"?"complete":"dismiss");return ke(["complete","dismiss"].includes(d),`\u041F\u043E\u043F\u0430\u043F ${l.id}: action \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C complete \u0438\u043B\u0438 dismiss`),{id:l.id,eyebrow:l.eyebrow,title:l.title,message:l.message,condition:u,action:d}}let h=l.negativeConnections||"none";return ke(["none","invalid","matched","all"].includes(h),`\u041F\u043E\u043F\u0430\u043F ${l.id}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u043D\u0435\u0433\u0430\u0442\u0438\u0432\u043D\u044B\u0445 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0439`),{id:l.id,eyebrow:l.eyebrow,title:l.title,message:l.message,condition:u,negativeConnections:h}},o=i.success.map(c=>r("success",c)),a=i.error.map(c=>r("error",c));return ke(o.some(c=>c.action==="complete"&&c.condition.type==="missionComplete"),"\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0444\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 success-\u043F\u043E\u043F\u0430\u043F \u0441 \u0443\u0441\u043B\u043E\u0432\u0438\u0435\u043C \xAB\u041C\u0438\u0441\u0441\u0438\u044F \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0430\xBB"),{success:o,error:a}}function WM(n={}){return{success:[{id:"mission-complete",eyebrow:`\u041C\u0418\u0421\u0421\u0418\u042F \u2116${Number(n.number)||1} \u0412\u042B\u041F\u041E\u041B\u041D\u0415\u041D\u0410`,title:n.successText||"\u041C\u0410\u0420\u0428\u0420\u0423\u0422 \u0420\u0410\u0411\u041E\u0422\u0410\u0415\u0422",message:"\u041C\u0430\u0440\u0448\u0440\u0443\u0442 \u0441\u043E\u0431\u0440\u0430\u043D \u0432\u0435\u0440\u043D\u043E, \u0432\u0441\u0435 \u0443\u0447\u0430\u0441\u0442\u043A\u0438 \u0441\u0435\u0442\u0438 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u044B.",condition:{type:"missionComplete"},action:"complete"}],error:[{id:"invalid-connection",eyebrow:"\u041E\u0428\u0418\u0411\u041A\u0410 \u0421\u041E\u0415\u0414\u0418\u041D\u0415\u041D\u0418\u042F",title:"\u041F\u0420\u041E\u0412\u0415\u0420\u042C \u041F\u041E\u0420\u042F\u0414\u041E\u041A \u041E\u0411\u041E\u0420\u0423\u0414\u041E\u0412\u0410\u041D\u0418\u042F",message:"\u0421\u043E\u0435\u0434\u0438\u043D\u0438 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u0441\u0435\u0442\u0438 \u0432 \u043F\u043E\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438, \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0439 \u0432 \u0437\u0430\u0434\u0430\u043D\u0438\u0438.",condition:{type:"invalidConnection"},negativeConnections:"invalid"}]}}function XM(n,e){ke(n&&typeof n=="object","\u0423 \u043F\u043E\u043F\u0430\u043F\u0430 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0443\u0441\u043B\u043E\u0432\u0438\u0435");let t=structuredClone(n);if(t.type==="missionComplete"||t.type==="invalidConnection")return{type:t.type};if(t.type==="objectiveComplete")return ke(e.objectiveIds.has(t.objective),`\u041F\u043E\u043F\u0430\u043F \u0441\u0441\u044B\u043B\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0443\u044E \u0437\u0430\u0434\u0430\u0447\u0443 ${t.objective}`),{type:t.type,objective:t.objective};if(t.type==="pathComplete")return ke(e.pathIds.has(t.path),`\u041F\u043E\u043F\u0430\u043F \u0441\u0441\u044B\u043B\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 ${t.path}`),{type:t.type,path:t.path};if(t.type==="altitude")return ke(e.equipmentTypes.includes(t.object),`\u041F\u043E\u043F\u0430\u043F \u0432\u044B\u0441\u043E\u0442\u044B: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043E\u0431\u044A\u0435\u043A\u0442 ${t.object}`),ke(["above","below"].includes(t.comparison),"\u041F\u043E\u043F\u0430\u043F \u0432\u044B\u0441\u043E\u0442\u044B: comparison \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C above \u0438\u043B\u0438 below"),ke(rs(t.value),"\u041F\u043E\u043F\u0430\u043F \u0432\u044B\u0441\u043E\u0442\u044B: \u043F\u043E\u0440\u043E\u0433 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C > 0"),ke(["any","all"].includes(t.quantifier),"\u041F\u043E\u043F\u0430\u043F \u0432\u044B\u0441\u043E\u0442\u044B: quantifier \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C any \u0438\u043B\u0438 all"),{type:t.type,object:t.object,comparison:t.comparison,value:t.value,quantifier:t.quantifier};throw new Error(`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0435 \u043F\u043E\u043F\u0430\u043F\u0430: ${t.type}`)}function zd(n,e,t=0){ke(n&&t<=16,"\u0423\u0441\u043B\u043E\u0432\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0438\u043B\u0438 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 16");let i=structuredClone(n);if(["all","any","atLeast","not"].includes(i.type))ke(Array.isArray(i.children)&&i.children.length>0,`${i.type}: \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u044F`),i.type==="not"&&ke(i.children.length===1,"not \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043E\u0434\u043D\u043E \u0443\u0441\u043B\u043E\u0432\u0438\u0435"),i.type==="atLeast"&&ke(Number.isInteger(i.count)&&i.count>0&&i.count<=i.children.length,"atLeast: \u043D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E"),i.children=i.children.map(s=>zd(s,e,t+1));else if(["path","segment"].includes(i.type)){if(ke(e.pathIds.has(i.path),`\u0423\u0441\u043B\u043E\u0432\u0438\u0435 \u0441\u0441\u044B\u043B\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 ${i.path}`),i.type==="segment"){let s=e.topology.paths.find(r=>r.id===i.path);ke(Number.isInteger(i.from)&&Number.isInteger(i.to)&&i.from>=0&&i.to>i.from&&i.to<=s.steps.length+1,"segment: \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u0432\u043A\u043B\u044E\u0447\u0430\u044E\u0442 \u0442\u043E\u0447\u043A\u0438 (0 \u0438 N+1) \u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C from < to"),i.anchor=i.anchor||"start",ke(["start","end"].includes(i.anchor),"segment.anchor: start \u0438\u043B\u0438 end")}}else i.type==="placed"?ke((e.equipmentTypes||zM).includes(i.object)&&Number.isInteger(i.count)&&i.count>0,"placed: \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043F \u0438 \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E"):ke(["allPaths","allPlaced"].includes(i.type),`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0435 v2: ${i.type}`);return i}var qM=new Set(["placed","adjacent","connectedSequence","allPlaced","routeCorrect","networkConnected"]),$M=new Set(["terminal","satellite","gateway","core","internet","endpoint:A","endpoint:B"]);async function Vd(n="./config/missions/index.json",e=fetch,t=0){let i=await e(n,{cache:"no-store"});if(!i.ok)throw new Error(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043A\u0430\u0442\u0430\u043B\u043E\u0433 \u043C\u0438\u0441\u0441\u0438\u0439: HTTP ${i.status}`);let s=await i.json();if(s.schemaVersion!==2||!s.files)return lo(s);let r=n.slice(0,n.lastIndexOf("/")+1),o=async l=>{let u=await e(l,{cache:"no-store"});if(!u.ok)throw new Error(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C ${l}`);return u.json()};if(!Array.isArray(s.files)||s.files.some(l=>!/^[a-zA-Z0-9_-]+\.json$/.test(l)))throw new Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u043C\u0438\u0441\u0441\u0438\u0439");let[a,...c]=await Promise.all([o(`${r}../mission-system.json`),...s.files.map(l=>o(`${r}${l}`))]);if([a,...c].some(l=>(l._revision||"migration-v2")!==s.revision)){if(t>=5)throw new Error("\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0438\u043B\u0438 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0440\u0430\u0437\u043D\u044B\u0435 \u0440\u0435\u0432\u0438\u0437\u0438\u0438. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0443.");return await new Promise(l=>setTimeout(l,100)),Vd(n,e,t+1)}return lo({schemaVersion:2,revision:s.revision,system:a,missions:c})}function lo(n){if(!n||![1,2].includes(n.schemaVersion)||!Array.isArray(n.missions)||n.missions.length<1)throw new Error("missions.json: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F schemaVersion=1 \u0438 \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0441\u0441\u0438\u0432 missions");let e=new Set,t=new Set,i=n.schemaVersion===2?zg(n.system):null;if(i)for(let r of n.missions)for(let o of Object.values(r.endpoints||{}))o.icon&&Object.hasOwn(i.icons,o.icon)&&!i.pointIcons.includes(o.icon)&&i.pointIcons.push(o.icon);let s=n.missions.map((r,o)=>jM(r,o,e,t,i));s.sort((r,o)=>r.number-o.number);for(let r of s)for(let o of r.unlock.requiresCompleted){if(!e.has(o))throw new Error(`missions.json: \u043C\u0438\u0441\u0441\u0438\u044F ${r.number} \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0439 \u043C\u0438\u0441\u0441\u0438\u0438 ${o}`);if(o===r.number)throw new Error(`missions.json: \u043C\u0438\u0441\u0441\u0438\u044F ${r.number} \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0437\u0430\u0432\u0438\u0441\u0435\u0442\u044C \u043E\u0442 \u0441\u0430\u043C\u043E\u0439 \u0441\u0435\u0431\u044F`)}return YM(s),$g({schemaVersion:n.schemaVersion,...i?{system:i,revision:n.revision||"initial"}:{},objectSettings:i?.objectSettings||Ba(n.objectSettings),missionSelectObjects:i?.missionSelectObjects||kd(n.missionSelectObjects??Hd,vi),missions:s,byNumber:Object.fromEntries(s.map(r=>[r.number,r]))})}function Wg(n){if(n.schemaVersion===2){let t=lo(n);return{schemaVersion:2,revision:t.revision,system:structuredClone(t.system),missions:t.missions.map(i=>{let s=structuredClone(i);return delete s.orbitalTypes,delete s.route,s.equipmentSet&&delete s.inventory,s})}}let e=lo({schemaVersion:1,missions:n.missions,objectSettings:n.objectSettings});return{$schema:"./missions.schema.json",schemaVersion:1,missions:structuredClone(e.missions),objectSettings:structuredClone(e.objectSettings),missionSelectObjects:structuredClone(e.missionSelectObjects)}}function jM(n,e,t,i,s=null){let r=`missions[${e}]`,o=wu(n?.number,`${r}.number`),a=os(n?.id,`${r}.id`);if(t.has(o))throw new Error(`missions.json: \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F \u043D\u043E\u043C\u0435\u0440 \u043C\u0438\u0441\u0441\u0438\u0438 ${o}`);if(i.has(a))throw new Error(`missions.json: \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F id \u043C\u0438\u0441\u0441\u0438\u0438 ${a}`);t.add(o),i.add(a);let c=s?Vg(n,s):null,l=c?.route||qg(n.route,`${r}.route`),u=new Set,h=Xg(n.objectives,`${r}.objectives`).map((d,f)=>({id:os(d?.id,`${r}.objectives[${f}].id`),label:os(d?.label,`${r}.objectives[${f}].label`),condition:c?c.objectives[f].condition:ZM(d?.condition,`${r}.objectives[${f}].condition`)}));for(let d of h){if(u.has(d.id))throw new Error(`${r}: \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F id \u043F\u043E\u0434\u0437\u0430\u0434\u0430\u0447\u0438 ${d.id}`);u.add(d.id)}return{number:o,id:a,name:os(n.name,`${r}.name`),description:String(n.description||""),...n.summary!==void 0?{summary:String(n.summary)}:{},...n.level!==void 0?{level:String(n.level)}:{},timeSeconds:wu(n.timeSeconds,`${r}.timeSeconds`),mapPosition:JM(n.mapPosition,`${r}.mapPosition`),endpoints:c?.endpoints||{A:Gg(n.endpoints?.A,`${r}.endpoints.A`,"A"),B:Gg(n.endpoints?.B,`${r}.endpoints.B`,"\u0411")},connectEndpointsOnComplete:KM(n.connectEndpointsOnComplete,`${r}.connectEndpointsOnComplete`),route:l,objectives:h,successText:os(n.successText,`${r}.successText`),unlock:{requiresCompleted:(n.unlock?.requiresCompleted||[]).map(d=>wu(d,`${r}.unlock.requiresCompleted`))},...c?{...c,objectSettings:structuredClone(n.objectSettings||{}),engineVersion:2}:{}}}function YM(n){let e=new Map(n.map(r=>[r.number,r.unlock.requiresCompleted])),t=new Set,i=new Set,s=r=>{if(t.has(r))throw new Error(`missions.json: \u0446\u0438\u043A\u043B\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C \u0440\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438 \u0443 \u043C\u0438\u0441\u0441\u0438\u0438 ${r}`);if(!i.has(r)){t.add(r);for(let o of e.get(r)||[])s(o);t.delete(r),i.add(r)}};for(let r of n)s(r.number)}function ZM(n,e){if(!n||!qM.has(n.type))throw new Error(`${e}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 type`);let t={type:n.type};if(n.object!==void 0&&(t.object=os(n.object,`${e}.object`)),n.first!==void 0&&(t.first=os(n.first,`${e}.first`)),n.second!==void 0&&(t.second=os(n.second,`${e}.second`)),n.count!==void 0&&(t.count=wu(n.count,`${e}.count`)),n.type==="placed"&&!t.object)throw new Error(`${e}: placed \u0442\u0440\u0435\u0431\u0443\u0435\u0442 object`);if(n.type==="adjacent"&&(!t.first||!t.second))throw new Error(`${e}: adjacent \u0442\u0440\u0435\u0431\u0443\u0435\u0442 first \u0438 second`);if(n.type==="connectedSequence"){t.sequence=qg(n.sequence,`${e}.sequence`);let i=t.sequence;if(i.filter(s=>!s.startsWith("endpoint:")).length<2||i.some((s,r)=>!$M.has(s)||s==="endpoint:A"&&r!==0||s==="endpoint:B"&&r!==i.length-1))throw new Error(`${e}: sequence \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u0434\u0432\u0430 \u043E\u0431\u044A\u0435\u043A\u0442\u0430; A \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u043D\u0430\u0447\u0430\u043B\u0435, \u0411 \u2014 \u0432 \u043A\u043E\u043D\u0446\u0435`)}return t}function JM(n,e){let t=Tu(n?.latitude,`${e}.latitude`),i=Tu(n?.longitude,`${e}.longitude`);if(t<-82||t>82||i<-180||i>180)throw new Error(`${e}: \u0433\u0435\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u0432\u043D\u0435 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E\u0433\u043E \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430`);return{latitude:t,longitude:i}}function Gg(n,e,t){let i=Tu(n?.latitude,`${e}.latitude`),s=Tu(n?.longitude,`${e}.longitude`);if(i<-82||i>82||s<-180||s>180)throw new Error(`${e}: \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u0432\u043D\u0435 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E\u0433\u043E \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430`);return{label:String(n.label||t),latitude:i,longitude:s}}function wu(n,e){let t=Number(n);if(!Number.isInteger(t)||t<1)throw new Error(`${e}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u0446\u0435\u043B\u043E\u0435 \u0447\u0438\u0441\u043B\u043E`);return t}function Tu(n,e){let t=Number(n);if(!Number.isFinite(t))throw new Error(`${e}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0447\u0438\u0441\u043B\u043E`);return t}function os(n,e){if(typeof n!="string"||!n.trim())throw new Error(`${e}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043D\u0435\u043F\u0443\u0441\u0442\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430`);return n.trim()}function KM(n,e){if(typeof n!="boolean")throw new Error(`missions.json: ${e} \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C boolean`);return n}function Xg(n,e){if(!Array.isArray(n)||n.length<1)throw new Error(`${e}: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0441\u0441\u0438\u0432`);return n}function qg(n,e){return Xg(n,e).map((t,i)=>os(t,`${e}[${i}]`))}function $g(n){if(!n||typeof n!="object"||Object.isFrozen(n))return n;Object.freeze(n);for(let e of Object.values(n))$g(e);return n}var On={width:4096,height:1280};function jg(n="two"){return(n==="single"?[[2264,192,1760,1024]]:[[2264,272,864,864],[3160,272,864,864]]).map(([t,i,s,r],o)=>({index:o,left:t,top:i,w:s,h:r,x:t+s/2,y:i+r/2,r:Math.min(s,r)/2}))}var Zn=jg();function Gd(n){return Zn=jg(n),Zn}function Yg(n,e,t){let i=Zn[n];return!!i&&e>=i.left&&e<=i.left+i.w&&t>=i.top&&t<=i.top+i.h}function Wd(n){return Zn[n].w/1040}var Au=18*Math.tan(25*Math.PI/360);function QM(n,e){return{longitude:(n-On.width/2)*Au/On.height/.03,latitude:(On.height/2-e)*Au/On.height/.03,altitude:.08}}function eE(n){return{x:On.width/2+n.longitude*.03/Au*On.height,y:On.height/2-n.latitude*.03/Au*On.height}}function co(n,e){let t=Zn[n],i=eE(e);return!!t&&Number.isFinite(i.x)&&Number.isFinite(i.y)&&i.x>t.left+t.w*.14&&i.x<t.left+t.w*.86&&i.y>t.top+t.h*.36&&i.y<t.top+t.h*.61}function Cu(n,e=null){return{index:n,mission:e,placements:[],nextId:1,selected:null,selectedId:null,branch:"channel",complete:!1,hold:null,projectionKey:"",revision:0}}function Zg(n,e,t,i,s){return n.complete||!co(n.index,t)||!i[e]||n.placements.filter(r=>r.type===e).length>=i[e]?n:{...n,nextId:n.nextId+1,hold:null,selected:null,selectedId:null,placements:[...n.placements,{id:(n.index+1)*1e5+n.nextId,type:e,...t,droppedAt:s}]}}function Jg(n,e,t,i){return n.complete||!co(n.index,t)||!n.placements.some(s=>s.id===e)?n:{...n,hold:null,selectedId:null,placements:n.placements.map(s=>s.id===e?{...s,...t,droppedAt:i}:s)}}function Xd(n,e){return{...n,complete:!1,hold:null,selectedId:null,placements:n.placements.filter(t=>t.id!==e)}}function Kg(n,e){let t=Zn[e],i=structuredClone(n);for(let[s,r]of[["A",-1],["B",1]])i.endpoints[s]={...i.endpoints[s],...QM(t.x+r*t.w*.32,t.top+t.h*.5),size:.65,signalRadius:i.objectSettings[`endpoint:${s}`].signalRadius*.64*Wd(e)};return i.connectEndpointsOnComplete=!1,i}function Qg(n,e,t,i,s){let r=JSON.stringify(Object.entries(e.nodes).map(([u,h])=>[u,Math.round(h.x*10),Math.round(h.y*10),Math.round(h.radius*10),h.eligible])),o=n.projectionKey!==r,a=n.revision+(o?1:0),c=t.complete&&!s&&!e.hidden&&i-e.timestamp<=120,l=c?o||n.hold===null?i:n.hold:null;return{...n,projectionKey:r,revision:a,hold:l,complete:n.complete||!!(c&&i-l>=300)}}var n0=document.querySelector("#arena"),tE=document.querySelector("#world"),Ga=document.querySelector("#circles"),i0=document.querySelector("#loading"),In,Ru,ho,Wa,Bn=!1,li=null,sn=null,as=null,Pu="",e0=0,fo=new URLSearchParams(location.search).get("layout")==="single"?"single":"two";Gd(fo);var t0=new Map,Ct=Zn.map((n,e)=>Cu(e)),uo={},s0={number:0,endpoints:uo},po=[],$d={states:{},links:[]},or=n=>String(n).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function r0(){document.documentElement.dataset.glassRevision=String(Number(document.documentElement.dataset.glassRevision||0)+1)}function Iu(){let n=Math.min(innerWidth/On.width,innerHeight/On.height);n0.style.transform=`translate(-50%,-50%) scale(${n})`,In?.resize();for(let e of Ct)e.hold=null;r0()}function jd(n){return Wa.missions.find(e=>e.number===n.mission)}function nE(n){let e=jd(n);return[...e.steps,...e.branches?[e.branches.find(t=>t.id===n.branch).step]:[]]}function Yd(n){return Kg(ho.byNumber[n.mission],n.index)}function Ns(){uo={},po=[];for(let n of Ct){if(!n.mission)continue;let e=Yd(n);for(let[t,i]of Object.entries(e.endpoints))uo[`z${n.index}-${t}`]=i;po.push(...n.placements.map(t=>({...t,...as?.id===t.id?as.geo:{},signalRadius:cn[t.type].signalRadius*Wd(n.index)})))}s0={number:0,endpoints:uo},Pu="",In?.update({placements:po,endpoints:uo,network:$d,selectedItem:sn===null?null:Ct[sn].selected}),In?.setTapControls({enabled:!0,selectedId:sn===null?null:Ct[sn].selectedId})}function mo(n){r0();let e=Ct[n],t=Zn[n],i=Ga.children[n];if(!e.mission){i.innerHTML=`<div class="circle-copy"><span class="eyebrow">${n+1} / \u0412\u041E\u0417\u041C\u041E\u0416\u041D\u041E\u0421\u0422\u0418 MAX</span><h2>\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u0438\u0441\u0441\u0438\u044E</h2><p>\u0421\u043E\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442</p></div><div class="mission-choices">${Wa.missions.map(a=>`<button data-mission="${a.number}"><span>${a.number}</span>${or(a.title)}</button>`).join("")}</div>`;return}let s=jd(e),r=nE(e),o=ho.byNumber[e.mission].topology.paths[0].steps.map(a=>a.type);i.innerHTML=`<div class="circle-copy"><button class="back" data-menu>\u2190 \u041C\u0438\u0441\u0441\u0438\u0438</button><h2>${or(s.title)}</h2><p>${or(s.description)}</p>${s.branches?`<select aria-label="\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442 \u043F\u0440\u043E\u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F" data-branch>${s.branches.map(a=>`<option value="${a.id}" ${a.id===e.branch?"selected":""}>${or(a.label)}</option>`).join("")}</select>`:""}</div>
 <div class="circle-actions">${e.complete?`<p class="success">\u041C\u0430\u0440\u0448\u0440\u0443\u0442 \u0441\u043E\u0431\u0440\u0430\u043D</p><p class="result">${or(s.result)}</p><button class="repeat" data-restart>\u0415\u0449\u0451 \u0440\u0430\u0437</button>`:`<p class="hint">${e.selectedId?"\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438 \u0443\u0437\u0435\u043B \u0442\u0430\u043F\u043E\u043C \u043F\u043E \u043F\u043E\u043B\u044E":e.selected?"\u041A\u043E\u0441\u043D\u0438\u0441\u044C \u043F\u043E\u043B\u044F \u0432\u043D\u0443\u0442\u0440\u0438 \u044D\u0442\u043E\u0433\u043E \u043A\u0440\u0443\u0433\u0430":"\u0412\u044B\u0431\u0435\u0440\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0438 \u0440\u0430\u0437\u043C\u0435\u0441\u0442\u0438 \u0435\u0433\u043E \u0432\u043D\u0443\u0442\u0440\u0438 \u0437\u043E\u043D\u044B"}</p><div class="inventory">${r.map((a,c)=>`<button data-type="${o[c]}" aria-label="${or(a.label)}" aria-pressed="${e.selected===o[c]}" ${e.placements.some(l=>l.type===o[c])?"disabled":""}><b>${c+1}</b><span>${or(a.label)}</span></button>`).join("")}</div><div class="tools"><button data-restart>\u0417\u0430\u043D\u043E\u0432\u043E</button>${e.selectedId?"<button data-remove>\u0423\u0431\u0440\u0430\u0442\u044C \u0443\u0437\u0435\u043B</button>":""}</div>`}</div>`,i.dataset.complete=String(e.complete)}function Zd(){Ct.forEach((n,e)=>mo(e))}function qd(n,e){Ct[n]=Cu(n,e),sn===n&&(sn=null),as=null,mo(n),Ns()}function Va(n,e){e!==Ct[n]&&(Ct[n]=e,as=null,mo(n),Ns())}function iE(){if(!In||Bn||document.hidden)return;let n=Date.now();if(n-e0<33)return;e0=n;let e={mission:0,placements:po},t=In.captureConnections(e,s0,null,n,!1,On.width),i={states:{},links:[]};for(let r=0;r<Ct.length;r++){let o=Ct[r];if(!o.mission)continue;let a=Yd(o),c=po.filter(f=>Math.floor(f.id/1e5)===r+1),l={};for(let f of c)t.nodes[f.id]&&(l[f.id]=t.nodes[f.id]);for(let f of["A","B"])t.nodes[`endpoint:z${r}-${f}`]&&(l[`endpoint:${f}`]=t.nodes[`endpoint:z${r}-${f}`]);let u={...t,mission:o.mission,placements:c,nodes:l,interacting:li===r&&t.interacting},h=vd(a,c,cn,n,350,u),d=Qg(o,u,h,n,Bn||li===r||!!(as&&Math.floor(as.id/1e5)===r+1));Ct[r]=d,d.complete!==o.complete&&(sn===r&&(sn=null),mo(r)),Object.assign(i.states,h.states),i.links.push(...h.links.map(f=>({...f,a:String(f.a).startsWith("endpoint:")?`endpoint:z${r}-${String(f.a).slice(9)}`:f.a,b:String(f.b).startsWith("endpoint:")?`endpoint:z${r}-${String(f.b).slice(9)}`:f.b})))}let s=JSON.stringify([i.states,i.links.map(r=>[r.a,r.b,r.correct])]);s!==Pu&&(Pu=s,$d=i,In.update({placements:po,network:i,endpoints:uo,selectedItem:sn===null?null:Ct[sn].selected}))}Ga.addEventListener("click",n=>{if(Bn)return;let e=n.target.closest("[data-zone]");if(!e)return;let t=Number(e.dataset.zone),i=Ct[t],s=n.target.closest("button");if(s){if(s.dataset.mission){qd(t,Number(s.dataset.mission));return}if(s.hasAttribute("data-menu")){qd(t,null);return}if(s.hasAttribute("data-restart")){qd(t,i.mission);return}if(s.hasAttribute("data-remove")){Va(t,Xd(i,i.selectedId));return}s.dataset.type&&!s.disabled&&(sn=t,i.selected=i.selected===s.dataset.type?null:s.dataset.type,i.selectedId=null,i.hold=null,mo(t),Ns())}});Ga.addEventListener("change",n=>{if(Bn||!n.target.matches("[data-branch]"))return;let e=Number(n.target.closest("[data-zone]").dataset.zone),t=Ct[e];if(!jd(t).branches.some(r=>r.id===n.target.value))return;let s=ho.byNumber[t.mission].topology.paths[0].steps.at(-1).type;Va(e,{...t,branch:n.target.value,complete:!1,hold:null,selected:null,selectedId:null,placements:t.placements.filter(r=>r.type!==s)})});window.addEventListener("pointerdown",n=>{if(Bn)return;let e=n0.getBoundingClientRect(),t=(n.clientX-e.left)/e.width*On.width,i=(n.clientY-e.top)/e.height*On.height;li=Zn.findIndex(s=>Yg(s.index,t,i)),li<0&&(li=null),li!==null&&Ct[li].mission&&sn!==li&&(sn=li,Ns())},!0);window.addEventListener("pointerup",()=>{li=null});function ar(){In?.cancelPointer(),li=null,as=null;for(let n of Ct)n.hold=null;Ns()}window.addEventListener("pointercancel",ar);window.addEventListener("max-service-pointer-cancel",ar);window.addEventListener("message",n=>{n.source!==parent||n.origin!==location.origin||n.data?.type!=="max-service-state"||(["two","single"].includes(n.data.layoutMode)&&sE(n.data.layoutMode),Bn=n.data.playing===!1,Bn&&ar(),In?.setServicePaused(Bn),document.documentElement.dataset.servicePaused=String(Bn))});document.addEventListener("visibilitychange",()=>{document.hidden&&ar()});window.addEventListener("resize",Iu);window.addEventListener("keydown",n=>{n.key==="Escape"&&(sn=null,Ct.forEach(e=>{e.selected=null,e.selectedId=null}),Zd(),ar())});function o0(){document.documentElement.dataset.layout=fo;let n=document.querySelector("#glass");n.replaceChildren(),Ga.replaceChildren();for(let e of Zn){let t=`left:${e.left}px;top:${e.top}px;width:${e.w}px;height:${e.h}px`,i=document.createElement("div");i.className="glass",i.style.cssText=t,i.innerHTML=Array.from({length:fo==="single"?3:2},(r,o)=>`<i class="glass-orb orb-${o+1}"></i>`).join(""),n.append(i);let s=document.createElement("section");s.dataset.zone=e.index,s.className="circle",s.setAttribute("aria-label",`\u0418\u0433\u0440\u043E\u0432\u0430\u044F \u0437\u043E\u043D\u0430 ${e.index+1}`),s.style.cssText=t,Ga.append(s)}}function sE(n){if(n!==fo){Wa&&(ar(),t0.set(fo,Ct)),fo=n,Gd(n),Ct=t0.get(n)||Zn.map(e=>Cu(e.index)),sn=null,li=null,as=null;for(let e of Ct)e.hold=null,e.selected=null,e.selectedId=null;$d={states:{},links:[]},Pu="",Wa&&(o0(),Zd(),Ns(),Iu())}}async function rE(){document.documentElement.dataset.shaderGlass=String(new URLSearchParams(location.search).get("service")==="1");let[n,e,t,i]=await Promise.all([Vd("./config/client-webgl.json"),Km(),fetch("./config/client-missions.json").then(r=>{if(!r.ok)throw Error("Client content unavailable");return r.json()}),iu()]),s=Wg(n);for(let r of Object.values(s.system.objectSettings))r.size=.65,r.signalRadius*=.64;ho=lo(s),Wa=t,Jm(ho),o0(),Zd(),Iu(),Ru=new ru,await Promise.all([Ru.load(Rm(ho,Ds,i,e.rendering.earth.russiaContour,!0)),Pm(document.fonts)]),In=await Ng({container:tE,contourCatalog:i,planar:!0,planarPointAllowed:r=>Zn.some(o=>co(o.index,r)),preparedAssets:Ru,startPaused:!0,placements:[],network:{states:{},links:[]},itemTypes:Ds,endpoints:{},selectedItem:null,maxDrawingBufferPixels:e.rendering.maxDrawingBufferPixels,earthStyle:e.rendering.earth,nodeIconBackdropStyle:e.rendering.nodeIconBackdrop,signalLinkStyle:e.rendering.signalLinks,onConnectionFrame:iE,onPlace:(r,o)=>{if(Bn||sn===null)return;let a=sn,c=Ct[a];Va(a,Zg(c,r,o,Yd(c).inventory,Date.now()))},onSelectPlacement:r=>{let o=Math.floor(r/1e5)-1;!Ct[o]||Ct[o].complete||Bn||(sn=o,Ct[o].selectedId=Ct[o].selectedId===r?null:r,Ct[o].selected=null,mo(o),Ns())},onMove:(r,o)=>{let a=Math.floor(r/1e5)-1;!Bn&&Ct[a]&&Va(a,Jg(Ct[a],r,o,Date.now()))},onMovePreview:(r,o)=>{let a=Math.floor(r/1e5)-1;co(a,o)&&(as={id:r,geo:o},Ns())},onMoveCancel:ar,placementRejection:(r,o)=>sn!==null&&!co(sn,o)?"outside":null,onRemove:r=>{let o=Math.floor(r/1e5)-1;!Bn&&Ct[o]&&Va(o,Xd(Ct[o],r))}}),In.setScreenConnections(!0),In.setTapControls({enabled:!0}),await In.prepareGPU(),Iu(),In.setServicePaused(Bn),In.start(),i0.hidden=!0,document.documentElement.dataset.gameReady="true"}rE().catch(n=>{console.error(n),i0.textContent=`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C MAX: ${n.message}`});window.addEventListener("pagehide",()=>{In?.dispose(),Ru?.dispose()},{once:!0});
