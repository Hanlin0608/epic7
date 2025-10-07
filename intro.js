// Intro + modal logic, isolated from game code
const introStartBtn = document.getElementById("introStartBtn");
const cameraModal = document.getElementById("cameraModal");
const agreeCameraBtn = document.getElementById("agreeCameraBtn");
const rejectCameraBtn = document.getElementById("rejectCameraBtn");

function openCameraModal() { if (cameraModal) cameraModal.style.display = "flex"; }
function closeCameraModal() { if (cameraModal) cameraModal.style.display = "none"; }

if (introStartBtn) {
  introStartBtn.addEventListener("click", () => {
    openCameraModal();
  });
}

if (agreeCameraBtn) {
  agreeCameraBtn.addEventListener("click", () => {
    closeCameraModal();
    // Navigate to game page; camera will be requested there
    window.location.href = "./index.html";
  });
}

if (rejectCameraBtn) {
  rejectCameraBtn.addEventListener("click", () => {
    closeCameraModal();
    // Stay on intro (homepage)
  });
}



