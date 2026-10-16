export function normalizeAvatarMode(value, hasVivixConfig = false) {
  if (value === 'local' || value === 'vivix') return value;
  return hasVivixConfig ? 'vivix' : 'local';
}
export function isLocalAvatarMode(settings = {}) {
  return normalizeAvatarMode(settings.avatarMode, !!settings.vivixKey) === 'local';
}
export function localMissing(settings = {}) {
  const missing = [];
  if (settings.aiMode === 'mcp') {
    if (!settings.relayUrl) missing.push('橋接網址');
    if (!settings.relaySecret) missing.push('橋接密碼');
  } else {
    if (!settings.llmBase) missing.push('模型 Base URL');
    if (!settings.llmKey) missing.push('模型 API Key');
    if (!settings.llmModel) missing.push('模型名稱');
  }
  if (!settings.charImg && !settings.localCharImg) missing.push('角色圖片');
  return missing;
}
export function normalizeAvatarState(state) {
  return ['idle', 'thinking', 'speaking'].includes(state) ? state : 'idle';
}
