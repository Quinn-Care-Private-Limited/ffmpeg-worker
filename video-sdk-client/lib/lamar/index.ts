import { Asset } from "../asset";
import { LamarRequest } from "../request";
import Tag from "../tag";
import TagKey from "../tag-key";
type Input = { id: string };
export class Lamar extends LamarRequest {
  public asset: Asset;
  public tagKey: TagKey;
  public tag: Tag;
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.asset = new Asset({ apiKey });
    this.tagKey = new TagKey({ apiKey });
    this.tag = new Tag({ apiKey });
  }
}
