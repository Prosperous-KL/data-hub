const app = require("./app");
const env = require("./config/env");

app.listen(env.PORT, () => {
  console.log(`Prosperous Data Hub API running on port ${env.PORT}`);
});
