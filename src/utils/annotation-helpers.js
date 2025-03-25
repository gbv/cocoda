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
  const { sign } = annotationsScore(annotations)
  if (sign == "-") {
    return "var(--color-danger)"
  } else if (sign == "+") {
    return "var(--color-success)"
  } else {
    return "var(--color-text-grey)"
  }
}
