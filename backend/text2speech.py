from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from openai import OpenAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from chatbot.chatbot import generate_sign_nize_response
import os
from dotenv import load_dotenv

app = Flask(__name__)

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# chat = ChatOpenAI(
#     api_key=OPENAI_API_KEY,model="gpt-4o-mini"
# )
# prompt = ChatPromptTemplate.from_messages([
#     ('system',
#     "You are the question answering assisstant."
#     ),
#     ('human',"{input}")
# ])
# chain = prompt | chat

@app.route("/tts", methods=["POST"])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        ### making the RAG
        # response = chain.invoke({ "input" : text })
        # print(f"👍 {response.content}")
        try:
            response = generate_sign_nize_response(client, text)
            print(response)
        except:
            print("😡 error")

        # Generate speech and stream it directly
        with client.audio.speech.with_streaming_response.create(
            model="gpt-4o-mini-tts",
            voice="alloy",      # change to other voices if available
            input=response, # replacing response.content
            response_format="mp3"
        ) as response:
            audio_bytes = b"".join(response.iter_bytes())

        return Response(audio_bytes, mimetype="audio/mpeg")

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["GET"])
def home():
    return "✅ OpenAI TTS Flask API running (stream mode)!"


if __name__ == "__main__":
    app.run(debug=True, port=5000)
