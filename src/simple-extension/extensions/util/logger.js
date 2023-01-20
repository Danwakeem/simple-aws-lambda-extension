const verbose = !!process.env.VERBOSE;
module.exports = {
  log: (...args) => verbose ? console.log(...args) : null,
  debug: (...args) => verbose ? console.debug(...args) : null,
  error: (...args) => console.error(...args),
  info: (...args) => verbose ? console.info(...args) : null,
  warn: (...args) => console.warn(...args),
}