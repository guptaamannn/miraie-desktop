import { getCurrentWindow } from '@tauri-apps/api/window';

window.addEventListener("DOMContentLoaded", () => {
  const powerBtn = document.querySelector("#power-btn");
  if (powerBtn) {
    powerBtn.addEventListener("click", () => {
      // Toggle active class or perform an action
      powerBtn.classList.toggle("active");
      
      // Optionally hide the window when clicked
      // getCurrentWindow().hide();
    });
  }
});
