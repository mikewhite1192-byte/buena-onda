export const runtime = 'edge';

export async function POST(req: Request) {
  const { message } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const chunks = [
        "Buena Onda AI: ",
        "This is a demo response. ",
        "Your backend will call your chosen model, ",
        "stream tokens, and keep your keys hidden. ",
        "You asked: ",
        String(message || ""),
      ];
      let i = 0;
      const iv = setInterval(() => {
        if (i >= chunks.length) {
          clearInterval(iv);
          controller.close();
        } else {
          controller.enqueue(encoder.encode(chunks[i++]));
        }
      }, 80);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    }
  });
}
