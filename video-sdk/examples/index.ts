import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "7b61d080d7139f17e23663cfa57e6f" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    await lamar.clientKey.create({ name: "Test", envId: "clus9cpxf0004a136op54n336" });
    const data = await lamar.clientKey.list();
    await lamar.clientKey.delete({ id: data[0].id, environmentId: data[0].environmentId });
  } catch (err) {
    console.log(`err`, err);
  }
})();
