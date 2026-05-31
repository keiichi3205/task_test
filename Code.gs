/**
 * SalesCoach — B2B Sales Feedback Tool
 * Google Apps Script entry point.
 *
 * ─── Basic deployment ───────────────────────────────────────────
 *   1. script.google.com → New project
 *   2. Paste this file as Code.gs
 *   3. Add an HTML file named "index" with index.html contents
 *   4. Project Settings → "Show appsscript.json" → paste appsscript.json
 *   5. Deploy → New deployment → Web app
 *      • Execute as:  User accessing the web app
 *      • Who has access:  Anyone with Google account (or as appropriate)
 *
 * ─── Enabling Google Drive Picker ───────────────────────────────
 *   1. Project Settings → Google Cloud Platform (GCP) Project
 *      → Note the "Project number" (numeric).  ← CLOUD_PROJECT_NUMBER
 *
 *   2. https://console.cloud.google.com → select the same GCP project
 *      a. APIs & Services → Library → enable "Google Picker API"
 *      b. APIs & Services → Credentials → Create credentials → API key
 *         Restrict to: HTTP referrers
 *         Allowed referrers:  https://script.google.com/*
 *                             https://*.googleusercontent.com/*
 *         API restrictions:  Google Picker API only
 *         ← PICKER_API_KEY
 *
 *   3. In the Apps Script editor, open setDriveConfig() below,
 *      paste your two values, run it once, then delete the values.
 *      Values are stored in Script Properties (not in source).
 *
 *   4. Re-deploy the web app to pick up new OAuth scopes (re-consent).
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('商談フィードバックツール')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Returns the Picker configuration to the client.
 * Empty strings mean "not configured" — the client then falls back
 * to a setup-instruction alert when the user clicks an upload card.
 */
function getDriveConfig() {
  const props = PropertiesService.getScriptProperties().getProperties();
  return {
    apiKey: props.PICKER_API_KEY || '',
    appId:  props.CLOUD_PROJECT_NUMBER || ''
  };
}

/**
 * Returns an OAuth token for the user accessing the web app,
 * used by Google Picker on the client side.
 * Scopes are defined in appsscript.json (oauthScopes).
 */
function getOAuthToken() {
  return ScriptApp.getOAuthToken();
}

/**
 * Verify access to a picked file and return its metadata.
 * Called after Picker returns a fileId, so the server can confirm
 * it can also read the file (and so the UI can show enriched info).
 */
function getFileMetadata(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return {
      ok: true,
      id:          file.getId(),
      name:        file.getName(),
      mimeType:    file.getMimeType(),
      sizeBytes:   file.getSize(),
      url:         file.getUrl(),
      lastUpdated: file.getLastUpdated().toISOString()
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Read a Drive file's bytes and return them base64-encoded, so the client
 * can render it (e.g. the proposal PDF) without a cross-origin fetch to
 * googleapis.com (which Drive blocks via CORS). Runs as the user accessing
 * the web app; needs the drive.readonly scope (see appsscript.json).
 */
function getFileBase64(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    return {
      ok: true,
      name: file.getName(),
      mimeType: blob.getContentType(),
      base64: Utilities.base64Encode(blob.getBytes())
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Entry point for the analysis pipeline.
 * Production version would:
 *   1. Hand off audio to a STT service (Whisper) via UrlFetchApp
 *   2. Extract slide text (parse pptx / pdf)
 *   3. Call Claude API for slide-transcript alignment + feedback
 *   4. Persist the structured result (Sheet or Drive JSON)
 *   5. Return a result id; the client fetches and renders
 *
 * Current implementation: validates access, returns a stub.
 */
function processSession(payload) {
  if (!payload || !payload.slideFileId || !payload.audioFileId) {
    return { ok: false, error: 'スライドと音声の両方を選択してください。' };
  }
  try {
    const slide = DriveApp.getFileById(payload.slideFileId);
    const audio = DriveApp.getFileById(payload.audioFileId);
    return {
      ok: true,
      status: 'queued',
      message: '分析処理を開始しました（モック）。本番ではWhisper + Claude分析が走ります。',
      slide: { name: slide.getName(), size: slide.getSize(), mimeType: slide.getMimeType() },
      audio: { name: audio.getName(), size: audio.getSize(), mimeType: audio.getMimeType() }
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * One-time setup. Edit the two values, run from the editor (Run menu),
 * then clear them back to empty strings before committing.
 */
function setDriveConfig() {
  const PICKER_API_KEY       = '';  // ← Browser API key, Picker API enabled, referrer-restricted
  const CLOUD_PROJECT_NUMBER = '';  // ← GCP project number (numeric, e.g. "123456789012")

  if (!PICKER_API_KEY || !CLOUD_PROJECT_NUMBER) {
    throw new Error('Fill PICKER_API_KEY and CLOUD_PROJECT_NUMBER in setDriveConfig(), then run again.');
  }
  PropertiesService.getScriptProperties().setProperties({
    PICKER_API_KEY,
    CLOUD_PROJECT_NUMBER
  });
  return 'Drive Picker config saved to Script Properties.';
}
