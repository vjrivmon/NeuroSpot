import type { QuerySessionStatusArgs } from 'oidc-client-ts';
import { default as React_2 } from 'react';
import type { RevokeTokensTypes } from 'oidc-client-ts';
import type { SessionStatus } from 'oidc-client-ts';
import type { SigninPopupArgs } from 'oidc-client-ts';
import type { SigninRedirectArgs } from 'oidc-client-ts';
import type { SigninResourceOwnerCredentialsArgs } from 'oidc-client-ts';
import type { SigninSilentArgs } from 'oidc-client-ts';
import type { SignoutPopupArgs } from 'oidc-client-ts';
import type { SignoutRedirectArgs } from 'oidc-client-ts';
import type { SignoutResponse } from 'oidc-client-ts';
import type { SignoutSilentArgs } from 'oidc-client-ts';
import { User } from 'oidc-client-ts';
import { UserManager } from 'oidc-client-ts';
import type { UserManagerEvents } from 'oidc-client-ts';
import { UserManagerSettings } from 'oidc-client-ts';

/**
 * @public
 */
export declare const AuthContext: React_2.Context<AuthContextProps | undefined>;

/**
 * @public
 */
export declare interface AuthContextProps extends AuthState {
    /**
     * UserManager functions. See [UserManager](https://github.com/authts/oidc-client-ts) for more details.
     */
    readonly settings: UserManagerSettings;
    readonly events: UserManagerEvents;
    clearStaleState(): Promise<void>;
    removeUser(): Promise<void>;
    signinPopup(args?: SigninPopupArgs): Promise<User>;
    signinSilent(args?: SigninSilentArgs): Promise<User | null>;
    signinRedirect(args?: SigninRedirectArgs): Promise<void>;
    signinResourceOwnerCredentials(args: SigninResourceOwnerCredentialsArgs): Promise<User>;
    signoutRedirect(args?: SignoutRedirectArgs): Promise<void>;
    signoutPopup(args?: SignoutPopupArgs): Promise<void>;
    signoutSilent(args?: SignoutSilentArgs): Promise<void>;
    querySessionStatus(args?: QuerySessionStatusArgs): Promise<SessionStatus | null>;
    revokeTokens(types?: RevokeTokensTypes): Promise<void>;
    startSilentRenew(): void;
    stopSilentRenew(): void;
}

/**
 * Provides the AuthContext to its child components.
 *
 * @public
 */
export declare const AuthProvider: (props: AuthProviderProps) => React_2.JSX.Element;

/**
 * @public
 */
export declare interface AuthProviderBaseProps {
    /**
     * The child nodes your Provider has wrapped
     */
    children?: React_2.ReactNode;
    /**
     * On sign in callback hook. Can be a async function.
     * Here you can remove the code and state parameters from the url when you are redirected from the authorize page.
     *
     * ```jsx
     * const onSigninCallback = (_user: User | undefined): void => {
     *     window.history.replaceState(
     *         {},
     *         document.title,
     *         window.location.pathname
     *     )
     * }
     * ```
     */
    onSigninCallback?: (user: User | undefined) => Promise<void> | void;
    /**
     * By default, if the page url has code/state params, this provider will call automatically the `userManager.signinCallback`.
     * In some cases the code might be for something else (another OAuth SDK perhaps). In these
     * instances you can instruct the client to ignore them.
     *
     * ```jsx
     * <AuthProvider
     *   skipSigninCallback={window.location.pathname === "/stripe-oauth-callback"}
     * >
     * ```
     */
    skipSigninCallback?: boolean;
    /**
     * Match the redirect uri used for logout (e.g. `post_logout_redirect_uri`)
     * This provider will then call automatically the `userManager.signoutCallback`.
     *
     * HINT:
     * Do not call `userManager.signoutRedirect()` within a `React.useEffect`, otherwise the
     * logout might be unsuccessful.
     *
     * ```jsx
     * <AuthProvider
     *   matchSignoutCallback={(args) => {
     *     window &&
     *     (window.location.href === args.post_logout_redirect_uri);
     *   }}
     * ```
     */
    matchSignoutCallback?: (args: UserManagerSettings) => boolean;
    /**
     * On sign out callback hook. Can be a async function.
     * Here you can change the url after the user is signed out.
     * When using this, specifying `matchSignoutCallback` is required.
     *
     * ```jsx
     * const onSignoutCallback = (resp: SignoutResponse | undefined): void => {
     *     // go to home after logout
     *     window.location.pathname = ""
     * }
     * ```
     */
    onSignoutCallback?: (resp: SignoutResponse | undefined) => Promise<void> | void;
    /**
     * On remove user hook. Can be a async function.
     * Here you can change the url after the user is removed.
     *
     * ```jsx
     * const onRemoveUser = (): void => {
     *     // go to home after logout
     *     window.location.pathname = ""
     * }
     * ```
     */
    onRemoveUser?: () => Promise<void> | void;
}

/**
 * This interface (default) is used to pass `UserManagerSettings` together with `AuthProvider` properties to the provider.
 *
 * @public
 */
export declare interface AuthProviderNoUserManagerProps extends AuthProviderBaseProps, UserManagerSettings {
    /**
     * Prevent this property.
     */
    userManager?: never;
}

/**
 * @public
 */
export declare type AuthProviderProps = AuthProviderNoUserManagerProps | AuthProviderUserManagerProps;

/**
 * This interface is used to pass directly a `UserManager` instance together with `AuthProvider` properties to the provider.
 *
 * @public
 */
export declare interface AuthProviderUserManagerProps extends AuthProviderBaseProps {
    /**
     * Allow passing a custom UserManager instance.
     */
    userManager?: UserManager;
}

/**
 * The auth state which, when combined with the auth methods, make up the return object of the `useAuth` hook.
 *
 * @public
 */
export declare interface AuthState {
    /**
     * See [User](https://authts.github.io/oidc-client-ts/classes/User.html) for more details.
     */
    user?: User | null;
    /**
     * True when the library has been initialized and no navigator request is in progress.
     */
    isLoading: boolean;
    /**
     * True while the user has a valid access token.
     */
    isAuthenticated: boolean;
    /**
     * Tracks the status of most recent signin/signout request method.
     */
    activeNavigator?: "signinRedirect" | "signinResourceOwnerCredentials" | "signinPopup" | "signinSilent" | "signoutRedirect" | "signoutPopup" | "signoutSilent";
    /**
     * Was there a signin or silent renew error?
     */
    error?: ErrorContext;
}

/**
 * Represents an error while execution of a signing, renew, ...
 *
 * @public
 */
export declare type ErrorContext = Error & {
    innerError?: unknown;
} & ({
    source: "signinCallback";
} | {
    source: "signoutCallback";
} | {
    source: "renewSilent";
} | {
    source: "signinPopup";
    args: SigninPopupArgs | undefined;
} | {
    source: "signinSilent";
    args: SigninSilentArgs | undefined;
} | {
    source: "signinRedirect";
    args: SigninRedirectArgs | undefined;
} | {
    source: "signinResourceOwnerCredentials";
    args: SigninResourceOwnerCredentialsArgs | undefined;
} | {
    source: "signoutPopup";
    args: SignoutPopupArgs | undefined;
} | {
    source: "signoutRedirect";
    args: SignoutRedirectArgs | undefined;
} | {
    source: "signoutSilent";
    args: SignoutSilentArgs | undefined;
} | {
    source: "unknown";
});

/**
 * @public
 */
export declare const hasAuthParams: (location?: Location) => boolean;

/**
 * @public
 */
export declare const useAuth: () => AuthContextProps;

/**
 * @public
 *
 * Automatically attempts to sign in a user based on the provided sign-in method and authentication state.
 *
 * This hook manages automatic sign-in behavior for a user. It uses the specified sign-in
 * method, the current authentication state, and ensures the sign-in attempt is made only once
 * in the application context.
 *
 * Does not support the `signinResourceOwnerCredentials` method!
 *
 * @param options - (Optional) Configuration object for the sign-in method. Default to `{ signinMethod: "signinRedirect" }`.
 *       Possible values for `signinMethod` are:
 *        - `"signinRedirect"`: Redirects the user to the sign-in page (default).
 *        - `"signinPopup"`: Signs in the user through a popup.
 *
 * @returns The current status of the authentication process.
 */
export declare const useAutoSignin: ({ signinMethod }?: UseAutoSignInProps) => UseAutoSignInReturn;

declare type UseAutoSignInProps = {
    signinMethod?: keyof Pick<AuthContextProps, "signinRedirect" | "signinPopup">;
};

declare type UseAutoSignInReturn = Pick<AuthState, "isAuthenticated" | "isLoading" | "error">;

/**
 * A public higher-order component to access the imperative API
 * @public
 */
export declare function withAuth<P>(Component: React_2.ComponentType<P>): React_2.ComponentType<Omit<P, keyof AuthContextProps>>;

/**
 * A public higher-order component to protect accessing not public content. When you wrap your components in this higher-order
 * component and an anonymous user visits your component, they will be redirected to the login page; after logging in, they
 * will return to the page from which they were redirected.
 *
 * @public
 */
export declare const withAuthenticationRequired: <P extends object>(Component: React_2.ComponentType<P>, options?: WithAuthenticationRequiredProps) => React_2.FC<P>;

/**
 * @public
 */
export declare interface WithAuthenticationRequiredProps {
    /**
     * Show a message when redirected to the signin page.
     */
    OnRedirecting?: () => React_2.JSX.Element;
    /**
     * Allows executing logic before the user is redirected to the signin page.
     */
    onBeforeSignin?: () => Promise<void> | void;
    /**
     * Pass additional signin redirect arguments.
     */
    signinRedirectArgs?: SigninRedirectArgs;
}

export { }
