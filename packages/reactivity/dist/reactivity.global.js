var MyReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    computed: () => computed,
    effect: () => effect,
    proxyRef: () => proxyRef,
    reactive: () => reactive,
    ref: () => ref,
    toRef: () => toRef,
    toRefs: () => toRefs,
    watch: () => watch
  });

  // packages/reactivity/src/effect.ts
  var activeEffect = null;
  function cleanupEffect(effect2) {
    const deps = effect2.deps;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.parent = null;
      this.deps = [];
      this.name = Math.random().toFixed();
      this.fn = fn;
      this.scheduler = scheduler;
    }
    run() {
      if (!this.active) {
        this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  var effect = (cb, options = {}) => {
    const _effect = new ReactiveEffect(cb, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  };
  var targetMap = /* @__PURE__ */ new WeakMap();
  var track = (target, key, type) => {
    if (!activeEffect)
      return;
    let depMap = targetMap.get(target);
    if (!depMap) {
      targetMap.set(target, depMap = /* @__PURE__ */ new Map());
    }
    let dep = depMap.get(key);
    if (!dep) {
      depMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  };
  function trackEffects(dep) {
    let shouldTrack = dep.has(activeEffect);
    if (!shouldTrack) {
      dep.add(activeEffect);
      if (activeEffect && activeEffect.deps)
        activeEffect.deps.push(dep);
    }
  }
  var trigger = (target, key, newValue, oldVal, type) => {
    let depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  };
  var triggerEffects = (effects) => {
    effects = new Set(effects);
    effects && effects.forEach((e) => {
      if (e !== activeEffect) {
        if (e.scheduler) {
          e.scheduler();
        } else {
          e.run();
        }
      }
    });
  };

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };

  // packages/reactivity/src/baseHandler.ts
  var mutableHandler = {
    get(target, key, recevier) {
      if (key === "_v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, key, "get");
      let res = Reflect.get(target, key, recevier);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, newValue, recevier) {
      let oldVal = target[key];
      let res = Reflect.set(target, key, newValue, recevier);
      if (oldVal !== newValue) {
        trigger(target, key, newValue, oldVal, "add");
      }
      return res;
    }
  };

  // packages/reactivity/src/reactivity.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  var isReactive = (value) => {
    return !!(value && value["_v_isReactive" /* IS_REACTIVE */]);
  };
  var reactive = (target) => {
    if (!isObject(target))
      return;
    if (target["_v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const proxyed = reactiveMap.get(target);
    if (proxyed) {
      return proxyed;
    }
    const proxy = new Proxy(target, mutableHandler);
    reactiveMap.set(target, proxy);
    return proxy;
  };

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this.effect = null;
      this._dirty = true;
      this._v_isReadonly = true;
      this._v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.getter = getter;
      this.setter = setter;
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
        }
        triggerEffects(this.dep);
      });
    }
    get value() {
      if (activeEffect)
        trackEffects(this.dep);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(val) {
      this.setter(val);
    }
  };
  var computed = (options) => {
    let res = isFunction(options);
    let getter, setter;
    if (res) {
      getter = options;
      setter = () => {
        console.warn("set~~ was not exist");
      };
    } else {
      getter = options.getter;
      setter = options.setter;
    }
    return new ComputedRefImpl(getter, setter);
  };

  // packages/reactivity/src/watch.ts
  function traversal(obj, set = /* @__PURE__ */ new Set()) {
    if (!isObject(obj))
      return obj;
    if (set.has(obj)) {
      return obj;
    }
    set.add(obj);
    for (let k in obj) {
      traversal(obj[k], set);
    }
    return obj;
  }
  var clean;
  var onCleanup = (fn) => {
    clean = fn;
  };
  var watch = (source, cb) => {
    let getter;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    } else {
      return;
    }
    let oldVal;
    const job = () => {
      if (clean) {
        clean();
      }
      const newVal = effect2.run();
      cb(newVal, oldVal, onCleanup);
      oldVal = newVal;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldVal = effect2.run();
  };

  // packages/reactivity/src/ref.ts
  var toReactive = (value) => {
    return isObject(value) ? reactive(value) : value;
  };
  var RefImp = class {
    constructor(rowValue) {
      this.rowValue = rowValue;
      this._v_isRef = true;
      this.deps = /* @__PURE__ */ new Set();
      this.rowValue = rowValue;
      this._value = toReactive(rowValue);
    }
    get value() {
      trackEffects(this.deps);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this.rowValue) {
        this._value = toReactive(newValue);
        this.rowValue = newValue;
        triggerEffects(this.deps);
      }
    }
  };
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = null;
      this.key = "";
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set value(value) {
      this.object[this.key] = value;
    }
  };
  var ref = (value) => {
    return new RefImp(value);
  };
  var toRef = (obj, key) => {
    return new ObjectRefImpl(obj, key);
  };
  var toRefs = (obj) => {
    const result = Array.isArray(obj) ? new Array(obj.length) : {};
    for (const key in obj) {
      if (isObject(obj[key])) {
        result[key] = toRefs(obj[key]);
      } else {
        result[key] = toRef(obj, key);
      }
    }
    return result;
  };
  var proxyRef = (obj) => {
    return new Proxy(obj, {
      get(target, key, receiver) {
        let r = Reflect.get(target, key, receiver);
        return r._v_isRef ? r.value : r;
      },
      set(target, key, value, receiver) {
        let oldVal = target[key];
        if (oldVal._v_isRef) {
          oldVal.value = value;
          return true;
        } else {
          return Reflect.set(target, key, value, receiver);
        }
      }
    });
  };
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
