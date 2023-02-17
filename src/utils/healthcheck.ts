import { getApiVersion } from '../lib/Api';

getApiVersion()
  .then((x) => {
    console.log(`Healthcheck OK: ${x.data.version}`, x);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
