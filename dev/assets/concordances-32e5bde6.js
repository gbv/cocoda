import{H as h,n as u,T as g,J as m,p as f,a as w,o as y,c as _,_ as c,N as v,g as d,P as b,s as $,l as C,V as M,Q as x,S as B,U as I}from"./main-af57085a.js";function T(){import.meta.url,import("_").catch(()=>1);async function*t(){}}h.ElementQueries.listen();const P={name:"ConcordanceApp",components:{TheNavbar:g,MappingBrowser:m,LoadingIndicatorFull:f},mixins:[w,y,_],data(){return{loaded:!1,loading:!1,loadFromParametersOnce:c.once(this.loadFromParameters)}},computed:{locale(){return this.$i18n.locale},settingsLocale(){return"en"}},watch:{locale(t,e){t!=e&&(this.$store.commit({type:"settings/set",prop:"locale",value:t}),c.delay(()=>{this.insertPrefLabel(!0),this.insertPrefLabel(!1)},300))},settingsLocale(t){t!=this.locale&&(this.$i18n.locale=t)}},created(){this.load()},methods:{async load(){const t=new Date;this.loadingGlobal=!0,await this.$store.dispatch("loadConfig",c.get(this.$route,"query.config")),await this.$store.dispatch("settings/load"),document.title=this.config.title,this.$i18n.locale=this.settingsLocale,await v(),this.loaded=!0,this.loadingGlobal=!1,this.loadFromParametersOnce(!0);for(let e of this.config.registries)c.isArray(e.schemes)&&(e._jskos.schemes=e.schemes.map(s=>d(s)||s));this.$log.log(`Application loaded in ${(new Date-t)/1e3} seconds.`)},async loadFromParameters(t=!1){this.loading=!0;const e=this.$route.query,s={scheme:{true:e.fromScheme,false:e.toScheme},concept:{true:e.from,false:e.to}},i=async a=>{let o=s.scheme[a],n=null;o&&(n=d({uri:o}));let l=null;n&&s.concept[a]&&(l=$({uri:s.concept[a]},{scheme:n,type:"concept"}));try{await this.setSelected({concept:l,scheme:n,isLeft:a,noQueryRefresh:!0,noLoading:!0})}catch(r){this.$log.warn(r)}},p=async()=>{if(e.mapping||e.mappingUri||e.mappingIdentifier){let a=null;if(e.mapping)try{a=this.adjustMapping(this.$jskos.normalize(JSON.parse(e.mapping)))}catch(r){this.$log.warn("Error decoding mapping from URL parameter:",r)}c.isEqual(a,{})&&(a=null);let o=[];try{e.mappingUri?o.push(await this.getMapping({uri:e.mappingUri})):e.mappingIdentifier&&(o=await this.getMappings({identifier:e.mappingIdentifier}))}catch(r){this.$log.warn("Error loading mapping from URL parameter:",r)}o=o.filter(Boolean);let n=a,l=null;o.length&&(l=o.find(r=>c.get(r,"_registry").isAuthorizedFor&&c.get(r,"_registry").isAuthorizedFor({type:"mappings",action:"create",user:this.user}))||o[0],n=n||this.adjustMapping(this.$jskos.copyDeep(l))),this.$store.commit({type:"mapping/set",mapping:n,original:l,noQueryRefresh:!0}),C(this.$jskos.conceptsOfMapping(n)),n&&t&&(this.forceMappingBrowser=!0)}};if(await Promise.all([i(!0),i(!1),p()]),this.loading=!1,b(this.$store),t)if(e.search){let a=JSON.parse(e.search);this.forceMappingBrowser=!0,this.searchMappings(a)}else e.concordances!==void 0?this.showConcordances():(e.mappingUri||e.mappingIdentifier)&&(this.forceMappingBrowser=!0,this.searchMappings())},searchMappings(t){let e=this.$refs.mappingBrowser;e&&e.searchWithParams&&e.searchWithParams(t)},showMappingSearch(){this.forceMappingBrowser=!0,this.searchMappings({})},showConcordances(){let t=this.$refs.mappingBrowser;if(!t){this.$log.warn("Could not show concordances because MappingBrowser component was not found.");return}if(t.concordancesLoaded)t.tabIndexes.concordances!=null&&(this.forceMappingBrowser=!0,t.tab=t.tabIndexes.concordances);else{this.loadingGlobal=!0;let e;e=this.$watch(()=>t.concordancesLoaded,()=>{this.loadingGlobal=!1,t.tabIndexes.concordances!=null&&(this.forceMappingBrowser=!0,t.tab=t.tabIndexes.concordances),e&&e()})}}}};var S=function(){var e=this,s=e._self._c;return s("div",{staticClass:"font-default",attrs:{id:"concordanceApp"}},[s("div",{staticClass:"alertsContainer"},e._l(e.$store.state.alerts.alerts,function(i,p){return s("b-alert",{key:p,staticStyle:{display:"flex"},attrs:{variant:i.variant,show:i.countdown||!i.shouldCountdown,dismissible:!i.shouldCountdown,fade:""},on:{dismissed:function(a){return e.$store.commit({type:"alerts/setCountdown",alert:i,countdown:0})},"dismiss-count-down":function(a){return e.$store.commit({type:"alerts/setCountdown",alert:i,countdown:a})}}},[s("div",{staticStyle:{flex:"1"},domProps:{innerHTML:e._s(i.text)}}),i.buttonText?s("div",{staticClass:"fontWeight-heavy"},[s("a",{attrs:{href:""},domProps:{innerHTML:e._s(i.buttonText)},on:{click:function(a){return a.preventDefault(),i.buttonHandler(i,a)}}})]):e._e()])}),1),e.loadingGlobal||e.loading?s("loading-indicator-full"):e._e(),e.loaded?[s("the-navbar",{ref:"navbar",attrs:{title:"Concordances",reduced:!0}}),s("div",{staticClass:"main"},[s("div",{staticClass:"flexbox-row"},[s("div",{staticClass:"mappingTool order3",attrs:{id:"mappingTool"}},[s("div",{staticClass:"mappingToolItem mainComponent visualComponent",attrs:{id:"mappingBrowserComponent"}},[s("mapping-browser",{ref:"mappingBrowser",attrs:{"show-navigator":!1,"show-editing-tools":!1,"show-registry-override":["http://coli-conc.gbv.de/registry/coli-conc-mappings"],"show-cocoda-link":!0}})],1)])])])]:e._e()],2)},A=[],F=u(P,S,A,!1,null,null,null,null);const L=F.exports;new M({store:x,router:B,i18n:I,render:t=>t(L)}).$mount("#concordanceApp");export{T as __vite_legacy_guard};