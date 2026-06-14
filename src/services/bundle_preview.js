/* eslint-disable */
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});

// dist/src/utils/Utils.js
var Utils_exports = {};
__export(Utils_exports, {
  ChannelError: () => ChannelError,
  InnertubeError: () => InnertubeError,
  MissingParamError: () => MissingParamError,
  OAuth2Error: () => OAuth2Error,
  ParsingError: () => ParsingError,
  Platform: () => Platform,
  PlayerError: () => PlayerError,
  SessionError: () => SessionError,
  base64ToU8: () => base64ToU8,
  concatMemos: () => concatMemos,
  debugFetch: () => debugFetch,
  deepCompare: () => deepCompare,
  escapeStringRegexp: () => escapeStringRegexp,
  generateRandomString: () => generateRandomString,
  generateSidAuth: () => generateSidAuth,
  getCookie: () => getCookie,
  getNsigProcessorFn: () => getNsigProcessorFn,
  getRandomUserAgent: () => getRandomUserAgent,
  getStringBetweenStrings: () => getStringBetweenStrings,
  hasKeys: () => hasKeys,
  isTextRun: () => isTextRun,
  streamToIterable: () => streamToIterable,
  throwIfMissing: () => throwIfMissing,
  timeToSeconds: () => timeToSeconds,
  u8ToBase64: () => u8ToBase64
});

// dist/src/parser/helpers.js
var helpers_exports = {};
__export(helpers_exports, {
  Maybe: () => Maybe,
  Memo: () => Memo,
  SuperParsedResult: () => SuperParsedResult,
  YTNode: () => YTNode,
  observe: () => observe
});

// dist/src/utils/Log.js
var Log_exports = {};
__export(Log_exports, {
  Level: () => Level,
  debug: () => debug,
  error: () => error,
  info: () => info,
  setLevel: () => setLevel,
  warn: () => warn,
  warnOnce: () => warnOnce
});
var YTJS_TAG = "YOUTUBEJS";
var Level = {
  NONE: 0,
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
  DEBUG: 4
};
var log_map = {
  [Level.ERROR]: (...args) => console.error(...args),
  [Level.WARNING]: (...args) => console.warn(...args),
  [Level.INFO]: (...args) => console.info(...args),
  [Level.DEBUG]: (...args) => console.debug(...args)
};
var log_level = [Level.WARNING];
var one_time_warnings_issued = /* @__PURE__ */ new Set();
function doLog(level, tag, args) {
  if (!log_map[level] || !log_level.includes(level))
    return;
  const tags = [`[${YTJS_TAG}]`];
  if (tag)
    tags.push(`[${tag}]`);
  log_map[level](`${tags.join("")}:`, ...args || []);
}
__name(doLog, "doLog");
var warnOnce = /* @__PURE__ */ __name((id, ...args) => {
  if (one_time_warnings_issued.has(id))
    return;
  doLog(Level.WARNING, id, args);
  one_time_warnings_issued.add(id);
}, "warnOnce");
var warn = /* @__PURE__ */ __name((tag, ...args) => doLog(Level.WARNING, tag, args), "warn");
var error = /* @__PURE__ */ __name((tag, ...args) => doLog(Level.ERROR, tag, args), "error");
var info = /* @__PURE__ */ __name((tag, ...args) => doLog(Level.INFO, tag, args), "info");
var debug = /* @__PURE__ */ __name((tag, ...args) => doLog(Level.DEBUG, tag, args), "debug");
function setLevel(...args) {
  log_level = args;
}
__name(setLevel, "setLevel");

// dist/src/parser/helpers.js
var isObserved = Symbol("ObservedArray.isObserved");
var _YTNode = class _YTNode {
  constructor() {
    __publicField(this, "type");
    this.type = this.constructor.type;
  }
  /**
   * Check if the node is of the given type.
   * @param types - The type to check
   * @returns whether the node is of the given type
   */
  is(...types) {
    return types.some((type) => this.type === type.type);
  }
  /**
   * Cast to one of the given types.
   * @param types - The types to cast to
   * @returns The node cast to one of the given types
   * @throws {ParsingError} If the node is not of the given type
   */
  as(...types) {
    if (!this.is(...types)) {
      throw new ParsingError(`Cannot cast ${this.type} to one of ${types.map((t) => t.type).join(", ")}`);
    }
    return this;
  }
  /**
   * Check for a key without asserting the type.
   * @param key - The key to check
   * @returns Whether the node has the key
   */
  hasKey(key) {
    return Reflect.has(this, key);
  }
  /**
   * Assert that the node has the given key and return it.
   * @param key - The key to check
   * @returns The value of the key wrapped in a Maybe
   * @throws {ParsingError} If the node does not have the key
   */
  key(key) {
    if (!this.hasKey(key)) {
      throw new ParsingError(`Missing key ${key}`);
    }
    return new Maybe(this[key]);
  }
};
__name(_YTNode, "YTNode");
__publicField(_YTNode, "type", "YTNode");
var YTNode = _YTNode;
var MAYBE_TAG = "Maybe";
var _value, _Maybe_instances, checkPrimitive_fn, assertPrimitive_fn;
var _Maybe = class _Maybe {
  constructor(value) {
    __privateAdd(this, _Maybe_instances);
    __privateAdd(this, _value);
    __privateSet(this, _value, value);
  }
  get typeof() {
    return typeof __privateGet(this, _value);
  }
  string() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "string");
  }
  isString() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "string");
  }
  number() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "number");
  }
  isNumber() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "number");
  }
  bigint() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "bigint");
  }
  isBigint() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "bigint");
  }
  boolean() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "boolean");
  }
  isBoolean() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "boolean");
  }
  symbol() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "symbol");
  }
  isSymbol() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "symbol");
  }
  undefined() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "undefined");
  }
  isUndefined() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "undefined");
  }
  null() {
    if (__privateGet(this, _value) !== null)
      throw new TypeError(`Expected null, got ${typeof __privateGet(this, _value)}`);
    return __privateGet(this, _value);
  }
  isNull() {
    return __privateGet(this, _value) === null;
  }
  object() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "object");
  }
  isObject() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "object");
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function() {
    return __privateMethod(this, _Maybe_instances, assertPrimitive_fn).call(this, "function");
  }
  isFunction() {
    return __privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, "function");
  }
  /**
   * Get the value as an array.
   * @returns the value as any[].
   * @throws If the value is not an array.
   */
  array() {
    if (!Array.isArray(__privateGet(this, _value))) {
      throw new TypeError(`Expected array, got ${typeof __privateGet(this, _value)}`);
    }
    return __privateGet(this, _value);
  }
  /**
   * More typesafe variant of {@link Maybe#array}.
   * @returns a proxied array which returns all the values as {@link Maybe}.
   * @throws {TypeError} If the value is not an array
   */
  arrayOfMaybe() {
    const arrayProps = [];
    return new Proxy(this.array(), {
      get(target, prop) {
        if (Reflect.has(arrayProps, prop)) {
          return Reflect.get(target, prop);
        }
        return new _Maybe(Reflect.get(target, prop));
      }
    });
  }
  /**
   * Check whether the value is an array.
   * @returns whether the value is an array.
   */
  isArray() {
    return Array.isArray(__privateGet(this, _value));
  }
  /**
   * Get the value as a YTNode.
   * @returns the value as a YTNode.
   * @throws If the value is not a YTNode.
   */
  node() {
    if (!(__privateGet(this, _value) instanceof YTNode)) {
      throw new TypeError(`Expected YTNode, got ${__privateGet(this, _value).constructor.name}`);
    }
    return __privateGet(this, _value);
  }
  /**
   * Check if the value is a YTNode.
   * @returns Whether the value is a YTNode.
   */
  isNode() {
    return __privateGet(this, _value) instanceof YTNode;
  }
  /**
   * Get the value as a YTNode of the given type.
   * @param types - The type(s) to cast to.
   * @returns The node cast to the given type.
   * @throws If the node is not of the given type.
   */
  nodeOfType(...types) {
    return this.node().as(...types);
  }
  /**
   * Check if the value is a YTNode of the given type.
   * @param types - the type(s) to check.
   * @returns Whether the value is a YTNode of the given type.
   */
  isNodeOfType(...types) {
    return this.isNode() && this.node().is(...types);
  }
  /**
   * Get the value as an ObservedArray.
   * @returns the value of the Maybe as a ObservedArray.
   */
  observed() {
    if (!this.isObserved()) {
      throw new TypeError(`Expected ObservedArray, got ${typeof __privateGet(this, _value)}`);
    }
    return __privateGet(this, _value);
  }
  /**
   * Check if the value is an ObservedArray.
   */
  isObserved() {
    var _a;
    return (_a = __privateGet(this, _value)) == null ? void 0 : _a[isObserved];
  }
  /**
   * Get the value of the Maybe as a SuperParsedResult.
   * @returns the value as a SuperParsedResult.
   * @throws If the value is not a SuperParsedResult.
   */
  parsed() {
    if (!(__privateGet(this, _value) instanceof SuperParsedResult)) {
      throw new TypeError(`Expected SuperParsedResult, got ${typeof __privateGet(this, _value)}`);
    }
    return __privateGet(this, _value);
  }
  /**
   * Is the result a SuperParsedResult?
   */
  isParsed() {
    return __privateGet(this, _value) instanceof SuperParsedResult;
  }
  /**
   * @deprecated
   * This call is not meant to be used outside of debugging. Please use the specific type getter instead.
   */
  any() {
    warn(MAYBE_TAG, "This call is not meant to be used outside of debugging. Please use the specific type getter instead.");
    return __privateGet(this, _value);
  }
  /**
   * Get the node as an instance of the given class.
   * @param type - The type to check.
   * @returns the value as the given type.
   * @throws If the node is not of the given type.
   */
  instanceof(type) {
    if (!this.isInstanceof(type)) {
      throw new TypeError(`Expected instance of ${type.name}, got ${__privateGet(this, _value).constructor.name}`);
    }
    return __privateGet(this, _value);
  }
  /**
   * Check if the node is an instance of the given class.
   * @param type - The type to check.
   * @returns Whether the node is an instance of the given type.
   */
  isInstanceof(type) {
    return __privateGet(this, _value) instanceof type;
  }
};
_value = new WeakMap();
_Maybe_instances = new WeakSet();
checkPrimitive_fn = /* @__PURE__ */ __name(function(type) {
  return typeof __privateGet(this, _value) === type;
}, "#checkPrimitive");
assertPrimitive_fn = /* @__PURE__ */ __name(function(type) {
  if (!__privateMethod(this, _Maybe_instances, checkPrimitive_fn).call(this, type)) {
    throw new TypeError(`Expected ${type}, got ${this.typeof}`);
  }
  return __privateGet(this, _value);
}, "#assertPrimitive");
__name(_Maybe, "Maybe");
var Maybe = _Maybe;
var _result;
var _SuperParsedResult = class _SuperParsedResult {
  constructor(result) {
    __privateAdd(this, _result);
    __privateSet(this, _result, result);
  }
  get is_null() {
    return __privateGet(this, _result) === null;
  }
  get is_array() {
    return !this.is_null && Array.isArray(__privateGet(this, _result));
  }
  get is_node() {
    return !this.is_array;
  }
  array() {
    if (!this.is_array) {
      throw new TypeError("Expected an array, got a node");
    }
    return __privateGet(this, _result);
  }
  item() {
    if (!this.is_node) {
      throw new TypeError("Expected a node, got an array");
    }
    return __privateGet(this, _result);
  }
};
_result = new WeakMap();
__name(_SuperParsedResult, "SuperParsedResult");
var SuperParsedResult = _SuperParsedResult;
function observe(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      if (prop == "get") {
        return (rule, del_item) => target.find((obj2, index) => {
          const match = deepCompare(rule, obj2);
          if (match && del_item) {
            target.splice(index, 1);
          }
          return match;
        });
      }
      if (prop == isObserved) {
        return true;
      }
      if (prop == "getAll") {
        return (rule, del_items) => target.filter((obj2, index) => {
          const match = deepCompare(rule, obj2);
          if (match && del_items) {
            target.splice(index, 1);
          }
          return match;
        });
      }
      if (prop == "matchCondition") {
        return (condition) => target.find((obj2) => {
          return condition(obj2);
        });
      }
      if (prop == "filterType") {
        return (...types) => {
          return observe(target.filter((node) => {
            return !!node.is(...types);
          }));
        };
      }
      if (prop == "firstOfType") {
        return (...types) => {
          return target.find((node) => {
            return !!node.is(...types);
          });
        };
      }
      if (prop == "first") {
        return () => target[0];
      }
      if (prop == "as") {
        return (...types) => {
          return observe(target.map((node) => {
            if (node.is(...types))
              return node;
            throw new ParsingError(`Expected node of any type ${types.map((type) => type.type).join(", ")}, got ${node.type}`);
          }));
        };
      }
      if (prop == "remove") {
        return (index) => target.splice(index, 1);
      }
      return Reflect.get(target, prop);
    }
  });
}
__name(observe, "observe");
var _Memo = class _Memo extends Map {
  getType(...types) {
    types = types.flat();
    return observe(types.flatMap((type) => this.get(type.type) || []));
  }
};
__name(_Memo, "Memo");
var Memo = _Memo;

// dist/src/parser/misc.js
var misc_exports = {};
__export(misc_exports, {
  AccessibilityContext: () => AccessibilityContext,
  AccessibilityData: () => AccessibilityData,
  Author: () => Author,
  ChildElement: () => ChildElement,
  CommandContext: () => CommandContext,
  EmojiRun: () => EmojiRun,
  Format: () => Format,
  RendererContext: () => RendererContext,
  SubscriptionButton: () => SubscriptionButton,
  Text: () => Text2,
  TextRun: () => TextRun,
  Thumbnail: () => Thumbnail,
  VideoDetails: () => VideoDetails
});

// dist/src/parser/classes/misc/AccessibilityContext.js
var _AccessibilityContext = class _AccessibilityContext {
  constructor(data) {
    __publicField(this, "label");
    this.label = data.label;
  }
};
__name(_AccessibilityContext, "AccessibilityContext");
var AccessibilityContext = _AccessibilityContext;

// dist/src/parser/classes/misc/AccessibilityData.js
var _AccessibilityData = class _AccessibilityData {
  constructor(data) {
    __publicField(this, "accessibility_identifier");
    __publicField(this, "identifier");
    __publicField(this, "label");
    if ("accessibilityIdentifier" in data) {
      this.accessibility_identifier = data.accessibilityIdentifier;
    }
    if ("identifier" in data) {
      this.identifier = {
        accessibility_id_type: data.identifier.accessibilityIdType
      };
    }
    if ("label" in data) {
      this.label = data.label;
    }
  }
};
__name(_AccessibilityData, "AccessibilityData");
var AccessibilityData = _AccessibilityData;

// dist/src/utils/Constants.js
var Constants_exports = {};
__export(Constants_exports, {
  CLIENTS: () => CLIENTS,
  CLIENT_NAME_IDS: () => CLIENT_NAME_IDS,
  INNERTUBE_HEADERS_BASE: () => INNERTUBE_HEADERS_BASE,
  OAUTH: () => OAUTH,
  STREAM_HEADERS: () => STREAM_HEADERS,
  SUPPORTED_CLIENTS: () => SUPPORTED_CLIENTS,
  URLS: () => URLS
});
var URLS = {
  YT_BASE: "https://www.youtube.com",
  YT_MUSIC_BASE: "https://music.youtube.com",
  YT_SUGGESTIONS: "https://suggestqueries-clients6.youtube.com",
  YT_UPLOAD: "https://upload.youtube.com/",
  API: {
    BASE: "https://youtubei.googleapis.com",
    PRODUCTION_1: "https://www.youtube.com/youtubei/",
    PRODUCTION_2: "https://youtubei.googleapis.com/youtubei/",
    STAGING: "https://green-youtubei.sandbox.googleapis.com/youtubei/",
    RELEASE: "https://release-youtubei.sandbox.googleapis.com/youtubei/",
    TEST: "https://test-youtubei.sandbox.googleapis.com/youtubei/",
    CAMI: "http://cami-youtubei.sandbox.googleapis.com/youtubei/",
    UYTFE: "https://uytfe.sandbox.google.com/youtubei/"
  },
  GOOGLE_SEARCH_BASE: "https://www.google.com/"
};
var OAUTH = {
  REGEX: {
    TV_SCRIPT: new RegExp('<script\\s+id="base-js"\\s+src="([^"]+)"[^>]*><\\/script>'),
    CLIENT_IDENTITY: new RegExp('clientId:"(?<client_id>[^"]+)",[^"]*?:"(?<client_secret>[^"]+)"')
  }
};
var CLIENTS = {
  IOS: {
    NAME: "iOS",
    VERSION: "20.11.6",
    USER_AGENT: "com.google.ios.youtube/20.11.6 (iPhone10,4; U; CPU iOS 16_7_7 like Mac OS X)",
    DEVICE_MODEL: "iPhone10,4",
    OS_NAME: "iOS",
    OS_VERSION: "16.7.7.20H330"
  },
  WEB: {
    NAME: "WEB",
    VERSION: "2.20260206.01.00",
    API_KEY: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    API_VERSION: "v1",
    STATIC_VISITOR_ID: "6zpwvWUNAco",
    SUGG_EXP_ID: "ytzpb5_e2,ytpo.bo.lqp.elu=1,ytpo.bo.lqp.ecsc=1,ytpo.bo.lqp.mcsc=3,ytpo.bo.lqp.mec=1,ytpo.bo.lqp.rw=0.8,ytpo.bo.lqp.fw=0.2,ytpo.bo.lqp.szp=1,ytpo.bo.lqp.mz=3,ytpo.bo.lqp.al=en_us,ytpo.bo.lqp.zrm=1,ytpo.bo.lqp.er=1,ytpo.bo.ro.erl=1,ytpo.bo.ro.mlus=3,ytpo.bo.ro.erls=3,ytpo.bo.qfo.mlus=3,ytzprp.ppp.e=1,ytzprp.ppp.st=772,ytzprp.ppp.p=5"
  },
  MWEB: {
    NAME: "MWEB",
    VERSION: "2.20260205.04.01",
    API_VERSION: "v1"
  },
  WEB_KIDS: {
    NAME: "WEB_KIDS",
    VERSION: "2.20260205.00.00"
  },
  YTMUSIC: {
    NAME: "WEB_REMIX",
    VERSION: "1.20250219.01.00"
  },
  ANDROID: {
    NAME: "ANDROID",
    VERSION: "21.03.36",
    SDK_VERSION: 36,
    USER_AGENT: "com.google.android.youtube/21.03.36(Linux; U; Android 16; en_US; SM-S908E Build/TP1A.220624.014) gzip"
  },
  ANDROID_VR: {
    NAME: "ANDROID_VR",
    VERSION: "1.65.10",
    SDK_VERSION: 32,
    DEVICE_MAKE: "Oculus",
    DEVICE_MODEL: "Quest 3",
    USER_AGENT: "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip"
  },
  YTSTUDIO_ANDROID: {
    NAME: "ANDROID_CREATOR",
    VERSION: "22.43.101"
  },
  YTMUSIC_ANDROID: {
    NAME: "ANDROID_MUSIC",
    VERSION: "5.34.51"
  },
  TV: {
    NAME: "TVHTML5",
    VERSION: "7.20260311.12.00",
    USER_AGENT: "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version"
  },
  TV_SIMPLY: {
    NAME: "TVHTML5_SIMPLY",
    VERSION: "1.0"
  },
  TV_EMBEDDED: {
    NAME: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    VERSION: "2.0"
  },
  WEB_EMBEDDED: {
    NAME: "WEB_EMBEDDED_PLAYER",
    VERSION: "1.20260206.01.00",
    API_KEY: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    API_VERSION: "v1",
    STATIC_VISITOR_ID: "6zpwvWUNAco"
  },
  WEB_CREATOR: {
    NAME: "WEB_CREATOR",
    VERSION: "1.20241203.01.00",
    API_KEY: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    API_VERSION: "v1",
    STATIC_VISITOR_ID: "6zpwvWUNAco"
  }
};
var CLIENT_NAME_IDS = {
  iOS: "5",
  WEB: "1",
  MWEB: "2",
  WEB_KIDS: "76",
  WEB_REMIX: "67",
  ANDROID: "3",
  ANDROID_CREATOR: "14",
  ANDROID_MUSIC: "21",
  ANDROID_VR: "28",
  TVHTML5: "7",
  TVHTML5_SIMPLY: "74",
  TVHTML5_SIMPLY_EMBEDDED_PLAYER: "85",
  WEB_EMBEDDED_PLAYER: "56",
  WEB_CREATOR: "62"
};
var STREAM_HEADERS = {
  "accept": "*/*",
  "origin": "https://www.youtube.com",
  "referer": "https://www.youtube.com",
  "DNT": "?1"
};
var INNERTUBE_HEADERS_BASE = {
  "accept": "*/*",
  "accept-encoding": "gzip, deflate",
  "content-type": "application/json"
};
var SUPPORTED_CLIENTS = ["IOS", "WEB", "MWEB", "YTKIDS", "YTMUSIC", "ANDROID", "ANDROID_VR", "YTSTUDIO_ANDROID", "YTMUSIC_ANDROID", "TV", "TV_SIMPLY", "TV_EMBEDDED", "WEB_EMBEDDED", "WEB_CREATOR"];

// dist/src/parser/parser.js
var parser_exports = {};
__export(parser_exports, {
  addRuntimeParser: () => addRuntimeParser,
  applyCommentsMutations: () => applyCommentsMutations,
  applyMutations: () => applyMutations,
  getDynamicParsers: () => getDynamicParsers,
  getParserByName: () => getParserByName,
  hasParser: () => hasParser,
  parse: () => parse,
  parseActions: () => parseActions,
  parseArray: () => parseArray,
  parseC: () => parseC,
  parseCommand: () => parseCommand,
  parseCommands: () => parseCommands,
  parseFormats: () => parseFormats,
  parseItem: () => parseItem,
  parseLC: () => parseLC,
  parseRR: () => parseRR,
  parseResponse: () => parseResponse,
  sanitizeClassName: () => sanitizeClassName,
  setParserErrorHandler: () => setParserErrorHandler,
  shouldIgnore: () => shouldIgnore
});

// dist/src/parser/nodes.js
var nodes_exports = {};
__export(nodes_exports, {
  AboutChannel: () => AboutChannel,
  AboutChannelView: () => AboutChannelView,
  AccountChannel: () => AccountChannel,
  AccountItem: () => AccountItem,
  AccountItemSection: () => AccountItemSection,
  AccountItemSectionHeader: () => AccountItemSectionHeader,
  AccountSectionList: () => AccountSectionList,
  ActiveAccountHeader: () => ActiveAccountHeader,
  AddBannerToLiveChatCommand: () => AddBannerToLiveChatCommand,
  AddChatItemAction: () => AddChatItemAction,
  AddLiveChatTickerItemAction: () => AddLiveChatTickerItemAction,
  AddToPlaylist: () => AddToPlaylist,
  AddToPlaylistCommand: () => AddToPlaylistCommand,
  AddToPlaylistEndpoint: () => AddToPlaylistEndpoint,
  AddToPlaylistServiceEndpoint: () => AddToPlaylistServiceEndpoint,
  Alert: () => Alert,
  AlertWithButton: () => AlertWithButton,
  AnchoredSection: () => AnchoredSection,
  AnimatedThumbnailOverlayView: () => AnimatedThumbnailOverlayView,
  AppendContinuationItemsAction: () => AppendContinuationItemsAction,
  AttributionView: () => AttributionView,
  AudioOnlyPlayability: () => AudioOnlyPlayability,
  AuthorCommentBadge: () => AuthorCommentBadge,
  AutomixPreviewVideo: () => AutomixPreviewVideo,
  AvatarStackView: () => AvatarStackView,
  AvatarView: () => AvatarView,
  BackgroundPromo: () => BackgroundPromo,
  BackstageImage: () => BackstageImage,
  BackstagePost: () => BackstagePost,
  BackstagePostThread: () => BackstagePostThread,
  BadgeView: () => BadgeView,
  BrowseEndpoint: () => BrowseEndpoint,
  BrowseFeedActions: () => BrowseFeedActions,
  BrowserMediaSession: () => BrowserMediaSession,
  BumperUserEduContentView: () => BumperUserEduContentView,
  Button: () => Button,
  ButtonCardView: () => ButtonCardView,
  ButtonView: () => ButtonView,
  C4TabbedHeader: () => C4TabbedHeader,
  CallToActionButton: () => CallToActionButton,
  Card: () => Card,
  CardCollection: () => CardCollection,
  CarouselHeader: () => CarouselHeader,
  CarouselItem: () => CarouselItem,
  CarouselItemView: () => CarouselItemView,
  CarouselLockup: () => CarouselLockup,
  CarouselTitleView: () => CarouselTitleView,
  ChangeEngagementPanelVisibilityAction: () => ChangeEngagementPanelVisibilityAction,
  Channel: () => Channel,
  ChannelAboutFullMetadata: () => ChannelAboutFullMetadata,
  ChannelAgeGate: () => ChannelAgeGate,
  ChannelExternalLinkView: () => ChannelExternalLinkView,
  ChannelFeaturedContent: () => ChannelFeaturedContent,
  ChannelHeaderLinks: () => ChannelHeaderLinks,
  ChannelHeaderLinksView: () => ChannelHeaderLinksView,
  ChannelMetadata: () => ChannelMetadata,
  ChannelMobileHeader: () => ChannelMobileHeader,
  ChannelOptions: () => ChannelOptions,
  ChannelOwnerEmptyState: () => ChannelOwnerEmptyState,
  ChannelSubMenu: () => ChannelSubMenu,
  ChannelSwitcherHeader: () => ChannelSwitcherHeader,
  ChannelSwitcherPage: () => ChannelSwitcherPage,
  ChannelTagline: () => ChannelTagline,
  ChannelThumbnailWithLink: () => ChannelThumbnailWithLink,
  ChannelVideoPlayer: () => ChannelVideoPlayer,
  Chapter: () => Chapter,
  ChildVideo: () => ChildVideo,
  ChipBarView: () => ChipBarView,
  ChipCloud: () => ChipCloud,
  ChipCloudChip: () => ChipCloudChip,
  ChipView: () => ChipView,
  ClientSideToggleMenuItem: () => ClientSideToggleMenuItem,
  ClipAdState: () => ClipAdState,
  ClipCreation: () => ClipCreation,
  ClipCreationScrubber: () => ClipCreationScrubber,
  ClipCreationTextInput: () => ClipCreationTextInput,
  ClipSection: () => ClipSection,
  CollaboratorInfoCardContent: () => CollaboratorInfoCardContent,
  CollageHeroImage: () => CollageHeroImage,
  CollectionThumbnailView: () => CollectionThumbnailView,
  CommandExecutorCommand: () => CommandExecutorCommand,
  CommentActionButtons: () => CommentActionButtons,
  CommentDialog: () => CommentDialog,
  CommentReplies: () => CommentReplies,
  CommentReplyDialog: () => CommentReplyDialog,
  CommentSimplebox: () => CommentSimplebox,
  CommentThread: () => CommentThread,
  CommentView: () => CommentView,
  CommentsEntryPointHeader: () => CommentsEntryPointHeader,
  CommentsEntryPointTeaser: () => CommentsEntryPointTeaser,
  CommentsHeader: () => CommentsHeader,
  CommentsSimplebox: () => CommentsSimplebox,
  CompactChannel: () => CompactChannel,
  CompactLink: () => CompactLink,
  CompactMix: () => CompactMix,
  CompactMovie: () => CompactMovie,
  CompactPlaylist: () => CompactPlaylist_default,
  CompactStation: () => CompactStation,
  CompactVideo: () => CompactVideo,
  CompositeVideoPrimaryInfo: () => CompositeVideoPrimaryInfo,
  ConfirmDialog: () => ConfirmDialog,
  ContentMetadataView: () => ContentMetadataView,
  ContentPreviewImageView: () => ContentPreviewImageView,
  ContinuationCommand: () => ContinuationCommand,
  ContinuationItem: () => ContinuationItem,
  ConversationBar: () => ConversationBar,
  CopyLink: () => CopyLink,
  CreateCommentEndpoint: () => CreateCommentEndpoint,
  CreatePlaylistDialog: () => CreatePlaylistDialog,
  CreatePlaylistDialogFormView: () => CreatePlaylistDialogFormView,
  CreatePlaylistServiceEndpoint: () => CreatePlaylistServiceEndpoint,
  CreatorHeart: () => CreatorHeart,
  CreatorHeartView: () => CreatorHeartView,
  DecoratedAvatarView: () => DecoratedAvatarView,
  DecoratedPlayerBar: () => DecoratedPlayerBar,
  DefaultPromoPanel: () => DefaultPromoPanel,
  DeletePlaylistEndpoint: () => DeletePlaylistEndpoint,
  DescriptionPreviewView: () => DescriptionPreviewView,
  DialogHeaderView: () => DialogHeaderView,
  DialogView: () => DialogView,
  DidYouMean: () => DidYouMean,
  DimChatItemAction: () => DimChatItemAction,
  DislikeButtonView: () => DislikeButtonView,
  DismissableDialog: () => DismissableDialog,
  DismissableDialogContentSection: () => DismissableDialogContentSection,
  DownloadButton: () => DownloadButton,
  Dropdown: () => Dropdown,
  DropdownItem: () => DropdownItem,
  DropdownView: () => DropdownView,
  DynamicTextView: () => DynamicTextView,
  Element: () => Element,
  EmergencyOnebox: () => EmergencyOnebox,
  EmojiPicker: () => EmojiPicker,
  EmojiPickerCategory: () => EmojiPickerCategory,
  EmojiPickerCategoryButton: () => EmojiPickerCategoryButton,
  EmojiPickerUpsellCategory: () => EmojiPickerUpsellCategory,
  EndScreenPlaylist: () => EndScreenPlaylist,
  EndScreenVideo: () => EndScreenVideo,
  Endscreen: () => Endscreen,
  EndscreenElement: () => EndscreenElement,
  EngagementPanelSectionList: () => EngagementPanelSectionList,
  EngagementPanelTitleHeader: () => EngagementPanelTitleHeader,
  EomSettingsDisclaimer: () => EomSettingsDisclaimer,
  ExpandableMetadata: () => ExpandableMetadata,
  ExpandableTab: () => ExpandableTab,
  ExpandableVideoDescriptionBody: () => ExpandableVideoDescriptionBody,
  ExpandedShelfContents: () => ExpandedShelfContents,
  Factoid: () => Factoid,
  FancyDismissibleDialog: () => FancyDismissibleDialog,
  FeedFilterChipBar: () => FeedFilterChipBar,
  FeedNudge: () => FeedNudge,
  FeedTabbedHeader: () => FeedTabbedHeader,
  FeedbackEndpoint: () => FeedbackEndpoint,
  FlexibleActionsView: () => FlexibleActionsView,
  Form: () => Form,
  FormFooterView: () => FormFooterView,
  FormPopup: () => FormPopup,
  GameCard: () => GameCard,
  GameDetails: () => GameDetails,
  GetAccountsListInnertubeEndpoint: () => GetAccountsListInnertubeEndpoint,
  GetKidsBlocklistPickerCommand: () => GetKidsBlocklistPickerCommand,
  GetMultiPageMenuAction: () => GetMultiPageMenuAction,
  Grid: () => Grid,
  GridChannel: () => GridChannel,
  GridHeader: () => GridHeader,
  GridMix: () => GridMix,
  GridMovie: () => GridMovie,
  GridPlaylist: () => GridPlaylist,
  GridShelfView: () => GridShelfView,
  GridShow: () => GridShow,
  GridVideo: () => GridVideo,
  GuideCollapsibleEntry: () => GuideCollapsibleEntry,
  GuideCollapsibleSectionEntry: () => GuideCollapsibleSectionEntry,
  GuideDownloadsEntry: () => GuideDownloadsEntry,
  GuideEntry: () => GuideEntry,
  GuideSection: () => GuideSection,
  GuideSubscriptionsSection: () => GuideSubscriptionsSection,
  HashtagHeader: () => HashtagHeader,
  HashtagTile: () => HashtagTile,
  HeatMarker: () => HeatMarker,
  Heatmap: () => Heatmap,
  HeroPlaylistThumbnail: () => HeroPlaylistThumbnail,
  HideEngagementPanelEndpoint: () => HideEngagementPanelEndpoint,
  HighlightsCarousel: () => HighlightsCarousel,
  HistorySuggestion: () => HistorySuggestion,
  HorizontalCardList: () => HorizontalCardList,
  HorizontalList: () => HorizontalList,
  HorizontalMovieList: () => HorizontalMovieList,
  HowThisWasMadeSectionView: () => HowThisWasMadeSectionView,
  HypePointsFactoid: () => HypePointsFactoid,
  IconLink: () => IconLink,
  ImageBannerView: () => ImageBannerView,
  IncludingResultsFor: () => IncludingResultsFor,
  InfoPanelContainer: () => InfoPanelContainer,
  InfoPanelContent: () => InfoPanelContent,
  InfoRow: () => InfoRow,
  InteractiveTabbedHeader: () => InteractiveTabbedHeader,
  ItemSection: () => ItemSection,
  ItemSectionHeader: () => ItemSectionHeader,
  ItemSectionTab: () => ItemSectionTab,
  ItemSectionTabbedHeader: () => ItemSectionTabbedHeader,
  KidsBlocklistPicker: () => KidsBlocklistPicker,
  KidsBlocklistPickerItem: () => KidsBlocklistPickerItem,
  KidsCategoriesHeader: () => KidsCategoriesHeader,
  KidsCategoryTab: () => KidsCategoryTab,
  KidsHomeScreen: () => KidsHomeScreen,
  LikeButton: () => LikeButton,
  LikeButtonView: () => LikeButtonView,
  LikeEndpoint: () => LikeEndpoint,
  ListItemView: () => ListItemView,
  ListView: () => ListView,
  LiveChat: () => LiveChat,
  LiveChatActionPanel: () => LiveChatActionPanel,
  LiveChatAuthorBadge: () => LiveChatAuthorBadge,
  LiveChatAutoModMessage: () => LiveChatAutoModMessage,
  LiveChatBanner: () => LiveChatBanner,
  LiveChatBannerChatSummary: () => LiveChatBannerChatSummary,
  LiveChatBannerHeader: () => LiveChatBannerHeader,
  LiveChatBannerPoll: () => LiveChatBannerPoll,
  LiveChatBannerRedirect: () => LiveChatBannerRedirect,
  LiveChatDialog: () => LiveChatDialog,
  LiveChatHeader: () => LiveChatHeader,
  LiveChatItemBumperView: () => LiveChatItemBumperView,
  LiveChatItemContextMenuEndpoint: () => LiveChatItemContextMenuEndpoint,
  LiveChatItemList: () => LiveChatItemList,
  LiveChatMembershipItem: () => LiveChatMembershipItem,
  LiveChatMessageInput: () => LiveChatMessageInput,
  LiveChatModeChangeMessage: () => LiveChatModeChangeMessage,
  LiveChatPaidMessage: () => LiveChatPaidMessage,
  LiveChatPaidSticker: () => LiveChatPaidSticker,
  LiveChatParticipant: () => LiveChatParticipant,
  LiveChatParticipantsList: () => LiveChatParticipantsList,
  LiveChatPlaceholderItem: () => LiveChatPlaceholderItem,
  LiveChatProductItem: () => LiveChatProductItem,
  LiveChatRestrictedParticipation: () => LiveChatRestrictedParticipation,
  LiveChatSponsorshipsGiftPurchaseAnnouncement: () => LiveChatSponsorshipsGiftPurchaseAnnouncement,
  LiveChatSponsorshipsGiftRedemptionAnnouncement: () => LiveChatSponsorshipsGiftRedemptionAnnouncement,
  LiveChatSponsorshipsHeader: () => LiveChatSponsorshipsHeader,
  LiveChatTextMessage: () => LiveChatTextMessage,
  LiveChatTickerPaidMessageItem: () => LiveChatTickerPaidMessageItem,
  LiveChatTickerPaidStickerItem: () => LiveChatTickerPaidStickerItem,
  LiveChatTickerSponsorItem: () => LiveChatTickerSponsorItem,
  LiveChatViewerEngagementMessage: () => LiveChatViewerEngagementMessage,
  LockupMetadataView: () => LockupMetadataView,
  LockupView: () => LockupView,
  MacroMarkersInfoItem: () => MacroMarkersInfoItem,
  MacroMarkersList: () => MacroMarkersList,
  MacroMarkersListEntity: () => MacroMarkersListEntity,
  MacroMarkersListItem: () => MacroMarkersListItem,
  MarkChatItemAsDeletedAction: () => MarkChatItemAsDeletedAction,
  MarkChatItemsByAuthorAsDeletedAction: () => MarkChatItemsByAuthorAsDeletedAction,
  Menu: () => Menu,
  MenuFlexibleItem: () => MenuFlexibleItem,
  MenuNavigationItem: () => MenuNavigationItem,
  MenuPopup: () => MenuPopup,
  MenuServiceItem: () => MenuServiceItem,
  MenuServiceItemDownload: () => MenuServiceItemDownload,
  MenuTitle: () => MenuTitle,
  MerchandiseItem: () => MerchandiseItem,
  MerchandiseShelf: () => MerchandiseShelf,
  Message: () => Message,
  MetadataBadge: () => MetadataBadge,
  MetadataRow: () => MetadataRow,
  MetadataRowContainer: () => MetadataRowContainer,
  MetadataRowHeader: () => MetadataRowHeader,
  MetadataScreen: () => MetadataScreen,
  MicroformatData: () => MicroformatData,
  Mix: () => Mix,
  MobileTopbar: () => MobileTopbar,
  ModalWithTitleAndButton: () => ModalWithTitleAndButton,
  ModifyChannelNotificationPreferenceEndpoint: () => ModifyChannelNotificationPreferenceEndpoint,
  Movie: () => Movie,
  MovingThumbnail: () => MovingThumbnail,
  MultiMarkersPlayerBar: () => MultiMarkersPlayerBar,
  MultiPageMenu: () => MultiPageMenu,
  MultiPageMenuNotificationSection: () => MultiPageMenuNotificationSection,
  MultiPageMenuSection: () => MultiPageMenuSection,
  MusicCardShelf: () => MusicCardShelf,
  MusicCardShelfHeaderBasic: () => MusicCardShelfHeaderBasic,
  MusicCarouselShelf: () => MusicCarouselShelf,
  MusicCarouselShelfBasicHeader: () => MusicCarouselShelfBasicHeader,
  MusicDescriptionShelf: () => MusicDescriptionShelf,
  MusicDetailHeader: () => MusicDetailHeader,
  MusicDownloadStateBadge: () => MusicDownloadStateBadge,
  MusicEditablePlaylistDetailHeader: () => MusicEditablePlaylistDetailHeader,
  MusicElementHeader: () => MusicElementHeader,
  MusicHeader: () => MusicHeader,
  MusicImmersiveHeader: () => MusicImmersiveHeader,
  MusicInlineBadge: () => MusicInlineBadge,
  MusicItemThumbnailOverlay: () => MusicItemThumbnailOverlay,
  MusicLargeCardItemCarousel: () => MusicLargeCardItemCarousel,
  MusicMenuItemDivider: () => MusicMenuItemDivider,
  MusicMultiRowListItem: () => MusicMultiRowListItem,
  MusicMultiSelectMenu: () => MusicMultiSelectMenu,
  MusicMultiSelectMenuItem: () => MusicMultiSelectMenuItem,
