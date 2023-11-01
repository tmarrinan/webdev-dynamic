let previousBtn = document.getElementById("previous");
let nextBtn = document.getElementById("next");

let empowermentKeys = {
  0: "Low",
  1: "Lower-middle",
  2: "Upper-middle",
  3: "High",
};

let position = 0;

function updateData(position) {
  let path = "/weg/" + empowermentKeys[position];
  document.location.replace(path);
}

previousBtn.addEventListener("click", () => {
  if (position >= 0) {
    position--;
    updateData(position);
  }
  console.log("previous!");
});

nextBtn.addEventListener("click", () => {
  if (position < 4) {
    position++;
    updateData(position);
  }
  console.log(position);
});
