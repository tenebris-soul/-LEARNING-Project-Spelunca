import { Assets, Texture } from "pixi.js";

export class TextureLoader {
  async loadTextures(): Promise<void> {
    const textures = import.meta.glob(
      [
        "/src/data/textures/*.jpg",
        "/src/data/textures/*.jpeg",
        "/src/data/textures/*.png",
      ],
      {
        eager: true,
        query: "?url",
        import: "default",
      },
    ) as Record<string, string>;

    const aliases: string[] = [];

    for (const [path, url] of Object.entries(textures)) {
      const fileName = path
        .split("/")
        .pop()
        ?.replace(/\.(png|jpe?g)$/i, "");

      if (!fileName) continue;

      Assets.add({ alias: fileName, src: url });
      aliases.push(fileName);
    }

    await Assets.load(aliases);
  }

  getTexture(textureName: string): Texture {
    const texture = Assets.get(textureName);
    return texture;
  }
}
