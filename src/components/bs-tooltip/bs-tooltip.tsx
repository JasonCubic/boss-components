import { Component, Prop, Element, Method, State, Watch } from '@stencil/core';

import Popper from 'popper.js';

import _size from 'lodash/size';
import _get from 'lodash/get';
import _split from 'lodash/split';
import _toLower from 'lodash/toLower';
import _has from 'lodash/has';
import _toInteger from 'lodash/toInteger';
import _isNaN from 'lodash/isNaN';
import _toString from 'lodash/toString';
import _isNumber from 'lodash/isNumber';
import _includes from 'lodash/includes';
import _intersection from 'lodash/intersection';
import _trim from 'lodash/trim';
import _isInteger from 'lodash/isInteger';
import _isObject from 'lodash/isObject';
import _isString from 'lodash/isString';

import getTransitionDurationFromElement from '../../utilities/get-transition-duration-from-element';
import closest from '../../utilities/closest';
import hasClass from '../../utilities/has-class';
import removeClass from '../../utilities/remove-class';
import addClass from '../../utilities/add-class';
import customEvent from '../../utilities/custom-event';
import getConfigBoolean from '../../utilities/get-config-boolean';
import parseJson from '../../utilities/parse-json';
import getUniqueId from '../../utilities/get-unique-id';

// TODO: what is the selector data option for?
@Component({
  tag: 'bs-tooltip',
  shadow: false
})
export class BsTooltip {
  @Element() tooltipEl: HTMLElement;

  @Prop() noEnableOnLoad: boolean = false;

  @Prop() showEventName: string = 'show.bs.tooltip';
  @Prop() shownEventName: string = 'shown.bs.tooltip';
  @Prop() hideEventName: string = 'hide.bs.tooltip';
  @Prop() hiddenEventName: string = 'hidden.bs.tooltip';
  @Prop() insertedEventName: string = 'inserted.bs.tooltip';

  // @Prop({ mutable: true, reflectToAttr: true }) tooltipContent: string = '';
  @Prop({ mutable: true }) bsContent: string = '';
  @Prop({ mutable: true }) bsTitle: string = '';

  @Prop({ mutable: true }) defaults = {
    animation: true,
    template: '<div class="tooltip" role="tooltip">' + '<div class="arrow"></div>' + '<div class="tooltip-inner"></div></div>',
    popoverTemplate: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
    trigger: 'hover focus',
    popoverTrigger: 'click',
    title: '',
    delay: 0,
    html: false,
    selector: false,
    placement: 'top',
    popoverPlacement: 'right',
    offset: 0,
    container: false,
    fallbackPlacement: 'flip',
    boundary: 'scrollParent',
    disposeTimeToWait: 0,
    toggle: 'tooltip',
    content: '',
  };

  @State() config: any;
  @State() isEnabled: boolean;
  @State() activeTrigger: any;
  @State() tooltipId: string;
  @State() tip: HTMLElement;
  @State() popperHandle: any;
  @State() hoverState: string;
  @State() timeout: any;
  @State() disposeTimeout: any;

  componentDidLoad() {
    const currentTabIndex = this.tooltipEl.getAttribute('tabindex');
    if (_size(currentTabIndex) === 0) {
       // without tabindex the bs-tooltip can not receive focus
      this.tooltipEl.setAttribute('tabindex', '0');
    }
    if (!this.noEnableOnLoad && !this.isEnabled) {
      this.enableTooltip();
    }
  }

  componentDidUnload() {
    this.disableTooltip();
  }

  enableTooltip(overrideConfig:any = {}) {
    this.isEnabled = true;
    this.activeTrigger = {};
    this.hoverState = '';
    this.tooltipId = getUniqueId('tooltip');
    this.tooltipEl.dataset.bsId = this.tooltipId;
    this.tip = null;
    this.getConfig(overrideConfig);
    this.setListeners();
  }

  disableTooltip() {
    this.isEnabled = false;
    clearTimeout(this.timeout);
    this.tooltipEl.removeEventListener('click', this.handleClickTrigger);
    this.tooltipEl.removeEventListener('mouseenter', this.handleMouseEnter);
    this.tooltipEl.removeEventListener('mouseleave', this.handleMouseLeave);
    this.tooltipEl.removeEventListener('focusin', this.handleFocusIn);
    this.tooltipEl.removeEventListener('focusout', this.handleFocusOut);
    const originalTitle = this.tooltipEl.dataset.originalTitle;
    if (_size(originalTitle) > 0) {
      this.tooltipEl.title = originalTitle;
    }
    const closestModal = closest(this.tooltipEl, '.modal');
    if (closestModal) {
      const modalHideEventName = closestModal.hideEventName;
      if (modalHideEventName) {
        closestModal.removeEventListener(closestModal.hideEventName, this.handleModalHide);
      }
    }
    this.activeTrigger = {};
    this.hoverState = '';
    clearTimeout(this.disposeTimeout);
    this.removeTooltipFromDom();
  }

  makeTip() {
    const container = !this.config.container ? document.body : document.querySelector(this.config.container);
    const template = document.createElement('template');
    template.innerHTML = _trim(this.config.template);
    // const innerTemplateTooltip = template.content.firstChild;
    // if (innerTemplateTooltip) {
    //   innerTemplateTooltip.setAttribute('id', this.tooltipId);
    // }
    const tip = template.content.firstChild;
    const att = document.createAttribute('id');
    att.value = this.tooltipId;
    (tip as any).setAttributeNode(att);
    const tipThatIsAlreadyInTheDom = document.getElementById(this.tooltipId)
    if (!tipThatIsAlreadyInTheDom) {
      const newTip = container.appendChild(tip);
      return newTip;
    }
    return tipThatIsAlreadyInTheDom;
  }

  getTipElement() {
    clearTimeout(this.disposeTimeout);
    this.tip = this.tip || this.makeTip();
    return this.tip;
  };

  toggle(event: any = null) {
    if (!this.isEnabled) {
      return;
    }
    if (event) {
      this.activeTrigger.click = !this.activeTrigger.click;
      if (this.isWithActiveTrigger()) {
        this.enter();
      } else {
        this.leave();
      }
    } else {
      if (this.tipHasClass('show')) {
        this.leave();
      } else {
        this.enter();
      }
    }
  }

  isWithActiveTrigger() {
    for (const trigger in this.activeTrigger) {
      if (this.activeTrigger[trigger]) {
        return true;
      }
    }
    return false;
  };

  tipHasClass(className) {
    if (!this.tip) {
      return false;
    }
    return hasClass(this.tip, className);
  }

  enter(event: any = null) {
    if (event) {
      if (event.type === 'focusin') {
        this.activeTrigger.focus = true;
      } else {
        this.activeTrigger.hover = true;
      }
    }

    if (this.tipHasClass('show') || this.hoverState === 'show') {
      this.hoverState = 'show';
      return;
    }

    clearTimeout(this.timeout);

    this.hoverState = 'show';

    if (!this.config.delay || !this.config.delay.show) {
      this.show();
      return;
    }

    this.timeout = setTimeout(() => {
      if (this.hoverState === 'show') {
        this.show();
      }
    }, this.config.delay.show);
  }

  leave(event: any = null) {
    if (event) {
      if (event.type === 'focusout') {
        this.activeTrigger.focus = false;
      } else {
        this.activeTrigger.hover = false;
      }
    }

    if (this.isWithActiveTrigger()) {
      return;
    }

    clearTimeout(this.timeout);
    this.hoverState = 'out';

    if (!this.config.delay || !this.config.delay.hide) {
      this.hide();
      return;
    }

    this.timeout = setTimeout(() => {
      if (this.hoverState === 'out') {
        this.hide();
      }
    }, this.config.delay.hide);
  }

  show() {
    if (this.tooltipEl.style.display === 'none') {
      throw new Error('Please use show on visible elements');
    }
    if ((_size(this.getTitle()) > 0 || _size(this.getContent()) > 0) && this.isEnabled) {
      const showEvent = customEvent(this.tooltipEl, this.showEventName);
      this.tooltipEl.setAttribute('aria-describedby', this.tooltipId);
      const isInTheDom = this.tooltipEl.ownerDocument.documentElement.contains(this.tooltipEl);
      if (showEvent.defaultPrevented || !isInTheDom) {
        return;
      }
      // debugger;
      const tip = this.getTipElement();
      this.setContent();
      if (this.config.animation) {
        addClass(tip, 'fade');
      }
      const placement = typeof this.config.placement === 'function' ? this.config.placement.call(this, tip, this.tooltipEl) : this.config.placement;
      const attachment = this.getAttachment(placement);
      this.addAttachmentClass(attachment);
      // the point of inserted event is to know when the tip is in the dom but before it has been placed using popper
      customEvent(this.tooltipEl, this.insertedEventName);




      this.popperHandle = new Popper(this.tooltipEl, tip, {
        placement: attachment,
        modifiers: {
          offset: {
            offset: this.config.offset
          },
          flip: {
            behavior: this.config.fallbackPlacement
          },
          arrow: {
            element: '.arrow',
          },
          preventOverflow: {
            boundariesElement: this.config.boundary
          }
        },
        onCreate: this.handlePopperOnCreate,
        onUpdate: this.handlePopperOnUpdate,
      });
      addClass(tip, 'show');

      // If this is a touch-enabled device we add extra
      // empty mouseover listeners to the body's immediate children;
      // only needed because of broken event delegation on iOS
      // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
      // if ('ontouchstart' in document.documentElement) {
      //   $$$1(document.body).children().on('mouseover', null, $$$1.noop);
      // }

      if (hasClass(tip, 'fade')) {
        const transitionDuration = getTransitionDurationFromElement(tip);
        setTimeout(() => {
          this.showComplete();
        }, transitionDuration);
      } else {
        this.showComplete();
      }
    }
  }

  handlePopperOnCreate = (data) => {
    if (data.originalPlacement !== data.placement) {
      this.handlePopperPlacementChange(data);
    }
  }

  handlePopperOnUpdate = (data) => {
    this.handlePopperPlacementChange(data);
  }

  handlePopperPlacementChange(popperData) {
    const popperInstance = popperData.instance;
    this.tip = popperInstance.popper;
    this.cleanTipClass();
    this.addAttachmentClass(this.getAttachment(popperData.placement));
  };

  showComplete() {
    if (this.config.animation) {
      this.fixTransition();
    }
    const prevHoverState = this.hoverState;
    this.hoverState = null;

    window.requestAnimationFrame(() => { // trick to ensure all page updates are completed before running code
      window.requestAnimationFrame(() => { // discussed here:  https://www.youtube.com/watch?v=aCMbSyngXB4&t=11m
        setTimeout(() => {
          // all page updates are completed and event loop is empty
          customEvent(this.tooltipEl, this.shownEventName);
        }, 0);
      });
    });

    if (prevHoverState === 'out') {
      this.leave();
    }
  }

  hide(callback : any = () => {}) {
    const tip = this.getTipElement();
    const hideEvent = customEvent(this.tooltipEl, this.hideEventName);
    if (hideEvent.defaultPrevented) {
      return;
    }

    removeClass(tip, 'show');

    // If this is a touch-enabled device we remove the extra
    // empty mouseover listeners we added for iOS support
    // if ('ontouchstart' in document.documentElement) {
    //   $$$1(document.body).children().off('mouseover', null, $$$1.noop);
    // }

    this.activeTrigger.click = false;
    this.activeTrigger.focus = false;
    this.activeTrigger.hover = false;
    this.tooltipEl.removeAttribute('aria-describedby');

    if (hasClass(tip, 'fade')) {
      const transitionDuration = getTransitionDurationFromElement(tip);
      setTimeout(() => {
        this.hideComplete(callback);
      }, transitionDuration);
    } else {
      this.hideComplete();
    }
    this.hoverState = '';
  }

  hideComplete(callback : any = () => {}) {
    this.cleanTipClass();

    // this.tooltipEl.removeAttribute('aria-describedby');

    if (this.popperHandle && this.popperHandle.destroy) {
      this.popperHandle.destroy();
    }

    this.disposeTimeout = setTimeout(() => {
      this.removeTooltipFromDom();
    }, this.config.disposeTimeToWait);

    window.requestAnimationFrame(() => { // trick to ensure all page updates are completed before running code
      window.requestAnimationFrame(() => { // discussed here:  https://www.youtube.com/watch?v=aCMbSyngXB4&t=11m
        setTimeout(() => {
          // all page updates are completed and event loop is empty
          customEvent(this.tooltipEl, this.hiddenEventName);
        }, 0);
      });
    });

    callback();
  };

  removeTooltipFromDom() {
    if (this.tip && this.hoverState !== 'show' && this.tip.parentNode) {
      this.tip.parentNode.removeChild(this.tip);
      this.tip = null;
    }
  }

  fixTransition() {
    const tip = this.getTipElement();
    const initConfigAnimation = this.config.animation;
    if (tip.getAttribute('x-placement') !== null) {
      return;
    }
    removeClass(tip, 'fade');
    this.config.animation = false;
    this.hide();
    this.show();
    this.config.animation = initConfigAnimation;
  }

  cleanTipClass() {
    const tip = this.getTipElement();
    const bsTooltipPositionClasses = [
      'bs-tooltip-auto',
      'bs-tooltip-top',
      'bs-tooltip-right',
      'bs-tooltip-bottom',
      'bs-tooltip-left',
      'bs-popover-auto',
      'bs-popover-top',
      'bs-popover-right',
      'bs-popover-bottom',
      'bs-popover-left',
    ];
    const classesToRemove = _intersection(bsTooltipPositionClasses, tip.classList);
    for (let j = 0, len = classesToRemove.length; j < len; j++) {
      removeClass(tip, classesToRemove[j]);
    }
  };

  addAttachmentClass(attachment) {
    // debugger;
    addClass(this.getTipElement(), `bs-${this.config.toggle}-${attachment}`);
  };

  getAttachment(placement) {
    const AttachmentMap = {
      auto: 'auto',
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left'
    };
    return AttachmentMap[_toLower(placement)];
  };

  setContent() {
    const tip = this.getTipElement();
    let tooltipTitleEl;
    let tooltipContentEl;
    if (this.config.toggle === 'tooltip') {
      tooltipTitleEl = tip.querySelector('.tooltip-inner');
    } else if (this.config.toggle === 'popover') {
      tooltipTitleEl = tip.querySelector('.popover-header');
      tooltipContentEl = tip.querySelector('.popover-body');
    }
    if (tooltipTitleEl) {
      this.setElementContent(tooltipTitleEl, this.getTitle());
    }
    if (tooltipContentEl) {
      this.setElementContent(tooltipContentEl, this.getContent());
    }
    removeClass(tip, 'fade');
    removeClass(tip, 'show');
  };

  setElementContent(el, content) {
    if (this.config.html) {
      el.innerHTML = content;
    } else {
      el.textContent = content;
    }
  };

  getContent() {
    if (this.config.content) {
      if (typeof this.config.content === 'function') {
        return this.config.content.call(this.tooltipEl);
      } else {
        return this.config.content;
      }
    // } else if (_size(this.bsContent) > 0) {
    //   return this.bsContent;
    } else {
      return '';
    }
  }

  getTitle() {
    if (this.config.title) {
      if (typeof this.config.title === 'function') {
        return this.config.title.call(this.tooltipEl);
      } else {
        return this.config.title;
      }
    } else if (this.tooltipEl.dataset.originalTitle) {
      return this.tooltipEl.dataset.originalTitle;
    } else {
      return '';
    }
  };


  @Watch('bsTitle')
  handleWatchBsTitle(newValue /* , oldValue */ ) {
    if (!this.isEnabled) {
      return;
    }
    if (this.config.title !== newValue) {
      this.config.title = newValue;
    }
    if (this.isWithActiveTrigger() || this.tipHasClass('show') || this.hoverState === 'show') {
      const tip = this.getTipElement();
      let innerContentEl;
      if (this.config.toggle === 'tooltip') {
        innerContentEl = tip.querySelector('.tooltip-inner');
      } else if (this.config.toggle === 'popover') {
        innerContentEl = tip.querySelector('.popover-header');
      }
      if (innerContentEl) {
        this.setElementContent(innerContentEl, this.getTitle());
        if (this.popperHandle && this.popperHandle.scheduleUpdate) {
          this.popperHandle.scheduleUpdate();
        }
      }
    }
  }

  @Watch('bsContent')
  handleWatchBsContent(newValue /* , oldValue */ ) {
    if (!this.isEnabled) {
      return;
    }
    if (this.config.toggle === 'tooltip') {
      return;
    }
    if (this.config.content !== newValue) {
      this.config.content = newValue;
    }
    if (this.isWithActiveTrigger() || this.tipHasClass('show') || this.hoverState === 'show') {
      const tip = this.getTipElement();
      const innerContentEl = tip.querySelector('.popover-body');
      if (innerContentEl) {
        this.setElementContent(innerContentEl, this.getContent());
        if (this.popperHandle && this.popperHandle.scheduleUpdate) {
          this.popperHandle.scheduleUpdate();
        }
      }
    }
  }



  handleClickTrigger = (event) => {
    this.toggle(event);
  }

  handleMouseEnter = (event) => {
    this.enter(event);
  }

  handleFocusIn = (event) => {
    this.enter(event);
  }

  handleMouseLeave = (event) => {
    this.leave(event);
  }

  handleFocusOut = (event) => {
    this.leave(event);
  }

  handleModalHide = (event) => {
    console.log('handleModalHide');
    this.activeTrigger = {};
    this.leave(event);
  }

  setListeners() {
    const closestModal = closest(this.tooltipEl, '.modal');
    if (closestModal) {
      const modalHideEventName = closestModal.hideEventName;
      if (modalHideEventName) {
        closestModal.removeEventListener(closestModal.hideEventName, this.handleModalHide);
        closestModal.addEventListener(closestModal.hideEventName, this.handleModalHide);
      }
    }

    this.fixTitle();

    const triggers = _split(_toLower(this.config.trigger), ' ');
    if (_includes(triggers, 'click')) {
      this.tooltipEl.removeEventListener('click', this.handleClickTrigger);
      this.tooltipEl.addEventListener('click', this.handleClickTrigger);
    }
    if (_includes(triggers, 'manual')) {
      // hover and focus events are ignored if manual is included.
      return;
    }
    if (_includes(triggers, 'hover')) {
      this.tooltipEl.removeEventListener('mouseenter', this.handleMouseEnter);
      this.tooltipEl.addEventListener('mouseenter', this.handleMouseEnter);
      this.tooltipEl.removeEventListener('mouseleave', this.handleMouseLeave);
      this.tooltipEl.addEventListener('mouseleave', this.handleMouseLeave);
    }
    if (_includes(triggers, 'focus')) {
      this.tooltipEl.removeEventListener('focusin', this.handleFocusIn);
      this.tooltipEl.addEventListener('focusin', this.handleFocusIn);
      this.tooltipEl.removeEventListener('focusout', this.handleFocusOut);
      this.tooltipEl.addEventListener('focusout', this.handleFocusOut);
    }
  }

  fixTitle() {
    if (_size(this.tooltipEl.title) > 0) {
      this.tooltipEl.dataset.originalTitle = this.tooltipEl.title || '';
      this.tooltipEl.title = '';
    }
  }

  getConfig(overrideConfig:any = {}) {
    this.config = {};
    const config: any = {};

    if (_has(this.tooltipEl.dataset, 'toggle')) {
      config.toggle = this.tooltipEl.dataset.toggle;
    } else {
      config.toggle = this.defaults.toggle;
    }

    if (_has(overrideConfig, 'animation')) {
      config.animation = getConfigBoolean(overrideConfig.animation);
    } else if (_has(this.tooltipEl.dataset, 'animation')) {
      config.animation = getConfigBoolean(this.tooltipEl.dataset.animation);
    } else {
      config.animation = this.defaults.animation;
    }

    if (_has(overrideConfig, 'trigger')) {
      config.trigger = overrideConfig.trigger;
    } else if (_has(this.tooltipEl.dataset, 'trigger')) {
      config.trigger = this.tooltipEl.dataset.trigger;
    } else if (config.toggle === 'popover') {
      config.trigger = this.defaults.popoverTrigger;
    } else {
      config.trigger = this.defaults.trigger;
    }

    const titleAttribute = this.tooltipEl.getAttribute('title');
    if (_size(this.bsTitle) > 0) {
      config.title = this.bsTitle;
    } else if (titleAttribute) {
      config.title = titleAttribute;
    } else if (_has(overrideConfig, 'title')) {

      if (typeof overrideConfig.title === 'object' && overrideConfig.title.nodeValue) {
        config.title = overrideConfig.title.nodeValue;
      } else {
        config.title = overrideConfig.title;
      }
    } else if (_has(this.tooltipEl.dataset, 'title')) {
      config.title = this.tooltipEl.dataset.title;
    } else {
      config.title = this.defaults.title;
    }
    if (_isNumber(config.title)) {
      config.title = _toString(config.title);
    }

    // debugger;

    if (_size(this.bsContent) > 0) {
      config.content = this.bsContent;
    } else if (_has(overrideConfig, 'content')) {
      if (typeof overrideConfig.content === 'object' && overrideConfig.content.nodeValue) {
        config.content = overrideConfig.content.nodeValue;
      } else {
        config.content = overrideConfig.content;
      }
    } else if (_has(this.tooltipEl.dataset, 'content')) {
      config.content = this.tooltipEl.dataset.content;
    } else {
      config.content = this.defaults.content;
    }

    let newConfigDelay;
    if (_has(overrideConfig, 'delay')) {
      newConfigDelay = overrideConfig.delay;
    } else if (_has(this.tooltipEl.dataset, 'delay')) {
      newConfigDelay = this.tooltipEl.dataset.delay;
    }
    if (_isInteger(newConfigDelay)) {
      config.delay = {
        show: newConfigDelay,
        hide: newConfigDelay
      };
    } else if (_isObject(newConfigDelay)) {
      config.delay = {
        show: _get(newConfigDelay, 'show', this.defaults.delay),
        hide: _get(newConfigDelay, 'hide', this.defaults.delay),
      };
    } else if (_isString(newConfigDelay) && _size(newConfigDelay) > 0) {
      const configDelayInteger = _toInteger(newConfigDelay);
      if (!_isNaN(configDelayInteger)) {
        config.delay = {
          show: configDelayInteger,
          hide: configDelayInteger
        };
      } else {
        const configDelayObj = parseJson(newConfigDelay);
        config.delay = {
          show: _get(configDelayObj, 'show', this.defaults.delay),
          hide: _get(configDelayObj, 'hide', this.defaults.delay),
        };
      }
    } else {
      config.delay = {
        show: this.defaults.delay,
        hide: this.defaults.delay
      };
    }

    if (_has(overrideConfig, 'html')) {
      config.html = getConfigBoolean(overrideConfig.html);
    } else if (_has(this.tooltipEl.dataset, 'html')) {
      config.html = getConfigBoolean(this.tooltipEl.dataset.html);
    } else {
      config.html = this.defaults.html;
    }

    if (_has(overrideConfig, 'selector')) {
      config.selector = overrideConfig.selector;
    } else if (_has(this.tooltipEl.dataset, 'selector')) {
      config.selector = this.tooltipEl.dataset.selector;
    } else {
      config.selector = this.defaults.selector;
    }

    if (_has(overrideConfig, 'placement')) {
      config.placement = overrideConfig.placement;
    } else if (_has(this.tooltipEl.dataset, 'placement')) {
      config.placement = this.tooltipEl.dataset.placement;
    } else if (config.toggle === 'popover') {
      config.placement = this.defaults.popoverPlacement;
    } else {
      config.placement = this.defaults.placement;
    }

    if (_has(overrideConfig, 'offset')) {
      config.offset = _toInteger(overrideConfig.offset);
    } else if (_has(this.tooltipEl.dataset, 'offset')) {
      config.offset = _toInteger(this.tooltipEl.dataset.offset);
    } else {
      config.offset = this.defaults.offset;
    }
    if (_isNaN(config.offset)) {
      config.offset = this.defaults.offset;
    }

    if (_has(overrideConfig, 'container')) {
      config.container = getConfigBoolean(overrideConfig.container);
    } else if (_has(this.tooltipEl.dataset, 'container')) {
      config.container = getConfigBoolean(this.tooltipEl.dataset.container);
    } else {
      config.container = this.defaults.container;
    }

    if (_has(overrideConfig, 'fallbackPlacement')) {
      config.fallbackPlacement = overrideConfig.fallbackPlacement;
    } else if (_has(this.tooltipEl.dataset, 'fallbackPlacement')) {
      config.fallbackPlacement = this.tooltipEl.dataset.fallbackPlacement;
    } else {
      config.fallbackPlacement = this.defaults.fallbackPlacement;
    }

    if (_has(overrideConfig, 'boundary')) {
      config.boundary = overrideConfig.boundary;
    } else if (_has(this.tooltipEl.dataset, 'boundary')) {
      config.boundary = this.tooltipEl.dataset.boundary;
    } else {
      config.boundary = this.defaults.boundary;
    }

    if (_has(overrideConfig, 'disposeTimeToWait')) {
      config.disposeTimeToWait = _toInteger(overrideConfig.disposeTimeToWait);
    } else if (_has(this.tooltipEl.dataset, 'disposeTimeToWait')) {
      config.disposeTimeToWait = _toInteger(this.tooltipEl.dataset.disposeTimeToWait);
    } else {
      config.disposeTimeToWait = this.defaults.disposeTimeToWait;
    }
    if (_isNaN(config.disposeTimeToWait)) {
      config.disposeTimeToWait = this.defaults.disposeTimeToWait;
    }

    if (_has(overrideConfig, 'template')) {
      config.template = overrideConfig.template;
    } else if (_has(this.tooltipEl.dataset, 'template')) {
      config.template = this.tooltipEl.dataset.template;
    } else if (config.toggle === 'popover') {
      config.template = this.defaults.popoverTemplate;
    } else {
      config.template = this.defaults.template;
    }

    // What is this pure function thing everyone has been talking about?
    this.config = config;
    // this.bsTitle = this.config.content;
    // console.log('this.config: ', this.config);
  };


  @Method()
  tooltip(tooltipOptions:any = {}) {
    if (_size(tooltipOptions) === 0) {
      if (!this.isEnabled) {
        this.enableTooltip();
        return true;
      }
      return this.tooltipEl;
    } else if (tooltipOptions === 'enable') {
      this.enableTooltip();
      return true;
    } else if (tooltipOptions === 'disable') {
      this.disableTooltip();
      return true;
    } else if (tooltipOptions === 'toggleEnabled') {
      if (this.isEnabled) {
        this.disableTooltip();
      } else {
        this.enableTooltip();
      }
      return true;
    } else if (tooltipOptions === 'show') {
      if (!this.isEnabled) {
        return null;
      }
      this.enter();
      return true;
    } else if (tooltipOptions === 'hide') {
      this.activeTrigger = {};
      if (!this.isEnabled) {
        return null;
      }
      this.leave();
      return true;
    } else if (tooltipOptions === 'toggle') {
      if (!this.isEnabled) {
        return null;
      }
      this.toggle();
      return true;
    } else if (tooltipOptions === 'update') {
      if (this.popperHandle && this.popperHandle.scheduleUpdate) {
        this.popperHandle.scheduleUpdate();
        return true;
      }
      return false;
    } else if (typeof tooltipOptions === 'object') {
      if (this.isEnabled) {
        this.disableTooltip();
      }
      this.enableTooltip(tooltipOptions);
      return true;
    } else if (typeof tooltipOptions === 'string') {
      throw new Error(`No method named "${tooltipOptions}"`);
    }
  }

  render() {
    return ( <slot /> );
  }
}