import{y as m,n as g,T as f,z as w,j as y,a as v,o as _,c as b,_ as c,E as $,g as d,G as C,s as M,l as x,H as B,J as I,K as P,N as S,O as A,P as j}from"./main.ad323e42.js";var F=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{staticClass:"font-default",attrs:{id:"concordanceApp"}},[s("div",{staticClass:"alertsContainer"},e._l(e.$store.state.alerts.alerts,function(i,p){return s("b-alert",{key:p,staticStyle:{display:"flex"},attrs:{variant:i.variant,show:i.countdown||!i.shouldCountdown,dismissible:!i.shouldCountdown,fade:""},on:{dismissed:function(a){return e.$store.commit({type:"alerts/setCountdown",alert:i,countdown:0})},"dismiss-count-down":function(a){return e.$store.commit({type:"alerts/setCountdown",alert:i,countdown:a})}}},[s("div",{staticStyle:{flex:"1"},domProps:{innerHTML:e._s(i.text)}}),i.buttonText?s("div",{staticClass:"fontWeight-heavy"},[s("a",{attrs:{href:""},domProps:{innerHTML:e._s(i.buttonText)},on:{click:function(a){return a.preventDefault(),i.buttonHandler(i,a)}}})]):e._e()])}),1),e.loadingGlobal||e.loading?s("loading-indicator-full"):e._e(),e.loaded?[s("the-navbar",{ref:"navbar",attrs:{title:"Concordances",reduced:!0}}),s("div",{staticClass:"main"},[s("div",{staticClass:"flexbox-row"},[s("div",{staticClass:"mappingTool order3",attrs:{id:"mappingTool"}},[s("div",{staticClass:"mappingToolItem mainComponent visualComponent",attrs:{id:"mappingBrowserComponent"}},[s("mapping-browser",{ref:"mappingBrowser",attrs:{"show-navigator":!1,"show-editing-tools":!1,"show-registry-override":["http://coli-conc.gbv.de/registry/coli-conc-mappings"],"show-cocoda-link":!0}})],1)])])])]:e._e()],2)},L=[];m.ElementQueries.listen();const T={name:"ConcordanceApp",components:{TheNavbar:f,MappingBrowser:w,LoadingIndicatorFull:y},mixins:[v,_,b],data(){return{loaded:!1,loading:!1,loadFromParametersOnce:c.once(this.loadFromParameters)}},computed:{locale(){return this.$i18n.locale},settingsLocale(){return"en"}},watch:{locale(e,t){e!=t&&(this.$store.commit({type:"settings/set",prop:"locale",value:e}),c.delay(()=>{this.insertPrefLabel(!0),this.insertPrefLabel(!1)},300))},settingsLocale(e){e!=this.locale&&(this.$i18n.locale=e)}},created(){this.load()},methods:{async load(){const e=new Date;this.loadingGlobal=!0,await this.$store.dispatch("loadConfig",c.get(this.$route,"query.config")),await this.$store.dispatch("settings/load"),document.title=this.config.title,this.$i18n.locale=this.settingsLocale,await $(),this.loaded=!0,this.loadingGlobal=!1,this.loadFromParametersOnce(!0);for(let t of this.config.registries)c.isArray(t.schemes)&&(t._jskos.schemes=t.schemes.map(s=>d(s)||s));this.$log.log(`Application loaded in ${(new Date-e)/1e3} seconds.`)},async loadFromParameters(e=!1){this.loading=!0;const t=this.$route.query,s={scheme:{true:t.fromScheme,false:t.toScheme},concept:{true:t.from,false:t.to}},i=async a=>{let o=s.scheme[a],n=null;o&&(n=d({uri:o}));let l=null;n&&s.concept[a]&&(l=M({uri:s.concept[a]},{scheme:n,type:"concept"}));try{await this.setSelected({concept:l,scheme:n,isLeft:a,noQueryRefresh:!0,noLoading:!0})}catch(r){this.$log.warn(r)}},p=async()=>{if(t.mapping||t.mappingUri||t.mappingIdentifier){let a=null;if(t.mapping)try{a=this.adjustMapping(this.$jskos.normalize(JSON.parse(t.mapping)))}catch(r){this.$log.warn("Error decoding mapping from URL parameter:",r)}c.isEqual(a,{})&&(a=null);let o=[];try{t.mappingUri?o.push(await this.getMapping({uri:t.mappingUri})):t.mappingIdentifier&&(o=await this.getMappings({identifier:t.mappingIdentifier}))}catch(r){this.$log.warn("Error loading mapping from URL parameter:",r)}o=o.filter(Boolean);let n=a,l=null;o.length&&(l=o.find(r=>c.get(r,"_registry").isAuthorizedFor&&c.get(r,"_registry").isAuthorizedFor({type:"mappings",action:"create",user:this.user}))||o[0],n=n||this.adjustMapping(this.$jskos.copyDeep(l))),this.$store.commit({type:"mapping/set",mapping:n,original:l,noQueryRefresh:!0}),x(this.$jskos.conceptsOfMapping(n)),n&&e&&(this.forceMappingBrowser=!0)}};if(await Promise.all([i(!0),i(!1),p()]),this.loading=!1,C(this.$store),e)if(t.search){let a=JSON.parse(t.search);this.forceMappingBrowser=!0,this.searchMappings(a)}else t.concordances!==void 0?this.showConcordances():(t.mappingUri||t.mappingIdentifier)&&(this.forceMappingBrowser=!0,this.searchMappings())},searchMappings(e){let t=this.$refs.mappingBrowser;t&&t.searchWithParams&&t.searchWithParams(e)},showMappingSearch(){this.forceMappingBrowser=!0,this.searchMappings({})},showConcordances(){let e=this.$refs.mappingBrowser;if(!e){this.$log.warn("Could not show concordances because MappingBrowser component was not found.");return}if(e.concordancesLoaded)e.tabIndexes.concordances!=null&&(this.forceMappingBrowser=!0,e.tab=e.tabIndexes.concordances);else{this.loadingGlobal=!0;let t;t=this.$watch(()=>e.concordancesLoaded,()=>{this.loadingGlobal=!1,e.tabIndexes.concordances!=null&&(this.forceMappingBrowser=!0,e.tab=e.tabIndexes.concordances),t&&t()})}}}},h={};var E=g(T,F,L,!1,k,null,null,null);function k(e){for(let t in h)this[t]=h[t]}var O=function(){return E.exports}();const u=B({store:P,router:S,i18n:A,render:()=>j(O)});I(u);u.mount("#concordanceApp");