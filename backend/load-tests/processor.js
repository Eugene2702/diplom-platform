/**
 * Artillery processor: injects env vars from load-tests/.env into each
 * virtual user as Artillery `vars`. We can't just put $env.LOAD_TOKEN in
 * the YAML because Artillery resolves env at config-parse time and the
 * .env file may be generated AFTER artillery has already started reading
 * the config — so we expose them via a beforeRequest hook instead.
 */
require('dotenv').config({ path: __dirname + '/.env' });

module.exports = {
  injectVars,
};

function injectVars(requestParams, context, ee, next) {
  if (!context.vars.token) {
    context.vars.token = process.env.LOAD_TOKEN;
    context.vars.projectId = process.env.LOAD_PROJECT_ID;
    context.vars.email = process.env.LOAD_EMAIL;
    context.vars.password = process.env.LOAD_PASSWORD;
  }
  return next();
}
