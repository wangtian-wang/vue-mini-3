import { isObject, isFunction } from "@my/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactivity";
function traversal(obj, set = new Set()) {
  if (!isObject(obj)) return obj;
  if (set.has(obj)) {
    return obj; // return 防止当obj为对象时,执行下面遍历代码 造成循环引用
  }
  set.add(obj);
  for (let k in obj) {
    traversal(obj[k], set);
  }
  return obj;
}
let clean;
const onCleanup = (fn) => {
  clean = fn; // 不执行 保存用户传递过来的取消回调函数
};
// watch 监听对象的属性 不监听对象本身
export const watch = (source, cb) => {
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
      clean(); // 清理副作用  执行第二次以及之后的调用watch时候 传入cleanup 内的回调函数
    }
    const newVal = effect.run();
    cb(newVal, oldVal, onCleanup);
    oldVal = newVal;
  };
  const effect = new ReactiveEffect(getter, job);
  oldVal = effect.run();
};
