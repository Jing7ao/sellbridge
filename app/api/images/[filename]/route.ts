import { NextRequest, NextResponse } from "next/server";
import { getImageFile } from "../../../../src/store/image";
import { getAuth } from "../../../../src/auth/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const result = getImageFile(params.filename);
  if (!result) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.data), {
    headers: {
      "Content-Type": result.mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
