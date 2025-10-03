from flask import Flask, Response
from flask_socketio import SocketIO
from openai import OpenAI
from dotenv import load_dotenv
import tempfile, os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  # WebSocket support

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

@socketio.on("connect")
def on_connect():
    print("✅ Client connected")

@socketio.on("disconnect")
def on_disconnect():
    print("❌ Client disconnected")

@socketio.on("audio_chunk")
def handle_audio_chunk(data):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        # STT
        with open(tmp_path, "rb") as f:
            transcript = client.audio.transcriptions.create(model="whisper-1", file=f)
        text = transcript.text.strip()
        print("🎤 User:", text)

        if not text:
            return

        # GPT
        chat_resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": text}]
        )
        ai_text = chat_resp.choices[0].message.content
        print("🤖 AI:", ai_text)

        # TTS to a unique file
        audio_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        with client.audio.speech.with_streaming_response.create(
            model="gpt-4o-mini-tts",
            voice="alloy",
            input=ai_text,
            response_format="mp3"
        ) as resp:
            resp.stream_to_file(audio_file.name)

        # send the *whole mp3 file* back
        with open(audio_file.name, "rb") as f:
            audio_bytes = f.read()
            # socketio.emit("audio_response", f.read(), broadcast=False)
        os.remove(audio_file.name)

    finally:
        os.remove(tmp_path)
    return Response(response=audio_bytes, content_type="audio/mpeg")


if __name__ == "__main__":
    socketio.run(app, port=5000, debug=True)
