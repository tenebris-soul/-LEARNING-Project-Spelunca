const textureFiles = import.meta.glob(
  "/src/textures/**/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

function makeAlias(path: string): string {
  return path
    .replace("/src/textures/", "")
    .replace(/\.(png|jpg|jpeg|webp)$/i, "");
}

const textureAssets = Object.entries(textureFiles).map(([path, src]) => ({
  alias: makeAlias(path),
  src,
}));

export type CpuTexture = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

const textures = new Map<string, CpuTexture>();

async function loadImageData(src: string): Promise<ImageData> {
  const image = new Image();
  image.src = src;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D context is not available");
  }

  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

export async function loadTextures(): Promise<void> {
  await Promise.all(
    textureAssets.map(async ({ alias, src }) => {
      const imageData = await loadImageData(src);

      textures.set(alias, {
        width: imageData.width,
        height: imageData.height,
        data: imageData.data,
      });
    }),
  );
}

export function getTexture(alias: string): CpuTexture {
  const texture = textures.get(alias);

  if (!texture) {
    throw new Error(`Texture not found: ${alias}`);
  }

  return texture;
}
