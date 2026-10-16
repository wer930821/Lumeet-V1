# Lumeet 本機角色模式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Android APK 不需 Vivix Key，只靠 DeepSeek、單張角色圖與 Android 系統 TTS 即可完成虛擬女友語音聊天。

**Architecture:** 保留現有 Vivix 路徑，新增 `local` 角色模式作為平行路徑。Web 層負責模式、對話狀態與角色動畫；Android Capacitor 原生層提供系統 TTS bridge，TTS 失敗時只降級為文字，不中斷 DeepSeek 對話。

**Tech Stack:** HTML/JavaScript、Capacitor 8、Android Java、Android TextToSpeech、CSS/Tailwind、GitHub Actions

**Spec:** `docs/superpowers/specs/2026-10-16-local-avatar-android-tts-design.md`

## Global Constraints

- 不移除或破壞現有 Vivix 模式。
- 本機角色模式不得要求 Vivix 或 ElevenLabs API Key。
- DeepSeek 維持 OpenAI-compatible API；建議 Base URL `https://api.deepseek.com`、Model `deepseek-chat`。
- 角色圖使用手機選擇的單張圖片。
- 第一版只有 `idle`、`thinking`、`speaking` 三種視覺狀態，不做嘴型同步、Live2D、3D 或生成影片。
- Android 系統 TTS 失敗時必須保留文字回答且 App 不崩潰。
- Web 環境沒有 Android TTS bridge 時必須安全降級。
- 最終必須通過 `npm run android:apk` 與 GitHub Actions APK workflow。

## Review Focus

- 舊使用者已有 Vivix 設定：升級後資料不可遺失，且仍可切回 Vivix。
- `local` 模式完全沒有 Vivix Key：儲存與進入聊天不得被既有驗證擋住。
- Android TTS 初始化失敗／語言不可用：文字回答仍顯示並回到 `idle`。
- 連續兩則 AI 回答：新朗讀開始前必須停止上一則，不能重疊播放。
- 角色圖片不存在或本機資料失效：UI 顯示可理解的提示，不可 JS crash。

---

### Task 1: 角色模式與設定相容層

**Files:**
- Modify: `index.html`
- Modify: `video.js`
- Test: 以既有 Node/瀏覽器可執行邏輯檢查與 build 驗證；若目前無測試框架，新增最小純 JS 測試檔 `tests/local-avatar-config.test.mjs`

**Interfaces:**
- Produces: `avatarMode` 設定值，合法值為 `local | vivix`；讀取舊設定時採不破壞 Vivix 的安全預設。
- Produces: `isLocalAvatarMode()`，供驗證、通話與 UI 分支使用。

- [ ] **Step 1: 寫失敗測試**：驗證 `local` 模式不要求 Vivix Key、舊設定仍可解析、未知模式安全回退。
- [ ] **Step 2: 執行測試並確認 FAIL**：`node --test tests/local-avatar-config.test.mjs`。
- [ ] **Step 3: 實作最小設定相容層**：在現有設定模型中加入 `avatarMode`，不重構無關程式。
- [ ] **Step 4: 執行測試確認 PASS**。
- [ ] **Step 5: Commit**：`feat: add local avatar mode setting`。

### Task 2: 設定頁本機角色 UI 與驗證

**Files:**
- Modify: `index.html`
- Modify: `video.js`
- Modify: `styles/tailwind.src.css`（僅在現有樣式無法表達時）
- Test: `tests/local-avatar-config.test.mjs`

**Interfaces:**
- Consumes: `avatarMode`, `isLocalAvatarMode()`。
- Produces: 模式切換 UI；`local` 時隱藏 Vivix 專屬欄位，保留 AI、角色、圖片、STT 設定。

- [ ] **Step 1: 擴充失敗測試**：`local` 儲存驗證不讀 Vivix Key；`vivix` 維持原驗證；圖片缺失得到可理解提示。
- [ ] **Step 2: 執行測試確認 FAIL**。
- [ ] **Step 3: 加入「本機角色／Vivix 角色」選擇與條件顯示**，本機角色模式完全跳過 Vivix 必填驗證。
- [ ] **Step 4: 執行測試與 `npm run build:web` 確認 PASS**。
- [ ] **Step 5: Commit**：`feat: add local avatar settings UI`。

### Task 3: 本機角色通話畫面與狀態機

**Files:**
- Modify: `video.js`
- Modify: `index.html`
- Modify: `styles/tailwind.src.css`
- Test: `tests/local-avatar-state.test.mjs`

**Interfaces:**
- Consumes: `avatarMode`、角色圖片、現有 AI 回覆流程。
- Produces: `setLocalAvatarState(state)`，`state` 僅接受 `idle | thinking | speaking`。

- [ ] **Step 1: 寫失敗測試**：合法狀態可切換；未知狀態回退 `idle`；缺圖不拋例外。
- [ ] **Step 2: 執行測試確認 FAIL**。
- [ ] **Step 3: 實作本機角色 renderer 與三態狀態機**：滿版單圖、idle 呼吸、thinking 低干擾提示、speaking 輕微縮放／位移。
- [ ] **Step 4: 執行測試與 `npm run build:web` 確認 PASS**。
- [ ] **Step 5: Commit**：`feat: add animated local avatar view`。

### Task 4: Android 系統 TTS Capacitor Bridge

**Files:**
- Create: `android/app/src/main/java/com/xiaoxianggu/videocall/LocalTtsPlugin.java`
- Modify: `android/app/src/main/java/com/xiaoxianggu/videocall/MainActivity.java`
- Create: `local-tts.js`
- Test: Android Gradle compile + JS bridge fallback tests

**Interfaces:**
- Produces JS API: `LocalTts.speak({ text }) -> Promise`、`LocalTts.stop() -> Promise`。
- Produces events: `speechStart`, `speechDone`, `speechError`。
- Android implementation uses `android.speech.tts.TextToSpeech` and flushes previous speech before a new utterance.

- [ ] **Step 1: 寫失敗的 JS fallback 測試**：無 Capacitor 原生 plugin 時 `speak()` 不 crash，回傳可處理的 unavailable 結果。
- [ ] **Step 2: 執行測試確認 FAIL**。
- [ ] **Step 3: 實作 `LocalTtsPlugin`**：初始化 TextToSpeech、`QUEUE_FLUSH` 朗讀、stop、UtteranceProgressListener 事件與 destroy 清理。
- [ ] **Step 4: 註冊 plugin 並實作 `local-tts.js` wrapper**，避免 Web 環境呼叫原生 API 造成例外。
- [ ] **Step 5: 執行 `node --test` 與 `cd android && ./gradlew assembleDebug`，確認 compile/PASS**。
- [ ] **Step 6: Commit**：`feat: add Android system TTS bridge`。

### Task 5: 串接 DeepSeek 回覆、TTS 與角色動畫

**Files:**
- Modify: `video.js`
- Modify: `local-tts.js`
- Test: `tests/local-avatar-flow.test.mjs`

**Interfaces:**
- Consumes: `setLocalAvatarState(state)`、`LocalTts.speak()`、`LocalTts.stop()`、現有 OpenAI-compatible AI 回覆流程。
- Produces: 本機角色完整回覆流程：`thinking -> speaking -> idle`；TTS error 為 `thinking -> idle` 且文字保留。

- [ ] **Step 1: 寫失敗測試**：AI 請求開始進 `thinking`；文字回覆先顯示；TTS start 進 `speaking`；done/error 回 `idle`；連續回答會 stop 舊朗讀。
- [ ] **Step 2: 執行測試確認 FAIL**。
- [ ] **Step 3: 在現有 AI 回覆完成點接入 LocalTts**，只在 `local` 模式啟用；Vivix 分支保持原樣。
- [ ] **Step 4: 執行所有 Node 測試與 `npm run build:web` 確認 PASS**。
- [ ] **Step 5: Commit**：`feat: connect local avatar AI and TTS flow`。

### Task 6: 相容性、APK 與 CI 驗收

**Files:**
- Modify: 僅修正驗收中實際發現的相關檔案
- Verify: `.github/workflows/android-apk.yml`

**Interfaces:**
- Consumes: Tasks 1–5 全部介面。
- Produces: 可安裝 debug APK；Vivix 與 local 兩種模式均不互相破壞。

- [ ] **Step 1: 執行完整測試**：`node --test tests/*.test.mjs`，Expected: 全部 PASS。
- [ ] **Step 2: 執行 Web build**：`npm run build:web`，Expected: exit 0。
- [ ] **Step 3: 執行 Android build**：`npm run android:apk`，Expected: 產生 `android/app/build/outputs/apk/debug/app-debug.apk`。
- [ ] **Step 4: 檢查舊 Vivix 設定、無 Vivix local 設定、缺圖、TTS unavailable、連續回答五類 Review Focus 行為。
- [ ] **Step 5: 推送實作分支並確認 GitHub Actions `Build Android APK` 新 run 成功，確認 `Lumeet-Android-debug` artifact 存在且未過期。
- [ ] **Step 6: 最終 Commit（若驗收有必要修正）**：`fix: complete local avatar Android validation`。

## 完成定義

只有在 Task 6 的本機測試／build 與新的 GitHub Actions run 都有成功證據後，才可宣告完成。不得以舊的成功 workflow run 代替本次功能修改後的驗證。
