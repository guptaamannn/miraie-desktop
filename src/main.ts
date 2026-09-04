import { invoke } from '@tauri-apps/api/core';

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  isPoweredOn: false,
  temperature: 24,
  hvacMode: 'cool',
  fanMode: 'auto',
  presetMode: 'none',
  vSwing: 0,
  hSwing: 0,
  displayOn: true,
  convertiMode: 0,
};

let mobile = '';
let password = '';
let isBusy = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setStatus(msg: string, type: 'info' | 'error' | 'success' = 'info') {
  const el = document.querySelector<HTMLDivElement>('#status')!;
  el.textContent = msg;
  el.className = 'status-bar ' + (type === 'info' ? '' : type);
}

function setActivePill(groupId: string, value: string) {
  document.querySelectorAll(`#${groupId} .mode-pill, #${groupId} .swing-pill`).forEach(el => {
    el.classList.toggle('active', (el as HTMLElement).dataset.value === value);
  });
}

function setAllControlsDisabled(disabled: boolean) {
  const controls = document.querySelectorAll<HTMLButtonElement>(
    '.mode-pill, .swing-pill, #temp-up, #temp-down, #display-toggle'
  );
  controls.forEach(el => (el.disabled = disabled));
}

async function send(command: string, value?: string, label?: string) {
  if (!mobile || !password) {
    setStatus('Open Settings to configure credentials', 'error');
    return false;
  }
  if (isBusy) {
    setStatus('Please wait…', 'info');
    return false;
  }

  isBusy = true;
  setAllControlsDisabled(true);
  setStatus('Sending…', 'info');

  try {
    await invoke<string>('control_ac', {
      mobile,
      password,
      command,
      value: value ?? null,
    });
    setStatus(label ? `${label} ✓` : 'Done ✓', 'success');
    // Clear status after 2 seconds
    setTimeout(() => setStatus(''), 2000);
    return true;
  } catch (err) {
    setStatus(String(err), 'error');
    return false;
  } finally {
    isBusy = false;
    setAllControlsDisabled(!state.isPoweredOn);
    // Always keep power button enabled
    const powerBtn = document.querySelector<HTMLButtonElement>('#power-btn');
    if (powerBtn) powerBtn.disabled = false;
  }
}

// ─── DOM Ready ───────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Load credentials
  mobile   = localStorage.getItem('miraie_mobile')   ?? '';
  password = localStorage.getItem('miraie_password') ?? '';

  const mobileInput   = document.querySelector<HTMLInputElement>('#mobile-input')!;
  const passwordInput = document.querySelector<HTMLInputElement>('#password-input')!;
  if (mobileInput)   mobileInput.value   = mobile;
  if (passwordInput) passwordInput.value = password;

  // ── Navigation ───────────────────────────────────────────
  const mainView     = document.querySelector('#main-view')!;
  const settingsView = document.querySelector('#settings-view')!;

  document.querySelector('#settings-btn')?.addEventListener('click', () => {
    mainView.classList.add('hidden');
    settingsView.classList.remove('hidden');
  });

  document.querySelector('#back-btn')?.addEventListener('click', () => {
    settingsView.classList.add('hidden');
    mainView.classList.remove('hidden');
  });

  document.querySelector('#save-settings-btn')?.addEventListener('click', () => {
    mobile   = mobileInput.value.trim();
    password = passwordInput.value;
    localStorage.setItem('miraie_mobile',   mobile);
    localStorage.setItem('miraie_password', password);
    settingsView.classList.add('hidden');
    mainView.classList.remove('hidden');
    setStatus('Credentials saved ✓', 'success');
  });

  // ── Power Button ─────────────────────────────────────────
  const powerBtn = document.querySelector<HTMLButtonElement>('#power-btn')!;

  powerBtn.addEventListener('click', async () => {
    const cmd = state.isPoweredOn ? 'off' : 'on';
    const ok  = await send(cmd, undefined, `Power ${cmd === 'on' ? 'On' : 'Off'}`);
    if (ok) {
      state.isPoweredOn = !state.isPoweredOn;
      powerBtn.classList.toggle('active', state.isPoweredOn);
      setAllControlsDisabled(!state.isPoweredOn);
      powerBtn.disabled = false;
    }
  });

  // ── Temperature ──────────────────────────────────────────
  const tempValue = document.querySelector<HTMLSpanElement>('#temp-value')!;

  function renderTemp() {
    tempValue.textContent = String(state.temperature);
  }

  document.querySelector('#temp-up')?.addEventListener('click', async () => {
    if (state.temperature >= 30) return;
    state.temperature++;
    renderTemp();
    await send('set_temperature', String(state.temperature), `${state.temperature}°C`);
  });

  document.querySelector('#temp-down')?.addEventListener('click', async () => {
    if (state.temperature <= 16) return;
    state.temperature--;
    renderTemp();
    await send('set_temperature', String(state.temperature), `${state.temperature}°C`);
  });

  // ── HVAC Mode ────────────────────────────────────────────
  document.querySelectorAll('#hvac-mode-pills .mode-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = (btn as HTMLElement).dataset.value!;
      const ok  = await send('set_hvac_mode', val, `Mode: ${val}`);
      if (ok) { state.hvacMode = val; setActivePill('hvac-mode-pills', val); }
    });
  });

  // ── Fan Mode ─────────────────────────────────────────────
  document.querySelectorAll('#fan-mode-pills .mode-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = (btn as HTMLElement).dataset.value!;
      const ok  = await send('set_fan_mode', val, `Fan: ${val}`);
      if (ok) { state.fanMode = val; setActivePill('fan-mode-pills', val); }
    });
  });

  // ── Preset Mode ──────────────────────────────────────────
  document.querySelectorAll('#preset-mode-pills .mode-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = (btn as HTMLElement).dataset.value!;
      const ok  = await send('set_preset_mode', val, `Preset: ${val}`);
      if (ok) { state.presetMode = val; setActivePill('preset-mode-pills', val); }
    });
  });

  // ── Vertical Swing ───────────────────────────────────────
  document.querySelectorAll('#v-swing-pills .swing-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = (btn as HTMLElement).dataset.value!;
      const ok  = await send('set_v_swing', val, `V-Swing: ${val === '0' ? 'Auto' : val}`);
      if (ok) { state.vSwing = parseInt(val); setActivePill('v-swing-pills', val); }
    });
  });

  // ── Horizontal Swing ─────────────────────────────────────
  document.querySelectorAll('#h-swing-pills .swing-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = (btn as HTMLElement).dataset.value!;
      const ok  = await send('set_h_swing', val, `H-Swing: ${val === '0' ? 'Auto' : val}`);
      if (ok) { state.hSwing = parseInt(val); setActivePill('h-swing-pills', val); }
    });
  });

  // ── Converti Mode ────────────────────────────────────────
  const convertiLabels: Record<string, string> = {
    '0': 'Off', '40': '40%', '55': '55%', '70': '70%',
    '80': '80%', '90': '90%', '100': 'FC', '110': 'HC',
  };
  document.querySelectorAll('#converti-mode-pills .mode-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = (btn as HTMLElement).dataset.value!;
      const ok  = await send('set_converti', val, `Converti: ${convertiLabels[val] ?? val}`);
      if (ok) { state.convertiMode = parseInt(val); setActivePill('converti-mode-pills', val); }
    });
  });

  // ── Display Toggle ───────────────────────────────────────
  const displayToggle = document.querySelector<HTMLInputElement>('#display-toggle')!;
  displayToggle.checked = state.displayOn;

  displayToggle.addEventListener('change', async () => {
    const val = displayToggle.checked ? 'on' : 'off';
    const ok  = await send('set_display', val, `Display ${val}`);
    if (ok) {
      state.displayOn = displayToggle.checked;
    } else {
      // Revert toggle on failure
      displayToggle.checked = state.displayOn;
    }
  });

  // ── Initial UI state ─────────────────────────────────────
  renderTemp();
  setActivePill('hvac-mode-pills',    state.hvacMode);
  setActivePill('fan-mode-pills',     state.fanMode);
  setActivePill('preset-mode-pills',  state.presetMode);
  setActivePill('v-swing-pills',      String(state.vSwing));
  setActivePill('h-swing-pills',      String(state.hSwing));
  setActivePill('converti-mode-pills', String(state.convertiMode));

  // Start with controls disabled until power is on
  setAllControlsDisabled(true);
  powerBtn.disabled = false;

  if (!mobile || !password) {
    setStatus('Open Settings to configure credentials', 'info');
  }
});
