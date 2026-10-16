package com.xiaoxianggu.videocall;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.UUID;

@CapacitorPlugin(name = "LocalTts")
public class LocalTtsPlugin extends Plugin implements TextToSpeech.OnInitListener {
    private TextToSpeech tts;
    private boolean ready = false;
    private PluginCall pendingCall;

    @Override public void load() { tts = new TextToSpeech(getContext(), this); }
    @Override public void onInit(int status) {
        ready = status == TextToSpeech.SUCCESS;
        if (!ready) return;
        int result = tts.setLanguage(Locale.TAIWAN);
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(Locale.getDefault());
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) { finishPending(null); }
            @Override public void onError(String id) { finishPending("Android 系統語音播放失敗"); }
        });
    }
    @PluginMethod public void speak(PluginCall call) {
        String text = call.getString("text", "").trim();
        if (text.isEmpty()) { call.reject("沒有可朗讀的文字"); return; }
        if (!ready || tts == null) { call.reject("Android 系統語音尚未就緒"); return; }
        if (pendingCall != null) { pendingCall.reject("已被新的朗讀取代"); pendingCall = null; }
        tts.stop(); pendingCall = call; call.setKeepAlive(true);
        if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, UUID.randomUUID().toString()) == TextToSpeech.ERROR) finishPending("Android 系統語音無法開始播放");
    }
    @PluginMethod public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        if (pendingCall != null) { pendingCall.reject("朗讀已停止"); pendingCall = null; }
        call.resolve(new JSObject().put("stopped", true));
    }
    private synchronized void finishPending(String error) {
        PluginCall call = pendingCall; pendingCall = null; if (call == null) return;
        call.setKeepAlive(false); if (error == null) call.resolve(new JSObject().put("done", true)); else call.reject(error);
    }
    @Override protected void handleOnDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
        pendingCall = null; super.handleOnDestroy();
    }
}
