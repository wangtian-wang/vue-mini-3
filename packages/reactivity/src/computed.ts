// 为啥不能直接修改计算属性  name = 'xxxxx' 会将name 的引用修改了
// v3的计算属性会收集依赖 v2的计算属性不会
import { isFunction } from "@my/shared";
import {
  activeEffect,
  ReactiveEffect,
  trackEffects,
  triggerEffects,
} from "./effect";
class ComputedRefImpl {
  public effect = null;
  public _dirty = true;
  public _v_isReadonly = true;
  public _v_isRef = true;
  public _value;
  public dep = new Set();
  constructor(public getter, public setter) {
    this.getter = getter;
    this.setter = setter;
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
      // computed 的更新
      triggerEffects(this.dep);
    });
  }
  get value() {
    // computed的依赖收集
    if (activeEffect) trackEffects(this.dep);
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(val) {
    this.setter(val);
  }
}
export const computed = (options) => {
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
