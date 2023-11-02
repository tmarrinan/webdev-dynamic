let previousBtn = document.getElementById("previous");
let nextBtn = document.getElementById("next");

let empowermentKeys = ["Low", "Lower-middle", "Upper-middle", "High"];

function presentIndex(currentState) {
  return empowermentKeys.findIndex((key) => key === currentState);
}

function updateData(index) {
  if (index >= 0 && index < empowermentKeys.length) {
    const newEmpowermentKey = empowermentKeys[index];
    window.location.href = `/ggpg/${newEmpowermentKey}`;
  }
}

const path = window.location.href.toString();
const parameters = path.split("/");
const liveKey = parameters[parameters.length - 1];
let liveIndex = presentIndex(liveKey);

if (liveIndex == empowermentKeys.length - 1) {
  nextBtn.style.visibility = "hidden";
} else if (liveIndex == 0) {
  previousBtn.style.visibility = "hidden";
}

function updateLive() {
  updateData(liveIndex);
}

previousBtn.addEventListener("click", () => {
  if (liveIndex > 0) {
    liveIndex--;
    updateLive();
    // console.log("liveKey");
  }
  // console.log("previous!");
  // console.log(parameters);
  // console.log(liveKey);
  // console.log(liveIndex);
});

nextBtn.addEventListener("click", () => {
  if (liveIndex < 4) {
    liveIndex++;
    updateLive();
    // console.log(liveKey);
  }
  // console.log(position);
});
