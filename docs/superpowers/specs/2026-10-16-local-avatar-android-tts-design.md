# Lumeet 本機角色模式（無 Vivix）設計規格

日期：2026-10-16
狀態：已確認設計，待實作計畫

## 目標

讓 Lumeet Android APK 在不提供 Vivix API Key 的情況下，也能作為私人虛擬女友使用。第一版以穩定、低成本為優先：單張角色圖片、DeepSeek 對話、Android 系統 TTS、簡單的待機／說話動畫。

## 範圍

### 本機角色模式

新增角色模式選擇：

- 本機角色（推薦）
- Vivix 角色（保留現有流程）

選擇本機角色時：

- Vivix API Key 不再必填。
- 隱藏 Vivix 專屬設定。
- 使用使用者從手機選擇／上傳的單張角色圖片。
- 保留目前全螢幕視訊通話式介面。
- 待機時提供輕微呼吸／漂浮動畫。
- DeepSeek 產生回答時顯示等待狀態。
- Android TTS 播放時切換為說話動畫。
- TTS 結束後回到待機動畫。

Vivix 模式維持現有行為，避免破壞既有功能，並允許日後切回。

## 對話與語音資料流

本機角色模式的主要資料流：

1. 使用者透過麥克風輸入。
2. 現有語音辨識流程取得文字；第一版不強制更換既有 STT 實作。
3. 文字送至 OpenAI-compatible AI API；預設可使用 DeepSeek。
4. DeepSeek 回傳角色文字回答。
5. 畫面顯示文字回答。
6. Android 系統 TTS 朗讀回答。
7. TTS 播放期間驅動角色說話動畫。
8. 播放完成後恢復待機動畫。

DeepSeek 建議設定：

- Base URL: `https://api.deepseek.com`
- Model: `deepseek-chat`
- API Key: 由使用者在 App 內自行設定並沿用既有安全儲存方式。

## 設定頁

設定頁新增「角色模式」。

### 本機角色

顯示：

- AI Base URL
- AI API Key
- AI Model
- 角色名稱
- 角色自我設定／System Prompt
- 角色圖片（優先手機本機選擇）
- Android 系統 TTS 設定（僅提供第一版真正需要的選項）
- 現有語音辨識相關設定

隱藏：

- Vivix API Key
- Vivix Voice ID
- 其他只對 Vivix 有效的設定

### Vivix 角色

維持目前設定與驗證方式。

## Android 系統 TTS

本機角色模式不依賴 Vivix 或 ElevenLabs 產生女友語音，改由 Android 裝置上的系統 TTS 引擎朗讀。

要求：

- TTS 不可阻塞 DeepSeek 文字回答。
- TTS 初始化或朗讀失敗時，文字聊天仍可正常使用。
- 開始朗讀時通知 UI 進入 speaking 狀態。
- 朗讀完成或取消時通知 UI 回到 idle 狀態。
- 切換新回答時應避免舊回答與新回答同時朗讀。

## 角色視覺狀態

第一版只定義三個必要狀態：

- `idle`：角色圖片輕微呼吸／漂浮。
- `thinking`：等待 AI 回覆，使用低干擾的視覺提示。
- `speaking`：TTS 播放中，圖片以輕微縮放／位移等方式呈現正在說話。

動畫不做真正嘴型同步，也不引入新的 Avatar API。

## 錯誤處理與降級

- 沒有 Vivix Key：本機角色模式正常啟動，不顯示 Vivix 缺 Key 錯誤。
- DeepSeek 未設定或請求失敗：顯示明確 AI 連線錯誤，停止 thinking 狀態。
- TTS 不可用：顯示文字回答，結束 speaking 狀態，不讓整個對話失敗。
- 角色圖片缺失：設定頁提示使用者選擇圖片；不可因圖片缺失造成 JS 崩潰。
- Vivix 模式：沿用原本錯誤分類與驗證。

## 相容性與遷移

- 不移除現有 Vivix 程式碼。
- 舊設定仍可讀取。
- 新增角色模式設定時提供安全預設值；現有使用者不可因升級而遺失既有設定。
- Web 端若無法使用 Android 原生 TTS bridge，需安全降級；本次主要驗收目標為 Android APK。

## 不在第一版範圍

- 真實嘴型同步。
- Live2D／3D 模型。
- 即時生成角色影片。
- 新的付費 Avatar API。
- 雲端 TTS 強制依賴。
- 移除 Vivix。

## 驗收標準

Android APK 安裝後，在「本機角色」模式：

1. 不填任何 Vivix API Key 仍可儲存設定並開始聊天。
2. 填入可用的 DeepSeek API 設定後可取得文字回答。
3. 可從手機選擇角色圖片並在通話畫面顯示。
4. 待機時角色具有輕微動畫。
5. DeepSeek 等待期間進入 thinking 狀態。
6. 回答由 Android 系統 TTS 朗讀。
7. TTS 播放時角色進入 speaking 動畫，結束後恢復 idle。
8. TTS 失敗時仍保留文字回答，App 不崩潰。
9. 切回 Vivix 模式後既有 Vivix 流程仍可使用。
10. `npm run android:apk` 與 GitHub Actions Android APK workflow 均可成功建置。
