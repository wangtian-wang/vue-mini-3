import { track, trigger } from "./effect";
import { isObject } from "@my/shared";
import { reactive } from "./reactivity";

export const enum ReactiveFlags {
  IS_REACTIVE = "_v_isReactive",
}

export const mutableHandler = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) {
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
  },
};
