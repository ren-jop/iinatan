const { menu, utils, console } = iina;

const NETFLIX_HOME_URL = "https://www.netflix.com/browse";
const NETFLIX_CHROME_PROFILE = "@data/netflix-chrome-profile";

function netflixUrl(value) {
  let url = String(value || "").trim();
  if (!url) return NETFLIX_HOME_URL;
  if (/^(?:www\.)?netflix\.com(?:[/?#]|$)/i.test(url)) {
    url = "https://" + url;
  }
  if (!/^https:\/\/(?:www\.)?netflix\.com(?:[/?#]|$)/i.test(url)) {
    return "";
  }
  return url;
}

function netflixError(label, error) {
  const detail =
    error && error.message ? error.message : String(error || "Unknown error");
  const message = "iinatan Netflix: " + label + ": " + detail;
  try {
    console.error(message);
  } catch (_) {}
  try {
    utils.ask(message);
  } catch (_) {}
}

async function runOpen(args) {
  const result = await utils.exec("/usr/bin/open", args);
  if (!result || Number(result.status) !== 0) {
    const stderr =
      result && result.stderr ? String(result.stderr).trim() : "";
    throw new Error(
      stderr || "macOS could not open the requested application.",
    );
  }
  return true;
}

async function openNetflixChrome(rawUrl) {
  const url = netflixUrl(rawUrl);
  if (!url) throw new Error("Only netflix.com URLs are accepted.");
  const profilePath = utils.resolvePath(NETFLIX_CHROME_PROFILE);
  await runOpen([
    "-na",
    "Google Chrome",
    "--args",
    "--user-data-dir=" + profilePath,
    "--app=" + url,
    "--no-first-run",
    "--no-default-browser-check",
  ]);
}

async function openNetflixSafari(rawUrl) {
  const url = netflixUrl(rawUrl);
  if (!url) throw new Error("Only netflix.com URLs are accepted.");
  await runOpen(["-a", "Safari", url]);
}

function runNetflixAction(label, action) {
  return () => {
    try {
      const result = action();
      if (result && typeof result.then === "function") {
        result.catch((error) => netflixError(label, error));
      }
    } catch (error) {
      netflixError(label, error);
    }
  };
}

menu.addItem(
  menu.item(
    "Netflix — Minimal Window",
    runNetflixAction("Chrome launch failed", () =>
      openNetflixChrome(NETFLIX_HOME_URL),
    ),
  ),
);

menu.addItem(
  menu.item(
    "Netflix — Open URL…",
    runNetflixAction("Netflix URL launch failed", () => {
      const value = utils.prompt("Paste a Netflix URL");
      if (!value) return;
      return openNetflixChrome(value);
    }),
  ),
);

menu.addItem(
  menu.item(
    "Netflix — Safari",
    runNetflixAction("Safari launch failed", () =>
      openNetflixSafari(NETFLIX_HOME_URL),
    ),
  ),
);
