import { isObject } from "@my/shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactivity";

const toReactive = (value) => {
  return isObject(value) ? reactive(value) : value;
};

class RefImp {
  public _value;
  public _v_isRef = true;
  public deps = new Set();
  constructor(public rowValue) {
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
}
class ObjectRefImpl {
  public object = null;
  public key = "";
  constructor(object, key) {
    this.object = object;
    this.key = key;
  }
  get value() {
    return this.object[this.key];
  }
  set value(value) {
    this.object[this.key] = value;
  }
}

export const ref = (value) => {
  return new RefImp(value);
};

export const toRef = (obj, key) => {
  return new ObjectRefImpl(obj, key);
};
export const toRefs = (obj) => {
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
export const proxyRef = (obj) => {
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
    },
  });
};
