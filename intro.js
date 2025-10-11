// Intro logic - direct navigation to game page
const introStartBtn = document.getElementById("introStartBtn");

if (introStartBtn) {
  introStartBtn.addEventListener("click", () => {
    console.log("Start button clicked! Navigating to game...");
    // Navigate directly to game page without camera modal
    window.location.href = "./game.html";
  });
} else {
  console.error("Start button not found!");
}



