/*! Built with http://stenciljs.com */
bscomponents.loadBundle("pldrmqwy",["exports","./chunk-9a7c85d5.js","./chunk-f368f5fe.js","./chunk-58f2da0d.js","./chunk-2b70ff0d.js","./chunk-d5fd96a2.js","./chunk-40b3ad27.js","./chunk-6b186b1d.js","./chunk-9c17fce8.js","./chunk-f48e1aa7.js"],function(e,t,l,o,a,s,n,r,i,c){var d=window.bscomponents.h,p=function(e){e=t.toString(e);var l=t.hasUnicode(e)?t.stringToArray(e):void 0,o=l?l[0]:e.charAt(0),a=l?t.castSlice(l,1).join(""):e.slice(1);return o.toUpperCase()+a},g=t.overArg(Object.getPrototypeOf,Object),h=Function.prototype,u=Object.prototype,f=h.toString,v=u.hasOwnProperty,m=f.call(Object),E=function(e){return t.isObjectLike(e)&&1===e.nodeType&&!function(e){if(!t.isObjectLike(e)||"[object Object]"!=t.baseGetTag(e))return!1;var l=g(e);if(null===l)return!0;var o=v.call(l,"constructor")&&l.constructor;return"function"==typeof o&&o instanceof o&&f.call(o)==m}(e)},T=function(){function e(){this.showEventName="show.bs.collapse",this.shownEventName="shown.bs.collapse",this.hideEventName="hide.bs.collapse",this.hiddenEventName="hidden.bs.collapse"}return e.prototype.componentDidUnload=function(){this.relatedTarget=null},e.prototype.getConfig=function(e,a){void 0===e&&(e={}),void 0===a&&(a=null);var s={};return s.relatedTarget=a,!0===e.toggle?s.toggle="toggle":!1===e.toggle?!0===this.thisCollapseIsShown()?s.toggle="show":s.toggle="hide":s.toggle=l._get(e,"toggle","toggle"),s.ignoreAccordion=l._get(e,"ignoreAccordion",!1),s.ignoreDataToggles=l._get(e,"ignoreDataToggles",!1),s.collapseElPlannedToBeOpened=[],s.collapseElPlannedToBeClosed=[],o._has(e,"target")?s.targetSelector=e.target:a&&o._has(a.dataset,"target")&&(s.targetSelector=a.dataset.target),o._has(e,"parent")&&E(e.parent)?s.parent=e.parent:o._has(e,"parent")&&"string"==typeof e.parent&&t._size(e.parent)>1?s.parent=e.parent:o._has(this.collapseEl.dataset,"parent")&&(s.parent=this.collapseEl.dataset.parent),s},e.prototype.closeOtherOpenAccordions=function(e){for(var t=0,l=e.collapseElPlannedToBeClosed.length;t<l;t+=1)e.collapseElPlannedToBeClosed[t].collapse&&!this.collapseEl.isEqualNode(e.collapseElPlannedToBeClosed[t])?e.collapseElPlannedToBeClosed[t].collapse({toggle:"hide",ignoreAccordion:!0,ignoreDataToggles:!0}):console.error('Unable to toggle collapse for all targets due to unavailable bs-collapse method "collapse')},e.handleToggleDataToggles=function(e){for(var l=Array.prototype.slice.call(document.querySelectorAll('[data-toggle="collapse"]')),o=0,s=l.length;o<s;o+=1){var n=i.getTargetSelector(l[o]),c=!1;if(t._size(n)>0){for(var d=0,p=e.collapseElPlannedToBeOpened.length;d<p;d+=1)!0===r.elementMatches(e.collapseElPlannedToBeOpened[d],n)&&!1===c&&(t.removeClass(l[o],"collapsed"),l[o].setAttribute("aria-expanded","true"),c=!0);if(!1===c)for(d=0,p=e.collapseElPlannedToBeClosed.length;d<p;d+=1)if(!0===r.elementMatches(e.collapseElPlannedToBeClosed[d],n)){var g=document.querySelectorAll(n+".show");0===t._size(g)&&(a.addClass(l[o],"collapsed"),l[o].setAttribute("aria-expanded","false"))}}}},e.prototype.thisCollapseIsShown=function(){return t.hasClass(this.collapseEl,"show")||t.hasClass(this.collapseEl,"collapsing")},e.prototype.handleToggle=function(e){if(o._has(e,"parent")&&!0!==e.ignoreAccordion){var l=void 0;if(E(e.parent)?l=e.parent:(l=document.querySelector(e.parent))||console.warn('unable to find accordion parent by selector: "'+e.parent+'"'),l)for(var a=Array.prototype.slice.call(l.querySelectorAll(".collapse")),s=0,n=a.length;s<n;s+=1)t.hasClass(a[s],"show")&&r.elementMatches(l,a[s].dataset.parent)&&e.collapseElPlannedToBeClosed.push(a[s])}return"show"===e.toggle?(e.collapseElPlannedToBeOpened.push(this.collapseEl),void this.showCollapse(this.collapseEl,e)):"hide"===e.toggle?(e.collapseElPlannedToBeClosed.push(this.collapseEl),void this.hideCollapse(this.collapseEl,e)):this.thisCollapseIsShown()?(e.collapseElPlannedToBeClosed.push(this.collapseEl),void this.hideCollapse(this.collapseEl,e)):(e.collapseElPlannedToBeOpened.push(this.collapseEl),void this.showCollapse(this.collapseEl,e))},e.prototype.showCollapse=function(l,o){var n=this;if(!t.hasClass(l,"show")&&!t.hasClass(l,"collapsing")&&!t.customEvent(l,this.showEventName,{},o.relatedTarget).defaultPrevented){var r=e.getDimension(l),i="scroll"+p(r);a.addClass(l,"collapsing"),t.removeClass(l,"collapse"),!0!==o.ignoreAccordion&&this.closeOtherOpenAccordions(o),!0!==o.ignoreDataToggles&&e.handleToggleDataToggles(o);var c=s.getTransitionDurationFromElement(l);setTimeout(function(){t.removeClass(l,"collapsing"),a.addClass(l,"collapse"),a.addClass(l,"show"),l.style[r]="",o.relatedTarget&&(n.relatedTarget=o.relatedTarget),t.customEvent(l,n.shownEventName,{},o.relatedTarget)},c),l.style[r]=l[i]+"px"}},e.prototype.hideCollapse=function(l,o){var r=this;if(t.hasClass(l,"show")&&!t.customEvent(l,this.hideEventName,{},this.relatedTarget).defaultPrevented){var i=e.getDimension(l);l.style[i]=l.getBoundingClientRect()[i]+"px",n.reflow(l),a.addClass(l,"collapsing"),t.removeClass(l,"collapse"),t.removeClass(l,"show"),l.style[i]="",!0!==o.ignoreDataToggles&&e.handleToggleDataToggles(o);var c=s.getTransitionDurationFromElement(l);setTimeout(function(){t.removeClass(l,"collapsing"),a.addClass(l,"collapse"),t.customEvent(l,r.hiddenEventName,{},r.relatedTarget),r.relatedTarget=null},c)}},e.getDimension=function(e){return t.hasClass(e,"width")?"width":"height"},e.prototype.collapse=function(e,l){if(void 0===l&&(l=null),0===t._size(e))return this.collapseEl;if("toggle"===e)return this.handleToggle(this.getConfig({toggle:"toggle"},l)),!0;if("show"===e)return this.handleToggle(this.getConfig({toggle:"show"},l)),!0;if("hide"===e)return this.handleToggle(this.getConfig({toggle:"hide"},l)),!0;if("string"==typeof e)throw new Error('No method named "'+e+'"');return"object"==typeof e?(this.handleToggle(this.getConfig(e,l)),!0):null},e.prototype.render=function(){return d("slot",null)},Object.defineProperty(e,"is",{get:function(){return"bs-collapse"},enumerable:!0,configurable:!0}),Object.defineProperty(e,"properties",{get:function(){return{collapse:{method:!0},collapseEl:{elementRef:!0},hiddenEventName:{type:String,attr:"hidden-event-name"},hideEventName:{type:String,attr:"hide-event-name"},relatedTarget:{state:!0},showEventName:{type:String,attr:"show-event-name"},shownEventName:{type:String,attr:"shown-event-name"}}},enumerable:!0,configurable:!0}),Object.defineProperty(e,"style",{get:function(){return"bs-collapse{display:block}"},enumerable:!0,configurable:!0}),e}();e.BsCollapse=T,Object.defineProperty(e,"__esModule",{value:!0})});