from flask import Flask, request, jsonify, Response
import os, tempfile
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from openai import OpenAI
from flask_cors import CORS
from dotenv import load_dotenv
import traceback

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})


client = OpenAI(api_key=OPENAI_API_KEY)

### RAG
chat = ChatOpenAI(
    api_key=OPENAI_API_KEY,model="gpt-4o-mini"
)
prompt = ChatPromptTemplate.from_messages([
    ('system',
    "You are the question answering assisstant."
    ),
    ('human',"{input}")
])
chain = prompt | chat

@app.route("/transcribe", methods=["POST"])
def transcribe():
    ### speech to text
    if "audio" not in request.files:
        return jsonify({"error": "No audio file"}), 400

    audio_file = request.files["audio"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name
        print("Saved file:", tmp_path, "size:", os.path.getsize(tmp_path))

    try:
        with open(tmp_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f
            )
        text = transcript.text
        # print(text)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        os.remove(tmp_path)

    ### making the RAG
    response = chain.invoke({ "input" : text })
    print(f"👍 {response.content}")

    ### text to speech
    with client.audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice="alloy",
        response_format="mp3",
        input=response.content 
    ) as response:
        response.stream_to_file("audio/audio.mp3")

    with open("audio/audio.mp3", "rb") as f:
        audio_bytes = f.read()

    return Response(response=audio_bytes, content_type="audio/mpeg")

    # return jsonify({"text": text})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
