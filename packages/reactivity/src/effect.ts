// effect 根据依赖变化重新执行; effect可以嵌套
// 数据变化 cb执行 但是effect传入的cb 没有这个功能 需要扩展这个cb的功能
export let activeEffect = null;
function cleanupEffect(effect) {
  const deps = effect.deps;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }
  //  Set 执行foreach 里面 删除a, add a 会发生死循环
  // deps.forEach(elem => {
  //     elem.delete(effect) // 解除 属性 对应的effect绑定
  // })
  effect.deps.length = 0;
}
export class ReactiveEffect {
  public active = true;
  public parent = null;

  public deps = []; // 记录当前关联的属性
  public name = Math.random().toFixed();
  constructor(public fn, public scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 非激活状态下,指的是啥   ?? 执行回调函数 不需要进行依赖收集
    if (!this.active) {
      this.fn();
    }

    // 依赖收集

    try {
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      // 等到上面的代码执行完成将 activeEffect变为Null
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
}
export const effect = (cb, options: any = {}) => {
  const _effect = new ReactiveEffect(cb, options.scheduler);
  _effect.run();

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner; // 返回一个runner函数 runner函数执行 副作用函数执行/ runner的stop可以停止runner函数的执行
};
const targetMap = new WeakMap(); // target 的属性记录了依赖的effect
export const track = (target, key, type) => {
  // track -> 属性收集对应的effect 前提是 该属性在effect里面使用
  if (!activeEffect) return;
  let depMap = targetMap.get(target);
  if (!depMap) {
    targetMap.set(target, (depMap = new Map()));
  }
  let dep = depMap.get(key);
  if (!dep) {
    depMap.set(key, (dep = new Set()));
  }
  trackEffects(dep);
};
export function trackEffects(dep) {
  let shouldTrack = dep.has(activeEffect);
  if (!shouldTrack) {
    dep.add(activeEffect);
    if (activeEffect && activeEffect.deps) activeEffect.deps.push(dep); // 为清理effect 对应的属性做准备
  }
}
export const trigger = (target, key, newValue, oldVal, type) => {
  let depsMap = targetMap.get(target);
  if (!depsMap) return;
  let effects = depsMap.get(key);
  if (effects) {
    triggerEffects(effects);
  }
};
export const triggerEffects = (effects) => {
  effects = new Set(effects); // 拷贝Set 防止死循环
  effects &&
    effects.forEach((e) => {
      // 一个effect不能被连续的多次执行

      if (e !== activeEffect) {
        if (e.scheduler) {
          e.scheduler();
        } else {
          e.run();
        }
      }
    });
};
