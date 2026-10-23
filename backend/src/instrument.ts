import "dotenv/config";
import * as Sentry from "@sentry/node";

// match kenyan mobile numbers
const PHONE = /(?:\+?254|0)[17]\d{8}/g;
// replace any phone number in a string with a harmless placeholder
const redact = (text: string) => text.replace(PHONE, "[phone]");

// True only when the server runs with NODE_ENV=production
const isProduction = process.env.NODE_ENV === "production";

// Returns the extra integrations to give Sentry: the profiler if it can load otherwise nothing
function loadProfiler() {
    try {
        // The profiler is a native add-on. We use require inside try/catch so that if it
        // can't load (wrong platform, blocked install script), the API still starts and only profiling is lost.
        const { nodeProfilingIntegration } = require("@sentry/profilng-node");
        return [nodeProfilingIntegration()]; // list with one item: the profiler
    } catch (err) {
        console.warn("Sentry profiling disabled, could not load @sentry/profiling-node", err); // output to terminal
        return []; // no profiler, but the server still starts
    }
}

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development", // filter alerts so laptop errors ndont page
    integrations: loadProfiler(),       // adds the profiler to Sentry's defaults when it loads

    // switch off every category that could hold personal or payment data
    dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        databaseQueryData: false,
        stackFrameVariables: false,
    },

    // profiles are attached to traces, so this setting also controls how much gets profiled.
    // Development: keeping every trace, so first test request shows up immediately
    // Production: sample 1 in 10 traces, so only a small fraction of requests get profiled
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    profileSessionSampleRate: 1.0,

    // profiler runs only while a sampled request is in progress.
    profileLifecycle: "trace",

    // Runs on every error event just before its sent,
    beforeSend(event) {
        if (event.request) {
            delete event.request.data;
            delete event.request.cookies;
            if (event.request.headers) {
                delete event.request.headers["authorization"];
                delete event.request.headers["cookie"];
            }
        }
        if (event.message) event.message = redact(event.message);

        event.exception?.values?.forEach((v) => { if (v.value) v.value = redact(v.value); });
        return event;
    },
});