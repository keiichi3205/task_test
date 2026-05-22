/**
 * SalesCoach - B2B Sales Feedback Tool
 * Google Apps Script entry point.
 *
 * Deployment:
 *   1. Open script.google.com → New project
 *   2. Paste this file as Code.gs
 *   3. Add an HTML file named "index" and paste index.html contents
 *   4. Deploy → New deployment → Web app
 *      - Execute as: Me
 *      - Who has access: Anyone in <domain> (or as appropriate)
 *   5. Open the deployment URL
 *
 * Recommended next step for production:
 *   - Add doPost() handlers for file upload (slides .pptx, audio .mp3)
 *   - Store uploads in Drive via DriveApp
 *   - Call external STT (Whisper) and LLM (Claude) APIs from server-side functions
 *   - Persist analysis results in a Sheet or Firestore
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SalesCoach | 商談分析ツール')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Stub for future audio + slides upload handler.
 * Frontend would call: google.script.run.processSession(payload)
 */
function processSession(payload) {
  // 1. Save slides + audio to Drive
  // 2. Trigger STT (e.g. UrlFetchApp to Whisper API)
  // 3. Extract slide text (parse pptx / pdf)
  // 4. Call Claude API for slide-transcript alignment + feedback
  // 5. Return structured analysis result
  return { status: 'not_implemented' };
}
