"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthContext: () => AuthContext,
  AuthProvider: () => AuthProvider,
  hasAuthParams: () => hasAuthParams,
  useAuth: () => useAuth,
  useAutoSignin: () => useAutoSignin,
  withAuth: () => withAuth,
  withAuthenticationRequired: () => withAuthenticationRequired
});
module.exports = __toCommonJS(index_exports);

// src/AuthContext.ts
var import_react = __toESM(require("react"));
var AuthContext = import_react.default.createContext(void 0);
AuthContext.displayName = "AuthContext";

// src/AuthProvider.tsx
var import_oidc_client_ts = require("oidc-client-ts");
var import_react2 = __toESM(require("react"));

// src/AuthState.ts
var initialAuthState = {
  isLoading: true,
  isAuthenticated: false
};

// src/reducer.ts
var reducer = (state, action) => {
  switch (action.type) {
    case "INITIALISED":
    case "USER_LOADED":
      return {
        ...state,
        user: action.user,
        isLoading: false,
        isAuthenticated: action.user ? !action.user.expired : false,
        error: void 0
      };
    case "USER_SIGNED_OUT":
    case "USER_UNLOADED":
      return {
        ...state,
        user: void 0,
        isAuthenticated: false
      };
    case "NAVIGATOR_INIT":
      return {
        ...state,
        isLoading: true,
        activeNavigator: action.method
      };
    case "NAVIGATOR_CLOSE":
      return {
        ...state,
        isLoading: false,
        activeNavigator: void 0
      };
    case "ERROR": {
      const error = action.error;
      error["toString"] = () => `${error.name}: ${error.message}`;
      return {
        ...state,
        isLoading: false,
        error
      };
    }
    default: {
      const innerError = new TypeError(`unknown type ${action["type"]}`);
      const error = {
        name: innerError.name,
        message: innerError.message,
        innerError,
        stack: innerError.stack,
        source: "unknown"
      };
      error["toString"] = () => `${error.name}: ${error.message}`;
      return {
        ...state,
        isLoading: false,
        error
      };
    }
  }
};

// src/utils.ts
var hasAuthParams = (location = window.location) => {
  let searchParams = new URLSearchParams(location.search);
  if ((searchParams.get("code") || searchParams.get("error")) && searchParams.get("state")) {
    return true;
  }
  searchParams = new URLSearchParams(location.hash.replace("#", "?"));
  if ((searchParams.get("code") || searchParams.get("error")) && searchParams.get("state")) {
    return true;
  }
  return false;
};
var signinError = normalizeErrorFn("signinCallback", "Sign-in failed");
var signoutError = normalizeErrorFn("signoutCallback", "Sign-out failed");
var renewSilentError = normalizeErrorFn("renewSilent", "Renew silent failed");
function normalizeError(error, fallbackMessage) {
  return {
    name: stringFieldOf(error, "name", () => "Error"),
    message: stringFieldOf(error, "message", () => fallbackMessage),
    stack: stringFieldOf(error, "stack", () => new Error().stack),
    innerError: error
  };
}
function normalizeErrorFn(source, fallbackMessage) {
  return (error) => {
    return {
      ...normalizeError(error, fallbackMessage),
      source
    };
  };
}
function stringFieldOf(element, fieldName, or) {
  if (element && typeof element === "object") {
    const value = element[fieldName];
    if (typeof value === "string") {
      return value;
    }
  }
  return or();
}

// src/AuthProvider.tsx
var userManagerContextKeys = [
  "clearStaleState",
  "querySessionStatus",
  "revokeTokens",
  "startSilentRenew",
  "stopSilentRenew"
];
var navigatorKeys = [
  "signinPopup",
  "signinSilent",
  "signinRedirect",
  "signinResourceOwnerCredentials",
  "signoutPopup",
  "signoutRedirect",
  "signoutSilent"
];
var unsupportedEnvironment = (fnName) => () => {
  throw new Error(
    `UserManager#${fnName} was called from an unsupported context. If this is a server-rendered page, defer this call with useEffect() or pass a custom UserManager implementation.`
  );
};
var UserManagerImpl = typeof window === "undefined" ? null : import_oidc_client_ts.UserManager;
var AuthProvider = (props) => {
  const {
    children,
    onSigninCallback,
    skipSigninCallback,
    matchSignoutCallback,
    onSignoutCallback,
    onRemoveUser,
    userManager: userManagerProp = null,
    ...userManagerSettings
  } = props;
  const [userManager] = import_react2.default.useState(() => {
    return userManagerProp != null ? userManagerProp : UserManagerImpl ? new UserManagerImpl(userManagerSettings) : { settings: userManagerSettings };
  });
  const [state, dispatch] = import_react2.default.useReducer(reducer, initialAuthState);
  const userManagerContext = import_react2.default.useMemo(
    () => Object.assign(
      {
        settings: userManager.settings,
        events: userManager.events
      },
      Object.fromEntries(
        userManagerContextKeys.map((key) => {
          var _a, _b;
          return [
            key,
            (_b = (_a = userManager[key]) == null ? void 0 : _a.bind(userManager)) != null ? _b : unsupportedEnvironment(key)
          ];
        })
      ),
      Object.fromEntries(
        navigatorKeys.map((key) => [
          key,
          userManager[key] ? async (args) => {
            dispatch({
              type: "NAVIGATOR_INIT",
              method: key
            });
            try {
              return await userManager[key](args);
            } catch (error) {
              dispatch({
                type: "ERROR",
                error: {
                  ...normalizeError(error, `Unknown error while executing ${key}(...).`),
                  source: key,
                  args
                }
              });
              return null;
            } finally {
              dispatch({ type: "NAVIGATOR_CLOSE" });
            }
          } : unsupportedEnvironment(key)
        ])
      )
    ),
    [userManager]
  );
  const didInitialize = import_react2.default.useRef(false);
  import_react2.default.useEffect(() => {
    if (!userManager || didInitialize.current) {
      return;
    }
    didInitialize.current = true;
    void (async () => {
      try {
        let user = null;
        if (hasAuthParams() && !skipSigninCallback) {
          user = await userManager.signinCallback();
          if (onSigninCallback) await onSigninCallback(user);
        }
        user = !user ? await userManager.getUser() : user;
        dispatch({ type: "INITIALISED", user });
      } catch (error) {
        dispatch({
          type: "ERROR",
          error: signinError(error)
        });
      }
      try {
        if (matchSignoutCallback && matchSignoutCallback(userManager.settings)) {
          const resp = await userManager.signoutCallback();
          if (onSignoutCallback) await onSignoutCallback(resp);
        }
      } catch (error) {
        dispatch({
          type: "ERROR",
          error: signoutError(error)
        });
      }
    })();
  }, [userManager, skipSigninCallback, onSigninCallback, onSignoutCallback, matchSignoutCallback]);
  import_react2.default.useEffect(() => {
    if (!userManager) return void 0;
    const handleUserLoaded = (user) => {
      dispatch({ type: "USER_LOADED", user });
    };
    userManager.events.addUserLoaded(handleUserLoaded);
    const handleUserUnloaded = () => {
      dispatch({ type: "USER_UNLOADED" });
    };
    userManager.events.addUserUnloaded(handleUserUnloaded);
    const handleUserSignedOut = () => {
      dispatch({ type: "USER_SIGNED_OUT" });
    };
    userManager.events.addUserSignedOut(handleUserSignedOut);
    const handleSilentRenewError = (error) => {
      dispatch({
        type: "ERROR",
        error: renewSilentError(error)
      });
    };
    userManager.events.addSilentRenewError(handleSilentRenewError);
    return () => {
      userManager.events.removeUserLoaded(handleUserLoaded);
      userManager.events.removeUserUnloaded(handleUserUnloaded);
      userManager.events.removeUserSignedOut(handleUserSignedOut);
      userManager.events.removeSilentRenewError(handleSilentRenewError);
    };
  }, [userManager]);
  const removeUser = import_react2.default.useCallback(async () => {
    if (!userManager) unsupportedEnvironment("removeUser");
    await userManager.removeUser();
    if (onRemoveUser) await onRemoveUser();
  }, [userManager, onRemoveUser]);
  const contextValue = import_react2.default.useMemo(() => {
    return {
      ...state,
      ...userManagerContext,
      removeUser
    };
  }, [state, userManagerContext, removeUser]);
  return /* @__PURE__ */ import_react2.default.createElement(AuthContext.Provider, { value: contextValue }, children);
};

// src/useAuth.ts
var import_react3 = __toESM(require("react"));
var useAuth = () => {
  const context = import_react3.default.useContext(AuthContext);
  if (!context) {
    console.warn("AuthProvider context is undefined, please verify you are calling useAuth() as child of a <AuthProvider> component.");
  }
  return context;
};

// src/useAutoSignin.ts
var import_react4 = __toESM(require("react"));
var useAutoSignin = ({ signinMethod = "signinRedirect" } = {}) => {
  const auth = useAuth();
  const [hasTriedSignin, setHasTriedSignin] = import_react4.default.useState(false);
  const shouldAttemptSignin = import_react4.default.useMemo(() => !hasAuthParams() && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading && !hasTriedSignin, [auth.activeNavigator, auth.isAuthenticated, auth.isLoading, hasTriedSignin]);
  import_react4.default.useEffect(() => {
    if (shouldAttemptSignin) {
      switch (signinMethod) {
        case "signinPopup":
          void auth.signinPopup();
          break;
        case "signinRedirect":
        default:
          void auth.signinRedirect();
          break;
      }
      setHasTriedSignin(true);
    }
  }, [auth, hasTriedSignin, shouldAttemptSignin, signinMethod]);
  return {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    error: auth.error
  };
};

// src/withAuth.tsx
var import_react5 = __toESM(require("react"));
function withAuth(Component) {
  const displayName = `withAuth(${Component.displayName || Component.name})`;
  const C = (props) => {
    const auth = useAuth();
    return /* @__PURE__ */ import_react5.default.createElement(Component, { ...props, auth });
  };
  C.displayName = displayName;
  return C;
}

// src/withAuthenticationRequired.tsx
var import_react6 = __toESM(require("react"));
var withAuthenticationRequired = (Component, options = {}) => {
  const { OnRedirecting = () => /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null), onBeforeSignin, signinRedirectArgs } = options;
  const displayName = `withAuthenticationRequired(${Component.displayName || Component.name})`;
  const C = (props) => {
    const auth = useAuth();
    import_react6.default.useEffect(() => {
      if (hasAuthParams() || auth.isLoading || auth.activeNavigator || auth.isAuthenticated) {
        return;
      }
      void (async () => {
        if (onBeforeSignin) await onBeforeSignin();
        await auth.signinRedirect(signinRedirectArgs);
      })();
    }, [auth.isLoading, auth.isAuthenticated, auth]);
    return auth.isAuthenticated ? /* @__PURE__ */ import_react6.default.createElement(Component, { ...props }) : OnRedirecting();
  };
  C.displayName = displayName;
  return C;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthContext,
  AuthProvider,
  hasAuthParams,
  useAuth,
  useAutoSignin,
  withAuth,
  withAuthenticationRequired
});
//# sourceMappingURL=react-oidc-context.js.map
