/**
 * 1: 已经做过代理的对象    可以不执行代理, 返回缓存的代理对象
 * 2: 假设代理的是个proxy 也不执行代理操作
 */
const reactiveMap = new WeakMap();
import { ReactiveFlags, mutableHandler } from "./baseHandler";
import { isObject } from "@my/shared";

export const isReactive = (value) => {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
};

export const reactive = (target) => {
  if (!isObject(target)) return;
  // 假设传入的target是个proxy  那这个操作target[ReactiveFlags.IS_REACTIVE]会走proxy的get拦截器 会有TRUE的返回值
  if (target[ReactiveFlags.IS_REACTIVE]) {
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
