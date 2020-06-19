// Add log/warn/error loggers
const logWithType = type => (...messages) => {
  if (process.env.NODE_ENV == "development") {
    console[type]("DEBUG Log:", ...messages)
  }
}
const log = {}
for (let type of ["log", "warn", "error"]) {
  log[type] = logWithType(type)
}

export default log
