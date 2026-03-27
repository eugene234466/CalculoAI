from flask import Flask, render_template, request, jsonify
import os, base64, json
from groq import Groq
import PyPDF2
import docx
from PIL import Image
from dotenv import load_dotenv
import io

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Groq for everything — text and vision 🔥
groq_client = Groq(api_key=GROQ_API_KEY)

app = Flask(__name__)


class Config:
    UPLOAD_FOLDER = "uploads"
    ALLOWED_EXTENSIONS = {"pdf", "docx", "png", "jpg", "jpeg", "txt"}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


app.config.from_object(Config)

if not os.path.exists(Config.UPLOAD_FOLDER):
    os.makedirs(Config.UPLOAD_FOLDER)


def extract_text_from_pdf(file_path):
    text_output = ""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text_output += page.extract_text() + "\n"
    return text_output


def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)


def image_to_base64(file_path):
    with Image.open(file_path) as img:
        buffered = io.BytesIO()
        img.save(buffered, format=img.format or "PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return img_str


def get_image_mime_type(filename):
    ext = filename.lower().split('.')[-1]
    mime_map = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
    }
    return mime_map.get(ext, 'image/png')


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/solver")
def solver():
    return render_template("solver.html")


@app.route("/graphs")
def graphs():
    return render_template("graphs.html")


@app.route("/formulas")
def formulas():
    return render_template("formulas.html")


@app.route("/quiz")
def quiz():
    return render_template("quiz.html")


@app.route("/plot", methods=["POST"])
def plot():
    """
    Dedicated route for graph plotting.
    Groq returns structured JSON for Plotly + a text explanation.
    """
    try:
        equation = request.form.get("equation", "")
        graph_type = request.form.get("graph_type", "2d")

        if not equation.strip():
            return jsonify(status="error", error="Please enter an equation."), 400

        plot_prompt = f"""You are a math expression parser. The user wants to plot: {equation}. Graph type: {graph_type}.

Return ONLY this JSON object with no extra text, no markdown, no backticks, no explanation outside the JSON:
{{"expression": "x**2 + 2*x + 1", "x_min": -10, "x_max": 10, "title": "y = x^2 + 2x + 1", "explanation": "Brief explanation of the function and its key features."}}

Rules for your response:
- Replace the example values with actual values for: {equation}
- expression must use Python math syntax: ** for powers, * for multiplication, math.sin(), math.cos(), math.tan(), math.log(), math.sqrt(), math.exp()
- x_min and x_max must be numbers only
- Start your response with {{ and end with }}
- Do NOT include any text before {{ or after }}"""

        messages = [
            {
                "role": "system",
                "content": "You are a JSON-only math parser. You respond with nothing but a valid JSON object. No markdown, no backticks, no explanations outside the JSON."
            },
            {
                "role": "user",
                "content": plot_prompt
            }
        ]

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.0,
            max_tokens=300
        )

        raw = response.choices[0].message.content.strip()

        # Aggressive cleaning — strip ALL markdown and surrounding text
        raw = raw.replace("```json", "").replace("```", "").strip()

        # Extract just the JSON object
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start == -1 or end == 0:
            return jsonify(status="error", error="Could not parse the equation. Please try a simpler format like x**2 + 2*x + 1."), 500

        raw = raw[start:end]

        plot_data = json.loads(raw)

        # Validate required fields
        required = ["expression", "x_min", "x_max", "title", "explanation"]
        for field in required:
            if field not in plot_data:
                return jsonify(status="error", error=f"Missing field in response: {field}"), 500

        return jsonify(status="success", plot=plot_data)

    except json.JSONDecodeError as e:
        return jsonify(status="error", error=f"JSON parse error: {str(e)}. Try rephrasing the equation."), 500
    except Exception as e:
        return jsonify(status="error", error=str(e)), 500


@app.route("/ask", methods=["POST"])
def ask():
    try:
        user_input = request.form.get("user_input", "")
        response_type = request.form.get("response_type", "explain")
        uploaded_file = request.files.get("uploaded_file")

        file_content = ""
        is_image = False
        image_mime = "image/png"
        filename = ""

        if uploaded_file and uploaded_file.filename:
            filename = uploaded_file.filename
            file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
            uploaded_file.save(file_path)

            if filename.endswith(".pdf"):
                file_content = extract_text_from_pdf(file_path)
            elif filename.endswith(".docx"):
                file_content = extract_text_from_docx(file_path)
            elif filename.endswith((".png", ".jpg", ".jpeg")):
                file_content = image_to_base64(file_path)
                image_mime = get_image_mime_type(filename)
                is_image = True
            elif filename.endswith(".txt"):
                with open(file_path, 'r', encoding='utf-8') as f:
                    file_content = f.read()

        prompts = {
            "stepbystep": "You are a calculus expert. Solve this step by step, showing all working clearly. Use LaTeX notation wrapped in \\( \\) for inline math and \\[ \\] for display math:",
            "graph": "You are a calculus expert. Extract any equations and describe in detail how to plot them. Use LaTeX notation wrapped in \\( \\) for inline math and \\[ \\] for display math:",
            "summarize": "You are a calculus expert. Summarize the following calculus content clearly and concisely. Use LaTeX notation wrapped in \\( \\) for inline math and \\[ \\] for display math:",
            "quiz": "You are a calculus expert. Generate 30 practice questions based on the following content. Use LaTeX notation wrapped in \\( \\) for inline math and \\[ \\] for display math:",
            "explain": "You are a calculus expert. Explain the concept and theory behind the following thoroughly. Use LaTeX notation wrapped in \\( \\) for inline math and \\[ \\] for display math:",
            "answer": "You are a calculus expert. Give only the final answer, no working needed. Use LaTeX notation wrapped in \\( \\) for inline math and \\[ \\] for display math:"
        }

        prompt_prefix = prompts.get(response_type, prompts["explain"])

        if is_image:
            # ── GROQ vision handles images ──
            text_part = f"{prompt_prefix}\n\n{user_input}" if user_input else prompt_prefix
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": text_part
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{image_mime};base64,{file_content}"
                            }
                        }
                    ]
                }
            ]
            response = groq_client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=messages,
                temperature=0.3,
                max_tokens=2048
            )
            result = response.choices[0].message.content

        else:
            # ── GROQ handles all text ──
            final_prompt = f"{prompt_prefix}\n\n{user_input}\n\n{file_content}"
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are Calculo AI, an expert calculus tutor. "
                        "Always format mathematical expressions using LaTeX notation. "
                        "Use \\( \\) for inline math and \\[ \\] for display math. "
                        "Show all working clearly and step by step."
                    )
                },
                {
                    "role": "user",
                    "content": final_prompt
                }
            ]

            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.3,
                max_tokens=2048
            )
            result = response.choices[0].message.content

        return jsonify(status="success", response=result)

    except Exception as e:
        return jsonify(status="error", error=str(e)), 500


if __name__ == "__main__":
    app.run(debug=True)
