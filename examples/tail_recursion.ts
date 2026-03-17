type Thunk<T> = { done: false; fn: () => Thunk<T> } | { done: true; value: T };

function _trampoline_is_even(n: number): Thunk<boolean> {
  if ((n == 0)) {
    return { done: true, value: true };
  } else {
    return { done: false, fn: () => _trampoline_is_odd((n - 1)) };
  }
}

function _trampoline_is_odd(n: number): Thunk<boolean> {
  if ((n == 0)) {
    return { done: true, value: false };
  } else {
    return { done: false, fn: () => _trampoline_is_even((n - 1)) };
  }
}

function is_even(n: number): boolean {
  let __result: Thunk<boolean> = _trampoline_is_even(n);
  while (!__result.done) {
    __result = __result.fn();
  }
  return __result.value;
}

function is_odd(n: number): boolean {
  let __result: Thunk<boolean> = _trampoline_is_odd(n);
  while (!__result.done) {
    __result = __result.fn();
  }
  return __result.value;
}

export function factorial(n: number, acc: number): number {
  while (true) {
    if ((n <= 1)) {
      return acc;
    } else {
      if (true) {
        let __tailrec_n = (n - 1);
        let __tailrec_acc = (n * acc);
        n = __tailrec_n;
        acc = __tailrec_acc;
        continue;
      }
    }
  }
}

export function sum_list(items: number[], acc: number): number {
  while (true) {
    if (!((items.length > 0))) return acc;
    const head = first(items);
    const tail = skip(items, 1);
    if (true) {
      let __tailrec_items = tail;
      let __tailrec_acc = (acc + head);
      items = __tailrec_items;
      acc = __tailrec_acc;
      continue;
    }
  }
}

export function binary_search(items: number[], target: number, low: number, high: number): number | null {
  while (true) {
    if (!((low <= high))) return null;
    const mid = ((low + high) / 2);
    const value = items.at(mid);
    if (true && (() => { const v = value; return (v == target); })()) {
      const v = value;
      return mid;
    } else if (true && (() => { const v = value; return (v < target); })()) {
      const v = value;
      if (true) {
        let __tailrec_items = items;
        let __tailrec_target = target;
        let __tailrec_low = (mid + 1);
        let __tailrec_high = high;
        items = __tailrec_items;
        target = __tailrec_target;
        low = __tailrec_low;
        high = __tailrec_high;
        continue;
      }
    } else if (true) {
      if (true) {
        let __tailrec_items = items;
        let __tailrec_target = target;
        let __tailrec_low = low;
        let __tailrec_high = (mid - 1);
        items = __tailrec_items;
        target = __tailrec_target;
        low = __tailrec_low;
        high = __tailrec_high;
        continue;
      }
    }
  }
}
