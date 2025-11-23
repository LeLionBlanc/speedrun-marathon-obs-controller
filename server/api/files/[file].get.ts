import { readFile } from 'fs/promises';

const path = `C:\\Users\\matte\\Desktop\\CST 2024\\Overlay\\txt\\`

export default defineEventHandler(async (event) => {
  const filename  = getRouterParam(event, 'file')
  try {
    const filePath = `${path}${filename}.txt`;
    console.log(filePath)
    const content = await readFile(filePath, 'utf-8');
    console.log(content)
    return { content };
  } catch (error) {
    throw createError({
      statusCode: 404,
      message: `File ${filename} not found.`,
    });
  }
});
