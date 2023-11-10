import express from "express";
import { Directus } from '@directus/sdk';

const config = {
  url: process.env.DIRECTUS_URL || "",
  token: process.env.DIRECTUS_TOKEN || "",
};

const directus = new Directus(config.url);

let authenticated = false;

const getDirectus = async () => {
  if (!authenticated) {
    await directus.auth.static(config.token);
    authenticated = true;
  }
  return directus;
};

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
  deleteAddresses();
});

const deleteAddresses = async () => {
  console.log("🚀 ~ deleteAddresses init");
  const directus = await getDirectus();

  try {
    const limitBatch = 1000;
    let continueWhile = true;
    let count = 1;
    while (continueWhile) {
      const directusNewOrders = (
        await directus.items("addresses").readByQuery({
          fields: ["id"],
          limit: limitBatch,
          filter: {
            mySQLSourceId: {
              _nnull: true,
            },
          },
        })
      ).data;
      console.log("🚀 ~ addresses", directusNewOrders.length);
      await directus
        .items("addresses")
        .deleteMany(directusNewOrders.map((i) => i.id));
      console.log(
        `🚀 ~ deleted addresses ${directusNewOrders.length} count: ${count}`
      );

      if (directusNewOrders.length < limitBatch) {
        continueWhile = false;
      }
      count++;
    }
    console.log("🚀 ~ Done");
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
    } else {
      console.error(err);
    }
  }
};
