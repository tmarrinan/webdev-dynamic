let previousBtn = document.getElementById("previous");
let nextBtn = document.getElementById("next");

let empowermentKeys = [
  "Sub-Saharan%20Africa",
  "Australia%20and%20New%20Zealand",
  "Europe%20and%20Northern%20America",
  "Northern%20Africa%20and%20Western%20Asia",
  "Latin%20America%20and%20the%20Caribbean",
  "Eastern%20Asia%20and%20South-Eastern%20Asia",
];

function presentIndex(currentState) {
  return empowermentKeys.findIndex((key) => key === currentState);
}

function updateData(index) {
  if (index >= 0 && index < empowermentKeys.length) {
    const newEmpowermentKey = empowermentKeys[index];
    window.location.href = `/region/${newEmpowermentKey}`;
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
    console.log(liveIndex);
  }
  // console.log("previous!");
  // console.log(parameters);
  // console.log(liveKey);
  // console.log(liveIndex);
});

nextBtn.addEventListener("click", () => {
  if (liveIndex < 6) {
    liveIndex++;
    updateLive();
    console.log(liveIndex);
  }
  // console.log(position);
});
