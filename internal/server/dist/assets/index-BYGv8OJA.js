(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:ee,getOwnPropertySymbols:te,getPrototypeOf:ne}=Object,f=globalThis,p=f.trustedTypes,re=p?p.emptyScript:``,ie=f.reactiveElementPolyfillSupport,m=(e,t)=>e,h={toAttribute(e,t){switch(t){case Boolean:e=e?re:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},g=(e,t)=>!l(e,t),ae={attribute:!0,type:String,converter:h,reflect:!1,useDefault:!1,hasChanged:g};Symbol.metadata??=Symbol(`metadata`),f.litPropertyMetadata??=new WeakMap;var _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ae){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ae}static _$Ei(){if(this.hasOwnProperty(m(`elementProperties`)))return;let e=ne(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(m(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m(`properties`))){let e=this.properties,t=[...ee(e),...te(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?h:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?h:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??g)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:`open`},_[m(`elementProperties`)]=new Map,_[m(`finalized`)]=new Map,ie?.({ReactiveElement:_}),(f.reactiveElementVersions??=[]).push(`2.1.2`);var v=globalThis,oe=e=>e,y=v.trustedTypes,se=y?y.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ce=`$lit$`,b=`lit$${Math.random().toFixed(9).slice(2)}$`,le=`?`+b,ue=`<${le}>`,x=document,S=()=>x.createComment(``),C=e=>e===null||typeof e!=`object`&&typeof e!=`function`,w=Array.isArray,de=e=>w(e)||typeof e?.[Symbol.iterator]==`function`,T=`[ 	
\f\r]`,E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,fe=/-->/g,pe=/>/g,D=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),O=/'/g,me=/"/g,he=/^(?:script|style|textarea|title)$/i,k=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),A=Symbol.for(`lit-noChange`),j=Symbol.for(`lit-nothing`),ge=new WeakMap,M=x.createTreeWalker(x,129);function _e(e,t){if(!w(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return se===void 0?t:se.createHTML(t)}var ve=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=E;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===E?c[1]===`!--`?o=fe:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=D):(he.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=D):o=pe:o===D?c[0]===`>`?(o=i??E,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?D:c[3]===`"`?me:O):o===me||o===O?o=D:o===fe||o===pe?o=E:(o=D,i=void 0);let d=o===D&&e[t+1].startsWith(`/>`)?` `:``;a+=o===E?n+ue:l>=0?(r.push(s),n.slice(0,l)+ce+n.slice(l)+b+d):n+b+(l===-2?t:d)}return[_e(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},N=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=ve(t,n);if(this.el=e.createElement(l,r),M.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=M.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ce)){let t=u[o++],n=i.getAttribute(e).split(b),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?be:r[1]===`?`?xe:r[1]===`@`?Se:I}),i.removeAttribute(e)}else e.startsWith(b)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(he.test(i.tagName)){let e=i.textContent.split(b),t=e.length-1;if(t>0){i.textContent=y?y.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],S()),M.nextNode(),c.push({type:2,index:++a});i.append(e[t],S())}}}else if(i.nodeType===8)if(i.data===le)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(b,e+1))!==-1;)c.push({type:7,index:a}),e+=b.length-1}a++}}static createElement(e,t){let n=x.createElement(`template`);return n.innerHTML=e,n}};function P(e,t,n=e,r){if(t===A)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=C(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=P(e,i._$AS(e,t.values),i,r)),t}var ye=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??x).importNode(t,!0);M.currentNode=r;let i=M.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new F(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Ce(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=M.nextNode(),a++)}return M.currentNode=x,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},F=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=j,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=P(this,e,t),C(e)?e===j||e==null||e===``?(this._$AH!==j&&this._$AR(),this._$AH=j):e!==this._$AH&&e!==A&&this._(e):e._$litType$===void 0?e.nodeType===void 0?de(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==j&&C(this._$AH)?this._$AA.nextSibling.data=e:this.T(x.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=N.createElement(_e(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new ye(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=ge.get(e.strings);return t===void 0&&ge.set(e.strings,t=new N(e)),t}k(t){w(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(S()),this.O(S()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=oe(e).nextSibling;oe(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},I=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=j,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=j}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=P(this,e,t,0),a=!C(e)||e!==this._$AH&&e!==A,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=P(this,r[n+o],t,o),s===A&&(s=this._$AH[o]),a||=!C(s)||s!==this._$AH[o],s===j?e=j:e!==j&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===j?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},be=class extends I{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===j?void 0:e}},xe=class extends I{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==j)}},Se=class extends I{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=P(this,e,t,0)??j)===A)return;let n=this._$AH,r=e===j&&n!==j||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==j&&(n===j||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ce=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){P(this,e)}},we=v.litHtmlPolyfillSupport;we?.(N,F),(v.litHtmlVersions??=[]).push(`3.3.2`);var Te=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new F(t.insertBefore(S(),e),e,void 0,n??{})}return i._$AI(e),i},L=globalThis,R=class extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Te(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}};R._$litElement$=!0,R.finalized=!0,L.litElementHydrateSupport?.({LitElement:R});var Ee=L.litElementPolyfillSupport;Ee?.({LitElement:R}),(L.litElementVersions??=[]).push(`4.2.2`);var z=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},De={attribute:!0,type:String,converter:h,reflect:!1,hasChanged:g},Oe=(e=De,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function B(e){return(t,n)=>typeof n==`object`?Oe(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function V(e){return B({...e,state:!0,attribute:!1})}async function ke(e,t){let n=await e.arrayBuffer(),r=new Uint8Array(n),i=btoa(String.fromCharCode(...r)),a={filename:e.name,content:i,password:t||void 0},o=await fetch(`/api/v1/analyze`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(a)});if(!o.ok){let e=await o.text();throw Error(`API error ${o.status}: ${e}`)}return o.json()}function H(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var Ae=class extends R{static{this.styles=o`
    :host {
      display: block;
    }
  `}render(){return k`
      <header
        class="navbar bg-base-200 border-b border-base-300 px-4 gap-4"
        @dragover=${this._onDragOver}
        @drop=${this._onDrop}
      >
        <div class="flex-1">
          <span class="text-xl font-bold tracking-tight">certgui</span>
          <span class="text-base-content/50 text-sm ml-2">
            certificate inspector
          </span>
        </div>
        <div class="flex-none flex items-center gap-2">
          <span class="text-base-content/50 text-xs hidden md:block">
            Drop files here or
          </span>
          <label class="btn btn-primary btn-sm">
            Open file
            <input
              type="file"
              class="hidden"
              multiple
              accept=".pem,.crt,.cer,.der,.p12,.pfx,.p7b,.p7c,.csr,.crl,.key,.jwk,.json"
              @change=${this._onInputChange}
            />
          </label>
        </div>
      </header>
    `}_onDragOver(e){e.preventDefault(),e.dataTransfer.dropEffect=`copy`}_onDrop(e){e.preventDefault();let t=e.dataTransfer?.files;t?.length&&this._emit(t)}_onInputChange(e){let t=e.target.files;t?.length&&(this._emit(t),e.target.value=``)}_emit(e){this.dispatchEvent(new CustomEvent(`files-dropped`,{detail:e,bubbles:!0,composed:!0}))}};Ae=H([z(`cg-header`)],Ae);var U=class extends R{constructor(...e){super(...e),this.severity=`info`,this.count=0}static{this.styles=o`
    :host {
      display: inline-block;
    }
  `}render(){return k`<span class="badge ${this.severity===`error`?`badge-error`:this.severity===`warning`?`badge-warning`:`badge-info`} badge-xs">${this.count}</span>`}};H([B({type:String})],U.prototype,`severity`,void 0),H([B({type:Number})],U.prototype,`count`,void 0),U=H([z(`cg-issue-badge`)],U);var W=class extends R{constructor(...e){super(...e),this.text=``,this._copied=!1}static{this.styles=o`
    :host {
      display: inline-block;
    }
  `}render(){return k`
      <button
        class="btn btn-ghost btn-xs"
        title="Copy"
        @click=${this._copy}
      >${this._copied?`✓`:`⎘`}</button>
    `}async _copy(){this.text&&(await navigator.clipboard.writeText(this.text),this._copied=!0,setTimeout(()=>{this._copied=!1},1500))}};H([B({type:String})],W.prototype,`text`,void 0),H([V()],W.prototype,`_copied`,void 0),W=H([z(`cg-copy-button`)],W);var G=class extends R{constructor(...e){super(...e),this.files=[],this.selectedId=null}static{this.styles=o`
    :host {
      display: block;
    }
  `}render(){return this.files.length===0?k`
        <div class="flex flex-col items-center justify-center h-full text-base-content/40 p-6 text-center text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Drop or open certificate files to inspect them.
        </div>
      `:k`
      <ul class="menu menu-sm p-2">
        ${this.files.map(e=>this._renderItem(e))}
      </ul>
    `}_renderItem(e){let t=e.id===this.selectedId,n=e.result?.issues.filter(e=>e.severity===`error`).length??0,r=e.result?.issues.filter(e=>e.severity===`warning`).length??0;return k`
      <li>
        <a
          class="${t?`active`:``} flex items-center gap-2"
          @click=${()=>this._select(e.id)}
        >
          ${this._statusIcon(e)}
          <span class="truncate flex-1 min-w-0">${e.file.name}</span>
          ${e.status===`done`?k`
                ${n>0?k`<cg-issue-badge severity="error" count=${n}></cg-issue-badge>`:``}
                ${r>0?k`<cg-issue-badge severity="warning" count=${r}></cg-issue-badge>`:``}
              `:``}
          <button
            class="btn btn-ghost btn-xs ml-auto"
            title="Remove"
            @click=${t=>{t.stopPropagation(),this._remove(e.id)}}
          >✕</button>
        </a>
      </li>
    `}_statusIcon(e){switch(e.status){case`loading`:return k`<span class="loading loading-spinner loading-xs"></span>`;case`error`:return k`<span class="text-error" title=${e.error??``}>⚠</span>`;case`done`:return k`<span class="text-success">✓</span>`;default:return k`<span class="opacity-30">○</span>`}}_select(e){this.dispatchEvent(new CustomEvent(`file-selected`,{detail:e,bubbles:!0,composed:!0}))}_remove(e){this.dispatchEvent(new CustomEvent(`file-removed`,{detail:e,bubbles:!0,composed:!0}))}};H([B({type:Array})],G.prototype,`files`,void 0),H([B({type:String})],G.prototype,`selectedId`,void 0),G=H([z(`cg-file-list`)],G);var K=class extends R{constructor(...e){super(...e),this.response=void 0,this.filename=`export`}static{this.styles=o`
    :host {
      display: inline-block;
    }
  `}render(){return k`
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-sm btn-outline gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </label>
        <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-300">
          <li><a @click=${()=>this._download(`json`)}>JSON</a></li>
          <li><a @click=${()=>this._download(`yaml`)}>YAML</a></li>
        </ul>
      </div>
    `}_download(e){if(!this.response)return;let t=e===`json`?JSON.stringify(this.response,null,2):this._toYAML(this.response),n=new Blob([t],{type:`text/plain;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`${this.filename}.${e}`,i.click(),URL.revokeObjectURL(r)}_toYAML(e,t=0){let n=`  `.repeat(t);if(e==null)return`null`;if(typeof e==`boolean`||typeof e==`number`)return String(e);if(typeof e==`string`)return/[:#\[\]{},|>&*!'"@`%]/.test(e)||e.includes(`
`)?JSON.stringify(e):e;if(Array.isArray(e))return e.length===0?`[]`:e.map(e=>`\n${n}- ${this._toYAML(e,t+1).trimStart()}`).join(``);if(typeof e==`object`){let r=Object.entries(e);return r.length===0?`{}`:r.map(([e,r])=>{let i=this._toYAML(r,t+1);return`\n${n}${e}:${typeof r==`object`&&r&&!Array.isArray(r)?i:` `+i}`}).join(``)}return String(e)}};H([B({type:Object})],K.prototype,`response`,void 0),H([B({type:String})],K.prototype,`filename`,void 0),K=H([z(`cg-export-menu`)],K);var q=class extends R{constructor(...e){super(...e),this.certs=[]}static{this.styles=o`
    :host {
      display: block;
    }
    .chain-node {
      position: relative;
    }
    .chain-node:not(:last-child)::after {
      content: "";
      display: block;
      width: 2px;
      height: 1.5rem;
      background: oklch(var(--bc) / 0.2);
      margin-left: 1.25rem;
    }
  `}render(){return this.certs.length?k`
      <div class="space-y-0">
        ${this.certs.map((e,t)=>this._renderNode(e,t))}
      </div>
    `:k``}_renderNode(e,t){let n=t===0,r=t===this.certs.length-1,i=new Date,a=new Date(e.not_after)<i,o=r?`🔑`:n?`📄`:`🔗`,s=r?`Root CA`:n?`End-entity`:`Intermediate CA`;return k`
      <div class="chain-node">
        <div class="flex items-center gap-3 p-3 rounded-lg bg-base-100 border border-base-300">
          <span class="text-xl">${o}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">${e.subject.common_name??`—`}</div>
            <div class="text-xs text-base-content/50">${s}</div>
          </div>
          ${a?k`<span class="badge badge-error badge-xs">expired</span>`:``}
          ${e.self_signed?k`<span class="badge badge-neutral badge-xs">self-signed</span>`:``}
        </div>
      </div>
    `}};H([B({type:Array})],q.prototype,`certs`,void 0),q=H([z(`cg-chain-graph`)],q);var J=class extends R{constructor(...e){super(...e),this.file=void 0,this._mode=`text`,this._content=``,this._loading=!1}static{this.styles=o`
    :host {
      display: block;
    }
    pre {
      font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `}async updated(e){e.has(`file`)&&this.file&&await this._loadFile(this.file)}render(){return this.file?k`
      <div class="space-y-2">
        <div class="flex gap-1">
          ${[`text`,`hex`,`base64`].map(e=>k`
              <button
                class="btn btn-xs ${this._mode===e?`btn-primary`:`btn-ghost`}"
                @click=${()=>{this._mode=e,this._loadFile(this.file)}}
              >${e}</button>
            `)}
          <span class="ml-auto text-xs text-base-content/40">${this.file.name} (${this.file.size} bytes)</span>
        </div>
        ${this._loading?k`<span class="loading loading-spinner loading-sm"></span>`:k`<pre class="bg-base-200 rounded p-3 max-h-96 overflow-auto">${this._content}</pre>`}
      </div>
    `:k`
        <div class="text-base-content/40 text-sm p-4">
          No file selected.
        </div>
      `}async _loadFile(e){this._loading=!0,this._content=``;try{let t=await e.arrayBuffer(),n=new Uint8Array(t);switch(this._mode){case`text`:this._content=new TextDecoder().decode(n);break;case`hex`:this._content=Array.from(n).map((e,t)=>(t%16==0?`\n${t.toString(16).padStart(6,`0`)}  `:t%8==0?`  `:` `)+e.toString(16).padStart(2,`0`)).join(``).trim();break;case`base64`:this._content=btoa(String.fromCharCode(...n));break}}finally{this._loading=!1}}};H([B({type:Object})],J.prototype,`file`,void 0),H([V()],J.prototype,`_mode`,void 0),H([V()],J.prototype,`_content`,void 0),H([V()],J.prototype,`_loading`,void 0),J=H([z(`cg-raw-decoder`)],J);var Y=class extends R{constructor(...e){super(...e),this.response=void 0,this.filename=``,this.file=void 0,this._tab=`detail`}static{this.styles=o`
    :host {
      display: block;
    }
  `}render(){if(!this.response)return k``;let{type:e,entries:t,issues:n}=this.response;return k`
      <div class="space-y-4">
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="text-lg font-semibold truncate">${this.filename}</h2>
          <span class="badge badge-outline">${e}</span>
          <div class="ml-auto flex gap-2">
            <cg-export-menu .response=${this.response} .filename=${this.filename.replace(/\.[^.]+$/,``)}></cg-export-menu>
          </div>
        </div>

        <div class="tabs tabs-border">
          <button class="tab ${this._tab===`detail`?`tab-active`:``}" @click=${()=>{this._tab=`detail`}}>Detail</button>
          <button class="tab ${this._tab===`raw`?`tab-active`:``}" @click=${()=>{this._tab=`raw`}}>Raw</button>
        </div>

        ${this._tab===`raw`?k`<cg-raw-decoder .file=${this.file}></cg-raw-decoder>`:k`
            ${n.length>0?this._renderIssues(`Top-level issues`,n):``}
            ${t.map((n,r)=>this._renderEntry(e,n,r,t.length))}
          `}
      </div>
    `}_renderEntry(e,t,n,r){let i=r>1?`Entry ${n+1} of ${r}`:void 0;switch(e){case`x509`:case`bundle`:return this._renderX509(t,i);case`csr`:return this._renderCSR(t,i);case`crl`:return this._renderCRL(t,i);case`pkcs7`:return this._renderPKCS7(t,i);case`private_key`:return this._renderPrivateKey(t,i);case`jwk`:return this._renderJWK(t,i);default:return k`<pre class="text-xs overflow-auto">${JSON.stringify(t,null,2)}</pre>`}}_renderX509(e,t){let n=new Date(e.not_after),r=new Date,i=n<r,a=Math.ceil((n.getTime()-r.getTime())/864e5);return k`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${t?k`<p class="text-xs text-base-content/50 uppercase tracking-wider">${t}</p>`:``}
          ${e.self_signed?k`<div class="badge badge-neutral badge-sm">Self-signed</div>`:``}
          ${e.is_ca?k`<div class="badge badge-secondary badge-sm ml-1">CA</div>`:``}

          ${this._section(`Subject`,this._renderName(e.subject))}
          ${this._section(`Issuer`,this._renderName(e.issuer))}

          ${this._section(`Validity`,k`
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span class="text-base-content/50">Not before</span>
              <span>${new Date(e.not_before).toLocaleString()}</span>
              <span class="text-base-content/50">Not after</span>
              <span class="${i?`text-error font-semibold`:a<=30?`text-warning font-semibold`:``}">
                ${new Date(e.not_after).toLocaleString()}
                ${i?`(expired)`:`(${a}d left)`}
              </span>
            </div>
          `)}

          ${this._section(`Public key`,k`
            <span class="text-sm">${e.public_key.algorithm}
              ${e.public_key.key_size?` — ${e.public_key.key_size} bits`:``}
              ${e.public_key.curve?` (${e.public_key.curve})`:``}
            </span>
          `)}

          ${e.sans?this._section(`SANs`,k`
            <div class="flex flex-wrap gap-1">
              ${[...e.sans.dns_names??[],...e.sans.ip_addresses??[],...e.sans.email_addresses??[]].map(e=>k`<span class="badge badge-ghost badge-sm font-mono">${e}</span>`)}
            </div>
          `):``}

          ${this._section(`Fingerprints`,k`
            <div class="space-y-1 text-xs font-mono">
              <div class="flex gap-2 items-center">
                <span class="text-base-content/50 w-14 shrink-0">SHA-256</span>
                <span class="truncate">${e.fingerprints.sha256}</span>
                <cg-copy-button .text=${e.fingerprints.sha256}></cg-copy-button>
              </div>
              <div class="flex gap-2 items-center">
                <span class="text-base-content/50 w-14 shrink-0">SHA-1</span>
                <span class="truncate">${e.fingerprints.sha1}</span>
                <cg-copy-button .text=${e.fingerprints.sha1}></cg-copy-button>
              </div>
            </div>
          `)}

          ${e.key_usage?.length?this._section(`Key usage`,k`
            <div class="flex flex-wrap gap-1">
              ${e.key_usage.map(e=>k`<span class="badge badge-outline badge-sm">${e}</span>`)}
            </div>
          `):``}

          ${e.extended_key_usage?.length?this._section(`Extended key usage`,k`
            <div class="flex flex-wrap gap-1">
              ${e.extended_key_usage.map(e=>k`<span class="badge badge-outline badge-sm">${e}</span>`)}
            </div>
          `):``}

          ${e.revocation?this._section(`Revocation`,k`
            <div class="text-xs space-y-1">
              ${e.revocation.ocsp_servers?.map(e=>k`<div><span class="text-base-content/50">OCSP </span>${e}</div>`)??``}
              ${e.revocation.crl_distribution_points?.map(e=>k`<div><span class="text-base-content/50">CRL DP </span>${e}</div>`)??``}
            </div>
          `):``}

          ${e.issues.length>0?this._renderIssues(`Issues`,e.issues):``}
        </div>
      </div>
    `}_renderCSR(e,t){return k`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${t?k`<p class="text-xs text-base-content/50 uppercase tracking-wider">${t}</p>`:``}
          <div class="badge ${e.signature_valid?`badge-success`:`badge-error`} badge-sm">
            Signature ${e.signature_valid?`valid`:`invalid`}
          </div>
          ${this._section(`Subject`,this._renderName(e.subject))}
          ${this._section(`Public key`,k`<span class="text-sm">${e.public_key.algorithm}${e.public_key.key_size?` — ${e.public_key.key_size} bits`:``}</span>`)}
          ${e.sans?this._section(`SANs`,k`
            <div class="flex flex-wrap gap-1">
              ${[...e.sans.dns_names??[],...e.sans.ip_addresses??[]].map(e=>k`<span class="badge badge-ghost badge-sm font-mono">${e}</span>`)}
            </div>
          `):``}
          ${e.issues.length>0?this._renderIssues(`Issues`,e.issues):``}
        </div>
      </div>
    `}_renderCRL(e,t){return k`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${t?k`<p class="text-xs text-base-content/50 uppercase tracking-wider">${t}</p>`:``}
          ${this._section(`Issuer`,this._renderName(e.issuer))}
          ${this._section(`Validity`,k`
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span class="text-base-content/50">This update</span><span>${new Date(e.this_update).toLocaleString()}</span>
              ${e.next_update?k`<span class="text-base-content/50">Next update</span><span>${new Date(e.next_update).toLocaleString()}</span>`:``}
            </div>
          `)}
          ${this._section(`Revoked`,k`<span class="text-sm">${e.revoked_count} certificate(s)</span>`)}
          ${e.issues.length>0?this._renderIssues(`Issues`,e.issues):``}
        </div>
      </div>
    `}_renderPKCS7(e,t){return k`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${t?k`<p class="text-xs text-base-content/50 uppercase tracking-wider">${t}</p>`:``}
          <span class="badge badge-outline badge-sm">${e.type}</span>

          ${e.certificates.length>1?k`
                <details>
                  <summary class="cursor-pointer text-sm font-medium">Chain of trust (${e.certificates.length} certs)</summary>
                  <div class="mt-2 pl-2">
                    <cg-chain-graph .certs=${e.certificates}></cg-chain-graph>
                  </div>
                </details>
              `:``}

          ${e.certificates.map((e,t)=>this._renderX509(e,`Certificate ${t+1}`))}
          ${e.issues.length>0?this._renderIssues(`Issues`,e.issues):``}
        </div>
      </div>
    `}_renderPrivateKey(e,t){return k`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${t?k`<p class="text-xs text-base-content/50 uppercase tracking-wider">${t}</p>`:``}
          ${this._section(`Algorithm`,k`
            <span class="text-sm">${e.algorithm}
              ${e.key_size?` — ${e.key_size} bits`:``}
              ${e.curve?` (${e.curve})`:``}
            </span>
          `)}
          ${this._section(`Encrypted`,k`
            <span class="badge ${e.encrypted?`badge-warning`:`badge-ghost`} badge-sm">
              ${e.encrypted?`Yes`:`No`}
            </span>
          `)}
          ${e.issues.length>0?this._renderIssues(`Issues`,e.issues):``}
        </div>
      </div>
    `}_renderJWK(e,t){return k`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${t?k`<p class="text-xs text-base-content/50 uppercase tracking-wider">${t}</p>`:``}
          ${this._section(`Key type`,k`<span class="text-sm font-mono">${e.key_type}</span>`)}
          ${e.algorithm?this._section(`Algorithm`,k`<span class="text-sm">${e.algorithm}</span>`):``}
          ${e.key_id?this._section(`Key ID`,k`<span class="text-sm font-mono">${e.key_id}</span>`):``}
          ${e.key_size?this._section(`Key size`,k`<span class="text-sm">${e.key_size} bits</span>`):``}
          ${e.curve?this._section(`Curve`,k`<span class="text-sm">${e.curve}</span>`):``}
          ${e.issues.length>0?this._renderIssues(`Issues`,e.issues):``}
        </div>
      </div>
    `}_section(e,t){return k`
      <div>
        <dt class="text-xs text-base-content/50 uppercase tracking-wider mb-1">${e}</dt>
        <dd>${t}</dd>
      </div>
    `}_renderName(e){return k`<span class="text-sm">${[e.common_name,e.organization?.join(`, `),e.organizational_unit?.join(`, `),e.country?.join(`, `)].filter(Boolean).join(` / `)||`—`}</span>`}_renderIssues(e,t){return k`
      <div>
        <dt class="text-xs text-base-content/50 uppercase tracking-wider mb-1">${e}</dt>
        <dd class="space-y-1">
          ${t.map(e=>k`
            <div class="alert alert-${e.severity===`error`?`error`:e.severity===`warning`?`warning`:`info`} py-2 px-3 text-sm">
              <span class="font-mono font-semibold">[${e.code}]</span> ${e.message}
            </div>
          `)}
        </dd>
      </div>
    `}};H([B({type:Object})],Y.prototype,`response`,void 0),H([B({type:String})],Y.prototype,`filename`,void 0),H([B({type:Object})],Y.prototype,`file`,void 0),H([V()],Y.prototype,`_tab`,void 0),Y=H([z(`cg-cert-detail`)],Y);var X=class extends R{constructor(...e){super(...e),this.entry=void 0}static{this.styles=o`
    :host {
      display: block;
    }
  `}render(){if(!this.entry)return k`
        <div class="flex items-center justify-center h-full text-base-content/30 text-sm">
          Select a file from the list to see details.
        </div>
      `;let{status:e,error:t,result:n}=this.entry;return e===`loading`?k`
        <div class="flex items-center justify-center h-full gap-2 text-base-content/50">
          <span class="loading loading-spinner loading-md"></span>
          Analysing…
        </div>
      `:e===`error`||!n?k`
        <div class="p-6">
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${t??`Unknown error`}</span>
          </div>
        </div>
      `:k`
      <div class="p-4">
        <cg-cert-detail .response=${n} .filename=${this.entry.file.name} .file=${this.entry.file}></cg-cert-detail>
      </div>
    `}};H([B({type:Object})],X.prototype,`entry`,void 0),X=H([z(`cg-detail-panel`)],X);var Z=class extends R{constructor(...e){super(...e),this._value=``}static{this.styles=o`
    :host {
      display: block;
    }
  `}render(){return k`
      <dialog class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Password required</h3>
          <p class="py-2 text-sm text-base-content/70">
            This file appears to be encrypted. Enter the password to decrypt it.
          </p>
          <input
            type="password"
            class="input input-bordered w-full"
            placeholder="Password"
            .value=${this._value}
            @input=${e=>{this._value=e.target.value}}
            @keydown=${this._onKeyDown}
            autofocus
          />
          <div class="modal-action">
            <button class="btn btn-ghost" @click=${this._cancel}>Cancel</button>
            <button class="btn btn-primary" @click=${this._submit}>Unlock</button>
          </div>
        </div>
        <div class="modal-backdrop bg-base-300/50" @click=${this._cancel}></div>
      </dialog>
    `}_onKeyDown(e){e.key===`Enter`&&this._submit(),e.key===`Escape`&&this._cancel()}_submit(){this.dispatchEvent(new CustomEvent(`password-submit`,{detail:this._value,bubbles:!0,composed:!0})),this._value=``}_cancel(){this.dispatchEvent(new CustomEvent(`password-cancel`,{bubbles:!0,composed:!0})),this._value=``}};H([V()],Z.prototype,`_value`,void 0),Z=H([z(`cg-password-dialog`)],Z);var Q=class extends R{constructor(...e){super(...e),this.left=void 0,this.right=void 0}static{this.styles=o`
    :host {
      display: block;
    }
    .diff-added {
      background-color: oklch(var(--su) / 0.15);
    }
    .diff-removed {
      background-color: oklch(var(--er) / 0.15);
    }
    .diff-same {
      opacity: 0.6;
    }
  `}render(){if(!this.left||!this.right)return k`
        <div class="text-base-content/40 text-sm p-4">
          Select two certificates to compare.
        </div>
      `;let e=this._buildRows(this.left,this.right);return k`
      <div class="overflow-x-auto text-sm">
        <table class="table table-xs w-full">
          <thead>
            <tr>
              <th class="w-32">Field</th>
              <th>${this.left.subject.common_name??`Left`}</th>
              <th>${this.right.subject.common_name??`Right`}</th>
            </tr>
          </thead>
          <tbody>
            ${e.map(({label:e,l:t,r:n})=>{let r=t===n;return k`
                <tr class="${r?`diff-same`:``}">
                  <td class="font-medium text-base-content/60">${e}</td>
                  <td class="${r?``:`diff-removed`} font-mono break-all">${t}</td>
                  <td class="${r?``:`diff-added`} font-mono break-all">${n}</td>
                </tr>
              `})}
          </tbody>
        </table>
      </div>
    `}_buildRows(e,t){return[{label:`Subject CN`,l:e.subject.common_name??`—`,r:t.subject.common_name??`—`},{label:`Issuer CN`,l:e.issuer.common_name??`—`,r:t.issuer.common_name??`—`},{label:`Serial`,l:e.serial_number,r:t.serial_number},{label:`Not before`,l:new Date(e.not_before).toISOString(),r:new Date(t.not_before).toISOString()},{label:`Not after`,l:new Date(e.not_after).toISOString(),r:new Date(t.not_after).toISOString()},{label:`Key algo`,l:e.public_key.algorithm,r:t.public_key.algorithm},{label:`Key size`,l:String(e.public_key.key_size??`—`),r:String(t.public_key.key_size??`—`)},{label:`Sig algo`,l:e.signature.algorithm,r:t.signature.algorithm},{label:`Is CA`,l:String(e.is_ca),r:String(t.is_ca)},{label:`Self-signed`,l:String(e.self_signed),r:String(t.self_signed)},{label:`SHA-256`,l:e.fingerprints.sha256,r:t.fingerprints.sha256},{label:`SHA-1`,l:e.fingerprints.sha1,r:t.fingerprints.sha1}]}};H([B({type:Object})],Q.prototype,`left`,void 0),H([B({type:Object})],Q.prototype,`right`,void 0),Q=H([z(`cg-diff-view`)],Q);var $=class extends R{constructor(...e){super(...e),this.files=[],this.selectedId=null,this.passwordPromptId=null}static{this.styles=o`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }
  `}get selected(){return this.files.find(e=>e.id===this.selectedId)}render(){return k`
      <cg-header
        @files-dropped=${this._onFilesDropped}
      ></cg-header>

      <div class="flex flex-1 overflow-hidden">
        <cg-file-list
          .files=${this.files}
          .selectedId=${this.selectedId}
          @file-selected=${this._onFileSelected}
          @file-removed=${this._onFileRemoved}
          class="w-72 shrink-0 border-r border-base-300 overflow-y-auto"
        ></cg-file-list>

        <cg-detail-panel
          .entry=${this.selected}
          class="flex-1 overflow-y-auto"
        ></cg-detail-panel>
      </div>

      ${this.passwordPromptId?k`
            <cg-password-dialog
              @password-submit=${this._onPasswordSubmit}
              @password-cancel=${this._onPasswordCancel}
            ></cg-password-dialog>
          `:``}
    `}_onFilesDropped(e){let t=Array.from(e.detail).map(e=>({id:crypto.randomUUID(),file:e,status:`pending`}));this.files=[...this.files,...t];for(let e of t)this._analyze(e.id)}_onFileSelected(e){this.selectedId=e.detail}_onFileRemoved(e){this.files=this.files.filter(t=>t.id!==e.detail),this.selectedId===e.detail&&(this.selectedId=this.files[0]?.id??null)}_onPasswordSubmit(e){let t=this.passwordPromptId;this.passwordPromptId=null,t&&(this._updateEntry(t,{password:e.detail}),this._analyze(t,e.detail))}_onPasswordCancel(){let e=this.passwordPromptId;this.passwordPromptId=null,e&&this._updateEntry(e,{status:`error`,error:`Password required but not provided.`})}async _analyze(e,t){let n=this.files.find(t=>t.id===e);if(n){this._updateEntry(e,{status:`loading`});try{let r=await ke(n.file,t);this._updateEntry(e,{status:`done`,result:r}),this.selectedId===null&&(this.selectedId=e)}catch(t){let n=t instanceof Error?t.message:String(t);n.toLowerCase().includes(`decryption`)||n.toLowerCase().includes(`password`)?(this.passwordPromptId=e,this._updateEntry(e,{status:`pending`})):this._updateEntry(e,{status:`error`,error:n})}}}_updateEntry(e,t){this.files=this.files.map(n=>n.id===e?{...n,...t}:n)}};H([V()],$.prototype,`files`,void 0),H([V()],$.prototype,`selectedId`,void 0),H([V()],$.prototype,`passwordPromptId`,void 0),$=H([z(`cg-app`)],$);