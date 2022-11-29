export function annotationsScore(annotations) {
  let score = 0
  for (let { bodyValue } of (annotations || []).filter(annotation => annotation.motivation == "assessing")) {
    score += parseInt(bodyValue) || 0
  }
  let sign = score > 0 ? "+" : (score < 0 ? "-" : "±")
  score = Math.abs(score)
  return { score, sign }
}

export function annotationButtonColor(annotations) {
  // A score of +3 or -3 means it will have 100% transparency.
  let maxIntensity = 3
  let { score, sign } = annotationsScore(annotations)
  let delta = Math.min(score / maxIntensity, 1) * 150
  let r = 85, g = 85, b = 85
  if (sign == "-") {
    r += delta
    g -= 50
    b -= 50
  } else if (sign == "+") {
    g += delta
    r -= 50
    b -= 50
  }
  let color = `rgb(${r}, ${g}, ${b})`
  return color
}
