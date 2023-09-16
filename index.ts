export const isObject = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  !(value instanceof Array) &&
  !(value instanceof Map) &&
  !(value instanceof Set);

const unique = <T>(arr: T[]) => [...new Set(arr)];

const getKeys = <T extends object[]>(...args: T) =>
  unique(
    args.map(Object.keys).reduce((a, b) => [...a, ...b])
  ) as (keyof T[number])[];

const hasKeys = (a: any) =>
  a !== null && a instanceof Object && !(a instanceof Set);

const blend = <Default extends object, Override extends object>(
  defaults: Default,
  override: Override,
  options: {
    strategies: Strategies;
    path: PropertyKey[];
  } = { strategies: [], path: [] }
) => {
  type Blend = Default & Override;
  type BlendValue = Blend[keyof Blend];

  const result = {} as any;

  const resultKeys =
    hasKeys(defaults) && hasKeys(override) && getKeys(defaults, override);

  if (!resultKeys) {
    return (override ?? defaults) as Blend;
  }

  for (const key of resultKeys) {
    const defaultValue = defaults[key];
    const overrideValue = override[key];

    const matcherOptions = {
      path: [...options.path, key],
      strategies: options.strategies,
      defaultValue,
      overrideValue,
      value: overrideValue ?? defaultValue,
    };

    const matchFn = matcherFns(matcherOptions);

    const strategy = options.strategies.find(({ matcher }) =>
      matcher(matchFn).getMatch()
    );

    if (!strategy) continue;

    result[key] = strategy.action(actionFns(matcherOptions));
  }
  return result as Blend;
};

type MatcherFns = typeof matcherFns;
type MatchObject = {
  path: Path;
  defaultValue: any;
  overrideValue: any;
  value: any;
};
const matcherFns = (obj: MatchObject) => {
  let _isMatch = false;
  return {
    getMatch() {
      return _isMatch;
    },
    setMatch(isMatch: boolean) {
      _isMatch = isMatch;
      return this;
    },
    isObject() {
      _isMatch = isObject(obj.value);
      return this;
    },
    isArray() {
      _isMatch = obj.value instanceof Array;
      return this;
    },
    // TODO: Add RegExp support
    path(str: string) {
      const path = str.split(".");
      _isMatch = path.every((p, i) => obj.path[i] === p);
      return this;
    },
    pathContains(str: string) {
      _isMatch = obj.path.includes(str);
      return this;
    },
    valueIs(val: any) {
      _isMatch = obj.value === val;
      return this;
    },
  };
};

type Path = PropertyKey[];
type ActionObject = {
  path: Path;
  strategies: Strategies;
  defaultValue: any;
  overrideValue: any;
  value: any;
};
const actionFns = (obj: ActionObject) => {
  return {
    useDefault() {
      return obj.defaultValue;
    },
    useOverride() {
      return obj.overrideValue;
    },
    preferDefault() {
      return obj.defaultValue ?? obj.overrideValue;
    },
    preferOverride() {
      return obj.overrideValue ?? obj.defaultValue;
    },
    setValue(val: any) {
      return val;
    },
    shallowMerge() {
      if (
        obj.defaultValue instanceof Array &&
        obj.overrideValue instanceof Array
      ) {
        return [...obj.defaultValue, ...obj.overrideValue];
      }

      return { ...obj.defaultValue, ...obj.overrideValue };
    },
    blend() {
      return blend(obj.defaultValue, obj.overrideValue, obj);
    },
  };
};
const defaultStrategies: Strategies = [
  {
    matcher: (fn) => fn.isObject(),
    action: (action) => action.blend(),
  },
  {
    matcher: (fn) => fn.isArray(),
    action: (action) => action.preferOverride(),
  },
  {
    matcher: (fn) => fn.setMatch(true),
    action: (action) => action.preferOverride(),
  },
];
type Action = (action: ReturnType<typeof actionFns>) => any;
type Matcher = (matcher: ReturnType<MatcherFns>) => ReturnType<MatcherFns>;
type Strategies = {
  matcher: Matcher;
  action: Action;
}[];

type Options = {
  strategies: Strategies;
  path: Path;
};
/**
 * Merge two objects, where the second object overrides the first.
 * You can skip deep merging on certain paths by providing a skipDeep function.
 * @param config
 */
export function blendDefaults<Default extends object, Override extends object>(
  defaults: Default,
  override: Override,
  options?: {
    strategies?: Strategies;
    path?: PropertyKey[];
  }
): Default & Override {
  const strategies = [...(options?.strategies ?? []), ...defaultStrategies];

  return blend(defaults, override, {
    strategies,
    path: options?.path ?? [],
  });
}
